"use client";

import React, { useState } from 'react';
import BreathingExercise from '@/components/Breathing/BreathingExercise';
import { cn } from '@/lib/utils';

export default function BreathingExercisePage() {
  const [selectedPreset, setSelectedPreset] = useState('basic');
  const [customSettings, setCustomSettings] = useState({
    inhaleDuration: 4,
    holdDuration: 2,
    exhaleDuration: 6,
    restDuration: 2,
    cycles: 5,
    enableHaptics: true,
    showInstructions: true,
    autoStart: false,
  });
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Preset configurations
  const presets = {
    basic: {
      name: 'Basic Breathing',
      description: 'Gentle 4-2-6-2 pattern for relaxation',
      inhaleDuration: 4,
      holdDuration: 2,
      exhaleDuration: 6,
      restDuration: 2,
      cycles: 5,
    },
    deep: {
      name: 'Deep Breathing',
      description: 'Extended 6-4-8-3 pattern for deep relaxation',
      inhaleDuration: 6,
      holdDuration: 4,
      exhaleDuration: 8,
      restDuration: 3,
      cycles: 3,
    },
    quick: {
      name: 'Quick Calm',
      description: 'Fast 3-1-4-1 pattern for quick stress relief',
      inhaleDuration: 3,
      holdDuration: 1,
      exhaleDuration: 4,
      restDuration: 1,
      cycles: 8,
    },
    meditation: {
      name: 'Meditation',
      description: 'Slow 8-4-10-4 pattern for meditation',
      inhaleDuration: 8,
      holdDuration: 4,
      exhaleDuration: 10,
      restDuration: 4,
      cycles: 4,
    },
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = presets[presetKey as keyof typeof presets];
    setSelectedPreset(presetKey);
    setCustomSettings(prev => ({
      ...prev,
      inhaleDuration: preset.inhaleDuration,
      holdDuration: preset.holdDuration,
      exhaleDuration: preset.exhaleDuration,
      restDuration: preset.restDuration,
      cycles: preset.cycles,
    }));
  };

  const handleExerciseStart = () => {
    setIsExerciseActive(true);
  };

  const handleExerciseComplete = () => {
    setIsExerciseActive(false);
    setCompletedSessions(prev => prev + 1);
  };

  const handleExercisePause = () => {
    console.log('Exercise paused');
  };

  const handleExerciseResume = () => {
    console.log('Exercise resumed');
  };

  if (isExerciseActive) {
    return (
      <BreathingExercise
        onComplete={handleExerciseComplete}
        onStart={handleExerciseStart}
        onPause={handleExercisePause}
        onResume={handleExerciseResume}
        inhaleDuration={customSettings.inhaleDuration}
        holdDuration={customSettings.holdDuration}
        exhaleDuration={customSettings.exhaleDuration}
        restDuration={customSettings.restDuration}
        cycles={customSettings.cycles}
        enableHaptics={customSettings.enableHaptics}
        showInstructions={customSettings.showInstructions}
        autoStart={true}
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
              <span className="text-white text-2xl">🌬️</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold">Breathing Exercise</h1>
              <p className="text-blue-100 md:text-lg">Practice mindful breathing for better speech control</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 -mt-4">
        <div className="max-w-6xl mx-auto">
          {/* Session Stats */}
          {completedSessions > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 mb-8 text-center border border-gray-100">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl">🎉</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Session Complete!</h2>
                  <p className="text-gray-600">
                    You've completed {completedSessions} breathing session{completedSessions !== 1 ? 's' : ''} today.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompletedSessions(0)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Reset Counter
              </button>
            </div>
          )}

          {/* Preset Selection */}
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Choose a Breathing Pattern</h2>
                <p className="text-gray-600">Select a preset or customize your own</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(presets).map(([key, preset], index) => {
                const gradients = [
                  'from-blue-500 to-indigo-600',
                  'from-purple-500 to-pink-600', 
                  'from-green-500 to-emerald-600',
                  'from-orange-500 to-red-600'
                ];
                
                return (
                  <button
                    key={key}
                    onClick={() => handlePresetSelect(key)}
                    className={cn(
                      'group text-left p-6 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1',
                      selectedPreset === key
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
                    )}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg",
                        selectedPreset === key 
                          ? `bg-gradient-to-r ${gradients[index]}`
                          : 'bg-gray-100 group-hover:bg-blue-100'
                      )}>
                        <span className="text-lg">🌬️</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-lg">{preset.name}</h3>
                    </div>
                    <p className="text-gray-600 mb-3">{preset.description}</p>
                    <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 inline-block">
                      {preset.inhaleDuration}-{preset.holdDuration}-{preset.exhaleDuration}-{preset.restDuration} • {preset.cycles} cycles
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Settings */}
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-xl">⚙️</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Customize Your Session</h2>
                <p className="text-gray-600">Fine-tune your breathing exercise</p>
              </div>
            </div>
          
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Inhale Duration (seconds)
                </label>
                <select
                  value={customSettings.inhaleDuration}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    inhaleDuration: parseInt(e.target.value) 
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                >
                  <option value={2}>2 seconds</option>
                  <option value={3}>3 seconds</option>
                  <option value={4}>4 seconds</option>
                  <option value={5}>5 seconds</option>
                  <option value={6}>6 seconds</option>
                  <option value={8}>8 seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hold Duration (seconds)
                </label>
                <select
                  value={customSettings.holdDuration}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    holdDuration: parseInt(e.target.value) 
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                >
                  <option value={0}>No hold</option>
                  <option value={1}>1 second</option>
                  <option value={2}>2 seconds</option>
                  <option value={3}>3 seconds</option>
                  <option value={4}>4 seconds</option>
                  <option value={5}>5 seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Exhale Duration (seconds)
                </label>
                <select
                  value={customSettings.exhaleDuration}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    exhaleDuration: parseInt(e.target.value) 
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                >
                  <option value={3}>3 seconds</option>
                  <option value={4}>4 seconds</option>
                  <option value={5}>5 seconds</option>
                  <option value={6}>6 seconds</option>
                  <option value={8}>8 seconds</option>
                  <option value={10}>10 seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rest Duration (seconds)
                </label>
                <select
                  value={customSettings.restDuration}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    restDuration: parseInt(e.target.value) 
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                >
                  <option value={0}>No rest</option>
                  <option value={1}>1 second</option>
                  <option value={2}>2 seconds</option>
                  <option value={3}>3 seconds</option>
                  <option value={4}>4 seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Cycles
                </label>
                <select
                  value={customSettings.cycles}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    cycles: parseInt(e.target.value) 
                  }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                >
                  <option value={3}>3 cycles</option>
                  <option value={5}>5 cycles</option>
                  <option value={8}>8 cycles</option>
                  <option value={10}>10 cycles</option>
                  <option value={15}>15 cycles</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Enable Haptic Feedback
                </label>
                <input
                  type="checkbox"
                  checked={customSettings.enableHaptics}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    enableHaptics: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Show Instructions
                </label>
                <input
                  type="checkbox"
                  checked={customSettings.showInstructions}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    showInstructions: e.target.checked 
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center mb-8">
            <button
              onClick={() => setIsExerciseActive(true)}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 md:py-5 px-8 md:px-12 rounded-2xl text-lg md:text-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Breathing Exercise
              <span className="ml-2 group-hover:translate-x-1 transition-transform">🌬️</span>
            </button>
          </div>

          {/* Benefits Section */}
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-xl">✨</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Benefits for Speech</h2>
                <p className="text-gray-600">How breathing exercises improve your speech</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                  <span className="text-blue-600">🎨</span>
                  <span>Voice Control</span>
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Better breath support for sustained speech</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Improved voice projection and clarity</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Reduced vocal strain and fatigue</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>Enhanced speaking endurance</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                  <span className="text-purple-600">🧘</span>
                  <span>Relaxation</span>
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Reduced speech anxiety and tension</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Improved focus and concentration</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Better emotional regulation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                    <span>Enhanced overall well-being</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                  <span className="text-green-600">🎯</span>
                  <span>Speech Techniques</span>
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Better pacing and rhythm control</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Improved articulation and pronunciation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Enhanced fluency and flow</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>Better control over speech rate</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                  <span className="text-orange-600">💪</span>
                  <span>Physical Benefits</span>
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span>Stronger diaphragm and core muscles</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span>Improved lung capacity and function</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span>Better posture for optimal speech</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span>Enhanced overall physical health</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl">💡</span>
                <span className="text-lg font-semibold text-gray-800">Ready to Start?</span>
              </div>
              <p className="text-gray-600">
                Choose a preset or customize your own breathing pattern, then start your session!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
