/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Creative writer-focused color palette
        'forest': {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bce5bc',
          300: '#8fd28f',
          400: '#5cb85c',
          500: '#2d5a27',
          600: '#244920',
          700: '#1d3a1a',
          800: '#162d15',
          900: '#0f1f0f',
        },
        'warm-cream': '#fefdf8',
        'warm-charcoal': '#2d3748',
        'coral': {
          50: '#fef7f7',
          100: '#fdeaea',
          200: '#fbd5d5',
          300: '#f8b4b4',
          400: '#f38888',
          500: '#ff6b6b',
          600: '#e53e3e',
          700: '#c53030',
          800: '#9c2626',
          900: '#7d1f1f',
        }
      },
      fontFamily: {
        'writing': ['Crimson Text', 'Georgia', 'serif'],
        'ui': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'writing': ['18px', '1.7'],
      },
      borderRadius: {
        'creative': '12px',
      },
      boxShadow: {
        'warm': '0 4px 6px -1px rgba(45, 90, 39, 0.1), 0 2px 4px -1px rgba(45, 90, 39, 0.06)',
        'warm-lg': '0 10px 15px -3px rgba(45, 90, 39, 0.1), 0 4px 6px -2px rgba(45, 90, 39, 0.05)',
      }
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        writewise: {
          primary: '#2d5a27',           // forest-500 - deep forest green
          'primary-focus': '#244920',   // forest-600
          'primary-content': '#ffffff',
          secondary: '#ff6b6b',         // coral-500 - warm coral accent
          'secondary-focus': '#e53e3e', // coral-600
          accent: '#F59E0B',            // warm amber
          neutral: '#2d3748',           // warm-charcoal
          'base-100': '#fefdf8',        // warm-cream background
          'base-200': '#f7f6f1',        // slightly darker cream
          'base-300': '#ede9e0',        // warm gray
          'rounded-box': '12px',        // more rounded cards/modals
          'rounded-btn': '8px',         // more rounded buttons
        },
      },
      'dark',                           // keep dark mode as fallback
    ],
  },
}