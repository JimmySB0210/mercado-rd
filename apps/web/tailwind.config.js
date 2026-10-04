/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        // Breakpoint custom que unifica Navbar (860px) y MobileTabBar
        'md-860': '860px',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      fontSize: {
        caption: ['var(--text-caption)', { lineHeight: 'var(--leading-caption)' }],
        small: ['var(--text-small)', { lineHeight: 'var(--leading-small)' }],
        ui: 'var(--text-ui)',
        body: ['var(--text-body)', { lineHeight: 'var(--leading-body)' }],
        h4: ['var(--text-h4)', { lineHeight: 'var(--leading-h4)' }],
        h3: ['var(--text-h3)', { lineHeight: 'var(--leading-h3)' }],
        h2: ['var(--text-h2)', { lineHeight: 'var(--leading-h2)' }],
        h1: ['var(--text-h1)', { lineHeight: 'var(--leading-h1)' }],
        display: ['var(--text-display)', { lineHeight: 'var(--leading-display)' }],
        'price-card': ['var(--text-price-card)', { lineHeight: 'var(--leading-price)' }],
        price: ['var(--text-price)', { lineHeight: 'var(--leading-price)' }],
        'price-detail': ['var(--text-price-detail)', { lineHeight: 'var(--leading-price-detail)' }],
      },
    },
  },
  plugins: [],
}
