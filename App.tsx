
import React, { useState, Suspense, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Scene } from './components/Scene';
import { TreeMorphState } from './types';
import { GestureManager } from './components/GestureManager';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [treeState, setTreeState] = useState<TreeMorphState>(TreeMorphState.TREE_SHAPE);
  const [userImages, setUserImages] = useState<string[]>([]);
  const [photoScale, setPhotoScale] = useState<number>(1.5);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isGestureEnabled, setIsGestureEnabled] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs for high-frequency hand tracking data to avoid re-renders
  const handXRef = useRef<number>(0.5);
  const isHandActiveRef = useRef<boolean>(false);

  const startExperience = () => {
    setIsFading(true);
    // Remove from DOM after the transition duration
    setTimeout(() => {
      setShowSplash(false);
    }, 1200);
  };

  const toggleState = useCallback(() => {
    setTreeState(prev => 
      prev === TreeMorphState.TREE_SHAPE 
        ? TreeMorphState.SCATTERED 
        : TreeMorphState.TREE_SHAPE
    );
  }, []);

  const handleGestureStateChange = useCallback((newState: TreeMorphState) => {
    setTreeState(newState);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newImages.push(e.target.result as string);
          if (newImages.length === files.length) {
            setUserImages(prev => [...prev, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoClick = (url: string) => {
    setViewingImage(url);
  };

  const closeViewer = () => {
    setViewingImage(null);
  };

  const handleDeletePhoto = () => {
    if (viewingImage) {
      setUserImages(prev => prev.filter(img => img !== viewingImage));
      setViewingImage(null);
    }
  };

  const clearAllPhotos = () => {
    if (window.confirm("确定要清空所有记忆吗？Are you sure you want to clear all memories?")) {
        setUserImages([]);
    }
  };

  return (
    <div className="relative w-full h-screen bg-white text-black overflow-hidden font-['Montserrat']">
      
      {/* Opening Animation Overlay (Splash) */}
      {showSplash && (
        <div 
          className={`absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center text-[#d4af37] transition-all duration-[1200ms] ease-in-out pointer-events-auto
            ${isFading ? 'opacity-0 scale-110 blur-xl pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}
        >
          {/* Glowing Golden Sphere */}
          <div className="relative w-44 h-44 mb-16 flex items-center justify-center">
             <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#f9e4a8] to-[#9a7b2c] shadow-[0_0_120px_rgba(212,175,55,0.4)]"></div>
             <div className="absolute top-1 w-2 h-8 bg-white/40 blur-[3px] rounded-full"></div>
             <div className="absolute top-0 w-24 h-12 bg-white/5 blur-[20px] rounded-full"></div>
          </div>
          
          <div className="text-center tracking-[0.6em] mb-4 text-[10px] md:text-xs opacity-50 uppercase font-sans font-semibold">
            凝聚魔法 / GATHERING MAGIC
          </div>
          
          <h2 className="tracking-[0.5em] font-extrabold mb-16 animate-pulse select-none flex flex-col items-center gap-6">
            <span className="text-4xl md:text-5xl">准备就绪</span>
            <span className="text-2xl opacity-40 font-light tracking-[0.8em]">READY</span>
          </h2>

          <button 
            onClick={startExperience}
            className="group relative px-20 py-6 border border-[#d4af37]/40 hover:border-[#d4af37] transition-all duration-700 overflow-hidden"
          >
            <div className="absolute inset-0 w-0 bg-[#d4af37]/10 transition-all duration-500 group-hover:w-full"></div>
            <div className="relative z-10 flex flex-col items-center gap-1">
                <span className="text-sm tracking-[0.4em] font-bold uppercase">开启旅程</span>
                <span className="text-[9px] tracking-[0.5em] opacity-60">OPEN JOURNEY</span>
            </div>
          </button>
          
          <div className="absolute bottom-12 text-[9px] tracking-[0.4em] opacity-30 font-sans uppercase font-medium">
            Everything is set. Click to begin.
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        multiple 
        accept="image/*" 
        onChange={handleFileUpload} 
      />

      <GestureManager 
        active={isGestureEnabled} 
        onStateChange={handleGestureStateChange} 
        handXRef={handXRef}
        isHandActiveRef={isHandActiveRef}
      />

      {/* Image Viewer Overlay */}
      {viewingImage && (
        <div 
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={closeViewer}
        >
          <div 
            className="relative p-1 border border-black/10 bg-white shadow-2xl mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={viewingImage} 
              alt="Memory" 
              className="max-h-[65vh] max-w-full object-contain"
            />
          </div>
          <div className="flex gap-6">
             <button onClick={handleDeletePhoto} className="px-8 py-3 border border-red-100 text-red-500 text-xs tracking-[0.2em] uppercase hover:bg-red-50 transition-colors font-bold">
               删除记忆 / DELETE
             </button>
             <button onClick={closeViewer} className="px-8 py-3 bg-black text-white text-xs tracking-[0.2em] uppercase hover:bg-gray-800 transition-colors font-bold">
               关闭 / CLOSE
             </button>
          </div>
        </div>
      )}

      {/* Main UI Overlay */}
      <div className={`absolute inset-0 pointer-events-none p-8 md:p-12 z-10 transition-all duration-1000 ${showSplash ? 'opacity-0 blur-lg' : 'opacity-100 blur-0'}`}>
        
        {/* Top Left Header */}
        <header className="pointer-events-auto select-none flex flex-col gap-12">
          <div className="group cursor-default">
            {/* Using Sans-Serif font (Montserrat) as requested */}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-[0.1em] text-black transition-all duration-700">
              人生坐标
            </h1>
            <div className="mt-8 pl-1.5 flex flex-col gap-1">
                <span className="text-[10px] md:text-xs tracking-[0.8em] text-black/30 uppercase font-bold">
                  LIFE COORDINATES
                </span>
                <div className="w-16 h-[1.5px] bg-black/10 mt-2 transition-all duration-500 group-hover:w-32 group-hover:bg-black/20"></div>
            </div>
          </div>

          <button
            onClick={triggerFileUpload}
            className="group w-fit flex items-center gap-5 px-5 py-4 bg-white border border-black/5 hover:border-black/20 hover:shadow-2xl rounded-2xl transition-all duration-500"
          >
            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/5 group-hover:bg-black group-hover:text-white transition-all duration-500">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="flex flex-col items-start pr-4">
                <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-black/80">
                  {userImages.length > 0 ? '添加记忆' : '上传记忆'}
                </span>
                <span className="text-[9px] opacity-30 uppercase tracking-[0.2em] font-bold mt-0.5">
                  {userImages.length > 0 ? 'ADD MEMORY' : 'UPLOAD MEMORY'}
                </span>
            </div>
          </button>

          <button
            onClick={() => setIsGestureEnabled(!isGestureEnabled)}
            className={`group w-fit flex items-center gap-5 px-5 py-4 border rounded-2xl transition-all duration-500 ${
              isGestureEnabled 
                ? 'bg-black text-white border-black shadow-2xl' 
                : 'bg-white border-black/5 hover:border-black/20 hover:shadow-2xl'
            }`}
          >
            <div className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 ${
              isGestureEnabled 
                ? 'bg-white/20 text-white' 
                : 'bg-black/5 group-hover:bg-black group-hover:text-white'
            }`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <div className="flex flex-col items-start pr-4">
                <span className={`text-[12px] font-bold tracking-[0.2em] uppercase transition-colors ${
                  isGestureEnabled ? 'text-white' : 'text-black/80'
                }`}>
                  {isGestureEnabled ? '关闭手势' : '启用手势'}
                </span>
                <span className={`text-[9px] uppercase tracking-[0.2em] font-bold mt-0.5 transition-colors ${
                  isGestureEnabled ? 'text-white/60' : 'text-black/30'
                }`}>
                  {isGestureEnabled ? 'DISABLE GESTURE' : 'ENABLE GESTURE'}
                </span>
            </div>
          </button>
        </header>

        {/* Bottom Center Controls */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-sm pointer-events-auto flex flex-col items-center gap-12">
            
            {userImages.length > 0 && (
              <div className="w-full bg-white/40 backdrop-blur-2xl p-6 rounded-3xl border border-black/5 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <div className="flex justify-between items-center mb-4 px-1">
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[10px] font-extrabold tracking-widest text-black/60 uppercase">照片尺寸</label>
                        <span className="text-[8px] tracking-[0.2em] text-black/30 uppercase font-bold">PHOTO SCALE</span>
                    </div>
                    <button 
                        onClick={clearAllPhotos}
                        className="text-[9px] font-bold tracking-[0.2em] text-red-500/60 hover:text-red-600 transition-colors uppercase border-b border-red-500/10"
                    >
                        清空图库 / CLEAR
                    </button>
                </div>
                <input 
                  type="range" min="0.5" max="4.0" step="0.1" 
                  value={photoScale}
                  onChange={(e) => setPhotoScale(parseFloat(e.target.value))}
                  className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-black transition-all"
                />
              </div>
            )}

            <button
              onClick={toggleState}
              className="group relative w-full md:w-80 h-16 bg-black text-white hover:bg-white border border-black transition-all duration-700 shadow-2xl overflow-hidden rounded-sm"
            >
              <div className="absolute inset-0 w-0 bg-white transition-all duration-500 group-hover:w-full"></div>
              <div className="relative z-10 flex flex-col items-center justify-center h-full group-hover:text-black transition-colors duration-500">
                <span className="text-xs font-extrabold tracking-[0.4em] uppercase">
                    {treeState === TreeMorphState.TREE_SHAPE ? '散开形态' : '回归坐标'}
                </span>
                <span className="text-[9px] tracking-[0.6em] opacity-40 uppercase font-bold mt-1">
                    {treeState === TreeMorphState.TREE_SHAPE ? 'SCATTER' : 'GATHER'}
                </span>
              </div>
            </button>
            
            <div className="flex gap-10 opacity-30">
                <div className={`h-1.5 w-1.5 rounded-full transition-all duration-1000 ${treeState === TreeMorphState.TREE_SHAPE ? 'bg-cyan-500 scale-150 shadow-[0_0_12px_cyan]' : 'bg-gray-300'}`}></div>
                <div className={`h-1.5 w-1.5 rounded-full transition-all duration-1000 ${treeState === TreeMorphState.TREE_SHAPE ? 'bg-pink-500 scale-150 shadow-[0_0_12px_pink]' : 'bg-gray-300'}`}></div>
                <div className={`h-1.5 w-1.5 rounded-full transition-all duration-1000 ${treeState === TreeMorphState.TREE_SHAPE ? 'bg-yellow-500 scale-150 shadow-[0_0_12px_yellow]' : 'bg-gray-300'}`}></div>
            </div>
        </div>

        {/* Bottom Right Info Panels */}
        <div className="absolute bottom-12 right-12 hidden lg:flex flex-col items-end gap-6">
             <div className="flex flex-col items-end space-y-5 pointer-events-auto">
                <div className="flex items-center gap-6 group hover:translate-x-[-8px] transition-transform duration-300">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-black/60">婚姻现状</span>
                        <span className="text-[8px] tracking-[0.1em] text-black/30 uppercase font-bold">MARRIAGE STATUS</span>
                    </div>
                    <span className="w-24 text-[10px] font-black py-2.5 text-center border border-black/5 bg-white/60 rounded uppercase tracking-[0.2em] shadow-sm">X AXIS</span>
                </div>
                <div className="flex items-center gap-6 group hover:translate-x-[-8px] transition-transform duration-300">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-black/60">情感态度</span>
                        <span className="text-[8px] tracking-[0.1em] text-black/30 uppercase font-bold">EMOTION LEVEL</span>
                    </div>
                    <span className="w-24 text-[10px] font-black py-2.5 text-center border border-black/5 bg-white/60 rounded uppercase tracking-[0.2em] shadow-sm">Y AXIS</span>
                </div>
             </div>
        </div>
      </div>

      {/* Three.js Canvas */}
      <Canvas className="absolute inset-0">
        <Suspense fallback={null}>
          <Scene 
            treeState={treeState}
            userImages={userImages}
            photoScale={photoScale}
            onPhotoClick={handlePhotoClick}
            handXRef={handXRef}
            isHandActiveRef={isHandActiveRef}
          />
        </Suspense>
      </Canvas>
      
      <Loader />
    </div>
  );
}

export default App;