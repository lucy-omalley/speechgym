"use client";

import { useProgress } from '@/hooks/useProgress';
import { useState } from 'react';

export default function ProgressPage() {
  const {
    getDashboardData,
    updateGoals,
    exportProgressData,
    clearAllData,
  } = useProgress();

  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [newGoals, setNewGoals] = useState({
    weeklySessions: 5,
    weeklyDuration: 30 * 60 * 1000, // 30 minutes
    targetFluencyScore: 80,
  });

  const dashboardData = getDashboardData();

  const handleUpdateGoals = () => {
    updateGoals(newGoals);
    setShowGoalsModal(false);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all progress data? This cannot be undone.')) {
      clearAllData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 pb-20 md:pb-0 md:ml-64">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative p-4 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl">📊</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold">Progress Dashboard</h1>
                <p className="text-blue-100 md:text-lg">Track your speech therapy journey</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowGoalsModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-colors backdrop-blur-sm font-medium"
              >
                Set Goals
              </button>
              <button
                onClick={exportProgressData}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-colors backdrop-blur-sm font-medium"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 -mt-4">
        <div className="max-w-6xl mx-auto">

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl">📚</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{dashboardData.stats.totalSessions}</p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl">🔥</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Current Streak</p>
                <p className="text-3xl font-bold text-orange-600">{dashboardData.stats.currentStreak}</p>
                <p className="text-sm text-gray-500">days</p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl">✨</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Average Fluency</p>
                <p className="text-3xl font-bold text-green-600">{dashboardData.stats.averageFluencyScore}%</p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl">⏱️</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Practice Time</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Math.round(dashboardData.stats.totalDuration / (1000 * 60))}
                </p>
                <p className="text-sm text-gray-500">minutes</p>
              </div>
            </div>
          </div>

          {/* Goals Progress */}
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Goal Progress</h2>
                <p className="text-gray-600">Track your weekly targets</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700">Weekly Sessions</span>
                  <span className="text-sm font-bold text-blue-600">
                    {dashboardData.chartData.sessionCountTrend[0]?.value || 0} / {dashboardData.goals.weeklySessions}
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-3 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${Math.min(100, dashboardData.stats.weeklyGoalProgress)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 font-medium">{dashboardData.stats.weeklyGoalProgress}% complete</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700">Target Fluency</span>
                  <span className="text-sm font-bold text-green-600">
                    {dashboardData.stats.averageFluencyScore}% / {dashboardData.goals.targetFluencyScore}%
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-3 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${Math.min(100, (dashboardData.stats.averageFluencyScore / dashboardData.goals.targetFluencyScore) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 font-medium">
                  {Math.round((dashboardData.stats.averageFluencyScore / dashboardData.goals.targetFluencyScore) * 100)}% complete
                </p>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-xl">📈</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Recent Sessions</h3>
                <p className="text-gray-600">Your latest practice activities</p>
              </div>
            </div>
            
            {dashboardData.recentSessions.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentSessions.slice(0, 5).map((session, index) => (
                  <div key={session.id} className="group bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-4 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {session.exerciseType.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 capitalize">{session.exerciseType}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(session.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-600 font-medium">Fluency</p>
                          <p className="font-bold text-green-600 text-lg">{session.fluencyScore}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600 font-medium">Duration</p>
                          <p className="font-bold text-blue-600 text-lg">
                            {Math.round(session.duration / 1000)}s
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">📚</span>
                </div>
                <p className="text-gray-500 text-lg">No sessions yet</p>
                <p className="text-gray-400 text-sm">Start practicing to see your progress here!</p>
              </div>
            )}
          </div>

          {/* Improvements */}
          {dashboardData.improvements.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-6 md:p-8 mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <span className="text-white text-xl">🚀</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800">Recent Improvements</h3>
                  <p className="text-green-600">Great progress this week!</p>
                </div>
              </div>
              <div className="space-y-3">
                {dashboardData.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-white/50 rounded-xl p-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-green-700 font-medium capitalize">
                      {improvement.metric} {improvement.direction} by {Math.abs(improvement.change)}% this week
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Management */}
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-xl">⚙️</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Data Management</h3>
                <p className="text-gray-600">Manage your progress data</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={exportProgressData}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              >
                Export Data
              </button>
              <button
                onClick={handleClearData}
                className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Modal */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Set Goals</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Weekly Sessions
                </label>
                <input
                  type="number"
                  value={newGoals.weeklySessions}
                  onChange={(e) => setNewGoals(prev => ({ ...prev, weeklySessions: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Weekly Duration (minutes)
                </label>
                <input
                  type="number"
                  value={Math.round(newGoals.weeklyDuration / (1000 * 60))}
                  onChange={(e) => setNewGoals(prev => ({ ...prev, weeklyDuration: (parseInt(e.target.value) || 0) * 60 * 1000 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Fluency Score
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newGoals.targetFluencyScore}
                  onChange={(e) => setNewGoals(prev => ({ ...prev, targetFluencyScore: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowGoalsModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGoals}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Save Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
