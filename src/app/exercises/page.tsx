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
  const [showPacingPatterns, setShowPacingPatterns] = useState(false);

  // Speech pacing exercise materials organized by difficulty
  const pacingMaterials = {
    beginner: [
      {
        id: 'alphabet-sentence',
        text: 'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is perfect for practicing clear speech and consistent pacing.',
        targetPace: 120,
        description: 'Alphabet sentence for clear pronunciation practice'
      },
      {
        id: 'simple-greeting',
        text: 'Hello, my name is Sarah. I am learning to speak clearly and at a steady pace. Today is a beautiful day, and I feel confident about my speech practice.',
        targetPace: 115,
        description: 'Simple greeting for basic speech flow'
      },
      {
        id: 'daily-routine',
        text: 'Every morning, I wake up at seven o\'clock. I brush my teeth, eat breakfast, and then go to work. In the evening, I like to read books and watch television.',
        targetPace: 125,
        description: 'Daily routine for consistent rhythm'
      },
      {
        id: 'family-introduction',
        text: 'My family consists of four people: my father, my mother, my sister, and me. We live in a small house with a beautiful garden where we grow vegetables and flowers.',
        targetPace: 118,
        description: 'Family introduction for clear articulation'
      }
    ],
    intermediate: [
      {
        id: 'tongue-twister',
        text: 'She sells seashells by the seashore. The shells she sells are seashells, I\'m sure. So if she sells seashells on the seashore, then I\'m sure she sells seashore shells.',
        targetPace: 130,
        description: 'Tongue twister for articulation and rhythm'
      },
      {
        id: 'weather-report',
        text: 'Today\'s weather forecast shows sunny skies with a high of seventy-five degrees and a low of fifty-five degrees. There is a slight chance of rain in the evening, so remember to bring an umbrella if you plan to go out.',
        targetPace: 140,
        description: 'Weather report for natural speech patterns'
      },
      {
        id: 'story-beginning',
        text: 'Once upon a time, in a small village nestled between rolling hills and dense forests, there lived a young girl who possessed an extraordinary gift. She could speak with animals, and they would understand her perfectly.',
        targetPace: 150,
        description: 'Story narrative for engaging delivery'
      },
      {
        id: 'poetry-excerpt',
        text: 'The woods are lovely, dark and deep, but I have promises to keep, and miles to go before I sleep, and miles to go before I sleep. This beautiful verse reminds us of life\'s journey and the responsibilities we carry.',
        targetPace: 140,
        description: 'Poetry for rhythm and expression'
      },
      {
        id: 'conversation-practice',
        text: 'Hi there! I\'m really excited to tell you about my recent trip to the mountains. The scenery was absolutely breathtaking, and I met some wonderful people along the way. Have you ever been hiking in the mountains?',
        targetPace: 135,
        description: 'Conversational speech for natural flow'
      },
      {
        id: 'technical-instructions',
        text: 'To assemble this furniture, first ensure you have all the required tools and components. Begin by attaching the legs to the base using the provided screws. Make sure to tighten them securely but not overly tight to avoid stripping the threads.',
        targetPace: 145,
        description: 'Instructions for clear, precise delivery'
      }
    ],
    advanced: [
      {
        id: 'scientific-explanation',
        text: 'Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. This remarkable biochemical process occurs primarily in the chloroplasts of plant cells and is essential for life on Earth.',
        targetPace: 160,
        description: 'Scientific content for complex vocabulary'
      },
      {
        id: 'news-article',
        text: 'Scientists have made a groundbreaking discovery that could revolutionize renewable energy. The new solar panel technology increases efficiency by forty percent while reducing manufacturing costs by half, making clean energy more accessible worldwide.',
        targetPace: 155,
        description: 'News content for formal speech delivery'
      },
      {
        id: 'historical-narrative',
        text: 'The Renaissance period marked a significant cultural transformation in Europe, spanning roughly from the fourteenth to the seventeenth century. This era witnessed remarkable advances in art, science, literature, and philosophy that continue to influence our world today.',
        targetPace: 150,
        description: 'Historical content for educational speech'
      },
      {
        id: 'philosophical-discourse',
        text: 'The concept of wisdom transcends mere knowledge accumulation, encompassing the profound understanding of life\'s complexities and the ability to apply insights with compassion and discernment. True wisdom emerges from the synthesis of experience, reflection, and empathy.',
        targetPace: 165,
        description: 'Philosophical content for sophisticated delivery'
      },
      {
        id: 'literary-analysis',
        text: 'Shakespeare\'s masterful use of iambic pentameter creates a natural rhythm that mirrors human speech patterns while elevating the emotional intensity of his characters\' dialogues. This poetic structure allows for both intimate soliloquies and dramatic confrontations.',
        targetPace: 158,
        description: 'Literary analysis for academic presentation'
      }
    ]
  };

  // Function to get random pacing material by difficulty
  const getRandomPacingMaterial = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    const materials = pacingMaterials[difficulty];
    const randomIndex = Math.floor(Math.random() * materials.length);
    return materials[randomIndex];
  };

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
      title: 'Pacing Exercises',
      description: 'Practice speech rhythm and timing with varied content',
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

  const handleExerciseSelect = (exerciseId: string) => {
    console.log('Exercise selected:', exerciseId); // Debug log
    
    // For breathing exercises, redirect to dedicated breathing page
    if (exerciseId === 'breathing') {
      window.location.href = '/breathing';
      return;
    }
    
    // For pacing exercises, show pattern selection
    if (exerciseId === 'pacing') {
      setShowPacingPatterns(true);
      return;
    }
    
    let exercise: SpeechExercise;
    
    switch (exerciseId) {
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
        console.warn('Unknown exercise ID:', exerciseId);
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

  const handlePacingPatternSelect = (difficulty: 'beginner' | 'intermediate' | 'advanced') => {
    const randomMaterial = getRandomPacingMaterial(difficulty);
    const exercise = createPacingExercise(
      `pacing-${randomMaterial.id}`,
      `Pacing Practice - ${randomMaterial.description}`,
      difficulty,
      randomMaterial.text,
      {
        targetPace: randomMaterial.targetPace,
        description: randomMaterial.description,
      }
    );
    setSelectedExercise(exercise);
    setShowPacingPatterns(false);
  };

  const handleBackToExercises = () => {
    setSelectedExercise(null);
    setShowPacingPatterns(false);
  };

  if (selectedExercise) {
    console.log('Rendering MobileExercisePlayer with exercise:', selectedExercise.name);
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

  if (showPacingPatterns) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 pb-20 md:pb-0 md:ml-64">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative p-4 md:p-8">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => setShowPacingPatterns(false)}
                className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <span className="text-white text-xl">←</span>
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl">⏱️</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold">Choose Pacing Pattern</h1>
                <p className="text-blue-100 md:text-lg">Select your difficulty level for varied speech practice</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 -mt-4">
          <div className="max-w-4xl mx-auto">
            {/* Pattern Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Beginner */}
              <button
                onClick={() => handlePacingPatternSelect('beginner')}
                className="group bg-white rounded-3xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto">
                    🟢
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                  Beginner
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Simple sentences and clear pronunciation practice. Perfect for building confidence and basic speech rhythm.
                </p>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="text-sm font-medium text-green-800 mb-1">Target Pace: 115-125 WPM</div>
                  <div className="text-xs text-green-600">4 practice materials available</div>
                </div>
              </button>

              {/* Intermediate */}
              <button
                onClick={() => handlePacingPatternSelect('intermediate')}
                className="group bg-white rounded-3xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto">
                    🟡
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-yellow-600 transition-colors">
                  Intermediate
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Varied content with natural speech patterns. Practice with stories, conversations, and instructions.
                </p>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                  <div className="text-sm font-medium text-yellow-800 mb-1">Target Pace: 130-150 WPM</div>
                  <div className="text-xs text-yellow-600">6 practice materials available</div>
                </div>
              </button>

              {/* Advanced */}
              <button
                onClick={() => handlePacingPatternSelect('advanced')}
                className="group bg-white rounded-3xl shadow-lg p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto">
                    🔴
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-red-600 transition-colors">
                  Advanced
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Complex vocabulary and sophisticated content. Challenge yourself with academic and professional speech delivery.
                </p>
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-200">
                  <div className="text-sm font-medium text-red-800 mb-1">Target Pace: 150-165 WPM</div>
                  <div className="text-xs text-red-600">5 practice materials available</div>
                </div>
              </button>
            </div>

            {/* Tips Section */}
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-xl">💡</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Pacing Exercise Tips</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Start with Beginner</h4>
                        <p className="text-sm text-gray-600">Build confidence with simple, clear sentences before advancing</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Focus on Rhythm</h4>
                        <p className="text-sm text-gray-600">Maintain steady pace rather than speed - consistency is key</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Random Materials</h4>
                        <p className="text-sm text-gray-600">Each session provides fresh content to keep practice engaging</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Real-time Feedback</h4>
                        <p className="text-sm text-gray-600">Get instant pace and rhythm analysis as you speak</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                  onClick={() => {
                    console.log('Button clicked for:', exercise.id, exercise.title);
                    handleExerciseSelect(exercise.id);
                  }}
                  className="group bg-white rounded-3xl shadow-lg p-6 text-left hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 cursor-pointer"
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
