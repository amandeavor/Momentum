<div align="center">

<img src="docs/assets/social-preview.png" alt="Momentum: Plan. Focus. Keep moving." width="100%">

# Momentum

**A unified, minimalist mobile productivity suite for habits, tasks, focus, and personal analytics.**

[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2.0-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![CI Status](https://img.shields.io/github/actions/workflow/status/amandeavor/Momentum/ci.yml?branch=main&label=CI)](https://github.com/amandeavor/Momentum/actions/workflows/ci.yml)

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#core-features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#contributing">Contributing</a>
</p>

</div>

---

## Overview

`Momentum` is an integrated iOS and Android productivity application built with **React Native** and **Expo**. It replaces fragmented productivity apps by unifying **daily task pipelines**, **streak-based habit tracking**, **customizable Pomodoro focus intervals**, **rich journaling**, and **deep habit analytics** into a cohesive, fluid mobile interface.

---

## Core Features

```
                    ┌──────────────────────────────────────────────┐
                    │          Momentum Mobile Ecosystem           │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌──────────────────┬──────────────┴─────┬──────────────────┐
         ▼                  ▼                    ▼                  ▼
  ┌──────────────┐   ┌──────────────┐     ┌──────────────┐   ┌──────────────┐
  │ Habit Engine │   │ Task Planner │     │ Focus Studio │   │  Analytics   │
  │ Streak heat- │   │ Priority tags│     │  Pomodoro,   │   │  Completion  │
  │  maps, check-│   │  filters, sub│     │  haptics &   │   │  trends &    │
  │  in confetti │   │    tasks     │     │  soundscapes │   │  scorecards  │
  └──────────────┘   └──────────────┘     └──────────────┘   └──────────────┘
```

| Feature | Description |
| :--- | :--- |
| **Habit Tracking** | Daily check-in cards with micro-animations, customizable frequencies, and celebratory confetti effects. |
| **Task Management** | Flexible task scheduling with priority filtering, categorization, and milestone breakdowns. |
| **Focus Sessions** | Visual Pomodoro and customizable deep-work timers with breathing exercises and urge-surfing prompts. |
| **Streak Analytics** | Interactive GitHub-style activity heatmaps, monthly streak calendars, and completion rate metrics. |
| **Cloud Sync & Offline** | Redux Persist local caching backed by Supabase cloud storage for multi-device synchronization. |

---

## Architecture & File Structure

```
Momentum/
├── src/
│   ├── app/            # Expo Router file-based routes (auth, tabs, modals)
│   ├── components/     # Feature components (habits, focus, tasks, analytics)
│   ├── hooks/          # Custom React hooks (timers, haptics, auth listeners)
│   ├── services/       # Supabase database clients, auth providers, storage
│   ├── store/          # Redux Toolkit state slices and persistent storage
│   ├── theme/          # Spacing grid, typography tokens, color palettes
│   └── utils/          # Date formatters, validators, calculations
├── eas.json            # EAS Build configuration for iOS & Android
└── app.json            # Expo application manifest
```

---

## Quickstart

### Prerequisites
- Node.js `20+`
- Expo Go app on iOS/Android or local simulator (Xcode / Android Studio)

### Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/amandeavor/Momentum.git
cd Momentum

# 2. Install dependencies
npm install

# 3. Configure environment secrets
cp .env.example .env

# 4. Start Expo development server
npm start
```

For targeted simulator sessions:

```bash
# Run on Android emulator / device
npm run android

# Run on iOS simulator (macOS)
npm run ios

# Run web preview
npm run web
```

---

## Quality Commands

```bash
# TypeScript compiler verification
npm run typecheck

# Code style linting
npm run lint
```

---

## Community & Governance

- [Contributing Guide](CONTRIBUTING.md)
- [Project Roadmap](ROADMAP.md)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [License Decision Issue](https://github.com/amandeavor/Momentum/issues/24)

---

## License

No repository-level license file is currently included. See [Issue #24](https://github.com/amandeavor/Momentum/issues/24) for status.
