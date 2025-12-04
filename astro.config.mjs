import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import pagefind from 'astro-pagefind';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  site: 'https://bigknoxy.github.io',
  output: 'static',
  build: {
    format: 'directory'
  },
  integrations: [
    tailwind(),
    pagefind({
      customSearchQuery: (input) => `https://bigknoxy.github.io/?q=${encodeURIComponent(input)}`
    })
  ],
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  vite: {
    resolve: {
      alias: {
        '@': __dirname + '/src'
      }
    }
  }
});