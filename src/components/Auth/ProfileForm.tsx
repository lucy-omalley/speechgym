"use client";

import React, { useState, useEffect } from 'react';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ProfileFormProps {
  onSuccess?: () => void;
  className?: string;
}

export default function ProfileForm({ onSuccess, className }: ProfileFormProps) {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '' as UserProfile['gender'],
    preferredLanguage: 'en',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.user_metadata) {
      setFormData({
        fullName: user.user_metadata.full_name || '',
        phone: user.user_metadata.phone || '',
        dateOfBirth: user.user_metadata.date_of_birth || '',
        gender: user.user_metadata.gender || '',
        preferredLanguage: user.user_metadata.preferred_language || 'en',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const updates: Partial<UserProfile> = {
      full_name: formData.fullName || undefined,
      phone: formData.phone || undefined,
      date_of_birth: formData.dateOfBirth || undefined,
      gender: formData.gender || undefined,
      preferred_language: formData.preferredLanguage,
    };

    const { error } = await updateProfile(updates);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
    }
    
    setLoading(false);
  };

  return (
    <div className={cn('w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto', className)}>
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100">
        {/* Background gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full -translate-y-32 translate-x-32"></div>
        
        <div className="relative p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">👤</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Profile Settings</h2>
            <p className="text-gray-600 md:text-lg">Update your personal information</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 text-red-500">⚠️</div>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 text-green-500">✓</div>
                <p className="text-green-700 text-sm font-medium">Profile updated successfully!</p>
              </div>
            </div>
          )}

          {/* Email field - full width */}
          <div>
            <label htmlFor="email" className="block text-sm md:text-base font-semibold text-gray-700 mb-3">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-4 md:py-5 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-base"
            />
            <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
          </div>

          {/* Two-column grid for desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm md:text-base font-semibold text-gray-700 mb-3">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-4 md:py-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-300"
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm md:text-base font-semibold text-gray-700 mb-3">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-4 md:py-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-300"
                placeholder="Enter your phone number"
                autoComplete="tel"
              />
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm md:text-base font-semibold text-gray-700 mb-3">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-4 md:py-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-300"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm md:text-base font-semibold text-gray-700 mb-3">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-4 md:py-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-300"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Language field - full width */}
          <div>
            <label htmlFor="preferredLanguage" className="block text-sm md:text-base font-semibold text-gray-700 mb-3">
              Preferred Language
            </label>
            <select
              id="preferredLanguage"
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleChange}
              className="w-full px-4 py-4 md:py-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-300"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-400 disabled:to-purple-400 text-white font-semibold py-4 md:py-5 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:shadow-lg text-base"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Updating Profile...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <span>Update Profile</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm md:text-base">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-medium">Member since:</span>
              <span className="text-gray-900 font-semibold">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-medium">Last sign in:</span>
              <span className="text-gray-900 font-semibold">
                {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
