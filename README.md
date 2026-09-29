# Twendex Passenger

A mobile-first Progressive Web App for booking public-transport trips along the **Entebbe ↔ Kampala** corridor. Passengers search departures, compare vehicle types, pick an exact seat on a real cabin map, pay with mobile money, and board with a QR ticket that works offline.

Twendex is currently **frontend-only**. All trips, seats, drivers, and bookings are typed sample data living in the app, structured so they can be swapped for real PHP/MySQL (or any HTTP) endpoints without reworking the UI.

---

## Table of contents

- [Highlights](#highlights)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Routing](#routing)
- [Design system](#design-system)
- [Seat selection](#seat-selection)
- [Vehicle icons](#vehicle-icons)
- [Offline & PWA](#offline--pwa)
- [Backend integration guide](#backend-integration-guide)
- [Known gaps](#known-gaps)

---

## Highlights

- **Full booking journey** — Search → Vehicle list → Vehicle detail → Seat selection → Checkout → Payment → Ticket, plus My Trips and a Safety Centre.
- **Real seat maps** — Distinct, accurate cabin layouts per vehicle type (e.g. a 14-seat Toyota Hiace vs. a 29-seat Coaster bus), driven by a shared, extensible config.
- **Warm glassmorphic UI** — A cohesive design system built on Tailwind CSS v4 with warm colours (amber, terracotta, gold, cocoa) and frosted-glass surfaces.
- **Offline-first ticketing** — Boarding passes are cached in IndexedDB so the QR still scans with no signal at the stage.
- **Mobile-first & responsive** — Works down to 320px with generous touch targets.
- **Installable PWA** — Web manifest for standalone install (see [Offline & PWA](#offline--pwa) for the current registration caveat).

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) + a small amount of hand-written CSS |
| UI primitives | Local shadcn-style components (`Button`, `Card`, `Badge`, `Input`) built with `class-variance-authority`, `clsx`, `tailwind-merge` |
| Icons | `lucide-react` |
| QR codes | `qrcode.react` |
| Offline storage | IndexedDB (thin wrapper in `src/storage.ts`) |
| Routing | Hand-rolled history-based router (`useRoute` in `src/main.tsx`) |

> **Note:** `package.json` also lists `@tanstack/react-query`, `@tanstack/react-router`, `react-hook-form`, `zod`, and `@radix-ui/react-dialog`. These are provisioned for the planned data/forms layer but are **not yet wired into the app**. See [Known gaps](#known-gaps).

---

## Getting started

**Prerequisites:** Node.js 18+ (Node 20+ recommended) and npm.

```bash
# install dependencies
npm install

# start the dev server (default: http://localhost:5173)
npm run dev
```

Open the printed URL. The dev server uses hot module replacement, so edits appear instantly. The dev server does **not** run the service worker, which avoids stale-cache surprises during development.

To preview a production build locally:

```bash
npm run build
npm run preview
```

---

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server with HMR. |
| `npm run build` | Type-check (`tsc -b`) then produce an optimised production bundle in `dist/`. |
| `npm run preview` | Serve the built `dist/` bundle locally for a production-like check. |

---

## Project structure

```
Twendex/
├─ index.html                    # App shell; links manifest, mounts #root
├─ public/
│  ├─ manifest.webmanifest       # PWA manifest (name, icons, theme)
│  ├─ sw.js                      # Service worker (network-first HTML, SWR assets)
│  └─ vehicles/                  # Standalone flat vehicle icon SVGs
│     ├─ hiace.svg
│     ├─ minivan.svg
│     └─ noah.svg
├─ src/
│  ├─ main.tsx                   # App entry: router, all pages, sample data
│  ├─ styles.css                 # Tailwind import + warm-glass theme tokens & utilities
│  ├─ storage.ts                 # IndexedDB ticket cache (offline boundary)
│  ├─ components/
│  │  └─ ui/                     # shadcn-style primitives
│  │     ├─ button.tsx
│  │     ├─ card.tsx
│  │     ├─ badge.tsx
│  │     └─ input.tsx            # Input + Select
│  ├─ features/
│  │  ├─ bookings/
│  │  │  └─ mock-api.ts          # Sample booking data / API stand-in
│  │  └─ seats/
│  │     ├─ seatMaps.ts          # Seat-map config + types + mock taken seats
│  │     └─ SeatSelection.tsx    # Reusable seat-picker component
│  └─ lib/
│     └─ utils.ts                # `cn()` class-merge helper
├─ vite.config.ts                # React + Tailwind plugins, `@` alias
└─ tsconfig.json                 # Strict TS, `@/*` → `src/*`
```

The `@` path alias maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`), so imports read `@/components/ui/button` rather than long relative paths.

---

## Routing

Routing is a lightweight history-based switch in `src/main.tsx` (no router library). Each path renders a page component:

| Path | Screen |
| --- | --- |
| `/` | Search / home (hero, how-it-works, vehicle types, routes, stats, safety, reviews) |
| `/trips` | Vehicle/departure results |
| `/trips/:vehicleId` | Vehicle detail |
| `/book/:vehicleId/seats` | Seat hold & selection (legacy inline screen) |
| `/checkout` | Passenger details + mobile-money payment |
| `/payment/:bookingId` | Payment status |
| `/tickets/:bookingId` | QR boarding pass (cached offline) |
| `/my-trips` | Booking list |
| `/safety/:bookingId` | Safety Centre (share trip, report, SOS) |
| `/seatdemo` | Standalone demo of the reusable `SeatSelection` component |

The shared header/footer are hidden on focused flow screens (seats, checkout, payment, safety) to reduce distraction.

---

## Design system

The look is a **warm glassmorphic** theme defined in `src/styles.css` using Tailwind v4's `@theme` block.

- **Palette tokens** — `brand` (amber/orange ramp), `clay`, `rose`, `gold`, `cocoa`, plus `cream`, `sand`, `ink`, `muted`, `line`.
- **Fonts** — `Newsreader` for display headings, `DM Sans` for body.
- **Glass utilities** — `.glass`, `.glass-strong`, `.glass-warm`, `.glass-dark` (frosted surfaces with blur + subtle borders), `.text-gradient` for headings, and a `.btn-shine` hover sweep.
- **Ambient background** — Layered warm radial gradients with softly animated blurred "blobs".

### UI primitives (`src/components/ui`)

shadcn-style, variant-driven components using `class-variance-authority`:

- `Button` — variants: `default` (gradient), `glass`, `outline`, `ghost`, `light`, `destructive`; sizes `sm` / `default` / `lg` / `icon`.
- `Card` — variants: `glass`, `strong`, `warm`, `dark`, `solid`, with an optional `hover="lift"`.
- `Badge` — variants: `glass`, `warm`, `solid`, `eyebrow`.
- `Input` and `Select` — glassy form fields.

All accept a `className` and merge cleanly via the `cn()` helper.

---

## Seat selection

The reusable seat picker lives in `src/features/seats/` and is designed so **new vehicles are added by extending config, not by writing layout logic**.

### `seatMaps.ts` — the config

Defines the data model and a central registry:

```ts
type SeatPosition = 'window-left' | 'aisle-left' | 'aisle-right' | 'window-right' | 'bench';
type SeatStatus   = 'available' | 'selected' | 'taken';
type VehicleType  = 'hiace-14' | 'coaster-29';

interface Seat { id: string; row: number; position: SeatPosition; status: SeatStatus }
interface VehicleSeatMap {
  vehicleType: VehicleType;
  label: string;
  driverSeat: boolean;
  hasAisle: boolean;
  entryDoor: boolean;
  rows: Seat[][];   // seats grouped by row, left → right
}
```

Included layouts:

- **`hiace-14`** — 1 driver (non-selectable) + 1 front passenger seat + 4 continuous bench rows of 3 = **13 passenger seats** (14 incl. driver). No centre aisle (matatu-style).
- **`coaster-29`** — 1 driver + front-right entry door; rows 1–6 are 2 + aisle + 2 (24 seats) and a full-width rear bench of 5 = **29 passenger seats**. Renders a visible aisle gap.

Add a vehicle by writing a builder and registering it in `SEAT_MAP_CONFIG` — the component renders it with no further code. Mock `taken` seats are baked into each layout to demonstrate the disabled state.

Helpers: `getSeatMap(type)` (returns a fresh, mutable map), `countPassengerSeats(type)`.

### `SeatSelection.tsx` — the component

```tsx
import { SeatSelection } from '@/features/seats/SeatSelection';

<SeatSelection
  vehicleType="coaster-29"
  pricePerSeat={15000}
  seatsToBook={2}
  initialSelected={[]}
  onSelectionChange={(ids) => console.log(ids)}
  onContinue={(ids) => go(`/checkout?seats=${ids.join(',')}`)}
/>
```

| Prop | Type | Notes |
| --- | --- | --- |
| `vehicleType` | `VehicleType` | Which map to render. Required. |
| `pricePerSeat` | `number` | UGX per seat. Total = `pricePerSeat × selected`. Required. |
| `seatsToBook` | `number` | Max selectable (default `1`). Booking 1 swaps the pick on tap. |
| `initialSelected` | `string[]` | Pre-selected seat ids (ignores taken seats). |
| `onSelectionChange` | `(ids: string[]) => void` | Fires on every change. |
| `onContinue` | `(ids: string[]) => void` | Fires on the footer CTA. |
| `formatPrice` | `(n: number) => string` | Optional; defaults to `UGX {n}`. |

Behaviour: tap to toggle; `taken` seats are disabled; a sticky footer shows the live count and total with a "Continue with {n} seats" CTA. Seat states — available (outlined), selected (filled `#E8622C`), taken (greyed/reduced opacity). Touch targets are ≥ 40×40px and scale up on wider screens.

Try it live at **`/seatdemo`** (toggle between Hiace and Coaster).

---

## Vehicle icons

Flat, Bolt/Uber-style geometric vehicle icons ship two ways:

- **Standalone SVGs** in `public/vehicles/` (`hiace.svg`, `minivan.svg`, `noah.svg`) — 260×128 artboards, side profile facing right, transparent background.
- **Inline renderer** (`VehicleSVG` in `src/main.tsx`) that draws the same three silhouettes for use inside cards.

They share a Twendex orange accent (window tint + belt stripe) so the set reads as one family, while roofline, nose length, and body length keep each silhouette distinct at small sizes. Body colours rotate through soft blue-grey, muted orange, and white.

---

## Offline & PWA

- **Manifest** — `public/manifest.webmanifest` enables standalone install (name, theme colours, start URL).
- **Ticket cache** — `src/storage.ts` stores boarding passes in IndexedDB (`twendex-offline` DB, `tickets` store) via `cacheTicket()` / `getTicket()`. The ticket screen writes to this cache so the QR remains available offline.
- **Service worker** — `public/sw.js` implements a cache named `twendex-v2`: network-first for navigations/HTML (so new builds appear) with an offline fallback, and stale-while-revalidate for static assets. It cleans up old caches on activate and calls `skipWaiting()` / `clients.claim()`.

> **Important:** the service worker is **not currently registered** by the app (no `navigator.serviceWorker.register('/sw.js')` call exists). To enable full offline app-shell caching, register it — e.g. add to `src/main.tsx`:
>
> ```ts
> if ('serviceWorker' in navigator) {
>   window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
> }
> ```
>
> After enabling, remember that the SW caches aggressively; during development prefer the dev server (which bypasses it) or unregister via DevTools → Application → Service Workers.

---

## Backend integration guide

Sample data currently lives in `src/main.tsx` (trips, vehicles, seats, drivers) and `src/features/bookings/mock-api.ts`. The `src/storage.ts` ticket repository marks the offline boundary. A backend should provide:

- **Search & detail** — list departures for a corridor/date; fetch a single vehicle/trip.
- **Seat lifecycle** — hold / create / refresh / release, returning `409 Conflict` when a seat is already held or taken.
- **Booking** — create a booking from held seats.
- **Payment** — initiate a mobile-money charge (MTN MoMo / Airtel Money) and expose a status endpoint the payment screen can poll.
- **Ticket** — return a ticket that includes a **server-generated `ticketSignature`** QR payload. The frontend never signs tickets; it only caches what the server returns.
- **Booking list** — the passenger's trips.
- **Support actions** — share trip, report an incident, SOS.

Because the UI reads from typed data shapes, wiring these endpoints (ideally behind the already-installed React Query) is mostly a data-layer swap rather than a UI rewrite.

---

## Known gaps

These are intentional TODOs, documented so contributors know what's real vs. planned:

- **Service worker not registered** — `sw.js` exists but is never registered (see [Offline & PWA](#offline--pwa)).
- **Unused dependencies** — `@tanstack/react-query`, `@tanstack/react-router`, `react-hook-form`, `zod`, and `@radix-ui/react-dialog` are installed but not yet used; routing and forms are currently hand-rolled.
- **Two seat screens** — the booking flow still uses a legacy inline seat screen for the app's original vehicle types; the newer reusable `SeatSelection` component (Hiace/Coaster) is showcased at `/seatdemo` and not yet wired into checkout.
- **Placeholder content** — homepage stats, reviews, and some route figures are illustrative sample data.
- **Manifest icons** — the manifest declares no icon assets yet; add them before shipping an installable build.

---

_Twendex — travel within reach._
