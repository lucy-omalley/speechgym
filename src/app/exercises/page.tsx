"use client";

import { useState } from 'react';
import MobileExercisePlayer, { ExerciseResult } from '@/components/ExercisePlayer/MobileExercisePlayer';
import { createBreathingExercise, createPacingExercise, createRepetitionExercise, createFreeSpeechExercise, SpeechExercise } from '@/types';
import { useProgress } from '@/hooks/useProgress';
import { speechAnalysisService } from '@/services/speechAnalysis';
import { cn } from '@/lib/utils';

export default function ExercisesPage() {
  // Updated with new theme
  const { addSessionFromAnalysis } = useProgress();
  const [selectedExercise, setSelectedExercise] = useState<SpeechExercise | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const exercises = [
    {
      id: 'breathing',
      title: 'Breathing Exercises',
      description: 'Practice controlled breathing techniques',
      type: 'breathing' as const,
      icon: '🫁',
    },
    {
      id: 'pacing',
      title: 'Pacing Practice',
      description: 'Work on speech rhythm and timing',
      type: 'pacing' as const,
      icon: '⏱️',
    },
    {
      id: 'repetition',
      title: 'Repetition Drills',
      description: 'Practice word and phrase repetition',
      type: 'repetition' as const,
      icon: '🔄',
    },
    {
      id: 'free-speech',
      title: 'Free Speech',
      description: 'Open conversation practice',
      type: 'freeSpeech' as const,
      icon: '💬',
    },
  ];

  const handleExerciseSelect = (exerciseType: string) => {
    // For breathing exercises, redirect to dedicated breathing page
    if (exerciseType === 'breathing') {
      window.location.href = '/breathing';
      return;
    }
    
    let exercise: SpeechExercise;
    
    switch (exerciseType) {
      case 'pacing':
        exercise = createPacingExercise(
          'pacing-exercise',
          'Speech Pacing Practice',
          'beginner',
          'Practice speaking at different speeds with clear pronunciation and steady rhythm.',
          {
            targetPace: 120,
            description: 'Practice speaking at different speeds',
          }
        );
        break;
      case 'repetition':
        exercise = createRepetitionExercise(
          'repetition-exercise',
          'Word Repetition',
          'beginner',
          'Practice clear pronunciation through repetition of words and phrases.',
          5,
          {
            description: 'Repeat words and phrases clearly',
          }
        );
        break;
      case 'free-speech':
        exercise = createFreeSpeechExercise(
          'free-speech-exercise',
          'Free Speech Practice',
          'beginner',
          'Tell me about your favorite hobby or activity.',
          60,
          {
            description: 'Speak freely about any topic',
          }
        );
        break;
      default:
        return;
    }
    
    setSelectedExercise(exercise);
  };

  const handleExerciseComplete = async (result: ExerciseResult) => {
    setIsLoading(true);
    
    try {
      // Analyze the recorded audio
      if (result.audioBlob) {
        const analysisResult = await speechAnalysisService.analyzeSpeech(result.audioBlob, {
          language: 'en',
          enableOfflineMode: true,
          cacheResults: true,
        });

        // Add session to progress tracking
        await addSessionFromAnalysis(
          result.exercise.id,
          result.exercise.type,
          analysisResult,
          {
            notes: `Completed ${result.exercise.title}`,
            audioUrl: result.audioUrl,
          }
        );

        // Show completion message with analysis results
        alert(`Exercise completed! Fluency Score: ${analysisResult.fluency.fluencyScore}%`);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Exercise completed! (Analysis unavailable)');
    } finally {
      setIsLoading(false);
      // Ensure we properly reset the selected exercise
      setSelectedExercise(null);
    }
  };

  const handleBackToExercises = () => {
    setSelectedExercise(null);
  };

  if (selectedExercise) {
    return (
      <MobileExercisePlayer
        exercise={selectedExercise}
        onComplete={handleExerciseComplete}
        onCancel={handleBackToExercises}
        isLoading={isLoading}
        showInstructions={true}
        allowSkip={true}
        autoStart={false}
        enableHaptics={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 pb-20 md:pb-0 md:ml-64">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative p-4 md:p-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl">🎯</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold">Speech Exercises</h1>
              <p className="text-blue-100 md:text-lg">Choose an exercise to practice your speech skills</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 -mt-4">
        <div className="max-w-6xl mx-auto">
          {/* Exercise Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {exercises.map((exercise, index) => {
              const gradients = [
                'from-blue-500 to-indigo-600',
                'from-purple-500 to-pink-600', 
                'from-green-500 to-emerald-600',
                'from-orange-500 to-red-600'
              ];
              
              return (
                <button
                  key={exercise.id}
                  onClick={() => handleExerciseSelect(exercise.type)}
                  className="group bg-white rounded-3xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                >
                  <div className="relative mb-4">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-r text-white shadow-lg group-hover:scale-110 transition-transform duration-300",
                      gradients[index]
                    )}>
                      {exercise.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {exercise.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {exercise.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Start Exercise</span>
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tips Section */}
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-xl">💡</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Tips for Success</h3>
                <p className="text-gray-600">Get the most out of your practice sessions</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <p className="text-gray-700">Find a quiet environment for practice</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <p className="text-gray-700">Speak clearly and at a comfortable pace</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <p className="text-gray-700">Practice regularly for best results</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <p className="text-gray-700">Review your progress in the dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
