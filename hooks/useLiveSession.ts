import { useState, useRef, useCallback, useEffect } from 'react';
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision';
import { ModelStatus, GestureLog, GpuAdapterInfo, DelegateType } from '../types';

// Map MediaPipe category names to Chinese
const GESTURE_MAP: Record<string, string> = {
  'None': '无手势',
  'Closed_Fist': '✊ 握拳',
  'Open_Palm': '✋ 张开手掌',
  'Pointing_Up': '👆 食指向上',
  'Thumb_Down': '👎 拇指向下',
  'Thumb_Up': '👍 点赞',
  'Victory': '✌️ 剪刀手',
  'ILoveYou': '🤟 比心'
};

export const useLiveSession = () => {
  const [status, setStatus] = useState<ModelStatus>(ModelStatus.LOADING);
  const [logs, setLogs] = useState<GestureLog[]>([]);
  const [currentGesture, setCurrentGesture] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  
  // Hardware Info
  const [gpuList, setGpuList] = useState<GpuAdapterInfo[]>([]);
  const [currentDelegate, setCurrentDelegate] = useState<DelegateType>('GPU');
  const [activeGpuName, setActiveGpuName] = useState<string>('Unknown');

  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const lastGestureRef = useRef<string>('');
  const lastGestureTimeRef = useRef<number>(0);

  // Detect GPUs
  useEffect(() => {
    // Helper to get consistent name safely
    const getAdapterName = async (adapter: any) => {
        if (typeof adapter.requestAdapterInfo === 'function') {
            try {
                const info = await adapter.requestAdapterInfo();
                return info.device || info.description || info.vendor || "Generic GPU";
            } catch (e) {
                return "Generic GPU";
            }
        }
        return "Generic GPU";
    };

    const detectHardware = async () => {
      const nav = navigator as any;
      if (!nav.gpu) {
        console.warn("WebGPU not supported in this browser.");
        setGpuList([]);
        return;
      }

      try {
        const adapters: any[] = [];
        
        // Try High Performance
        const hp = await nav.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (hp) adapters.push(hp);

        // Try Low Power
        const lp = await nav.gpu.requestAdapter({ powerPreference: 'low-power' });
        
        // Avoid duplicates
        let isDuplicate = false;
        if (hp && lp) {
            const hpName = await getAdapterName(hp);
            const lpName = await getAdapterName(lp);
            if (hpName === lpName) isDuplicate = true;
        }

        if (lp && !isDuplicate) {
           adapters.push(lp);
        }

        const infoList: GpuAdapterInfo[] = [];
        for (const adapter of adapters) {
            let info: any = { device: 'Generic GPU', vendor: 'Unknown' };
            
            if (typeof adapter.requestAdapterInfo === 'function') {
                try {
                    info = await adapter.requestAdapterInfo();
                } catch (e) {
                    console.warn("Could not request adapter info", e);
                }
            }
            
            infoList.push({
                name: info.device || info.description || "Generic GPU",
                vendor: info.vendor || "Unknown",
                architecture: info.architecture,
                description: info.description
            });
        }
        
        setGpuList(infoList);
        
        if (infoList.length > 0) {
            setActiveGpuName(infoList[0].name); // Default approximation
        }

      } catch (e) {
        console.error("Error detecting GPUs:", e);
      }
    };
    
    detectHardware();
  }, []);

  // Load Model
  const loadModel = useCallback(async (delegate: DelegateType) => {
    setStatus(ModelStatus.LOADING);
    if (recognizerRef.current) {
        recognizerRef.current.close();
        recognizerRef.current = null;
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      
      recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: delegate // 'GPU' or 'CPU'
        },
        runningMode: "VIDEO",
        numHands: 2
      });
      
      setStatus(ModelStatus.READY);
      console.log(`MediaPipe Model Loaded with ${delegate} Delegate`);
    } catch (error) {
      console.error("Failed to load model:", error);
      setStatus(ModelStatus.ERROR);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    loadModel(currentDelegate);
  }, [loadModel, currentDelegate]);

  // Handle Delegate Change
  const setDelegate = (delegate: DelegateType) => {
      if (status === ModelStatus.RUNNING) {
          stop(); // Must stop before switching
      }
      setCurrentDelegate(delegate);
      // activeGpuName is mostly informational as MediaPipe handles context creation
      if (delegate === 'CPU') {
          setActiveGpuName('CPU (WASM)');
      } else if (gpuList.length > 0) {
          setActiveGpuName(gpuList[0].name); // Assume high-perf is default for MediaPipe
      }
  };

  const addLog = useCallback((name: string, score: number) => {
    setLogs(prev => [
      {
        id: Math.random().toString(36).substring(7),
        name,
        score,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 19) // Keep last 20
    ]);
  }, []);

  const predict = useCallback(() => {
    if (
        !recognizerRef.current || 
        !videoRef.current || 
        !canvasRef.current ||
        status === ModelStatus.STOPPED
    ) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === 4 && ctx) {
        // Prepare canvas for drawing landmarks
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // 1. Recognize
        const startTimeMs = performance.now();
        const result = recognizerRef.current.recognizeForVideo(video, startTimeMs);

        // 2. Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 3. Draw Landmarks (Skeleton) if hands detected
        if (result.landmarks && result.landmarks.length > 0) {
            const drawingUtils = new DrawingUtils(ctx);
            for (const landmarks of result.landmarks) {
                drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                    color: "#00FF00",
                    lineWidth: 3
                });
                drawingUtils.drawLandmarks(landmarks, {
                    color: "#FF0000",
                    lineWidth: 1
                });
            }
        }

        // 4. Handle Gestures
        if (result.gestures && result.gestures.length > 0) {
            // Get the first hand's top gesture
            const topGesture = result.gestures[0][0];
            const categoryName = topGesture.categoryName;
            const score = topGesture.score;

            if (categoryName !== 'None' && score > 0.5) {
                const chineseName = GESTURE_MAP[categoryName] || categoryName;
                setCurrentGesture(chineseName);
                setConfidence(score);

                // Debounce logging: only log if it's a new gesture or it's been a while
                const now = Date.now();
                if (chineseName !== lastGestureRef.current || (now - lastGestureTimeRef.current > 1000)) {
                    addLog(chineseName, score);
                    lastGestureRef.current = chineseName;
                    lastGestureTimeRef.current = now;
                }
            } else {
                setCurrentGesture('');
                setConfidence(0);
                lastGestureRef.current = '';
            }
        } else {
            setCurrentGesture('');
            setConfidence(0);
        }
    }

    requestRef.current = requestAnimationFrame(predict);
  }, [addLog, status]);

  const start = useCallback(async (videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement) => {
    if (!recognizerRef.current) return;
    
    try {
        videoRef.current = videoEl;
        canvasRef.current = canvasEl;
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 1280,
                height: 720,
                frameRate: { ideal: 30 }
            },
            audio: false
        });
        
        streamRef.current = stream;
        videoEl.srcObject = stream;
        await videoEl.play();
        
        setStatus(ModelStatus.RUNNING);
        requestRef.current = requestAnimationFrame(predict);
        
    } catch (err) {
        console.error(err);
        setStatus(ModelStatus.ERROR);
    }
  }, [predict]);

  const stop = useCallback(() => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = 0;
    }
    
    // Clear canvas
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setStatus(ModelStatus.READY); // Back to ready state
    setCurrentGesture('');
    setConfidence(0);
  }, []);

  return {
    status,
    start,
    stop,
    logs,
    currentGesture,
    confidence,
    gpuList,
    currentDelegate,
    setDelegate,
    activeGpuName
  };
};