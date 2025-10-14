"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Breathing exercise phases
type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

// Breathing exercise props
interface BreathingExerciseProps {
  onComplete?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  className?: string;
  // Breathing timing (in seconds)
  inhaleDuration?: number;
  holdDuration?: number;
  exhaleDuration?: number;
  restDuration?: number;
  // Exercise settings
  cycles?: number;
  autoStart?: boolean;
  enableHaptics?: boolean;
  showInstructions?: boolean;
}

// Breathing state interface
interface BreathingState {
  isActive: boolean;
  isPaused: boolean;
  currentPhase: BreathingPhase;
  currentCycle: number;
  timeRemaining: number;
  totalTime: number;
}

// Haptic feedback patterns
const hapticPatterns = {
  inhale: [50, 50, 50], // Short pulses for inhale
  hold: [100, 50, 100], // Medium pulses for hold
  exhale: [30, 30, 30, 30, 30], // Quick pulses for exhale
  rest: [200], // Long pulse for rest
  cycleComplete: [100, 100, 100], // Triple pulse for cycle completion
  exerciseComplete: [200, 100, 200, 100, 200], // Celebration pattern
};

// Haptic feedback utility
const triggerHaptic = (pattern: number[]) => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  }
};

// Breathing instructions for each phase
const getBreathingInstructions = (phase: BreathingPhase): string => {
  switch (phase) {
    case 'inhale':
      return 'Breathe In';
    case 'hold':
      return 'Hold';
    case 'exhale':
      return 'Breathe Out';
    case 'rest':
      return 'Rest';
    default:
      return 'Breathe';
  }
};

// Phase descriptions
const getPhaseDescription = (phase: BreathingPhase): string => {
  switch (phase) {
    case 'inhale':
      return 'Take a slow, deep breath through your nose';
    case 'hold':
      return 'Hold your breath gently, don\'t strain';
    case 'exhale':
      return 'Release your breath slowly through your mouth';
    case 'rest':
      return 'Take a moment to relax before the next breath';
    default:
      return 'Follow the circle\'s rhythm';
  }
};

export default function BreathingExercise({
  onComplete,
  onStart,
  onPause,
  onResume,
  className,
  inhaleDuration = 4,
  holdDuration = 2,
  exhaleDuration = 6,
  restDuration = 2,
  cycles = 5,
  autoStart = false,
  enableHaptics = true,
  showInstructions = true,
}: BreathingExerciseProps) {
  // State management
  const [state, setState] = useState<BreathingState>({
    isActive: false,
    isPaused: false,
    currentPhase: 'inhale',
    currentCycle: 0,
    timeRemaining: inhaleDuration,
    totalTime: inhaleDuration,
  });

  // Refs for timers and animations
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastHapticTimeRef = useRef<number>(0);

  // Phase durations mapping
  const phaseDurations = {
    inhale: inhaleDuration,
    hold: holdDuration,
    exhale: exhaleDuration,
    rest: restDuration,
  };

  // Calculate total cycle duration
  const cycleDuration = inhaleDuration + holdDuration + exhaleDuration + restDuration;

  // Animation state for the circle
  const [circleScale, setCircleScale] = useState(1);
  const [circleOpacity, setCircleOpacity] = useState(0.8);

  // Start breathing exercise
  const startExercise = useCallback(() => {
    if (state.isActive) return;

    setState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      currentPhase: 'inhale',
      currentCycle: 1,
      timeRemaining: inhaleDuration,
      totalTime: inhaleDuration,
    }));

    startTimeRef.current = Date.now();
    onStart?.();

    // Trigger haptic feedback for start
    if (enableHaptics) {
      triggerHaptic([100]);
    }

    // Start the breathing cycle
    startBreathingCycle();
  }, [state.isActive, inhaleDuration, onStart, enableHaptics]);

  // Pause/resume exercise
  const togglePause = useCallback(() => {
    if (!state.isActive) return;

    if (state.isPaused) {
      // Resume
      setState(prev => ({ ...prev, isPaused: false }));
      onResume?.();
      startBreathingCycle();
    } else {
      // Pause
      setState(prev => ({ ...prev, isPaused: true }));
      onPause?.();
      stopTimers();
    }

    // Haptic feedback for pause/resume
    if (enableHaptics) {
      triggerHaptic([50]);
    }
  }, [state.isActive, state.isPaused, onPause, onResume, enableHaptics]);

  // Stop exercise
  const stopExercise = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      currentPhase: 'inhale',
      currentCycle: 0,
      timeRemaining: inhaleDuration,
      totalTime: inhaleDuration,
    }));

    stopTimers();
    
    // Reset circle animation
    setCircleScale(1);
    setCircleOpacity(0.8);

    // Haptic feedback for stop
    if (enableHaptics) {
      triggerHaptic([100, 50, 100]);
    }
  }, [inhaleDuration, enableHaptics]);

  // Complete exercise
  const completeExercise = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      isPaused: false,
      currentCycle: cycles,
    }));

    stopTimers();
    
    // Reset circle animation
    setCircleScale(1);
    setCircleOpacity(0.8);

    // Celebration haptic feedback
    if (enableHaptics) {
      triggerHaptic(hapticPatterns.exerciseComplete);
    }

    onComplete?.();
  }, [cycles, enableHaptics, onComplete]);

  // Start breathing cycle
  const startBreathingCycle = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const updateTimer = () => {
      setState(prev => {
        const newTimeRemaining = prev.timeRemaining - 0.1;
        
        if (newTimeRemaining <= 0) {
          // Move to next phase
          return moveToNextPhase(prev);
        }

        return {
          ...prev,
          timeRemaining: Math.max(0, newTimeRemaining),
        };
      });
    };

    timerRef.current = setInterval(updateTimer, 100);
  }, []);

  // Move to next breathing phase
  const moveToNextPhase = useCallback((currentState: BreathingState): BreathingState => {
    const phases: BreathingPhase[] = ['inhale', 'hold', 'exhale', 'rest'];
    const currentIndex = phases.indexOf(currentState.currentPhase);
    const nextIndex = (currentIndex + 1) % phases.length;
    const nextPhase = phases[nextIndex];

    // Check if we completed a full cycle
    if (nextPhase === 'inhale' && currentState.currentCycle >= cycles) {
      completeExercise();
      return currentState;
    }

    // Check if we completed a cycle
    if (nextPhase === 'inhale') {
      // Cycle complete
      if (enableHaptics) {
        triggerHaptic(hapticPatterns.cycleComplete);
      }
      
      return {
        ...currentState,
        currentPhase: nextPhase,
        currentCycle: currentState.currentCycle + 1,
        timeRemaining: phaseDurations[nextPhase],
        totalTime: phaseDurations[nextPhase],
      };
    }

    // Phase change
    return {
      ...currentState,
      currentPhase: nextPhase,
      timeRemaining: phaseDurations[nextPhase],
      totalTime: phaseDurations[nextPhase],
    };
  }, [cycles, enableHaptics, phaseDurations, completeExercise]);

  // Stop all timers
  const stopTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Update circle animation
  const updateCircleAnimation = useCallback(() => {
    if (!state.isActive || state.isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateCircleAnimation);
      return;
    }

    const progress = 1 - (state.timeRemaining / state.totalTime);
    
    switch (state.currentPhase) {
      case 'inhale':
        // Circle grows during inhale
        setCircleScale(1 + progress * 0.8); // Scale from 1 to 1.8
        setCircleOpacity(0.8 + progress * 0.2); // Opacity from 0.8 to 1.0
        break;
      case 'hold':
        // Circle stays at max size during hold
        setCircleScale(1.8);
        setCircleOpacity(1.0);
        break;
      case 'exhale':
        // Circle shrinks during exhale
        setCircleScale(1.8 - progress * 0.8); // Scale from 1.8 to 1.0
        setCircleOpacity(1.0 - progress * 0.2); // Opacity from 1.0 to 0.8
        break;
      case 'rest':
        // Circle at minimum size during rest
        setCircleScale(1.0);
        setCircleOpacity(0.8);
        break;
    }

    // Trigger haptic feedback at phase transitions
    if (enableHaptics && progress > 0.95) {
      const now = Date.now();
      if (now - lastHapticTimeRef.current > 500) { // Debounce haptics
        triggerHaptic(hapticPatterns[state.currentPhase]);
        lastHapticTimeRef.current = now;
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateCircleAnimation);
  }, [state.isActive, state.isPaused, state.currentPhase, state.timeRemaining, state.totalTime, enableHaptics]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && !state.isActive) {
      startExercise();
    }
  }, [autoStart, state.isActive, startExercise]);

  // Start animation loop
  useEffect(() => {
    if (state.isActive) {
      updateCircleAnimation();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state.isActive, updateCircleAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, [stopTimers]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const rounded = Math.ceil(seconds);
    return rounded.toString();
  };

  // Get progress percentage for progress bar
  const getProgressPercentage = (): number => {
    if (cycles === 0) return 0;
    const completedCycles = state.currentCycle - 1;
    const currentPhaseProgress = 1 - (state.timeRemaining / state.totalTime);
    const phaseProgress = currentPhaseProgress / 4; // 4 phases per cycle
    return ((completedCycles + phaseProgress) / cycles) * 100;
  };

  // Get phase color
  const getPhaseColor = (): string => {
    switch (state.currentPhase) {
      case 'inhale':
        return 'text-blue-600';
      case 'hold':
        return 'text-purple-600';
      case 'exhale':
        return 'text-green-600';
      case 'rest':
        return 'text-gray-600';
      default:
        return 'text-blue-600';
    }
  };

  // Get circle color
  const getCircleColor = (): string => {
    switch (state.currentPhase) {
      case 'inhale':
        return 'bg-blue-500';
      case 'hold':
        return 'bg-purple-500';
      case 'exhale':
        return 'bg-green-500';
      case 'rest':
        return 'bg-gray-400';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 safe-area-top safe-area-bottom relative overflow-hidden',
      'md:ml-64', // Account for navigation sidebar on desktop
      className
    )}>
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
      
      {/* Header */}
      <div className="relative flex items-center justify-between p-4 md:p-6 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
        <button
          onClick={stopExercise}
          className="btn-touch bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-2 transition-colors"
          aria-label="Stop exercise"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Breathing Exercise</h1>
          <p className="text-sm text-gray-600">
            Cycle {state.currentCycle} of {cycles}
          </p>
        </div>

        <div className="w-10 h-10" /> {/* Spacer for centering */}
      </div>

      {/* Progress Bar */}
      {state.isActive && (
        <div className="px-4 py-2 bg-white/50">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8">
        {/* Breathing Circle */}
        <div className="relative mb-8 md:mb-12">
          <div
            className={cn(
              'w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full transition-all duration-300 ease-in-out',
              getCircleColor(),
              'shadow-2xl'
            )}
            style={{
              transform: `scale(${circleScale})`,
              opacity: circleOpacity,
            }}
          />
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              <div className={cn('text-6xl md:text-7xl lg:text-8xl font-bold mb-2', getPhaseColor())}>
                {formatTime(state.timeRemaining)}
              </div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-700">
                {getBreathingInstructions(state.currentPhase)}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {showInstructions && (
          <div className="text-center max-w-md md:max-w-2xl lg:max-w-4xl mb-8">
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 leading-relaxed">
              {getPhaseDescription(state.currentPhase)}
            </p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center space-x-6 md:space-x-8">
          {!state.isActive ? (
            <button
              onClick={startExercise}
              className="btn-touch bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 md:py-5 px-8 md:px-12 rounded-xl text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Breathing
            </button>
          ) : (
            <button
              onClick={togglePause}
              className="btn-touch bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-4 md:py-5 px-6 md:px-10 rounded-xl text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {state.isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
        </div>

        {/* Exercise Info */}
        <div className="mt-8 md:mt-12 text-center">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-xl border border-gray-100">
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 mb-4">Exercise Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-sm md:text-base text-gray-600">
              <div>
                <span className="font-medium">Inhale:</span> {inhaleDuration}s
              </div>
              <div>
                <span className="font-medium">Hold:</span> {holdDuration}s
              </div>
              <div>
                <span className="font-medium">Exhale:</span> {exhaleDuration}s
              </div>
              <div>
                <span className="font-medium">Rest:</span> {restDuration}s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Instructions */}
      <div className="px-4 py-4 bg-white/50 text-center">
        <p className="text-sm text-gray-600">
          💡 Follow the circle's rhythm • {enableHaptics ? 'Haptic feedback enabled' : 'Haptic feedback disabled'}
        </p>
      </div>
    </div>
  );
}
