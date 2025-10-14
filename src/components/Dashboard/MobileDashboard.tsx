"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/contexts/AuthContext';

// Dashboard data interface
interface DashboardData {
  todayExercise: {
    type: 'breathing' | 'pacing' | 'repetition' | 'freeSpeech';
    name: string;
    description: string;
    icon: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number;
  };
  weeklyProgress: {
    date: string;
    completed: boolean;
    duration: number;
    exerciseType: string;
    fluencyScore: number;
  }[];
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  averageFluency: number;
  recentHistory: {
    id: string;
    date: string;
    exerciseType: string;
    duration: number;
    fluencyScore: number;
    name: string;
  }[];
}

// Swipe gesture hook for weekly progress cards
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

// Streak celebration component
const StreakCelebration: React.FC<{ streak: number; isVisible: boolean }> = ({ streak, isVisible }) => {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isVisible && streak > 0 && streak % 5 === 0) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [streak, isVisible]);

  if (!showCelebration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <div className="text-8xl animate-bounce mb-4">🎉</div>
        <div className="text-4xl font-bold text-yellow-600 mb-2">
          {streak} Day Streak!
        </div>
        <div className="text-xl text-gray-700">
          Amazing dedication!
        </div>
      </div>
    </div>
  );
};

// Weekly progress card component
const WeeklyProgressCard: React.FC<{
  dayData: DashboardData['weeklyProgress'][0];
  isActive: boolean;
}> = ({ dayData, isActive }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
    };
  };

  const { day, date } = formatDate(dayData.date);

  return (
    <div
      className={cn(
        'flex-shrink-0 w-20 h-24 rounded-xl flex flex-col items-center justify-center transition-all duration-200',
        dayData.completed
          ? 'bg-green-100 border-2 border-green-300 shadow-md'
          : 'bg-gray-100 border-2 border-gray-200',
        isActive && 'scale-105 shadow-lg'
      )}
    >
      <div className="text-xs font-medium text-gray-600 mb-1">{day}</div>
      <div className="text-lg font-bold text-gray-900 mb-1">{date}</div>
      {dayData.completed ? (
        <div className="text-green-600 text-lg">✓</div>
      ) : (
        <div className="w-3 h-3 rounded-full bg-gray-300"></div>
      )}
    </div>
  );
};

// Today's exercise card component
const TodaysExerciseCard: React.FC<{
  exercise: DashboardData['todayExercise'];
  onStart: () => void;
}> = ({ exercise, onStart }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'breathing':
        return '🌬️';
      case 'pacing':
        return '🐢';
      case 'repetition':
        return '🗣️';
      case 'freeSpeech':
        return '💬';
      default:
        return '🎯';
    }
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-3xl shadow-xl border border-gray-100">
      {/* Background gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10"></div>
      
      <div className="relative p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-r from-blue-500 to-purple-600">
              {getExerciseIcon(exercise.type)}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Today's Exercise</h2>
              <p className="text-gray-500 text-sm">Recommended for you</p>
            </div>
          </div>
          <span className={cn(
            'px-4 py-2 rounded-full text-xs font-semibold shadow-lg',
            getDifficultyColor(exercise.difficulty)
          )}>
            {exercise.difficulty}
          </span>
        </div>

        <div className="mb-6">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {exercise.name}
          </h3>
          <p className="text-gray-600 text-lg leading-relaxed">{exercise.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium">{Math.round(exercise.estimatedDuration / 60)} min</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">AI Guided</span>
            </div>
          </div>
          <button
            onClick={onStart}
            className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Now
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Stats card component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}> = ({ title, value, icon, color, trend }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'stable':
        return '➡️';
      default:
        return null;
    }
  };

  const getCardGradient = () => {
    if (color.includes('orange')) return 'from-orange-500 to-red-500';
    if (color.includes('blue')) return 'from-blue-500 to-indigo-500';
    if (color.includes('green')) return 'from-green-500 to-emerald-500';
    if (color.includes('purple')) return 'from-purple-500 to-pink-500';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
      <div className="relative mb-4">
        <div className={cn("w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-r text-white shadow-lg", getCardGradient())}>
          {icon}
        </div>
      </div>
      <div className={cn('text-3xl font-bold mb-2', color)}>{value}</div>
      <div className="text-sm font-medium text-gray-700 mb-3">{title}</div>
      {trend && (
        <div className="text-xs px-3 py-1 rounded-full font-medium inline-flex items-center space-x-1 bg-gray-100 text-gray-600">
          <span>{getTrendIcon()}</span>
          <span className="capitalize">{trend}</span>
        </div>
      )}
    </div>
  );
};

// Recent history item component
const HistoryItem: React.FC<{
  item: DashboardData['recentHistory'][0];
}> = ({ item }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'breathing':
        return '🌬️';
      case 'pacing':
        return '🐢';
      case 'repetition':
        return '🗣️';
      case 'freeSpeech':
        return '💬';
      default:
        return '🎯';
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="text-2xl">{getExerciseIcon(item.exerciseType)}</div>
      <div className="flex-1">
        <div className="font-medium text-gray-900 text-sm">{item.name}</div>
        <div className="text-xs text-gray-500">{formatDate(item.date)}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-gray-900">{formatDuration(item.duration)}</div>
        <div className="text-xs text-gray-500">{item.fluencyScore.toFixed(0)}% fluency</div>
      </div>
    </div>
  );
};

// Main dashboard component
export default function MobileDashboard({
  className,
}: {
  className?: string;
}) {
  const { user } = useAuth();
  const { getDashboardData } = useProgress();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = () => {
      const progressData = getDashboardData();
      
      // Mock today's exercise (in a real app, this would come from a recommendation system)
      const todayExercise = {
        type: 'breathing' as const,
        name: 'Morning Breathing',
        description: 'Start your day with gentle breathing exercises',
        icon: '🌬️',
        difficulty: 'beginner' as const,
        estimatedDuration: 180000, // 3 minutes
      };

      // Generate weekly progress data (last 7 days)
      const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString(),
          completed: Math.random() > 0.3, // 70% completion rate
          duration: Math.floor(Math.random() * 300000) + 60000, // 1-5 minutes
          exerciseType: ['breathing', 'pacing', 'repetition', 'freeSpeech'][Math.floor(Math.random() * 4)],
          fluencyScore: Math.floor(Math.random() * 40) + 60, // 60-100%
        };
      });

      // Generate recent history
      const recentHistory = Array.from({ length: 5 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (i + 1));
        return {
          id: `history_${i}`,
          date: date.toISOString(),
          exerciseType: ['breathing', 'pacing', 'repetition', 'freeSpeech'][Math.floor(Math.random() * 4)],
          duration: Math.floor(Math.random() * 300000) + 60000,
          fluencyScore: Math.floor(Math.random() * 40) + 60,
          name: ['Morning Breathing', 'Pacing Practice', 'Word Repetition', 'Free Speech'][Math.floor(Math.random() * 4)],
        };
      });

      setDashboardData({
        todayExercise,
        weeklyProgress,
        currentStreak: progressData.stats.currentStreak,
        longestStreak: progressData.stats.longestStreak,
        totalSessions: progressData.stats.totalSessions,
        averageFluency: progressData.stats.averageFluencyScore,
        recentHistory,
      });
    };

    loadDashboardData();
  }, [getDashboardData]);

  // Swipe gestures for weekly progress
  const swipeGestures = useSwipeGesture(
    () => {
      // Swipe left - next week
      if (currentWeekIndex < 3) {
        setCurrentWeekIndex(prev => prev + 1);
      }
    },
    () => {
      // Swipe right - previous week
      if (currentWeekIndex > 0) {
        setCurrentWeekIndex(prev => prev - 1);
      }
    }
  );

  // Handle today's exercise start
  const handleStartExercise = () => {
    if (!dashboardData) return;
    
    // Navigate to the appropriate exercise
    const exerciseUrl = `/exercises?type=${dashboardData.todayExercise.type}`;
    window.location.href = exerciseUrl;
  };

  // Show streak celebration when streak changes
  useEffect(() => {
    if (dashboardData && dashboardData.currentStreak > 0 && dashboardData.currentStreak % 5 === 0) {
      setShowStreakCelebration(true);
      const timer = setTimeout(() => setShowStreakCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [dashboardData?.currentStreak]);

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 pb-20 md:pb-0 md:ml-64', className)}>
      {/* Streak Celebration */}
      <StreakCelebration 
        streak={dashboardData.currentStreak} 
        isVisible={showStreakCelebration} 
      />

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative p-4 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold mb-2">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
              </h1>
              <p className="text-blue-100 md:text-lg">
                {user?.user_metadata?.full_name || 'Ready to practice?'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <div className="text-blue-100 text-sm">Current Streak</div>
                <div className="text-3xl font-bold text-yellow-300">{dashboardData.currentStreak} days 🔥</div>
              </div>
              <Link
                href="/profile"
                className="btn-touch bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors backdrop-blur-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 md:space-y-8 -mt-4">
        {/* Today's Exercise */}
        <TodaysExerciseCard 
          exercise={dashboardData.todayExercise}
          onStart={handleStartExercise}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Current Streak"
            value={`${dashboardData.currentStreak} days`}
            icon="🔥"
            color="text-orange-600"
            trend="up"
          />
          <StatsCard
            title="Total Sessions"
            value={dashboardData.totalSessions}
            icon="📚"
            color="text-blue-600"
            trend="up"
          />
          <StatsCard
            title="Avg Fluency"
            value={`${dashboardData.averageFluency.toFixed(0)}%`}
            icon="✨"
            color="text-green-600"
            trend="stable"
          />
          <StatsCard
            title="Best Streak"
            value={`${dashboardData.longestStreak} days`}
            icon="🏆"
            color="text-purple-600"
            trend="stable"
          />
        </div>

        {/* Desktop Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Weekly Progress */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Weekly Progress</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentWeekIndex === 0}
                  className="btn-touch bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentWeekIndex(prev => Math.min(3, prev + 1))}
                  disabled={currentWeekIndex === 3}
                  className="btn-touch bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div 
              className="flex space-x-3 overflow-x-auto pb-2"
              {...swipeGestures}
            >
              {dashboardData.weeklyProgress.map((dayData, index) => (
                <WeeklyProgressCard
                  key={dayData.date}
                  dayData={dayData}
                  isActive={index === Math.floor(dashboardData.weeklyProgress.length / 2)}
                />
              ))}
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Swipe to see different weeks • Week {currentWeekIndex + 1} of 4
              </p>
            </div>
          </div>

          {/* Recent History */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent History</h2>
              <Link
                href="/progress"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>

            <div className="space-y-2">
              {dashboardData.recentHistory.map((item) => (
                <HistoryItem key={item.id} item={item} />
              ))}
            </div>

            {dashboardData.recentHistory.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl text-gray-400 mb-2">📚</div>
                <p className="text-gray-600">No recent exercises</p>
                <p className="text-sm text-gray-500">Start your first exercise to see your history here!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Link
            href="/exercises"
            className="btn-touch bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-colors shadow-lg"
          >
            <div className="text-2xl mb-2">🎯</div>
            <div>All Exercises</div>
          </Link>
          
          <Link
            href="/progress"
            className="btn-touch bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-colors shadow-lg"
          >
            <div className="text-2xl mb-2">📊</div>
            <div>View Progress</div>
          </Link>

          <Link
            href="/breathing-demo"
            className="btn-touch bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-colors shadow-lg"
          >
            <div className="text-2xl mb-2">🌬️</div>
            <div>Breathing</div>
          </Link>

          <Link
            href="/profile"
            className="btn-touch bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl text-center transition-colors shadow-lg"
          >
            <div className="text-2xl mb-2">👤</div>
            <div>Profile</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
