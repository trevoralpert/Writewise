/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        writewise: {
          primary: '#6366F1',           // indigo-500
          'primary-focus': '#4F46E5',
          'primary-content': '#ffffff',
          accent: '#EAB308',            // amber-500
          neutral: '#1E293B',           // slate-800
          'base-100': '#ffffff',
          'base-200': '#f7f7f7',
          'base-300': '#e5e6e6',
          'rounded-box': '0.75rem',     // cards / modals
          'rounded-btn':  '0.5rem',     // buttons
        },
      },
      'dark',                           // keep dark mode as a fallback
    ],
  },
}