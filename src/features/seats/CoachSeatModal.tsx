/**
 * CoachSeatModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Twendex 2+2 coach seat-selection modal.
 *
 * Visual reference: tavler.africa / BUSCAR booking modal, rebuilt with
 * symmetrical 2+2 (instead of 2+1), Twendex warm-colour design system,
 * and a proper SVG bucket-seat icon per seat.
 *
 * Structure
 * ─────────
 *   ┌─ Modal overlay ──────────────────────────────────────────────────────┐
 *   │  Header:  "Twendex" wordmark  ·  subtitle  ·  ✕ close button        │
 *   │  ┌─ Left: scrollable bus cabin ──────────────────────────────────┐  │
 *   │  │  dashed outline · DOOR cutout · steering wheel icon           │  │
 *   │  │  2+2 seat rows (VIP / BClass / Normal)                        │  │
 *   │  │  rear bench (no aisle)                                        │  │
 *   │  │  Legend row                                                   │  │
 *   │  └───────────────────────────────────────────────────────────────┘  │
 *   │  ┌─ Right (sticky): booking panel ───────────────────────────────┐  │
 *   │  │  Boarding point select                                        │  │
 *   │  │  Dropping point select                                        │  │
 *   │  │  Selected seats chips + running total                         │  │
 *   │  │  Cancel  ·  Proceed & Book                                    │  │
 *   │  └───────────────────────────────────────────────────────────────┘  │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 * On mobile the booking panel collapses into a sticky bottom drawer.
 */

import { useCallback, useMemo, useState } from 'react';
import { X, Bus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CLASS_COLORS,
  CLASS_PRICE,
  BOARDING_POINTS,
  DROPPING_POINTS,
  getCoachSeatMap,
  groupByRow,
  type CoachSeat,
  type CoachSeatMap,
  type CoachVehicleType,
  type SeatClass,
  type SeatStatus,
  type StopPoint,
} from './coachSeatMap';

// ─── Public props ─────────────────────────────────────────────────────────────

export interface CoachSeatModalProps {
  vehicleType: CoachVehicleType;
  /** Override boarding point list (defaults to BOARDING_POINTS). */
  boardingPoints?: StopPoint[];
  /** Override dropping point list (defaults to DROPPING_POINTS). */
  droppingPoints?: StopPoint[];
  /** Override price per class. */
  classPrices?: Partial<Record<SeatClass, number>>;
  /** Called when the user clicks the ✕ or Cancel button. */
  onClose: () => void;
  /** Called with the confirmed selection. */
  onBook: (payload: {
    seats: CoachSeat[];
    boardingPointId: string;
    droppingPointId: string;
    total: number;
  }) => void;
  className?: string;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) => `UGX ${n.toLocaleString()}`;

// ─── SVG bucket-seat icon ─────────────────────────────────────────────────────
//
// Drawn on a 36×40 artboard. The shape mimics an armchair viewed from above:
//   • rounded headrest at the top
//   • slightly wider mid-section (seat cushion)
//   • subtle base curve at the bottom
//
// Accepts a `colors` token so every class / state is expressed consistently.

function SeatIcon({
  seat,
  colors,
  isSelected,
  isSold,
  onToggle,
  disabled,
}: {
  seat: CoachSeat;
  colors: (typeof CLASS_COLORS)[keyof typeof CLASS_COLORS];
  isSelected: boolean;
  isSold: boolean;
  onToggle: (n: number) => void;
  disabled: boolean;
}) {
  const W = 36;
  const H = 40;

  return (
    <button
      type="button"
      aria-label={`Seat ${seat.number}${isSold ? ', sold' : isSelected ? ', selected — tap to deselect' : `, ${seat.class}, tap to select`}`}
      aria-pressed={isSelected}
      disabled={isSold || (disabled && !isSelected)}
      onClick={() => !isSold && onToggle(seat.number)}
      className={cn(
        'group relative flex flex-col items-center gap-0.5 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#E8622C]',
        isSold ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        disabled && !isSelected && !isSold && 'cursor-not-allowed opacity-40',
        !isSold && !disabled && 'hover:-translate-y-0.5 active:scale-95',
      )}
      style={{ minWidth: W, minHeight: H + 16 }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* headrest */}
        <rect
          x="6" y="1" width="24" height="10" rx="5"
          fill={colors.headrest}
        />
        {/* backrest */}
        <rect
          x="3" y="8" width="30" height="16" rx="5"
          fill={colors.border}
        />
        {/* seat cushion */}
        <rect
          x="2" y="22" width="32" height="13" rx="5"
          fill={colors.bg}
          stroke={colors.border}
          strokeWidth="1.5"
        />
        {/* base */}
        <rect
          x="8" y="33" width="20" height="5" rx="2.5"
          fill={colors.headrest}
        />
        {/* seat number — centred on cushion */}
        <text
          x="18" y="31"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fontWeight="700"
          fontFamily="DM Sans, sans-serif"
          fill={colors.text}
        >
          {seat.number}
        </text>
      </svg>
      {/* class label under the icon */}
      <span
        className="text-[9px] font-bold uppercase tracking-wide leading-none"
        style={{ color: colors.text }}
      >
        {seat.class === 'vip' ? 'VIP' : seat.class === 'bclass' ? 'B' : ''}
      </span>
    </button>
  );
}

// ─── Single seat row ──────────────────────────────────────────────────────────

function SeatRow({
  seats,
  rowIndex,
  isRearBench,
  isDoorRow,
  selected,
  onToggle,
  maxReached,
}: {
  seats: CoachSeat[];
  rowIndex: number;
  isRearBench: boolean;
  isDoorRow: boolean;
  selected: Set<number>;
  onToggle: (n: number) => void;
  maxReached: boolean;
}) {
  const renderSeat = (s: CoachSeat) => {
    const isSelected = selected.has(s.number);
    const isSold = s.status === 'sold';
    const colorKey: keyof typeof CLASS_COLORS = isSold
      ? 'sold'
      : isSelected
      ? 'selected'
      : s.class;
    return (
      <SeatIcon
        key={s.number}
        seat={s}
        colors={CLASS_COLORS[colorKey]}
        isSelected={isSelected}
        isSold={isSold}
        onToggle={onToggle}
        disabled={maxReached && !isSelected}
      />
    );
  };

  if (isRearBench) {
    return (
      <div className="flex items-start justify-center gap-2 px-1">
        {seats.map(renderSeat)}
      </div>
    );
  }

  // 2+2 layout: left pair | aisle | right pair
  const leftSeats  = seats.filter(s => s.column === 'left-a'  || s.column === 'left-b');
  const rightSeats = seats.filter(s => s.column === 'right-a' || s.column === 'right-b');

  return (
    <div className="relative flex items-start">
      {/* DOOR cutout — dashed vertical label beside doorRow */}
      <div
        className={cn(
          'absolute -left-9 top-0 bottom-0 flex items-center justify-center',
          isDoorRow ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        aria-hidden
      >
        <div className="flex h-full w-6 items-center justify-center rounded border-2 border-dashed border-[#c99274]">
          <span
            className="text-[8px] font-bold uppercase tracking-[0.18em] text-[#c99274]"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            DOOR
          </span>
        </div>
      </div>

      {/* row number */}
      <span className="mt-2 w-6 shrink-0 text-right text-[10px] font-semibold text-[#c99274]">
        {rowIndex + 1}
      </span>

      {/* left pair */}
      <div className="flex gap-1.5 pl-2">
        {leftSeats.map(renderSeat)}
      </div>

      {/* aisle */}
      <div className="mx-2 flex w-5 shrink-0 flex-col items-center justify-center self-stretch">
        <div className="h-full w-px border-l border-dashed border-[#e8d5c4]" />
      </div>

      {/* right pair */}
      <div className="flex gap-1.5">
        {rightSeats.map(renderSeat)}
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

const LEGEND_KEYS: Array<SeatClass | 'selected' | 'sold'> = [
  'vip', 'bclass', 'normal', 'selected', 'sold',
];

function Legend() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-3 pt-4 pb-1">
      {LEGEND_KEYS.map((key) => {
        const c = CLASS_COLORS[key];
        // Mini seat silhouette for the legend
        return (
          <div key={key} className="flex flex-col items-center gap-1">
            <svg width="22" height="26" viewBox="0 0 36 40" fill="none" aria-hidden>
              <rect x="6"  y="1"  width="24" height="10" rx="5" fill={c.headrest} />
              <rect x="3"  y="8"  width="30" height="16" rx="5" fill={c.border} />
              <rect x="2"  y="22" width="32" height="13" rx="5" fill={c.bg} stroke={c.border} strokeWidth="1.5" />
              <rect x="8"  y="33" width="20" height="5"  rx="2.5" fill={c.headrest} />
            </svg>
            <span className="text-[10px] font-semibold text-[#6b5546]">{c.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Booking side panel ───────────────────────────────────────────────────────

function BookingPanel({
  map,
  selected,
  prices,
  boarding,
  dropping,
  boardingPoints,
  droppingPoints,
  setBoarding,
  setDropping,
  onCancel,
  onBook,
  mobile,
}: {
  map: CoachSeatMap;
  selected: Set<number>;
  prices: Record<SeatClass, number>;
  boarding: string;
  dropping: string;
  boardingPoints: StopPoint[];
  droppingPoints: StopPoint[];
  setBoarding: (v: string) => void;
  setDropping: (v: string) => void;
  onCancel: () => void;
  onBook: () => void;
  mobile?: boolean;
}) {
  const selectedSeats = map.seats.filter(s => selected.has(s.number));
  const total = selectedSeats.reduce((sum, s) => sum + prices[s.class], 0);
  const canBook = selected.size > 0 && boarding !== '' && dropping !== '';

  const selectCls =
    'w-full rounded-xl border border-[#f0c3ab] bg-white px-3 py-2.5 text-sm text-[#3a2416] ' +
    'focus:outline-none focus:border-[#E8622C] focus:ring-2 focus:ring-[#E8622C]/20 ' +
    'appearance-none cursor-pointer';

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        mobile
          ? 'px-4 py-3'
          : 'sticky top-0 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-2xl border border-[#f4d9c6] bg-white p-5 shadow-[0_10px_30px_rgba(150,70,25,0.10)]',
      )}
    >
      {!mobile && (
        <h3 className="font-serif text-lg font-semibold text-[#3a2416]">Your booking</h3>
      )}

      {/* Boarding point */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wide text-[#8a6f5c]">
          Boarding Point
        </label>
        <div className="relative">
          <select
            value={boarding}
            onChange={e => setBoarding(e.target.value)}
            className={selectCls}
          >
            <option value="">Select boarding point</option>
            {boardingPoints.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#c99274]">▾</span>
        </div>
      </div>

      {/* Dropping point */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wide text-[#8a6f5c]">
          Dropping Point
        </label>
        <div className="relative">
          <select
            value={dropping}
            onChange={e => setDropping(e.target.value)}
            className={selectCls}
          >
            <option value="">Select dropping point</option>
            {droppingPoints.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#c99274]">▾</span>
        </div>
      </div>

      {/* Selected seat chips */}
      {selectedSeats.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#8a6f5c]">
            Selected seats
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedSeats.map(s => {
              const c = CLASS_COLORS[s.class];
              return (
                <span
                  key={s.number}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold"
                  style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                >
                  {s.number}
                  <span className="opacity-60">· {s.class.toUpperCase()}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Total */}
      <div className="flex items-baseline justify-between border-t border-[#fce8d8] pt-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#8a6f5c]">
          Total{selected.size > 0 && ` · ${selected.size} seat${selected.size > 1 ? 's' : ''}`}
        </span>
        <span className="font-serif text-xl font-semibold text-[#3a2416]">
          {total > 0 ? fmt(total) : '—'}
        </span>
      </div>

      {/* Actions */}
      <div className={cn('flex gap-2', mobile ? 'flex-row' : 'flex-col')}>
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'rounded-xl border border-[#cbd5e1] bg-[#f1f5f9] px-4 py-2.5 text-sm font-bold text-[#475569]',
            'transition hover:bg-[#e2e8f0] active:scale-[.98]',
            mobile ? 'flex-1' : 'w-full',
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canBook}
          onClick={onBook}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white',
            'transition-all duration-150 active:scale-[.98]',
            'disabled:cursor-not-allowed disabled:opacity-40',
            mobile ? 'flex-[2]' : 'w-full',
          )}
          style={{ backgroundColor: canBook ? '#E8622C' : undefined }}
        >
          Proceed &amp; Book
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function CoachSeatModal({
  vehicleType,
  boardingPoints = BOARDING_POINTS,
  droppingPoints = DROPPING_POINTS,
  classPrices,
  onClose,
  onBook,
  className,
}: CoachSeatModalProps) {
  const map = useMemo(() => getCoachSeatMap(vehicleType), [vehicleType]);
  const rows = useMemo(() => groupByRow(map.seats), [map]);
  const prices: Record<SeatClass, number> = {
    ...CLASS_PRICE,
    ...classPrices,
  };

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [boarding, setBoarding] = useState('');
  const [dropping, setDropping] = useState('');

  const toggle = useCallback((n: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);

  const handleBook = useCallback(() => {
    const seats = map.seats.filter(s => selected.has(s.number));
    const total = seats.reduce((sum, s) => sum + prices[s.class], 0);
    onBook({ seats, boardingPointId: boarding, droppingPointId: dropping, total });
  }, [map, selected, boarding, dropping, prices, onBook]);

  const rowEntries = Array.from(rows.entries()).sort(([a], [b]) => a - b);
  const maxRows = Math.max(...rowEntries.map(([r]) => r));

  const panelProps = {
    map, selected, prices,
    boarding, dropping,
    boardingPoints, droppingPoints,
    setBoarding, setDropping,
    onCancel: onClose,
    onBook: handleBook,
  };

  return (
    /* ── Overlay ── */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select your seat"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={cn(
          'relative flex w-full flex-col overflow-hidden bg-[#FDF3EA]',
          'sm:max-w-3xl sm:rounded-2xl sm:shadow-[0_24px_60px_rgba(60,20,10,0.22)]',
          // mobile: full-height sheet
          'h-[96dvh] sm:h-auto sm:max-h-[92dvh]',
          className,
        )}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Modal header ── */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#f4d9c6] bg-white px-5 py-3.5">
          <div>
            <div className="flex items-center gap-2">
              {/* wordmark */}
              <span className="flex items-center gap-1.5 font-serif text-xl font-semibold tracking-tight text-[#3a2416]">
                <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[#f97316] to-[#E8622C] text-white text-base font-serif">
                  t
                </span>
                Twendex
              </span>
              <span className="rounded-full bg-[#fbe7d8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E8622C]">
                {map.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#8a6f5c]">
              Tap available seats · select boarding &amp; dropping points to continue
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close seat selection"
            className="grid size-9 place-items-center rounded-xl border border-[#f0c3ab] bg-white text-[#8a6f5c] transition hover:bg-[#fbe7d8] hover:text-[#E8622C] active:scale-95"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* ── Body: seat map + booking panel ── */}
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">

          {/* ── Left: scrollable seat map ── */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-6">

            {/* Bus dashed outline */}
            <div className="relative mx-auto w-fit rounded-[28px] border-2 border-dashed border-[#e8c9b0] bg-white px-5 pb-5 pt-4 shadow-[0_6px_24px_rgba(150,70,25,0.07)]">

              {/* ── Bus front bar: driver + front label ── */}
              <div className="mb-4 flex items-center justify-between rounded-xl bg-[#fdf0e6] px-3 py-2">
                {/* driver */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#a35a37]">
                  <span className="grid size-7 place-items-center rounded-lg bg-white shadow-sm">
                    <Bus className="size-3.5 text-[#E8622C]" />
                  </span>
                  Driver
                </div>
                {/* steering wheel SVG centred */}
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden className="opacity-70">
                  <circle cx="14" cy="14" r="12" stroke="#c99274" strokeWidth="2.2" fill="none"/>
                  <circle cx="14" cy="14" r="4.5" stroke="#c99274" strokeWidth="2" fill="white"/>
                  <line x1="14" y1="2" x2="14" y2="9.5"  stroke="#c99274" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="2"  y1="17" x2="9"  y2="13.5" stroke="#c99274" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="26" y1="17" x2="19" y2="13.5" stroke="#c99274" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#c99274]">Front</span>
              </div>

              {/* ── Seat rows ── */}
              <div className="flex flex-col gap-2.5 pl-10">
                {rowEntries.map(([rowNum, rowSeats], idx) => {
                  const isRear = map.hasRearBench && rowNum === maxRows;
                  return (
                    <SeatRow
                      key={rowNum}
                      seats={rowSeats}
                      rowIndex={idx}
                      isRearBench={isRear}
                      isDoorRow={rowNum === map.doorRow}
                      selected={selected}
                      onToggle={toggle}
                      maxReached={false /* no max cap — user selects freely */}
                    />
                  );
                })}
              </div>

              {/* Rear label */}
              <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#c99274]">
                ↑ Rear
              </p>
            </div>

            {/* ── Legend ── */}
            <div className="mt-4 rounded-2xl border border-[#f4d9c6] bg-white px-4 py-3 shadow-sm">
              <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-[#8a6f5c]">
                Seat legend
              </p>
              <Legend />
              {/* per-class prices */}
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-[#8a6f5c]">
                {(['vip', 'bclass', 'normal'] as SeatClass[]).map(cls => (
                  <span key={cls}>
                    <span className="font-bold" style={{ color: CLASS_COLORS[cls].text }}>
                      {CLASS_COLORS[cls].label}
                    </span>
                    {' — '}
                    {fmt(prices[cls])}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: booking panel (desktop only) ── */}
          <aside className="hidden sm:flex sm:w-64 sm:shrink-0 sm:flex-col sm:overflow-y-auto sm:border-l sm:border-[#f4d9c6] sm:bg-white sm:p-4">
            <BookingPanel {...panelProps} />
          </aside>
        </div>

        {/* ── Mobile sticky bottom panel ── */}
        <div className="sm:hidden shrink-0 border-t border-[#f4d9c6] bg-white shadow-[0_-8px_24px_rgba(150,70,25,0.08)]">
          <BookingPanel {...panelProps} mobile />
        </div>
      </div>
    </div>
  );
}

export default CoachSeatModal;
