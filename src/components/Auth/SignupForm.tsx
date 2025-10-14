"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SignupFormProps {
  onSuccess?: () => void;
  className?: string;
}

export default function SignupForm({ onSuccess, className }: SignupFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '' as UserProfile['gender'],
    preferredLanguage: 'en',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const userData: Partial<UserProfile> = {
      full_name: formData.fullName || undefined,
      phone: formData.phone || undefined,
      date_of_birth: formData.dateOfBirth || undefined,
      gender: formData.gender || undefined,
      preferred_language: formData.preferredLanguage,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const { error } = await signUp(formData.email, formData.password, userData);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      onSuccess?.();
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className={cn('w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto', className)}>
        <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100">
          {/* Background gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-blue-600/10 rounded-full -translate-y-32 translate-x-32"></div>
          
          <div className="relative p-8 md:p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-4xl">✓</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Check Your Email</h2>
            <p className="text-gray-600 md:text-lg mb-8 leading-relaxed">
              We've sent you a confirmation link. Please check your email and click the link to activate your account.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span>Back to Sign In</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto', className)}>
      <div className="relative overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100">
        {/* Background gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full -translate-y-32 translate-x-32"></div>
        
        <div className="relative p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🎤</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600 md:text-lg">Join SpeechGym AI to start your speech therapy journey</p>
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
              <label htmlFor="email" className="block text-sm md:text-base font-semibold text-gray-700 mb-3">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 md:py-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-300"
                placeholder="Enter your email"
                autoComplete="email"
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
          </div>

          {/* Password fields in full width */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="password" className="block text-sm md:text-base font-semibold text-gray-700 mb-3">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 md:py-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-300"
                placeholder="Create a password (min 6 characters)"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm md:text-base font-semibold text-gray-700 mb-3">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-4 md:py-5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all duration-200 hover:border-gray-300"
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-blue-400 disabled:to-purple-400 text-white font-semibold py-4 md:py-5 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:shadow-lg text-base"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <span>Create Account</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-600 text-sm md:text-base">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-purple-600 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
