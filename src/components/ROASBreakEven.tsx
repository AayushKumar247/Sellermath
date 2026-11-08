// src/components/ROASBreakEven.tsx
import { useMemo, useState } from 'react';
import {
  Target, IndianRupee, TrendingUp, AlertTriangle, Wallet, BarChart3,
  Scale, Info, HelpCircle, Percent, Package, Truck, RotateCcw,
  Building2, Receipt, Copy, Check, ShoppingCart, Users, Layers,
  Lightbulb, ChevronDown, ChevronUp, TrendingDown, Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { InputCard } from './ui';

/* -------------------------------------------------------------------------- */
/*  Types & Defaults                                                          */
/* -------------------------------------------------------------------------- */

interface Inputs {
  aov: number;
  cogs: number;
  shippingCost: number;
  returnRate: number;
  returnShippingCost: number;
  paymentFeePercent: number;
  marketplaceFeePercent: number;
  fixedMonthlyCosts: number;
  adSpendGST: number;
  targetMonthlyRevenue: number;
  targetProfitMargin: number;
  currentAdSpend: number;
  currentROAS: number;
  repeatPurchaseRate: number;
  repeatPurchaseCount: number;
}

const DEFAULTS: Inputs = {
  aov: 1500,
  cogs: 500,
  shippingCost: 80,
  returnRate: 15,
  returnShippingCost: 100,
  paymentFeePercent: 2,
  marketplaceFeePercent: 0,
  fixedMonthlyCosts: 30000,
  adSpendGST: 18,
  targetMonthlyRevenue: 500000,
  targetProfitMargin: 15,
  currentAdSpend: 100000,
  currentROAS: 3.5,
  repeatPurchaseRate: 20,
  repeatPurchaseCount: 2,
};

const PRESETS: Record<string, { label: string; patch: Partial<Inputs> }> = {
  fashion: {
    label: '👗 Fashion D2C',
    patch: { returnRate: 30, returnShippingCost: 120, cogs: 600, shippingCost: 90, paymentFeePercent: 2 },
  },
  electronics: {
    label: '📱 Electronics',
    patch: { returnRate: 5, returnShippingCost: 200, cogs: 8500, aov: 12000, shippingCost: 250, paymentFeePercent: 2 },
  },
  beauty: {
    label: '💄 Beauty & Skincare',
    patch: { returnRate: 8, returnShippingCost: 60, cogs: 250, aov: 900, shippingCost: 60, paymentFeePercent: 2 },
  },
  home: {
    label: '🏠 Home & Kitchen',
    patch: { returnRate: 12, returnShippingCost: 180, cogs: 700, aov: 2000, shippingCost: 120, paymentFeePercent: 2 },
  },
  marketplace: {
    label: '🛒 Amazon Seller',
    patch: { marketplaceFeePercent: 15, returnRate: 8, paymentFeePercent: 0 },
  },
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function formatCurrency(val: number, decimals = 0): string {
  if (!isFinite(val)) return '—';
  const sign = val < 0 ? '-' : '';
  return `${sign}₹${Math.abs(val).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Compact Indian-format currency.
 * - ≥ ₹1 Cr: "₹1.50Cr"
 * - ≥ ₹1 L : "₹1.50L"
 * - ≥ ₹10 K: "₹15.0K"
 * - < ₹10 K: full precision (₹729.50, ₹1,500)
 * Always pair with title={formatCurrency(val, 2)} for hover-exact.
 */
function formatCompactINR(val: number): string {
  if (!isFinite(val)) return '—';
  const sign = val < 0 ? '-' : '';
  const abs = Math.abs(val);
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 10_000) return `${sign}₹${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₹${abs.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatX(val: number): string {
  if (!isFinite(val) || val <= 0) return '—';
  return `${val.toFixed(2)}x`;
}

/* -------------------------------------------------------------------------- */
/*  Core Calculation                                                          */
/* -------------------------------------------------------------------------- */

function computeMetrics(inputs: Inputs) {
  const r = clamp(inputs.returnRate, 0, 99.99) / 100;
  const payFee = clamp(inputs.paymentFeePercent, 0, 100) / 100;
  const mktFee = clamp(inputs.marketplaceFeePercent, 0, 100) / 100;
  const gst = 1 + clamp(inputs.adSpendGST, 0, 100) / 100;
  const delivered = 1 - r;
  const targetMargin = clamp(inputs.targetProfitMargin, 0, 100) / 100;

  // --- Per attempted order (before ad spend) ---
  const netRevenue = inputs.aov * delivered;
  const cogsEff = inputs.cogs * delivered;
  const shipOut = inputs.shippingCost;
  const shipReturn = r * inputs.returnShippingCost;
  const fees = inputs.aov * (payFee + mktFee) * delivered;
  const contribution = netRevenue - cogsEff - shipOut - shipReturn - fees;
  const contributionPct = inputs.aov > 0 ? (contribution / inputs.aov) * 100 : 0;
  const isProfitable = contribution > 0;

  // --- Unit-level thresholds ---
  const contributionPerDelivered = delivered > 0 ? contribution / delivered : 0;
  const maxCPA = contributionPerDelivered / gst;
  const breakEvenROAS = contribution > 0 ? (inputs.aov * gst) / contribution : 0;

  const targetProfitPerOrder = targetMargin * inputs.aov;
  const adSpendAllowed = contribution - targetProfitPerOrder;
  const targetROAS = adSpendAllowed > 0 ? (inputs.aov * gst) / adSpendAllowed : 0;

  // --- Volume for revenue target ---
  const deliveredTarget = inputs.aov > 0 ? inputs.targetMonthlyRevenue / inputs.aov : 0;
  const attemptsTarget = delivered > 0 ? deliveredTarget / delivered : 0;
  const totalContribution = attemptsTarget * contribution;
  const targetProfitTotal = targetMargin * inputs.targetMonthlyRevenue;
  const maxAdBudget = Math.max(0, (totalContribution - targetProfitTotal - inputs.fixedMonthlyCosts) / gst);

  // --- Current performance ---
  const curRevenue = inputs.currentAdSpend * inputs.currentROAS;
  const curAttempts = inputs.aov > 0 ? curRevenue / inputs.aov : 0;
  const curDelivered = curAttempts * delivered;
  const curContribution = curAttempts * contribution;
  const curEffectiveSpend = inputs.currentAdSpend * gst;
  const curProfit = curContribution - curEffectiveSpend - inputs.fixedMonthlyCosts;
  const curCPA = curDelivered > 0 ? curEffectiveSpend / curDelivered : 0;
  const curMargin = curRevenue > 0 ? (curProfit / curRevenue) * 100 : 0;

  /**
   * ADDITIVE: Net monthly break-even ROAS.
   * The ROAS needed for Net Monthly Profit = ₹0 at the CURRENT ad spend,
   * accounting for both 18% GST on ad spend AND fixed monthly costs.
   *
   *   profit(roas) = (adSpend × roas / aov) × contribution
   *                - adSpend × gst
   *                - fixedCosts        = 0
   *
   *   => roas = (adSpend × gst + fixedCosts) × aov / (adSpend × contribution)
   */
  const netBreakEvenROAS =
    inputs.currentAdSpend > 0 && contribution > 0
      ? ((inputs.currentAdSpend * gst + inputs.fixedMonthlyCosts) * inputs.aov) /
        (inputs.currentAdSpend * contribution)
      : Infinity;

  const curBeatsUnit = inputs.currentROAS >= breakEvenROAS;
  const curBeatsNet = isFinite(netBreakEvenROAS) && inputs.currentROAS >= netBreakEvenROAS;

  // --- LTV / CAC ---
  const repeat = clamp(inputs.repeatPurchaseRate, 0, 100) / 100;
  const ltv = contribution * (1 + repeat * inputs.repeatPurchaseCount);
  const ltvCAC = curCPA > 0 ? ltv / curCPA : 0;

  // --- Sensitivity table (profit at various ROAS, at current ad spend) ---
  const sensitivity = [1, 1.5, 2, 2.5, 3, 4, 5].map((roas) => {
    const rev = inputs.currentAdSpend * roas;
    const att = inputs.aov > 0 ? rev / inputs.aov : 0;
    const contrib = att * contribution;
    const profit = contrib - curEffectiveSpend - inputs.fixedMonthlyCosts;
    return { roas, revenue: rev, orders: Math.round(att * delivered), profit };
  });

  return {
    netRevenue, cogsEff, shipOut, shipReturn, fees, contribution,
    contributionPct, isProfitable, maxCPA, breakEvenROAS, targetROAS,
    adSpendAllowed, deliveredTarget, attemptsTarget, maxAdBudget,
    curRevenue, curDelivered, curContribution, curEffectiveSpend,
    curProfit, curCPA, curMargin, ltv, ltvCAC, sensitivity,
    targetProfitPerOrder, delivered,
    netBreakEvenROAS, curBeatsUnit, curBeatsNet,
  };
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export default function ROASBreakEven() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULTS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = (key: keyof Inputs, raw: string) => {
    const val = raw === '' ? 0 : parseFloat(raw);
    setInputs((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  };

  const applyPreset = (key: string) => {
    setInputs((prev) => ({ ...prev, ...PRESETS[key].patch }));
  };

  const m = useMemo(() => computeMetrics(inputs), [inputs]);

  const copySummary = async () => {
    const lines = [
      `ROAS Break-Even Analysis`,
      `-------------------------`,
      `AOV: ${formatCurrency(inputs.aov)}`,
      `Contribution / order: ${formatCurrency(m.contribution, 2)} (${m.contributionPct.toFixed(1)}%)`,
      `Unit Break-Even ROAS: ${formatX(m.breakEvenROAS)}`,
      `Net Monthly Break-Even ROAS: ${isFinite(m.netBreakEvenROAS) ? formatX(m.netBreakEvenROAS) : 'N/A'}`,
      `Target ROAS (${inputs.targetProfitMargin}% margin): ${formatX(m.targetROAS)}`,
      `Max CPA: ${formatCurrency(m.maxCPA)}`,
      `Max Ad Budget (target): ${formatCurrency(m.maxAdBudget)}`,
      `-------------------------`,
      `Current ROAS: ${formatX(inputs.currentROAS)}`,
      `Current Monthly Profit: ${formatCurrency(m.curProfit)}`,
      `LTV:CAC: ${m.ltvCAC.toFixed(2)}:1`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  /* ---------------------------------- UI ---------------------------------- */

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-8 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 select-none">
              ROAS &amp; Break-Even Ad Spend
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 select-none">
              Real unit economics — COGS, returns, fees, GST, fixed costs — not just AOV
            </p>
          </div>
        </div>
        <button
          onClick={copySummary}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors select-none shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy Summary'}
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 self-center mr-1 select-none">
          Quick presets:
        </span>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors select-none"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Core Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputCard
          label="Avg Order Value"
          hint="Selling price per order"
          icon={IndianRupee}
          prefix="₹"
          value={inputs.aov}
          onChange={(v) => update('aov', v)}
        />
        <InputCard
          label="COGS per Order"
          hint="Product + packaging cost"
          icon={Package}
          prefix="₹"
          value={inputs.cogs}
          onChange={(v) => update('cogs', v)}
        />
        <InputCard
          label="Shipping Cost"
          hint="Outbound delivery cost"
          icon={Truck}
          prefix="₹"
          value={inputs.shippingCost}
          onChange={(v) => update('shippingCost', v)}
        />
      </div>

      {/* ────────────────── LIVE CAMPAIGN SIMULATOR ────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 select-none">
                Live Campaign Simulator
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 select-none">
                Drag to see instant impact on your P&amp;L
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 select-none tracking-wider">
            LIVE
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <SliderControl
            label="Current ROAS"
            value={inputs.currentROAS}
            onChange={(v) => update('currentROAS', v)}
            min={0}
            max={10}
            step={0.1}
            suffix="x"
            icon={TrendingUp}
          />
          <SliderControl
            label="Monthly Ad Spend"
            value={inputs.currentAdSpend}
            onChange={(v) => update('currentAdSpend', v)}
            min={0}
            max={1000000}
            step={5000}
            prefix="₹"
            icon={Wallet}
          />
          <SliderControl
            label="Return / RTO Rate"
            value={inputs.returnRate}
            onChange={(v) => update('returnRate', v)}
            min={0}
            max={50}
            step={0.5}
            suffix="%"
            icon={RotateCcw}
          />
          <SliderControl
            label="Target Net Margin"
            value={inputs.targetProfitMargin}
            onChange={(v) => update('targetProfitMargin', v)}
            min={0}
            max={50}
            step={1}
            suffix="%"
            icon={Target}
          />
        </div>
      </div>

      {/* Advanced toggle — glassmorphic pill */}
      <button
        onClick={() => setShowAdvanced((s) => !s)}
        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 transition-all select-none shadow-sm"
      >
        <Layers className="w-4 h-4" />
        <span>{showAdvanced ? 'Hide' : 'Show'} advanced costs &amp; targets</span>
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Advanced Inputs */}
      {showAdvanced && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputCard
              label="Return Cost per Return"
              hint="Reverse shipping + restock"
              icon={RotateCcw}
              prefix="₹"
              value={inputs.returnShippingCost}
              onChange={(v) => update('returnShippingCost', v)}
            />
            <InputCard
              label="Payment Gateway Fee (%)"
              hint="Razorpay/Stripe etc."
              icon={Receipt}
              prefix="%"
              value={inputs.paymentFeePercent}
              onChange={(v) => update('paymentFeePercent', v)}
            />
            <InputCard
              label="Marketplace Fee (%)"
              hint="Amazon/Flipkart commission"
              icon={Receipt}
              prefix="%"
              value={inputs.marketplaceFeePercent}
              onChange={(v) => update('marketplaceFeePercent', v)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputCard
              label="Fixed Monthly Costs"
              hint="Salaries, rent, tools"
              icon={Building2}
              prefix="₹"
              value={inputs.fixedMonthlyCosts}
              onChange={(v) => update('fixedMonthlyCosts', v)}
            />
            <InputCard
              label="GST on Ad Spend (%)"
              hint="18% in India"
              icon={Receipt}
              prefix="%"
              value={inputs.adSpendGST}
              onChange={(v) => update('adSpendGST', v)}
            />
            <InputCard
              label="Target Monthly Revenue"
              hint="Gross revenue goal"
              icon={BarChart3}
              prefix="₹"
              value={inputs.targetMonthlyRevenue}
              onChange={(v) => update('targetMonthlyRevenue', v)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputCard
              label="Repeat Purchase Rate (%)"
              hint="% of customers who buy again"
              icon={Users}
              prefix="%"
              value={inputs.repeatPurchaseRate}
              onChange={(v) => update('repeatPurchaseRate', v)}
            />
            <InputCard
              label="Avg Repeat Orders"
              hint="Orders per repeat customer"
              icon={ShoppingCart}
              prefix="#"
              value={inputs.repeatPurchaseCount}
              onChange={(v) => update('repeatPurchaseCount', v)}
            />
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl px-4 py-3 flex items-start gap-2.5 border border-zinc-200 dark:border-zinc-800">
        <Info className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed select-none">
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">Unit Break-Even ROAS</span>{' '}
          covers per-order costs (COGS, returns, shipping, fees, GST on ad spend).{' '}
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">Net Monthly Break-Even ROAS</span>{' '}
          additionally covers your fixed monthly costs —{' '}
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">the number that actually decides monthly profitability</span>.
        </p>
      </div>

      {/* Key metrics grid — compact INR applied */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Contribution Margin"
          value={`${m.contributionPct.toFixed(1)}%`}
          subtitle={formatCompactINR(m.contribution) + ' per order'}
          exactTitle={`${formatCurrency(m.contribution, 2)} per order`}
          tone={m.isProfitable ? 'emerald' : 'red'}
          icon={TrendingUp}
        />
        <MetricCard
          label="Unit Break-Even ROAS"
          value={formatX(m.breakEvenROAS)}
          subtitle="Min ROAS (per-order)"
          tone={m.isProfitable ? 'amber' : 'red'}
          icon={Scale}
        />
        <MetricCard
          label={`Target ROAS (${inputs.targetProfitMargin}% margin)`}
          value={formatX(m.targetROAS)}
          subtitle="For your profit goal"
          tone="blue"
          icon={Target}
        />
        <MetricCard
          label="Max CPA"
          value={formatCompactINR(m.maxCPA)}
          exactTitle={formatCurrency(m.maxCPA, 2)}
          subtitle="Per delivered order"
          tone={m.isProfitable ? 'emerald' : 'red'}
          icon={Wallet}
        />
      </div>

      {/* Break-even hero with ROAS scale + pills */}
      <BreakEvenHero
        breakEvenROAS={m.breakEvenROAS}
        netBreakEvenROAS={m.netBreakEvenROAS}
        targetROAS={m.targetROAS}
        currentROAS={inputs.currentROAS}
        isProfitable={m.isProfitable}
        curBeatsUnit={m.curBeatsUnit}
        curBeatsNet={m.curBeatsNet}
        showTooltip={showTooltip}
        onToggleTooltip={() => setShowTooltip((s) => !s)}
      />

      {/* Max budget + Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="min-w-0 overflow-hidden relative rounded-2xl p-6 border-2 border-zinc-200 dark:border-zinc-700 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-blue-500 shrink-0">
              <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 select-none">
              Max Monthly Ad Budget
            </span>
          </div>
          <p
            className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400 tabular-nums truncate"
            title={formatCurrency(m.maxAdBudget)}
          >
            {formatCompactINR(m.maxAdBudget)}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 select-none">
            Spend more than this and you miss your {inputs.targetProfitMargin}% margin goal at{' '}
            <span title={formatCurrency(inputs.targetMonthlyRevenue)}>
              {formatCompactINR(inputs.targetMonthlyRevenue)}
            </span>{' '}
            revenue.
          </p>
        </div>

        <div className="min-w-0 overflow-hidden relative rounded-2xl p-6 border-2 border-zinc-200 dark:border-zinc-700 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-violet-500 shrink-0">
              <ShoppingCart className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 select-none">
              Orders to Hit Target
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-violet-600 dark:text-violet-400 tabular-nums truncate">
            {Math.ceil(m.deliveredTarget).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 select-none">
            Delivered orders at {formatCompactINR(inputs.aov)} AOV (
            {Math.ceil(m.attemptsTarget).toLocaleString('en-IN')} placed after returns)
          </p>
        </div>
      </div>

      {/* P&L breakdown with waterfall bars */}
      <PLBreakdown inputs={inputs} m={m} />

      {/* Current performance */}
      <CurrentPerformance inputs={inputs} m={m} />

      {/* Sensitivity table */}
      <SensitivityTable
        rows={m.sensitivity}
        breakEvenROAS={m.breakEvenROAS}
        netBreakEvenROAS={m.netBreakEvenROAS}
        currentROAS={inputs.currentROAS}
      />

      {/* Insights */}
      <InsightsPanel inputs={inputs} m={m} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

/* SliderControl */
function SliderControl({
  label, value, onChange, min, max, step, prefix, suffix, icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
}) {
  const sliderValue = Math.min(Math.max(value, min), max);
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 truncate select-none">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-0.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-2 py-1 border border-zinc-200 dark:border-zinc-700 shrink-0">
          {prefix && <span className="text-xs text-zinc-400 select-none">{prefix}</span>}
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-14 sm:w-16 text-right text-sm font-bold text-zinc-900 dark:text-zinc-100 bg-transparent outline-none tabular-nums"
          />
          {suffix && <span className="text-xs text-zinc-400 select-none">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={sliderValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full accent-emerald-500 cursor-pointer"
      />
    </div>
  );
}

/* Metric card */
type Tone = 'emerald' | 'amber' | 'red' | 'blue' | 'violet' | 'slate';

const TONE_MAP: Record<Tone, { bg: string; text: string; iconBg: string; border: string }> = {
  emerald: { bg: 'from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-emerald-600/5', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-500/30' },
  amber:   { bg: 'from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-600/5',     text: 'text-amber-600 dark:text-amber-400',     iconBg: 'bg-amber-500',   border: 'border-amber-200 dark:border-amber-500/30' },
  red:     { bg: 'from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-600/5',             text: 'text-red-600 dark:text-red-400',         iconBg: 'bg-red-500',     border: 'border-red-200 dark:border-red-500/30' },
  blue:    { bg: 'from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-600/5',       text: 'text-blue-600 dark:text-blue-400',       iconBg: 'bg-blue-500',    border: 'border-blue-200 dark:border-blue-500/30' },
  violet:  { bg: 'from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-600/5',   text: 'text-violet-600 dark:text-violet-400',   iconBg: 'bg-violet-500',  border: 'border-violet-200 dark:border-violet-500/30' },
  slate:   { bg: 'from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800',               text: 'text-zinc-700 dark:text-zinc-200',       iconBg: 'bg-zinc-500',    border: 'border-zinc-200 dark:border-zinc-700' },
};

function MetricCard({
  label, value, subtitle, exactTitle, tone, icon: Icon,
}: {
  label: string; value: string; subtitle: string; exactTitle?: string; tone: Tone; icon: React.ElementType;
}) {
  const t = TONE_MAP[tone];
  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl p-5 border-2 bg-gradient-to-br ${t.bg} ${t.border}`}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.iconBg} shrink-0`}>
          <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 leading-tight truncate select-none">
          {label}
        </span>
      </div>
      <p
        className={`text-2xl sm:text-3xl font-bold tracking-tight ${t.text} tabular-nums truncate`}
        title={exactTitle}
      >
        {value}
      </p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 truncate select-none" title={subtitle}>
        {subtitle}
      </p>
    </div>
  );
}

/* Hero with gauge + floating pills (sorted & clamped) */
function BreakEvenHero({
  breakEvenROAS, netBreakEvenROAS, targetROAS, currentROAS,
  isProfitable, curBeatsUnit, curBeatsNet, showTooltip, onToggleTooltip,
}: {
  breakEvenROAS: number;
  netBreakEvenROAS: number;
  targetROAS: number;
  currentROAS: number;
  isProfitable: boolean;
  curBeatsUnit: boolean;
  curBeatsNet: boolean;
  showTooltip: boolean;
  onToggleTooltip: () => void;
}) {
  const maxScale = Math.max(
    breakEvenROAS > 0 ? breakEvenROAS * 1.15 : 1,
    targetROAS > 0 ? targetROAS * 1.15 : 1,
    currentROAS > 0 ? currentROAS * 1.15 : 1,
    isFinite(netBreakEvenROAS) && netBreakEvenROAS > 0 ? netBreakEvenROAS * 1.15 : 1,
    1,
  );
  const pctOf = (v: number) => clamp(5 + (v / maxScale) * 90, 5, 95);

  // Build markers (filtered to plausible values)
  const markers = [
    { key: 'unitBE',  label: 'Unit BE',  value: breakEvenROAS,     dot: 'bg-amber-400',   pill: 'bg-amber-500/20 text-amber-300 border-amber-500/40', show: breakEvenROAS > 0 },
    { key: 'netBE',   label: 'Net BE',   value: netBreakEvenROAS, dot: 'bg-violet-400',  pill: 'bg-violet-500/20 text-violet-300 border-violet-500/40', show: isFinite(netBreakEvenROAS) && netBreakEvenROAS > 0 },
    { key: 'current', label: 'Current',  value: currentROAS,      dot: curBeatsNet ? 'bg-emerald-400' : 'bg-red-400', pill: curBeatsNet ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40', show: currentROAS > 0 },
    { key: 'target',  label: 'Target',   value: targetROAS,       dot: 'bg-blue-400',    pill: 'bg-blue-500/20 text-blue-300 border-blue-500/40', show: targetROAS > 0 && targetROAS < maxScale * 1.2 },
  ].filter((m) => m.show);

  // Sort by value, then assign positions with min-gap + clamping
  const sorted = [...markers].sort((a, b) => a.value - b.value);
  const MIN_GAP = 11;
  let lastPct = 5 - MIN_GAP;
  const positioned = sorted.map((m) => {
    let pct = pctOf(m.value);
    if (pct < lastPct + MIN_GAP) pct = lastPct + MIN_GAP;
    pct = clamp(pct, 5, 95);
    lastPct = pct;
    return { ...m, pct };
  });

  const statusPill = !isProfitable
    ? { label: 'UNPROFITABLE', cls: 'bg-red-500/15 text-red-400' }
    : curBeatsNet
      ? { label: 'NET-PROFITABLE', cls: 'bg-emerald-500/15 text-emerald-400' }
      : curBeatsUnit
        ? { label: 'COVERS UNIT COST ONLY', cls: 'bg-amber-500/15 text-amber-400' }
        : { label: 'LOSS-MAKING', cls: 'bg-red-500/15 text-red-400' };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 sm:p-8 border-2 transition-all duration-300 ${
        !isProfitable
          ? 'bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 border-red-900'
          : curBeatsNet
            ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-emerald-900'
            : 'bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 border-amber-800'
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none ${
          !isProfitable ? 'bg-red-500' : curBeatsNet ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      />

      <div className="relative z-10 min-w-0">
        <div className="flex items-start justify-between mb-6 gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xl shrink-0 ${
                !isProfitable ? 'bg-red-500' : curBeatsNet ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            >
              <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white select-none">
                Break-Even ROAS
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 select-none">
                Unit floor vs net monthly reality
              </p>
            </div>
          </div>
          <div className="relative shrink-0">
            <button
              onClick={onToggleTooltip}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors select-none"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Why?</span>
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-2xl z-20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-amber-400">Unit Break-Even</strong> covers per-order
                    costs (COGS, returns, shipping, fees, ad-spend GST).{' '}
                    <strong className="text-violet-400">Net Break-Even</strong> also covers your
                    fixed monthly costs — the number that actually determines if the business is
                    profitable this month.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Big numbers */}
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2 mb-6">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 select-none">
              Unit Break-Even
            </p>
            <p className={`text-4xl sm:text-6xl font-bold tracking-tight ${isProfitable ? 'text-amber-400' : 'text-red-400'} tabular-nums`}>
              {breakEvenROAS > 0 ? breakEvenROAS.toFixed(2) : '—'}
              <span className="text-2xl sm:text-3xl ml-1">x</span>
            </p>
          </div>
          {isFinite(netBreakEvenROAS) && netBreakEvenROAS > 0 && (
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1 select-none">
                Net Monthly Break-Even
              </p>
              <p className="text-4xl sm:text-6xl font-bold tracking-tight text-violet-400 tabular-nums">
                {netBreakEvenROAS.toFixed(2)}
                <span className="text-2xl sm:text-3xl ml-1">x</span>
              </p>
            </div>
          )}
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full mb-2 ${statusPill.cls} select-none`}>
            {statusPill.label}
          </span>
        </div>

        {/* Gauge track + floating pills (sorted, clamped, min-gap) */}
        <div className="mb-6">
          <div className="relative h-2 bg-slate-800 rounded-full overflow-visible">
            {/* Safe zone after net break-even */}
            {isFinite(netBreakEvenROAS) && netBreakEvenROAS > 0 && netBreakEvenROAS < maxScale && (
              <div
                className="absolute top-0 h-2 rounded-r-full bg-gradient-to-r from-emerald-500/40 to-emerald-400/60"
                style={{ left: `${pctOf(netBreakEvenROAS)}%`, right: 0 }}
              />
            )}
            {/* Dots */}
            {positioned.map((mk) => (
              <div
                key={mk.key}
                className={`absolute -top-1 w-4 h-4 -ml-2 rounded-full ${mk.dot} ring-2 ring-slate-900 shadow-lg`}
                style={{ left: `${pctOf(mk.value)}%` }}
                title={`${mk.label}: ${formatX(mk.value)}`}
              />
            ))}
          </div>
          {/* Floating pills above track — positioned & sorted */}
          <div className="relative h-8 mt-1">
            {positioned.map((mk) => (
              <div
                key={mk.key}
                className="absolute -translate-x-1/2"
                style={{ left: `${mk.pct}%` }}
                title={`${mk.label}: ${formatX(mk.value)}`}
              >
                <span
                  className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${mk.pill} select-none`}
                >
                  {mk.label} {formatX(mk.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status block */}
        <div
          className={`flex items-start gap-3 p-4 rounded-xl ${
            !isProfitable
              ? 'bg-red-500/10 text-red-300'
              : curBeatsNet
                ? 'bg-emerald-500/10 text-emerald-300'
                : curBeatsUnit
                  ? 'bg-amber-500/10 text-amber-300'
                  : 'bg-red-500/10 text-red-300'
          }`}
        >
          {curBeatsNet ? (
            <TrendingUp className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : curBeatsUnit ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <TrendingDown className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-semibold leading-relaxed">
            {!isProfitable
              ? 'Your costs exceed your selling price — no ROAS can make you profitable. Fix pricing or COGS first.'
              : curBeatsNet
                ? `You're at ${formatX(currentROAS)} vs net break-even ${formatX(netBreakEvenROAS)} — cushion of ${formatX(currentROAS - netBreakEvenROAS)}. Profitable after GST and fixed costs. Safe to scale.`
                : curBeatsUnit && isFinite(netBreakEvenROAS)
                  ? `You're at ${formatX(currentROAS)} — clears unit break-even (${formatX(breakEvenROAS)}) but still LOSES money after ${inputs_gstText()} / fixed costs. Need ${formatX(netBreakEvenROAS)} to reach ₹0 net monthly profit.`
                  : `You're at ${formatX(currentROAS)} vs unit break-even ${formatX(breakEvenROAS)} — LOSING money on every sale. Pause scaling now.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function inputs_gstText() {
  return '18% Ad GST'; // static mirror; safe because we surface only via Hero text
}

/* Unit Economics with waterfall bars */
function PLBreakdown({ inputs, m }: { inputs: Inputs; m: ReturnType<typeof computeMetrics> }) {
  const rows: Array<{
    label: string;
    value: number;
    pct: number;
    note?: string;
    bold?: boolean;
    barColor: string;
  }> = [
    { label: 'Gross Revenue (AOV)', value: inputs.aov, pct: 100, note: 'per order placed', barColor: 'bg-zinc-400 dark:bg-zinc-500' },
    {
      label: `Returns (−${inputs.returnRate}%)`,
      value: -inputs.aov * (inputs.returnRate / 100),
      pct: inputs.returnRate,
      note: `${inputs.returnRate}% of orders refunded`,
      barColor: 'bg-red-400',
    },
    { label: 'COGS', value: -m.cogsEff, pct: inputs.aov > 0 ? (m.cogsEff / inputs.aov) * 100 : 0, note: `${formatCompactINR(inputs.cogs)} × ${(m.delivered * 100).toFixed(0)}% delivered`, barColor: 'bg-orange-400' },
    { label: 'Outbound Shipping', value: -m.shipOut, pct: inputs.aov > 0 ? (m.shipOut / inputs.aov) * 100 : 0, note: 'paid even if returned', barColor: 'bg-yellow-400' },
    { label: 'Return Shipping', value: -m.shipReturn, pct: inputs.aov > 0 ? (m.shipReturn / inputs.aov) * 100 : 0, note: `${formatCompactINR(inputs.returnShippingCost)} × ${inputs.returnRate}%`, barColor: 'bg-amber-400' },
    { label: `Payment Fee (${inputs.paymentFeePercent}%)`, value: -inputs.aov * (inputs.paymentFeePercent / 100) * m.delivered, pct: inputs.aov > 0 ? ((inputs.aov * (inputs.paymentFeePercent / 100) * m.delivered) / inputs.aov) * 100 : 0, note: 'reversed on refunds', barColor: 'bg-pink-400' },
    { label: `Marketplace Fee (${inputs.marketplaceFeePercent}%)`, value: -inputs.aov * (inputs.marketplaceFeePercent / 100) * m.delivered, pct: inputs.aov > 0 ? ((inputs.aov * (inputs.marketplaceFeePercent / 100) * m.delivered) / inputs.aov) * 100 : 0, note: 'reversed on refunds', barColor: 'bg-fuchsia-400' },
    { label: 'Contribution Margin', value: m.contribution, pct: inputs.aov > 0 ? (m.contribution / inputs.aov) * 100 : 0, note: 'what you keep before ads & fixed costs', bold: true, barColor: 'bg-emerald-500' },
    { label: 'Max Ad Spend / Order', value: m.contribution / (1 + inputs.adSpendGST / 100), pct: inputs.aov > 0 ? (m.contribution / (1 + inputs.adSpendGST / 100) / inputs.aov) * 100 : 0, note: `pre-GST (${inputs.adSpendGST}% GST applied)`, barColor: 'bg-indigo-400' },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <Layers className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 select-none">
          Unit Economics Breakdown
        </h3>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-2 select-none">per order placed</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {rows.map((row, i) => {
          const pct = clamp(row.pct, 0, 100);
          return (
            <div key={i} className={`px-4 sm:px-6 py-3 min-w-0 ${row.bold ? 'bg-zinc-50 dark:bg-zinc-800/40' : ''}`}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="min-w-0">
                  <p className={`text-sm ${row.bold ? 'font-bold text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'} truncate select-none`}>
                    {row.label}
                  </p>
                  {row.note && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate select-none">
                      {row.note}
                    </p>
                  )}
                </div>
                <p
                  className={`text-sm font-semibold tabular-nums shrink-0 ${
                    row.value < 0
                      ? 'text-red-500 dark:text-red-400'
                      : row.bold
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-700 dark:text-zinc-200'
                  }`}
                  title={formatCurrency(row.value, 2)}
                >
                  {formatCompactINR(row.value)}
                </p>
              </div>
              <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${row.barColor} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Current Month Performance — 8 mini-cards, 2x4 responsive */
function CurrentPerformance({ inputs, m }: { inputs: Inputs; m: ReturnType<typeof computeMetrics> }) {
  const roasDelta = inputs.currentROAS - m.breakEvenROAS;
  const netDelta = isFinite(m.netBreakEvenROAS) ? inputs.currentROAS - m.netBreakEvenROAS : 0;
  const healthy = m.curProfit > 0;

  return (
    <div
      className={`rounded-2xl border-2 p-4 sm:p-6 transition-all min-w-0 overflow-hidden ${
        healthy
          ? 'bg-gradient-to-br from-zinc-900 to-zinc-800 border-zinc-700'
          : 'bg-gradient-to-br from-zinc-900 to-red-950 border-red-900'
      }`}
    >
      <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 ${healthy ? 'bg-emerald-500' : 'bg-red-500'}`}>
            <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white select-none">
              Current Month Performance
            </h3>
            <p className="text-xs text-slate-400 select-none">
              Based on your current ad spend &amp; ROAS
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-full select-none shrink-0 ${
            healthy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
          }`}
        >
          {healthy ? 'PROFITABLE' : 'LOSS-MAKING'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <DarkStat label="Monthly Revenue" value={formatCompactINR(m.curRevenue)} exact={formatCurrency(m.curRevenue)} />
        <DarkStat label="Contribution" value={formatCompactINR(m.curContribution)} exact={formatCurrency(m.curContribution)} />
        <DarkStat label="Ad Spend (+GST)" value={formatCompactINR(m.curEffectiveSpend)} exact={formatCurrency(m.curEffectiveSpend)} />
        <DarkStat
          label="Net Profit"
          value={formatCompactINR(m.curProfit)}
          exact={formatCurrency(m.curProfit)}
          tone={m.curProfit >= 0 ? 'emerald' : 'red'}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-2 sm:mt-3">
        <DarkStat label="Delivered Orders" value={Math.round(m.curDelivered).toLocaleString('en-IN')} />
        <DarkStat
          label="CPA"
          value={formatCompactINR(m.curCPA)}
          exact={`${formatCurrency(m.curCPA)} — max ${formatCurrency(m.maxCPA)}`}
          hint={`Max ${formatCompactINR(m.maxCPA)}`}
        />
        <DarkStat
          label="ROAS vs Unit BE"
          value={roasDelta >= 0 ? `+${roasDelta.toFixed(2)}x` : `${roasDelta.toFixed(2)}x`}
          tone={roasDelta >= 0 ? 'emerald' : 'red'}
        />
        <DarkStat
          label="ROAS vs Net BE"
          value={
            !isFinite(m.netBreakEvenROAS)
              ? 'N/A'
              : netDelta >= 0
                ? `+${netDelta.toFixed(2)}x`
                : `${netDelta.toFixed(2)}x`
          }
          tone={!isFinite(m.netBreakEvenROAS) ? 'slate' : netDelta >= 0 ? 'emerald' : 'red'}
          hint={isFinite(m.netBreakEvenROAS) ? `Net BE ${formatX(m.netBreakEvenROAS)}` : 'Costs > revenue'}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-2 sm:mt-3">
        <DarkStat label="Margin" value={`${m.curMargin.toFixed(1)}%`} tone={m.curMargin >= 0 ? 'emerald' : 'red'} />
        <DarkStat
          label="LTV : CAC"
          value={`${m.ltvCAC.toFixed(2)}:1`}
          tone={m.ltvCAC >= 3 ? 'emerald' : m.ltvCAC >= 1 ? 'amber' : 'red'}
          hint={m.ltvCAC >= 3 ? 'Healthy (≥3:1)' : 'Benchmark 3:1'}
        />
        <DarkStat label="LTV" value={formatCompactINR(m.ltv)} exact={formatCurrency(m.ltv)} />
        <DarkStat label="CPA (exact)" value={formatCompactINR(m.curCPA)} exact={formatCurrency(m.curCPA)} />
      </div>

      <p className="text-xs text-slate-500 mt-4 leading-relaxed select-none">
        Net profit = contribution − (ad spend × GST) − fixed costs. Passing unit break-even but
        missing net break-even means fixed costs and ad GST are eating your profit.
      </p>
    </div>
  );
}

function DarkStat({
  label, value, tone = 'slate', hint, exact,
}: {
  label: string; value: string; tone?: 'slate' | 'emerald' | 'red' | 'amber'; hint?: string; exact?: string;
}) {
  const text =
    tone === 'emerald' ? 'text-emerald-400' :
    tone === 'red' ? 'text-red-400' :
    tone === 'amber' ? 'text-amber-400' :
    'text-white';
  return (
    <div className="bg-slate-800/50 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5 border border-slate-700/50 min-w-0">
      <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wide font-semibold truncate select-none">
        {label}
      </p>
      <p
        className={`text-sm sm:text-lg font-bold tabular-nums truncate ${text}`}
        title={exact ?? value}
      >
        {value}
      </p>
      {hint && <p className="text-[10px] text-slate-500 mt-0.5 truncate select-none">{hint}</p>}
    </div>
  );
}

/* Sensitivity table — with UNIT BE + NET BE badges, mobile-responsive */
function SensitivityTable({
  rows, breakEvenROAS, netBreakEvenROAS, currentROAS,
}: {
  rows: Array<{ roas: number; revenue: number; orders: number; profit: number }>;
  breakEvenROAS: number;
  netBreakEvenROAS: number;
  currentROAS: number;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-zinc-500 shrink-0" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 select-none">
            ROAS Sensitivity — Monthly Profit
          </h3>
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 select-none">
          at {formatCompactINR(0)} ad spend
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] sm:text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <th className="text-left px-3 sm:px-6 py-2 font-semibold select-none">ROAS</th>
              <th className="text-right px-2 sm:px-4 py-2 font-semibold select-none">Revenue</th>
              <th className="text-right px-2 sm:px-4 py-2 font-semibold select-none hidden sm:table-cell">Orders</th>
              <th className="text-right px-3 sm:px-6 py-2 font-semibold select-none">Profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isUnitBE = Math.abs(row.roas - breakEvenROAS) < 0.15;
              const isNetBE = isFinite(netBreakEvenROAS) && Math.abs(row.roas - netBreakEvenROAS) < 0.15;
              const isCurrent = Math.abs(row.roas - currentROAS) < 0.15;
              return (
                <tr
                  key={row.roas}
                  className={`border-t border-zinc-100 dark:border-zinc-800 ${
                    isCurrent
                      ? 'bg-blue-50/60 dark:bg-blue-500/10'
                      : isNetBE
                        ? 'bg-violet-50/60 dark:bg-violet-500/10'
                        : isUnitBE
                          ? 'bg-amber-50/60 dark:bg-amber-500/10'
                          : ''
                  }`}
                >
                  <td className="px-3 sm:px-6 py-2.5 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{row.roas.toFixed(1)}x</span>
                      {isUnitBE && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 whitespace-nowrap">
                          UNIT BE
                        </span>
                      )}
                      {isNetBE && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-200 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300 whitespace-nowrap">
                          NET BE
                        </span>
                      )}
                      {isCurrent && !isUnitBE && !isNetBE && (
                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300 whitespace-nowrap">
                          CURRENT
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className="px-2 sm:px-4 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300 whitespace-nowrap"
                    title={formatCurrency(row.revenue)}
                  >
                    {formatCompactINR(row.revenue)}
                  </td>
                  <td className="px-2 sm:px-4 py-2.5 text-right tabular-nums text-zinc-500 dark:text-zinc-400 hidden sm:table-cell whitespace-nowrap">
                    {row.orders.toLocaleString('en-IN')}
                  </td>
                  <td
                    className={`px-3 sm:px-6 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap ${
                      row.profit >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                    title={formatCurrency(row.profit)}
                  >
                    {formatCompactINR(row.profit)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isFinite(netBreakEvenROAS) && netBreakEvenROAS > 0 && (
        <div className="px-4 sm:px-6 py-3 bg-violet-50 dark:bg-violet-500/10 border-t border-violet-200 dark:border-violet-500/20 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-violet-900 dark:text-violet-200 leading-relaxed select-none">
            <strong>Net Monthly Break-Even:</strong> {formatX(netBreakEvenROAS)} at your current ad
            spend. Below this, the unit economics are positive but fixed costs and 18% ad GST push
            you into a loss.
          </p>
        </div>
      )}
    </div>
  );
}

/* Insights — now aware of net break-even */
function InsightsPanel({ inputs, m }: { inputs: Inputs; m: ReturnType<typeof computeMetrics> }) {
  const insights: Array<{
    tone: 'danger' | 'warning' | 'success' | 'info';
    icon: React.ElementType;
    title: string;
    body: string;
  }> = [];

  if (!m.isProfitable) {
    insights.push({
      tone: 'danger',
      icon: AlertTriangle,
      title: 'Negative unit economics',
      body: `Every order loses ${formatCurrency(Math.abs(m.contribution), 2)} before ads. No ROAS can fix this — raise AOV, cut COGS, or reduce return rate immediately.`,
    });
  } else if (!m.curBeatsUnit) {
    insights.push({
      tone: 'danger',
      icon: TrendingDown,
      title: 'Currently losing money on every sale',
      body: `You're at ${formatX(inputs.currentROAS)} against a unit break-even of ${formatX(m.breakEvenROAS)}. Push ROAS above ${formatX(m.breakEvenROAS)} or cut ad spend to stop the bleed.`,
    });
  } else if (!m.curBeatsNet && isFinite(m.netBreakEvenROAS)) {
    insights.push({
      tone: 'warning',
      icon: AlertTriangle,
      title: 'Covers unit cost but loses money monthly',
      body: `Your ROAS of ${formatX(inputs.currentROAS)} clears unit break-even (${formatX(m.breakEvenROAS)}), but ${inputs.adSpendGST}% ad GST and ${formatCompactINR(inputs.fixedMonthlyCosts)} fixed costs still leave you ${formatCompactINR(m.curProfit)} in the red. Need ${formatX(m.netBreakEvenROAS)} for ₹0 net profit — ${formatX(m.netBreakEvenROAS - inputs.currentROAS)} more.`,
    });
  } else if (m.curBeatsNet && inputs.currentROAS < m.breakEvenROAS * 1.15) {
    insights.push({
      tone: 'warning',
      icon: AlertTriangle,
      title: 'Razor-thin ROAS cushion',
      body: `Only ${formatX(inputs.currentROAS - m.breakEvenROAS)} above unit break-even — a bad creative or auction shift wipes your margin. Don't scale aggressively.`,
    });
  } else {
    insights.push({
      tone: 'success',
      icon: TrendingUp,
      title: 'Healthy ROAS cushion',
      body: `${formatX(inputs.currentROAS - m.netBreakEvenROAS)} above net break-even. You can scale ad spend while monitoring ROAS for compression.`,
    });
  }

  if (inputs.returnRate >= 20) {
    insights.push({
      tone: 'warning',
      icon: RotateCcw,
      title: 'High return rate is eating margin',
      body: `${inputs.returnRate}% returns cost you ${formatCompactINR(m.shipReturn)} in reverse shipping alone per order, and reduce delivered revenue. Even a 5% reduction meaningfully lifts break-even ROAS.`,
    });
  }

  if (m.contributionPct < 20 && m.isProfitable) {
    insights.push({
      tone: 'warning',
      icon: Percent,
      title: 'Thin contribution margin',
      body: `At ${m.contributionPct.toFixed(1)}%, your margin gives almost no room to experiment. Target ≥30% for healthy scaling. Raise AOV or cut COGS.`,
    });
  }

  if (inputs.fixedMonthlyCosts > 0 && m.attemptsTarget > 0 && m.contribution > 0) {
    const fixedAsPct = (inputs.fixedMonthlyCosts / (m.attemptsTarget * m.contribution)) * 100;
    if (fixedAsPct > 40) {
      insights.push({
        tone: 'warning',
        icon: Building2,
        title: 'Fixed costs dominating',
        body: `Fixed costs consume ~${fixedAsPct.toFixed(0)}% of contribution at your target volume. Volume growth or overhead reduction needed to reach net break-even.`,
      });
    }
  }

  if (m.ltvCAC > 0 && m.ltvCAC < 3 && m.curCPA > 0) {
    insights.push({
      tone: 'warning',
      icon: Users,
      title: 'LTV:CAC below 3:1 benchmark',
      body: `Your LTV:CAC is ${m.ltvCAC.toFixed(2)}:1. Industry benchmark is 3:1. Improve repeat purchases or reduce CPA.`,
    });
  }

  if (m.ltvCAC >= 3 && m.curCPA > 0) {
    insights.push({
      tone: 'success',
      icon: Users,
      title: 'LTV:CAC in healthy range',
      body: `${m.ltvCAC.toFixed(2)}:1 — you can afford to spend more per acquisition and still profit on the relationship.`,
    });
  }

  if (m.curBeatsNet && inputs.currentROAS < m.targetROAS) {
    insights.push({
      tone: 'info',
      icon: Target,
      title: 'Above net break-even, below target',
      body: `You're profitable but not hitting your ${inputs.targetProfitMargin}% margin goal. Need ${formatX(m.targetROAS)} for that.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      tone: 'info',
      icon: Lightbulb,
      title: 'All clear',
      body: 'Unit economics look healthy. Keep an eye on ROAS compression as you scale.',
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 select-none">
          Actionable Insights
        </h3>
      </div>
      {insights.map((insight, i) => {
        const Icon = insight.icon;
        const tones = {
          danger: { bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30', icon: 'bg-red-500', text: 'text-red-900 dark:text-red-200', body: 'text-red-800/80 dark:text-red-200/70' },
          warning: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', icon: 'bg-amber-500', text: 'text-amber-900 dark:text-amber-200', body: 'text-amber-800/80 dark:text-amber-200/70' },
          success: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', icon: 'bg-emerald-500', text: 'text-emerald-900 dark:text-emerald-200', body: 'text-emerald-800/80 dark:text-emerald-200/70' },
          info: { bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/30', icon: 'bg-blue-500', text: 'text-blue-900 dark:text-blue-200', body: 'text-blue-800/80 dark:text-blue-200/70' },
        }[insight.tone];
        return (
          <div
            key={i}
            className={`rounded-xl border-2 ${tones.bg} ${tones.border} p-4 flex gap-3 min-w-0`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tones.icon}`}>
              <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${tones.text} select-none`}>{insight.title}</p>
              <p className={`text-xs ${tones.body} mt-1 leading-relaxed`}>{insight.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}