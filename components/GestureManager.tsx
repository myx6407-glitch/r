
import React, { useEffect, useRef, useState } from 'react';
import { TreeMorphState } from '../types';

interface GestureManagerProps {
  onStateChange: (state: TreeMorphState) => void;
  active: boolean;
  handXRef: React.MutableRefObject<number>;
  isHandActiveRef: React.MutableRefObject<boolean>;
}

declare const Hands: any;
declare const Camera: any;

export const GestureManager: React.FC<GestureManagerProps> = ({ onStateChange, active, handXRef, isHandActiveRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [gestureStatus, setGestureStatus] = useState<'IDLE' | 'OPEN' | 'CLOSED' | 'PEACE' | 'POINT'>('IDLE');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!active) {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      isHandActiveRef.current = false;
      setCameraError(null);
      setIsInitializing(false);
      return;
    }

    setIsInitializing(true);
    setCameraError(null);

    const onResults = (results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        isHandActiveRef.current = true;
        
        // Track hand horizontal center (mirrored for natural interaction)
        handXRef.current = 1.0 - landmarks[0].x;

        // Enhanced finger detection
        const fingerIndices = [
          [8, 5],   // Index finger
          [12, 9],  // Middle finger
          [16, 13], // Ring finger
          [20, 17], // Pinky
          [4, 2]    // Thumb
        ];

        let extendedFingers = 0;
        const fingerStates = fingerIndices.map(([tip, mcp]) => {
          const isExtended = landmarks[tip].y < landmarks[mcp].y;
          if (isExtended) extendedFingers++;
          return isExtended;
        });

        // Enhanced gesture recognition
        const [indexUp, middleUp, ringUp, pinkyUp, thumbUp] = fingerStates;

        // Peace sign (V) - Index and Middle up, others down
        if (indexUp && middleUp && !ringUp && !pinkyUp) {
          setGestureStatus('PEACE');
          // Peace sign could toggle between states
          onStateChange(TreeMorphState.TREE_SHAPE);
        }
        // Pointing gesture - Only index finger up
        else if (indexUp && !middleUp && !ringUp && !pinkyUp) {
          setGestureStatus('POINT');
          onStateChange(TreeMorphState.SCATTERED);
        }
        // Open hand - 4 or 5 fingers up
        else if (extendedFingers >= 4) {
          onStateChange(TreeMorphState.TREE_SHAPE);
          setGestureStatus('OPEN');
        } 
        // Closed fist - 0 or 1 finger up
        else if (extendedFingers <= 1) {
          onStateChange(TreeMorphState.SCATTERED);
          setGestureStatus('CLOSED');
        } else {
          setGestureStatus('IDLE');
        }
      } else {
        isHandActiveRef.current = false;
        setGestureStatus('IDLE');
      }
    };

    const initializeCamera = async () => {
      try {
        // Check if MediaPipe libraries are loaded
        if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
          throw new Error('MediaPipe libraries not loaded');
        }

        handsRef.current = new Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        handsRef.current.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });

        handsRef.current.onResults(onResults);

        if (videoRef.current) {
          // Request camera permission
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: 1280, 
              height: 720,
              facingMode: 'user'
            } 
          });
          
          cameraRef.current = new Camera(videoRef.current, {
            onFrame: async () => {
              if (handsRef.current && videoRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720
          });
          
          await cameraRef.current.start();
          setIsInitializing(false);
        }
      } catch (error) {
        console.error('Camera initialization error:', error);
        setCameraError(error instanceof Error ? error.message : '摄像头初始化失败');
        setIsInitializing(false);
      }
    };

    initializeCamera();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      isHandActiveRef.current = false;
    };
  }, [active, onStateChange, handXRef, isHandActiveRef]);

  if (!active) return null;

  const getGestureDisplay = () => {
    switch (gestureStatus) {
      case 'OPEN': return { text: '聚合 (GATHER)', color: 'text-pink-600 border-pink-500/50' };
      case 'CLOSED': return { text: '散开 (SCATTER)', color: 'text-cyan-600 border-cyan-500/50' };
      case 'PEACE': return { text: '和平 (PEACE)', color: 'text-green-600 border-green-500/50' };
      case 'POINT': return { text: '指向 (POINT)', color: 'text-orange-600 border-orange-500/50' };
      default: return { text: '检测中...', color: 'text-black/40' };
    }
  };

  const gestureDisplay = getGestureDisplay();

  return (
    <div className="fixed top-6 right-6 z-[60] flex flex-col items-end gap-3 animate-in fade-in slide-in-from-right duration-500">
      <div className="relative w-40 h-30 rounded-lg overflow-hidden border border-black/10 shadow-xl bg-white/80 backdrop-blur-md">
        {cameraError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="text-red-500 text-xs font-bold mb-2">摄像头错误</div>
            <div className="text-[10px] text-black/60">{cameraError}</div>
          </div>
        ) : isInitializing ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[10px] font-bold text-black/60 animate-pulse">初始化摄像头...</div>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="w-full h-full object-cover mirror grayscale opacity-80" autoPlay playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`text-[10px] font-bold px-2 py-1 rounded bg-white/90 tracking-widest uppercase transition-all shadow-sm border ${gestureDisplay.color}`}>
                {gestureDisplay.text}
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="text-[9px] text-black/40 tracking-widest uppercase font-semibold text-right space-y-1">
        <p>✋ 张开手掌 → 聚合</p>
        <p>✊ 握拳 → 散开</p>
        <p>✌️ 比V → 聚合</p>
        <p>👉 指向 → 散开</p>
        <p>🤚 左右移动 → 旋转</p>
      </div>
      
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};