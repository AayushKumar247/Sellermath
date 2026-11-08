import { useMemo, useState } from 'react';
import {
  RotateCcw, Package, Truck, TrendingDown, TrendingUp, Target, Calculator,
  ShieldCheck, ShieldAlert, ShieldX, Info, Zap, BarChart3, Sparkles,
  AlertTriangle, CreditCard, Banknote, Layers, Percent, Wallet, Lightbulb,
  RefreshCw,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types (unchanged)
// ─────────────────────────────────────────────────────────────
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface Inputs {
  productCost: string;
  sellingPrice: string;
  forwardFee: string;
  reverseFee: string;
  handlingCost: string;
  restockCost: string;
  marketingCost: string;
  pgFeePct: string;
  resellValue: string;
  codSharePct: string;
  codRtoPct: string;
  prepaidRtoPct: string;
  returnRatePct: string;
  monthlyOrders: string;
  prepaidDiscount: string;
  switchRatePct: string;
}

interface Metrics {
  cost: number; price: number; fwd: number; rev: number;
  handle: number; restock: number; mkt: number; pgFee: number; resell: number;
  codShare: number; codRto: number; prepaidRto: number; rto: number;
  ret: number; monthlyOrders: number; discount: number; switchRate: number;

  successProfit: number;
  rtoLoss: number;
  returnLoss: number;
  breakEvenRto: number;
  expectedProfit: number;
  roi: number;
  risk: RiskLevel;

  monthlyProfit: number;
  monthlyRtoLoss: number;
  capitalTied: number;

  prepaidGainPerOrder: number;
  prepaidGainMonthly: number;

  codProfitPerOrder: number;
  prepaidProfitPerOrder: number;
}

// ─────────────────────────────────────────────────────────────
// Display-only helpers (never used in math)
// ─────────────────────────────────────────────────────────────
const num = (v: string, fb = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : fb;
};

const pct = (n: number, d = 1) =>
  Number.isFinite(n) ? `${(n * 100).toFixed(d)}%` : '—';

/** Full rupee string for tooltips / titles. */
function formatFullINR(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

/** Compact number without ₹. Guaranteed ≤ ~8 chars for any magnitude. */
function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e15) return sign + abs.toExponential(1);        // 1.0e+15
  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(1) + 'T'; // 1.0T
  if (abs >= 1e10) return sign + (abs / 1e9).toFixed(1) + 'B';  // 10.0B
  if (abs >= 1e7)  return sign + (abs / 1e7).toFixed(2) + ' Cr'; // 1.00 Cr
  if (abs >= 1e5)  return sign + (abs / 1e5).toFixed(2) + ' L';  // 1.00 L
  if (abs >= 1e4)  return sign + (abs / 1e3).toFixed(1) + 'K';   // 10.0K
  return sign + Math.round(abs).toString();
}

/** Compact rupee string. */
function formatCompactINR(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const s = formatCompactNumber(value);
  return s.startsWith('-') ? '-₹' + s.slice(1) : '₹' + s;
}

/** Ultra-tight rupee string for sensitivity pills (≤ 7 chars). */
function formatTightINR(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e15) return sign + '₹' + abs.toExponential(0);   // ₹1e+15
  if (abs >= 1e12) return sign + '₹' + (abs / 1e12).toFixed(1) + 'T';
  if (abs >= 1e9)  return sign + '₹' + (abs / 1e9).toFixed(1) + 'B';
  if (abs >= 1e7)  return sign + '₹' + (abs / 1e7).toFixed(1) + 'Cr';
  if (abs >= 1e5)  return sign + '₹' + (abs / 1e5).toFixed(1) + 'L';
  if (abs >= 1e4)  return sign + '₹' + (abs / 1e3).toFixed(1) + 'K';
  return sign + '₹' + Math.round(abs).toString();
}

/** Ratio → percent string, capped for display (used for ROI, capacity ratio). */
function formatRatioPct(ratio: number, d = 1): string {
  if (!Number.isFinite(ratio)) return '—';
  const p = ratio * 100;
  const abs = Math.abs(p);
  if (abs >= 1e9) return (p / 1e9).toFixed(2) + 'B%';
  if (abs >= 1e7) return (p / 1e7).toFixed(2) + 'Cr%';
  if (abs >= 1e5) return (p / 1e3).toFixed(1) + 'K%';
  if (abs >= 1e4) return '>9999%';
  return p.toFixed(d) + '%';
}

// ─────────────────────────────────────────────────────────────
// Math — UNCHANGED (byte-identical to previous version)
// ─────────────────────────────────────────────────────────────
function computeMetrics(s: Inputs): Metrics {
  const cost    = num(s.productCost);
  const price   = num(s.sellingPrice);
  const fwd     = num(s.forwardFee);
  const rev     = num(s.reverseFee);
  const handle  = num(s.handlingCost);
  const restock = num(s.restockCost);
  const mkt     = num(s.marketingCost);
  const pgFee   = (price * num(s.pgFeePct)) / 100;
  const resell  = num(s.resellValue);

  const codShare   = Math.min(1, num(s.codSharePct) / 100);
  const codRto     = Math.min(1, num(s.codRtoPct) / 100);
  const prepaidRto = Math.min(1, num(s.prepaidRtoPct) / 100);
  const rto        = codShare * codRto + (1 - codShare) * prepaidRto;
  const ret        = Math.min(1, num(s.returnRatePct) / 100);

  const monthlyOrders = Math.max(0, num(s.monthlyOrders));
  const discount      = num(s.prepaidDiscount);
  const switchRate    = Math.min(1, num(s.switchRatePct) / 100);

  const successProfit = price - cost - fwd - mkt - pgFee;
  const rtoLoss =
    Math.max(0, cost - resell) + fwd + rev + handle + restock + mkt;
  const returnLoss = rtoLoss + pgFee;

  const denom = successProfit + rtoLoss;
  const breakEvenRto = denom > 0 ? successProfit / denom : 0;

  const expectedProfit =
    (1 - rto) * (1 - ret) * successProfit -
    rto * rtoLoss -
    (1 - rto) * ret * returnLoss;

  const invested = cost + fwd + mkt;
  const roi = invested > 0 ? expectedProfit / invested : 0;

  const ratio = breakEvenRto > 0 ? rto / breakEvenRto : Infinity;
  let risk: RiskLevel;
  if (breakEvenRto <= 0 || ratio >= 1)      risk = 'critical';
  else if (ratio >= 0.8)                    risk = 'high';
  else if (ratio >= 0.5)                    risk = 'medium';
  else                                      risk = 'low';

  const monthlyProfit  = expectedProfit * monthlyOrders;
  const monthlyRtoLoss = rto * rtoLoss * monthlyOrders;
  const capitalTied    = monthlyOrders * rto * (14 / 30) * cost;

  const codProfitPerOrder =
    (1 - codRto) * (1 - ret) * successProfit -
    codRto * rtoLoss -
    (1 - codRto) * ret * returnLoss;

  const prepaidSuccess = successProfit - discount;
  const prepaidProfitPerOrder =
    (1 - prepaidRto) * (1 - ret) * prepaidSuccess -
    prepaidRto * rtoLoss -
    (1 - prepaidRto) * ret * returnLoss;

  const oldBlended =
    codShare * codProfitPerOrder + (1 - codShare) * prepaidProfitPerOrder;

  const newCodShare = codShare * (1 - switchRate);
  const newBlended =
    newCodShare * codProfitPerOrder + (1 - newCodShare) * prepaidProfitPerOrder;

  const prepaidGainPerOrder = newBlended - oldBlended;
  const prepaidGainMonthly  = prepaidGainPerOrder * monthlyOrders;

  return {
    cost, price, fwd, rev, handle, restock, mkt, pgFee, resell,
    codShare, codRto, prepaidRto, rto, ret, monthlyOrders, discount, switchRate,
    successProfit, rtoLoss, returnLoss, breakEvenRto, expectedProfit, roi, risk,
    monthlyProfit, monthlyRtoLoss, capitalTied,
    prepaidGainPerOrder, prepaidGainMonthly,
    codProfitPerOrder, prepaidProfitPerOrder,
  };
}

function riskStyles(r: RiskLevel) {
  switch (r) {
    case 'low':      return { tone: 'good',  label: 'Healthy',     Icon: ShieldCheck };
    case 'medium':   return { tone: 'warn',  label: 'Watch',       Icon: ShieldAlert };
    case 'high':     return { tone: 'warn',  label: 'High risk',   Icon: ShieldAlert };
    case 'critical': return { tone: 'bad',   label: 'Loss-making', Icon: ShieldX     };
  }
}

interface Rec { tone: 'good' | 'warn' | 'bad' | 'info'; title: string; body: string }

function buildRecommendations(m: Metrics): Rec[] {
  const out: Rec[] = [];

  if (m.breakEvenRto <= 0) {
    out.push({
      tone: 'bad',
      title: 'You lose money on every order',
      body: 'Success profit and RTO loss are both wrong-way. Fix unit economics — raise price, cut product cost, or renegotiate shipping — before anything else.',
    });
    return out;
  }

  const ratio = m.rto / m.breakEvenRto;
  if (ratio >= 1) {
    out.push({
      tone: 'bad',
      title: `RTO ${pct(m.rto)} ≥ break-even ${pct(m.breakEvenRto)}`,
      body: 'Scaling ads right now loses money. Fix the RTO rate below break-even first, then scale.',
    });
  } else if (ratio >= 0.8) {
    out.push({
      tone: 'warn',
      title: 'Approaching break-even',
      body: `RTO is at ${pct(ratio, 0)} of your break-even. One bad week flips you to loss-making. Target RTO ≤ ${pct(m.breakEvenRto * 0.5)} for a safe margin.`,
    });
  } else {
    out.push({
      tone: 'good',
      title: 'RTO is under control',
      body: `${pct(m.breakEvenRto - m.rto)} of headroom. This SKU is safe to scale ads on.`,
    });
  }

  if (m.codShare > 0.5) {
    out.push({
      tone: 'warn',
      title: `High COD share (${pct(m.codShare, 0)})`,
      body: 'COD orders carry 3–6x higher RTO than prepaid. Even nudging 10% of COD customers to prepaid through a small discount typically adds 5–15% to net profit.',
    });
  }

  if (m.prepaidGainMonthly > 0) {
    out.push({
      tone: 'good',
      title: `Prepaid incentive would gain ${formatCompactINR(m.prepaidGainMonthly)}/month`,
      body: `At ₹${m.discount} discount and ${pct(m.switchRate, 0)} switch rate, monthly profit improves by ${formatCompactINR(m.prepaidGainMonthly)}. Roll it out on one high-COD SKU first.`,
    });
  }

  if (m.successProfit > 0 && m.rtoLoss > m.successProfit * 1.5) {
    out.push({
      tone: 'warn',
      title: 'RTO loss dwarfs success profit',
      body: `Each RTO erases ${(m.rtoLoss / m.successProfit).toFixed(1)} successful orders. Cut reverse fees or improve resale recovery before scaling volume.`,
    });
  }

  if (m.cost > 0 && m.resell < m.cost * 0.3) {
    out.push({
      tone: 'info',
      title: 'Low resale recovery on returns',
      body: `You're only recovering ${pct(m.resell / m.cost, 0)} of product cost. Building a liquidation or refurb channel — even at 30% recovery — meaningfully improves break-even.`,
    });
  }

  const mktPct = m.price > 0 ? m.mkt / m.price : 0;
  if (mktPct > 0.15) {
    out.push({
      tone: 'warn',
      title: `Marketing burn is ${pct(mktPct, 0)} of price`,
      body: 'Every RTO burns 100% of the ad spend on that customer. Lower-CAC channels or organic push help more than ad-tweaking here.',
    });
  }

  if (m.ret > 0.1) {
    out.push({
      tone: 'warn',
      title: `Post-delivery returns at ${pct(m.ret)}`,
      body: 'Above 10% usually means sizing or expectation mismatch. Audit product photos, descriptions, and reviews before scaling.',
    });
  }

  out.push({
    tone: 'info',
    title: 'Playbook to cut RTO',
    body: 'Confirm COD via WhatsApp/IVR · block repeat-RTO pincodes · show real product photos · prepaid-only for high-risk SKUs · ship faster · refund delay is not a deterrent — a discount is.',
  });

  return out;
}

// ─────────────────────────────────────────────────────────────
// Presets + Defaults
// ─────────────────────────────────────────────────────────────
const DEFAULT_INPUTS: Inputs = {
  productCost: '350',
  sellingPrice: '999',
  forwardFee: '75',
  reverseFee: '85',
  handlingCost: '25',
  restockCost: '20',
  marketingCost: '150',
  pgFeePct: '2',
  resellValue: '200',
  codSharePct: '65',
  codRtoPct: '38',
  prepaidRtoPct: '5',
  returnRatePct: '8',
  monthlyOrders: '2000',
  prepaidDiscount: '50',
  switchRatePct: '12',
};

const PRESETS: { id: string; label: string; inputs: Inputs }[] = [
  {
    id: 'fashion',
    label: '👗 Fashion / Meesho  (₹599 • 32% COD RTO)',
    inputs: {
      productCost: '220', sellingPrice: '599',
      forwardFee: '65', reverseFee: '75',
      handlingCost: '15', restockCost: '10',
      marketingCost: '120', pgFeePct: '2', resellValue: '120',
      codSharePct: '72', codRtoPct: '32', prepaidRtoPct: '6',
      returnRatePct: '14', monthlyOrders: '2500',
      prepaidDiscount: '40', switchRatePct: '14',
    },
  },
  {
    id: 'electronics',
    label: '🎧 D2C Electronics  (₹1,499 • 18% COD RTO)',
    inputs: {
      productCost: '780', sellingPrice: '1499',
      forwardFee: '90', reverseFee: '100',
      handlingCost: '30', restockCost: '50',
      marketingCost: '220', pgFeePct: '2', resellValue: '650',
      codSharePct: '45', codRtoPct: '18', prepaidRtoPct: '3',
      returnRatePct: '6', monthlyOrders: '1200',
      prepaidDiscount: '100', switchRatePct: '22',
    },
  },
  {
    id: 'beauty',
    label: '💄 Beauty & Skincare  (₹799 • 22% COD RTO)',
    inputs: {
      productCost: '240', sellingPrice: '799',
      forwardFee: '70', reverseFee: '80',
      handlingCost: '20', restockCost: '15',
      marketingCost: '160', pgFeePct: '2', resellValue: '160',
      codSharePct: '58', codRtoPct: '22', prepaidRtoPct: '5',
      returnRatePct: '11', monthlyOrders: '1800',
      prepaidDiscount: '60', switchRatePct: '18',
    },
  },
];

// ─────────────────────────────────────────────────────────────
// Presentational components (mobile-safe)
// ─────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, title, tone = 'default', Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  title?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const valueTone = {
    default: 'text-zinc-900 dark:text-zinc-100',
    good:    'text-emerald-600 dark:text-emerald-400',
    warn:    'text-amber-600 dark:text-amber-400',
    bad:     'text-red-600 dark:text-red-400',
  }[tone];

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500 select-none dark:text-zinc-400">
        <span className="truncate">{label}</span>
        <Icon className="h-4 w-4 shrink-0" />
      </div>
      <div
        className={`mt-2 truncate text-xl font-bold tracking-tight sm:text-2xl ${valueTone}`}
        title={title ?? value}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-500"
          title={sub}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, suffix, hint, warn,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  hint?: string;
  warn?: string;
}) {
  return (
    <label className="block min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-zinc-700 select-none dark:text-zinc-300">
          {label}
        </span>
        {hint && (
          <span className="shrink-0 text-[10px] text-zinc-500 dark:text-zinc-500">
            {hint}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-8 text-sm text-zinc-900 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 select-none dark:text-zinc-500">
            {suffix}
          </span>
        )}
      </div>
      {warn && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 select-none dark:text-amber-400">
          <AlertTriangle className="h-3 w-3 shrink-0" /> {warn}
        </p>
      )}
    </label>
  );
}

function SliderField({
  label, value, onChange, min, max, step = 1, suffix, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  hint?: string;
}) {
  const v = num(value, min);
  return (
    <div className="block min-w-0">
      <Field label={label} value={value} onChange={onChange} suffix={suffix} hint={hint} />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, v))}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full accent-emerald-500"
      />
    </div>
  );
}

function Section({
  title, Icon, children,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-800 select-none dark:text-zinc-200">
        <Icon className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
        <span className="truncate">{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Profit vs RTO curve (SVG, mobile-safe, compact Y-axis)
// ─────────────────────────────────────────────────────────────
function ProfitCurve({ m }: { m: Metrics }) {
  const W = 560, H = 240, PAD = 52;
  const MAX_RTO = 60;

  const curve = useMemo(() => {
    const pts: { rto: number; profit: number }[] = [];
    for (let r = 0; r <= MAX_RTO; r += 2) {
      const f = r / 100;
      const p =
        (1 - f) * (1 - m.ret) * m.successProfit -
        f * m.rtoLoss -
        (1 - f) * m.ret * m.returnLoss;
      pts.push({ rto: r, profit: p });
    }
    return pts;
  }, [m]);

  const profits = curve.map((p) => p.profit);
  const minY = Math.min(0, ...profits);
  const maxY = Math.max(0, ...profits);
  const rangeY = maxY - minY || 1;

  const x = (r: number) => PAD + (r / MAX_RTO) * (W - 2 * PAD);
  const y = (p: number) => H - PAD - ((p - minY) / rangeY) * (H - 2 * PAD);

  const path = curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.rto).toFixed(1)} ${y(p.profit).toFixed(1)}`)
    .join(' ');

  const zeroY = y(0);
  const beX = m.breakEvenRto * 100;
  const curX = m.rto * 100;
  const curY = y(m.expectedProfit);

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-800 select-none dark:text-zinc-200">
          <BarChart3 className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
          <span className="truncate">Profit vs RTO rate</span>
        </div>
        <div className="hidden shrink-0 text-[11px] text-zinc-500 sm:block dark:text-zinc-500">
          per-order expected profit
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full max-w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <line
          x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY}
          strokeDasharray="3 3"
          className="stroke-zinc-400 dark:stroke-zinc-600"
          strokeWidth="1"
        />
        <text
          x={PAD - 6} y={zeroY + 4}
          className="fill-zinc-500 dark:fill-zinc-500"
          fontSize="10" textAnchor="end"
        >
          ₹0
        </text>

        {[0, 10, 20, 30, 40, 50, 60].map((r) => (
          <g key={r}>
            <line
              x1={x(r)} y1={PAD} x2={x(r)} y2={H - PAD}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth="1"
            />
            <text
              x={x(r)} y={H - PAD + 16}
              className="fill-zinc-500 dark:fill-zinc-400"
              fontSize="10" textAnchor="middle"
            >
              {r}%
            </text>
          </g>
        ))}

        {/* Compact Y-axis labels — never clip on mobile */}
        <text
          x={PAD - 6} y={y(maxY) + 4}
          className="fill-zinc-500 dark:fill-zinc-500"
          fontSize="10" textAnchor="end"
        >
          {formatCompactINR(maxY)}
        </text>
        <text
          x={PAD - 6} y={y(minY) + 4}
          className="fill-zinc-500 dark:fill-zinc-500"
          fontSize="10" textAnchor="end"
        >
          {formatCompactINR(minY)}
        </text>

        {beX > 0 && beX <= MAX_RTO && (
          <g>
            <line
              x1={x(beX)} y1={PAD} x2={x(beX)} y2={H - PAD}
              strokeDasharray="4 3"
              className="stroke-red-500 dark:stroke-red-400"
              strokeWidth="1.5"
            />
            <text
              x={x(beX)} y={PAD - 6}
              className="fill-red-600 dark:fill-red-400"
              fontSize="10" textAnchor="middle"
            >
              break-even {beX.toFixed(1)}%
            </text>
          </g>
        )}

        <path
          d={path}
          fill="none"
          className="stroke-cyan-600 dark:stroke-cyan-400"
          strokeWidth="2.5" strokeLinejoin="round"
        />

        {curX <= MAX_RTO && (
          <g>
            <circle
              cx={x(curX)} cy={curY} r="5"
              className="fill-amber-500 stroke-white dark:fill-amber-400 dark:stroke-zinc-950"
              strokeWidth="2"
            />
            <text
              x={x(curX)} y={curY - 10}
              className="fill-amber-600 dark:fill-amber-400"
              fontSize="10" textAnchor="middle"
            >
              you
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sensitivity heatmap — mobile-safe, compact pills, static classes
// ─────────────────────────────────────────────────────────────
function SensitivityHeatmap({ m }: { m: Metrics }) {
  const rtoSteps = [0.5, 0.75, 1.0, 1.25, 1.5];
  const resellSteps = [0, 0.25, 0.5, 0.75, 1.0];

  // Math UNCHANGED — same formula as before.
  const cellValues = useMemo(() => {
    return rtoSteps.map((rMul) => {
      const r = Math.min(1, m.rto * rMul);
      return resellSteps.map((resFrac) => {
        const resale = m.cost * resFrac;
        const rtoLoss =
          Math.max(0, m.cost - resale) + m.fwd + m.rev + m.handle + m.restock + m.mkt;
        const returnLoss = rtoLoss + m.pgFee;
        return (
          (1 - r) * (1 - m.ret) * m.successProfit -
          r * rtoLoss -
          (1 - r) * m.ret * returnLoss
        );
      });
    });
  }, [m]);

  const maxAbs = Math.max(1, ...cellValues.flat().map((v) => Math.abs(v)));

  // Static classes — Tailwind JIT-safe (no dynamic string interpolation)
  const cellClass = (v: number) => {
    const i = Math.min(1, Math.abs(v) / maxAbs);
    if (v >= 0) {
      if (i > 0.66) return 'bg-emerald-600 text-white dark:bg-emerald-500';
      if (i > 0.33) return 'bg-emerald-500/80 text-white dark:bg-emerald-600/80';
      if (i > 0.05) return 'bg-emerald-500/30 text-emerald-900 dark:bg-emerald-700/40 dark:text-emerald-100';
      return 'bg-emerald-500/10 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200';
    } else {
      if (i > 0.66) return 'bg-red-600 text-white dark:bg-red-500';
      if (i > 0.33) return 'bg-red-500/80 text-white dark:bg-red-600/80';
      if (i > 0.05) return 'bg-red-500/30 text-red-900 dark:bg-red-700/40 dark:text-red-100';
      return 'bg-red-500/10 text-red-900 dark:bg-red-900/30 dark:text-red-200';
    }
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-800 select-none dark:text-zinc-200">
        <Layers className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
        <span className="truncate">Sensitivity — profit per order</span>
      </div>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
        Rows: RTO rate (× current). Columns: resale recovery % of cost.
      </p>

      <div className="-mx-2 max-w-full overflow-x-auto px-2">
        <table className="w-full min-w-[320px] border-separate border-spacing-1 text-xs">
          <thead>
            <tr>
              <th className="px-1 py-1"></th>
              {resellSteps.map((f) => (
                <th
                  key={f}
                  className="px-1 py-1 text-center font-medium text-zinc-600 select-none dark:text-zinc-400"
                >
                  {Math.round(f * 100)}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rtoSteps.map((rm, i) => (
              <tr key={rm}>
                <td className="whitespace-nowrap px-1 py-1 text-zinc-600 select-none dark:text-zinc-400">
                  {Math.round(m.rto * rm * 100)}%
                  {rm === 1 && (
                    <span className="ml-1 text-[10px] text-cyan-600 dark:text-cyan-400">
                      now
                    </span>
                  )}
                </td>
                {cellValues[i].map((v, j) => (
                  <td key={j} className="p-0">
                    <div
                      className={`truncate rounded-lg px-2 py-1.5 text-center text-xs font-semibold ${cellClass(v)}`}
                      title={formatFullINR(v)}
                    >
                      {formatTightINR(v)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function ReturnsRTOAnalytics() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [targetRto, setTargetRto] = useState(15);

  const m = useMemo(() => computeMetrics(inputs), [inputs]);
  const recs = useMemo(() => buildRecommendations(m), [m]);

  const whatIfGainPer100 = useMemo(() => {
    const t = Math.min(1, targetRto / 100);
    const profitAtTarget =
      (1 - t) * (1 - m.ret) * m.successProfit -
      t * m.rtoLoss -
      (1 - t) * m.ret * m.returnLoss;
    return (profitAtTarget - m.expectedProfit) * 100;
  }, [m, targetRto]);

  const setField = (k: keyof Inputs) => (v: string) =>
    setInputs((p) => ({ ...p, [k]: v }));

  const applyPreset = (preset: Inputs) => setInputs({ ...preset });
  const resetDefaults = () => setInputs({ ...DEFAULT_INPUTS });

  const riskUI = riskStyles(m.risk);
  const riskBadge =
    m.risk === 'critical'
      ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
      : m.risk === 'high'
      ? 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300'
      : m.risk === 'medium'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';

  const riskBar =
    m.risk === 'critical' ? 'bg-red-500'
    : m.risk === 'high'   ? 'bg-orange-500'
    : m.risk === 'medium' ? 'bg-amber-500'
    : 'bg-emerald-500';

  const capacityRatio = m.breakEvenRto > 0 ? m.rto / m.breakEvenRto : 1;
  const capacityPct = Math.min(100, capacityRatio * 100);
  const sellingPriceWarn =
    num(inputs.sellingPrice) > 1_000_000
      ? 'Selling price above ₹10L — double-check.'
      : undefined;

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* ══════════════ GLASSMORPHIC HEADER + PRESETS ══════════════ */}
        <div className="mb-5 min-w-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 text-xl font-semibold sm:text-2xl">
                <RotateCcw className="h-6 w-6 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span className="truncate">Returns & RTO Analytics</span>
              </h1>
              <p className="mt-1 truncate text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
                Break-even RTO, money leaks, and COD → prepaid simulation.
              </p>
            </div>
            <button
              onClick={resetDefaults}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 select-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset to Default
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.inputs)}
                className="min-w-0 truncate rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-700 transition hover:bg-cyan-500/20 select-none dark:text-cyan-300"
                title={p.label}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          {/* ══════════════ INPUTS ══════════════ */}
          <div className="min-w-0 space-y-4 lg:col-span-1">
            <Section title="Product economics" Icon={Package}>
              <Field label="Product cost" value={inputs.productCost} onChange={setField('productCost')} suffix="₹" />
              <Field
                label="Selling price"
                value={inputs.sellingPrice}
                onChange={setField('sellingPrice')}
                suffix="₹"
                warn={sellingPriceWarn}
              />
              <Field label="Forward shipping" value={inputs.forwardFee} onChange={setField('forwardFee')} suffix="₹" />
              <Field label="Marketing / CAC per order" value={inputs.marketingCost} onChange={setField('marketingCost')} suffix="₹" />
              <Field label="Payment gateway fee" value={inputs.pgFeePct} onChange={setField('pgFeePct')} suffix="%" hint="of price" />
            </Section>

            <Section title="RTO / return costs" Icon={Truck}>
              <Field label="Reverse shipping" value={inputs.reverseFee} onChange={setField('reverseFee')} suffix="₹" />
              <Field label="Handling / QC / repack" value={inputs.handlingCost} onChange={setField('handlingCost')} suffix="₹" />
              <Field label="Restock / write-down" value={inputs.restockCost} onChange={setField('restockCost')} suffix="₹" />
              <Field label="Resale recovery per unit" value={inputs.resellValue} onChange={setField('resellValue')} suffix="₹" hint="refurb / liquidation" />
            </Section>

            <Section title="Order profile" Icon={Percent}>
              <SliderField
                label="COD share of orders"
                value={inputs.codSharePct}
                onChange={setField('codSharePct')}
                min={0} max={100} step={1}
                suffix="%"
              />
              <SliderField
                label="COD RTO rate"
                value={inputs.codRtoPct}
                onChange={setField('codRtoPct')}
                min={0} max={100} step={1}
                suffix="%"
              />
              <Field label="Prepaid RTO rate" value={inputs.prepaidRtoPct} onChange={setField('prepaidRtoPct')} suffix="%" />
              <Field label="Post-delivery returns" value={inputs.returnRatePct} onChange={setField('returnRatePct')} suffix="%" />
              <Field label="Monthly order volume" value={inputs.monthlyOrders} onChange={setField('monthlyOrders')} suffix="orders" />
            </Section>

            <Section title="Prepaid incentive (simulator)" Icon={CreditCard}>
              <SliderField
                label="Prepaid discount offer"
                value={inputs.prepaidDiscount}
                onChange={setField('prepaidDiscount')}
                min={0} max={500} step={5}
                suffix="₹"
              />
              <Field label="Est. COD → prepaid switch rate" value={inputs.switchRatePct} onChange={setField('switchRatePct')} suffix="%" hint="of COD customers" />
            </Section>
          </div>

          {/* ══════════════ RESULTS ══════════════ */}
          <div className="min-w-0 space-y-4 lg:col-span-2">
            {/* Top 4 KPI row — mobile-first single column */}
            <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Profit / good order"
                value={formatCompactINR(m.successProfit)}
                title={formatFullINR(m.successProfit)}
                tone={m.successProfit > 0 ? 'good' : 'bad'}
                Icon={TrendingUp}
              />
              <KpiCard
                label="Loss / RTO"
                value={formatCompactINR(m.rtoLoss)}
                title={formatFullINR(m.rtoLoss)}
                tone={m.rtoLoss > 0 ? 'bad' : 'good'}
                Icon={TrendingDown}
              />
              <KpiCard
                label="Break-even RTO"
                value={pct(m.breakEvenRto)}
                sub={`You're at ${pct(m.rto)}`}
                Icon={Target}
              />
              <KpiCard
                label="Expected profit / order"
                value={formatCompactINR(m.expectedProfit)}
                title={formatFullINR(m.expectedProfit)}
                sub={`ROI ${formatRatioPct(m.roi)}`}
                tone={m.expectedProfit > 0 ? 'good' : 'bad'}
                Icon={Calculator}
              />
            </div>

            {/* Risk + Loss waterfall */}
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className={`min-w-0 overflow-hidden rounded-xl border p-4 ${riskBadge}`}>
                <div className="flex items-center gap-2">
                  <riskUI.Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate text-sm font-semibold select-none">{riskUI.label}</span>
                </div>
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  Blended RTO{' '}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{pct(m.rto)}</span>{' '}
                  vs break-even{' '}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{pct(m.breakEvenRto)}</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div className={`h-full ${riskBar}`} style={{ width: `${capacityPct}%` }} />
                </div>
                <div className="mt-1 truncate text-[10px] text-zinc-500 dark:text-zinc-500">
                  {formatRatioPct(Math.min(1, capacityRatio), 0)} of break-even capacity
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-800 select-none dark:text-zinc-200">
                  <Zap className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="truncate">Where money leaks per RTO</span>
                </div>
                <ul className="space-y-1.5 text-xs">
                  {[
                    ['Product write-down', Math.max(0, m.cost - m.resell)],
                    ['Forward fee (wasted)', m.fwd],
                    ['Reverse fee', m.rev],
                    ['Handling / QC', m.handle],
                    ['Restock cost', m.restock],
                    ['Ad spend on failed order', m.mkt],
                  ].map(([label, val]) => (
                    <li key={label as string} className="flex items-center justify-between gap-2">
                      <span className="truncate text-zinc-600 dark:text-zinc-400">{label}</span>
                      <span
                        className="shrink-0 font-medium text-red-600 dark:text-red-400"
                        title={formatFullINR(-(val as number))}
                      >
                        -{formatCompactINR(val as number)}
                      </span>
                    </li>
                  ))}
                  <li className="mt-1 flex items-center justify-between gap-2 border-t border-zinc-200 pt-1.5 font-medium dark:border-zinc-800">
                    <span className="truncate text-zinc-800 dark:text-zinc-300">Net loss per RTO</span>
                    <span
                      className={`shrink-0 ${m.rtoLoss > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                      title={formatFullINR(m.rtoLoss)}
                    >
                      {formatCompactINR(m.rtoLoss)}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <ProfitCurve m={m} />

            {/* COD vs Prepaid + Prepaid incentive */}
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-800 select-none dark:text-zinc-200">
                  <Layers className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                  <span className="truncate">COD vs Prepaid</span>
                </div>

                <div className="flex h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div className="bg-orange-500" style={{ width: `${m.codShare * 100}%` }} />
                  <div className="bg-emerald-500" style={{ width: `${(1 - m.codShare) * 100}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-zinc-500 select-none dark:text-zinc-500">
                  <span>COD {pct(m.codShare, 0)}</span>
                  <span>Prepaid {pct(1 - m.codShare, 0)}</span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 truncate text-zinc-600 dark:text-zinc-400">
                      <Banknote className="h-3 w-3 shrink-0" /> COD RTO
                    </span>
                    <span className="shrink-0 font-medium text-orange-600 dark:text-orange-400">
                      {pct(m.codRto)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 truncate text-zinc-600 dark:text-zinc-400">
                      <CreditCard className="h-3 w-3 shrink-0" /> Prepaid RTO
                    </span>
                    <span className="shrink-0 font-medium text-emerald-600 dark:text-emerald-400">
                      {pct(m.prepaidRto)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-zinc-200 pt-1.5 dark:border-zinc-800">
                    <span className="truncate text-zinc-600 dark:text-zinc-400">Blended RTO</span>
                    <span className="shrink-0 font-semibold text-zinc-900 dark:text-zinc-100">
                      {pct(m.rto)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-800 select-none dark:text-zinc-200">
                  <Sparkles className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                  <span className="truncate">Prepaid incentive — impact</span>
                </div>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">
                  Offer ₹{m.discount} to prepaid · {pct(m.switchRate, 0)} of COD customers switch.
                </p>
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500 select-none dark:text-zinc-500">
                    Monthly profit delta
                  </div>
                  <div
                    className={`truncate text-xl font-semibold ${m.prepaidGainMonthly >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                    title={formatFullINR(m.prepaidGainMonthly)}
                  >
                    {m.prepaidGainMonthly >= 0 ? '+' : ''}
                    {formatCompactINR(m.prepaidGainMonthly)}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-500">
                  <span className="truncate">Per-order impact</span>
                  <span
                    className={`shrink-0 ${m.prepaidGainPerOrder >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                    title={formatFullINR(m.prepaidGainPerOrder)}
                  >
                    {m.prepaidGainPerOrder >= 0 ? '+' : ''}
                    {formatCompactINR(m.prepaidGainPerOrder)}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly scale */}
            <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-3">
              <KpiCard
                label="Monthly profit"
                value={formatCompactINR(m.monthlyProfit)}
                title={formatFullINR(m.monthlyProfit)}
                tone={m.monthlyProfit > 0 ? 'good' : 'bad'}
                sub={`${m.monthlyOrders.toLocaleString('en-IN')} orders`}
                Icon={TrendingUp}
              />
              <KpiCard
                label="Monthly RTO loss"
                value={formatCompactINR(m.monthlyRtoLoss)}
                title={formatFullINR(m.monthlyRtoLoss)}
                tone="bad"
                sub="burned on failed orders"
                Icon={TrendingDown}
              />
              <KpiCard
                label="Capital tied in RTO cycle"
                value={formatCompactINR(m.capitalTied)}
                title={formatFullINR(m.capitalTied)}
                sub="~14-day transit + QC"
                Icon={Wallet}
              />
            </div>

            <SensitivityHeatmap m={m} />

            {/* What-if slider */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-800 select-none dark:text-zinc-200">
                <Zap className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span className="truncate">What-if: reduce RTO to…</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={Math.max(10, Math.ceil(m.breakEvenRto * 100))}
                  value={targetRto}
                  onChange={(e) => setTargetRto(parseFloat(e.target.value))}
                  className="min-w-0 flex-1 accent-cyan-600 dark:accent-cyan-400"
                />
                <div className="w-16 shrink-0 text-right text-sm font-medium text-cyan-600 dark:text-cyan-400">
                  {targetRto}%
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="truncate text-xs text-zinc-500 select-none dark:text-zinc-500">
                    Profit / 100 orders now
                  </div>
                  <div
                    className={`truncate text-lg font-semibold ${m.expectedProfit * 100 >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                    title={formatFullINR(m.expectedProfit * 100)}
                  >
                    {formatCompactINR(m.expectedProfit * 100)}
                  </div>
                </div>
                <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="truncate text-xs text-zinc-500 select-none dark:text-zinc-500">
                    At {targetRto}% RTO
                  </div>
                  <div
                    className={`truncate text-lg font-semibold ${whatIfGainPer100 >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                    title={formatFullINR(whatIfGainPer100)}
                  >
                    {whatIfGainPer100 >= 0 ? '+' : ''}
                    {formatCompactINR(whatIfGainPer100)}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-800 select-none dark:text-zinc-200">
                <Lightbulb className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                <span className="truncate">What to do next</span>
              </div>
              <div className="space-y-2">
                {recs.map((r, i) => {
                  const toneMap: Record<Rec['tone'], string> = {
                    good: 'border-emerald-500/30 bg-emerald-500/5',
                    warn: 'border-amber-500/30 bg-amber-500/5',
                    bad:  'border-red-500/30 bg-red-500/5',
                    info: 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/60',
                  };
                  const iconTone: Record<Rec['tone'], string> = {
                    good: 'text-emerald-600 dark:text-emerald-400',
                    warn: 'text-amber-600 dark:text-amber-400',
                    bad:  'text-red-600 dark:text-red-400',
                    info: 'text-cyan-600 dark:text-cyan-400',
                  };
                  const Icon =
                    r.tone === 'good' ? TrendingUp :
                    r.tone === 'bad'  ? AlertTriangle :
                    r.tone === 'warn' ? AlertTriangle : Info;

                  return (
                    <div key={i} className={`min-w-0 overflow-hidden rounded-lg border p-3 ${toneMap[r.tone]}`}>
                      <div className="flex items-start gap-2">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconTone[r.tone]}`} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-zinc-900 select-none dark:text-zinc-100">
                            {r.title}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                            {r.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}