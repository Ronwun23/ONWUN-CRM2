# Onwun CRM

A lead and pipeline management app for Onwun, built with React, TypeScript, and Vite.

## Features

- **Leads** — searchable, filterable, sortable table of every lead with a detail
  drawer for contact info, deal value, activity history, and inline notes.
- **Pipeline** — a drag-and-drop kanban board across all deal stages (New,
  Contacted, Qualified, Proposal, Negotiation, Won, Lost), with per-column deal
  totals and live open-pipeline value.
- **Analytics** — team-wide dashboard covering pipeline funnel by stage, win/loss
  breakdown, lead source mix, new-lead trend, and rep performance (won value and
  win rate by owner).

The app ships with realistic mock data (68 leads across 5 reps, 7 sources, and
7 stages) so it's immediately explorable. Data lives in the browser's
`localStorage`, so edits (moving a lead's stage, adding a note, adding a new
lead) persist across reloads on the same device.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Recharts (analytics charts)
- @dnd-kit (pipeline drag-and-drop)
- React Router

## Project structure

```
src/
  components/   Shared UI: layout, drawers, cards, badges, charts
  context/      CrmContext — the single source of truth for lead data
  data/         Mock leads and sales-rep seed data
  lib/          Formatting helpers and analytics aggregation
  pages/        Leads, Pipeline, Analytics
  types/        Shared TypeScript types
```

## Notes on data

All data is currently mock data generated deterministically at build time and
stored client-side. When this app is ready to be hosted for real business use,
the `CrmContext` data layer (`src/context/CrmContext.tsx`) is the place to swap
`localStorage` for a real backend/API without touching the UI.
