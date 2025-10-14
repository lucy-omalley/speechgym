"use client";

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility function

// Types for navigation items
export interface NavigationItem {
  id: string;
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
  active?: boolean;
  disabled?: boolean;
}

// Types for floating action buttons
export interface FloatingActionButton {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  position: 'left' | 'right' | 'center';
  variant?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
}

// Props for the MobileLayout component
export interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  headerActions?: ReactNode;
  bottomNavigation?: NavigationItem[];
  floatingActionButtons?: FloatingActionButton[];
  showBottomNavigation?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  bottomNavClassName?: string;
  // Safe area customization
  safeAreaTop?: boolean;
  safeAreaBottom?: boolean;
  safeAreaLeft?: boolean;
  safeAreaRight?: boolean;
  // Layout customization
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

// Navigation item component
const NavigationItemComponent: React.FC<{
  item: NavigationItem;
  onClick: () => void;
}> = ({ item, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={item.disabled}
      className={cn(
        'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 py-1',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        item.disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'active:scale-95 active:bg-gray-100',
        item.active
          ? 'text-blue-600 bg-blue-50 rounded-lg'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg'
      )}
      aria-label={item.label}
    >
      <div className="relative">
        {item.icon}
        {item.badge && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </div>
      <span className="text-xs font-medium mt-1 leading-tight">
        {item.label}
      </span>
    </button>
  );
};

// Floating action button component
const FloatingActionButtonComponent: React.FC<{
  button: FloatingActionButton;
  onClick: () => void;
}> = ({ button, onClick }) => {
  const positionClasses = {
    left: 'left-4',
    center: 'left-1/2 transform -translate-x-1/2',
    right: 'right-4',
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg',
    secondary: 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white shadow-lg',
    accent: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-lg',
  };

  return (
    <button
      onClick={onClick}
      disabled={button.disabled}
      className={cn(
        'fixed bottom-20 z-40',
        'min-h-[56px] min-w-[56px] rounded-full',
        'flex items-center justify-center',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'shadow-lg active:scale-95',
        positionClasses[button.position],
        variantClasses[button.variant || 'primary'],
        button.disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={button.label}
    >
      {button.icon}
    </button>
  );
};

// Header component
const MobileHeader: React.FC<{
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  actions?: ReactNode;
  className?: string;
  safeAreaTop?: boolean;
}> = ({ 
  title, 
  subtitle, 
  showBackButton, 
  onBackClick, 
  actions, 
  className,
  safeAreaTop = true 
}) => {
  return (
    <header className={cn(
      'sticky top-0 z-30 bg-white border-b border-gray-200',
      safeAreaTop && 'safe-area-top',
      className
    )}>
      <div className="flex items-center justify-between px-4 py-3 min-h-[56px]">
        {/* Left side - Back button or title */}
        <div className="flex items-center flex-1 min-w-0">
          {showBackButton ? (
            <button
              onClick={onBackClick}
              className="btn-touch mr-3 flex items-center justify-center"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          ) : null}
          
          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        {actions && (
          <div className="flex items-center space-x-2 ml-3">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

// Bottom navigation component
const BottomNavigation: React.FC<{
  items: NavigationItem[];
  onItemClick: (item: NavigationItem) => void;
  className?: string;
  safeAreaBottom?: boolean;
}> = ({ items, onItemClick, className, safeAreaBottom = true }) => {
  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40',
      'bg-white border-t border-gray-200',
      safeAreaBottom && 'safe-area-bottom',
      className
    )}>
      <div className="flex items-center justify-around px-2 py-1 min-h-[64px]">
        {items.map((item) => (
          <NavigationItemComponent
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>
    </nav>
  );
};

// Main MobileLayout component
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  headerActions,
  bottomNavigation = [],
  floatingActionButtons = [],
  showBottomNavigation = true,
  className,
  contentClassName,
  headerClassName,
  bottomNavClassName,
  safeAreaTop = true,
  safeAreaBottom = true,
  safeAreaLeft = true,
  safeAreaRight = true,
  maxWidth = 'full',
  padding = 'md',
}) => {
  // Handle navigation item clicks
  const handleNavigationClick = (item: NavigationItem) => {
    if (item.disabled) return;
    
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      // Handle navigation to href (could be router navigation)
      window.location.href = item.href;
    }
  };

  // Handle floating action button clicks
  const handleFloatingActionClick = (button: FloatingActionButton) => {
    if (button.disabled) return;
    button.onClick();
  };

  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };

  // Padding classes
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <div className={cn(
      'min-h-screen bg-gray-50 flex flex-col',
      safeAreaLeft && 'safe-area-left',
      safeAreaRight && 'safe-area-right',
      className
    )}>
      {/* Header */}
      {(title || showBackButton || headerActions) && (
        <MobileHeader
          title={title}
          subtitle={subtitle}
          showBackButton={showBackButton}
          onBackClick={onBackClick}
          actions={headerActions}
          className={headerClassName}
          safeAreaTop={safeAreaTop}
        />
      )}

      {/* Main Content */}
      <main className={cn(
        'flex-1 overflow-y-auto',
        // Add bottom padding if bottom navigation is shown
        showBottomNavigation && bottomNavigation.length > 0 && 'pb-20',
        // Add top padding if no header
        (!title && !showBackButton && !headerActions) && safeAreaTop && 'pt-safe-area-top'
      )}>
        <div className={cn(
          'mx-auto w-full',
          maxWidthClasses[maxWidth],
          paddingClasses[padding],
          contentClassName
        )}>
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      {showBottomNavigation && bottomNavigation.length > 0 && (
        <BottomNavigation
          items={bottomNavigation}
          onItemClick={handleNavigationClick}
          className={bottomNavClassName}
          safeAreaBottom={safeAreaBottom}
        />
      )}

      {/* Floating Action Buttons */}
      {floatingActionButtons.map((button) => (
        <FloatingActionButtonComponent
          key={button.id}
          button={button}
          onClick={() => handleFloatingActionClick(button)}
        />
      ))}
    </div>
  );
};

// Export types and components
export default MobileLayout;
export type { NavigationItem, FloatingActionButton, MobileLayoutProps };
