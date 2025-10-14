"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Audio recorder props interface
interface MobileAudioRecorderProps {
  onRecordingStart?: () => void;
  onRecordingStop?: (audioBlob: Blob, audioUrl: string) => void;
  onRecordingPause?: () => void;
  onRecordingResume?: () => void;
  onError?: (error: string) => void;
  maxDuration?: number; // in milliseconds
  minDuration?: number; // in milliseconds
  className?: string;
  disabled?: boolean;
  autoStart?: boolean;
  showWaveform?: boolean;
  showDuration?: boolean;
  recordingFormat?: 'audio/webm' | 'audio/mp4' | 'audio/wav';
}

// Recording state interface
interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  error: string | null;
}

// Browser compatibility check
const checkBrowserSupport = () => {
  const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  return {
    isSupported,
    isIOS,
    isSafari,
    isIOSSafari: isIOS && isSafari,
  };
};

// Get optimal recording format for browser
const getOptimalFormat = () => {
  const { isIOSSafari } = checkBrowserSupport();
  
  if (isIOSSafari) {
    return 'audio/mp4'; // Better iOS Safari support
  }
  
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm';
  }
  
  if (MediaRecorder.isTypeSupported('audio/mp4')) {
    return 'audio/mp4';
  }
  
  return 'audio/wav';
};

export default function MobileAudioRecorder({
  onRecordingStart,
  onRecordingStop,
  onRecordingPause,
  onRecordingResume,
  onError,
  maxDuration = 300000, // 5 minutes default
  minDuration = 1000, // 1 second minimum
  className,
  disabled = false,
  autoStart = false,
  showWaveform = true,
  showDuration = true,
  recordingFormat,
}: MobileAudioRecorderProps) {
  // State management
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0,
    error: null,
  });

  // Refs for audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Timer refs
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Browser compatibility
  const browserSupport = checkBrowserSupport();
  const format = recordingFormat || getOptimalFormat();

  // Update audio level visualization
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !state.isRecording) {
      setState(prev => ({ ...prev, audioLevel: 0 }));
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    const normalizedLevel = Math.min(1, average / 128); // Normalize to 0-1
    
    setState(prev => ({ ...prev, audioLevel: normalizedLevel }));

    if (state.isRecording && !state.isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [state.isRecording, state.isPaused]);

  // Start duration timer
  const startDurationTimer = useCallback(() => {
    durationTimerRef.current = setInterval(() => {
      setState(prev => {
        const newDuration = prev.duration + 100;
        
        // Check max duration
        if (newDuration >= maxDuration) {
          handleStopRecording();
          return prev;
        }
        
        return { ...prev, duration: newDuration };
      });
    }, 100);
  }, [maxDuration]);

  // Stop duration timer
  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // Start max duration timer
  const startMaxDurationTimer = useCallback(() => {
    maxDurationTimerRef.current = setTimeout(() => {
      handleStopRecording();
    }, maxDuration);
  }, [maxDuration]);

  // Stop max duration timer
  const stopMaxDurationTimer = useCallback(() => {
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
  }, []);

  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    if (disabled || state.isRecording) return;

    try {
      setState(prev => ({ ...prev, error: null }));

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;

      // Create audio context for visualization
      if (showWaveform) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: format,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: format });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        onRecordingStop?.(audioBlob, audioUrl);
        
        // Clean up
        cleanup();
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        const error = `Recording error: ${(event as any).error}`;
        setState(prev => ({ ...prev, error }));
        onError?.(error);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      // Update state
      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
      }));

      // Start timers
      startDurationTimer();
      startMaxDurationTimer();

      // Start audio level updates
      if (showWaveform) {
        updateAudioLevel();
      }

      onRecordingStart?.();

    } catch (error: any) {
      const errorMessage = handleRecordingError(error);
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [
    disabled,
    state.isRecording,
    showWaveform,
    format,
    startDurationTimer,
    startMaxDurationTimer,
    updateAudioLevel,
    onRecordingStart,
    onRecordingStop,
    onError,
  ]);

  // Handle recording stop
  const handleStopRecording = useCallback(() => {
    if (!state.isRecording || !mediaRecorderRef.current) return;

    try {
      // Stop recording
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      // Stop timers
      stopDurationTimer();
      stopMaxDurationTimer();

      // Stop audio level updates
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Update state
      setState(prev => ({
        ...prev,
        isRecording: false,
        isPaused: false,
        audioLevel: 0,
      }));

    } catch (error: any) {
      const errorMessage = `Stop recording error: ${error.message}`;
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [
    state.isRecording,
    stopDurationTimer,
    stopMaxDurationTimer,
    onError,
  ]);

  // Handle recording pause/resume
  const handleTogglePause = useCallback(() => {
    if (!mediaRecorderRef.current || !state.isRecording) return;

    try {
      if (state.isPaused) {
        // Resume recording
        mediaRecorderRef.current.resume();
        startDurationTimer();
        if (showWaveform) {
          updateAudioLevel();
        }
        setState(prev => ({ ...prev, isPaused: false }));
        onRecordingResume?.();
      } else {
        // Pause recording
        mediaRecorderRef.current.pause();
        stopDurationTimer();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        setState(prev => ({ ...prev, isPaused: true, audioLevel: 0 }));
        onRecordingPause?.();
      }
    } catch (error: any) {
      const errorMessage = `Pause/Resume error: ${error.message}`;
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [
    state.isRecording,
    state.isPaused,
    startDurationTimer,
    stopDurationTimer,
    updateAudioLevel,
    showWaveform,
    onRecordingPause,
    onRecordingResume,
    onError,
  ]);

  // Handle recording errors
  const handleRecordingError = useCallback((error: any): string => {
    if (error.name === 'NotAllowedError') {
      return 'Microphone access denied. Please allow microphone access and try again.';
    }
    if (error.name === 'NotFoundError') {
      return 'No microphone found. Please connect a microphone and try again.';
    }
    if (error.name === 'NotReadableError') {
      return 'Microphone is being used by another application. Please close other apps and try again.';
    }
    if (error.name === 'OverconstrainedError') {
      return 'Microphone constraints cannot be satisfied. Please check your microphone settings.';
    }
    if (error.name === 'SecurityError') {
      return 'Security error. Please ensure you are using HTTPS.';
    }
    if (error.name === 'TypeError') {
      return 'Network error. Please check your internet connection and try again.';
    }
    return `Recording error: ${error.message || 'Unknown error occurred'}`;
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop timers
    stopDurationTimer();
    stopMaxDurationTimer();

    // Stop audio level updates
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear refs
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    analyserRef.current = null;
  }, [stopDurationTimer, stopMaxDurationTimer]);

  // Auto-start recording
  useEffect(() => {
    if (autoStart && browserSupport.isSupported && !state.isRecording) {
      handleStartRecording();
    }
  }, [autoStart, browserSupport.isSupported, state.isRecording, handleStartRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Format duration for display
  const formatDuration = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Check if recording meets minimum duration
  const meetsMinimumDuration = state.duration >= minDuration;

  // Browser support check
  if (!browserSupport.isSupported) {
    return (
      <div className={cn('text-center p-6 bg-red-50 border border-red-200 rounded-lg', className)}>
        <div className="text-red-600 text-lg mb-2">❌</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Audio Recording Not Supported</h3>
        <p className="text-red-700 text-sm">
          Your browser doesn't support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('w-full max-w-md mx-auto', className)}>
      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <div className="text-red-600 text-lg">⚠️</div>
            <div>
              <h4 className="text-red-800 font-semibold text-sm">Recording Error</h4>
              <p className="text-red-700 text-sm mt-1">{state.error}</p>
              <button
                onClick={() => setState(prev => ({ ...prev, error: null }))}
                className="text-red-600 hover:text-red-800 text-xs mt-2 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Status */}
      {state.isRecording && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-3 h-3 rounded-full',
                state.isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'
              )} />
              <span className="text-blue-800 font-medium text-sm">
                {state.isPaused ? 'Recording Paused' : 'Recording...'}
              </span>
            </div>
            {showDuration && (
              <span className="text-blue-700 font-mono text-sm">
                {formatDuration(state.duration)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Audio Level Visualization */}
      {showWaveform && state.isRecording && !state.isPaused && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="text-center mb-2">
            <span className="text-sm text-gray-600">Audio Level</span>
          </div>
          <div className="flex items-end justify-center space-x-1 h-16">
            {Array.from({ length: 10 }, (_, i) => {
              const threshold = (i + 1) * 0.1;
              const height = state.audioLevel >= threshold ? 
                Math.min(100, (state.audioLevel - threshold + 0.1) * 1000) : 20;
              
              return (
                <div
                  key={i}
                  className={cn(
                    'w-2 rounded-full transition-all duration-100',
                    state.audioLevel >= threshold ? 'bg-green-500' : 'bg-gray-300'
                  )}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {state.isRecording && maxDuration > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{formatDuration(state.duration)} / {formatDuration(maxDuration)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-100"
              style={{ width: `${Math.min(100, (state.duration / maxDuration) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!state.isRecording ? (
          /* Start Recording Button */
          <button
            onClick={handleStartRecording}
            disabled={disabled}
            className={cn(
              'btn-touch bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-full transition-all duration-200',
              'flex items-center justify-center space-x-2',
              'min-h-[60px] min-w-[60px] px-6 py-3',
              'shadow-lg hover:shadow-xl active:scale-95'
            )}
            aria-label="Start recording"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="font-semibold">Record</span>
          </button>
        ) : (
          /* Recording Active Controls */
          <>
            {/* Pause/Resume Button */}
            <button
              onClick={handleTogglePause}
              className={cn(
                'btn-touch rounded-full transition-all duration-200',
                'flex items-center justify-center',
                'min-h-[56px] min-w-[56px] px-4 py-3',
                'shadow-lg hover:shadow-xl active:scale-95',
                state.isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
              )}
              aria-label={state.isPaused ? 'Resume recording' : 'Pause recording'}
            >
              {state.isPaused ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1m-6 0h6" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>

            {/* Stop Recording Button */}
            <button
              onClick={handleStopRecording}
              disabled={!meetsMinimumDuration}
              className={cn(
                'btn-touch rounded-full transition-all duration-200',
                'flex items-center justify-center space-x-2',
                'min-h-[60px] min-w-[60px] px-6 py-3',
                'shadow-lg hover:shadow-xl active:scale-95',
                meetsMinimumDuration 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              )}
              aria-label="Stop recording"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span className="font-semibold">Stop</span>
            </button>
          </>
        )}
      </div>

      {/* Minimum Duration Warning */}
      {state.isRecording && !meetsMinimumDuration && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Record for at least {formatDuration(minDuration)} to save
          </p>
        </div>
      )}

      {/* Browser Compatibility Info */}
      {browserSupport.isIOSSafari && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            iOS Safari detected • Using MP4 format for best compatibility
          </p>
        </div>
      )}
    </div>
  );
}
