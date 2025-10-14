/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Mobile-first responsive breakpoints optimized for smartphones
      screens: {
        'xs': '375px',    // Small phones (iPhone SE, etc.)
        'sm': '640px',    // Large phones
        'md': '768px',    // Tablets
        'lg': '1024px',   // Small laptops
        'xl': '1280px',   // Large laptops/desktops
        '2xl': '1536px',  // Large desktops
      },
      
      // Mobile-optimized spacing scale
      spacing: {
        'xs': '0.25rem',     // 4px
        'sm': '0.5rem',      // 8px
        'md': '1rem',        // 16px
        'lg': '1.5rem',      // 24px
        'xl': '2rem',        // 32px
        '2xl': '3rem',       // 48px
        'touch': '44px',     // Minimum touch target size
        'touch-lg': '48px',  // Larger touch targets
      },
      
      // Mobile-optimized font sizes
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.4' }],     // 14px
        'base': ['1rem', { lineHeight: '1.5' }],       // 16px
        'lg': ['1.125rem', { lineHeight: '1.4' }],     // 18px
        'xl': ['1.25rem', { lineHeight: '1.4' }],      // 20px
        '2xl': ['1.5rem', { lineHeight: '1.3' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '1.2' }],    // 30px
        '4xl': ['2.25rem', { lineHeight: '1.1' }],     // 36px
      },
      
      // Mobile-optimized max widths for containers
      maxWidth: {
        'xs': '20rem',      // 320px - Small phones
        'sm': '24rem',      // 384px - Medium phones
        'mobile': '28rem',  // 448px - Large phones
        'container': '1200px',
      },
      
      // Mobile-optimized border radius
      borderRadius: {
        'mobile': '0.5rem',
        'mobile-lg': '0.75rem',
      },
      
      // Mobile-optimized shadows
      boxShadow: {
        'mobile': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'mobile-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [
    // Custom plugin for mobile-first utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Mobile-first container
        '.container-mobile': {
          width: '100%',
          maxWidth: theme('maxWidth.sm'),
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
        },
        
        // Touch-friendly button
        '.btn-touch': {
          minHeight: theme('spacing.touch'),
          minWidth: theme('spacing.touch'),
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          paddingTop: theme('spacing.2'),
          paddingBottom: theme('spacing.2'),
        },
        
        // Safe area utilities
        '.safe-area-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-area-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-area-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-area-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
}
