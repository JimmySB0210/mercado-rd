/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // MercadoRD brand — colores de la bandera dominicana
        rd: {
          red:   '#E31837',
          blue:  '#0038A8',
          gold:  '#F5A200',
          green: '#00873D',
        },
        ink: {
          DEFAULT: '#111111',
          2:       '#666666',
          3:       '#BBBBBB',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          off:     '#F5F5F5',
          off2:    '#E8E8E8',
          bg:      '#F2F4F8',
        },
      },
      fontFamily: {
        display: ['var(--font-barlow-condensed)', 'sans-serif'],
        body:    ['var(--font-barlow)',            'sans-serif'],
        mono:    ['var(--font-jetbrains-mono)',    'monospace'],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '10px',
        xl: '14px',
      },
    },
  },
  plugins: [],
};
