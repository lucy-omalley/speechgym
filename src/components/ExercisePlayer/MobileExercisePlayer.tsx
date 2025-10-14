"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useRealTimeSpeechRecognition } from '@/services/realTimeSpeechRecognition';
import { SpeechExercise, ExerciseType, DifficultyLevel } from '@/types';

// Props for the MobileExercisePlayer component
export interface MobileExercisePlayerProps {
  exercise: SpeechExercise;
  onComplete?: (result: ExerciseResult) => void;
  onSkip?: () => void;
  onExit?: () => void;
  className?: string;
  // Customization options
  showInstructions?: boolean;
  allowSkip?: boolean;
  autoStart?: boolean;
  enableHaptics?: boolean;
}

// Exercise result interface
export interface ExerciseResult {
  exerciseId: string;
  duration: number;
  score: number;
  audioLevel: number;
  completedAt: Date;
  recordingUrl?: string;
  // Enhanced metrics from speech recognition
  wordCount?: number;
  wordsPerMinute?: number;
  confidence?: number;
  transcript?: string;
}

// Countdown timer component
interface CountdownTimerProps {
  duration: number;
  onComplete: () => void;
  onTick?: (remaining: number) => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  duration, 
  onComplete, 
  onTick, 
  className 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle completion asynchronously to avoid setState during render
  useEffect(() => {
    if (isComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000;
        onTick?.(newTime);
        
        if (newTime <= 0) {
          clearInterval(intervalRef.current!);
          setIsComplete(true);
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [onTick]);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;
  const isWarning = timeLeft <= 10000; // Last 10 seconds

  return (
    <div className={cn(
      'flex flex-col items-center justify-center',
      'w-32 h-32 rounded-full border-4',
      'transition-all duration-300',
      isWarning 
        ? 'border-red-500 bg-red-50 text-red-700' 
        : 'border-blue-500 bg-blue-50 text-blue-700',
      className
    )}>
      <div 
        className="absolute inset-0 rounded-full border-4 border-transparent"
        style={{
          background: `conic-gradient(from 0deg, ${
            isWarning ? '#EF4444' : '#3B82F6'
          } ${progress * 3.6}deg, #E5E7EB 0deg)`
        }}
      />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs opacity-75">
          {timeLeft <= 10000 ? 'Final' : 'Remaining'}
        </div>
      </div>
    </div>
  );
};

// Audio level visualization component
interface AudioVisualizationProps {
  audioLevel: number;
  isRecording: boolean;
  className?: string;
}

const AudioVisualization: React.FC<AudioVisualizationProps> = ({ 
  audioLevel, 
  isRecording, 
  className 
}) => {
  const bars = Array.from({ length: 20 }, (_, i) => {
    const height = Math.max(4, (audioLevel * 100) * (i + 1) / 20);
    const isActive = audioLevel > i / 20;
    
    return (
      <div
        key={i}
        className={cn(
          'w-1 rounded-full transition-all duration-100',
          isActive && isRecording
            ? 'bg-blue-500' 
            : 'bg-gray-300',
          className
        )}
        style={{ height: `${height}px` }}
      />
    );
  });

  return (
    <div className={cn(
      'flex items-end justify-center space-x-1 h-20',
      'p-4 bg-white rounded-lg shadow-lg',
      className
    )}>
      {bars}
    </div>
  );
};

// Real-time feedback display
interface RealtimeFeedbackProps {
  audioLevel: number;
  duration: number;
  wordCount?: number;
  pace?: number;
  speechMetrics?: any;
  confidence?: number;
  isSpeaking?: boolean;
  currentTranscript?: string;
  finalTranscript?: string;
  speechRecognitionSupported?: boolean;
  isListening?: boolean;
  speechError?: string | null;
  className?: string;
}

const RealtimeFeedback: React.FC<RealtimeFeedbackProps> = ({
  audioLevel,
  duration,
  wordCount = 0,
  pace = 0,
  speechMetrics,
  confidence = 0,
  isSpeaking = false,
  currentTranscript = '',
  finalTranscript = '',
  speechRecognitionSupported = false,
  isListening = false,
  speechError = null,
  className,
}) => {
  const audioLevelPercentage = Math.round(audioLevel * 100);
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);

  return (
    <div className={cn(
      'relative overflow-hidden bg-white rounded-3xl shadow-2xl p-6 border border-gray-100',
      className
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-full translate-y-12 -translate-x-12"></div>
      
      <div className="relative">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm">📊</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">Live Feedback</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {audioLevelPercentage}%
            </div>
            <div className="text-sm font-semibold text-blue-700">Audio Level</div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 h-3 rounded-full transition-all duration-200 shadow-lg"
                style={{ width: `${Math.max(audioLevelPercentage, 5)}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {audioLevelPercentage > 80 ? 'Loud' : audioLevelPercentage > 50 ? 'Good' : audioLevelPercentage > 20 ? 'Soft' : 'Quiet'}
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm font-semibold text-green-700">Duration</div>
            <div className="flex items-center justify-center mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {wordCount > 0 && (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {wordCount}
                </div>
                <div className="text-sm font-semibold text-purple-700">Words</div>
                <div className="flex items-center justify-center mt-2">
                  <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-purple-500 animate-pulse' : 'bg-purple-300'}`}></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {Math.round(pace)}
                </div>
                <div className="text-sm font-semibold text-orange-700">WPM</div>
                <div className="flex items-center justify-center mt-2">
                  <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-orange-500 animate-pulse' : 'bg-orange-300'}`}></div>
                </div>
              </div>

              {speechMetrics && (
                <>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {Math.round(confidence * 100)}%
                    </div>
                    <div className="text-sm font-semibold text-green-700">Confidence</div>
                    <div className="flex items-center justify-center mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {speechMetrics.rhythmScore}
                    </div>
                    <div className="text-sm font-semibold text-blue-700">Rhythm</div>
                    <div className="flex items-center justify-center mt-2">
                      <div className={`w-2 h-2 rounded-full ${speechMetrics.rhythmScore > 80 ? 'bg-blue-500' : speechMetrics.rhythmScore > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>



      </div>
    </div>
  );
};

// Large touch button component
interface TouchButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'large' | 'extra-large';
  icon?: React.ReactNode;
  label: string;
  className?: string;
}

const TouchButton: React.FC<TouchButtonProps> = ({
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'large',
  icon,
  label,
  className,
}) => {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 active:from-gray-800 active:to-gray-900 text-white shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 text-white shadow-lg hover:shadow-xl',
    warning: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 active:from-yellow-800 active:to-orange-800 text-white shadow-lg hover:shadow-xl',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 active:from-red-800 active:to-pink-800 text-white shadow-lg hover:shadow-xl',
  };

  const sizeClasses = {
    large: 'min-h-[56px] min-w-[56px] px-6 py-3 text-lg',
    'extra-large': 'min-h-[72px] min-w-[72px] px-8 py-4 text-xl',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-center justify-center',
        'rounded-2xl font-semibold transition-all duration-300',
        'focus:outline-none focus:ring-4 focus:ring-opacity-50',
        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        'transform hover:-translate-y-1 disabled:transform-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      aria-label={label}
    >
      {icon && <div className="mb-1">{icon}</div>}
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
};

// Main MobileExercisePlayer component
export const MobileExercisePlayer: React.FC<MobileExercisePlayerProps> = ({
  exercise,
  onComplete,
  onSkip,
  onExit,
  className,
  showInstructions = true,
  allowSkip = true,
  autoStart = false,
  enableHaptics = true,
}) => {
  const [phase, setPhase] = useState<'preparation' | 'countdown' | 'recording' | 'completed'>('preparation');
  const [countdownTime, setCountdownTime] = useState(3000); // 3 seconds
  const [exerciseStartTime, setExerciseStartTime] = useState<number | null>(null);
  
  const exerciseResultRef = useRef<ExerciseResult | null>(null);

  // Audio recording hook for audio capture
  const {
    isRecording,
    isPaused,
    hasPermission,
    error,
    audioLevel,
    duration: recordingDuration,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    requestPermission,
    reset,
  } = useSpeechRecognition({
    maxDuration: exercise.estimatedDuration,
    enableRealTimeProcessing: true,
    onError: (error) => {
      console.error('Recording error:', error);
      if (enableHaptics && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]); // Error pattern
      }
    },
  });

  // Real-time speech recognition for accurate metrics
  const {
    isListening,
    isSupported: speechRecognitionSupported,
    error: speechError,
    currentTranscript,
    finalTranscript,
    confidence,
    metrics: speechMetrics,
    startListening,
    stopListening,
    pauseListening: pauseSpeechRecognition,
    resumeListening: resumeSpeechRecognition,
    reset: resetSpeechRecognition,
  } = useRealTimeSpeechRecognition({
    language: 'en-US',
    continuous: true,
    interimResults: true,
  });

  // Use speech recognition metrics for real-time feedback
  const wordCount = speechMetrics.wordCount;
  const pace = speechMetrics.wordsPerMinute;

  // Debug speech recognition state
  useEffect(() => {
    console.log('Speech Recognition State:', {
      isListening,
      isSupported: speechRecognitionSupported,
      error: speechError,
      currentTranscript,
      finalTranscript,
      confidence,
      wordCount,
      pace,
      isSpeaking: speechMetrics.isSpeaking
    });
  }, [isListening, speechRecognitionSupported, speechError, currentTranscript, finalTranscript, confidence, wordCount, pace, speechMetrics.isSpeaking]);

  // Debug phase state
  useEffect(() => {
    console.log('Current Phase:', phase, 'Recording State:', {
      isRecording,
      isPaused,
      hasPermission,
      recordingDuration,
      audioLevel
    });
  }, [phase, isRecording, isPaused, hasPermission, recordingDuration, audioLevel]);

  // Debug transcript values
  useEffect(() => {
    console.log('Transcript Debug:', {
      currentTranscript: currentTranscript,
      finalTranscript: finalTranscript,
      currentLength: currentTranscript?.length || 0,
      finalLength: finalTranscript?.length || 0,
      hasCurrent: !!currentTranscript,
      hasFinal: !!finalTranscript,
      confidence: confidence
    });
  }, [currentTranscript, finalTranscript, confidence]);

  // Debug recording phase rendering
  useEffect(() => {
    if (phase === 'recording') {
      console.log('Recording phase is active - Your Speech box should be visible');
    }
  }, [phase]);

  // Debug browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition ||
                               (window as any).mozSpeechRecognition ||
                               (window as any).msSpeechRecognition;
      console.log('Browser Speech Recognition Support:', {
        SpeechRecognition: !!SpeechRecognition,
        SpeechRecognitionConstructor: SpeechRecognition?.name,
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        hostname: window.location.hostname
      });
    }
  }, []);

  // Handle exercise phases
  const handleStartExercise = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    setPhase('countdown');
    setCountdownTime(3000);
    
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(100); // Start vibration
    }
  }, [hasPermission, requestPermission, enableHaptics]);

  const handleCountdownComplete = useCallback(async () => {
    console.log('Countdown completed - starting recording and speech recognition');
    setPhase('recording');
    setExerciseStartTime(Date.now());
    
    // Start both audio recording and speech recognition
    try {
      await Promise.all([
        startRecording(),
        speechRecognitionSupported ? startListening() : Promise.resolve()
      ]);
      console.log('Recording and speech recognition started successfully');
    } catch (error) {
      console.error('Error starting recording/speech recognition:', error);
    }
    
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]); // Recording start pattern
    }
  }, [startRecording, startListening, speechRecognitionSupported, enableHaptics]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    stopListening();
    setPhase('completed');
    
    // Calculate exercise result using speech recognition metrics
    const endTime = Date.now();
    const totalDuration = exerciseStartTime ? endTime - exerciseStartTime : recordingDuration;
    
    exerciseResultRef.current = {
      exerciseId: exercise.id,
      duration: totalDuration,
      score: Math.round(speechMetrics.rhythmScore || audioLevel * 100),
      audioLevel: audioLevel,
      completedAt: new Date(),
      recordingUrl: audioUrl || undefined,
      // Enhanced metrics from speech recognition
      wordCount: speechMetrics.wordCount,
      wordsPerMinute: speechMetrics.wordsPerMinute,
      confidence: confidence,
      transcript: finalTranscript,
    };
    
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]); // Success pattern
    }
  }, [stopRecording, stopListening, exerciseStartTime, recordingDuration, audioLevel, audioUrl, exercise.id, enableHaptics, speechMetrics, confidence, finalTranscript]);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeRecording();
      if (speechRecognitionSupported) {
        resumeSpeechRecognition();
      }
      if (enableHaptics && 'vibrate' in navigator) {
        navigator.vibrate(50); // Resume vibration
      }
    } else {
      pauseRecording();
      if (speechRecognitionSupported) {
        pauseSpeechRecognition();
      }
      if (enableHaptics && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]); // Pause pattern
      }
    }
  }, [isPaused, pauseRecording, resumeRecording, pauseSpeechRecognition, resumeSpeechRecognition, speechRecognitionSupported, enableHaptics]);

  const handleComplete = useCallback(() => {
    if (exerciseResultRef.current) {
      onComplete?.(exerciseResultRef.current);
    }
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    reset();
    onSkip?.();
  }, [reset, onSkip]);

  const handleExit = useCallback(() => {
    // Clean up any ongoing processes
    if (isRecording) {
      stopRecording();
    }
    if (isListening) {
      stopListening();
    }
    
    // Reset both services
    reset();
    resetSpeechRecognition();
    
    // Call the exit callback
    onExit?.();
  }, [reset, onExit, isRecording, stopRecording, isListening, stopListening, resetSpeechRecognition]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && hasPermission && phase === 'preparation') {
      const timer = setTimeout(() => {
        handleStartExercise();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, hasPermission, phase, handleStartExercise]);

  // Render exercise-specific content
  const renderExerciseContent = () => {
    switch (exercise.type) {
      case 'breathing':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <span className="text-3xl">🫁</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Breathing Exercise</h2>
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-2xl md:max-w-4xl mx-auto border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">🌬️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Breathe Mindfully</h3>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Follow the breathing pattern and maintain steady rhythm. Focus on controlled, deep breaths.
                </p>
                <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <span>Inhale Slowly</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Hold Steady</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span>Exhale Gently</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'pacing':
        return (
          <div className="text-center space-y-8 w-full max-w-6xl mx-auto">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <span className="text-4xl">⏱️</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Pacing Exercise</h2>
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl p-8 md:p-10 w-full border border-gray-100">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 rounded-full translate-y-16 -translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">📖</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Read Aloud</h3>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 mb-6">
                  <p className="text-xl md:text-2xl lg:text-3xl text-gray-800 leading-relaxed font-medium max-w-4xl mx-auto">
                    {(exercise as any).text || 'Read the text at a comfortable pace'}
                  </p>
                  <div className="mt-6 p-4 bg-white/70 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">💡</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800">Practice Instructions</h4>
                    </div>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed font-medium">
                      Practice speaking at different speeds with clear pronunciation and steady rhythm. Focus on maintaining consistent pace throughout the text.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-blue-700">Target Pace</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{(exercise as any).targetPace || 120} WPM</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-semibold text-green-700">Focus</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">Clear & Steady</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'repetition':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <span className="text-3xl">🔄</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Repetition Exercise</h2>
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-2xl md:max-w-4xl mx-auto border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">🗣️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Repeat Clearly</h3>
                </div>
                <p className="text-xl md:text-2xl font-semibold text-purple-800 mb-4 leading-relaxed">
                  {(exercise as any).text || 'Repeat this phrase clearly'}
                </p>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4">
                  <p className="text-lg font-semibold text-purple-700">
                    Repetition {(exercise as any).currentRepetition || 0} of {(exercise as any).requiredRepetitions || 5}
                  </p>
                  <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(((exercise as any).currentRepetition || 0) / ((exercise as any).requiredRepetitions || 5)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'freeSpeech':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <span className="text-3xl">💬</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Free Speech</h2>
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-2xl md:max-w-4xl mx-auto border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">🎯</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Speak Freely</h3>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                  <p className="text-lg md:text-xl font-semibold text-green-800 mb-4">
                    Topic: {(exercise as any).topic || 'Your topic here'}
                  </p>
                  <div className="space-y-3">
                    {(exercise as any).talkingPoints?.slice(0, 3).map((point: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <p className="text-sm text-green-700">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-gray-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <span className="text-3xl">📝</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{(exercise as any).name || 'Exercise'}</h2>
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-2xl md:max-w-4xl mx-auto border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-500/10 to-gray-600/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <p className="text-lg text-gray-700 leading-relaxed">{(exercise as any).description || 'Complete this exercise'}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  // Check if we're on desktop
  const [isDesktop, setIsDesktop] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // Mark as client-side
    setIsClient(true);
    
    const checkDesktop = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        const desktop = width >= 768;
        console.log('Screen width:', width, 'Desktop:', desktop);
        setIsDesktop(desktop);
      }
    };
    
    // Initial check with a small delay to ensure DOM is ready
    const timer = setTimeout(checkDesktop, 100);
    
    // Add resize listener
    window.addEventListener('resize', checkDesktop);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkDesktop);
    };
  }, []);

  return (
    <div className={cn(
      'fixed inset-0 z-40 bg-gradient-to-br from-indigo-50 via-white to-cyan-50',
      'flex flex-col safe-area-top safe-area-bottom relative overflow-hidden',
      'min-h-screen h-screen',
      // Account for existing navigation sidebar on desktop
      'md:left-64 md:w-[calc(100%-16rem)]',
      className
    )}>
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
      
      {/* Debug: Show current breakpoint */}
      {isClient && (
        <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-2 py-1 rounded text-xs">
          {isDesktop ? 'Desktop' : 'Mobile'} ({typeof window !== 'undefined' ? window.innerWidth : 'N/A'}px)
        </div>
      )}
      
      {/* Mobile Header */}
      <div className={cn(
        'relative flex items-center justify-between p-4 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg',
        'md:hidden',
        !isDesktop ? 'flex' : 'hidden'
      )}>
        <button
          onClick={handleExit}
          className="group flex items-center justify-center w-12 h-12 bg-white/80 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          aria-label="Exit exercise"
        >
          <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">{exercise.name}</h1>
          <div className="flex items-center justify-center space-x-2 mt-1">
            <span className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold',
              exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
              exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            )}>
              {exercise.difficulty}
            </span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500 capitalize">{exercise.type}</span>
          </div>
        </div>
        
        {allowSkip && phase !== 'completed' && (
          <button
            onClick={handleSkip}
            className="group flex items-center justify-center w-12 h-12 bg-white/80 hover:bg-white border border-gray-200 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            aria-label="Skip exercise"
          >
            <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Desktop Header - Show exercise info in header instead of sidebar */}
      {isDesktop && (
        <div className="w-full bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExit}
                className="group flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300"
                aria-label="Exit exercise"
              >
                <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">{exercise.name}</h1>
                <div className="flex items-center space-x-3">
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  )}>
                    {exercise.difficulty}
                  </span>
                  <span className="text-sm text-gray-500 capitalize">{exercise.type}</span>
                </div>
              </div>
            </div>
            
            {allowSkip && phase !== 'completed' && (
              <button
                onClick={handleSkip}
                className="group flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-300"
                aria-label="Skip exercise"
              >
                <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col items-center justify-start pt-20 md:pt-24 p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto">
        {/* Debug Phase Indicator - Remove in production */}
        <div className="fixed top-32 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm z-50">
          Phase: {phase} | Recording: {isRecording ? 'Yes' : 'No'} | Listening: {isListening ? 'Yes' : 'No'}
        </div>
        {phase === 'preparation' && (
          <>
            {renderExerciseContent()}
            
            <div className="flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-8 w-full max-w-4xl mx-auto">
              {!hasPermission && (
                <div className="w-full md:w-auto">
                  <TouchButton
                    onClick={requestPermission}
                    variant="warning"
                    size="extra-large"
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>}
                    label="Grant Microphone Permission"
                    className="w-full md:w-auto min-w-[300px]"
                  />
                </div>
              )}
              
              {hasPermission && (
                <div className="w-full md:w-auto">
                  <TouchButton
                    onClick={handleStartExercise}
                    variant="primary"
                    size="extra-large"
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-8V5a2 2 0 114 0v1" />
                    </svg>}
                    label="Start Exercise"
                    className="w-full md:w-auto min-w-[300px]"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {phase === 'countdown' && (
          <div className="flex flex-col items-center space-y-8">
            <CountdownTimer
              duration={countdownTime}
              onComplete={handleCountdownComplete}
              onTick={(remaining) => {
                if (remaining <= 1000 && enableHaptics && 'vibrate' in navigator) {
                  navigator.vibrate(100); // Final countdown vibration
                }
              }}
            />
            <div className="text-center max-w-md">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Get Ready!</h2>
              <p className="text-lg text-gray-600">Exercise will start in a moment</p>
            </div>
          </div>
        )}

        {phase === 'recording' && (
          <div className="w-full max-w-6xl space-y-6">
            {/* Audio Visualization */}
            <AudioVisualization
              audioLevel={audioLevel}
              isRecording={isRecording && !isPaused}
            />
            
            {/* Live Speech Transcript - Most Prominent */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border-2 border-blue-300 shadow-lg w-full max-w-5xl mx-auto relative">
              {/* Always visible indicator */}
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                !
              </div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-lg">🎤</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Your Speech - LIVE TRANSCRIPT</h3>
                {speechMetrics.isSpeaking && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">Speaking</span>
                  </div>
                )}
                {isListening && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-600 font-medium">Listening</span>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-2xl p-6 border border-blue-200 min-h-[150px] shadow-inner">
                {(currentTranscript || finalTranscript) ? (
                  <div className="text-gray-800 leading-relaxed text-xl">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="text-lg font-medium text-gray-700 mb-2">Confirmed Words:</div>
                      <span className="font-semibold text-gray-900 text-xl">{finalTranscript || 'No words confirmed yet...'}</span>
                    </div>
                    {currentTranscript && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-lg font-medium text-blue-700 mb-2">Currently Speaking:</div>
                        <span className="text-blue-600 font-bold text-xl">{currentTranscript}</span>
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {finalTranscript && `Words: ${finalTranscript.split(' ').filter(w => w.trim()).length} | Characters: ${finalTranscript.length}`}
                      </div>
                      {confidence > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Confidence:</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-600">{Math.round(confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 h-full flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-xl font-medium mb-2">Start speaking...</p>
                    <p className="text-sm">Your words will appear here in real-time</p>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium">
                        📍 SPEECH BOX IS VISIBLE - Ready to capture your words!
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col md:flex-row gap-3 justify-center">
                      <button 
                        onClick={() => {
                          console.log('Manual start speech recognition test');
                          if (speechRecognitionSupported) {
                            startListening();
                          } else {
                            console.log('Speech recognition not supported');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        🎤 Test Speech Recognition
                      </button>
                      <button 
                        onClick={() => {
                          console.log('Manual stop speech recognition test');
                          stopListening();
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        🛑 Stop Recognition
                      </button>
                    </div>
                    {!speechRecognitionSupported && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          Speech recognition not available in this browser
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Feedback */}
            <RealtimeFeedback
              audioLevel={audioLevel}
              duration={recordingDuration}
              wordCount={wordCount}
              pace={pace}
              speechMetrics={speechMetrics}
              confidence={confidence}
              isSpeaking={speechMetrics.isSpeaking}
              currentTranscript={currentTranscript}
              finalTranscript={finalTranscript}
              speechRecognitionSupported={speechRecognitionSupported}
              isListening={isListening}
              speechError={speechError}
            />

            {/* Fallback Visual Feedback - Always visible during recording */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-3xl p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Recording Status</h3>
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {isRecording ? 'Recording' : 'Not Recording'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full ${speechRecognitionSupported ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      Speech Recognition: {speechRecognitionSupported ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {Math.round(audioLevel * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">Audio Level</div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 h-3 rounded-full transition-all duration-200 shadow-lg"
                      style={{ width: `${Math.max(Math.round(audioLevel * 100), 5)}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {Math.round(audioLevel * 100) > 80 ? 'Loud' : Math.round(audioLevel * 100) > 50 ? 'Good' : Math.round(audioLevel * 100) > 20 ? 'Soft' : 'Quiet'}
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {Math.floor(recordingDuration / 60000)}:{(Math.floor((recordingDuration % 60000) / 1000)).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-600">Duration</div>
                </div>
                
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {wordCount}
                  </div>
                  <div className="text-xs text-gray-600">Words</div>
                </div>
                
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {Math.round(pace)}
                  </div>
                  <div className="text-xs text-gray-600">WPM</div>
                </div>
              </div>
            </div>
            
            {/* Exercise Content */}
            <div className="text-center">
              {renderExerciseContent()}
            </div>

            {/* Real-time Guidance */}
            {speechMetrics && (
              <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-green-200">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-full -translate-y-12 translate-x-12"></div>
                <div className="relative">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm">🎯</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">AI Guidance</h4>
                    {speechRecognitionSupported && isListening && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pace Guidance */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">⚡</span>
                        <span className="font-semibold text-gray-800">Pace</span>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold mb-1 ${
                          pace > 0 ? (
                            pace < 100 ? 'text-blue-600' : 
                            pace <= 160 ? 'text-green-600' : 'text-orange-600'
                          ) : 'text-gray-400'
                        }`}>
                          {pace > 0 ? Math.round(pace) : '--'} WPM
                        </div>
                        <div className="text-sm">
                          {pace > 0 ? (
                            pace < 100 ? '🐌 Too slow - try speaking faster' :
                            pace <= 160 ? '✅ Perfect pace!' :
                            '🏃 Too fast - slow down a bit'
                          ) : 'Start speaking to see pace feedback'}
                        </div>
                      </div>
                    </div>

                    {/* Rhythm Guidance */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">🎵</span>
                        <span className="font-semibold text-gray-800">Rhythm</span>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold mb-1 ${
                          speechMetrics.rhythmScore > 0 ? (
                            speechMetrics.rhythmScore > 80 ? 'text-green-600' :
                            speechMetrics.rhythmScore > 60 ? 'text-yellow-600' : 'text-red-600'
                          ) : 'text-gray-400'
                        }`}>
                          {speechMetrics.rhythmScore > 0 ? speechMetrics.rhythmScore : '--'}
                        </div>
                        <div className="text-sm">
                          {speechMetrics.rhythmScore > 0 ? (
                            speechMetrics.rhythmScore > 80 ? '🎯 Excellent rhythm!' :
                            speechMetrics.rhythmScore > 60 ? '📈 Good, keep going' :
                            '🔄 Work on consistency'
                          ) : 'Speaking rhythm will appear here'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overall Feedback */}
                  {wordCount > 5 && (
                    <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">💬</span>
                        <span className="font-semibold text-gray-800">Live Feedback</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {confidence > 0.8 ? (
                          <span className="text-green-600">🎉 Great clarity! Keep it up!</span>
                        ) : confidence > 0.6 ? (
                          <span className="text-yellow-600">📢 Good speech, try speaking a bit clearer</span>
                        ) : (
                          <span className="text-red-600">🔊 Speak louder and more clearly</span>
                        )}
                        {speechMetrics.pauseCount > 10 && (
                          <span className="block mt-1 text-blue-600">💡 Try to reduce pauses for better flow</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Instructions during recording */}
            <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-blue-200">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="relative">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm">💡</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">Practice Tips</h4>
                </div>
                <div className="text-center">
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed font-medium">
                    {exercise.type === 'pacing' && 'Practice speaking at different speeds with clear pronunciation and steady rhythm. Maintain consistent pace and focus on clarity.'}
                    {exercise.type === 'repetition' && 'Repeat each word clearly and accurately. Focus on proper articulation and pronunciation.'}
                    {exercise.type === 'freeSpeech' && 'Speak naturally and clearly. Express your thoughts with confidence and proper pacing.'}
                    {exercise.type === 'breathing' && 'Follow the breathing pattern. Inhale and exhale as indicated with controlled rhythm.'}
                    {!['pacing', 'repetition', 'freeSpeech', 'breathing'].includes(exercise.type) && 'Speak clearly and follow the exercise instructions with proper pacing and pronunciation.'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex justify-center space-x-4">
              <TouchButton
                onClick={handlePauseResume}
                variant={isPaused ? 'success' : 'warning'}
                size="large"
                icon={
                  isPaused ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-8V5a2 2 0 114 0v1" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                }
                label={isPaused ? 'Resume' : 'Pause'}
              />
              
              <TouchButton
                onClick={handleStopRecording}
                variant="danger"
                size="large"
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>}
                label="Stop"
              />
            </div>
          </div>
        )}

        {phase === 'completed' && (
          <div className="text-center space-y-8 w-full max-w-6xl mx-auto">
            <div className="text-8xl md:text-9xl lg:text-[12rem]">🎉</div>
            
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full border border-gray-100">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full translate-y-16 -translate-x-16"></div>
              
              <div className="relative">
                <div className="flex items-center justify-center space-x-3 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-xl">
                    <span className="text-white text-2xl">🏆</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-green-600">Exercise Complete!</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 text-center">
                    <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                      {Math.round(exerciseResultRef.current?.score || 0)}%
                    </div>
                    <div className="text-lg font-semibold text-blue-700">Score</div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(exerciseResultRef.current?.score || 0)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 text-center">
                    <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                      {Math.floor((exerciseResultRef.current?.duration || 0) / 1000)}s
                    </div>
                    <div className="text-lg font-semibold text-green-700">Duration</div>
                    <div className="flex items-center justify-center mt-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 text-center">
                    <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                      {wordCount}
                    </div>
                    <div className="text-lg font-semibold text-purple-700">Words</div>
                    <div className="flex items-center justify-center mt-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 text-center">
                    <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">
                      {Math.round(pace)}
                    </div>
                    <div className="text-lg font-semibold text-orange-700">WPM</div>
                    <div className="flex items-center justify-center mt-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-sm">✨</span>
                    </div>
                    <h3 className="text-xl font-bold text-green-800">Great Job!</h3>
                  </div>
                  <p className="text-lg text-green-700">
                    You've completed the exercise successfully. Keep practicing to improve your speech skills!
                  </p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
                  <TouchButton
                    onClick={handleComplete}
                    variant="success"
                    size="extra-large"
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>}
                    label="Continue"
                  />
                  
                  <TouchButton
                    onClick={handleExit}
                    variant="secondary"
                    size="extra-large"
                    icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>}
                    label="Exit"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileExercisePlayer;
