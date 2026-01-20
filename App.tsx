import React, { useRef } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import { ControlPanel } from './components/ControlPanel';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
      status, 
      start, 
      stop, 
      currentGesture, 
      confidence, 
      logs, 
      gpuList, 
      currentDelegate, 
      setDelegate,
      activeGpuName
  } = useLiveSession();

  const handleStart = () => {
    if (videoRef.current && canvasRef.current) {
      start(videoRef.current, canvasRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 md:p-8 font-sans">
      
      {/* Header */}
      <header className="w-full max-w-5xl mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                Local Gesture AI
            </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
        
        {/* Left Column: Video & Annotation (Takes up 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700 group">
                {/* Video Feed */}
                <video 
                    ref={videoRef}
                    className="w-full h-full object-cover transform scale-x-[-1] absolute inset-0 z-0" 
                    muted 
                    playsInline 
                    // autoPlay handled by hook
                />
                
                {/* Canvas for Skeletal Overlay */}
                <canvas 
                    ref={canvasRef} 
                    className="w-full h-full absolute inset-0 z-10 transform scale-x-[-1]" 
                />

                {/* Annotation Overlay */}
                {currentGesture && (
                    <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-20">
                         <div className="bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/10 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
                            <span className="text-emerald-400 font-bold">识别结果:</span>
                            <span className="text-2xl font-bold tracking-wide">{currentGesture}</span>
                            <span className="text-xs text-slate-400 font-mono pt-1">{(confidence * 100).toFixed(0)}%</span>
                         </div>
                    </div>
                )}
                
                {/* Status Indicator */}
                <div className="absolute bottom-4 left-4 z-20">
                    <div className={`px-2 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                        status === 'RUNNING' ? 'bg-emerald-600/80 text-white animate-pulse' : 'bg-slate-800/80 text-slate-400'
                    }`}>
                        {status === 'RUNNING' ? 'LOCAL RUNTIME' : 'STANDBY'}
                    </div>
                </div>
            </div>

            <ControlPanel 
                status={status} 
                onStart={handleStart} 
                onStop={stop}
                gpuList={gpuList}
                currentDelegate={currentDelegate}
                setDelegate={setDelegate}
                activeGpuName={activeGpuName}
            />
        </div>

        {/* Right Column: Gesture History */}
        <div className="lg:col-span-1 h-full max-h-[600px] flex flex-col bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    手势历史
                </h3>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-700">WebGPU</span>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-3 scroll-smooth">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm opacity-60">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                        </svg>
                        <p>请做出手势...</p>
                    </div>
                ) : (
                    logs.map((log, index) => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:bg-slate-700 transition-colors animate-in slide-in-from-right-2 fade-in duration-300">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{log.name.split(' ')[0]}</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-200">{log.name.split(' ').slice(1).join(' ') || log.name}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                                {(log.score * 100).toFixed(0)}%
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </main>
      
      <footer className="w-full text-center py-6 text-slate-500 text-xs">
         <p>Local Inference via MediaPipe & WebGPU</p>
      </footer>
    </div>
  );
};

export default App;
