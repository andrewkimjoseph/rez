# Rez

**Rez by [Canvassing](https://thecanvassing.xyz)** is the researcher dashboard for creating, managing, and analyzing field research tasks completed by participants in the **Pax** mobile app. Task Masters (researchers, UX teams, product managers) use Rez to launch surveys, app tests, and polls; monitor completions; and review poll insights synced to the public insights site.

**Production:** [https://rez.thecanvassing.xyz](https://rez.thecanvassing.xyz)

---

## Table of contents

- [Overview](#overview)
- [Ecosystem](#ecosystem)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Architecture notes](#architecture-notes)
- [API routes](#api-routes)
- [Related documentation](#related-documentation)

---

## Overview

Rez connects researchers with real users—especially stablecoin and digital-payment users in emerging markets—who complete tasks on Pax. Researchers sign in with Google, join or create an organization, then create and monitor tasks from a multi-step wizard. Completions, demographics, and rewards flow through Firebase (Pax + Rez Firestore) and, for poll tasks, into Supabase for aggregated insights.

### Task types

| Type | `type` value | Description |
|------|----------------|-------------|
| Fill a Form | `fillAForm` | Survey / questionnaire via external form link |
| Check Out App | `checkOutApp` | Product or app testing with instructions and feedback URL |
| Do Video Interview | `doVideoInterview` | Qualitative research (planned / limited) |
| Answer Poll | `answerPoll` | Multi-question polls with Supabase-backed insights and public reporting |

### Primary users

- **Task Masters** — create tasks, view completions, manage account and organization
- **Admins** — super-user views for tasks, participants, task masters, withdrawal methods, and completions
- **Participants** — use Pax (not this repo); Rez is the control plane

---

## Ecosystem

```text
┌─────────────────┐     creates tasks      ┌──────────────────┐
│  Rez (this app) │ ─────────────────────► │ Pax Firestore    │
│  Next.js        │                        │ (thepaxapp)      │
└────────┬────────┘                        └────────┬─────────┘
         │                                            │
         │ poll sync / insights                       │ completions
         ▼                                            ▼
┌─────────────────┐                        ┌──────────────────┐
│ Supabase        │ ◄── public insights ── │ Pax Flutter app  │
│ (poll schema)   │     thecanvassing.xyz  │ (participants)   │
└─────────────────┘                        └──────────────────┘
```

- **Rez** — task creation, admin, poll publication state, insights charts
- **Pax** — participant mobile app ([pax_v2](https://github.com/andrewkimjoseph/pax_v2))
- **the-canvassing-xyz** — public poll insights and research pages

---

## Features

### Task Master (researcher)

- Google sign-in and organization onboarding
- Dashboard with task and completion stats
- Multi-step task creation wizard with weekly rate limiting
- Task list, edit, status updates, and completion tracking
- Resources, analytics, account, and embedded Pax analytics (`/pax`)
- Lead capture integration with [thecanvassing.xyz](https://thecanvassing.xyz) (Brevo / cookies)

### Polls & insights

- Create **Answer Poll** tasks with multiple questions and options
- Sync poll metadata and publication state from Pax Firestore → Supabase
- In-app insights at `/tasks/insights/[taskId]` and `/insights`
- Public insights links on [thecanvassing.xyz/insights](https://thecanvassing.xyz/insights)
- Charts: response breakdown, demographics, country distribution (Recharts)

### Admin

- Task and task completion management across all Task Masters
- Participant and Task Master administration
- Withdrawal method oversight
- Delete task completions, update tasks, pending/active counts

### Integrations

| Service | Purpose |
|---------|---------|
| Firebase Auth + Firestore | Rez users; dual admin SDK for Rez + Pax databases |
| Supabase | Poll content, answers, insights aggregation |
| Algolia | Search (client + server helpers) |
| Amplitude | Product analytics |
| Sentry | Error monitoring (`canvassing/the-rez-app`) |
| Resend | Transactional email |
| Brevo | Marketing automation / lead linking |
| Telegram | Rez Totifier notifications for new tasks and accounts |

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router, Turbopack in dev) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix), Lucide / Heroicons |
| Forms | React Hook Form + Zod |
| State | Zustand (persisted stores) |
| Charts | Recharts |
| Backend | Next.js Route Handlers, Firebase Admin, Supabase service role |
| Deployment | Vercel |

---

## Repository layout

The git root contains a single Next.js application in the `rez/` subdirectory (historical monorepo-style layout).

```text
rez/                          ← git repository root (this README)
└── rez/                      ← Next.js application — run all npm commands here
    ├── app/                  ← App Router pages and API routes
    │   ├── admin/            ← Super-admin UI
    │   ├── api/              ← REST-style route handlers
    │   ├── dashboard/
    │   ├── insights/         ← Poll insights index + detail
    │   ├── tasks/            ← Create, list, edit, per-task insights
    │   └── ...
    ├── components/           ← UI and feature components
    ├── firebase/             ← Client + Admin Firebase config
    ├── hooks/
    ├── lib/                  ← Supabase, Algolia, poll helpers
    ├── services/             ← Poll sync, content fetch, insights
    ├── stores/               ← Zustand stores
    ├── scripts/              ← One-off maintenance scripts
    ├── types/
    ├── MVP.md                ← Detailed product specification
    └── API_SETUP.md          ← Firebase API route setup notes
```

---

## Getting started

### Prerequisites

- Node.js 20+ (22 recommended for local dev; matches current Vercel runtime target)
- npm
- Firebase projects for **Rez** and **Pax** with service account credentials
- Supabase project (for poll features)
- Environment file (see below)

### Install and run

All commands run from the **`rez/rez`** directory:

```bash
cd rez
npm install
cp .env.example .env.local   # if you maintain an example file; otherwise copy from team secrets
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/sign-in`; `/` redirects to `/dashboard`.

### Other commands

```bash
npm run build    # production build
npm run start    # serve production build locally
npm run lint     # ESLint
```

---

## Environment variables

Create **`rez/rez/.env.local`** (or `.env` for local-only). Never commit secrets. Configure the same keys in the Vercel project for production.

### App

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | Public URL, e.g. `https://rez.thecanvassing.xyz` |
| `INTERNAL_API_TOKEN` | Shared secret for server-to-server calls between Rez API routes |

### Firebase — Rez (client)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Rez project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Analytics (optional) |

### Firebase — Admin (server)

| Variable | Description |
|----------|-------------|
| `REZ_FIREBASE_PROJECT_ID` | Rez Firestore admin |
| `REZ_FIREBASE_CLIENT_EMAIL` | Service account email |
| `REZ_FIREBASE_PRIVATE_KEY` | Service account private key (escaped `\n`) |
| `PAX_FIREBASE_PROJECT_ID` | Pax / thepaxapp Firestore admin |
| `PAX_FIREBASE_CLIENT_EMAIL` | Pax service account email |
| `PAX_FIREBASE_PRIVATE_KEY` | Pax service account private key |

### Supabase (polls)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |

### Search, email, notifications

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ALGOLIA_APP_ID` | Algolia application ID |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY` | Algolia search-only key |
| `RESEND_API_KEY` | Resend email API |
| `BREVO_API_KEY` | Brevo marketing API |
| `TELEGRAM_BOT_TOKEN` | Rez Totifier bot |
| `TELEGRAM_CHAT_ID` | Notification chat ID |
| `PAX_TOTIFIER_TELEGRAM_BOT_TOKEN` | Pax webhook bot |
| `PAX_TOTIFIER_WEBHOOK_SECRET` | Webhook verification |

### Observability

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_AMPLITUDE_API_KEY` | Amplitude browser SDK |
| Sentry | Configured via `@sentry/nextjs` and `.env.sentry-build-plugin` |

> **Note:** Do not add `FIREBASE_*`-prefixed CLI-only variables to `.env` files used for Cloud Functions-style loading. Vercel reserves certain prefixes.

---

## Scripts

### Backfill poll publication

Syncs all `answerPoll` tasks from Pax Firestore into Supabase (one-time or maintenance):

```bash
cd rez
npx tsx scripts/backfill-poll-publication.ts
```

Requires `.env` / `.env.local` with Firebase and Supabase credentials.

---

## Deployment

Rez is deployed on **Vercel** (team: The Canvassing's projects), connected to the GitHub repository.

### Git push (recommended)

Push to `main`; Vercel builds and promotes production automatically.

### Vercel CLI

From `rez/rez`:

```bash
vercel          # preview deployment
vercel --prod   # production
```

Ensure the Vercel project **root directory** is set to `rez` (the inner app folder) if the linked repo is the git root.

### Build notes

- Do **not** add platform-specific packages like `@next/swc-darwin-arm64` to `dependencies`; Next.js selects the correct SWC binary automatically.
- The repository must be **public** (or the Vercel team must be on a plan that supports private-repo collaborators) for Hobby-tier Git deployments from non-owner commit authors.

---

## Architecture notes

### Dual Firestore

`firebase/serverConfig.ts` initializes two Firebase Admin apps:

- **`paxApp`** — tasks and completions in the Pax participant app
- **`rezApp`** — Task Masters, organizations, and Rez-specific data

Task creation writes to Pax Firestore; Rez reads and filters by `rezTaskMasterEmailAddress`.

### Auth middleware

`middleware.ts` protects routes using `firebaseToken` and `organizationId` cookies. Public paths: `/sign-in`, `/about`, `/terms-of-service`, `/privacy-policy`.

### Poll publication

Poll tasks sync to Supabase via `services/syncPollPublication.ts`. Publication is driven by `reviewStatus`, `isAvailable`, and `deadline` (`lib/poll-publication-state.ts`). Insights APIs live under `/api/pollInsights` and `/api/pollContent`.

---

## API routes

High-level map (see `app/api/` for the full list):

| Area | Examples |
|------|----------|
| Tasks | `createTask`, `updateTask`, `updateTaskStatus`, `fetchAllTasksForRezTaskMaster` |
| Completions | `fetchAllTaskCompletionsForRezTaskMaster`, `fetchTasksAndCompletionsForRezTaskMaster` |
| Polls | `pollContent/[taskId]`, `pollInsights`, `pollInsights/[taskId]` |
| Admin | `admin/fetchAllTasks`, `admin/taskCompletions`, `admin/deleteTaskCompletion`, … |
| Notifications | `notifyRezTotifierOfNewTask`, `notifyRezTotifierOfUpdatedOrDeletedTask`, `sendResendEmail` |
| Webhooks | `pax-totifier-webhook` |
| Automations | `fireTriggerForAutomationB2`, `fireTriggerForAutomationC2`, `fireTriggerForAutomationP2` |

Authenticated Task Master routes filter by the signed-in user's email. Admin routes require elevated Task Master permissions.

---

## Related documentation

- [`rez/MVP.md`](rez/MVP.md) — full product specification, data models, and UI details
- [`rez/API_SETUP.md`](rez/API_SETUP.md) — Firebase service account setup for API routes

---

## License

Private — © Canvassing. All rights reserved.
