/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary coral/orange from the dark design
        primary: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FDCFCF',
          300: '#FCB0B0',
          400: '#F87171',
          500: '#EA4335',  // Main brand color
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        // Neutral grays
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Dark mode specific colors (from screenshots)
        dark: {
          bg: '#1F1D2B',        // Main background
          card: '#252836',      // Card background
          surface: '#2D303E',   // Elevated surfaces
          border: '#393C49',    // Borders
          text: '#FFFFFF',      // Primary text
          textMuted: '#ABBBC2', // Secondary text
          accent: '#EA7C69',    // Coral/orange accent
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['System', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
