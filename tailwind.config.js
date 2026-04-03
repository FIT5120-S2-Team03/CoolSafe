/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#0056d2',
        'brand-blue-dark': '#003fa4',
        'brand-blue-darkest': '#001849',
        'brand-green': '#006e2f',
        'text-primary': '#1a1c1e',
        'text-secondary': '#424654',
        'text-muted': '#475569',
        'bg-page': '#f9f9fc',
        'bg-section': '#f3f3f6',
        'bg-footer': '#f1f5f9',
        'border-default': '#e8e8ea',
        'risk-low': '#16a34a',
        'risk-moderate': '#ca8a04',
        'risk-high': '#ea580c',
        'risk-extreme': '#dc2626',
      },
      fontFamily: {
        heading: ["'Public Sans'", 'sans-serif'],
        body: ["'Lexend'", 'sans-serif'],
        data: ["'Inter'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}