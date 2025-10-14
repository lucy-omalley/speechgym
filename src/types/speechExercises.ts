/**
 * Speech Therapy Exercise Types and Interfaces
 * Mobile-optimized props for speech therapy applications
 */

// Base exercise types
export type ExerciseType = 'breathing' | 'pacing' | 'repetition' | 'freeSpeech' | 'pronunciation' | 'fluency' | 'articulation';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ExerciseStatus = 'notStarted' | 'inProgress' | 'paused' | 'completed' | 'skipped';
export type AudioQuality = 'low' | 'medium' | 'high' | 'lossless';

// Mobile-specific types
export type TouchTargetSize = 'small' | 'medium' | 'large' | 'extra-large';
export type Orientation = 'portrait' | 'landscape' | 'auto';
export type HapticFeedback = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'none';

// Timing and duration types
export interface TimingConfig {
  /** Duration in milliseconds */
  duration: number;
  /** Delay before starting in milliseconds */
  delay?: number;
  /** Pause between repetitions in milliseconds */
  pauseBetweenRepetitions?: number;
  /** Auto-advance delay in milliseconds */
  autoAdvanceDelay?: number;
}

// Audio configuration
export interface AudioConfig {
  /** Audio quality setting */
  quality: AudioQuality;
  /** Sample rate in Hz */
  sampleRate?: number;
  /** Bit rate for compression */
  bitRate?: number;
  /** Enable noise reduction */
  noiseReduction?: boolean;
  /** Enable echo cancellation */
  echoCancellation?: boolean;
  /** Enable automatic gain control */
  autoGainControl?: boolean;
}

// Mobile UI configuration
export interface MobileUIConfig {
  /** Touch target size for accessibility */
  touchTargetSize: TouchTargetSize;
  /** Preferred device orientation */
  orientation: Orientation;
  /** Haptic feedback intensity */
  hapticFeedback: HapticFeedback;
  /** Show visual feedback during recording */
  showVisualFeedback?: boolean;
  /** Enable voice activity detection */
  enableVoiceActivityDetection?: boolean;
  /** Auto-pause on phone calls */
  autoPauseOnInterruption?: boolean;
}

// Progress tracking
export interface ProgressMetrics {
  /** Completion percentage (0-100) */
  completionPercentage: number;
  /** Time spent in milliseconds */
  timeSpent: number;
  /** Number of attempts */
  attempts: number;
  /** Number of successful completions */
  successfulAttempts: number;
  /** Average accuracy score (0-100) */
  averageAccuracy: number;
  /** Best accuracy score achieved */
  bestAccuracy: number;
  /** Last completed timestamp */
  lastCompleted?: Date;
}

// Feedback and scoring
export interface ExerciseFeedback {
  /** Overall score (0-100) */
  score: number;
  /** Detailed feedback message */
  message: string;
  /** Areas for improvement */
  improvements: string[];
  /** Positive reinforcement */
  encouragements: string[];
  /** Technical analysis results */
  analysis?: {
    pace?: number; // Words per minute
    clarity?: number; // 0-100
    volume?: number; // 0-100
    pitch?: number; // Hz
    rhythm?: number; // 0-100
  };
}

// Base exercise interface
export interface BaseExercise {
  /** Unique identifier */
  id: string;
  /** Exercise name */
  name: string;
  /** Exercise description */
  description: string;
  /** Exercise type */
  type: ExerciseType;
  /** Difficulty level */
  difficulty: DifficultyLevel;
  /** Estimated duration in milliseconds */
  estimatedDuration: number;
  /** Instructions for the user */
  instructions: string[];
  /** Mobile-specific UI configuration */
  mobileConfig: MobileUIConfig;
  /** Audio recording configuration */
  audioConfig: AudioConfig;
  /** Timing configuration */
  timing: TimingConfig;
  /** Current status */
  status: ExerciseStatus;
  /** Progress metrics */
  progress: ProgressMetrics;
  /** Tags for categorization */
  tags: string[];
  /** Prerequisites (other exercise IDs) */
  prerequisites?: string[];
  /** Whether exercise is unlocked */
  unlocked: boolean;
  /** Custom styling options */
  customStyles?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
}

// Breathing Exercise Interface
export interface BreathingExercise extends BaseExercise {
  type: 'breathing';
  /** Breathing pattern configuration */
  breathingPattern: {
    /** Inhale duration in milliseconds */
    inhaleDuration: number;
    /** Hold duration in milliseconds */
    holdDuration: number;
    /** Exhale duration in milliseconds */
    exhaleDuration: number;
    /** Number of cycles */
    cycles: number;
    /** Rest period between cycles in milliseconds */
    restBetweenCycles?: number;
  };
  /** Visual breathing guide */
  visualGuide: {
    /** Show breathing animation */
    showAnimation: boolean;
    /** Animation style */
    animationStyle: 'circle' | 'wave' | 'bar' | 'dots';
    /** Animation colors */
    colors: {
      inhale: string;
      hold: string;
      exhale: string;
    };
  };
  /** Audio cues for breathing phases */
  audioCues?: {
    inhale?: string; // Audio file URL
    exhale?: string;
    hold?: string;
  };
}

// Pacing Exercise Interface
export interface PacingExercise extends BaseExercise {
  type: 'pacing';
  /** Target speaking pace (words per minute) */
  targetPace: number;
  /** Minimum acceptable pace */
  minPace: number;
  /** Maximum acceptable pace */
  maxPace: number;
  /** Text to be spoken */
  text: string;
  /** Text segments for pacing analysis */
  textSegments: {
    text: string;
    expectedDuration: number; // milliseconds
    difficulty: DifficultyLevel;
  }[];
  /** Visual pacing indicators */
  pacingVisuals: {
    /** Show pace meter */
    showPaceMeter: boolean;
    /** Show target zone */
    showTargetZone: boolean;
    /** Meter style */
    meterStyle: 'linear' | 'circular' | 'wave';
    /** Target zone color */
    targetZoneColor: string;
    /** Outside zone color */
    outsideZoneColor: string;
  };
  /** Metronome configuration */
  metronome?: {
    enabled: boolean;
    bpm: number;
    visualBeat: boolean;
    audioBeat: boolean;
  };
}

// Repetition Exercise Interface
export interface RepetitionExercise extends BaseExercise {
  type: 'repetition';
  /** Text to be repeated */
  text: string;
  /** Number of repetitions required */
  requiredRepetitions: number;
  /** Current repetition count */
  currentRepetition: number;
  /** Allowed variations in text */
  allowedVariations: string[];
  /** Pronunciation guides */
  pronunciationGuides: {
    word: string;
    phonetic: string;
    audioUrl?: string;
    difficulty: DifficultyLevel;
  }[];
  /** Repetition tracking */
  repetitionTracking: {
    /** Track each repetition individually */
    trackIndividual: boolean;
    /** Show progress for each repetition */
    showProgress: boolean;
    /** Allow skipping repetitions */
    allowSkip: boolean;
    /** Minimum accuracy to count as successful */
    minAccuracyThreshold: number;
  };
  /** Visual progress indicators */
  progressVisuals: {
    /** Show repetition counter */
    showCounter: boolean;
    /** Show progress bar */
    showProgressBar: boolean;
    /** Show completion checkmarks */
    showCheckmarks: boolean;
    /** Animation for completed repetitions */
    completionAnimation: 'checkmark' | 'star' | 'heart' | 'none';
  };
}

// Free Speech Exercise Interface
export interface FreeSpeechExercise extends BaseExercise {
  type: 'freeSpeech';
  /** Topic or prompt for free speech */
  topic: string;
  /** Suggested talking points */
  talkingPoints: string[];
  /** Target duration in milliseconds */
  targetDuration: number;
  /** Minimum duration to complete */
  minDuration: number;
  /** Maximum duration allowed */
  maxDuration: number;
  /** Recording configuration */
  recording: {
    /** Auto-start recording */
    autoStart: boolean;
    /** Allow pause and resume */
    allowPause: boolean;
    /** Show recording timer */
    showTimer: boolean;
    /** Show word count */
    showWordCount: boolean;
    /** Real-time feedback */
    realTimeFeedback: boolean;
  };
  /** Speech analysis targets */
  analysisTargets: {
    /** Target words per minute */
    targetWPM: number;
    /** Target volume level */
    targetVolume: number;
    /** Target clarity score */
    targetClarity: number;
    /** Target fluency score */
    targetFluency: number;
  };
  /** Visual feedback elements */
  feedbackVisuals: {
    /** Show real-time volume meter */
    showVolumeMeter: boolean;
    /** Show pace indicator */
    showPaceIndicator: boolean;
    /** Show clarity meter */
    showClarityMeter: boolean;
    /** Show word cloud */
    showWordCloud: boolean;
  };
}

// Union type for all exercise types
export type SpeechExercise = 
  | BreathingExercise 
  | PacingExercise 
  | RepetitionExercise 
  | FreeSpeechExercise;

// Exercise session configuration
export interface ExerciseSession {
  /** Session ID */
  id: string;
  /** Session name */
  name: string;
  /** List of exercises in session */
  exercises: SpeechExercise[];
  /** Session order */
  order: number[];
  /** Session duration in milliseconds */
  totalDuration: number;
  /** Break configuration between exercises */
  breaks: {
    enabled: boolean;
    duration: number; // milliseconds
    showTimer: boolean;
    allowSkip: boolean;
  };
  /** Session goals */
  goals: {
    targetAccuracy: number;
    targetCompletionTime: number;
    targetImprovement: number;
  };
  /** Mobile session configuration */
  mobileSessionConfig: {
    /** Allow background audio */
    allowBackgroundAudio: boolean;
    /** Lock orientation during session */
    lockOrientation: boolean;
    /** Enable haptic feedback */
    enableHaptics: boolean;
    /** Auto-save progress */
    autoSaveProgress: boolean;
  };
}

// Exercise result and analytics
export interface ExerciseResult {
  /** Exercise ID */
  exerciseId: string;
  /** Session ID */
  sessionId: string;
  /** Completion timestamp */
  completedAt: Date;
  /** Duration taken */
  duration: number;
  /** Final score */
  score: number;
  /** Detailed feedback */
  feedback: ExerciseFeedback;
  /** Audio recording URL */
  recordingUrl?: string;
  /** Raw analysis data */
  rawData?: {
    audioLevels: number[];
    wordTimings: number[];
    pronunciationScores: number[];
    paceVariations: number[];
  };
  /** Device information */
  deviceInfo: {
    userAgent: string;
    screenSize: string;
    audioInput: string;
    platform: string;
  };
}

// User preferences for exercises
export interface ExercisePreferences {
  /** Preferred difficulty progression */
  difficultyProgression: 'conservative' | 'moderate' | 'aggressive';
  /** Preferred exercise types */
  preferredTypes: ExerciseType[];
  /** Audio preferences */
  audioPreferences: {
    volume: number; // 0-100
    playbackSpeed: number; // 0.5-2.0
    enableAudioCues: boolean;
    enableMetronome: boolean;
  };
  /** Visual preferences */
  visualPreferences: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
    reduceAnimations: boolean;
    showVisualFeedback: boolean;
  };
  /** Accessibility preferences */
  accessibilityPreferences: {
    screenReaderSupport: boolean;
    voiceOver: boolean;
    largeTouchTargets: boolean;
    hapticFeedback: HapticFeedback;
  };
  /** Notification preferences */
  notificationPreferences: {
    dailyReminders: boolean;
    progressUpdates: boolean;
    achievementAlerts: boolean;
    exerciseRecommendations: boolean;
  };
}

// Exercise validation and error handling
export interface ExerciseValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Field that caused the error */
  field?: string;
  /** Suggested fix */
  suggestion?: string;
}

export interface ExerciseValidationResult {
  /** Whether exercise is valid */
  isValid: boolean;
  /** List of validation errors */
  errors: ExerciseValidationError[];
  /** Warnings that don't prevent execution */
  warnings: ExerciseValidationError[];
}

// Mobile-specific exercise state
export interface MobileExerciseState {
  /** Current orientation */
  orientation: Orientation;
  /** Device capabilities */
  capabilities: {
    hasMicrophone: boolean;
    hasCamera: boolean;
    hasHapticFeedback: boolean;
    hasGPS: boolean;
    audioQuality: AudioQuality;
  };
  /** Network status */
  networkStatus: 'online' | 'offline' | 'slow';
  /** Battery level (0-100) */
  batteryLevel: number;
  /** Available storage space in MB */
  availableStorage: number;
  /** Current memory usage in MB */
  memoryUsage: number;
}

// Default configurations
export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  quality: 'high',
  sampleRate: 44100,
  bitRate: 128,
  noiseReduction: true,
  echoCancellation: true,
  autoGainControl: true,
};

export const DEFAULT_TIMING_CONFIG: TimingConfig = {
  duration: 300000, // 5 minutes
  delay: 3000, // 3 seconds
  pauseBetweenRepetitions: 1000, // 1 second
  autoAdvanceDelay: 2000, // 2 seconds
};

export const DEFAULT_MOBILE_CONFIG: MobileUIConfig = {
  touchTargetSize: 'large',
  orientation: 'portrait',
  hapticFeedback: 'medium',
  showVisualFeedback: true,
  enableVoiceActivityDetection: true,
  autoPauseOnInterruption: true,
};

// Helper function to create default progress
export const createDefaultProgress = (): ProgressMetrics => ({
  completionPercentage: 0,
  timeSpent: 0,
  attempts: 0,
  successfulAttempts: 0,
  averageAccuracy: 0,
  bestAccuracy: 0,
});

// Export all types for easy importing
export type {
  ExerciseType,
  DifficultyLevel,
  ExerciseStatus,
  AudioQuality,
  TouchTargetSize,
  Orientation,
  HapticFeedback,
  TimingConfig,
  AudioConfig,
  MobileUIConfig,
  ProgressMetrics,
  ExerciseFeedback,
  BaseExercise,
  SpeechExercise,
  ExerciseSession,
  ExerciseResult,
  ExercisePreferences,
  ExerciseValidationError,
  ExerciseValidationResult,
  MobileExerciseState,
};
