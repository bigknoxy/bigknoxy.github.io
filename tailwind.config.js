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
        'mono': ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}