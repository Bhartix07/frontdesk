/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          dark: '#0a192f',       // Deep midnight track blue
          navy: '#0f2b5c',       // Vande Bharat / IRCTC Royal Blue
          blue: '#1d4ed8',       // Modern express blue
          lightBlue: '#e0e7ff',  // Light platform tint
          gold: '#f59e0b',       // Station clock / brass gold
          amber: '#d97706',      // Signal Caution Amber
          green: '#059669',      // Signal Green (Confirmed/Clear)
          red: '#dc2626',        // Danger / Signal Red (Delayed)
          slate: '#334155',      // Track metal slate
          border: '#e2e8f0',     // Crisp ticket borders
          bg: '#f8fafc',         // Platform clean background
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      }
    },
  },
  plugins: [],
}
