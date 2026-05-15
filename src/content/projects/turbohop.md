---
title: "TurboHop"
description: "A SNES-style 16-bit endless platformer built with Phaser 3 and TypeScript. Features 13 character skins, 5 enemy types, Firebase global leaderboards, daily challenges, power-ups, and PWA support for mobile play."
pubDate: 2026-05-14
tags: ["TypeScript", "Phaser 3", "Firebase", "Vite", "PWA", "Game"]
repoUrl: "https://github.com/bigknoxy/TurboHop"
demoUrl: "https://turbohop-game.web.app/"
featured: true
---

## A 16-bit Endless Platformer

TurboHop is a SNES-inspired auto-runner where the world scrolls automatically and you control the jumps. Built with Phaser 3, TypeScript, Vite, and Firebase — installable as a PWA for fullscreen mobile play.

## Gameplay

- **Auto-runner** with hold for higher jump and mid-air double-jump
- **Stomp enemies** — 5 types including Slime, Bird, Bat, Spike, and Ghost
- **13 character skins** — Blue, Red, Ninja, Cat, Robot, Wizard, Gold, Astronaut, Skeleton, Purple, Dragon, Rainbow, Green
- **Power-ups** — Magnet, Shield, 2x Coins, Speed Boost
- **Permanent upgrades** — Extra HP, Coin Magnet, Slow Start, Jump Boost, Starting Shield
- **Daily challenges** — Seed-based challenge every 24h with unique leaderboards
- **7-day streak rewards** — Escalating daily coin payouts
- **Gamepad support** and reduced motion / colorblind accessibility modes

## Technical Highlights

- **Entity-Component pattern** with SOLID principles across 9 Phaser scenes
- **Object pooling** for platforms, coins, and enemies — recycled, not created/destroyed
- **Factory Pattern** — PlatformFactory and EnemyFactory handle creation and pooling
- **EventBus** — Decoupled cross-scene communication
- **Procedural assets** — All textures generated via Phaser Graphics API at boot
- **Procedural audio** — Chiptune SFX via Web Audio API oscillators
- **Firebase backend** — Firestore, Auth, Remote Config, Analytics, Firebase Hosting
- **Global leaderboards** — Top 100 rankings with daily challenge variants

## Play

[Production on Firebase](https://turbohop-game.web.app/) | [Staging on GitHub Pages](https://bigknoxy.github.io/TurboHop/)
