/**
 * coachSeatMap.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Data model and mock data for the Twendex 2+2 coach seat-selection modal.
 *
 * Layout conventions
 * ──────────────────
 *  • Seats are numbered left-to-right, front-to-back:
 *      Row 1 → 1, 2, 3, 4  (left-a, left-b | aisle | right-a, right-b)
 *      Row 2 → 5, 6, 7, 8
 *      …
 *  • The optional rear bench spans the full width with no aisle gap.
 *  • `doorRow` marks which row the boarding door is adjacent to (rendered
 *    as a dashed "DOOR" cutout on the left of that row in the modal).
 *
 * Extending
 * ─────────
 *  Register a new builder in COACH_MAP_CONFIG and the modal renders it
 *  without any layout-logic changes.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type SeatColumn = 'left-a' | 'left-b' | 'right-a' | 'right-b' | 'rear-bench';
export type SeatClass  = 'vip' | 'bclass' | 'normal';
export type SeatStatus = 'available' | 'selected' | 'sold';

export interface CoachSeat {
  /** Sequential seat number, 1-based, left-to-right then front-to-back. */
  number: number;
  column: SeatColumn;
  row: number;
  /** Seat class drives the default colour in the legend + icon. */
  class: SeatClass;
  status: SeatStatus;
}

export type CoachVehicleType = 'coaster-29' | 'coach-36' | (string & {});

export interface CoachSeatMap {
  vehicleType: CoachVehicleType;
  label: string;
  totalSeats: number;
  /** Row index (1-based) that the boarding door sits beside. */
  doorRow: number;
  /** When true, the last row renders as a full-width bench (no aisle gap). */
  hasRearBench: boolean;
  seats: CoachSeat[];
}

// ─── Boarding / dropping points ──────────────────────────────────────────────

export interface StopPoint {
  id: string;
  label: string;
}

export const BOARDING_POINTS: StopPoint[] = [
  { id: 'entebbe-stage',   label: 'Entebbe Main Stage'   },
  { id: 'kitoro',          label: 'Kitoro Taxi Park'      },
  { id: 'entebbe-road',    label: 'Entebbe Road Stage'    },
  { id: 'abayita',         label: 'Abayita Ababiri'       },
  { id: 'airport',         label: 'Entebbe Airport'       },
];

export const DROPPING_POINTS: StopPoint[] = [
  { id: 'namboole',        label: 'Namboole'              },
  { id: 'city-centre',     label: 'Kampala City Centre'   },
  { id: 'ntinda',          label: 'Ntinda'                },
  { id: 'nakawa',          label: 'Nakawa'                },
  { id: 'old-taxi-park',   label: 'Old Taxi Park'         },
];

// ─── Pricing per class ───────────────────────────────────────────────────────

export const CLASS_PRICE: Record<SeatClass, number> = {
  vip:    32_000,
  bclass: 22_000,
  normal: 15_000,
};

// ─── Colour tokens (used by modal — defined once here, not in CSS) ────────────

export const CLASS_COLORS: Record<SeatClass | 'selected' | 'sold', {
  bg: string; border: string; text: string; headrest: string; label: string;
}> = {
  vip:      { bg: '#FFF3EC', border: '#E8622C', text: '#C04A18', headrest: '#F6A882', label: 'VIP'    },
  bclass:   { bg: '#F0FDF4', border: '#22C55E', text: '#15803D', headrest: '#86EFAC', label: 'BClass' },
  normal:   { bg: '#EFF6FF', border: '#3B82F6', text: '#1D4ED8', headrest: '#93C5FD', label: 'Normal' },
  selected: { bg: '#FFF1F2', border: '#F43F5E', text: '#BE123C', headrest: '#FDA4AF', label: 'Selected' },
  sold:     { bg: '#F3F4F6', border: '#9CA3AF', text: '#6B7280', headrest: '#D1D5DB', label: 'Sold'   },
};

// ─── Builder helpers ─────────────────────────────────────────────────────────

/** Seats sold in the mock 29-seat Coaster. */
const COASTER_SOLD = new Set([3, 8, 11, 17, 22, 25]);

/**
 * Row-class assignments for the 29-seat Coaster:
 *   Rows 1–2  → VIP   (front, extra legroom)
 *   Rows 3–4  → BClass
 *   Rows 5–6  → Normal
 *   Rear bench (row 7) → Normal
 */
function coasterClass(row: number): SeatClass {
  if (row <= 2) return 'vip';
  if (row <= 4) return 'bclass';
  return 'normal';
}

// ─── 29-seat Coaster ─────────────────────────────────────────────────────────

function buildCoaster29(): CoachSeatMap {
  const seats: CoachSeat[] = [];
  let n = 1;

  // Rows 1–6: 2+2 per row  (4 seats × 6 rows = 24)
  for (let row = 1; row <= 6; row++) {
    const cls = coasterClass(row);
    const cols: SeatColumn[] = ['left-a', 'left-b', 'right-a', 'right-b'];
    for (const column of cols) {
      seats.push({
        number: n,
        column,
        row,
        class: cls,
        status: COASTER_SOLD.has(n) ? 'sold' : 'available',
      });
      n++;
    }
  }

  // Row 7: rear bench — 5 seats spanning full width  (no aisle)
  for (let i = 0; i < 5; i++) {
    seats.push({
      number: n++,
      column: 'rear-bench',
      row: 7,
      class: 'normal',
      status: COASTER_SOLD.has(n - 1) ? 'sold' : 'available',
    });
  }

  return {
    vehicleType:  'coaster-29',
    label:        'Toyota Coaster · 29 seats',
    totalSeats:   29,
    doorRow:      1,   // door is beside row 1
    hasRearBench: true,
    seats,
  };
}

// ─── 36-seat Coach ────────────────────────────────────────────────────────────

const COACH_SOLD = new Set([2, 7, 13, 20, 28, 31]);

function coachClass(row: number): SeatClass {
  if (row <= 2) return 'vip';
  if (row <= 5) return 'bclass';
  return 'normal';
}

function buildCoach36(): CoachSeatMap {
  const seats: CoachSeat[] = [];
  let n = 1;

  // 8 rows × 4 seats = 32 seats
  for (let row = 1; row <= 8; row++) {
    const cls = coachClass(row);
    const cols: SeatColumn[] = ['left-a', 'left-b', 'right-a', 'right-b'];
    for (const column of cols) {
      seats.push({
        number: n,
        column,
        row,
        class: cls,
        status: COACH_SOLD.has(n) ? 'sold' : 'available',
      });
      n++;
    }
  }

  // Rear bench — 4 seats
  for (let i = 0; i < 4; i++) {
    seats.push({
      number: n++,
      column: 'rear-bench',
      row: 9,
      class: 'normal',
      status: 'available',
    });
  }

  return {
    vehicleType:  'coach-36',
    label:        'Isuzu Coach · 36 seats',
    totalSeats:   36,
    doorRow:      1,
    hasRearBench: true,
    seats,
  };
}

// ─── Registry ─────────────────────────────────────────────────────────────────

type MapBuilder = () => CoachSeatMap;

export const COACH_MAP_CONFIG: Record<string, MapBuilder> = {
  'coaster-29': buildCoaster29,
  'coach-36':   buildCoach36,
};

/** Returns a fresh, mutable seat map (selection state never leaks between mounts). */
export function getCoachSeatMap(vehicleType: CoachVehicleType): CoachSeatMap {
  const builder = COACH_MAP_CONFIG[vehicleType];
  if (!builder) throw new Error(`Unknown coach vehicleType: "${vehicleType}"`);
  return builder();
}

/** Group a flat seat list into rows, preserving seat order. */
export function groupByRow(seats: CoachSeat[]): Map<number, CoachSeat[]> {
  const map = new Map<number, CoachSeat[]>();
  for (const s of seats) {
    const row = map.get(s.row) ?? [];
    row.push(s);
    map.set(s.row, row);
  }
  return map;
}
