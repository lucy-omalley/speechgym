"use client";

import { SpeechAnalysisResult, FluencyMetrics } from './speechAnalysis';
import { SpeechExercise, ExerciseType, DifficultyLevel } from '@/types';

// Coaching feedback interface
export interface CoachingFeedback {
  id: string;
  type: 'encouragement' | 'improvement' | 'achievement' | 'tip' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  emoji: string;
  actionableAdvice: string;
  category: 'fluency' | 'clarity' | 'confidence' | 'pace' | 'repetition' | 'general';
  difficulty: DifficultyLevel;
  exerciseType: ExerciseType;
  timestamp: Date;
}

// Coaching session interface
export interface CoachingSession {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseType: ExerciseType;
  sessionDate: Date;
  analysisResult: SpeechAnalysisResult;
  feedback: CoachingFeedback[];
  overallScore: number;
  improvementAreas: string[];
  strengths: string[];
  nextRecommendations: string[];
  motivationalMessage: string;
}

// User progress tracking for personalized coaching
export interface UserProgressProfile {
  userId: string;
  totalSessions: number;
  averageFluency: number;
  averageClarity: number;
  averageConfidence: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  strongAreas: string[];
  weakAreas: string[];
  preferredExerciseTypes: ExerciseType[];
  lastSessionDate?: Date;
  streakDays: number;
}

class CoachingService {
  private progressProfiles: Map<string, UserProgressProfile> = new Map();

  /**
   * Generate personalized coaching feedback based on exercise results
   */
  async generateCoachingFeedback(
    analysisResult: SpeechAnalysisResult,
    exercise: SpeechExercise,
    userId?: string
  ): Promise<CoachingSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get or create user progress profile
    const userProfile = userId ? await this.getUserProgressProfile(userId) : null;
    
    // Generate feedback based on analysis results
    const feedback = this.generateFeedbackMessages(analysisResult, exercise, userProfile);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(analysisResult);
    
    // Identify improvement areas and strengths
    const improvementAreas = this.identifyImprovementAreas(analysisResult, userProfile);
    const strengths = this.identifyStrengths(analysisResult, userProfile);
    
    // Generate next recommendations
    const nextRecommendations = this.generateNextRecommendations(analysisResult, exercise, userProfile);
    
    // Create motivational message
    const motivationalMessage = this.generateMotivationalMessage(overallScore, userProfile);
    
    const coachingSession: CoachingSession = {
      id: sessionId,
      userId: userId || 'anonymous',
      exerciseId: exercise.id,
      exerciseType: exercise.type,
      sessionDate: new Date(),
      analysisResult,
      feedback,
      overallScore,
      improvementAreas,
      strengths,
      nextRecommendations,
      motivationalMessage,
    };

    // Update user progress profile
    if (userId) {
      await this.updateUserProgressProfile(userId, analysisResult, coachingSession);
    }

    return coachingSession;
  }

  /**
   * Generate feedback messages based on analysis results
   */
  private generateFeedbackMessages(
    analysisResult: SpeechAnalysisResult,
    exercise: SpeechExercise,
    userProfile: UserProgressProfile | null
  ): CoachingFeedback[] {
    const feedback: CoachingFeedback[] = [];
    const fluency = analysisResult.fluency;

    // Fluency feedback
    if (fluency.fluencyScore >= 80) {
      feedback.push({
        id: `feedback_${Date.now()}_1`,
        type: 'achievement',
        priority: 'high',
        title: 'Excellent Fluency! 🌟',
        message: 'Your speech flows beautifully! Keep up the amazing work!',
        emoji: '🌟',
        actionableAdvice: 'Try more complex exercises to challenge yourself further.',
        category: 'fluency',
        difficulty: 'advanced',
        exerciseType: exercise.type,
        timestamp: new Date(),
      });
    } else if (fluency.fluencyScore >= 60) {
      feedback.push({
        id: `feedback_${Date.now()}_2`,
        type: 'improvement',
        priority: 'medium',
        title: 'Good Progress! 📈',
        message: 'You\'re doing well with fluency. A few more practice sessions will help!',
        emoji: '📈',
        actionableAdvice: 'Focus on breathing exercises to improve speech flow.',
        category: 'fluency',
        difficulty: 'intermediate',
        exerciseType: exercise.type,
        timestamp: new Date(),
      });
    } else {
      feedback.push({
        id: `feedback_${Date.now()}_3`,
        type: 'tip',
        priority: 'high',
        title: 'Keep Practicing! 💪',
        message: 'Fluency takes time to develop. You\'re on the right track!',
        emoji: '💪',
        actionableAdvice: 'Try pacing exercises to slow down and improve flow.',
        category: 'fluency',
        difficulty: 'beginner',
        exerciseType: exercise.type,
        timestamp: new Date(),
      });
    }

    // Clarity feedback
    if (fluency.clarityScore >= 80) {
      feedback.push({
        id: `feedback_${Date.now()}_4`,
        type: 'achievement',
        priority: 'medium',
        title: 'Crystal Clear! ✨',
        message: 'Your pronunciation is excellent! Very clear and easy to understand.',
        emoji: '✨',
        actionableAdvice: 'Practice with more challenging words to maintain clarity.',
        category: 'clarity',
        difficulty: 'advanced',
        exerciseType: exercise.type,
        timestamp: new Date(),
      });
    } else if (fluency.clarityScore >= 60) {
      feedback.push({
        id: `feedback_${Date.now()}_5`,
        type: 'improvement',
        priority: 'medium',
        title: 'Getting Clearer! 🎯',
        message: 'Your clarity is improving! Keep focusing on clear pronunciation.',
        emoji: '🎯',
        actionableAdvice: 'Try repetition exercises to strengthen pronunciation.',
        category: 'clarity',
        difficulty: 'intermediate',
        exerciseType: exercise.type,
        timestamp: new Date(),
      });
    } else {
      feedback.push({
        id: `feedback_${Date.now()}_6`,
        type: 'tip',
        priority: 'high',
        title: 'Focus on Clarity! 🗣️',
        message: 'Slow down a bit and focus on clear pronunciation of each word.',
        emoji: '🗣️',
        actionableAdvice: 'Practice with tongue twisters to improve articulation.',
        category: 'clarity',
        difficulty: 'beginner',
        exerciseType: exercise.type,
        timestamp: new Date(),
      });
    }

    // Confidence feedback
    if (fluency.confidenceScore >= 80) {
      feedback.push({
        id: `feedback_${Date.now()}_7`,
        type: 'achievement',
        priority: 'medium',
        title: 'Confident Speaker! 🎤',
        message: 'You speak with great confidence! Your voice is strong and clear.',
        emoji: '🎤',
        actionableAdvice: 'Try free speech exercises to showcase your confidence.',
        category: 'confidence',
        difficulty: 'advanced',
        exerciseType: exercise.type,
        timestamp: new Date(),
      });
    } else if (fluency.confidenceScore >= 60) {
      feedback.push({
        id: `feedback_${Date.now()}_8`,
        type: 'encouragement',
        priority: 'medium',
        title: 'Building Confidence! 💪',
        message: 'Your confidence is growing with each session! Keep going!',
        emoji: '💪',
        actionableAdvice: 'Practice speaking a bit louder to boost confidence.',
        category: 'confidence',
        difficulty: 'intermediate',
        exerciseType: exercise.type,
        timestamp: new Date(),
      });
    } else {
      feedback.push({
        id: `feedback_${Date.now()}_9`,
        type: 'encouragement',
        priority: 'high',
        title: 'You\'ve Got This! 🌱',
        message: 'Confidence builds over time. Every practice session helps!',
        emoji: '🌱',
        actionableAdvice: 'Start with breathing exercises to feel more relaxed.',
        category: 'confidence',
        difficulty: 'beginner',
        exerciseType: exercise.type,
        timestamp: new Date(),
      });
    }

    // Pace-specific feedback
    if (fluency.wordsPerMinute) {
      if (fluency.wordsPerMinute > 180) {
        feedback.push({
          id: `feedback_${Date.now()}_10`,
          type: 'tip',
          priority: 'medium',
          title: 'Slow Down a Bit! 🐌',
          message: 'You\'re speaking quite fast. Try to pace yourself better.',
          emoji: '🐌',
          actionableAdvice: 'Practice counting between words to control your pace.',
          category: 'pace',
          difficulty: 'intermediate',
          exerciseType: exercise.type,
          timestamp: new Date(),
        });
      } else if (fluency.wordsPerMinute < 100) {
        feedback.push({
          id: `feedback_${Date.now()}_11`,
          type: 'tip',
          priority: 'medium',
          title: 'Pick Up the Pace! 🏃',
          message: 'You can speak a bit faster while maintaining clarity.',
          emoji: '🏃',
          actionableAdvice: 'Try pacing exercises with a metronome to find your rhythm.',
          category: 'pace',
          difficulty: 'intermediate',
          exerciseType: exercise.type,
          timestamp: new Date(),
        });
      }
    }

    // Repetition feedback
    if (fluency.repetitions.length > 3) {
      feedback.push({
        id: `feedback_${Date.now()}_12`,
        type: 'tip',
        priority: 'medium',
        title: 'Reduce Repetitions! 🔄',
        message: 'Try to avoid repeating words. Plan your thoughts before speaking.',
        emoji: '🔄',
        actionableAdvice: 'Practice pausing instead of repeating words.',
        category: 'repetition',
        difficulty: 'intermediate',
        exerciseType: exercise.type,
        timestamp: new Date(),
      });
    }

    // Exercise-specific feedback
    this.addExerciseSpecificFeedback(feedback, exercise, analysisResult);

    // Personalized feedback based on user profile
    if (userProfile) {
      this.addPersonalizedFeedback(feedback, userProfile, analysisResult);
    }

    return feedback;
  }

  /**
   * Add exercise-specific feedback
   */
  private addExerciseSpecificFeedback(
    feedback: CoachingFeedback[],
    exercise: SpeechExercise,
    analysisResult: SpeechAnalysisResult
  ): void {
    switch (exercise.type) {
      case 'breathing':
        if (analysisResult.fluency.fluencyScore > 70) {
          feedback.push({
            id: `feedback_${Date.now()}_13`,
            type: 'achievement',
            priority: 'medium',
            title: 'Great Breathing! 🫁',
            message: 'Your breathing control is excellent! This helps with speech stamina.',
            emoji: '🫁',
            actionableAdvice: 'Try longer breathing exercises to build more stamina.',
            category: 'fluency',
            difficulty: 'intermediate',
            exerciseType: 'breathing',
            timestamp: new Date(),
          });
        }
        break;

      case 'pacing':
        if (analysisResult.fluency.wordsPerMinute && 
            analysisResult.fluency.wordsPerMinute >= 120 && 
            analysisResult.fluency.wordsPerMinute <= 160) {
          feedback.push({
            id: `feedback_${Date.now()}_14`,
            type: 'achievement',
            priority: 'high',
            title: 'Perfect Pace! ⏱️',
            message: 'Your pacing is spot on! Great control of speaking speed.',
            emoji: '⏱️',
            actionableAdvice: 'Apply this pacing to your daily conversations.',
            category: 'pace',
            difficulty: 'advanced',
            exerciseType: 'pacing',
            timestamp: new Date(),
          });
        }
        break;

      case 'repetition':
        if (analysisResult.fluency.repetitions.length <= 1) {
          feedback.push({
            id: `feedback_${Date.now()}_15`,
            type: 'achievement',
            priority: 'medium',
            title: 'Smooth Delivery! 🎭',
            message: 'Excellent! You delivered the phrases without repetition.',
            emoji: '🎭',
            actionableAdvice: 'Try more complex phrases to challenge yourself.',
            category: 'repetition',
            difficulty: 'advanced',
            exerciseType: 'repetition',
            timestamp: new Date(),
          });
        }
        break;

      case 'freeSpeech':
        if (analysisResult.fluency.confidenceScore > 75) {
          feedback.push({
            id: `feedback_${Date.now()}_16`,
            type: 'achievement',
            priority: 'high',
            title: 'Natural Speaker! 🗣️',
            message: 'You speak naturally and confidently! Great spontaneous speech.',
            emoji: '🗣️',
            actionableAdvice: 'Practice telling stories to friends and family.',
            category: 'confidence',
            difficulty: 'advanced',
            exerciseType: 'freeSpeech',
            timestamp: new Date(),
          });
        }
        break;
    }
  }

  /**
   * Add personalized feedback based on user progress
   */
  private addPersonalizedFeedback(
    feedback: CoachingFeedback[],
    userProfile: UserProgressProfile,
    analysisResult: SpeechAnalysisResult
  ): void {
    // Improvement trend feedback
    if (userProfile.improvementTrend === 'improving') {
      feedback.push({
        id: `feedback_${Date.now()}_17`,
        type: 'encouragement',
        priority: 'high',
        title: 'You\'re Improving! 📈',
        message: `Great progress! You've improved in ${userProfile.strongAreas.join(' and ')}.`,
        emoji: '📈',
        actionableAdvice: 'Keep practicing daily to maintain this momentum!',
        category: 'general',
        difficulty: 'intermediate',
        exerciseType: 'breathing',
        timestamp: new Date(),
      });
    }

    // Streak encouragement
    if (userProfile.streakDays >= 7) {
      feedback.push({
        id: `feedback_${Date.now()}_18`,
        type: 'achievement',
        priority: 'high',
        title: 'Amazing Streak! 🔥',
        message: `${userProfile.streakDays} days in a row! You're building great habits!`,
        emoji: '🔥',
        actionableAdvice: 'Keep going! Consistency is key to improvement.',
        category: 'general',
        difficulty: 'advanced',
        exerciseType: 'breathing',
        timestamp: new Date(),
      });
    }

    // Weak area focus
    if (userProfile.weakAreas.length > 0) {
      const weakArea = userProfile.weakAreas[0];
      feedback.push({
        id: `feedback_${Date.now()}_19`,
        type: 'tip',
        priority: 'medium',
        title: 'Focus Area! 🎯',
        message: `Let's work on improving your ${weakArea}. You're making progress!`,
        emoji: '🎯',
        actionableAdvice: `Try exercises specifically designed for ${weakArea} improvement.`,
        category: weakArea as any,
        difficulty: 'beginner',
        exerciseType: 'breathing',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallScore(analysisResult: SpeechAnalysisResult): number {
    const fluency = analysisResult.fluency;
    const weights = {
      fluency: 0.3,
      clarity: 0.3,
      confidence: 0.2,
      pace: 0.1,
      repetition: 0.1,
    };

    let score = 0;
    score += fluency.fluencyScore * weights.fluency;
    score += fluency.clarityScore * weights.clarity;
    score += fluency.confidenceScore * weights.confidence;

    // Pace scoring (optimal range: 120-160 WPM)
    if (fluency.wordsPerMinute) {
      const paceScore = fluency.wordsPerMinute >= 120 && fluency.wordsPerMinute <= 160 ? 100 : 
                       fluency.wordsPerMinute < 120 ? (fluency.wordsPerMinute / 120) * 100 :
                       (160 / fluency.wordsPerMinute) * 100;
      score += paceScore * weights.pace;
    } else {
      score += 70 * weights.pace; // Default pace score
    }

    // Repetition scoring (fewer repetitions = higher score)
    const repetitionScore = Math.max(0, 100 - (fluency.repetitions.length * 15));
    score += repetitionScore * weights.repetition;

    return Math.round(score);
  }

  /**
   * Identify improvement areas
   */
  private identifyImprovementAreas(
    analysisResult: SpeechAnalysisResult,
    userProfile: UserProgressProfile | null
  ): string[] {
    const areas: string[] = [];
    const fluency = analysisResult.fluency;

    if (fluency.fluencyScore < 70) areas.push('fluency');
    if (fluency.clarityScore < 70) areas.push('clarity');
    if (fluency.confidenceScore < 70) areas.push('confidence');
    if (fluency.wordsPerMinute && (fluency.wordsPerMinute < 120 || fluency.wordsPerMinute > 160)) {
      areas.push('pacing');
    }
    if (fluency.repetitions.length > 2) areas.push('repetition');

    return areas;
  }

  /**
   * Identify strengths
   */
  private identifyStrengths(
    analysisResult: SpeechAnalysisResult,
    userProfile: UserProgressProfile | null
  ): string[] {
    const strengths: string[] = [];
    const fluency = analysisResult.fluency;

    if (fluency.fluencyScore >= 80) strengths.push('fluency');
    if (fluency.clarityScore >= 80) strengths.push('clarity');
    if (fluency.confidenceScore >= 80) strengths.push('confidence');
    if (fluency.wordsPerMinute && fluency.wordsPerMinute >= 120 && fluency.wordsPerMinute <= 160) {
      strengths.push('pacing');
    }
    if (fluency.repetitions.length <= 1) strengths.push('repetition control');

    return strengths;
  }

  /**
   * Generate next recommendations
   */
  private generateNextRecommendations(
    analysisResult: SpeechAnalysisResult,
    exercise: SpeechExercise,
    userProfile: UserProgressProfile | null
  ): string[] {
    const recommendations: string[] = [];
    const improvementAreas = this.identifyImprovementAreas(analysisResult, userProfile);

    if (improvementAreas.includes('fluency')) {
      recommendations.push('Try breathing exercises to improve speech flow');
    }
    if (improvementAreas.includes('clarity')) {
      recommendations.push('Practice repetition exercises for better pronunciation');
    }
    if (improvementAreas.includes('confidence')) {
      recommendations.push('Work on free speech exercises to build confidence');
    }
    if (improvementAreas.includes('pacing')) {
      recommendations.push('Focus on pacing exercises to control your speaking speed');
    }
    if (improvementAreas.includes('repetition')) {
      recommendations.push('Practice pausing instead of repeating words');
    }

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push('Great job! Try more challenging exercises');
      recommendations.push('Practice daily to maintain your progress');
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  /**
   * Generate motivational message
   */
  private generateMotivationalMessage(
    overallScore: number,
    userProfile: UserProgressProfile | null
  ): string {
    const messages = {
      excellent: [
        "You're doing absolutely amazing! 🌟 Keep up the fantastic work!",
        "Outstanding performance! 🎉 You're becoming a confident speaker!",
        "Incredible! 🚀 Your dedication is really paying off!"
      ],
      good: [
        "Great job! 📈 You're making solid progress!",
        "Well done! 💪 Keep practicing to reach the next level!",
        "Nice work! 🎯 You're on the right track!"
      ],
      improving: [
        "Good effort! 🌱 Every practice session helps you improve!",
        "Keep going! 💪 You're building important speech skills!",
        "You're getting better! 📊 Consistency is key!"
      ],
      beginner: [
        "Great start! 🌟 Everyone begins somewhere - you're doing great!",
        "Keep practicing! 💪 Every expert was once a beginner!",
        "You've got this! 🌱 Small steps lead to big improvements!"
      ]
    };

    let category: keyof typeof messages;
    if (overallScore >= 85) category = 'excellent';
    else if (overallScore >= 70) category = 'good';
    else if (overallScore >= 50) category = 'improving';
    else category = 'beginner';

    const categoryMessages = messages[category];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }

  /**
   * Get user progress profile
   */
  private async getUserProgressProfile(userId: string): Promise<UserProgressProfile> {
    if (this.progressProfiles.has(userId)) {
      return this.progressProfiles.get(userId)!;
    }

    // Create default profile
    const profile: UserProgressProfile = {
      userId,
      totalSessions: 0,
      averageFluency: 0,
      averageClarity: 0,
      averageConfidence: 0,
      improvementTrend: 'stable',
      strongAreas: [],
      weakAreas: [],
      preferredExerciseTypes: [],
      streakDays: 0,
    };

    this.progressProfiles.set(userId, profile);
    return profile;
  }

  /**
   * Update user progress profile
   */
  private async updateUserProgressProfile(
    userId: string,
    analysisResult: SpeechAnalysisResult,
    coachingSession: CoachingSession
  ): Promise<void> {
    const profile = await this.getUserProgressProfile(userId);
    const fluency = analysisResult.fluency;

    // Update session count
    profile.totalSessions += 1;

    // Update averages (simple moving average)
    const alpha = 0.1; // Learning rate
    profile.averageFluency = profile.averageFluency * (1 - alpha) + fluency.fluencyScore * alpha;
    profile.averageClarity = profile.averageClarity * (1 - alpha) + fluency.clarityScore * alpha;
    profile.averageConfidence = profile.averageConfidence * (1 - alpha) + fluency.confidenceScore * alpha;

    // Update improvement trend
    const currentAvg = (profile.averageFluency + profile.averageClarity + profile.averageConfidence) / 3;
    const previousAvg = (profile.averageFluency + profile.averageClarity + profile.averageConfidence) / 3;
    
    if (currentAvg > previousAvg + 5) {
      profile.improvementTrend = 'improving';
    } else if (currentAvg < previousAvg - 5) {
      profile.improvementTrend = 'declining';
    } else {
      profile.improvementTrend = 'stable';
    }

    // Update strong and weak areas
    profile.strongAreas = coachingSession.strengths;
    profile.weakAreas = coachingSession.improvementAreas;

    // Update preferred exercise types (simple frequency tracking)
    if (!profile.preferredExerciseTypes.includes(coachingSession.exerciseType)) {
      profile.preferredExerciseTypes.push(coachingSession.exerciseType);
    }

    // Update last session date and streak
    const today = new Date();
    const lastSession = profile.lastSessionDate;
    
    if (!lastSession) {
      profile.streakDays = 1;
    } else {
      const daysDiff = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        profile.streakDays += 1;
      } else if (daysDiff > 1) {
        profile.streakDays = 1;
      }
    }
    
    profile.lastSessionDate = today;

    this.progressProfiles.set(userId, profile);
  }

  /**
   * Get coaching insights for dashboard
   */
  async getCoachingInsights(userId: string): Promise<{
    totalSessions: number;
    improvementTrend: string;
    strongAreas: string[];
    weakAreas: string[];
    streakDays: number;
    motivationalMessage: string;
  }> {
    const profile = await this.getUserProgressProfile(userId);
    
    return {
      totalSessions: profile.totalSessions,
      improvementTrend: profile.improvementTrend,
      strongAreas: profile.strongAreas,
      weakAreas: profile.weakAreas,
      streakDays: profile.streakDays,
      motivationalMessage: this.generateMotivationalMessage(
        (profile.averageFluency + profile.averageClarity + profile.averageConfidence) / 3,
        profile
      ),
    };
  }
}

// Export singleton instance
export const coachingService = new CoachingService();
export default coachingService;
