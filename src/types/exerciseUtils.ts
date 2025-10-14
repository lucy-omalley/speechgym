/**
 * Utility functions and validation helpers for speech exercises
 */

import {
  SpeechExercise,
  BreathingExercise,
  PacingExercise,
  RepetitionExercise,
  FreeSpeechExercise,
  ExerciseType,
  DifficultyLevel,
  ExerciseValidationResult,
  ExerciseValidationError,
  MobileUIConfig,
  AudioConfig,
  TimingConfig,
  ProgressMetrics,
  ExerciseFeedback,
  MobileExerciseState,
  AudioQuality,
  TouchTargetSize,
  Orientation,
  HapticFeedback,
} from './speechExercises';

/**
 * Default configurations for mobile-optimized exercises
 */
export const DEFAULT_MOBILE_CONFIG: MobileUIConfig = {
  touchTargetSize: 'large',
  orientation: 'portrait',
  hapticFeedback: 'medium',
  showVisualFeedback: true,
  enableVoiceActivityDetection: true,
  autoPauseOnInterruption: true,
};

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  quality: 'high',
  sampleRate: 44100,
  bitRate: 128000,
  noiseReduction: true,
  echoCancellation: true,
  autoGainControl: true,
};

export const DEFAULT_TIMING_CONFIG: TimingConfig = {
  duration: 60000, // 1 minute
  delay: 3000, // 3 seconds
  pauseBetweenRepetitions: 2000, // 2 seconds
  autoAdvanceDelay: 5000, // 5 seconds
};

/**
 * Create default progress metrics
 */
export function createDefaultProgress(): ProgressMetrics {
  return {
    completionPercentage: 0,
    timeSpent: 0,
    attempts: 0,
    successfulAttempts: 0,
    averageAccuracy: 0,
    bestAccuracy: 0,
  };
}

/**
 * Create default exercise feedback
 */
export function createDefaultFeedback(): ExerciseFeedback {
  return {
    score: 0,
    message: '',
    improvements: [],
    encouragements: [],
    analysis: {
      pace: 0,
      clarity: 0,
      volume: 0,
      pitch: 0,
      rhythm: 0,
    },
  };
}

/**
 * Validate an exercise configuration
 */
export function validateExercise(exercise: SpeechExercise): ExerciseValidationResult {
  const errors: ExerciseValidationError[] = [];
  const warnings: ExerciseValidationError[] = [];

  // Common validations
  if (!exercise.id || exercise.id.trim().length === 0) {
    errors.push({
      code: 'MISSING_ID',
      message: 'Exercise must have a valid ID',
      field: 'id',
    });
  }

  if (!exercise.name || exercise.name.trim().length === 0) {
    errors.push({
      code: 'MISSING_NAME',
      message: 'Exercise must have a name',
      field: 'name',
    });
  }

  if (exercise.estimatedDuration <= 0) {
    errors.push({
      code: 'INVALID_DURATION',
      message: 'Estimated duration must be greater than 0',
      field: 'estimatedDuration',
    });
  }

  if (exercise.instructions.length === 0) {
    warnings.push({
      code: 'NO_INSTRUCTIONS',
      message: 'Exercise has no instructions',
      field: 'instructions',
      suggestion: 'Add clear instructions for better user experience',
    });
  }

  // Type-specific validations
  switch (exercise.type) {
    case 'breathing':
      validateBreathingExercise(exercise as BreathingExercise, errors, warnings);
      break;
    case 'pacing':
      validatePacingExercise(exercise as PacingExercise, errors, warnings);
      break;
    case 'repetition':
      validateRepetitionExercise(exercise as RepetitionExercise, errors, warnings);
      break;
    case 'freeSpeech':
      validateFreeSpeechExercise(exercise as FreeSpeechExercise, errors, warnings);
      break;
  }

  // Mobile-specific validations
  validateMobileConfig(exercise.mobileConfig, errors, warnings);
  validateAudioConfig(exercise.audioConfig, errors, warnings);
  validateTimingConfig(exercise.timing, errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate breathing exercise specific properties
 */
function validateBreathingExercise(
  exercise: BreathingExercise,
  errors: ExerciseValidationError[],
  warnings: ExerciseValidationError[]
): void {
  const { breathingPattern } = exercise;

  if (breathingPattern.inhaleDuration <= 0) {
    errors.push({
      code: 'INVALID_INHALE_DURATION',
      message: 'Inhale duration must be greater than 0',
      field: 'breathingPattern.inhaleDuration',
    });
  }

  if (breathingPattern.exhaleDuration <= 0) {
    errors.push({
      code: 'INVALID_EXHALE_DURATION',
      message: 'Exhale duration must be greater than 0',
      field: 'breathingPattern.exhaleDuration',
    });
  }

  if (breathingPattern.cycles <= 0) {
    errors.push({
      code: 'INVALID_CYCLES',
      message: 'Number of cycles must be greater than 0',
      field: 'breathingPattern.cycles',
    });
  }

  // Warning for very long cycles
  const totalCycleTime = breathingPattern.inhaleDuration + 
    breathingPattern.holdDuration + breathingPattern.exhaleDuration;
  
  if (totalCycleTime > 30000) { // 30 seconds
    warnings.push({
      code: 'LONG_BREATHING_CYCLE',
      message: 'Breathing cycle is longer than 30 seconds',
      field: 'breathingPattern',
      suggestion: 'Consider shorter cycles for better mobile experience',
    });
  }
}

/**
 * Validate pacing exercise specific properties
 */
function validatePacingExercise(
  exercise: PacingExercise,
  errors: ExerciseValidationError[],
  warnings: ExerciseValidationError[]
): void {
  const { targetPace, minPace, maxPace, text } = exercise;

  if (targetPace <= 0) {
    errors.push({
      code: 'INVALID_TARGET_PACE',
      message: 'Target pace must be greater than 0',
      field: 'targetPace',
    });
  }

  if (minPace >= maxPace) {
    errors.push({
      code: 'INVALID_PACE_RANGE',
      message: 'Minimum pace must be less than maximum pace',
      field: 'minPace',
    });
  }

  if (targetPace < minPace || targetPace > maxPace) {
    errors.push({
      code: 'TARGET_PACE_OUT_OF_RANGE',
      message: 'Target pace must be within min and max pace range',
      field: 'targetPace',
    });
  }

  if (!text || text.trim().length === 0) {
    errors.push({
      code: 'MISSING_TEXT',
      message: 'Pacing exercise must have text to read',
      field: 'text',
    });
  }

  if (exercise.textSegments.length === 0) {
    warnings.push({
      code: 'NO_TEXT_SEGMENTS',
      message: 'No text segments defined',
      field: 'textSegments',
      suggestion: 'Add text segments for better pacing analysis',
    });
  }
}

/**
 * Validate repetition exercise specific properties
 */
function validateRepetitionExercise(
  exercise: RepetitionExercise,
  errors: ExerciseValidationError[],
  warnings: ExerciseValidationError[]
): void {
  const { text, requiredRepetitions } = exercise;

  if (!text || text.trim().length === 0) {
    errors.push({
      code: 'MISSING_TEXT',
      message: 'Repetition exercise must have text to repeat',
      field: 'text',
    });
  }

  if (requiredRepetitions <= 0) {
    errors.push({
      code: 'INVALID_REPETITIONS',
      message: 'Required repetitions must be greater than 0',
      field: 'requiredRepetitions',
    });
  }

  if (requiredRepetitions > 20) {
    warnings.push({
      code: 'HIGH_REPETITION_COUNT',
      message: 'High number of repetitions may be challenging on mobile',
      field: 'requiredRepetitions',
      suggestion: 'Consider breaking into smaller sets',
    });
  }
}

/**
 * Validate free speech exercise specific properties
 */
function validateFreeSpeechExercise(
  exercise: FreeSpeechExercise,
  errors: ExerciseValidationError[],
  warnings: ExerciseValidationError[]
): void {
  const { topic, targetDuration, minDuration, maxDuration } = exercise;

  if (!topic || topic.trim().length === 0) {
    errors.push({
      code: 'MISSING_TOPIC',
      message: 'Free speech exercise must have a topic',
      field: 'topic',
    });
  }

  if (targetDuration <= 0) {
    errors.push({
      code: 'INVALID_TARGET_DURATION',
      message: 'Target duration must be greater than 0',
      field: 'targetDuration',
    });
  }

  if (minDuration >= maxDuration) {
    errors.push({
      code: 'INVALID_DURATION_RANGE',
      message: 'Minimum duration must be less than maximum duration',
      field: 'minDuration',
    });
  }

  if (targetDuration < minDuration || targetDuration > maxDuration) {
    errors.push({
      code: 'TARGET_DURATION_OUT_OF_RANGE',
      message: 'Target duration must be within min and max duration range',
      field: 'targetDuration',
    });
  }

  // Warning for very long sessions
  if (maxDuration > 600000) { // 10 minutes
    warnings.push({
      code: 'LONG_FREE_SPEECH_SESSION',
      message: 'Very long free speech session',
      field: 'maxDuration',
      suggestion: 'Consider shorter sessions for better mobile experience',
    });
  }
}

/**
 * Validate mobile configuration
 */
function validateMobileConfig(
  config: MobileUIConfig,
  errors: ExerciseValidationError[],
  warnings: ExerciseValidationError[]
): void {
  if (!config.touchTargetSize) {
    errors.push({
      code: 'MISSING_TOUCH_TARGET_SIZE',
      message: 'Touch target size must be specified',
      field: 'mobileConfig.touchTargetSize',
    });
  }

  if (!config.orientation) {
    errors.push({
      code: 'MISSING_ORIENTATION',
      message: 'Orientation must be specified',
      field: 'mobileConfig.orientation',
    });
  }
}

/**
 * Validate audio configuration
 */
function validateAudioConfig(
  config: AudioConfig,
  errors: ExerciseValidationError[],
  warnings: ExerciseValidationError[]
): void {
  if (config.sampleRate && (config.sampleRate < 8000 || config.sampleRate > 48000)) {
    warnings.push({
      code: 'UNUSUAL_SAMPLE_RATE',
      message: 'Sample rate outside typical range (8kHz - 48kHz)',
      field: 'audioConfig.sampleRate',
      suggestion: 'Use 44100Hz for best mobile compatibility',
    });
  }

  if (config.bitRate && config.bitRate < 64000) {
    warnings.push({
      code: 'LOW_BIT_RATE',
      message: 'Bit rate may be too low for speech quality',
      field: 'audioConfig.bitRate',
      suggestion: 'Use at least 128kbps for speech exercises',
    });
  }
}

/**
 * Validate timing configuration
 */
function validateTimingConfig(
  config: TimingConfig,
  errors: ExerciseValidationError[],
  warnings: ExerciseValidationError[]
): void {
  if (config.duration <= 0) {
    errors.push({
      code: 'INVALID_DURATION',
      message: 'Duration must be greater than 0',
      field: 'timing.duration',
    });
  }

  if (config.delay && config.delay < 0) {
    errors.push({
      code: 'NEGATIVE_DELAY',
      message: 'Delay cannot be negative',
      field: 'timing.delay',
    });
  }

  if (config.pauseBetweenRepetitions && config.pauseBetweenRepetitions < 0) {
    errors.push({
      code: 'NEGATIVE_PAUSE',
      message: 'Pause between repetitions cannot be negative',
      field: 'timing.pauseBetweenRepetitions',
    });
  }
}

/**
 * Get difficulty progression for exercises
 */
export function getDifficultyProgression(currentLevel: DifficultyLevel): DifficultyLevel[] {
  const progression: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  const currentIndex = progression.indexOf(currentLevel);
  return progression.slice(currentIndex);
}

/**
 * Calculate exercise difficulty score
 */
export function calculateDifficultyScore(exercise: SpeechExercise): number {
  let score = 0;

  // Base score by difficulty level
  const difficultyScores = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4,
  };
  score += difficultyScores[exercise.difficulty];

  // Additional factors
  if (exercise.estimatedDuration > 300000) score += 1; // 5+ minutes
  if (exercise.instructions.length > 5) score += 1; // Complex instructions
  if (exercise.tags.includes('complex')) score += 1;

  // Type-specific factors
  switch (exercise.type) {
    case 'breathing':
      const breathing = exercise as BreathingExercise;
      if (breathing.breathingPattern.cycles > 10) score += 1;
      break;
    case 'pacing':
      const pacing = exercise as PacingExercise;
      if (pacing.textSegments.length > 10) score += 1;
      break;
    case 'repetition':
      const repetition = exercise as RepetitionExercise;
      if (repetition.requiredRepetitions > 10) score += 1;
      break;
    case 'freeSpeech':
      const freeSpeech = exercise as FreeSpeechExercise;
      if (freeSpeech.targetDuration > 300000) score += 1; // 5+ minutes
      break;
  }

  return Math.min(score, 10); // Cap at 10
}

/**
 * Check if device is suitable for exercise
 */
export function isDeviceSuitableForExercise(
  exercise: SpeechExercise,
  deviceState: MobileExerciseState
): { suitable: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check microphone capability
  if (!deviceState.capabilities.hasMicrophone) {
    reasons.push('Microphone not available');
  }

  // Check audio quality requirements
  const requiredQuality = exercise.audioConfig.quality;
  const deviceQuality = deviceState.capabilities.audioQuality;
  const qualityLevels = { low: 1, medium: 2, high: 3, lossless: 4 };
  
  if (qualityLevels[deviceQuality] < qualityLevels[requiredQuality]) {
    reasons.push(`Audio quality insufficient (requires ${requiredQuality}, device has ${deviceQuality})`);
  }

  // Check storage space for recordings
  const estimatedStorageNeeded = exercise.estimatedDuration * 0.1; // Rough estimate in MB
  if (deviceState.availableStorage < estimatedStorageNeeded) {
    reasons.push('Insufficient storage space for recording');
  }

  // Check battery level
  if (deviceState.batteryLevel < 20) {
    reasons.push('Low battery level');
  }

  // Check network for cloud features
  if (exercise.tags.includes('cloud-sync') && deviceState.networkStatus === 'offline') {
    reasons.push('Network required for cloud sync features');
  }

  return {
    suitable: reasons.length === 0,
    reasons,
  };
}

/**
 * Generate mobile-optimized exercise recommendations
 */
export function generateMobileRecommendations(
  exercise: SpeechExercise,
  deviceState: MobileExerciseState
): string[] {
  const recommendations: string[] = [];

  // Touch target recommendations
  if (exercise.mobileConfig.touchTargetSize === 'small') {
    recommendations.push('Consider using larger touch targets for better accessibility');
  }

  // Orientation recommendations
  if (exercise.mobileConfig.orientation === 'landscape' && deviceState.orientation === 'portrait') {
    recommendations.push('Rotate device to landscape for optimal experience');
  }

  // Battery recommendations
  if (deviceState.batteryLevel < 50) {
    recommendations.push('Consider connecting charger for longer sessions');
  }

  // Storage recommendations
  if (deviceState.availableStorage < 100) {
    recommendations.push('Free up storage space for better performance');
  }

  // Audio quality recommendations
  if (exercise.audioConfig.quality === 'lossless' && deviceState.capabilities.audioQuality !== 'lossless') {
    recommendations.push('High-quality audio may impact performance on this device');
  }

  return recommendations;
}

/**
 * Format exercise duration for display
 */
export function formatExerciseDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Calculate exercise completion percentage
 */
export function calculateCompletionPercentage(progress: ProgressMetrics): number {
  if (progress.attempts === 0) return 0;
  return Math.round((progress.successfulAttempts / progress.attempts) * 100);
}

/**
 * Get exercise type icon
 */
export function getExerciseTypeIcon(type: ExerciseType): string {
  const icons = {
    breathing: '🫁',
    pacing: '⏱️',
    repetition: '🔄',
    freeSpeech: '💬',
    pronunciation: '🗣️',
    fluency: '📈',
    articulation: '👄',
  };
  return icons[type] || '📝';
}

/**
 * Get difficulty level color
 */
export function getDifficultyColor(level: DifficultyLevel): string {
  const colors = {
    beginner: '#10B981', // green
    intermediate: '#F59E0B', // yellow
    advanced: '#EF4444', // red
    expert: '#8B5CF6', // purple
  };
  return colors[level] || '#6B7280'; // gray fallback
}
