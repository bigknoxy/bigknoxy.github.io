---
title: "kTracker"
description: "Full-stack weight, workout, and task management app with JWT authentication, interactive data visualization, and a responsive dark-mode UI. Built with React, Hono, Prisma, and SQLite."
pubDate: 2025-12-29
tags: ["React", "TypeScript", "Hono", "Prisma", "SQLite", "Bun", "Tailwind CSS"]
repoUrl: "https://github.com/bigknoxy/ktracker"
featured: false
---

## Health and Productivity in One Place

kTracker is a full-stack application for tracking weight, workouts, and tasks — with interactive charts, JWT auth, and a polished dark-mode interface built to WCAG 2.1 AA standards.

## Features

- **Weight Tracking** — Interactive charts with trend analysis and goal setting
- **Workout Logging** — Exercise details with sets, reps, and weight history
- **Task Management** — Priorities, deadlines, and completion tracking
- **JWT Authentication** — Secure sessions with bcrypt password hashing
- **Dark Mode** — Persisted theme with automatic system preference detection
- **Mobile Responsive** — Bottom navigation for mobile, sidebar for desktop
- **Real-time Validation** — Client and server-side error handling
- **Animated UI** — Skeleton loading states and page transitions
- **Accessibility** — WCAG 2.1 AA compliant with keyboard navigation

## Tech Stack

**Backend**
- Runtime: Bun
- Framework: Hono
- Database: SQLite (dev) / PostgreSQL (production-ready)
- ORM: Prisma
- Auth: JWT with bcrypt

**Frontend**
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS
- Recharts for data visualization
- React Context API for state
- Cypress for E2E testing
