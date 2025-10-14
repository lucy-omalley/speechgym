/**
 * Example exercises and factory functions for speech therapy
 * Demonstrates mobile-optimized configurations for different exercise types
 */

import {
  SpeechExercise,
  BreathingExercise,
  PacingExercise,
  RepetitionExercise,
  FreeSpeechExercise,
  ExerciseType,
  DifficultyLevel,
  MobileUIConfig,
  AudioConfig,
  TimingConfig,
  DEFAULT_MOBILE_CONFIG,
  DEFAULT_AUDIO_CONFIG,
  DEFAULT_TIMING_CONFIG,
  createDefaultProgress,
} from './speechExercises';
import { createDefaultProgress as createProgress } from './exerciseUtils';

/**
 * Factory function to create a breathing exercise
 */
export function createBreathingExercise(
  id: string,
  name: string,
  difficulty: DifficultyLevel,
  overrides: Partial<BreathingExercise> = {}
): BreathingExercise {
  const baseExercise: BreathingExercise = {
    id,
    name,
    description: 'Practice controlled breathing techniques for speech clarity and relaxation',
    type: 'breathing',
    difficulty,
    estimatedDuration: 300000, // 5 minutes
    instructions: [
      'Find a comfortable seated position',
      'Follow the breathing animation',
      'Breathe in slowly when the circle expands',
      'Hold your breath when the circle pauses',
      'Breathe out slowly when the circle contracts',
      'Repeat for the specified number of cycles',
    ],
    mobileConfig: {
      ...DEFAULT_MOBILE_CONFIG,
      orientation: 'portrait',
      touchTargetSize: 'large',
      showVisualFeedback: true,
    },
    audioConfig: {
      ...DEFAULT_AUDIO_CONFIG,
      quality: 'medium', // Lower quality for breathing exercises
    },
    timing: {
      ...DEFAULT_TIMING_CONFIG,
      duration: 300000, // 5 minutes
      delay: 5000, // 5 seconds preparation
    },
    status: 'notStarted',
    progress: createProgress(),
    tags: ['breathing', 'relaxation', 'foundation'],
    unlocked: true,
    breathingPattern: {
      inhaleDuration: 4000, // 4 seconds
      holdDuration: 2000,   // 2 seconds
      exhaleDuration: 6000, // 6 seconds
      cycles: 10,
      restBetweenCycles: 3000, // 3 seconds
    },
    visualGuide: {
      showAnimation: true,
      animationStyle: 'circle',
      colors: {
        inhale: '#3B82F6',  // blue
        hold: '#10B981',    // green
        exhale: '#EF4444',  // red
      },
    },
    audioCues: {
      inhale: '/audio/breathing/inhale.mp3',
      exhale: '/audio/breathing/exhale.mp3',
      hold: '/audio/breathing/hold.mp3',
    },
  };

  return { ...baseExercise, ...overrides };
}

/**
 * Factory function to create a pacing exercise
 */
export function createPacingExercise(
  id: string,
  name: string,
  difficulty: DifficultyLevel,
  text: string,
  overrides: Partial<PacingExercise> = {}
): PacingExercise {
  const words = text.split(' ');
  const wordCount = words.length;
  const targetPace = difficulty === 'beginner' ? 120 : 
                    difficulty === 'intermediate' ? 140 :
                    difficulty === 'advanced' ? 160 : 180;

  const baseExercise: PacingExercise = {
    id,
    name,
    description: 'Practice speaking at an appropriate pace for clear communication',
    type: 'pacing',
    difficulty,
    estimatedDuration: 180000, // 3 minutes
    instructions: [
      'Read the text aloud at a comfortable pace',
      'Try to match the target pace indicator',
      'Focus on clarity over speed',
      'Take breaks between segments if needed',
      'Use the metronome for consistent timing',
    ],
    mobileConfig: {
      ...DEFAULT_MOBILE_CONFIG,
      orientation: 'portrait',
      touchTargetSize: 'medium',
      showVisualFeedback: true,
    },
    audioConfig: {
      ...DEFAULT_AUDIO_CONFIG,
      quality: 'high',
      noiseReduction: true,
    },
    timing: {
      ...DEFAULT_TIMING_CONFIG,
      duration: 180000, // 3 minutes
      delay: 3000,
      pauseBetweenRepetitions: 5000, // 5 seconds between attempts
    },
    status: 'notStarted',
    progress: createProgress(),
    tags: ['pacing', 'fluency', 'communication'],
    unlocked: true,
    targetPace,
    minPace: targetPace - 20,
    maxPace: targetPace + 20,
    text,
    textSegments: words.map((word, index) => ({
      text: word,
      expectedDuration: (60000 / targetPace), // milliseconds per word
      difficulty: index < words.length / 3 ? 'beginner' :
                 index < words.length * 2 / 3 ? 'intermediate' : 'advanced',
    })),
    pacingVisuals: {
      showPaceMeter: true,
      showTargetZone: true,
      meterStyle: 'linear',
      targetZoneColor: '#10B981',
      outsideZoneColor: '#EF4444',
    },
    metronome: {
      enabled: difficulty !== 'expert',
      bpm: Math.round(targetPace * 0.6), // Rough conversion
      visualBeat: true,
      audioBeat: true,
    },
  };

  return { ...baseExercise, ...overrides };
}

/**
 * Factory function to create a repetition exercise
 */
export function createRepetitionExercise(
  id: string,
  name: string,
  difficulty: DifficultyLevel,
  text: string,
  repetitions: number,
  overrides: Partial<RepetitionExercise> = {}
): RepetitionExercise {
  const words = text.split(' ').filter(word => word.length > 0);
  const complexWords = words.filter(word => word.length > 6);

  const baseExercise: RepetitionExercise = {
    id,
    name,
    description: 'Practice clear pronunciation through repetition',
    type: 'repetition',
    difficulty,
    estimatedDuration: 240000, // 4 minutes
    instructions: [
      'Listen to the pronunciation guide',
      'Repeat the text clearly and accurately',
      'Focus on proper articulation',
      'Take your time with difficult words',
      'Complete all required repetitions',
    ],
    mobileConfig: {
      ...DEFAULT_MOBILE_CONFIG,
      orientation: 'portrait',
      touchTargetSize: 'large',
      showVisualFeedback: true,
    },
    audioConfig: {
      ...DEFAULT_AUDIO_CONFIG,
      quality: 'high',
      noiseReduction: true,
      echoCancellation: true,
    },
    timing: {
      ...DEFAULT_TIMING_CONFIG,
      duration: 240000, // 4 minutes
      delay: 3000,
      pauseBetweenRepetitions: 3000, // 3 seconds between repetitions
    },
    status: 'notStarted',
    progress: createProgress(),
    tags: ['repetition', 'pronunciation', 'articulation'],
    unlocked: true,
    text,
    requiredRepetitions: repetitions,
    currentRepetition: 0,
    allowedVariations: [
      text.toLowerCase(),
      text.toUpperCase(),
      text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
    ],
    pronunciationGuides: complexWords.map(word => ({
      word,
      phonetic: `/${word.toLowerCase()}/`, // Simplified phonetic
      audioUrl: `/audio/pronunciation/${word.toLowerCase()}.mp3`,
      difficulty: word.length > 8 ? 'advanced' : 'intermediate',
    })),
    repetitionTracking: {
      trackIndividual: true,
      showProgress: true,
      allowSkip: false,
      minAccuracyThreshold: difficulty === 'beginner' ? 70 :
                           difficulty === 'intermediate' ? 80 :
                           difficulty === 'advanced' ? 90 : 95,
    },
    progressVisuals: {
      showCounter: true,
      showProgressBar: true,
      showCheckmarks: true,
      completionAnimation: 'checkmark',
    },
  };

  return { ...baseExercise, ...overrides };
}

/**
 * Factory function to create a free speech exercise
 */
export function createFreeSpeechExercise(
  id: string,
  name: string,
  difficulty: DifficultyLevel,
  topic: string,
  duration: number,
  overrides: Partial<FreeSpeechExercise> = {}
): FreeSpeechExercise {
  const baseExercise: FreeSpeechExercise = {
    id,
    name,
    description: 'Practice spontaneous speech on a given topic',
    type: 'freeSpeech',
    difficulty,
    estimatedDuration: duration,
    instructions: [
      'Think about the topic for a moment',
      'Start speaking when you feel ready',
      'Speak clearly and at a comfortable pace',
      'Use the provided talking points as guidance',
      'Try to speak for the target duration',
    ],
    mobileConfig: {
      ...DEFAULT_MOBILE_CONFIG,
      orientation: 'portrait',
      touchTargetSize: 'large',
      showVisualFeedback: true,
      enableVoiceActivityDetection: true,
    },
    audioConfig: {
      ...DEFAULT_AUDIO_CONFIG,
      quality: 'high',
      noiseReduction: true,
      echoCancellation: true,
      autoGainControl: true,
    },
    timing: {
      ...DEFAULT_TIMING_CONFIG,
      duration,
      delay: 10000, // 10 seconds to think
      autoAdvanceDelay: 5000,
    },
    status: 'notStarted',
    progress: createProgress(),
    tags: ['freeSpeech', 'spontaneous', 'communication'],
    unlocked: true,
    topic,
    talkingPoints: generateTalkingPoints(topic, difficulty),
    targetDuration: duration,
    minDuration: Math.floor(duration * 0.7), // 70% of target
    maxDuration: Math.floor(duration * 1.5), // 150% of target
    recording: {
      autoStart: false,
      allowPause: true,
      showTimer: true,
      showWordCount: true,
      realTimeFeedback: true,
    },
    analysisTargets: {
      targetWPM: difficulty === 'beginner' ? 120 :
                difficulty === 'intermediate' ? 140 :
                difficulty === 'advanced' ? 160 : 180,
      targetVolume: 70, // 70% of max volume
      targetClarity: difficulty === 'beginner' ? 70 :
                    difficulty === 'intermediate' ? 80 :
                    difficulty === 'advanced' ? 90 : 95,
      targetFluency: difficulty === 'beginner' ? 60 :
                    difficulty === 'intermediate' ? 75 :
                    difficulty === 'advanced' ? 85 : 95,
    },
    feedbackVisuals: {
      showVolumeMeter: true,
      showPaceIndicator: true,
      showClarityMeter: true,
      showWordCloud: difficulty === 'advanced' || difficulty === 'expert',
    },
  };

  return { ...baseExercise, ...overrides };
}

/**
 * Generate talking points based on topic and difficulty
 */
function generateTalkingPoints(topic: string, difficulty: DifficultyLevel): string[] {
  const basePoints = [
    `What comes to mind when you think about ${topic}?`,
    `How has ${topic} affected your life?`,
    `What would you like others to know about ${topic}?`,
  ];

  if (difficulty === 'beginner') {
    return basePoints;
  } else if (difficulty === 'intermediate') {
    return [
      ...basePoints,
      `What are the main challenges related to ${topic}?`,
      `How do you think ${topic} will change in the future?`,
    ];
  } else if (difficulty === 'advanced') {
    return [
      ...basePoints,
      `What are the main challenges related to ${topic}?`,
      `How do you think ${topic} will change in the future?`,
      `What are the broader implications of ${topic}?`,
      `How does ${topic} connect to other important topics?`,
    ];
  } else { // expert
    return [
      ...basePoints,
      `What are the main challenges related to ${topic}?`,
      `How do you think ${topic} will change in the future?`,
      `What are the broader implications of ${topic}?`,
      `How does ${topic} connect to other important topics?`,
      `What are the ethical considerations surrounding ${topic}?`,
      `How would you explain ${topic} to someone who knows nothing about it?`,
    ];
  }
}

/**
 * Example exercises for demonstration
 */
export const EXAMPLE_EXERCISES: SpeechExercise[] = [
  // Breathing exercises
  createBreathingExercise(
    'breathing-basic',
    'Basic Breathing',
    'beginner',
    {
      breathingPattern: {
        inhaleDuration: 3000,
        holdDuration: 1000,
        exhaleDuration: 4000,
        cycles: 5,
        restBetweenCycles: 2000,
      },
    }
  ),

  createBreathingExercise(
    'breathing-advanced',
    'Advanced Breathing',
    'advanced',
    {
      breathingPattern: {
        inhaleDuration: 6000,
        holdDuration: 4000,
        exhaleDuration: 8000,
        cycles: 15,
        restBetweenCycles: 5000,
      },
    }
  ),

  // Pacing exercises
  createPacingExercise(
    'pacing-simple',
    'Simple Sentence Pacing',
    'beginner',
    'The quick brown fox jumps over the lazy dog.',
    {
      targetPace: 120,
      minPace: 100,
      maxPace: 140,
    }
  ),

  createPacingExercise(
    'pacing-complex',
    'Complex Paragraph Pacing',
    'advanced',
    'The development of artificial intelligence has revolutionized numerous industries, from healthcare and finance to transportation and entertainment. As machine learning algorithms become more sophisticated, they are capable of processing vast amounts of data and making decisions that were previously impossible for computers.',
    {
      targetPace: 160,
      minPace: 140,
      maxPace: 180,
    }
  ),

  // Repetition exercises
  createRepetitionExercise(
    'repetition-tongue-twister',
    'Tongue Twister Practice',
    'intermediate',
    'She sells seashells by the seashore',
    5,
    {
      requiredRepetitions: 5,
    }
  ),

  createRepetitionExercise(
    'repetition-complex',
    'Complex Word Pronunciation',
    'advanced',
    'Pneumonoultramicroscopicsilicovolcanoconiosi',
    3,
    {
      requiredRepetitions: 3,
    }
  ),

  // Free speech exercises
  createFreeSpeechExercise(
    'free-speech-hobby',
    'Talk About Your Hobby',
    'beginner',
    'your favorite hobby',
    120000, // 2 minutes
    {
      targetDuration: 120000,
      minDuration: 84000, // 1 minute 24 seconds
      maxDuration: 180000, // 3 minutes
    }
  ),

  createFreeSpeechExercise(
    'free-speech-current-events',
    'Current Events Discussion',
    'expert',
    'a recent news event that interests you',
    300000, // 5 minutes
    {
      targetDuration: 300000,
      minDuration: 210000, // 3 minutes 30 seconds
      maxDuration: 450000, // 7 minutes 30 seconds
    }
  ),
];

/**
 * Get exercises by type
 */
export function getExercisesByType(type: ExerciseType): SpeechExercise[] {
  return EXAMPLE_EXERCISES.filter(exercise => exercise.type === type);
}

/**
 * Get exercises by difficulty
 */
export function getExercisesByDifficulty(difficulty: DifficultyLevel): SpeechExercise[] {
  return EXAMPLE_EXERCISES.filter(exercise => exercise.difficulty === difficulty);
}

/**
 * Get recommended exercises for a user
 */
export function getRecommendedExercises(
  userLevel: DifficultyLevel,
  completedExercises: string[] = [],
  preferences: string[] = []
): SpeechExercise[] {
  return EXAMPLE_EXERCISES
    .filter(exercise => {
      // Don't recommend already completed exercises
      if (completedExercises.includes(exercise.id)) return false;
      
      // Filter by user level (can do current level and one below)
      const difficultyOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
      const userLevelIndex = difficultyOrder.indexOf(userLevel);
      const exerciseLevelIndex = difficultyOrder.indexOf(exercise.difficulty);
      
      return exerciseLevelIndex <= userLevelIndex && exerciseLevelIndex >= userLevelIndex - 1;
    })
    .filter(exercise => {
      // Filter by preferences if provided
      if (preferences.length === 0) return true;
      return preferences.some(pref => exercise.tags.includes(pref));
    })
    .sort((a, b) => {
      // Sort by difficulty within level
      const difficultyOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
      return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
    });
}

/**
 * Create a custom exercise session
 */
export function createExerciseSession(
  name: string,
  exerciseIds: string[],
  breakDuration: number = 30000 // 30 seconds
): SpeechExercise[] {
  const exercises = EXAMPLE_EXERCISES.filter(ex => exerciseIds.includes(ex.id));
  
  // Update timing for session context
  return exercises.map(exercise => ({
    ...exercise,
    timing: {
      ...exercise.timing,
      pauseBetweenRepetitions: breakDuration,
    },
  }));
}
