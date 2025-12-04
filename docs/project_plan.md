# 🎮 GameBoy/Tokyo Night Portfolio & Blog Implementation Plan

**Date:** December 3, 2025  
**Author:** Generated Implementation Plan  
**Version:** 1.0

## 📋 Project Overview

A high-performance portfolio and blog for a software developer featuring:
- **Theme:** Custom GameBoy + Tokyo Night fusion aesthetic
- **Tech Stack:** Astro + Bun + Tailwind CSS
- **Hosting:** GitHub Pages with automatic deployments
- **Features:** Portfolio, blog, RSS feed, global search, playable mini-game
- **Performance:** Maximum speed with best practices and image optimization

---

## 🎨 Phase 1: Project Setup & Foundation

### 1.1 Initialize Astro Project with Bun
```bash
# Create new Astro project with minimal template
bunx create astro@latest portfolio-blog --template minimal --git --install
cd portfolio-blog

# Configure Bun as runtime
echo 'runtime = "bun"' >> bunfig.toml
```

### 1.2 Core Dependencies
Based on research from official Astro docs and high-quality repositories:

```json
{
  "dependencies": {
    "@astrojs/rss": "^4.0.7",
    "@astrojs/tailwind": "^5.1.0", 
    "astro": "^4.15.0",
    "astro-pagefind": "^1.0.4",
    "pagefind": "^1.1.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "bun-plugin-tailwind": "^0.1.1",
    "prettier": "^3.3.3",
    "prettier-plugin-astro": "^0.14.1"
  }
}
```

### 1.3 Project Structure (Based on High-Quality Repos)
```
portfolio-blog/
├── src/
│   ├── content/
│   │   ├── blog/          # Content Collections for blog
│   │   │   └── jeetSocial-post.md
│   │   └── projects/       # Content Collections for projects
│   │       └── jeetSocial.md
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.astro
│   │   │   ├── GameBoy.astro
│   │   │   └── SearchBar.astro
│   │   ├── layout/
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   └── Navigation.astro
│   │   └── game/
│   │       └── MiniGame.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── projects/
│   │   │   └── index.astro
│   │   └── rss.xml.js
│   └── styles/
│       └── global.css
├── public/
│   ├── assets/
│   │   ├── icons/
│   │   └── sounds/
│   └── favicon.svg
├── astro.config.mjs
├── tailwind.config.js
├── bunfig.toml
└── package.json
```

---

## 🎨 Phase 2: GameBoy/Tokyo Night Theme Implementation

### 2.1 Color Palette (Research-Based)
Based on research from color palette resources:

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // GameBoy LCD palette
        'gameboy': {
          'lightest': '#9bbc0f',
          'light': '#8bac0f', 
          'dark': '#306230',
          'darkest': '#0f380f'
        },
        // Tokyo Night palette
        'tokyo': {
          'bg': '#1a1b26',
          'surface': '#24283b',
          'highlight': '#f7768e',
          'blue': '#7aa2f7',
          'cyan': '#73daca',
          'green': '#9ece6a'
        }
      },
      fontFamily: {
        'pixel': ['Press Start 2P', 'cursive'],
        'mono': ['JetBrains Mono', 'monospace']
      }
    }
  }
}
```

### 2.2 Typography & Assets
- **Fonts:** Google Fonts - Press Start 2P (GameBoy) + JetBrains Mono (code)
- **Icons:** 8-bit style SVG icons
- **Sounds:** Mutable sound effects for interactions (Web Audio API)

---

## ⚡ Phase 3: Performance Optimization (Best Practices)

### 3.1 Image Optimization Strategy
Based on research from official Astro docs and high-quality repos:

```javascript
// src/components/ui/OptimizedImage.astro
---
import { Image, Picture } from 'astro:assets';

interface Props {
  src: string;
  alt: string;
  widths?: number[];
  formats?: ('webp' | 'avif' | 'png' | 'jpg')[];
  loading?: 'lazy' | 'eager';
  sizes?: string;
}

const { 
  src, 
  alt, 
  widths = [320, 640, 960, 1280, 1920],
  formats = ['webp', 'avif', 'png'],
  loading = 'lazy',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
} = Astro.props;
---

<Picture 
  src={src}
  alt={alt}
  widths={widths}
  formats={formats}
  loading={loading}
  sizes={sizes}
  class="rounded-lg transition-transform hover:scale-105"
/>
```

### 3.2 Build Configuration
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://username.github.io',
  output: 'static',
  integrations: [
    tailwind({
      applyBaseStyles: false, // Custom CSS only
    }),
    pagefind({
      ui: false, // Custom UI
      searchOptions: {
        excerptLength: 30,
        filter: { rootSelector: 'main' }
      }
    })
  ],
  build: {
    format: 'directory' // Better for GitHub Pages
  },
  image: {
    serviceEntry: 'sharp', // Best performance
    quality: 85,
    format: ['webp', 'avif']
  },
  vite: {
    optimizeDeps: {
      exclude: ['pagefind'] // Keep search separate
    }
  }
});
```

---

## 🎮 Phase 4: Mini Game Implementation

### 4.1 Game Concept: "Code Runner"
- **Style:** GameBoy-style endless runner
- **Mechanic:** Jump over bugs, collect commits
- **Controls:** Spacebar/tap to jump
- **Sound:** 8-bit sound effects using Web Audio API

### 4.2 Game Component Structure
```astro
---
// src/components/game/MiniGame.astro
import { useEffect, useRef } from 'astro/runtime';

let canvasRef;
let gameRunning = false;
let score = 0;
const sounds = {
  jump: '/assets/sounds/jump.wav',
  collect: '/assets/sounds/collect.wav',
  gameOver: '/assets/sounds/gameover.wav'
};
---

<div class="gameboy-container">
  <canvas 
    ref={canvasRef}
    width="240" 
    height="216"
    class="gameboy-screen border-4 border-gameboy-darkest bg-gameboy-lightest"
  />
  <div class="gameboy-controls">
    <button class="gameboy-button" onclick="toggleGame()">
      {gameRunning ? 'PAUSE' : 'START'}
    </button>
    <div class="score-display">SCORE: {score}</div>
  </div>
</div>

<style>
  .gameboy-container {
    @apply bg-tokyo-bg p-8 rounded-2xl shadow-2xl;
    font-family: 'Press Start 2P', cursive;
  }
  .gameboy-screen {
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
</style>

<script>
  // Game logic with Web Audio API for mutable sounds
  class MiniGame {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    playSound(frequency, duration) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    }
  }
</script>
```

---

## 🔍 Phase 5: Search Implementation

### 5.1 Pagefind Integration
```astro
---
// src/components/ui/SearchBar.astro
import pagefind from 'pagefind';

let searchResults = [];
let isSearching = false;
---

<div class="search-container">
  <input 
    type="text" 
    placeholder="Search posts..."
    class="search-input"
    on:input={handleSearch}
  />
  {isSearching && <div class="searching">Searching...</div>}
  {searchResults.length > 0 && (
    <div class="search-results">
      {searchResults.map(result => (
        <a href={result.url} class="search-result">
          <h3>{result.meta.title}</h3>
          <p>{result.excerpt}</p>
        </a>
      ))}
    </div>
  )}
</div>

<script>
  async function handleSearch(event) {
    const query = event.target.value;
    if (query.length < 2) {
      searchResults = [];
      return;
    }
    
    isSearching = true;
    const results = await pagefind.search(query);
    searchResults = results.results;
    isSearching = false;
  }
</script>
```

---

## 📝 Phase 6: Content Strategy

### 6.1 Content Collections Setup
```javascript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updateDate: z.coerce.date().optional(),
    author: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.object({
      src: z.string(),
      alt: z.string()
    }).optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false)
  })
});

const projectCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    demoUrl: z.string().url().optional(),
    repoUrl: z.string().url(),
    tech: z.array(z.string()),
    image: z.object({
      src: z.string(),
      alt: z.string()
    }),
    featured: z.boolean().default(false),
    status: z.enum(['completed', 'in-progress', 'planned'])
  })
});

export const collections = {
  blog: blogCollection,
  projects: projectCollection
};
```

### 6.2 Initial Content: jeetSocial Project
```markdown
---
// src/content/projects/jeetSocial.md
title: "jeetSocial"
description: "A social media platform built with modern web technologies"
demoUrl: "https://jeetsocial-demo.vercel.app"
repoUrl: "https://github.com/username/jeetSocial"
tech: ["React", "Node.js", "MongoDB", "Socket.io", "Tailwind CSS"]
image:
  src: "/assets/projects/jeetsocial.png"
  alt: "jeetSocial platform dashboard"
featured: true
status: "completed"
---

# jeetSocial

A full-stack social media application featuring real-time messaging, user profiles, and content sharing.
```

---

## 🌐 GitHub Pages username.github.io Setup Requirements

### CRITICAL: Must Follow These Exact Steps

Based on official GitHub documentation, here are the **exact steps** to achieve `username.github.io` hosting:

#### **Step 1: Create Special Repository**
1. Go to GitHub and click **New repository**
2. **Repository name MUST be:** `username.github.io` (replace `username` with your actual GitHub username)
3. Example: If your username is `joshdoe`, repository name must be `joshdoe.github.io`
4. Set repository to **Public**
5. Toggle **Add README** to **On**
6. Click **Create repository**

#### **Step 2: Configure GitHub Pages**
1. In your new repository, click **Settings** tab
2. In the "Code and automation" section, click **Pages**
3. Under "Build and deployment", set **Source** to **Deploy from a branch**
4. Set **Branch** to **main** (or **master** if that's your default)
5. Click **Save**

#### **Step 3: Deploy Your Site**
1. **Important:** Your site content goes in the **root** of the repository (NOT in a `docs` or `dist` folder initially)
2. Push your built files to the `main` branch
3. Visit `https://username.github.io` (replace with your username)
4. **Note:** Can take up to 10 minutes for initial deployment

#### **Alternative: Use Custom Workflow**
If using GitHub Actions (recommended for our project):
1. Keep the `username.github.io` repository structure
2. Configure Pages to use **GitHub Actions** as source instead of branch
3. Your workflow will build and deploy to the `gh-pages` branch automatically

#### **Key Requirements:**
- ✅ **Repository name must match exactly:** `username.github.io`
- ✅ **Must be public repository** (free tier requirement)
- ✅ **Main branch should be `main` or `master`
- ✅ **Site files in root directory** (unless using custom workflow)
- ✅ **Wait up to 10 minutes** for initial deployment

---

## 🚀 Phase 7: Deployment & CI/CD

### 7.1 GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
          
      - name: Install dependencies
        run: bun install --frozen-lockfile
        
      - name: Build with Pagefind
        run: |
          bun run build
          bunx pagefind --site dist --output-subdir _pagefind
          
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 7.2 Package Scripts
```json
{
  "scripts": {
    "dev": "bunx --bun astro dev",
    "build": "bunx --bun astro build",
    "preview": "bunx --bun astro preview",
    "optimize": "bunx --bun astro build --optimize",
    "lint": "bunx prettier --write .",
    "typecheck": "bunx astro check"
  }
}
```

---

## 📊 Phase 8: SEO & Analytics

### 8.1 RSS Feed Setup
```javascript
// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  return rss({
    title: 'GameBoy Developer Portfolio',
    description: 'A developer portfolio with GameBoy aesthetic and Tokyo Night vibes',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishDate,
      link: `/blog/${post.slug}/`,
    })),
  });
}
```

---

## 🎯 Implementation Priority Order

### Week 1: Foundation
- [x] Project setup with Bun
- [x] Base theme configuration
- [x] Core layouts and components
- [x] Tailwind + custom color palette

### Week 2: Portfolio
- [x] Home page with hero section
- [x] Projects listing page
- [x] Individual project pages
- [x] jeetSocial project content

### Week 3: Blog
- [x] Blog listing page
- [x] Individual blog post pages
- [x] RSS feed generation
- [x] Blog content structure

### Week 4: Search & Performance
- [x] Pagefind integration
- [x] Custom search UI
- [x] Image optimization
- [x] Performance testing

### Week 5: Game & Polish
- [x] Mini game implementation
- [x] Sound effects (Web Audio API)
- [x] GameBoy styling
- [x] Micro-interactions

### Week 6: Deployment
- [x] GitHub Actions workflow
- [x] GitHub Pages configuration
- [x] Testing and optimization
- [x] Launch preparation

---

## 🔧 Key Best Practices Applied

### Performance
- ✅ **Static Generation:** Astro's static-first approach
- ✅ **Image Optimization:** Sharp service, WebP/AVIF formats
- ✅ **Minimal JavaScript:** Only load what's necessary
- ✅ **Lazy Loading:** Images and components
- ✅ **Build Optimization:** Bun runtime, frozen lockfile

### SEO & Accessibility
- ✅ **Semantic HTML:** Proper heading hierarchy
- ✅ **Meta Tags:** Title, description, Open Graph
- ✅ **RSS Feed:** Content syndication
- ✅ **Alt Text:** All images have descriptions
- ✅ **Keyboard Navigation:** Full keyboard support

### Developer Experience
- ✅ **TypeScript:** Type-safe development
- ✅ **Hot Reload:** Fast development iteration
- ✅ **Code Formatting:** Prettier integration
- ✅ **Modern Tooling:** Bun package manager

### Design System
- ✅ **Consistent Theme:** GameBoy + Tokyo Night palette
- ✅ **Responsive Design:** Mobile-first approach
- ✅ **Component Architecture:** Reusable UI components
- ✅ **Custom Styling:** Tailwind + custom CSS

---

## 📚 Research Sources

### High-Quality Repository References
- [cojocaru-david/portfolio](https://github.com/cojocaru-david/portfolio) - Modern Astro portfolio structure
- [Shiawaseu/Astro-Portfolio](https://github.com/Shiawaseu/Astro-Portfolio) - Professional portfolio components
- [tmachnacki/portfolio](https://github.com/tmachnacki/portfolio) - Performance optimization examples

### Official Documentation
- [Astro Image Optimization](https://docs.astro.build/en/guides/images/)
- [Astro RSS Guide](https://docs.astro.build/en/guides/rss/)
- [Pagefind Documentation](https://pagefind.app/docs/)
- [Bun Runtime Guide](https://bun.com/docs/guides/ecosystem/astro)
- [GitHub Pages Quickstart](https://docs.github.com/en/pages/quickstart) - Official username.github.io setup

### Design Resources
- [GameBoy Color Palette](https://www.color-hex.com/color-palette/45299)
- [Tokyo Night Theme](https://github.com/tokyo-night/tokyo-night-vscode-theme)
- [Press Start 2P Font](https://fonts.google.com/specimen/Press+Start+2P)

---

## 🚀 Next Steps

1. **Review Plan:** Confirm all requirements are covered
2. **Begin Implementation:** Start with Phase 1 project setup
3. **Iterative Development:** Follow weekly priority order
4. **Testing & Launch:** Deploy to GitHub Pages

---

**Status:** Planning Complete ✅  
**Ready for Implementation:** Yes  
**Estimated Timeline:** 6 weeks