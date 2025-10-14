"use client";

import { useEffect } from 'react';

/**
 * Component to suppress hydration warnings caused by browser extensions
 */
export default function SuppressHydrationWarning() {
  useEffect(() => {
    // Suppress hydration warnings for common browser extension attributes
    const suppressHydrationWarning = () => {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args[0];
        if (
          typeof message === 'string' &&
          (message.includes('hydrated but some attributes') ||
           message.includes('data-new-gr-c-s-check-loaded') ||
           message.includes('data-gr-ext-installed'))
        ) {
          // Suppress hydration warnings from browser extensions
          return;
        }
        originalConsoleError.apply(console, args);
      };
    };

    suppressHydrationWarning();
  }, []);

  return null;
}
