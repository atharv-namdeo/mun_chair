# MUN Chair Pro

A production-grade, real-time **Model United Nations** session management platform for committee chairs and directors.

## Features

- 🎤 **Speaker Queue** — reorderable queue, call delegates with one click
- ⏱️ **Multi-Timer System** — simultaneous Speaker, Moderated Caucus, and Unmoderated Caucus timers with visual urgency (green → amber → red → pulse) and audio alerts
- 🗳️ **All 5 Point Types** — POI, POO, PPP, PI, RoR with chair ruling workflow
- 📋 **10 Motion Types** — with vote threshold config (simple/⅔/unanimous) and voting panel
- 👥 **Delegate Management** — sortable table, engagement scores, time equity warnings, CSV bulk import, soft-delete
- 📊 **Engagement Scoring** — fully configurable weights per activity type
- 📜 **Audit Timeline** — real-time log of all session events with per-event undo
- ⌘Z **20-level Undo** — keyboard shortcut supported
- 🚨 **Crisis Mode** — tag speeches and enable crisis protocol
- 📄 **PDF & CSV Export** — full session report with jsPDF
- 🌐 **Multi-device Sync** — real-time Firestore `onSnapshot` listeners
- 📶 **Offline Support** — Firestore persistent cache, offline banner
- 🔒 **Anonymous Auth** — no login friction for live conference use

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vite + React 18 + TypeScript |
| State | Zustand |
| Backend | Firebase Firestore + Anonymous Auth |
| Offline | Firestore Persistent Local Cache |
| PDF | jsPDF + jspdf-autotable |
| CSV | Papa Parse |
| Icons | Lucide React |
| Fonts | Inter + JetBrains Mono |

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/atharv-namdeo/mun_chair.git
cd mun_chair
npm install
```

### 2. Firebase Configuration
Copy `.env.example` to `.env` and fill in your Firebase credentials:
```bash
cp .env.example .env
```

See [SETUP.md](./SETUP.md) for full Firebase setup instructions.

### 3. Run Locally
```bash
npm run dev
```

### 4. Deploy to Vercel
Set the environment variables from `.env.example` in your Vercel project dashboard, then deploy.

## Firebase Collections

| Collection | Purpose |
|-----------|---------|
| `sessions` | Session metadata, settings, timer state |
| `delegates` | Per-delegate profiles and stats |
| `speeches` | All speeches with yield and timer data |
| `pois` | Points of Information with quality scores |
| `motions` | Motions with type, threshold, vote outcome |
| `points` | All 5 point types with chair rulings |
| `votes` | Per-motion voting records |
| `timeline` | Full audit log and undo stack |
