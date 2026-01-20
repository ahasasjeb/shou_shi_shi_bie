export enum ModelStatus {
  LOADING = 'LOADING',     // Model is downloading/initializing
  READY = 'READY',         // Model is ready to use
  RUNNING = 'RUNNING',     // Camera is active and inference is running
  ERROR = 'ERROR',         // Something went wrong
  STOPPED = 'STOPPED'      // Camera is off
}

export interface GestureLog {
  id: string;
  name: string;
  score: number;
  timestamp: number;
}

export interface GpuAdapterInfo {
  name: string;
  vendor: string;
  architecture?: string;
  description?: string;
  device?: string; // Driver/Device ID if available
}

export type DelegateType = 'GPU' | 'CPU';
