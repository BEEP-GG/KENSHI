/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CharacterData, INITIAL_CHARACTER } from './types';
import { StepScenario } from './components/StepScenario';
import { StepRegion } from './components/StepRegion';
import { StepRace } from './components/StepRace';
import { StepDetails } from './components/StepDetails';
import { FinalSummary } from './components/FinalSummary';
import { ChevronRight, ChevronLeft, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

// Steps definition
const STEPS = [
  { id: 'scenario', title: '开局剧本' },
  { id: 'region', title: '出生区域' },
  { id: 'race', title: '种族血统' },
  { id: 'details', title: '详细设定' },
  { id: 'summary', title: '完成' },
];

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [characterData, setCharacterData] = useState<CharacterData>(INITIAL_CHARACTER);
  const [isStarted, setIsStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
    } catch {
      // ignore fullscreen errors from browser policy
    }
  };

  const updateData = (updates: Partial<CharacterData>) => {
    setCharacterData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  // Start Screen
  if (!isStarted) {
    return (
      <div className="relative w-full h-full min-h-full overflow-hidden bg-black flex items-center justify-center">
        <button
          onClick={toggleFullscreen}
          className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded border border-[#C2B280]/60 bg-black/40 px-3 py-1.5 text-xs text-[#C2B280] backdrop-blur-sm transition-colors hover:bg-[#C2B280]/15"
          title={isFullscreen ? '退出全屏' : '全屏显示'}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{isFullscreen ? '退出全屏' : '全屏显示'}</span>
        </button>

        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-[url('https://picsum.photos/seed/kenshi_desert/1920/1080?grayscale')] bg-cover bg-center opacity-40 scale-105 animate-pulse-slow"
          style={{ animationDuration: '20s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative z-10 text-center flex flex-col items-center"
        >
          <h1 className="text-7xl md:text-9xl font-serif text-[#C2B280] tracking-widest mb-4 drop-shadow-lg">
            KENSHI
          </h1>
          <p className="text-xl md:text-2xl text-white/60 font-serif tracking-[0.35em] mb-12">
            终末之诗
          </p>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(194, 178, 128, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsStarted(true)}
            className="px-12 py-4 border border-[#C2B280] text-[#C2B280] font-serif text-xl tracking-widest uppercase rounded hover:shadow-[0_0_20px_rgba(194,178,128,0.3)] transition-all"
          >
            开始旅程
          </motion.button>

          <div className="mt-8 flex gap-4 text-xs text-white/30 font-mono">
            <span>VER 0.9.2</span>
            <span>•</span>
            <span>LLM INTERFACE READY</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Interface
  return (
    <div className="relative w-full h-full min-h-full bg-[#0a0a0a] text-white overflow-hidden flex flex-col">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />

      {/* Header / Nav */}
      <header className="relative z-20 h-20 border-b border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-serif text-[#C2B280] tracking-widest">KENSHI</h1>
          <div className="h-6 w-px bg-white/20" />
          <span className="text-sm text-white/50 font-mono uppercase">Character Creation</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`
                  flex items-center gap-2 px-3 py-1 rounded transition-all duration-500
                  ${idx === currentStep ? 'text-[#C2B280] bg-[#C2B280]/10 border border-[#C2B280]/30' :
                    idx < currentStep ? 'text-white/40' : 'text-white/20'}
                `}
              >
                <span className="text-xs font-mono">0{idx + 1}</span>
                <span className="text-sm font-serif hidden md:block">{step.title}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-1 ${idx < currentStep ? 'bg-[#C2B280]/50' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
           <button
             onClick={toggleFullscreen}
             className="inline-flex items-center gap-1 rounded border border-[#C2B280]/40 px-2 py-1 text-xs text-[#C2B280] hover:bg-[#C2B280]/10 transition-colors"
             title={isFullscreen ? '退出全屏' : '全屏显示'}
           >
             {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
             <span className="hidden md:inline">{isFullscreen ? '退出全屏' : '全屏'}</span>
           </button>
           <button
             onClick={() => setCharacterData(INITIAL_CHARACTER)}
             className="p-2 text-white/40 hover:text-white transition-colors"
             title="Reset"
           >
             <RotateCcw size={18} />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden p-8">
        <div className="max-w-7xl mx-auto h-full relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="h-full"
            >
              {currentStep === 0 && <StepScenario data={characterData} updateData={updateData} onNext={nextStep} />}
              {currentStep === 1 && <StepRegion data={characterData} updateData={updateData} />}
              {currentStep === 2 && <StepRace data={characterData} updateData={updateData} />}
              {currentStep === 3 && <StepDetails data={characterData} updateData={updateData} />}
              {currentStep === 4 && <FinalSummary data={characterData} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Controls */}
      <footer className="relative z-20 h-20 border-t border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between px-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className={`
            flex items-center gap-2 px-6 py-3 rounded font-serif tracking-wider transition-all
            ${currentStep === 0
              ? 'opacity-0 pointer-events-none'
              : 'text-white/60 hover:text-white hover:bg-white/5'}
          `}
        >
          <ChevronLeft size={18} />
          返回
        </button>

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-8 py-3 bg-[#C2B280] text-black font-bold font-serif tracking-wider rounded hover:bg-[#d4c490] hover:shadow-[0_0_15px_rgba(194,178,128,0.3)] transition-all active:scale-95"
          >
            下一步
            <ChevronRight size={18} />
          </button>
        ) : (
          <div /> // Spacer
        )}
      </footer>
    </div>
  );
}

