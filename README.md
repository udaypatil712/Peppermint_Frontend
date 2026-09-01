# Fleet Dashboard — Peppermint Robotics Challenge

This is the frontend for the SDE-1 hiring challenge. It's a real-time operator dashboard that shows a live map of autonomous robots, lets you filter and inspect them, and gives you trend charts over time.

## 🚀 Live Production URLs

- **Live Dashboard (Frontend):** https://peppermint-frontend.vercel.app
- **Production Backend API:** https://peppermint-backend-x8h1.onrender.com

---

## What it shows

- **Live site map** — 900×560 canvas rendering all robots as they move. Zoom in, pan around, click a robot to select it.
- **Fleet roster** — sortable list of all robots with their type, status badge, battery bar, and position. Filter by attention-needed, active, or idle.
- **Trend charts** — area charts for active fraction, attention count, and average battery over the last 1m / 5m / 15m / 30m.
- **Robot detail modal** — click "Details" on any robot to see its battery history chart and recent event log.
- **Live controls panel** — change fleet size, tick rate, or payload size at runtime. Force a robot into a disrupted state (error, blocked, offline) for testing.
- **Connection indicator** — shows live/connecting/offline and messages per second in the header.

---

## Tech

React 18 · TypeScript · Vite · Tailwind CSS · Recharts · Lucide icons

---

## Getting started

First, make sure the backend is running. Then:

```bash
npm install
npm run dev
```

Opens at `http://localhost:3000`.

By default it connects to the backend at `http://localhost:4000`. If you're using a remote backend, create a `.env` file:

```env
VITE_API_URL=https://your-backend.onrender.com
VITE_WS_URL=wss://your-backend.onrender.com/ws
```

---

## How to use the dashboard

**Selecting a robot:**
Click any robot on the canvas map or click its row in the roster on the right. A teal ring appears on the map and a dashed trail shows its recent path.

**Filtering the roster:**
Use the tab buttons at the top of the roster — "All", "⚠ Attention" (error/blocked/offline/battery < 20%), "Active", or "Idle". The search box also filters by robot ID or type.

**Opening robot history:**
Click the "Details" link on any robot in the roster. A modal opens with a battery-over-time chart and a recent event log pulled from `GET /api/robots/history/:id`.

**Changing config:**
Click "Controls" in the header. Sliders for fleet size, tick interval, and payload size — changes hit the backend immediately. You can also force a disruption on the currently selected robot.

**Zoom and pan on the map:**
Mouse wheel to zoom. Click and drag to pan. Use the zoom controls in the top-right corner of the map to reset.

---

## Project structure

```
src/
  App.tsx                      — Root component: WebSocket connection, state, layout
  types/index.ts               — Shared TypeScript types (TelemetryEvent, FleetConfig, etc.)
  utils/status.ts              — Status badge helper shared by all components
  services/
    websocket.ts               — WebSocket client with auto-reconnect and pub/sub
  components/
    Header.tsx                 — Top bar: connection status, fleet counts, controls toggle
    FleetMapCanvas.tsx         — 60fps Canvas map with zoom/pan, trails, robot markers
    FleetAnalytics.tsx         — Recharts area charts for fleet trend metrics
    RobotList.tsx              — Filterable, searchable robot roster
    RobotDetailModal.tsx       — Per-robot history modal with chart + event log
    ControlPanel.tsx           — Runtime config sliders + disruption trigger
```

---

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework: **Vite** (Vercel detects it automatically)
4. Add environment variables:
   - `VITE_API_URL` → your Render backend URL
   - `VITE_WS_URL` → your Render backend WebSocket URL (use `wss://`)
5. Deploy

Takes about 60 seconds. You'll get a `.vercel.app` URL.
