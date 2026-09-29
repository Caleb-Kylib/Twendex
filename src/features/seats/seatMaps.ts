/**
 * Shared seat-map configuration for Twendex vehicles.
 *
 * Layouts are described declaratively so new vehicle types (minivan, Noah, coach…)
 * can be added by extending `SEAT_MAP_CONFIG` — no new layout/render logic required.
 *
 * The renderer in SeatSelection.tsx consumes `VehicleSeatMap.rows`, where each row is
 * an ordered array of seats. `position` drives spacing (aisle gap) and window styling.
 */

export type SeatPosition =
  | 'window-left'
  | 'aisle-left'
  | 'aisle-right'
  | 'window-right'
  | 'bench';

export type SeatStatus = 'available' | 'selected' | 'taken';

export interface Seat {
  id: string; // e.g. "R1-A"
  row: number;
  position: SeatPosition;
  status: SeatStatus;
}

export type VehicleType = 'hiace-14' | 'coaster-29';

export interface VehicleSeatMap {
  vehicleType: VehicleType;
  label: string;
  driverSeat: boolean;
  hasAisle: boolean;
  /** Front-right entry door indicator (e.g. coaster bus). */
  entryDoor: boolean;
  /** Seats grouped by row, in left→right visual order. */
  rows: Seat[][];
}

/** Column letters used for seat ids, left → right. */
const COL = ['A', 'B', 'C', 'D', 'E'] as const;

/** Build one seat. Keeps ids consistent as "R{row}-{letter}". */
function seat(row: number, colIndex: number, position: SeatPosition, taken: Set<string>): Seat {
  const id = `R${row}-${COL[colIndex]}`;
  return { id, row, position, status: taken.has(id) ? 'taken' : 'available' };
}

/* ------------------------------------------------------------------ */
/* Mock taken seats — demonstrates the disabled state per vehicle.     */
/* ------------------------------------------------------------------ */
const HIACE_TAKEN = new Set(['R1-B', 'R2-A', 'R2-C', 'R4-B']);
const COASTER_TAKEN = new Set(['R2-A', 'R3-D', 'R4-B', 'R6-C', 'R7-C']);

/* ------------------------------------------------------------------ */
/* Toyota Hiace — 14-seater matatu layout                              */
/*   • 1 driver (non-selectable) + 1 front passenger seat              */
/*   • 4 continuous bench rows of 3 seats (no center aisle)            */
/*   • 1 front seat + 4×3 = 13 passenger seats  → 14 total w/ driver   */
/* ------------------------------------------------------------------ */
function buildHiace14(): VehicleSeatMap {
  const rows: Seat[][] = [];

  // Front passenger row: single seat beside the driver (row 1, position A).
  rows.push([seat(1, 0, 'bench', HIACE_TAKEN)]);

  // 4 bench rows of 3 (rows 2–5). Continuous bench: all positions are 'bench'.
  for (let r = 2; r <= 5; r++) {
    rows.push([seat(r, 0, 'bench', HIACE_TAKEN), seat(r, 1, 'bench', HIACE_TAKEN), seat(r, 2, 'bench', HIACE_TAKEN)]);
  }

  return {
    vehicleType: 'hiace-14',
    label: 'Toyota Hiace · 14-seater',
    driverSeat: true,
    hasAisle: false,
    entryDoor: false,
    rows,
  };
}

/* ------------------------------------------------------------------ */
/* Coaster bus — 29-seater                                             */
/*   • 1 driver (non-selectable) + front-right entry door              */
/*   • Rows 1–6: 2 left + aisle + 2 right = 24 seats                   */
/*   • Rear row: 5-seat bench spanning full width = 5 seats            */
/*   • 24 + 5 = 29 passenger seats                                     */
/* ------------------------------------------------------------------ */
function buildCoaster29(): VehicleSeatMap {
  const rows: Seat[][] = [];

  for (let r = 1; r <= 6; r++) {
    rows.push([
      seat(r, 0, 'window-left', COASTER_TAKEN),
      seat(r, 1, 'aisle-left', COASTER_TAKEN),
      seat(r, 2, 'aisle-right', COASTER_TAKEN),
      seat(r, 3, 'window-right', COASTER_TAKEN),
    ]);
  }

  // Rear bench: 5 across (row 7), no aisle gap.
  rows.push([
    seat(7, 0, 'bench', COASTER_TAKEN),
    seat(7, 1, 'bench', COASTER_TAKEN),
    seat(7, 2, 'bench', COASTER_TAKEN),
    seat(7, 3, 'bench', COASTER_TAKEN),
    seat(7, 4, 'bench', COASTER_TAKEN),
  ]);

  return {
    vehicleType: 'coaster-29',
    label: 'Coaster bus · 29-seater',
    driverSeat: true,
    hasAisle: true,
    entryDoor: true,
    rows,
  };
}

/**
 * Central registry. Add future vehicles here (e.g. 'noah-7', 'minivan-11')
 * and the SeatSelection component renders them with zero code changes.
 */
export const SEAT_MAP_CONFIG: Record<VehicleType, () => VehicleSeatMap> = {
  'hiace-14': buildHiace14,
  'coaster-29': buildCoaster29,
};

/** Returns a fresh, mutable seat map (so selection state never leaks between mounts). */
export function getSeatMap(vehicleType: VehicleType): VehicleSeatMap {
  const builder = SEAT_MAP_CONFIG[vehicleType];
  if (!builder) throw new Error(`Unknown vehicleType: ${vehicleType}`);
  return builder();
}

/** Total selectable passenger seats for a given vehicle (excludes driver). */
export function countPassengerSeats(vehicleType: VehicleType): number {
  return getSeatMap(vehicleType).rows.reduce((n, row) => n + row.length, 0);
}
