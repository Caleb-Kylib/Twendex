import {useMemo, useState, useCallback} from 'react';
import {ArrowRight, Bus, Check, DoorOpen, Info, Lock} from 'lucide-react';
import {cn} from '@/lib/utils';
import {getSeatMap, type Seat, type SeatStatus, type VehicleType} from './seatMaps';

/* ------------------------------------------------------------------ */
/* Public props — for integration into Trip → Vehicle → Seat → Payment */
/* ------------------------------------------------------------------ */
export interface SeatSelectionProps {
  /** Which seat map to render. Extend seatMaps.ts to add more types. */
  vehicleType: VehicleType;
  /** Fare per seat, in UGX (whole shillings). Total = pricePerSeat × selected. */
  pricePerSeat: number;
  /** Max seats the user may select (i.e. number of passengers being booked). */
  seatsToBook?: number;
  /** Pre-selected seat ids (e.g. returning to this step). */
  initialSelected?: string[];
  /** Fires whenever the selection changes. */
  onSelectionChange?: (seatIds: string[]) => void;
  /** Fires when the user confirms via the footer CTA. */
  onContinue?: (seatIds: string[]) => void;
  /** Optional currency formatter; defaults to UGX. */
  formatPrice?: (amount: number) => string;
  className?: string;
}

const ACCENT = '#E8622C';
const defaultFormat = (n: number) => `UGX ${n.toLocaleString()}`;

/* ------------------------------------------------------------------ */
/* Seat button                                                         */
/* ------------------------------------------------------------------ */
function SeatButton({
  seat,
  status,
  disabled,
  onToggle,
}: {
  seat: Seat;
  status: SeatStatus;
  disabled: boolean;
  onToggle: (id: string) => void;
}) {
  const isTaken = status === 'taken';
  const isSelected = status === 'selected';
  const label = seat.id.replace('R', '').replace('-', '');

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`Seat ${label}${isTaken ? ', taken' : isSelected ? ', selected' : ', available'}`}
      disabled={isTaken || (disabled && !isSelected)}
      onClick={() => onToggle(seat.id)}
      className={cn(
        // min 40x40 touch target; scales up on wider screens
        'relative grid place-items-center rounded-xl text-[11px] font-bold transition-all duration-150 select-none',
        'size-10 sm:size-12',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        isTaken
          ? 'cursor-not-allowed border border-stone-300 bg-stone-200/70 text-stone-400 opacity-60'
          : isSelected
            ? 'text-white shadow-md scale-[1.03]'
            : 'border-2 border-[#f0c3ab] bg-white text-[#a35a37] hover:border-[#E8622C] hover:-translate-y-0.5 active:scale-95',
        disabled && !isSelected && !isTaken && 'cursor-not-allowed opacity-45 hover:translate-y-0 hover:border-[#f0c3ab]'
      )}
      style={isSelected ? {backgroundColor: ACCENT, borderColor: ACCENT} : undefined}
    >
      {/* seat "headrest" tab for a subtle chair silhouette */}
      <span
        className={cn(
          'absolute -top-1 h-1.5 w-1/2 rounded-full',
          isTaken ? 'bg-stone-300' : isSelected ? 'bg-white/60' : 'bg-[#f0c3ab]'
        )}
      />
      {isTaken ? <Lock className="size-3.5" /> : isSelected ? <Check className="size-4" /> : label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Bus header: driver + optional entry door                            */
/* ------------------------------------------------------------------ */
function CabinHeader({driverSeat, entryDoor}: {driverSeat: boolean; entryDoor: boolean}) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl bg-[#fbe7d8] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-[#a35a37]">
        <span className="grid size-8 place-items-center rounded-lg bg-white text-[#E8622C]">
          <Bus className="size-4" />
        </span>
        Driver
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c99274]">Front</span>
      {entryDoor ? (
        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#a35a37]">
          <DoorOpen className="size-4 text-[#E8622C]" />
          Entry
        </div>
      ) : (
        <span className="w-12" aria-hidden />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row renderer — inserts aisle gap for 2+2 layouts                    */
/* ------------------------------------------------------------------ */
function SeatRow({
  row,
  rowIndex,
  hasAisle,
  statusOf,
  selectionFull,
  onToggle,
}: {
  row: Seat[];
  rowIndex: number;
  hasAisle: boolean;
  statusOf: (s: Seat) => SeatStatus;
  selectionFull: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      <span className="w-6 shrink-0 text-right text-[10px] font-semibold text-[#c99274]">
        {rowIndex + 1}
      </span>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {row.map((s, i) => {
          const prev = row[i - 1];
          // Aisle gap sits between an aisle-left and aisle-right seat.
          const showAisle = hasAisle && prev?.position === 'aisle-left' && s.position === 'aisle-right';
          return (
            <span key={s.id} className="flex items-center gap-1.5 sm:gap-2">
              {showAisle && <span className="w-5 sm:w-7" aria-hidden />}
              <SeatButton
                seat={s}
                status={statusOf(s)}
                disabled={selectionFull}
                onToggle={onToggle}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */
export function SeatSelection({
  vehicleType,
  pricePerSeat,
  seatsToBook = 1,
  initialSelected = [],
  onSelectionChange,
  onContinue,
  formatPrice = defaultFormat,
  className,
}: SeatSelectionProps) {
  // Fresh seat map per vehicle type; recomputed only when the type changes.
  const map = useMemo(() => getSeatMap(vehicleType), [vehicleType]);

  const [selected, setSelected] = useState<string[]>(() =>
    initialSelected.filter((id) =>
      map.rows.some((r) => r.some((s) => s.id === id && s.status !== 'taken'))
    )
  );

  const selectionFull = selected.length >= seatsToBook;

  const toggle = useCallback(
    (id: string) => {
      setSelected((prev) => {
        let next: string[];
        if (prev.includes(id)) {
          next = prev.filter((x) => x !== id);
        } else {
          if (prev.length >= seatsToBook) {
            // If booking a single seat, replace the current pick for a smoother UX.
            next = seatsToBook === 1 ? [id] : prev;
          } else {
            next = [...prev, id];
          }
        }
        onSelectionChange?.(next);
        return next;
      });
    },
    [seatsToBook, onSelectionChange]
  );

  const statusOf = useCallback(
    (s: Seat): SeatStatus => (s.status === 'taken' ? 'taken' : selected.includes(s.id) ? 'selected' : 'available'),
    [selected]
  );

  const total = pricePerSeat * selected.length;
  const canContinue = selected.length > 0;

  return (
    <div className={cn('min-h-screen bg-[#FDF3EA] pb-28', className)}>
      <div className="mx-auto w-full max-w-lg px-4 pt-6">
        {/* Heading */}
        <header className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E8622C]">
            {map.label}
          </p>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#3a2416]">
            Select your seats
          </h1>
          <p className="mt-1 text-sm text-[#8a6f5c]">
            Choose up to {seatsToBook} {seatsToBook === 1 ? 'seat' : 'seats'}. Tap a seat to select it.
          </p>
        </header>

        {/* Legend */}
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#6b5546]">
          <Legend swatchClass="border-2 border-[#f0c3ab] bg-white" label="Available" />
          <Legend swatchStyle={{backgroundColor: ACCENT, borderColor: ACCENT}} swatchClass="border-2" label="Selected" />
          <Legend swatchClass="border border-stone-300 bg-stone-200/70 opacity-60" label="Taken" icon={<Lock className="size-3 text-stone-400" />} />
        </div>

        {/* Bus card */}
        <section
          aria-label={`${map.label} seat map`}
          className="rounded-2xl border border-[#f4d9c6] bg-white p-4 shadow-[0_10px_30px_rgba(150,70,25,0.08)] sm:p-6"
        >
          {/* rounded bus outline */}
          <div className="rounded-[26px] border-2 border-dashed border-[#f0c3ab] bg-[#fffaf5] p-3 sm:p-4">
            <CabinHeader driverSeat={map.driverSeat} entryDoor={map.entryDoor} />
            <div className="flex flex-col gap-2 sm:gap-2.5">
              {map.rows.map((row, i) => (
                <SeatRow
                  key={i}
                  row={row}
                  rowIndex={i}
                  hasAisle={map.hasAisle}
                  statusOf={statusOf}
                  selectionFull={selectionFull}
                  onToggle={toggle}
                />
              ))}
            </div>
            <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#c99274]">
              Rear
            </p>
          </div>
        </section>

        {/* Selected summary chips */}
        <div className="mt-4 flex items-center gap-2 text-sm text-[#6b5546]">
          <Info className="size-4 text-[#E8622C]" />
          {selected.length === 0 ? (
            <span>No seats selected yet.</span>
          ) : (
            <span className="flex flex-wrap items-center gap-1.5">
              Selected:
              {selected.map((id) => (
                <span key={id} className="rounded-md bg-[#fbe7d8] px-1.5 py-0.5 text-xs font-bold text-[#a35a37]">
                  {id.replace('R', '').replace('-', '')}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#f4d9c6] bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a6f5c]">
              {selected.length} of {seatsToBook} · Total
            </p>
            <p className="font-serif text-2xl font-semibold text-[#3a2416]">{formatPrice(total)}</p>
          </div>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => onContinue?.(selected)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-[15px] font-bold text-white transition-all duration-150',
              'shadow-lg active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40'
            )}
            style={{backgroundColor: ACCENT}}
          >
            Continue with {selected.length} {selected.length === 1 ? 'seat' : 'seats'}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Legend({
  label,
  swatchClass,
  swatchStyle,
  icon,
}: {
  label: string;
  swatchClass?: string;
  swatchStyle?: React.CSSProperties;
  icon?: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('grid size-4 place-items-center rounded-md', swatchClass)} style={swatchStyle}>
        {icon}
      </span>
      {label}
    </span>
  );
}

export default SeatSelection;
