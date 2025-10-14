// Export all hooks from this directory
export { useSpeechRecognition } from './useSpeechRecognition';
export type { 
  SpeechRecognitionState, 
  SpeechRecognitionOptions, 
  SpeechRecognitionControls 
} from './useSpeechRecognition';

// Export progress tracking hook
export { useProgress } from './useProgress';
export type {
  ExerciseSession,
  DailyProgress,
  WeeklyProgress,
  ProgressImprovement,
  StreakData,
  ProgressStats,
  ProgressGoals,
  DashboardData,
} from './useProgress';
