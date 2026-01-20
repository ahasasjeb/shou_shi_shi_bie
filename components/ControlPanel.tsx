import React from 'react';
import { ModelStatus, GpuAdapterInfo, DelegateType } from '../types';

interface ControlPanelProps {
  status: ModelStatus;
  onStart: () => void;
  onStop: () => void;
  gpuList: GpuAdapterInfo[];
  currentDelegate: DelegateType;
  setDelegate: (d: DelegateType) => void;
  activeGpuName: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  status, 
  onStart, 
  onStop, 
  gpuList, 
  currentDelegate, 
  setDelegate,
  activeGpuName
}) => {
  const isLoading = status === ModelStatus.LOADING;
  const isRunning = status === ModelStatus.RUNNING;
  const isReady = status === ModelStatus.READY || status === ModelStatus.STOPPED;

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-4 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 w-full max-w-md mx-auto z-10">
      <div className="text-center mb-2 w-full">
        <h2 className="text-xl font-bold text-white tracking-tight">本地 AI 手势识别</h2>
        <div className="flex justify-center items-center gap-2 mt-1">
             <span className="text-slate-400 text-xs bg-slate-700 px-2 py-1 rounded">
                检测到 {gpuList.length} 个 GPU
             </span>
        </div>
      </div>

      {/* Hardware Selection */}
      <div className="w-full bg-slate-700/50 p-3 rounded-lg border border-slate-600">
        <label className="text-xs text-slate-400 block mb-1">推理设备 (需停止后切换)</label>
        <div className="flex gap-2">
            <select 
                value={currentDelegate}
                onChange={(e) => setDelegate(e.target.value as DelegateType)}
                disabled={isRunning || isLoading}
                className="bg-slate-900 text-white text-sm rounded border border-slate-600 px-3 py-2 flex-grow focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            >
                <option value="GPU">GPU (WebGL/WebGPU)</option>
                <option value="CPU">CPU (WASM)</option>
            </select>
        </div>
        <div className="mt-2 text-[10px] text-emerald-400 font-mono truncate">
            当前活跃: {activeGpuName}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 w-full">
        {isLoading && (
          <button
            disabled
            className="flex-1 bg-slate-700 text-slate-400 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 cursor-wait"
          >
             <svg className="animate-spin h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            资源加载...
          </button>
        )}

        {isReady && (
          <button
            onClick={onStart}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            启动
          </button>
        )}

        {isRunning && (
          <button
            onClick={onStop}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            停止
          </button>
        )}
      </div>
      
      <div className="w-full flex justify-between text-xs text-slate-500 px-1">
        <span>状态: 
            {isLoading && <span className="text-yellow-400 ml-1">Init...</span>}
            {isReady && <span className="text-emerald-400 ml-1 font-bold">Ready</span>}
            {isRunning && <span className="text-blue-400 ml-1 font-bold">Running</span>}
            {status === 'ERROR' && <span className="text-red-500 ml-1 font-bold">Error</span>}
        </span>
        {isRunning && <span className="animate-pulse text-emerald-400">● {currentDelegate} 推理</span>}
      </div>
    </div>
  );
};
