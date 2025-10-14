"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { SpeechExercise, ExerciseType, DifficultyLevel } from '@/types';
import { useProgress } from '@/hooks/useProgress';
import { speechAnalysisService } from '@/services/speechAnalysis';

// Exercise step interface
interface ExerciseStep {
  id: string;
  type: 'instruction' | 'countdown' | 'recording' | 'feedback' | 'complete';
  title: string;
  description?: string;
  duration?: number; // in milliseconds
  audioUrl?: string;
  text?: string;
  targetPace?: number;
  repetitions?: number;
}

// Exercise result interface
interface ExerciseResult {
  exerciseId: string;
  exerciseType: ExerciseType;
  completedAt: Date;
  duration: number;
  stepsCompleted: number;
  totalSteps: number;
  audioBlob?: Blob;
  audioUrl?: string;
  metrics: {
    fluencyScore: number;
    clarityScore: number;
    confidenceScore: number;
    wordsPerMinute?: number;
    repetitions?: number;
    pauses?: number;
  };
  feedback: string[];
  notes?: string;
}

// Exercise engine props
interface ExerciseEngineProps {
  exercise: SpeechExercise;
  onComplete: (result: ExerciseResult) => void;
  onCancel: () => void;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
}

// Swipe gesture hook
const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const isLeftSwipe = deltaX > threshold;
    const isRightSwipe = deltaX < -threshold;
    const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);

    if (isLeftSwipe && !isVerticalSwipe) {
      onSwipeLeft?.();
    }
    if (isRightSwipe && !isVerticalSwipe) {
      onSwipeRight?.();
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};

export default function ExerciseEngine({
  exercise,
  onComplete,
  onCancel,
  onStepChange,
  className,
}: ExerciseEngineProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exerciseSteps, setExerciseSteps] = useState<ExerciseStep[]>([]);
  const [result, setResult] = useState<Partial<ExerciseResult>>({});
  
  const { addSessionFromAnalysis } = useProgress();
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Speech recognition setup
  const {
    isRecording,
    isPaused,
    hasPermission,
    error: recordingError,
    audioLevel,
    duration: recordingDuration,
    audioUrl,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset: resetRecording,
  } = useSpeechRecognition({
    maxDuration: exercise.duration * 1000 || 60000,
    audioLevelThreshold: 0.1,
    enableRealTimeProcessing: true,
    onError: (error) => setError(error),
  });

  // Generate exercise steps based on exercise type
  const generateExerciseSteps = useCallback((exercise: SpeechExercise): ExerciseStep[] => {
    const steps: ExerciseStep[] = [];
    
    // Add instruction step
    steps.push({
      id: 'instruction',
      type: 'instruction',
      title: 'Get Ready',
      description: exercise.description,
    });

    // Add countdown step
    steps.push({
      id: 'countdown',
      type: 'countdown',
      title: 'Starting Soon',
      description: 'Get ready to begin...',
      duration: 3000,
    });

    // Add recording step based on exercise type
    let recordingStep: ExerciseStep;
    
    switch (exercise.type) {
      case 'breathing':
        recordingStep = {
          id: 'recording',
          type: 'recording',
          title: 'Breathing Exercise',
          description: 'Take slow, deep breaths as instructed',
          duration: exercise.duration * 1000,
        };
        break;
      case 'pacing':
        recordingStep = {
          id: 'recording',
          type: 'recording',
          title: 'Pacing Practice',
          description: `Speak at ${exercise.targetPace || 120} words per minute`,
          text: exercise.text,
          targetPace: exercise.targetPace,
          duration: exercise.duration * 1000,
        };
        break;
      case 'repetition':
        recordingStep = {
          id: 'recording',
          type: 'recording',
          title: 'Repetition Practice',
          description: `Repeat each phrase ${exercise.targetRepetitions || 3} times clearly`,
          text: exercise.text,
          repetitions: exercise.targetRepetitions,
          duration: exercise.duration * 1000,
        };
        break;
      case 'freeSpeech':
        recordingStep = {
          id: 'recording',
          type: 'recording',
          title: 'Free Speech',
          description: exercise.prompt || 'Speak freely about any topic',
          duration: exercise.duration * 1000,
        };
        break;
      default:
        recordingStep = {
          id: 'recording',
          type: 'recording',
          title: 'Speech Practice',
          description: 'Speak clearly and confidently',
          duration: exercise.duration * 1000,
        };
    }
    
    steps.push(recordingStep);

    // Add feedback step
    steps.push({
      id: 'feedback',
      type: 'feedback',
      title: 'Processing Results',
      description: 'Analyzing your speech...',
    });

    // Add completion step
    steps.push({
      id: 'complete',
      type: 'complete',
      title: 'Exercise Complete!',
      description: 'Great job! Check your results below.',
    });

    return steps;
  }, []);

  // Initialize exercise steps
  useEffect(() => {
    const steps = generateExerciseSteps(exercise);
    setExerciseSteps(steps);
  }, [exercise, generateExerciseSteps]);

  // Handle step progression
  const nextStep = useCallback(() => {
    if (currentStepIndex < exerciseSteps.length - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      onStepChange?.(newIndex);
    }
  }, [currentStepIndex, exerciseSteps.length, onStepChange]);

  // Handle step completion
  useEffect(() => {
    const currentStep = exerciseSteps[currentStepIndex];
    if (!currentStep) return;

    // Clear any existing timeouts
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }

    switch (currentStep.type) {
      case 'countdown':
        // Auto-advance after countdown
        stepTimeoutRef.current = setTimeout(() => {
          nextStep();
        }, currentStep.duration || 3000);
        break;
        
      case 'recording':
        // Start recording automatically
        if (hasPermission) {
          setTimeout(() => {
            startRecording();
          }, 500);
        }
        break;
        
      case 'feedback':
        // Process results
        processResults();
        break;
    }

    return () => {
      if (stepTimeoutRef.current) {
        clearTimeout(stepTimeoutRef.current);
      }
    };
  }, [currentStepIndex, exerciseSteps, hasPermission, startRecording, nextStep]);

  // Process exercise results
  const processResults = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!audioUrl) {
        throw new Error('No audio recorded');
      }

      // Convert audio URL to blob
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();

      // Analyze speech
      const analysisResult = await speechAnalysisService.analyzeSpeech(audioBlob, {
        language: 'en',
        enableOfflineMode: true,
        cacheResults: true,
      });

      // Create exercise result
      const exerciseResult: ExerciseResult = {
        exerciseId: exercise.id,
        exerciseType: exercise.type,
        completedAt: new Date(),
        duration: recordingDuration,
        stepsCompleted: currentStepIndex + 1,
        totalSteps: exerciseSteps.length,
        audioBlob,
        audioUrl,
        metrics: {
          fluencyScore: analysisResult.fluency.fluencyScore,
          clarityScore: analysisResult.fluency.clarityScore,
          confidenceScore: analysisResult.fluency.confidenceScore,
          wordsPerMinute: analysisResult.fluency.wordsPerMinute,
          repetitions: analysisResult.fluency.repetitions.length,
          pauses: analysisResult.fluency.pauses.length,
        },
        feedback: analysisResult.recommendations,
      };

      setResult(exerciseResult);

      // Save to progress tracking
      await addSessionFromAnalysis(
        exercise.id,
        exercise.type,
        analysisResult,
        {
          notes: `Completed ${exercise.title}`,
          audioUrl,
        }
      );

      // Move to completion step
      setTimeout(() => {
        nextStep();
      }, 2000);

    } catch (error) {
      console.error('Error processing results:', error);
      setError(error instanceof Error ? error.message : 'Failed to process results');
      
      // Still move to completion with basic result
      const basicResult: ExerciseResult = {
        exerciseId: exercise.id,
        exerciseType: exercise.type,
        completedAt: new Date(),
        duration: recordingDuration,
        stepsCompleted: currentStepIndex + 1,
        totalSteps: exerciseSteps.length,
        audioUrl,
        metrics: {
          fluencyScore: 0,
          clarityScore: 0,
          confidenceScore: 0,
        },
        feedback: ['Exercise completed successfully!'],
      };

      setResult(basicResult);
      setTimeout(() => nextStep(), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle exercise completion
  const handleComplete = () => {
    if (result.exerciseId) {
      onComplete(result as ExerciseResult);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    
    // Clear timeouts
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
    if (stepTimeoutRef.current) {
      clearTimeout(stepTimeoutRef.current);
    }
    
    onCancel();
  };

  // Swipe gestures
  const swipeGestures = useSwipeGesture(
    () => {
      // Swipe left - next step (if not recording)
      if (!isRecording && currentStepIndex < exerciseSteps.length - 1) {
        nextStep();
      }
    },
    () => {
      // Swipe right - previous step or cancel
      if (currentStepIndex > 0) {
        setCurrentStepIndex(currentStepIndex - 1);
      } else {
        handleCancel();
      }
    }
  );

  // Get current step
  const currentStep = exerciseSteps[currentStepIndex];
  if (!currentStep) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exercise...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 safe-area-top safe-area-bottom',
        className
      )}
      {...swipeGestures}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <button
          onClick={handleCancel}
          className="btn-touch bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-2 transition-colors"
          aria-label="Cancel exercise"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">{exercise.title}</h1>
          <p className="text-sm text-gray-600">
            Step {currentStepIndex + 1} of {exerciseSteps.length}
          </p>
        </div>

        <div className="w-10 h-10" /> {/* Spacer for centering */}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 bg-white/50">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / exerciseSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Step content based on type */}
        {currentStep.type === 'instruction' && (
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentStep.title}</h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">{currentStep.description}</p>
            <button
              onClick={nextStep}
              className="btn-touch bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors"
            >
              Start Exercise
            </button>
          </div>
        )}

        {currentStep.type === 'countdown' && (
          <div className="text-center">
            <div className="text-8xl font-bold text-blue-600 mb-4 animate-pulse">3</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentStep.title}</h2>
            <p className="text-gray-600">{currentStep.description}</p>
          </div>
        )}

        {currentStep.type === 'recording' && (
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentStep.title}</h2>
            <p className="text-gray-600 mb-6 text-lg">{currentStep.description}</p>

            {/* Display text for pacing/repetition exercises */}
            {currentStep.text && (
              <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border">
                <p className="text-lg text-gray-800 leading-relaxed">{currentStep.text}</p>
              </div>
            )}

            {/* Recording controls */}
            {!hasPermission ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-yellow-800 mb-4">Microphone permission required</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-touch bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg"
                >
                  Grant Permission
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recording status */}
                <div className="flex items-center justify-center space-x-4">
                  <div className={cn(
                    'w-4 h-4 rounded-full',
                    isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                  )} />
                  <span className="text-lg font-medium text-gray-700">
                    {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}
                  </span>
                </div>

                {/* Audio level visualization */}
                {isRecording && (
                  <div className="w-full max-w-xs mx-auto">
                    <div className="text-sm text-gray-600 mb-2">Audio Level</div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-100"
                        style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Duration display */}
                {recordingDuration > 0 && (
                  <div className="text-2xl font-mono text-gray-700">
                    {Math.floor(recordingDuration / 1000)}s
                  </div>
                )}

                {/* Recording controls */}
                <div className="flex space-x-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="btn-touch bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors"
                    >
                      🎤 Start Recording
                    </button>
                  ) : (
                    <div className="flex space-x-4">
                      <button
                        onClick={isPaused ? resumeRecording : pauseRecording}
                        className="btn-touch bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
                      >
                        {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                      </button>
                      <button
                        onClick={() => {
                          stopRecording();
                          nextStep();
                        }}
                        className="btn-touch bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
                      >
                        ✅ Stop & Continue
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep.type === 'feedback' && (
          <div className="text-center max-w-md">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentStep.title}</h2>
            <p className="text-gray-600 text-lg">{currentStep.description}</p>
            {isLoading && (
              <div className="mt-4">
                <div className="text-sm text-gray-500">Analyzing your speech...</div>
              </div>
            )}
          </div>
        )}

        {currentStep.type === 'complete' && result && (
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentStep.title}</h2>
            <p className="text-gray-600 mb-6 text-lg">{currentStep.description}</p>

            {/* Results display */}
            <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{result.metrics?.fluencyScore || 0}%</div>
                  <div className="text-sm text-gray-600">Fluency</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{result.metrics?.clarityScore || 0}%</div>
                  <div className="text-sm text-gray-600">Clarity</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{result.metrics?.confidenceScore || 0}%</div>
                  <div className="text-sm text-gray-600">Confidence</div>
                </div>
              </div>

              {result.feedback && result.feedback.length > 0 && (
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Feedback:</h3>
                  <ul className="space-y-1">
                    {result.feedback.map((item, index) => (
                      <li key={index} className="text-sm text-gray-600">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              onClick={handleComplete}
              className="btn-touch bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors"
            >
              Finish Exercise
            </button>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Swipe hints */}
      <div className="px-4 py-2 bg-white/50 text-center">
        <p className="text-xs text-gray-500">
          💡 Swipe left to continue, swipe right to go back
        </p>
      </div>
    </div>
  );
}
