"use client";

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CoachingFeedback, CoachingSession } from '@/services/coachingService';
import { SpeechAnalysisResult } from '@/services/speechAnalysis';

// Real-time feedback props
interface RealTimeFeedbackProps {
  analysisResult?: SpeechAnalysisResult;
  coachingSession?: CoachingSession;
  isRecording?: boolean;
  audioLevel?: number;
  duration?: number;
  className?: string;
}

// Feedback indicator component
interface FeedbackIndicatorProps {
  feedback: CoachingFeedback;
  isActive: boolean;
  onDismiss: () => void;
}

const FeedbackIndicator: React.FC<FeedbackIndicatorProps> = ({ feedback, isActive, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setAnimationClass('animate-feedback-in');
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const handleDismiss = () => {
    setAnimationClass('animate-feedback-out');
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  if (!isVisible) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-300 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-blue-100 border-blue-300 text-blue-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🏆';
      case 'improvement': return '📈';
      case 'encouragement': return '💪';
      case 'tip': return '💡';
      case 'warning': return '⚠️';
      default: return '📝';
    }
  };

  return (
    <div
      className={cn(
        'fixed top-20 left-4 right-4 z-50 transform transition-all duration-300 ease-out',
        animationClass,
        getPriorityColor(feedback.priority)
      )}
      style={{
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <div className="bg-white rounded-xl shadow-lg border-2 p-4 mx-2">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">{feedback.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {feedback.title}
              </h3>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Dismiss feedback"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-2">{feedback.message}</p>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-600 font-medium">💡 {feedback.actionableAdvice}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Audio level visualization component
const AudioLevelIndicator: React.FC<{ level: number; isActive: boolean }> = ({ level, isActive }) => {
  const bars = Array.from({ length: 5 }, (_, i) => {
    const threshold = (i + 1) * 0.2;
    const isActive = level >= threshold;
    return (
      <div
        key={i}
        className={cn(
          'w-1 bg-gray-300 rounded-full transition-all duration-100',
          isActive ? 'bg-green-500' : 'bg-gray-300',
          i === 0 && 'h-2',
          i === 1 && 'h-4',
          i === 2 && 'h-6',
          i === 3 && 'h-8',
          i === 4 && 'h-10'
        )}
      />
    );
  });

  return (
    <div className="flex items-end space-x-1 justify-center">
      {bars}
    </div>
  );
};

// Pace indicator component
const PaceIndicator: React.FC<{ wpm?: number; targetWpm?: number }> = ({ wpm, targetWpm = 140 }) => {
  if (!wpm) return null;

  const getPaceStatus = () => {
    if (wpm < targetWpm - 20) return { status: 'slow', color: 'text-blue-600', icon: '🐌' };
    if (wpm > targetWpm + 20) return { status: 'fast', color: 'text-red-600', icon: '🏃' };
    return { status: 'good', color: 'text-green-600', icon: '✅' };
  };

  const { status, color, icon } = getPaceStatus();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-lg">{icon}</span>
      <span className={cn('text-sm font-medium', color)}>
        {wpm} WPM
      </span>
      <span className="text-xs text-gray-500">
        ({status})
      </span>
    </div>
  );
};

// Main real-time feedback component
export default function RealTimeFeedback({
  analysisResult,
  coachingSession,
  isRecording = false,
  audioLevel = 0,
  duration = 0,
  className,
}: RealTimeFeedbackProps) {
  const [activeFeedback, setActiveFeedback] = useState<CoachingFeedback[]>([]);
  const [dismissedFeedback, setDismissedFeedback] = useState<Set<string>>(new Set());
  const [showAudioLevel, setShowAudioLevel] = useState(false);
  const audioLevelTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show audio level when recording starts
  useEffect(() => {
    if (isRecording) {
      setShowAudioLevel(true);
      if (audioLevelTimeoutRef.current) {
        clearTimeout(audioLevelTimeoutRef.current);
      }
    } else {
      // Hide audio level after recording stops
      audioLevelTimeoutRef.current = setTimeout(() => {
        setShowAudioLevel(false);
      }, 2000);
    }

    return () => {
      if (audioLevelTimeoutRef.current) {
        clearTimeout(audioLevelTimeoutRef.current);
      }
    };
  }, [isRecording]);

  // Process coaching feedback when available
  useEffect(() => {
    if (coachingSession?.feedback) {
      const newFeedback = coachingSession.feedback.filter(
        fb => !dismissedFeedback.has(fb.id)
      );
      setActiveFeedback(newFeedback);
    }
  }, [coachingSession, dismissedFeedback]);

  // Handle feedback dismissal
  const handleDismissFeedback = (feedbackId: string) => {
    setDismissedFeedback(prev => new Set(prev).add(feedbackId));
    setActiveFeedback(prev => prev.filter(fb => fb.id !== feedbackId));
  };

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` : `${remainingSeconds}s`;
  };

  return (
    <div className={cn('fixed inset-0 pointer-events-none z-40', className)}>
      {/* Recording status overlay */}
      {isRecording && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording</span>
            <span className="text-sm opacity-90">{formatDuration(duration)}</span>
          </div>
        </div>
      )}

      {/* Audio level indicator */}
      {showAudioLevel && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="text-center mb-2">
              <div className="text-xs text-gray-600 mb-1">Audio Level</div>
              <AudioLevelIndicator level={audioLevel} isActive={isRecording} />
            </div>
          </div>
        </div>
      )}

      {/* Pace indicator */}
      {analysisResult?.fluency.wordsPerMinute && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-white rounded-lg shadow-lg px-4 py-2">
            <PaceIndicator 
              wpm={analysisResult.fluency.wordsPerMinute} 
              targetWpm={140}
            />
          </div>
        </div>
      )}

      {/* Coaching feedback indicators */}
      {activeFeedback.map((feedback, index) => (
        <div
          key={feedback.id}
          style={{
            top: `${120 + index * 120}px`,
          }}
        >
          <FeedbackIndicator
            feedback={feedback}
            isActive={true}
            onDismiss={() => handleDismissFeedback(feedback.id)}
          />
        </div>
      ))}

      {/* Quick stats overlay */}
      {coachingSession && !isRecording && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
          <div className="bg-white rounded-lg shadow-lg p-3 mx-2">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {coachingSession.overallScore}%
                </div>
                <div className="text-xs text-gray-600">Overall</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {coachingSession.strengths.length}
                </div>
                <div className="text-xs text-gray-600">Strengths</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {coachingSession.improvementAreas.length}
                </div>
                <div className="text-xs text-gray-600">Focus Areas</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export additional components for standalone use
export { FeedbackIndicator, AudioLevelIndicator, PaceIndicator };
