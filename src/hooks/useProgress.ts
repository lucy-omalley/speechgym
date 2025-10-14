"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SpeechAnalysisResult } from '@/services/speechAnalysis';

// Types for progress tracking
export interface ExerciseSession {
  id: string;
  exerciseId: string;
  exerciseType: 'breathing' | 'pacing' | 'repetition' | 'freeSpeech' | 'pronunciation' | 'fluency' | 'articulation';
  completedAt: Date;
  duration: number; // in milliseconds
  fluencyScore: number; // 0-100
  clarityScore: number; // 0-100
  confidenceScore: number; // 0-100
  wordsPerMinute?: number;
  totalWords?: number;
  repetitions?: number;
  pauses?: number;
  audioUrl?: string;
  notes?: string;
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD format
  sessions: ExerciseSession[];
  totalDuration: number; // total practice time in milliseconds
  averageFluencyScore: number;
  averageClarityScore: number;
  averageConfidenceScore: number;
  sessionCount: number;
  streakDay: boolean; // whether this day contributes to streak
}

export interface WeeklyProgress {
  weekStart: string; // YYYY-MM-DD format
  weekEnd: string; // YYYY-MM-DD format
  totalSessions: number;
  totalDuration: number;
  averageFluencyScore: number;
  averageClarityScore: number;
  averageConfidenceScore: number;
  streakDays: number;
  exerciseTypeBreakdown: Record<string, number>;
  dailyData: DailyProgress[];
  improvements: ProgressImprovement[];
}

export interface ProgressImprovement {
  metric: 'fluency' | 'clarity' | 'confidence' | 'wpm' | 'duration';
  change: number; // percentage change
  period: 'week' | 'month' | 'all';
  direction: 'increase' | 'decrease' | 'stable';
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakStartDate: string | null;
  streakHistory: Array<{
    startDate: string;
    endDate: string;
    length: number;
  }>;
}

export interface ProgressStats {
  totalSessions: number;
  totalDuration: number; // in milliseconds
  averageSessionDuration: number;
  averageFluencyScore: number;
  averageClarityScore: number;
  averageConfidenceScore: number;
  currentStreak: number;
  longestStreak: number;
  daysActive: number;
  firstSessionDate: string | null;
  lastSessionDate: string | null;
  favoriteExerciseType: string;
  weeklyGoalProgress: number; // 0-100
  monthlyGoalProgress: number; // 0-100
}

export interface ProgressGoals {
  weeklySessions: number;
  weeklyDuration: number; // in milliseconds
  monthlySessions: number;
  monthlyDuration: number; // in milliseconds
  targetFluencyScore: number;
  targetStreakDays: number;
}

export interface DashboardData {
  stats: ProgressStats;
  streak: StreakData;
  weeklyProgress: WeeklyProgress[];
  recentSessions: ExerciseSession[];
  improvements: ProgressImprovement[];
  goals: ProgressGoals;
  chartData: {
    fluencyTrend: Array<{ date: string; value: number }>;
    durationTrend: Array<{ date: string; value: number }>;
    sessionCountTrend: Array<{ date: string; value: number }>;
    exerciseTypeDistribution: Array<{ type: string; count: number; percentage: number }>;
  };
}

// Default goals
const DEFAULT_GOALS: ProgressGoals = {
  weeklySessions: 5,
  weeklyDuration: 30 * 60 * 1000, // 30 minutes
  monthlySessions: 20,
  monthlyDuration: 2 * 60 * 60 * 1000, // 2 hours
  targetFluencyScore: 80,
  targetStreakDays: 7,
};

// LocalStorage keys
const STORAGE_KEYS = {
  SESSIONS: 'speechgym_sessions',
  GOALS: 'speechgym_goals',
  SETTINGS: 'speechgym_settings',
};

/**
 * Progress tracking hook with localStorage integration
 */
export const useProgress = () => {
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [goals, setGoals] = useState<ProgressGoals>(DEFAULT_GOALS);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    loadProgressData();
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    if (!isLoading) {
      saveSessionsToStorage();
    }
  }, [sessions, isLoading]);

  /**
   * Load progress data from localStorage
   */
  const loadProgressData = useCallback(() => {
    try {
      // Load sessions
      const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          completedAt: new Date(session.completedAt),
        }));
        setSessions(parsedSessions);
      }

      // Load goals
      const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
      if (savedGoals) {
        setGoals({ ...DEFAULT_GOALS, ...JSON.parse(savedGoals) });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load progress data:', error);
      setIsLoading(false);
    }
  }, []);

  /**
   * Save sessions to localStorage
   */
  const saveSessionsToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }, [sessions]);

  /**
   * Add a new exercise session
   */
  const addSession = useCallback((sessionData: Omit<ExerciseSession, 'id' | 'completedAt'>) => {
    const newSession: ExerciseSession = {
      ...sessionData,
      id: generateSessionId(),
      completedAt: new Date(),
    };

    setSessions(prev => [newSession, ...prev].sort((a, b) => 
      b.completedAt.getTime() - a.completedAt.getTime()
    ));

    return newSession;
  }, []);

  /**
   * Add session from speech analysis result
   */
  const addSessionFromAnalysis = useCallback((
    exerciseId: string,
    exerciseType: ExerciseSession['exerciseType'],
    analysisResult: SpeechAnalysisResult,
    additionalData?: {
      notes?: string;
      audioUrl?: string;
    }
  ) => {
    const sessionData: Omit<ExerciseSession, 'id' | 'completedAt'> = {
      exerciseId,
      exerciseType,
      duration: analysisResult.fluency.totalDuration * 1000, // convert to milliseconds
      fluencyScore: analysisResult.fluency.fluencyScore,
      clarityScore: analysisResult.fluency.clarityScore,
      confidenceScore: analysisResult.fluency.confidenceScore,
      wordsPerMinute: analysisResult.fluency.wordsPerMinute,
      totalWords: analysisResult.fluency.totalWords,
      repetitions: analysisResult.fluency.repetitions.length,
      pauses: analysisResult.fluency.pauses.length,
      audioUrl: analysisResult.recordingUrl,
      notes: additionalData?.notes,
    };

    return addSession(sessionData);
  }, [addSession]);

  /**
   * Update goals
   */
  const updateGoals = useCallback((newGoals: Partial<ProgressGoals>) => {
    const updatedGoals = { ...goals, ...newGoals };
    setGoals(updatedGoals);
    
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  }, [goals]);

  /**
   * Calculate daily progress data
   */
  const getDailyProgress = useCallback((date: string): DailyProgress => {
    const daySessions = sessions.filter(session => 
      formatDate(session.completedAt) === date
    );

    if (daySessions.length === 0) {
      return {
        date,
        sessions: [],
        totalDuration: 0,
        averageFluencyScore: 0,
        averageClarityScore: 0,
        averageConfidenceScore: 0,
        sessionCount: 0,
        streakDay: false,
      };
    }

    const totalDuration = daySessions.reduce((sum, session) => sum + session.duration, 0);
    const averageFluencyScore = daySessions.reduce((sum, session) => sum + session.fluencyScore, 0) / daySessions.length;
    const averageClarityScore = daySessions.reduce((sum, session) => sum + session.clarityScore, 0) / daySessions.length;
    const averageConfidenceScore = daySessions.reduce((sum, session) => sum + session.confidenceScore, 0) / daySessions.length;

    return {
      date,
      sessions: daySessions,
      totalDuration,
      averageFluencyScore: Math.round(averageFluencyScore * 100) / 100,
      averageClarityScore: Math.round(averageClarityScore * 100) / 100,
      averageConfidenceScore: Math.round(averageConfidenceScore * 100) / 100,
      sessionCount: daySessions.length,
      streakDay: totalDuration >= 5 * 60 * 1000, // 5 minutes minimum for streak
    };
  }, [sessions]);

  /**
   * Calculate weekly progress data
   */
  const getWeeklyProgress = useCallback((weeks: number = 8): WeeklyProgress[] => {
    const weeklyData: WeeklyProgress[] = [];
    
    for (let i = 0; i < weeks; i++) {
      const weekStart = getWeekStart(i);
      const weekEnd = getWeekEnd(i);
      const weekDates = getDatesInRange(weekStart, weekEnd);
      
      const dailyProgresses = weekDates.map(date => getDailyProgress(date));
      const weekSessions = dailyProgresses.flatMap(day => day.sessions);
      
      const totalSessions = weekSessions.length;
      const totalDuration = weekSessions.reduce((sum, session) => sum + session.duration, 0);
      const averageFluencyScore = weekSessions.length > 0 
        ? weekSessions.reduce((sum, session) => sum + session.fluencyScore, 0) / weekSessions.length 
        : 0;
      const averageClarityScore = weekSessions.length > 0 
        ? weekSessions.reduce((sum, session) => sum + session.clarityScore, 0) / weekSessions.length 
        : 0;
      const averageConfidenceScore = weekSessions.length > 0 
        ? weekSessions.reduce((sum, session) => sum + session.confidenceScore, 0) / weekSessions.length 
        : 0;
      
      const streakDays = dailyProgresses.filter(day => day.streakDay).length;
      
      // Exercise type breakdown
      const exerciseTypeBreakdown: Record<string, number> = {};
      weekSessions.forEach(session => {
        exerciseTypeBreakdown[session.exerciseType] = (exerciseTypeBreakdown[session.exerciseType] || 0) + 1;
      });
      
      // Calculate improvements
      const improvements = calculateImprovements(dailyProgresses, i);
      
      weeklyData.push({
        weekStart,
        weekEnd,
        totalSessions,
        totalDuration,
        averageFluencyScore: Math.round(averageFluencyScore * 100) / 100,
        averageClarityScore: Math.round(averageClarityScore * 100) / 100,
        averageConfidenceScore: Math.round(averageConfidenceScore * 100) / 100,
        streakDays,
        exerciseTypeBreakdown,
        dailyData: dailyProgresses,
        improvements,
      });
    }
    
    return weeklyData;
  }, [getDailyProgress]);

  /**
   * Calculate streak data
   */
  const getStreakData = useCallback((): StreakData => {
    const today = new Date();
    const dates = getDatesInRange(getDateDaysAgo(today, 365), formatDate(today));
    
    let currentStreak = 0;
    let longestStreak = 0;
    let streakStartDate: string | null = null;
    let lastActiveDate: string | null = null;
    const streakHistory: Array<{ startDate: string; endDate: string; length: number }> = [];
    
    let tempStreakStart: string | null = null;
    let tempStreakLength = 0;
    
    // Check from today backwards
    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i];
      const dailyProgress = getDailyProgress(date);
      
      if (dailyProgress.streakDay) {
        if (tempStreakStart === null) {
          tempStreakStart = date;
        }
        tempStreakLength++;
        
        if (i === dates.length - 1) {
          // Today or most recent day
          currentStreak = tempStreakLength;
          lastActiveDate = date;
        }
      } else {
        // Streak broken
        if (tempStreakStart !== null && tempStreakLength > 0) {
          streakHistory.push({
            startDate: tempStreakStart,
            endDate: dates[i + 1] || date,
            length: tempStreakLength,
          });
          
          longestStreak = Math.max(longestStreak, tempStreakLength);
          
          tempStreakStart = null;
          tempStreakLength = 0;
        }
      }
    }
    
    // Handle ongoing streak
    if (tempStreakStart !== null && tempStreakLength > 0) {
      streakHistory.push({
        startDate: tempStreakStart,
        endDate: dates[dates.length - 1],
        length: tempStreakLength,
      });
      
      longestStreak = Math.max(longestStreak, tempStreakLength);
      streakStartDate = tempStreakStart;
    }
    
    return {
      currentStreak,
      longestStreak,
      lastActiveDate,
      streakStartDate,
      streakHistory: streakHistory.sort((a, b) => b.length - a.length),
    };
  }, [getDailyProgress]);

  /**
   * Calculate overall progress statistics
   */
  const getProgressStats = useCallback((): ProgressStats => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageSessionDuration: 0,
        averageFluencyScore: 0,
        averageClarityScore: 0,
        averageConfidenceScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        daysActive: 0,
        firstSessionDate: null,
        lastSessionDate: null,
        favoriteExerciseType: '',
        weeklyGoalProgress: 0,
        monthlyGoalProgress: 0,
      };
    }

    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionDuration = totalDuration / sessions.length;
    const averageFluencyScore = sessions.reduce((sum, session) => sum + session.fluencyScore, 0) / sessions.length;
    const averageClarityScore = sessions.reduce((sum, session) => sum + session.clarityScore, 0) / sessions.length;
    const averageConfidenceScore = sessions.reduce((sum, session) => sum + session.confidenceScore, 0) / sessions.length;
    
    const uniqueDates = new Set(sessions.map(session => formatDate(session.completedAt)));
    const daysActive = uniqueDates.size;
    
    const sortedSessions = [...sessions].sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
    const firstSessionDate = formatDate(sortedSessions[0].completedAt);
    const lastSessionDate = formatDate(sortedSessions[sortedSessions.length - 1].completedAt);
    
    // Favorite exercise type
    const exerciseTypeCounts: Record<string, number> = {};
    sessions.forEach(session => {
      exerciseTypeCounts[session.exerciseType] = (exerciseTypeCounts[session.exerciseType] || 0) + 1;
    });
    const favoriteExerciseType = Object.entries(exerciseTypeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    const streakData = getStreakData();
    
    // Goal progress
    const weeklyProgress = getWeeklyProgress(1)[0];
    const weeklyGoalProgress = Math.min(100, (weeklyProgress.totalSessions / goals.weeklySessions) * 100);
    
    const monthlySessions = sessions.filter(session => 
      isWithinDays(session.completedAt, 30)
    ).length;
    const monthlyGoalProgress = Math.min(100, (monthlySessions / goals.monthlySessions) * 100);

    return {
      totalSessions: sessions.length,
      totalDuration,
      averageSessionDuration: Math.round(averageSessionDuration),
      averageFluencyScore: Math.round(averageFluencyScore * 100) / 100,
      averageClarityScore: Math.round(averageClarityScore * 100) / 100,
      averageConfidenceScore: Math.round(averageConfidenceScore * 100) / 100,
      currentStreak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      daysActive,
      firstSessionDate,
      lastSessionDate,
      favoriteExerciseType,
      weeklyGoalProgress: Math.round(weeklyGoalProgress),
      monthlyGoalProgress: Math.round(monthlyGoalProgress),
    };
  }, [sessions, goals, getStreakData, getWeeklyProgress]);

  /**
   * Generate dashboard data
   */
  const getDashboardData = useCallback((): DashboardData => {
    const stats = getProgressStats();
    const streak = getStreakData();
    const weeklyProgress = getWeeklyProgress(8);
    const recentSessions = sessions.slice(0, 10);
    const improvements = calculateOverallImprovements(weeklyProgress);
    
    // Chart data
    const fluencyTrend = weeklyProgress.map(week => ({
      date: week.weekStart,
      value: week.averageFluencyScore,
    }));
    
    const durationTrend = weeklyProgress.map(week => ({
      date: week.weekStart,
      value: Math.round(week.totalDuration / (1000 * 60)), // convert to minutes
    }));
    
    const sessionCountTrend = weeklyProgress.map(week => ({
      date: week.weekStart,
      value: week.totalSessions,
    }));
    
    // Exercise type distribution
    const exerciseTypeCounts: Record<string, number> = {};
    sessions.forEach(session => {
      exerciseTypeCounts[session.exerciseType] = (exerciseTypeCounts[session.exerciseType] || 0) + 1;
    });
    
    const totalSessions = sessions.length;
    const exerciseTypeDistribution = Object.entries(exerciseTypeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0,
    }));

    return {
      stats,
      streak,
      weeklyProgress,
      recentSessions,
      improvements,
      goals,
      chartData: {
        fluencyTrend,
        durationTrend,
        sessionCountTrend,
        exerciseTypeDistribution,
      },
    };
  }, [sessions, goals, getProgressStats, getStreakData, getWeeklyProgress]);

  /**
   * Clear all progress data
   */
  const clearAllData = useCallback(() => {
    setSessions([]);
    setGoals(DEFAULT_GOALS);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
  }, []);

  /**
   * Export progress data
   */
  const exportProgressData = useCallback(() => {
    const data = {
      sessions,
      goals,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speechgym-progress-${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sessions, goals]);

  /**
   * Import progress data
   */
  const importProgressData = useCallback((file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.sessions) {
            const importedSessions = data.sessions.map((session: any) => ({
              ...session,
              completedAt: new Date(session.completedAt),
            }));
            setSessions(importedSessions);
          }
          
          if (data.goals) {
            setGoals({ ...DEFAULT_GOALS, ...data.goals });
          }
          
          resolve();
        } catch (error) {
          reject(new Error('Invalid progress data file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  return {
    // Data
    sessions,
    goals,
    isLoading,
    
    // Actions
    addSession,
    addSessionFromAnalysis,
    updateGoals,
    clearAllData,
    exportProgressData,
    importProgressData,
    
    // Computed data
    getDailyProgress,
    getWeeklyProgress,
    getStreakData,
    getProgressStats,
    getDashboardData,
  };
};

// Utility functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDateDaysAgo(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return formatDate(result);
}

function getWeekStart(weeksAgo: number): string {
  const today = new Date();
  const daysAgo = weeksAgo * 7;
  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() - daysAgo);
  
  // Get Monday of the week
  const dayOfWeek = targetDate.getDay();
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  return formatDate(monday);
}

function getWeekEnd(weeksAgo: number): string {
  const weekStart = new Date(getWeekStart(weeksAgo));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return formatDate(weekEnd);
}

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(formatDate(date));
  }
  
  return dates;
}

function isWithinDays(date: Date, days: number): boolean {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

function calculateImprovements(dailyProgresses: DailyProgress[], weekIndex: number): ProgressImprovement[] {
  if (weekIndex >= 7) return []; // Need at least 2 weeks for comparison
  
  const improvements: ProgressImprovement[] = [];
  
  // Compare with previous week (simplified - would need actual previous week data)
  // This is a placeholder implementation
  const avgFluency = dailyProgresses.reduce((sum, day) => sum + day.averageFluencyScore, 0) / dailyProgresses.length;
  
  if (avgFluency > 0) {
    improvements.push({
      metric: 'fluency',
      change: 5, // Placeholder
      period: 'week',
      direction: 'increase',
    });
  }
  
  return improvements;
}

function calculateOverallImprovements(weeklyProgress: WeeklyProgress[]): ProgressImprovement[] {
  const improvements: ProgressImprovement[] = [];
  
  if (weeklyProgress.length >= 2) {
    const currentWeek = weeklyProgress[0];
    const previousWeek = weeklyProgress[1];
    
    // Fluency improvement
    const fluencyChange = currentWeek.averageFluencyScore - previousWeek.averageFluencyScore;
    if (Math.abs(fluencyChange) > 1) {
      improvements.push({
        metric: 'fluency',
        change: Math.round((fluencyChange / previousWeek.averageFluencyScore) * 100),
        period: 'week',
        direction: fluencyChange > 0 ? 'increase' : 'decrease',
      });
    }
    
    // Duration improvement
    const durationChange = currentWeek.totalDuration - previousWeek.totalDuration;
    if (Math.abs(durationChange) > 60000) { // 1 minute threshold
      improvements.push({
        metric: 'duration',
        change: Math.round((durationChange / previousWeek.totalDuration) * 100),
        period: 'week',
        direction: durationChange > 0 ? 'increase' : 'decrease',
      });
    }
  }
  
  return improvements;
}

export default useProgress;
