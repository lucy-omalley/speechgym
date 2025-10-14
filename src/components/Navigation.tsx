"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Navigation items configuration
const navigationItems = [
  {
    name: 'Home',
    href: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Exercises',
    href: '/exercises',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Progress',
    href: '/progress',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    activeIcon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

// Custom hook for safe area detection
const useSafeArea = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      // Get safe area insets from CSS environment variables
      const computedStyle = getComputedStyle(document.documentElement);
      const bottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0');
      const left = parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0');
      const right = parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0');

      setSafeAreaInsets({ bottom, left, right });
    };

    // Update on mount and resize
    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeAreaInsets;
};

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();
  const safeAreaInsets = useSafeArea();

  // Don't show navigation on auth pages
  const hiddenPages = ['/login', '/signup', '/forgot-password'];
  const shouldHide = hiddenPages.some(page => pathname.startsWith(page));

  if (shouldHide) {
    return null;
  }

  // Calculate dynamic height including safe area
  const navigationHeight = 64 + safeAreaInsets.bottom; // 64px base height + safe area

  return (
    <>
          {/* Mobile Bottom Navigation */}
          <nav 
            className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl z-50 md:hidden"
            style={{
              height: `${navigationHeight}px`,
              paddingBottom: `${safeAreaInsets.bottom}px`,
              paddingLeft: `${Math.max(safeAreaInsets.left, 0)}px`,
              paddingRight: `${Math.max(safeAreaInsets.right, 0)}px`,
            }}
          >
        <div className="flex items-center justify-around h-16 px-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
            
            return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 min-w-[64px] min-h-[48px] relative group',
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 active:text-blue-600 active:scale-95'
                    )}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg" />
                    )}
                    
                    {/* Icon container with background for active state */}
                    <div className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 mb-1 group-hover:scale-110',
                      isActive 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg border border-blue-200' 
                        : 'hover:bg-gray-100 hover:shadow-md'
                    )}>
                      {isActive ? item.activeIcon : item.icon}
                    </div>
                    
                    {/* Label */}
                    <span className={cn(
                      'text-xs font-semibold transition-colors duration-300',
                      isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                    )}>
                      {item.name}
                    </span>
                  </Link>
            );
          })}
        </div>
      </nav>

          {/* Desktop Sidebar Navigation */}
          <nav className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:h-full md:w-64 md:bg-gradient-to-b md:from-white md:to-gray-50 md:border-r md:border-gray-200/50 md:shadow-xl md:z-50">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎤</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">SpeechGym AI</h1>
                  <p className="text-blue-100 text-sm">Speech Therapy Platform</p>
                </div>
              </div>
            </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
            
            return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden',
                      isActive
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-r-4 border-blue-600 shadow-sm'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-gray-900 hover:shadow-sm'
                    )}
                  >
                    {/* Background animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className={cn(
                      'flex items-center justify-center w-6 h-6 transition-all duration-300 relative z-10',
                      isActive ? 'text-blue-600 scale-110' : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-110'
                    )}>
                      {isActive ? item.activeIcon : item.icon}
                    </div>
                    <span className={cn(
                      'font-semibold transition-colors duration-300 relative z-10',
                      isActive ? 'text-blue-700' : 'text-gray-600 group-hover:text-gray-900'
                    )}>
                      {item.name}
                    </span>
                  </Link>
            );
          })}
        </div>

            {/* User Info */}
            <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {user?.user_metadata?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
            </div>
      </nav>

      {/* Mobile Spacer */}
      <div 
        className="w-full md:hidden"
        style={{ height: `${navigationHeight}px` }}
      />

      {/* Desktop Spacer */}
      <div className="hidden md:block w-64 flex-shrink-0" />

      {/* Safe area CSS variables for other components */}
      <style jsx global>{`
        :root {
          --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
          --safe-area-inset-left: env(safe-area-inset-left, 0px);
          --safe-area-inset-right: env(safe-area-inset-right, 0px);
          --safe-area-inset-top: env(safe-area-inset-top, 0px);
        }
        
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0px);
        }
        
        .safe-area-left {
          padding-left: env(safe-area-inset-left, 0px);
        }
        
        .safe-area-right {
          padding-right: env(safe-area-inset-right, 0px);
        }
      `}</style>
    </>
  );
}
