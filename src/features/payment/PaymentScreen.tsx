/**
 * PaymentScreen.tsx — Step 4 of 4: Trip → Vehicle → Seat → Payment
 *
 * Covers:
 *  • Horizontal stepper (step 4 active, steps 1-3 ticked)
 *  • Order summary accordion (always open on ≥sm, collapsible on mobile)
 *  • Payment method radio-cards: Mobile Money (primary, pre-selected),
 *    Card, Cash — one expanded at a time
 *  • MoMo: phone input with Uganda-prefix provider auto-detection
 *  • Card: formatted PAN input, expiry auto-slash, CVV, Luhn validation;
 *    only last4 kept — full PAN never stored
 *  • Passenger details with inline validation
 *  • Processing overlay with MoMo-specific "check your phone" message
 *  • Success screen with QR placeholder + ticket / home actions
 *  • Failure banner with Try again (order summary preserved)
 *  • Mock processor: 2.5 s delay, 80 % success / 20 % failure for demo
 */

import React, { useCallback, useId, useState, useEffect } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, Check, ChevronDown,
  CreditCard, Lock, Mail, MapPin, Phone, RefreshCw,
  ShieldCheck, Smartphone, Ticket, User, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Public types ─────────────────────────────────────────────────────────────

export type PaymentMethod = 'momo-mtn' | 'momo-airtel' | 'card' | 'cash';
export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

export interface PaymentRequest {
  bookingId: string;
  method: PaymentMethod;
  phoneNumber?: string;
  /** Only last4 stored — full PAN never touches client state */
  cardDetails?: { last4: string; expiry: string };
  amount: number;
  currency: 'UGX';
}

export interface BookingContext {
  bookingId: string;
  vehicleLabel: string;
  operator: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  seats: (string | number)[];
  boardingPoint: string;
  droppingPoint: string;
  baseFare: number;   // per seat, UGX
  serviceFee: number; // flat, UGX
}

export interface PaymentScreenProps {
  booking: BookingContext;
  passengerName?: string;
  passengerPhone?: string;
  onBack: () => void;
  onSuccess: (ref: string) => void;
  onHome: () => void;
  processPayment?: (req: PaymentRequest) => Promise<{ success: boolean; ref?: string; error?: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ORANGE = '#E8622C';
const fmt = (n: number) => `UGX ${n.toLocaleString()}`;

// Uganda prefix → provider
const MTN_PFX    = ['077', '078', '039', '031'];
const AIRTEL_PFX = ['070', '075', '074', '041'];
function detectProvider(raw: string): 'momo-mtn' | 'momo-airtel' | null {
  const d = raw.replace(/\D/g, '');
  const local = d.startsWith('256') ? '0' + d.slice(3) : d;
  if (MTN_PFX.some(p => local.startsWith(p)))    return 'momo-mtn';
  if (AIRTEL_PFX.some(p => local.startsWith(p))) return 'momo-airtel';
  return null;
}

function luhn(pan: string): boolean {
  const d = pan.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(d)) return false;
  let sum = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = +d[i];
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

const isPhone  = (v: string) => /^(\+?256|0)[0-9]{9}$/.test(v.replace(/\s/g, ''));
const isExpiry = (v: string) => {
  const m = v.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const exp = new Date(2000 + +m[2], +m[1] - 1, 1);
  return +m[1] >= 1 && +m[1] <= 12 && exp > new Date();
};
const isCVV = (v: string) => /^\d{3,4}$/.test(v);

async function mockProcess(req: PaymentRequest): Promise<{ success: boolean; ref?: string; error?: string }> {
  await new Promise(r => setTimeout(r, 2_500));
  if (Math.random() < 0.8) return { success: true, ref: 'TWX-' + Math.random().toString(36).slice(2, 8).toUpperCase() };
  const errs = [
    'Payment declined by your mobile money provider.',
    'MoMo request timed out. Please try again.',
    'Insufficient balance.',
    'Card declined — please check your details.',
  ];
  return { success: false, error: errs[Math.floor(Math.random() * errs.length)] };
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function FieldWrap({ label, required, error, hint, id, children }: {
  label: string; required?: boolean; error?: string;
  hint?: string; id?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-[#6b5546]">
        {label}{required && <span className="text-[#E8622C] ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-[#a38070]">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
          <AlertCircle className="size-3 shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

const TInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { err?: boolean }>(
  ({ className, err, ...props }, ref) => (
    <input ref={ref} className={cn(
      'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#3a2416] placeholder:text-[#c3a48a] transition',
      'focus:outline-none focus:ring-2',
      err ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-300/40'
          : 'border-[#f0c3ab] focus:border-[#E8622C] focus:ring-[#E8622C]/20',
      className,
    )} {...props} />
  )
);
TInput.displayName = 'TInput';

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-serif text-lg font-semibold text-[#3a2416] [&_svg]:size-5 [&_svg]:text-[#E8622C]">
      {icon}{children}
    </h2>
  );
}

// ─── Method card ──────────────────────────────────────────────────────────────

function MethodCard({ id, label, sub, icon, selected, onSelect }: {
  id: PaymentMethod; label: string; sub?: string;
  icon: React.ReactNode; selected: boolean; onSelect: (id: PaymentMethod) => void;
}) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={() => onSelect(id)}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8622C]/60',
        selected ? 'border-[#E8622C] bg-[#fff4ef]' : 'border-[#f0c3ab] bg-white hover:border-[#f6a882] hover:bg-[#fffaf7]',
      )}>
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-5',
        selected ? 'bg-[#E8622C] text-white' : 'bg-[#fbe7d8] text-[#E8622C]')}>
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-[#3a2416]">{label}</span>
        {sub && <span className="block text-[11px] text-[#8a6f5c]">{sub}</span>}
      </span>
      <span className={cn('grid size-5 shrink-0 place-items-center rounded-full border-2 transition',
        selected ? 'border-[#E8622C] bg-[#E8622C]' : 'border-[#c3a48a] bg-white')}>
        {selected && <Check className="size-3 text-white" />}
      </span>
    </button>
  );
}

// ─── Processing overlay ───────────────────────────────────────────────────────

function ProcessingOverlay({ method }: { method: PaymentMethod }) {
  const isMomo    = method === 'momo-mtn' || method === 'momo-airtel';
  const provider  = method === 'momo-mtn' ? 'MTN MoMo' : method === 'momo-airtel' ? 'Airtel Money' : '';
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#FDF3EA]/95 backdrop-blur-sm px-6 text-center">
      {/* spinner */}
      <div className="relative grid size-20 place-items-center">
        <svg className="absolute inset-0 animate-spin" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="34" stroke="#f0c3ab" strokeWidth="5"/>
          <circle cx="40" cy="40" r="34" stroke={ORANGE} strokeWidth="5"
            strokeLinecap="round" strokeDasharray="70 144"/>
        </svg>
        <Wallet className="size-8 text-[#E8622C]"/>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#E8622C] mb-1">Processing payment</p>
        <h2 className="font-serif text-2xl font-semibold text-[#3a2416]">
          {isMomo ? 'Check your phone' : 'Confirming your payment…'}
        </h2>
        <p className="mt-2 max-w-xs mx-auto text-sm text-[#6b5546] leading-relaxed">
          {isMomo
            ? `A secure ${provider} prompt has been sent to your phone. Approve it to complete your booking.`
            : 'Authorising with your bank. Please do not close this screen.'}
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-[#f4d9c6] bg-white px-4 py-3 text-[13px] text-[#6b5546]">
        <Lock className="size-4 text-[#E8622C] shrink-0"/>
        Secured by Twendex Pay · do not close this screen
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ booking, payRef, total, onViewTicket, onHome }: {
  booking: BookingContext; payRef: string; total: number;
  onViewTicket: () => void; onHome: () => void;
}) {
  const rows: [string, string][] = [
    ['Booking ref',  payRef],
    ['Route',        `${booking.origin} → ${booking.destination}`],
    ['Departure',    `${booking.departureDate} · ${booking.departureTime}`],
    ['Seat(s)',      booking.seats.join(', ')],
    ['Boarding',     booking.boardingPoint],
    ['Dropping',     booking.droppingPoint],
    ['Vehicle',      booking.vehicleLabel],
    ['Total paid',   fmt(total)],
  ];

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center px-5 py-14 text-center">
      {/* success badge */}
      <div className="relative mb-6">
        <div className="grid size-20 place-items-center rounded-full bg-green-100">
          <Check className="size-9 text-green-600" strokeWidth={3}/>
        </div>
        <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full"
          style={{ backgroundColor: ORANGE }}>
          <Ticket className="size-4 text-white"/>
        </span>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-widest text-green-600 mb-1">Booking confirmed</p>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#3a2416] mb-2">You're all set!</h1>
      <p className="text-sm text-[#6b5546] max-w-xs leading-relaxed">
        Your seat{booking.seats.length > 1 ? 's are' : ' is'} confirmed. Your QR ticket is ready to scan at the stage.
      </p>

      {/* ticket card */}
      <div className="mt-6 w-full max-w-sm rounded-2xl border border-[#f4d9c6] bg-white shadow-sm overflow-hidden">
        {/* QR placeholder — a decorative grid that looks like a QR code */}
        <div className="flex flex-col items-center gap-2 border-b border-dashed border-[#f4d9c6] bg-[#fffaf5] py-5">
          <div className="grid size-28 place-items-center rounded-xl border border-[#f0c3ab] bg-white p-2">
            <div className="grid grid-cols-7 gap-[2.5px] w-full h-full">
              {Array.from({ length: 49 }).map((_, i) => {
                // deterministic "QR" pattern from booking ref
                const seed = payRef.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                const on = (seed * (i + 7)) % 13 < 5
                  || [0,1,2,6,7,13,14,20,21,27,28,34,35,41,42,48].includes(i);
                return (
                  <div key={i} className="rounded-[1.5px] aspect-square"
                    style={{ background: on ? '#3a2416' : 'transparent' }}/>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#a38070]">Scan at boarding</p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 text-xs">
          {rows.map(([k, val]) => (
            <span key={k} className="flex flex-col gap-0.5 text-[#8a6f5c]">
              {k}<b className="text-[13px] text-[#3a2416]">{val}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
        <button onClick={onViewTicket}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 active:scale-[.98]"
          style={{ backgroundColor: ORANGE }}>
          <Ticket className="size-4"/>View my ticket
        </button>
        <button onClick={onHome}
          className="flex w-full items-center justify-center rounded-xl border border-[#f0c3ab] bg-white py-3 text-sm font-bold text-[#6b5546] transition hover:bg-[#fbe7d8]">
          Back to home
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PaymentScreen({
  booking,
  passengerName  = '',
  passengerPhone = '',
  onBack,
  onSuccess,
  onHome,
  processPayment = mockProcess,
}: PaymentScreenProps) {
  const total = booking.baseFare * booking.seats.length + booking.serviceFee;
  const id    = useId();

  // ── state ────────────────────────────────────────────────────────────────
  const [method,      setMethod]      = useState<PaymentMethod>('momo-mtn');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [status,      setStatus]      = useState<PaymentStatus>('idle');
  const [failMsg,     setFailMsg]     = useState('');
  const [successRef,  setSuccessRef]  = useState('');

  // passenger
  const [pName,  setPName]  = useState(passengerName);
  const [pPhone, setPPhone] = useState(passengerPhone);
  const [pEmail, setPEmail] = useState('');
  const [pErr,   setPErr]   = useState<{ name?: string; phone?: string }>({});

  // momo
  const [momoPhone, setMomoPhone] = useState(passengerPhone);
  const [momoErr,   setMomoErr]   = useState<{ phone?: string }>({});

  // card — PAN formatted, expiry auto-slash
  const [cardPAN,    setCardPAN]    = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV,    setCardCVV]    = useState('');
  const [cardName,   setCardName]   = useState('');
  const [cardErr,    setCardErr]    = useState<{
    num?: string; expiry?: string; cvv?: string; name?: string;
  }>({});

  // Auto-detect MoMo provider from phone prefix
  useEffect(() => {
    const detected = detectProvider(momoPhone);
    if (detected) setMethod(detected);
  }, [momoPhone]);

  // Card PAN formatter (groups of 4)
  const handlePAN = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 16);
    setCardPAN(d.replace(/(.{4})/g, '$1 ').trim());
    setCardErr(e => ({ ...e, num: undefined }));
  };

  // Expiry auto-slash
  const handleExpiry = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 4);
    setCardExpiry(d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d);
    setCardErr(e => ({ ...e, expiry: undefined }));
  };

  // ── can pay? ──────────────────────────────────────────────────────────────
  const isMomoMethod = method === 'momo-mtn' || method === 'momo-airtel';
  const canPay = (() => {
    if (!pName.trim() || !isPhone(pPhone)) return false;
    if (isMomoMethod && !isPhone(momoPhone)) return false;
    if (method === 'card') {
      const pan = cardPAN.replace(/\s/g, '');
      if (!luhn(pan) || !isExpiry(cardExpiry) || !isCVV(cardCVV) || !cardName.trim()) return false;
    }
    return true;
  })();

  // ── submit ────────────────────────────────────────────────────────────────
  const handlePay = useCallback(async () => {
    let ok = true;

    const pe: typeof pErr = {};
    if (!pName.trim())    { pe.name  = 'Full name is required.';                  ok = false; }
    if (!isPhone(pPhone)) { pe.phone = 'Enter a valid Ugandan mobile number.';    ok = false; }
    setPErr(pe);

    if (isMomoMethod) {
      const me: typeof momoErr = {};
      if (!isPhone(momoPhone)) { me.phone = 'Enter a valid mobile money number.'; ok = false; }
      setMomoErr(me);
    }

    if (method === 'card') {
      const ce: typeof cardErr = {};
      const pan = cardPAN.replace(/\s/g, '');
      if (!luhn(pan))             { ce.num    = 'Invalid card number.';                   ok = false; }
      if (!isExpiry(cardExpiry))  { ce.expiry = 'Invalid or expired date (MM/YY).';       ok = false; }
      if (!isCVV(cardCVV))        { ce.cvv    = 'Enter 3 or 4 digits.';                   ok = false; }
      if (!cardName.trim())       { ce.name   = 'Cardholder name required.';              ok = false; }
      setCardErr(ce);
    }

    if (!ok) return;

    const pan = cardPAN.replace(/\s/g, '');
    const req: PaymentRequest = {
      bookingId:   booking.bookingId,
      method,
      phoneNumber: isMomoMethod ? momoPhone.replace(/\s/g, '') : undefined,
      cardDetails: method === 'card'
        ? { last4: pan.slice(-4), expiry: cardExpiry }
        : undefined,
      amount:   total,
      currency: 'UGX',
    };

    setStatus('processing');
    try {
      const res = await processPayment(req);
      if (res.success && res.ref) {
        setSuccessRef(res.ref);
        setStatus('success');
      } else {
        setFailMsg(res.error ?? 'Payment failed. Please try again.');
        setStatus('failed');
      }
    } catch {
      setFailMsg('Network error. Please check your connection and try again.');
      setStatus('failed');
    }
  }, [method, momoPhone, cardPAN, cardExpiry, cardCVV, cardName,
      pName, pPhone, total, booking, isMomoMethod, processPayment]);

  // ── success ───────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <SuccessScreen
        booking={booking} payRef={successRef} total={total}
        onViewTicket={() => onSuccess(successRef)} onHome={onHome}
      />
    );
  }

  // ── main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDF3EA] pb-36">
      {status === 'processing' && <ProcessingOverlay method={method}/>}

      <div className="mx-auto max-w-xl px-4 pt-8">

        {/* back */}
        <button type="button" onClick={onBack}
          className="mb-5 -ml-1 flex items-center gap-1.5 text-sm font-semibold text-[#6b5546] hover:text-[#E8622C] transition">
          <ArrowLeft className="size-4"/>Seat selection
        </button>

        {/* ── Stepper ── */}
        <div className="mb-7 flex flex-wrap items-center gap-y-2">
          {['Trip', 'Vehicle', 'Seat', 'Payment'].map((label, i) => (
            <span key={label} className={cn('flex items-center gap-2 text-[13px]',
              i === 3 ? 'text-[#E8622C] font-bold' : 'text-[#a38070]')}>
              <span className={cn(
                'grid size-6 place-items-center rounded-full text-[11px] font-bold not-italic',
                i < 3  ? 'bg-[#E8622C] text-white'
                : i === 3 ? 'border-2 border-[#E8622C] text-[#E8622C] bg-white'
                          : 'border border-[#f0c3ab] text-[#a38070]',
              )}>
                {i < 3 ? <Check className="size-3.5"/> : 4}
              </span>
              {label}
              {i < 3 && <em className="w-8 md:w-11 h-px bg-[#f0c3ab] mx-1.5 not-italic"/>}
            </span>
          ))}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#E8622C] mb-1">
          Step 4 of 4
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#3a2416] mb-6">
          Confirm &amp; pay
        </h1>

        {/* ── Failure banner ── */}
        {status === 'failed' && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm">
            <AlertCircle className="size-5 text-rose-500 shrink-0 mt-0.5"/>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-rose-700">Payment failed</p>
              <p className="text-rose-600 mt-0.5">{failMsg}</p>
            </div>
            <button onClick={() => setStatus('idle')}
              className="flex items-center gap-1 rounded-lg bg-rose-100 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-200 transition shrink-0">
              <RefreshCw className="size-3"/>Try again
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            ORDER SUMMARY
        ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-5 rounded-2xl border border-[#f4d9c6] bg-white shadow-[0_6px_24px_rgba(150,70,25,0.07)] overflow-hidden">

          {/* always-visible top row — tap to expand on mobile */}
          <button type="button" aria-expanded={summaryOpen}
            onClick={() => setSummaryOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-left sm:pointer-events-none">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#fbe7d8]">
                <Ticket className="size-4 text-[#E8622C]"/>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#3a2416] truncate">{booking.vehicleLabel}</p>
                <p className="text-xs text-[#8a6f5c]">
                  {booking.origin} → {booking.destination} · {booking.departureTime}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="font-bold text-[#3a2416] whitespace-nowrap">{fmt(total)}</span>
              <ChevronDown className={cn(
                'size-4 text-[#a38070] transition-transform sm:hidden',
                summaryOpen && 'rotate-180',
              )}/>
            </div>
          </button>

          {/* expandable body — always visible on sm+ */}
          <div className={cn('sm:block border-t border-[#fce8d8]', summaryOpen ? 'block' : 'hidden')}>
            <div className="px-5 py-4 grid gap-4">

              {/* route details */}
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-[#8a6f5c]">
                {[
                  [<MapPin/>, <><b className="text-[#3a2416]">Boarding</b> {booking.boardingPoint}</>],
                  [<MapPin/>, <><b className="text-[#3a2416]">Dropping</b> {booking.droppingPoint}</>],
                  [<ShieldCheck/>, <>{booking.operator} · {booking.departureDate}</>],
                ].map((row, i) => (
                  <span key={i} className={cn('flex items-start gap-1.5', i === 2 && 'sm:col-span-2')}>
                    <span className="size-3.5 text-[#E8622C] shrink-0 mt-0.5 [&_svg]:size-3.5">{row[0]}</span>
                    <span>{row[1]}</span>
                  </span>
                ))}
              </div>

              {/* seat chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[#8a6f5c] mr-0.5">Seats:</span>
                {booking.seats.map(s => (
                  <span key={s}
                    className="rounded-md border border-[#f6c9ae] bg-[#fbe7d8] px-2 py-0.5 text-xs font-bold text-[#a35a37]">
                    {s}
                  </span>
                ))}
                <span className="ml-auto text-xs text-[#a38070]">
                  {booking.seats.length} passenger{booking.seats.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* price breakdown */}
              <div className="rounded-xl border border-[#fce8d8] bg-[#fffaf5] px-4 py-3 text-sm">
                <div className="flex justify-between text-[#6b5546] mb-1.5">
                  <span>Base fare × {booking.seats.length}</span>
                  <span>{fmt(booking.baseFare * booking.seats.length)}</span>
                </div>
                <div className="flex justify-between text-[#6b5546] mb-3 pb-3 border-b border-[#fce8d8]">
                  <span>Service fee</span>
                  <span>{fmt(booking.serviceFee)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#3a2416] text-base">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            PASSENGER DETAILS
        ══════════════════════════════════════════════════════════════════ */}
        <div className="mb-5 rounded-2xl border border-[#f4d9c6] bg-white p-5 shadow-[0_6px_24px_rgba(150,70,25,0.07)]">
          <SectionHeading icon={<User/>}>Passenger details</SectionHeading>
          <div className="mt-4 grid gap-4">
            <FieldWrap id={`${id}pname`} label="Full name" required error={pErr.name}>
              <TInput id={`${id}pname`} placeholder="e.g. Amina Nakato" value={pName}
                onChange={e => { setPName(e.target.value); setPErr(v => ({ ...v, name: undefined })); }}
                err={!!pErr.name} autoComplete="name"/>
            </FieldWrap>
            <FieldWrap id={`${id}pphone`} label="Phone number" required error={pErr.phone}
              hint="Used to send your ticket confirmation">
              <TInput id={`${id}pphone`} type="tel" placeholder="07XX XXX XXX" value={pPhone}
                onChange={e => { setPPhone(e.target.value); setPErr(v => ({ ...v, phone: undefined })); }}
                err={!!pErr.phone} autoComplete="tel"/>
            </FieldWrap>
            <FieldWrap id={`${id}pemail`} label="Email (optional)"
              hint="We'll send your e-ticket here if provided">
              <TInput id={`${id}pemail`} type="email" placeholder="you@example.com"
                value={pEmail} onChange={e => setPEmail(e.target.value)} autoComplete="email"/>
            </FieldWrap>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            PAYMENT METHOD
        ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-[#f4d9c6] bg-white p-5 shadow-[0_6px_24px_rgba(150,70,25,0.07)]">
          <SectionHeading icon={<Wallet/>}>Payment method</SectionHeading>
          <p className="mt-1 mb-4 text-xs text-[#8a6f5c]">
            Mobile Money is recommended — it's the fastest option on this route.
          </p>

          <div className="grid gap-2.5" role="radiogroup" aria-label="Payment method">
            {/* MTN MoMo */}
            <MethodCard id="momo-mtn" selected={method === 'momo-mtn'} onSelect={setMethod}
              icon={<Smartphone/>}
              label="MTN Mobile Money"
              sub="Instant MoMo prompt to your phone"/>
            {/* Airtel Money */}
            <MethodCard id="momo-airtel" selected={method === 'momo-airtel'} onSelect={setMethod}
              icon={<Phone/>}
              label="Airtel Money"
              sub="Instant prompt to your Airtel line"/>
            {/* Card */}
            <MethodCard id="card" selected={method === 'card'} onSelect={setMethod}
              icon={<CreditCard/>}
              label="Visa / Mastercard"
              sub="Debit or credit card"/>
            {/* Cash */}
            <MethodCard id="cash" selected={method === 'cash'} onSelect={setMethod}
              icon={<Wallet/>}
              label="Cash on boarding"
              sub="Pay the driver before departure"/>
          </div>

          {/* ── MoMo expanded panel ── */}
          {(method === 'momo-mtn' || method === 'momo-airtel') && (
            <div className="mt-4 rounded-xl border border-[#fce8d8] bg-[#fffaf5] p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#6b5546]">
                {method === 'momo-mtn' ? 'MTN MoMo' : 'Airtel Money'} details
              </p>
              <FieldWrap id={`${id}mphn`} label="Mobile money number" required error={momoErr.phone}
                hint={detectProvider(momoPhone)
                  ? `✓ ${detectProvider(momoPhone) === 'momo-mtn' ? 'MTN' : 'Airtel'} number detected`
                  : 'We\'ll send a payment prompt to this number'}>
                <TInput id={`${id}mphn`} type="tel" placeholder="07XX XXX XXX"
                  value={momoPhone} err={!!momoErr.phone}
                  onChange={e => { setMomoPhone(e.target.value); setMomoErr({}); }}
                  autoComplete="tel"/>
              </FieldWrap>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-[12px] text-amber-800">
                <Smartphone className="size-4 shrink-0 mt-0.5"/>
                After tapping Pay, keep this screen open and approve the prompt on your phone.
              </div>
            </div>
          )}

          {/* ── Card expanded panel ── */}
          {method === 'card' && (
            <div className="mt-4 rounded-xl border border-[#fce8d8] bg-[#fffaf5] p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#6b5546]">
                Card details
              </p>
              <div className="grid gap-3.5">
                <FieldWrap id={`${id}cnum`} label="Card number" required error={cardErr.num}>
                  <div className="relative">
                    <TInput id={`${id}cnum`} placeholder="0000 0000 0000 0000"
                      value={cardPAN} err={!!cardErr.num}
                      onChange={e => handlePAN(e.target.value)}
                      inputMode="numeric" autoComplete="cc-number" maxLength={19}
                      className="pr-10"/>
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#c3a48a]"/>
                  </div>
                </FieldWrap>
                <div className="grid grid-cols-2 gap-3">
                  <FieldWrap id={`${id}cexp`} label="Expiry" required error={cardErr.expiry}>
                    <TInput id={`${id}cexp`} placeholder="MM/YY"
                      value={cardExpiry} err={!!cardErr.expiry}
                      onChange={e => handleExpiry(e.target.value)}
                      inputMode="numeric" autoComplete="cc-exp" maxLength={5}/>
                  </FieldWrap>
                  <FieldWrap id={`${id}ccvv`} label="CVV" required error={cardErr.cvv}>
                    <div className="relative">
                      <TInput id={`${id}ccvv`} placeholder="•••"
                        value={cardCVV} err={!!cardErr.cvv}
                        onChange={e => { setCardCVV(e.target.value.replace(/\D/g,'').slice(0,4)); setCardErr(v=>({...v,cvv:undefined})); }}
                        inputMode="numeric" autoComplete="cc-csc" maxLength={4}
                        type="password" className="pr-10"/>
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#c3a48a]"/>
                    </div>
                  </FieldWrap>
                </div>
                <FieldWrap id={`${id}cnm`} label="Cardholder name" required error={cardErr.name}>
                  <TInput id={`${id}cnm`} placeholder="As printed on card"
                    value={cardName} err={!!cardErr.name}
                    onChange={e => { setCardName(e.target.value); setCardErr(v=>({...v,name:undefined})); }}
                    autoComplete="cc-name"/>
                </FieldWrap>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#f0c3ab] bg-white px-3 py-2 text-[11px] text-[#8a6f5c]">
                <Lock className="size-3.5 text-[#E8622C] shrink-0"/>
                Card details are encrypted and never stored on our servers.
              </div>
            </div>
          )}

          {/* ── Cash panel ── */}
          {method === 'cash' && (
            <div className="mt-4 rounded-xl border border-[#fce8d8] bg-[#fffaf5] p-4 text-sm text-[#6b5546]">
              <p className="font-semibold text-[#3a2416] mb-1">Pay the driver before departure</p>
              <p>Have exact change ready. Your seat is held for 10 minutes — board promptly to keep it.</p>
              <div className="mt-3 flex items-center gap-2 font-bold text-[#3a2416]">
                Amount due: <span style={{ color: ORANGE }}>{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STICKY FOOTER — Pay CTA
      ══════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#f4d9c6] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl flex-col gap-1 px-4 py-3">
          {/* live total */}
          <div className="flex items-baseline justify-between text-xs text-[#8a6f5c]">
            <span>{booking.seats.length} seat{booking.seats.length > 1 ? 's' : ''} · {booking.seats.join(', ')}</span>
            <span className="font-bold text-base text-[#3a2416]">{fmt(total)}</span>
          </div>

          <button type="button" disabled={!canPay || status === 'processing'}
            onClick={handlePay}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-4 text-[15px] font-bold text-white',
              'shadow-lg transition-all duration-150 active:scale-[.98]',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
            style={{ backgroundColor: canPay ? ORANGE : undefined }}>
            {status === 'processing'
              ? <><svg className="size-4 animate-spin" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="white" strokeOpacity=".35" strokeWidth="2.5"/>
                    <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>Processing…</>
              : <>Pay {fmt(total)}<ArrowRight className="size-5"/></>
            }
          </button>

          {!canPay && status === 'idle' && (
            <p className="text-center text-[11px] text-[#a38070]">
              Complete all required fields above to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentScreen;
