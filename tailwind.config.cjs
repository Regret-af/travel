/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      maxWidth: {
        app: '1400px',
        'app-reading': '1180px'
      },
      fontFamily: {
        sans: ['var(--font-family-sans)']
      },
      fontSize: {
        '2xs': ['var(--font-size-2xs)', { lineHeight: '1.5' }],
        xs: ['var(--font-size-xs)', { lineHeight: '1.5' }],
        sm: ['var(--font-size-sm)', { lineHeight: '1.6' }],
        md: ['var(--font-size-md)', { lineHeight: '1.7' }],
        base: ['var(--font-size-base)', { lineHeight: 'var(--line-height-body)' }],
        lg: ['var(--font-size-lg)', { lineHeight: '1.7' }],
        xl: ['var(--font-size-xl)', { lineHeight: '1.65' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: '1.55' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: '1.45' }],
        '4xl': ['var(--font-size-4xl)', { lineHeight: '1.35' }],
        '5xl': ['var(--font-size-5xl)', { lineHeight: '1.28' }],
        '6xl': ['var(--font-size-6xl)', { lineHeight: '1.22' }],
        '7xl': ['var(--font-size-7xl)', { lineHeight: '1.18' }],
        '8xl': ['var(--font-size-8xl)', { lineHeight: '1.16' }],
        '9xl': ['var(--font-size-9xl)', { lineHeight: '1.14' }],
        '10xl': ['var(--font-size-10xl)', { lineHeight: '1.12' }],
        '11xl': ['var(--font-size-11xl)', { lineHeight: '1.1' }],
        '12xl': ['var(--font-size-12xl)', { lineHeight: '1.08' }],
        hero: ['var(--font-size-hero)', { lineHeight: '1.02' }]
      },
      fontWeight: {
        thin: 'var(--font-weight-thin)',
        regular: 'var(--font-weight-regular)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
        title: 'var(--font-weight-title)',
        display: 'var(--font-weight-display)'
      },
      lineHeight: {
        tight: 'var(--line-height-tight)',
        body: 'var(--line-height-body)',
        relaxed: 'var(--line-height-relaxed)'
      },
      colors: {
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          subtle: 'var(--color-text-subtle)'
        },
        border: {
          soft: 'var(--color-border-soft)'
        },
        surface: {
          soft: 'var(--color-surface-soft)',
          page: '#f7f9fb',
          muted: '#eff1f2'
        },
        brand: {
          primary: '#005bad',
          secondary: '#5ea2ff',
          dark: '#002c59',
          pale: 'rgba(94, 162, 255, 0.12)',
          cool: 'var(--color-brand-cool)',
          iris: 'var(--color-brand-iris)'
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          strong: 'var(--color-accent-strong)'
        }
      },
      borderRadius: {
        panel: 'var(--radius-panel)',
        card: 'var(--radius-card)',
        control: 'var(--radius-control)',
        chip: 'var(--radius-chip)'
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        floating: 'var(--shadow-floating)',
        control: 'var(--shadow-control)',
        'control-hover': 'var(--shadow-control-hover)',
        'ring-accent': 'var(--shadow-ring-accent)'
      }
    }
  },
  plugins: []
};
