---
title: "Flight Deal Monitor"
description: "Automated flight deal monitoring system that detects flash sales and mistake fares using Amadeus and Duffel APIs, sending real-time Telegram alerts. Runs on FastAPI with Docker support."
pubDate: 2026-05-14
tags: ["Python", "FastAPI", "Docker", "SQLite", "Telegram API", "Amadeus API"]
repoUrl: "https://github.com/bigknoxy/flight-deal-monitor"
featured: false
---

## Automated Flight Deal Detection

A backend system that continuously monitors flight prices for flash sales (≥40% price drop) and mistake fares (<30% of median price), sending instant Telegram alerts when deals are found.

## Features

- **Route Monitoring** — Continuous price checks from configured home airports to destinations
- **Smart Deal Detection** — Identifies flash sales and mistake fares using price history medians
- **Real-time Alerts** — Instant Telegram notifications with direct booking links
- **24h Deduplication** — Prevents alert spam for the same flight
- **Smart Scheduling** — Regular sweeps (30 min) + priority mistake fare checks (15 min)
- **Dual API Support** — Amadeus as primary, Duffel as fallback for reliability
- **Health Monitoring** — Built-in health endpoints for Docker/Kubernetes readiness checks
- **Docker Ready** — Multi-stage Docker build for easy deployment

## Tech Stack

- **Backend**: Python 3.11+ / FastAPI / APScheduler
- **Database**: SQLite with PostgreSQL upgrade path
- **ORM**: SQLModel (type-safe, SQLAlchemy-backed)
- **HTTP Client**: httpx (async)
- **APIs**: Amadeus Flight Search + Duffel Air API
- **Notifications**: Telegram Bot API
- **Deployment**: Docker + docker-compose
- **Testing**: pytest + pytest-asyncio + pytest-mock
