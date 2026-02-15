# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Generator inspection management system (Thai language UI) built with SvelteKit 5, deployed to Vercel. Tracks electrical generators across departments, manages inspection forms/templates, and records monthly inspection results.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build (Vercel adapter)
- `npm run check` — Type-check with svelte-check
- `npm run db:generate` — Generate Drizzle migrations
- `npm run db:push` — Push schema to database
- `npm run db:seed` — Seed database (`npx tsx src/lib/server/seed.ts`)

## Tech Stack

- **Framework**: SvelteKit 5 with TypeScript, adapter-vercel (Node.js 22.x)
- **Database**: PostgreSQL via Neon serverless (`@neondatabase/serverless` + Drizzle ORM)
- **Styling**: Tailwind CSS v4 (Vite plugin)
- **Auth**: HMAC-SHA256 signed session cookies (`bcryptjs` for password hashing)

## Architecture

### Database Layer
- **Schema**: `src/lib/db/schema.ts` — All tables defined with Drizzle ORM (departments, generators, formTemplates, formTemplateItems, inspections, inspectionDetails, users)
- **Connection**: `src/lib/db/index.ts` — Neon serverless client, exports `db` instance and re-exports schema
- **Config**: `drizzle.config.ts` — Reads `DATABASE_URL` from `.env.local` or `.env`

### Auth & Session
- `src/lib/server/session.ts` — Session sign/verify using HMAC-SHA256, cookie-based auth
- `src/hooks.server.ts` — Route protection middleware. Only `/admin` routes require login with `role === 'admin'`. All other routes (`/dashboard`, `/department`, `/inspection`) are public — no login required.
- User roles: `admin`, `inspector`, `viewer` (login required only for admin panel)

### Route Structure
- `/` — Home/KPI dashboard (public-facing summary)
- `/login` — Authentication
- `/dashboard` — User dashboard (requires login)
- `/department/[id]/calendar` — Department calendar view
- `/department/[id]/month/[year]/[month]` — Monthly inspection list per department
- `/inspection/new/[generator_id]/[year]/[month]` — Create/edit inspection (form actions: `create`, `update`)
- `/inspection/[id]` — View inspection details
- `/admin/*` — Admin panel (departments, generators, users, form-templates, inspections)
- `/api/auth/*` — Login/logout API endpoints (public)

### Conventions
- **No public API routes for data mutations**: Use SvelteKit form actions (`+page.server.ts` with `export const actions`) instead of `/api/*` routes for create/update/delete operations. API routes are public endpoints accessible from outside; form actions are protected by route middleware in `hooks.server.ts` automatically.
- **API routes (`/api/*`) are only for**: authentication endpoints (`/api/auth/*`) or truly public-facing APIs.
- **Form action call pattern**: Client-side code calls actions via `fetch('?/actionName', { method: 'POST', ... })` and checks `result.type === 'success'` or `result.type === 'failure'`.

### Business Logic
- `src/lib/server/inspectionLogic.ts` — Inspection status calculation (overall status, machine status based on disposal criteria), inspection code generation (`INS-{timestamp}-{random}`)
- `src/lib/utils.ts` — Shared Thai date formatting utilities
- Machine status rules: "ใช้งานได้" (all normal) → "ซ่อมแซม" (some abnormal) → "รอจำหน่าย" (all disposal criteria items abnormal)

### Environment Variables
- `DATABASE_URL` — Neon PostgreSQL connection string
- `SESSION_SECRET` — HMAC signing key for session cookies
