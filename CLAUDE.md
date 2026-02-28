# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is PosterMe?

PosterMe lets users upload a photo and select a persona (movie character, series character, YouTuber) to generate a cinematic movie poster with their face composited into that universe. The brand is fun, creative, and cinematic — turning anyone into the star of their own movie.

Monetization: credit-based system (5 credits for ₹49 via Razorpay), with an unlimited plan option. Guests can browse but must sign in (Google OAuth) to generate.

## Commands

```bash
npm run dev          # Vite dev server on port 3000
npm run build        # Production build to /dist
npm run preview      # Preview production build
npx supabase functions serve   # Run edge functions locally
```

## Architecture

**Stack:** React 19 + TypeScript, Vite 6, Supabase (auth/db/storage/edge functions), Google Gemini API (vision + image gen), Razorpay payments, Tailwind CSS (CDN), PWA via vite-plugin-pwa.

**State management:** React Context API only (no external state library).
- `AuthContext` — Supabase auth session, Google OAuth sign-in/out, guest-to-user state restoration via localStorage + custom events.
- `ImageContext` — uploaded image, selected persona, generated image, library, credits, face description cache, persona list (loaded from Supabase `discovered_personas` table).

**Routing (React Router 7):** Critical pages (`/`, `/result`, `/persona/:personaId`) are eagerly loaded. Secondary pages (`/library`, `/admin`) are lazy loaded with Suspense.

**Image generation pipeline** (in edge function `generate-poster`):
1. Validate auth → 2. Atomically deduct credit via `consume_credit()` RPC → 3. Extract face description (Gemini vision) or reuse cached → 4. Generate poster (Gemini 3.1 Flash) → 5. Auto-save to Supabase Storage + `creations` table → 6. Refund credit on failure.

**Face description caching:** SHA-256 hash of first 10KB of image data is computed client-side. If the hash matches a previous upload, the cached face description is reused to save API calls when trying multiple personas.

## Key Patterns

- **Guest flow:** Guests can browse and upload, but generation requires sign-in. Pending generation state (image + persona) is saved to localStorage with a 10-min TTL, then restored after OAuth redirect via a `pendingGenerationRestored` custom event.
- **Credit operations are atomic:** `consume_credit()` is a Supabase RPC that prevents race conditions. Failed generations trigger `admin_refund_credit()`.
- **Personas are DB-driven:** Loaded from `discovered_personas` table with `visible` and `display_order` fields. The `PERSONAS` constant in `constants.ts` is empty — all personas come from the database.
- **Optimistic UI:** Credits deducted and library items added to local state immediately, reverted on error.
- **Toast notifications:** All user-facing feedback uses Sonner (`sonner` package), configured as dark theme with rich colors at top-center.

## Environment Variables

**Frontend (.env or .env.local):**
- `GEMINI_API_KEY` — Google Gemini API key (used in edge function, also available to vite define for local dev)
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous/public key

**Edge functions (Supabase secrets):**
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — payment processing
- `SUPABASE_SERVICE_ROLE_KEY` — admin access for edge functions

## Styling

Dark mode only. Custom CSS variables in `index.css`:
- `--bg: #09090b`, `--surface: #111113`, `--accent: #6c72cb`, `--text: #ececef`
- Font: Plus Jakarta Sans (400/500/600/700)
- Glassmorphism effects (backdrop-blur, rgba backgrounds)
- Custom animations: `fade-in`, `scale-up`, `shimmer`, `bounce-short`

## Supabase Schema

**Tables:** `user_credits` (credits + unlimited status), `creations` (generated posters metadata), `discovered_personas` (dynamic persona definitions with visibility/ordering), `generation_feedback` (like/dislike).

**Storage:** `creations` bucket — PNGs stored as `{user_id}/{timestamp}.png`.

**Edge functions:** `generate-poster` (main pipeline), `payment-handler` (Razorpay order creation + verification with HMAC), `admin-data` (analytics), `analyze-persona`, `generate-asset`.

## Conventions

- Semantic git commits: `feat:`, `fix:`, `style:`, `chore:`
- Event handlers prefixed with `handle` (e.g., `handleGenerate`)
- Modal visibility state uses `show`/`setShow` prefix
- Path alias: `@/` maps to project root
- `Agentation` feedback component only renders in development mode
