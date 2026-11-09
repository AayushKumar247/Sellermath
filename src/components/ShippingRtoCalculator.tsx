import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Truck,
  Package,
  Weight,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  Pencil,
  RotateCcw,
  Copy,
  Lightbulb,
  IndianRupee,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type ZoneId = 'local' | 'zonal' | 'national';
type PaymentMode = 'prepaid' | 'cod';
type SyncMode = 'forward' | 'blended';

interface ZoneRate {
  base: number; // first 0.5 kg slab
  addl: number; // each additional 0.5 kg slab
  rto: number; // RTO base charge (first slab)
  codFlat: number; // minimum COD fee
  codPct: number; // COD fee as % of order value (higher of flat / % applies)
}

interface CourierRate {
  name: string;
  local: ZoneRate;
  zonal: ZoneRate;
  national: ZoneRate;
}

interface Inputs {
  deadWeight: number;
  length: number;
  width: number;
  height: number;
  divisor: number;
  zone: ZoneId;
  paymentMode: PaymentMode;
  rtoPercent: number;
  orderValue: number;
  cogs: number;
  packaging: number;
  rtoDamagePercent: number;
  includeGst: boolean;
  syncMode: SyncMode;
}

interface CostBreakdown {
  forward: number;
  rto: number;
  cod: number;
  expectedRto: number;
  expectedCod: number;
  effective: number; // expected shipping cost per order placed
  perDelivered: number | null; // expected shipping cost per successful delivery
  profit: number | null; // expected net profit per order placed
  breakEvenRto: number | null; // RTO % at which profit hits zero
}

interface ToastState {
  kind: 'success' | 'error';
  title: string;
  message: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const GST_RATE = 0.18;
const SLAB_KG = 0.5;
const PROFIT_CALC_KEY = 'sellermath_universal_calc';
const INPUTS_KEY = 'sellermath_shipping_inputs';
const RATES_KEY = 'sellermath_shipping_rates';
const RTO_LEVELS = [0, 10, 20, 30, 40, 50];

const ZONE_LABELS: Record<ZoneId, string> = {
  local: 'Local (same city)',
  zonal: 'Zonal (nearby states)',
  national: 'National (pan India)',
};

const DIVISOR_OPTIONS = [
  { value: 5000, label: '5000 (most couriers)' },
  { value: 4000, label: '4000 (stricter)' },
  { value: 6000, label: '6000 (lenient)' },
];

const z = (base: number, addl: number, rto: number, codFlat: number): ZoneRate => ({
  base,
  addl,
  rto,
  codFlat,
  codPct: 0,
});

const DEFAULT_RATES: CourierRate[] = [
  { name: 'Shiprocket', local: z(35, 28, 45, 15), zonal: z(42, 30, 52, 18), national: z(48, 32, 58, 20) },
  { name: 'Delhivery', local: z(38, 30, 48, 16), zonal: z(45, 32, 55, 19), national: z(52, 35, 62, 22) },
  { name: 'BlueDart', local: z(45, 35, 55, 20), zonal: z(52, 38, 62, 23), national: z(60, 42, 70, 25) },
  { name: 'Xpressbees', local: z(36, 29, 46, 15), zonal: z(43, 31, 53, 18), national: z(49, 34, 59, 21) },
  { name: 'Ecom Express', local: z(37, 28, 47, 16), zonal: z(44, 30, 54, 19), national: z(50, 33, 60, 22) },
];

const DEFAULT_INPUTS: Inputs = {
  deadWeight: 1,
  length: 30,
  width: 20,
  height: 10,
  divisor: 5000,
  zone: 'national',
  paymentMode: 'prepaid',
  rtoPercent: 15,
  orderValue: 0,
  cogs: 0,
  packaging: 0,
  rtoDamagePercent: 0,
  includeGst: true,
  syncMode: 'forward',
};

/* ------------------------------------------------------------------ */
/* Pure helpers                                                        */
/* ------------------------------------------------------------------ */

function formatINR(val: number): string {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function slabsFor(billableKg: number): number {
  if (billableKg <= 0) return 0;
  return Math.max(1, Math.ceil(billableKg / SLAB_KG - 1e-9));
}

function computeCost(rate: ZoneRate, billableKg: number, inp: Inputs, rtoPct: number): CostBreakdown {
  const gst = inp.includeGst ? 1 + GST_RATE : 1;
  const extraSlabs = Math.max(0, slabsFor(billableKg) - 1);
  const p = clamp(rtoPct, 0, 100) / 100;

  const forward = (rate.base + extraSlabs * rate.addl) * gst;
  const rto = (rate.rto + extraSlabs * rate.addl) * gst;
  const cod =
    inp.paymentMode === 'cod' ? Math.max(rate.codFlat, (inp.orderValue * rate.codPct) / 100) * gst : 0;

  // Forward is always paid. RTO charge only on returned orders. COD fee only on delivered ones.
  const expectedRto = p * rto;
  const expectedCod = (1 - p) * cod;
  const effective = forward + expectedRto + expectedCod;
  const perDelivered = p < 1 ? effective / (1 - p) : null;

  let profit: number | null = null;
  let breakEvenRto: number | null = null;
  if (inp.orderValue > 0) {
    const a = inp.orderValue - inp.cogs - cod; // margin on a delivered order before shipping
    const damage = (inp.rtoDamagePercent / 100) * inp.cogs; // stock lost on a returned order
    profit = a - forward - inp.packaging - p * (a + rto + damage);
    const numerator = a - forward - inp.packaging;
    const denominator = a + rto + damage;
    if (denominator > 0) breakEvenRto = numerator <= 0 ? 0 : clamp((numerator / denominator) * 100, 0, 100);
  }

  return { forward, rto, cod, expectedRto, expectedCod, effective, perDelivered, profit, breakEvenRto };
}

function loadJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function sanitizeInputs(raw: unknown): Inputs {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_INPUTS;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...DEFAULT_INPUTS };
  (Object.keys(DEFAULT_INPUTS) as (keyof Inputs)[]).forEach((k) => {
    if (typeof src[k] === typeof DEFAULT_INPUTS[k]) out[k] = src[k];
  });
  if (!(out.zone as string in ZONE_LABELS)) out.zone = DEFAULT_INPUTS.zone;
  if (out.paymentMode !== 'prepaid' && out.paymentMode !== 'cod') out.paymentMode = 'prepaid';
  if (out.syncMode !== 'forward' && out.syncMode !== 'blended') out.syncMode = 'forward';
  return out as unknown as Inputs;
}

const isZoneRate = (v: unknown): v is ZoneRate => {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return ['base', 'addl', 'rto', 'codFlat', 'codPct'].every((k) => typeof r[k] === 'number');
};

function sanitizeRates(raw: unknown): CourierRate[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_RATES;
  const valid = raw.every(
    (c) =>
      typeof c === 'object' &&
      c !== null &&
      typeof (c as CourierRate).name === 'string' &&
      isZoneRate((c as CourierRate).local) &&
      isZoneRate((c as CourierRate).zonal) &&
      isZoneRate((c as CourierRate).national)
  );
  return valid ? (raw as CourierRate[]) : DEFAULT_RATES;
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

const cardCls = 'bg-white dark:bg-zinc-900 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 p-6';
const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';
const focusBtn =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900';

interface NumInputProps {
  id?: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  step?: string;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

/** Number input that keeps what the user types (e.g. "1.") instead of fighting the cursor. */
function NumInput({ id, value, onChange, max, step = 'any', placeholder, className, ariaLabel }: NumInputProps) {
  const [text, setText] = useState<string>(String(value));

  useEffect(() => {
    setText((t) => (parseFloat(t) === value || (t === '' && value === 0) ? t : String(value)));
  }, [value]);

  return (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min={0}
      max={max}
      step={step}
      value={text}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value);
        const parsed = parseFloat(e.target.value);
        onChange(Number.isFinite(parsed) ? clamp(parsed, 0, max ?? Infinity) : 0);
      }}
      className={className ?? inputCls}
    />
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div>
      <span className={labelCls} id={`seg-${label}`}>
        {label}
      </span>
      <div className="flex gap-2" role="group" aria-labelledby={`seg-${label}`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors select-none ${focusBtn} ${
              value === o.value
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ShippingRtoCalculator() {
  const [inputs, setInputs] = useState<Inputs>(() => sanitizeInputs(loadJSON(INPUTS_KEY)));
  const [rates, setRates] = useState<CourierRate[]>(() => sanitizeRates(loadJSON(RATES_KEY)));
  const [selected, setSelected] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) => setInputs((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    try {
      localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs));
    } catch {
      /* storage unavailable: calculator still works */
    }
  }, [inputs]);

  useEffect(() => {
    try {
      localStorage.setItem(RATES_KEY, JSON.stringify(rates));
    } catch {
      /* storage unavailable: calculator still works */
    }
  }, [rates]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = useCallback((t: ToastState) => {
    window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  /* ---------- weights ---------- */
  const volumetricWeight = (inputs.length * inputs.width * inputs.height) / inputs.divisor;
  const billableWeight = Math.max(inputs.deadWeight, volumetricWeight);
  const isVolumetricTrap = volumetricWeight > inputs.deadWeight;
  const slabs = slabsFor(billableWeight);

  /* ---------- courier costs ---------- */
  const costs = useMemo(
    () =>
      rates
        .map((c) => ({ name: c.name, cost: computeCost(c[inputs.zone], billableWeight, inputs, inputs.rtoPercent) }))
        .sort((a, b) => a.cost.effective - b.cost.effective),
    [rates, inputs, billableWeight]
  );

  const best = costs[0];
  const chosen = costs.find((c) => c.name === selected) ?? best;
  const maxEffective = Math.max(...costs.map((c) => c.cost.effective), 1);
  const hasProfit = inputs.orderValue > 0;

  /* ---------- RTO sensitivity: cheapest courier at each RTO level ---------- */
  const sensitivity = useMemo(
    () =>
      RTO_LEVELS.map((level) => {
        const row = rates
          .map((c) => ({ name: c.name, cost: computeCost(c[inputs.zone], billableWeight, inputs, level) }))
          .sort((a, b) => a.cost.effective - b.cost.effective)[0];
        return { level, name: row.name, effective: row.cost.effective, profit: row.cost.profit };
      }),
    [rates, inputs, billableWeight]
  );

  /* ---------- tips ---------- */
  const tips = useMemo(() => {
    const out: string[] = [];
    if (!best) return out;
    const p = clamp(inputs.rtoPercent, 0, 100);

    if (isVolumetricTrap && inputs.deadWeight > 0 && inputs.length * inputs.width > 0) {
      const maxHeight = (inputs.deadWeight * inputs.divisor) / (inputs.length * inputs.width);
      const bestRate = rates.find((r) => r.name === best.name);
      let saving = 0;
      if (bestRate) {
        saving = best.cost.effective - computeCost(bestRate[inputs.zone], inputs.deadWeight, inputs, p).effective;
      }
      out.push(
        `Volumetric weight (${volumetricWeight.toFixed(2)} kg) is above actual weight, so you pay for empty space. Keep height at ${maxHeight.toFixed(1)} cm or less to bill at ${inputs.deadWeight.toFixed(2)} kg${
          saving > 0.005 ? ` and save about ${formatINR(saving)} per order on ${best.name}` : ''
        }.`
      );
    }

    if (slabs > 1) {
      const over = billableWeight - (slabs - 1) * SLAB_KG;
      if (over > 0 && over <= 0.1) {
        out.push(
          `You are only ${Math.round(over * 1000)} g into the ${(slabs * SLAB_KG).toFixed(1)} kg slab. Trimming that much weight drops you one slab.`
        );
      }
    }

    if (inputs.paymentMode === 'cod' && best.cost.expectedCod > 0) {
      out.push(
        `COD adds about ${formatINR(best.cost.expectedCod)} per order in fees on ${best.name}. Nudging buyers to prepaid removes it and usually lowers RTO as well.`
      );
    }

    if (best.cost.effective > 0 && best.cost.expectedRto / best.cost.effective >= 0.3) {
      out.push(
        `At ${p}% RTO, returns make up ${Math.round((best.cost.expectedRto / best.cost.effective) * 100)}% of your expected shipping cost. Cutting RTO (address verification, call confirmation) saves more than switching couriers.`
      );
    }

    if (hasProfit && best.cost.profit !== null && best.cost.profit < 0) {
      out.push(
        best.cost.breakEvenRto !== null && best.cost.breakEvenRto > 0
          ? `This order loses money at ${p}% RTO. Break-even RTO on ${best.name} is ${best.cost.breakEvenRto.toFixed(1)}%.`
          : `This order loses money even at 0% RTO. Raise the price or cut product, packaging or shipping cost.`
      );
    }
    return out;
  }, [best, rates, inputs, isVolumetricTrap, volumetricWeight, billableWeight, slabs, hasProfit]);

  /* ---------- actions ---------- */
  const updateRate = (courier: string, field: keyof ZoneRate, value: number) => {
    setRates((prev) =>
      prev.map((c) => (c.name === courier ? { ...c, [inputs.zone]: { ...c[inputs.zone], [field]: value } } : c))
    );
  };

  const resetRates = () => {
    setRates(DEFAULT_RATES);
    showToast({ kind: 'success', title: 'Rates reset', message: 'Back to the built-in indicative rates.' });
  };

  const handleSync = () => {
    const value = inputs.syncMode === 'forward' ? chosen.cost.forward : chosen.cost.effective;
    try {
      const raw = localStorage.getItem(PROFIT_CALC_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        showToast({
          kind: 'error',
          title: 'Nothing to sync into yet',
          message: 'Open the Profit Calculator once, then sync again.',
        });
        return;
      }
      (parsed as Record<string, unknown>).directShippingFee = Number(value.toFixed(2));
      localStorage.setItem(PROFIT_CALC_KEY, JSON.stringify(parsed));
      showToast({
        kind: 'success',
        title: 'Shipping fee synced',
        message: `${formatINR(value)} from ${chosen.name}. Open the Profit Calculator to apply it.`,
      });
    } catch (e) {
      console.error('Failed to sync shipping fee', e);
      showToast({ kind: 'error', title: 'Sync failed', message: 'Could not read or write saved calculator data.' });
    }
  };

  const handleCopy = async () => {
    const lines = [
      `Shipping & RTO estimate (${ZONE_LABELS[inputs.zone]}, ${inputs.paymentMode.toUpperCase()})`,
      `Billable weight: ${billableWeight.toFixed(2)} kg (dead ${inputs.deadWeight.toFixed(2)} kg, volumetric ${volumetricWeight.toFixed(2)} kg)`,
      `RTO: ${inputs.rtoPercent}% | GST ${inputs.includeGst ? 'included' : 'excluded'}`,
      '',
      ...costs.map(
        (c) =>
          `${c.name}: forward ${formatINR(c.cost.forward)}, expected ${formatINR(c.cost.effective)} per order${
            c.cost.perDelivered !== null ? `, ${formatINR(c.cost.perDelivered)} per delivered` : ''
          }`
      ),
      '',
      `Best: ${best.name}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast({ kind: 'success', title: 'Copied', message: 'Comparison copied to clipboard.' });
    } catch {
      showToast({ kind: 'error', title: 'Copy failed', message: 'Your browser blocked clipboard access.' });
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 box-border overflow-x-hidden">
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 dark:from-zinc-900/95 dark:via-zinc-900/90 dark:to-emerald-950/25 p-5 sm:p-7 shadow-sm mb-6">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 select-none">Shipping & RTO Calculator</h1>
          <p className="text-gray-600 dark:text-gray-400 select-none">
            Find the courier that costs you least after returns, COD fees and GST, and see what each order really earns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============ LEFT: inputs ============ */}
        <div className="lg:col-span-1 space-y-6">
          <div className={cardCls}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 select-none">
              <Package className="w-5 h-5 text-emerald-500" />
              Package details
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="deadWeight" className={labelCls}>
                  Dead weight (kg)
                </label>
                <NumInput
                  id="deadWeight"
                  value={inputs.deadWeight}
                  onChange={(v) => set('deadWeight', v)}
                  step="0.01"
                  placeholder="e.g., 1.5"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['length', 'Length (cm)'],
                    ['width', 'Width (cm)'],
                    ['height', 'Height (cm)'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label htmlFor={key} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {label}
                    </label>
                    <NumInput
                      id={key}
                      value={inputs[key]}
                      onChange={(v) => set(key, v)}
                      step="0.1"
                      className={`${inputCls} !px-2 text-sm`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="divisor" className={labelCls}>
                  Volumetric divisor
                </label>
                <select
                  id="divisor"
                  value={inputs.divisor}
                  onChange={(e) => set('divisor', Number(e.target.value))}
                  className={inputCls}
                >
                  {DIVISOR_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="zone" className={labelCls}>
                  Delivery zone
                </label>
                <select
                  id="zone"
                  value={inputs.zone}
                  onChange={(e) => set('zone', e.target.value as ZoneId)}
                  className={inputCls}
                >
                  {(Object.keys(ZONE_LABELS) as ZoneId[]).map((id) => (
                    <option key={id} value={id}>
                      {ZONE_LABELS[id]}
                    </option>
                  ))}
                </select>
              </div>

              <Segmented<PaymentMode>
                label="Payment mode"
                value={inputs.paymentMode}
                onChange={(v) => set('paymentMode', v)}
                options={[
                  { value: 'prepaid', label: 'Prepaid' },
                  { value: 'cod', label: 'COD' },
                ]}
              />

              <div>
                <label htmlFor="rtoPercent" className={labelCls}>
                  Expected RTO %
                </label>
                <NumInput
                  id="rtoPercent"
                  value={inputs.rtoPercent}
                  onChange={(v) => set('rtoPercent', v)}
                  max={100}
                  step="1"
                  placeholder="e.g., 15"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inputs.includeGst}
                  onChange={(e) => set('includeGst', e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
                Add 18% GST on courier charges
              </label>
            </div>
          </div>

          {/* Order economics */}
          <div className={cardCls}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2 select-none">
              <IndianRupee className="w-5 h-5 text-emerald-500" />
              Order economics
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Optional. Fill these to see profit per order and your break-even RTO.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="orderValue" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Selling price (₹)
                </label>
                <NumInput id="orderValue" value={inputs.orderValue} onChange={(v) => set('orderValue', v)} />
              </div>
              <div>
                <label htmlFor="cogs" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product cost (₹)
                </label>
                <NumInput id="cogs" value={inputs.cogs} onChange={(v) => set('cogs', v)} />
              </div>
              <div>
                <label htmlFor="packaging" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Packaging (₹)
                </label>
                <NumInput id="packaging" value={inputs.packaging} onChange={(v) => set('packaging', v)} />
              </div>
              <div>
                <label htmlFor="damage" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Damaged on RTO (%)
                </label>
                <NumInput
                  id="damage"
                  value={inputs.rtoDamagePercent}
                  onChange={(v) => set('rtoDamagePercent', v)}
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* Volumetric card */}
          <div
            className={`rounded-2xl border-2 p-6 ${
              isVolumetricTrap
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
            }`}
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 select-none">
              <Weight className="w-5 h-5" />
              Weight check
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-slate-200 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dead weight</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{inputs.deadWeight.toFixed(2)} kg</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-3 border border-slate-200 dark:border-zinc-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Volumetric</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{volumetricWeight.toFixed(2)} kg</p>
              </div>
            </div>

            <div
              className={`rounded-lg p-3 border-2 ${
                isVolumetricTrap
                  ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600'
                  : 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold mb-1 text-gray-800 dark:text-gray-200">Billable weight</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{billableWeight.toFixed(2)} kg</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {slabs} slab{slabs === 1 ? '' : 's'} of {SLAB_KG} kg
                  </p>
                </div>
                {isVolumetricTrap ? (
                  <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                )}
              </div>
              {isVolumetricTrap && (
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                  Volumetric weight exceeds dead weight. Shrink the packaging to cut costs.
                </p>
              )}
            </div>
          </div>

          {/* Sync */}
          <div className={`${cardCls} space-y-4`}>
            <Segmented<SyncMode>
              label="Fee to send to Profit Calculator"
              value={inputs.syncMode}
              onChange={(v) => set('syncMode', v)}
              options={[
                { value: 'forward', label: 'Forward fee' },
                { value: 'blended', label: 'Incl. expected RTO' },
              ]}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sending <span className="font-semibold">{chosen.name}</span>:{' '}
              {formatINR(inputs.syncMode === 'forward' ? chosen.cost.forward : chosen.cost.effective)}. Pick another
              courier by selecting its row in the table.
            </p>
            <button
              type="button"
              onClick={handleSync}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold transition-all shadow-lg select-none ${focusBtn}`}
            >
              <Calculator className="w-5 h-5" aria-hidden="true" />
              Apply this shipping fee to Profit Calculator
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors select-none ${focusBtn}`}
            >
              <Copy className="w-4 h-4" aria-hidden="true" />
              Copy comparison
            </button>
          </div>
        </div>

        {/* ============ RIGHT: results ============ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cheapest after returns</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{best.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Forward {formatINR(best.cost.forward)}
              </p>
            </div>
            <div className={`${cardCls} !p-4`}>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Expected cost per order</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatINR(best.cost.effective)}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {best.cost.perDelivered !== null
                  ? `${formatINR(best.cost.perDelivered)} per delivered order`
                  : 'No deliveries at 100% RTO'}
              </p>
            </div>
            <div className={`${cardCls} !p-4`}>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Net profit per order</p>
              {hasProfit && best.cost.profit !== null ? (
                <>
                  <p
                    className={`text-xl font-bold ${
                      best.cost.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatINR(best.cost.profit)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Break-even RTO{' '}
                    {best.cost.breakEvenRto !== null ? `${best.cost.breakEvenRto.toFixed(1)}%` : 'not reachable'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-gray-400 dark:text-gray-500">-</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Add a selling price to see this</p>
                </>
              )}
            </div>
          </div>

          {/* Matrix */}
          <div className={cardCls}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 select-none">
              <Truck className="w-5 h-5 text-emerald-500" />
              Multi-courier rate & RTO loss matrix
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-700">
                    <th scope="col" className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                      Courier
                    </th>
                    <th scope="col" className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                      Forward
                    </th>
                    <th scope="col" className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                      RTO charge
                    </th>
                    <th scope="col" className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                      COD fee
                    </th>
                    <th scope="col" className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                      Expected RTO cost
                    </th>
                    <th scope="col" className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                      Cost / order
                    </th>
                    <th scope="col" className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                      Cost / delivered
                    </th>
                    {hasProfit && (
                      <th scope="col" className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                        Break-even RTO
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {costs.map((c, idx) => {
                    const isBest = idx === 0;
                    const isChosen = c.name === chosen.name;
                    return (
                      <tr
                        key={c.name}
                        onClick={() => setSelected(c.name)}
                        className={`border-b border-slate-100 dark:border-zinc-800 cursor-pointer transition-colors ${
                          isChosen
                            ? 'bg-emerald-50 dark:bg-emerald-900/20'
                            : 'hover:bg-slate-50 dark:hover:bg-zinc-900/50'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="courier"
                              checked={isChosen}
                              onChange={() => setSelected(c.name)}
                              className="accent-emerald-500"
                              aria-label={`Use ${c.name} for sync`}
                            />
                            <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                            {isBest && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                                BEST
                              </span>
                            )}
                          </label>
                        </td>
                        <td className="text-right py-3 px-3 text-gray-900 dark:text-white font-medium">
                          {formatINR(c.cost.forward)}
                        </td>
                        <td className="text-right py-3 px-3 text-gray-600 dark:text-gray-400">{formatINR(c.cost.rto)}</td>
                        <td className="text-right py-3 px-3 text-gray-600 dark:text-gray-400">{formatINR(c.cost.cod)}</td>
                        <td className="text-right py-3 px-3 text-red-600 dark:text-red-400 font-medium">
                          {formatINR(c.cost.expectedRto)}
                        </td>
                        <td className="text-right py-3 px-3">
                          <span
                            className={`font-bold ${
                              isBest ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {formatINR(c.cost.effective)}
                          </span>
                        </td>
                        <td className="text-right py-3 px-3 text-gray-900 dark:text-white">
                          {c.cost.perDelivered !== null ? formatINR(c.cost.perDelivered) : '-'}
                        </td>
                        {hasProfit && (
                          <td className="text-right py-3 px-3 text-gray-900 dark:text-white">
                            {c.cost.breakEvenRto !== null ? `${c.cost.breakEvenRto.toFixed(1)}%` : '-'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost composition */}
          <div className={cardCls}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 select-none">Where the money goes</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Expected cost per order, split by source.</p>
            <div className="space-y-3">
              {costs.map((c) => {
                const total = c.cost.effective || 1;
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-gray-700 dark:text-gray-300 truncate">{c.name}</span>
                    <div className="flex-1 h-4 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="flex h-full"
                        style={{ width: `${(c.cost.effective / maxEffective) * 100}%` }}
                        role="img"
                        aria-label={`${c.name}: forward ${formatINR(c.cost.forward)}, COD ${formatINR(c.cost.expectedCod)}, RTO ${formatINR(c.cost.expectedRto)}`}
                      >
                        <div className="bg-emerald-500" style={{ width: `${(c.cost.forward / total) * 100}%` }} />
                        <div className="bg-sky-500" style={{ width: `${(c.cost.expectedCod / total) * 100}%` }} />
                        <div className="bg-red-500" style={{ width: `${(c.cost.expectedRto / total) * 100}%` }} />
                      </div>
                    </div>
                    <span className="w-20 shrink-0 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatINR(c.cost.effective)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Forward
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-sky-500" /> COD fee (delivered orders)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-500" /> Expected RTO charge
              </span>
            </div>
          </div>

          {/* Sensitivity */}
          <div className={cardCls}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 select-none">
              If your RTO rate changes
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Cheapest courier and its expected cost per order at each RTO level.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {sensitivity.map((s) => (
                <div
                  key={s.level}
                  className="rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/50 p-3"
                >
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.level}% RTO</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">{formatINR(s.effective)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.name}</p>
                  {hasProfit && s.profit !== null && (
                    <p
                      className={`text-xs font-medium mt-1 ${
                        s.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      Profit {formatINR(s.profit)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 select-none">
                <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
                How to cut this cost
              </h2>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                {tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Rate editor */}
          <div className={cardCls}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white select-none">Your rate card</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Built-in rates are indicative. Enter your negotiated rates for {ZONE_LABELS[inputs.zone]} to get exact
                  numbers. Saved in this browser.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditor((s) => !s)}
                  aria-expanded={showEditor}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors select-none ${focusBtn}`}
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                  {showEditor ? 'Hide editor' : 'Edit rates'}
                </button>
                <button
                  type="button"
                  onClick={resetRates}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors select-none ${focusBtn}`}
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  Reset
                </button>
              </div>
            </div>

            {showEditor && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-700">
                      <th scope="col" className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        Courier
                      </th>
                      <th scope="col" className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        First 0.5 kg (₹)
                      </th>
                      <th scope="col" className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        Each extra 0.5 kg (₹)
                      </th>
                      <th scope="col" className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        RTO base (₹)
                      </th>
                      <th scope="col" className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        COD min (₹)
                      </th>
                      <th scope="col" className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                        COD % of value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((c) => (
                      <tr key={c.name} className="border-b border-slate-100 dark:border-zinc-800">
                        <th scope="row" className="text-left py-2 px-2 font-medium text-gray-900 dark:text-white">
                          {c.name}
                        </th>
                        {(['base', 'addl', 'rto', 'codFlat', 'codPct'] as const).map((field) => (
                          <td key={field} className="py-2 px-2">
                            <NumInput
                              value={c[inputs.zone][field]}
                              onChange={(v) => updateRate(c.name, field, v)}
                              ariaLabel={`${c.name} ${field}`}
                              className={`${inputCls} !py-1.5 !px-2 w-24`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="font-semibold mb-1">How these numbers are calculated</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Rates are indicative. Your actual rates depend on volume, pickup location and negotiated terms.</li>
                  <li>Forward charge is paid on every order. The RTO charge is paid only on returned orders.</li>
                  <li>The COD fee is charged only on delivered COD orders: the higher of the flat fee and the % of order value.</li>
                  <li>Expected cost per order = Forward + RTO% × RTO charge + (1 − RTO%) × COD fee.</li>
                  <li>Cost per delivered = Expected cost per order ÷ (1 − RTO%), the amount each successful sale has to cover.</li>
                  <li>Profit = delivered margin − forward − packaging − RTO% × (delivered margin + RTO charge + damaged stock).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 ${
            toast.kind === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {toast.kind === 'success' ? (
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          ) : (
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          )}
          <div>
            <p className="font-semibold">{toast.title}</p>
            <p className="text-sm opacity-90">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}