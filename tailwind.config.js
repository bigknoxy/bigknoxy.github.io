/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'gameboy': {
          'darkest': '#0f380f',
          'dark': '#306230',
          'light': '#8bac0f',
          'lightest': '#9bbc0f'
        },
        'tokyo': {
          'bg': '#1a1b26',
          'surface': '#24283b',
          'border': '#414868',
          'text': '#c0caf5',
          'accent': '#7aa2f7',
          'muted': '#565f89'
        }
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'monospace'],
        'mono': ['"JetBrains Mono"', 'monospace'],
        'sans': ['"Outfit"', 'sans-serif']
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.tokyo.text'),
            maxWidth: '65ch',
            '[class~="lead"]': {
              color: theme('colors.gameboy.light'),
            },
            h1: {
              color: theme('colors.gameboy.lightest'),
              fontFamily: theme('fontFamily.pixel'),
            },
            h2: {
              color: theme('colors.gameboy.lightest'),
              fontFamily: theme('fontFamily.pixel'),
              marginTop: '2em',
            },
            h3: {
              color: theme('colors.gameboy.light'),
              fontFamily: theme('fontFamily.pixel'),
            },
            h4: {
              color: theme('colors.gameboy.light'),
            },
            strong: {
              color: theme('colors.gameboy.lightest'),
            },
            a: {
              color: theme('colors.gameboy.light'),
              textDecoration: 'none',
              '&:hover': {
                color: theme('colors.gameboy.lightest'),
                textDecoration: 'underline',
              },
            },
            code: {
              color: theme('colors.tokyo.accent'),
              backgroundColor: theme('colors.tokyo.surface'),
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
              fontFamily: theme('fontFamily.mono'),
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            blockquote: {
              color: theme('colors.tokyo.muted'),
              borderLeftColor: theme('colors.gameboy.light'),
              fontStyle: 'italic',
            },
            ul: {
              li: {
                '&::marker': {
                  color: theme('colors.gameboy.dark'),
                },
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}