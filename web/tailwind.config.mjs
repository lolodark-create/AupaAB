/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,ts,tsx,js,jsx,md,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Brand
        'aviron': {
          DEFAULT: 'rgb(var(--c-aviron) / <alpha-value>)',
          bg: 'rgb(var(--c-aviron-bg) / <alpha-value>)',
          press: 'rgb(var(--c-aviron-press) / <alpha-value>)',
        },
        'night': 'rgb(var(--c-night) / <alpha-value>)',
        'off-white': 'rgb(var(--c-off-white) / <alpha-value>)',
        'slate-aupa': 'rgb(var(--c-slate) / <alpha-value>)',
        'sand': 'rgb(var(--c-sand) / <alpha-value>)',
        'ikurrina': 'rgb(var(--c-ikurrina) / <alpha-value>)',
        'basque': 'rgb(var(--c-basque) / <alpha-value>)',

        // Surfaces (theme-aware via CSS vars)
        'bg-default': 'rgb(var(--bg-default) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
        'bg-subtle': 'rgb(var(--bg-subtle) / <alpha-value>)',
        'bg-tint': 'rgb(var(--bg-tint) / <alpha-value>)',

        // Text
        'fg': 'rgb(var(--fg-primary) / <alpha-value>)',
        'fg-secondary': 'rgb(var(--fg-secondary) / <alpha-value>)',
        'fg-tertiary': 'rgb(var(--fg-tertiary) / <alpha-value>)',

        // Borders
        'border-subtle': 'rgb(var(--border-subtle) / <alpha-value>)',
        'border-default': 'rgb(var(--border-default) / <alpha-value>)',

        // Semantic
        'success': 'rgb(var(--c-success) / <alpha-value>)',
        'warning': 'rgb(var(--c-warning) / <alpha-value>)',
        'danger': 'rgb(var(--c-danger) / <alpha-value>)',
        'info': 'rgb(var(--c-info) / <alpha-value>)',
      },
      fontFamily: {
        // System fonts — see globals.css comment. Compatible with all `font-serif`
        // and `font-sans` Tailwind utilities used across components.
        serif: ['"New York"', '"Iowan Old Style"', 'Charter', 'ui-serif', 'Georgia', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'system-ui', 'Roboto', '"Helvetica Neue"', 'sans-serif'],
      },
      fontSize: {
        // Brief §4.2 — desktop / mobile
        'display': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
        'h1': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.012em' }],
        'h2': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h3': ['1.5rem', { lineHeight: '1.3' }],
        'h4': ['1.25rem', { lineHeight: '1.4' }],
        'body-lg': ['1.25rem', { lineHeight: '1.6' }],
        'body': ['1.125rem', { lineHeight: '1.65' }],
        'body-sm': ['1rem', { lineHeight: '1.5' }],
        'meta': ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.08em' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },
      spacing: {
        // base 4 — already in Tailwind default, just add 12/16 reading widths
      },
      maxWidth: {
        reading: '680px',
        container: '1280px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        // Brief §5.5 — very discrete shadows in light mode
        sm: '0 1px 2px rgba(11, 37, 69, 0.04)',
        md: '0 4px 12px rgba(11, 37, 69, 0.06)',
        lg: '0 12px 32px rgba(11, 37, 69, 0.08)',
      },
      keyframes: {
        'pulse-aupa': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'pulse-aupa': 'pulse-aupa 1.4s ease-in-out infinite',
        'fade-in': 'fade-in 150ms ease',
      },
    },
  },
  plugins: [],
};
