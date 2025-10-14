// Export all speech exercise types and interfaces
export * from './speechExercises';
export * from './exerciseUtils';
export * from './exerciseExamples';

// Re-export commonly used types for convenience
export type {
  SpeechExercise,
  BreathingExercise,
  PacingExercise,
  RepetitionExercise,
  FreeSpeechExercise,
  ExerciseType,
  DifficultyLevel,
  ExerciseStatus,
  AudioQuality,
  TouchTargetSize,
  Orientation,
  HapticFeedback,
  MobileUIConfig,
  AudioConfig,
  TimingConfig,
  ProgressMetrics,
  ExerciseFeedback,
  ExerciseSession,
  ExerciseResult,
  ExercisePreferences,
  MobileExerciseState,
} from './speechExercises';

// Re-export utility functions
export {
  validateExercise,
  calculateDifficultyScore,
  isDeviceSuitableForExercise,
  generateMobileRecommendations,
  formatExerciseDuration,
  calculateCompletionPercentage,
  getExerciseTypeIcon,
  getDifficultyColor,
  getDifficultyProgression,
} from './exerciseUtils';

// Re-export factory functions and examples
export {
  createBreathingExercise,
  createPacingExercise,
  createRepetitionExercise,
  createFreeSpeechExercise,
  EXAMPLE_EXERCISES,
  getExercisesByType,
  getExercisesByDifficulty,
  getRecommendedExercises,
  createExerciseSession,
} from './exerciseExamples';
