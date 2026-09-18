# Onwun Studio

A client and project management app for Onwun, built for the studio's actual
day-to-day workflow — discovery through delivery — not a generic sales CRM.

## Features

- **Home** — total clients, active projects, what's waiting on you, and unpaid
  invoices at a glance, plus today's tasks and upcoming events across every
  client, and a client list showing phase progress at a glance.
- **Client dashboard** — the project broken into four phases (Discovery,
  Strategy, Design, Delivery), each with its own checklist of steps, plus a
  weekly timeline of upcoming tasks and events for that client.
- **Discovery & Strategy workshop** — a step-by-step questionnaire to run live
  with a client: one question at a time, grouped into sections, with a field
  for the client's answer and a separate private note field, and a progress
  tracker showing which question you're on.
- **Documents** — proposal, contract, invoices, brand strategy, presentations,
  and guidelines, each with a status (with the client, signed, paid, etc.).
- **Tasks** and **Updates** — per-client, so nothing about a project lives
  outside its own space.
- **Library** — supporting research, recordings, and reference material.
- **Brand hub** — the final delivered brand assets, once a project is signed
  off.

The app ships with 6 mock clients at different stages of the process — including
one (Bloom Ventures) fully completed end-to-end with a filled-in workshop,
signed documents, and delivered brand assets — so it's immediately explorable.
Data lives in the browser's `localStorage`, so any edits you make persist
across reloads on the same device.

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
- React Router

## Project structure

```
src/
  components/       Shared UI: layout, cards, badges, drawers, timeline
  context/          AppContext — the single source of truth for client data
  data/             Mock clients, team members, and the workshop template
  lib/              Formatting, phase-progress, and label helpers
  pages/
    Home.tsx        The studio-wide overview
    client/         Per-client pages (Dashboard, Updates, Tasks, Documents,
                     Library, Discovery & Strategy, Brand hub)
  types/            Shared TypeScript types
```

## Notes on data

All data is currently mock data, generated deterministically and stored
client-side. When this app is ready to be hosted for real business use, the
`AppContext` data layer (`src/context/AppContext.tsx`) is the place to swap
`localStorage` for a real backend/API without touching the UI.
