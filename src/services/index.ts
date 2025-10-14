// Export all speech analysis services
export * from './speechAnalysis';
export * from './speechAnalysisUtils';
export * from './coachingService';

// Re-export commonly used types and classes
export type {
  SpeechAnalysisResult,
  FluencyMetrics,
  TranscriptionResult,
  RepetitionAnalysis,
  PauseAnalysis,
  SpeechAnalysisConfig,
  NetworkError,
} from './speechAnalysis';

export type {
  CoachingFeedback,
  CoachingSession,
  UserProgressProfile,
} from './coachingService';

export {
  speechAnalysisService,
  SpeechAnalysisService,
} from './speechAnalysis';

export {
  coachingService,
} from './coachingService';

export {
  AudioProcessor,
  FluencyCalculator,
  NetworkUtils,
  PerformanceMonitor,
} from './speechAnalysisUtils';
