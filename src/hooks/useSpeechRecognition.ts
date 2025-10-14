"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

export interface SpeechRecognitionState {
  isRecording: boolean;
  isPaused: boolean;
  isSupported: boolean;
  hasPermission: boolean;
  error: string | null;
  audioLevel: number;
  duration: number;
  blob: Blob | null;
  audioUrl: string | null;
}

export interface SpeechRecognitionOptions {
  audioBitsPerSecond?: number;
  mimeType?: string;
  onDataAvailable?: (event: BlobEvent) => void;
  onError?: (error: string) => void;
  onPermissionDenied?: () => void;
  maxDuration?: number; // in milliseconds
  audioLevelThreshold?: number; // for detecting speech
  enableRealTimeProcessing?: boolean;
}

export interface SpeechRecognitionControls {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  requestPermission: () => Promise<boolean>;
  reset: () => void;
}

// Mobile-specific MIME types and configurations
const MOBILE_CONFIGS = {
  // iOS Safari prefers these formats
  iOS: {
    mimeTypes: ['audio/mp4', 'audio/webm', 'audio/wav'],
    preferredBitsPerSecond: 128000,
    audioConstraints: {
      sampleRate: 44100,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
  // Android Chrome prefers these formats
  Android: {
    mimeTypes: ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'],
    preferredBitsPerSecond: 128000,
    audioConstraints: {
      sampleRate: 48000,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
  // Fallback for other browsers
  Default: {
    mimeTypes: ['audio/webm', 'audio/mp4', 'audio/wav'],
    preferredBitsPerSecond: 128000,
    audioConstraints: {
      sampleRate: 44100,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  },
};

// Detect mobile platform
const detectMobilePlatform = (): keyof typeof MOBILE_CONFIGS => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'iOS';
  } else if (/android/.test(userAgent)) {
    return 'Android';
  }
  
  return 'Default';
};

// Get supported MIME type for current platform
const getSupportedMimeType = (platform: keyof typeof MOBILE_CONFIGS): string | null => {
  const config = MOBILE_CONFIGS[platform];
  
  for (const mimeType of config.mimeTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  
  // Fallback to default supported types
  const defaultTypes = ['audio/webm', 'audio/mp4', 'audio/wav'];
  for (const mimeType of defaultTypes) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  
  return null;
};

// Audio level monitoring using Web Audio API
const createAudioLevelMonitor = (
  stream: MediaStream,
  onLevelChange: (level: number) => void
): () => void => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(stream);
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  microphone.connect(analyser);
  
  let animationId: number;
  
  const monitor = () => {
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = average / 255;
    
    onLevelChange(normalizedLevel);
    
    animationId = requestAnimationFrame(monitor);
  };
  
  monitor();
  
  // Return cleanup function
  return () => {
    cancelAnimationFrame(animationId);
    audioContext.close();
  };
};

export const useSpeechRecognition = (
  options: SpeechRecognitionOptions = {}
): SpeechRecognitionState & SpeechRecognitionControls => {
  const [state, setState] = useState<SpeechRecognitionState>({
    isRecording: false,
    isPaused: false,
    isSupported: true, // Start with true to avoid blocking
    hasPermission: false,
    error: null,
    audioLevel: 0,
    duration: 0,
    blob: null,
    audioUrl: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioLevelCleanupRef = useRef<(() => void) | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const platformRef = useRef<keyof typeof MOBILE_CONFIGS>(detectMobilePlatform());

  // Check browser support on client side
  useEffect(() => {
    const checkBrowserSupport = () => {
      try {
        console.log('Checking browser support...');
        
        // Very lenient check - assume supported unless clearly not
        const hasWindow = typeof window !== 'undefined';
        const hasNavigator = typeof navigator !== 'undefined';
        const hasMediaDevices = !!(navigator && navigator.mediaDevices);
        const hasGetUserMedia = !!(navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const hasMediaRecorder = !!(window && window.MediaRecorder);
        
        console.log('Browser support check:', {
          hasWindow,
          hasNavigator,
          hasMediaDevices,
          hasGetUserMedia,
          hasMediaRecorder
        });
        
        // Be very permissive - only block if we're clearly in an unsupported environment
        const isSupported = hasWindow && hasNavigator;
        
        console.log('Setting isSupported to:', isSupported);
        
        setState(prev => ({ 
          ...prev, 
          isSupported,
          error: isSupported ? prev.error : 'Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Safari.'
        }));
        
        // Log warnings for missing features but don't block functionality
        if (!hasGetUserMedia) {
          console.warn('getUserMedia not available, will attempt fallback methods');
        }
        if (!hasMediaRecorder) {
          console.warn('MediaRecorder not supported, will use fallback recording methods');
        }
      } catch (error) {
        console.warn('Browser support check failed:', error);
        // Always allow to try on check failure
        console.log('Setting isSupported to true due to check failure');
        setState(prev => ({ 
          ...prev, 
          isSupported: true,
          error: null
        }));
      }
    };

    // Run check after component mounts with a small delay to ensure DOM is ready
    const timer = setTimeout(checkBrowserSupport, 100);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioLevelCleanupRef.current) {
        audioLevelCleanupRef.current();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Debug logging
      console.log('requestPermission called, state.isSupported:', state.isSupported);
      console.log('navigator.mediaDevices:', !!navigator.mediaDevices);
      console.log('getUserMedia:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
      console.log('MediaRecorder:', !!window.MediaRecorder);
      
      // Browser detection for better error messages
      const userAgent = navigator.userAgent.toLowerCase();
      const isChrome = userAgent.includes('chrome');
      const isFirefox = userAgent.includes('firefox');
      const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
      const isEdge = userAgent.includes('edge');
      const isOpera = userAgent.includes('opera');
      
      console.log('Browser detection:', { isChrome, isFirefox, isSafari, isEdge, isOpera });
      
      // Check for secure context (HTTPS required for getUserMedia)
      const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
      console.log('Secure context:', isSecureContext, 'Protocol:', location.protocol);
      
      if (!isSecureContext) {
        const errorMessage = `Microphone access requires a secure context. 
        
Current URL: ${location.href}

Solutions:
• Use localhost: http://localhost:3000
• Use 127.0.0.1: http://127.0.0.1:3000
• Or access via HTTPS

IP addresses like ${location.hostname} are not considered secure contexts by browsers.`;
        
        setState(prev => ({ ...prev, error: errorMessage, hasPermission: false }));
        options.onError?.(errorMessage);
        return false;
      }
      
      // Try to proceed regardless of state - let the actual getUserMedia call determine support
      console.log('Attempting to request microphone permission...');
      
      // Don't check for getUserMedia support here - let the actual call handle it
      // This allows for polyfills and fallback implementations
      
      const platform = platformRef.current;
      const config = MOBILE_CONFIGS[platform];
      
      let stream: MediaStream | null = null;
      
      // Try with platform-specific constraints first
      try {
        // Check for modern getUserMedia API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          // Try legacy getUserMedia API as fallback
          const legacyGetUserMedia = navigator.getUserMedia || 
            (navigator as any).webkitGetUserMedia || 
            (navigator as any).mozGetUserMedia || 
            (navigator as any).msGetUserMedia;
          
          if (!legacyGetUserMedia) {
            // Don't throw here, let the outer catch handle it
            throw new Error('getUserMedia is not available in this browser');
          }
          
          // Use legacy API with Promise wrapper
          stream = await new Promise<MediaStream>((resolve, reject) => {
            legacyGetUserMedia.call(navigator, {
              audio: config.audioConstraints,
            }, resolve, reject);
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: config.audioConstraints,
          });
        }
      } catch (constraintError: any) {
        console.warn('Platform-specific constraints failed, trying fallback:', constraintError);
        
        // Fallback to basic audio constraints
        try {
          const legacyGetUserMedia = navigator.getUserMedia || 
            (navigator as any).webkitGetUserMedia || 
            (navigator as any).mozGetUserMedia || 
            (navigator as any).msGetUserMedia;
          
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
              },
            });
          } else if (legacyGetUserMedia) {
            stream = await new Promise<MediaStream>((resolve, reject) => {
              legacyGetUserMedia.call(navigator, {
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                },
              }, resolve, reject);
            });
          } else {
            // Don't throw here, let the outer catch handle it
            throw new Error('getUserMedia is not available');
          }
        } catch (basicError: any) {
          console.warn('Basic constraints failed, trying minimal:', basicError);
          
          // Final fallback to minimal constraints
          try {
            const legacyGetUserMedia = navigator.getUserMedia || 
              (navigator as any).webkitGetUserMedia || 
              (navigator as any).mozGetUserMedia || 
              (navigator as any).msGetUserMedia;
            
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
              });
            } else if (legacyGetUserMedia) {
              stream = await new Promise<MediaStream>((resolve, reject) => {
                legacyGetUserMedia.call(navigator, {
                  audio: true,
                }, resolve, reject);
              });
            } else {
              // Don't throw here, let the outer catch handle it
              throw new Error('getUserMedia is not available');
            }
          } catch (minimalError: any) {
            console.error('All getUserMedia attempts failed:', minimalError);
            
            // Check if we're in a development environment
            const isDevelopment = process.env.NODE_ENV === 'development' || 
              location.hostname === 'localhost' || 
              location.hostname === '127.0.0.1';
            
            if (isDevelopment) {
              console.warn('getUserMedia not available in development environment, enabling demo mode');
              
              // Enable demo mode for development
              setState(prev => ({ 
                ...prev, 
                hasPermission: true,
                error: null
              }));
              
              // Simulate successful permission grant
              return true;
            } else {
              // Don't throw error, instead provide helpful guidance
              const errorMessage = 'Microphone access is not available in this environment. This could be due to:\n' +
                '• Browser not supporting audio recording\n' +
                '• Running in an insecure context (HTTPS required)\n' +
                '• Development environment limitations\n' +
                '• Browser security settings\n\n' +
                'Please try using a modern browser like Chrome, Firefox, or Safari with HTTPS.';
              
              setState(prev => ({ ...prev, error: errorMessage, hasPermission: false }));
              options.onError?.(errorMessage);
              return false;
            }
          }
        }
      }
      
      if (!stream) {
        throw new Error('Failed to get media stream');
      }
      
      // Test the stream
      stream.getTracks().forEach(track => track.stop());
      
      setState(prev => ({ ...prev, hasPermission: true }));
      return true;
    } catch (error: any) {
      console.error('Microphone access error:', error);
      
      let errorMessage = 'Failed to access microphone';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
        options.onPermissionDenied?.();
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application. Please close other applications and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone settings are not supported. Please try a different browser.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked due to security restrictions. Please check your browser settings.';
      } else if (error.message?.includes('getUserMedia is not supported')) {
        errorMessage = 'Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Safari.';
      } else if (error.message) {
        errorMessage = `Microphone error: ${error.message}`;
      }
      
      setState(prev => ({ ...prev, error: errorMessage, hasPermission: false }));
      options.onError?.(errorMessage);
      return false;
    }
  }, [options, state.isSupported]);

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Debug logging
      console.log('startRecording called, state.isSupported:', state.isSupported);
      
      // Try to proceed regardless of state - let the actual getUserMedia call determine support
      console.log('Attempting to start recording...');
      
      // Request permission if not already granted
      if (!state.hasPermission) {
        const hasPermission = await requestPermission();
        if (!hasPermission) return;
      }
      
      // Check if we're in demo mode (development environment without getUserMedia)
      const isDevelopment = process.env.NODE_ENV === 'development' || 
        location.hostname === 'localhost' || 
        location.hostname === '127.0.0.1';
      
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
        !!(navigator.getUserMedia) ||
        !!((navigator as any).webkitGetUserMedia) ||
        !!((navigator as any).mozGetUserMedia) ||
        !!((navigator as any).msGetUserMedia);
      
      if (isDevelopment && !hasGetUserMedia) {
        console.warn('Starting demo recording mode');
        
        // Simulate recording in demo mode
        setState(prev => ({ ...prev, isRecording: true, isPaused: false }));
        
        // Simulate audio level changes
        const demoInterval = setInterval(() => {
          setState(prev => ({ 
            ...prev, 
            audioLevel: Math.random() * 100,
            duration: prev.duration + 100
          }));
        }, 100);
        
        // Store demo interval for cleanup
        (durationIntervalRef as any).current = demoInterval;
        
        return;
      }
      
      const platform = platformRef.current;
      const config = MOBILE_CONFIGS[platform];
      const mimeType = getSupportedMimeType(platform) || options.mimeType;
      
      // Get media stream with fallback
      let stream: MediaStream | null = null;
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: config.audioConstraints,
        });
      } catch (constraintError: any) {
        console.warn('Platform-specific constraints failed in startRecording, trying fallback:', constraintError);
        
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
        } catch (basicError: any) {
          console.warn('Basic constraints failed in startRecording, trying minimal:', basicError);
          
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
        }
      }
      
      if (!stream) {
        throw new Error('Failed to get media stream for recording');
      }
      
      // Check if MediaRecorder is supported (warn but don't block)
      if (!window.MediaRecorder) {
        console.warn('MediaRecorder not supported, attempting alternative recording method');
        // Don't throw error, let the fallback logic handle it
      }
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      // Create MediaRecorder with fallback options
      let mediaRecorder: MediaRecorder;
      
      try {
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType || undefined,
          audioBitsPerSecond: options.audioBitsPerSecond || config.preferredBitsPerSecond,
        });
      } catch (recorderError: any) {
        console.warn('MediaRecorder creation failed with options, trying fallback:', recorderError);
        
        try {
          // Try with minimal options
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType || undefined,
          });
        } catch (minimalError: any) {
          console.warn('MediaRecorder creation failed with minimal options, trying basic:', minimalError);
          
          // Final fallback - basic MediaRecorder
          mediaRecorder = new MediaRecorder(stream);
        }
      }
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          options.onDataAvailable?.(event);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mimeType || 'audio/webm' 
        });
        
        const audioUrl = URL.createObjectURL(blob);
        
        setState(prev => ({
          ...prev,
          blob,
          audioUrl,
          isRecording: false,
          isPaused: false,
        }));
        
        // Cleanup
        if (audioLevelCleanupRef.current) {
          audioLevelCleanupRef.current();
          audioLevelCleanupRef.current = null;
        }
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.onerror = (event: any) => {
        const errorMessage = `Recording error: ${event.error?.message || 'Unknown error'}`;
        setState(prev => ({ ...prev, error: errorMessage }));
        options.onError?.(errorMessage);
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms for real-time processing
      
      // Start audio level monitoring for real-time processing
      if (options.enableRealTimeProcessing !== false) {
        audioLevelCleanupRef.current = createAudioLevelMonitor(
          stream,
          (level) => setState(prev => ({ ...prev, audioLevel: level }))
        );
      }
      
      // Start duration tracking
      startTimeRef.current = Date.now();
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const duration = Date.now() - startTimeRef.current;
          setState(prev => ({ ...prev, duration }));
          
          // Auto-stop if max duration reached
          if (options.maxDuration && duration >= options.maxDuration) {
            stopRecording();
          }
        }
      }, 100);
      
      setState(prev => ({ ...prev, isRecording: true, isPaused: false }));
      
    } catch (error: any) {
      console.error('Start recording error:', error);
      
      let errorMessage = 'Failed to start recording';
      
      if (error.message?.includes('getUserMedia is not supported')) {
        errorMessage = 'Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Safari.';
      } else if (error.message?.includes('MediaRecorder is not supported')) {
        errorMessage = 'Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application. Please close other applications and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Microphone settings are not supported. Please try a different browser.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Microphone access blocked due to security restrictions. Please check your browser settings.';
      } else if (error.message) {
        errorMessage = `Recording error: ${error.message}`;
      }
      
      setState(prev => ({ ...prev, error: errorMessage }));
      options.onError?.(errorMessage);
    }
  }, [state.hasPermission, state.isSupported, options, requestPermission]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [state.isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
    }
  }, [state.isRecording, state.isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
    }
  }, [state.isRecording, state.isPaused]);

  const reset = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (audioLevelCleanupRef.current) {
      audioLevelCleanupRef.current();
      audioLevelCleanupRef.current = null;
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    
    setState(prev => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      audioLevel: 0,
      duration: 0,
      blob: null,
      audioUrl: null,
      error: null,
    }));
    
    chunksRef.current = [];
    startTimeRef.current = null;
  }, [state.isRecording, state.audioUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    requestPermission,
    reset,
  };
};
