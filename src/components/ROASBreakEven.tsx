import { useState, useMemo } from 'react';
import {
  Target,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Wallet,
  BarChart3,
  Scale,
  Info,
  HelpCircle,
} from 'lucide-react';
import { InputCard } from './ui';

interface ROASState {
  aov: number;
  totalCost: number;
  targetRevenue: number;
}

function formatCurrency(val: number): string {
  const sign = val < 0 ? '-' : '';
  return `${sign}₹${Math.abs(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ROASBreakEven() {
  const [inputs, setInputs] = useState<ROASState>({
    aov: 1000,
    totalCost: 600,
    targetRevenue: 100000,
  });

  const [showTooltip, setShowTooltip] = useState(false);

  const updateInput = (key: keyof ROASState, raw: string) => {
    const val = raw === '' ? 0 : parseFloat(raw);
    setInputs((prev) => ({ ...prev, [key]: isNaN(val) ? 0 : val }));
  };

  const results = useMemo(() => {
    const { aov, totalCost, targetRevenue } = inputs;

    const grossProfit = aov - totalCost;
    const profitMargin = aov > 0 ? grossProfit / aov : 0;
    const profitMarginPercent = profitMargin * 100;
    const breakEvenROAS = profitMargin > 0 ? 1 / profitMargin : 0;
    const maxCPA = grossProfit;
    const ordersNeeded = aov > 0 ? targetRevenue / aov : 0;
    const maxAdBudget = maxCPA * ordersNeeded;
    const isProfitable = grossProfit > 0;

    return {
      grossProfit,
      profitMargin,
      profitMarginPercent,
      breakEvenROAS,
      maxCPA,
      ordersNeeded,
      maxAdBudget,
      isProfitable,
    };
  }, [inputs]);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">ROAS &amp; Break-Even Ad Spend</h2>
          <p className="text-sm text-slate-500">
            Find your break-even ROAS and maximum cost per acquisition
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InputCard
          label="Avg Order Value / Selling Price"
          hint="Revenue per order"
          icon={IndianRupee}
          prefix="₹"
          value={inputs.aov}
          onChange={(v) => updateInput('aov', v)}
        />
        <InputCard
          label="Total Cost per Order"
          hint="Product + shipping + marketplace fees"
          icon={Wallet}
          prefix="₹"
          value={inputs.totalCost}
          onChange={(v) => updateInput('totalCost', v)}
        />
        <InputCard
          label="Target Monthly Revenue"
          hint="Your monthly revenue goal"
          icon={BarChart3}
          prefix="₹"
          value={inputs.targetRevenue}
          onChange={(v) => updateInput('targetRevenue', v)}
        />
      </div>

      <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-start gap-2.5 border border-slate-200">
        <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Break-Even ROAS</span> is the minimum
          return on ad spend you need to avoid losing money. It's calculated as 1 ÷ Profit Margin.
          <span className="font-semibold text-slate-700"> Max CPA</span> is the most you can spend
          to acquire one customer without dipping into a loss — it equals your gross profit per
          order.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className={`relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300 ${
            results.isProfitable
              ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
              : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                  results.isProfitable ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              >
                <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-slate-600">
                Gross Profit Margin
              </span>
            </div>
          </div>
          <p
            className={`text-4xl font-bold tracking-tight ${
              results.isProfitable ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {results.profitMarginPercent.toFixed(2)}%
          </p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs text-slate-400">
              Gross Profit: {formatCurrency(results.grossProfit)} per order
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6 border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-slate-500">
                <Scale className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-slate-600">Gross Profit per Order</span>
            </div>
          </div>
          <p
            className={`text-4xl font-bold tracking-tight ${
              results.isProfitable ? 'text-slate-700' : 'text-red-600'
            }`}
          >
            {formatCurrency(results.grossProfit)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            AOV minus all costs per order
          </p>
        </div>
      </div>

      <BreakEvenROASCard
        breakEvenROAS={results.breakEvenROAS}
        isProfitable={results.isProfitable}
        showTooltip={showTooltip}
        onToggleTooltip={() => setShowTooltip((s) => !s)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MaxCPACard maxCPA={results.maxCPA} isProfitable={results.isProfitable} />

        <div className="relative overflow-hidden rounded-2xl p-6 border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-blue-500">
                <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-slate-600">Max Monthly Ad Budget</span>
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-blue-600">
            {formatCurrency(results.maxAdBudget)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Max CPA × orders needed ({Math.ceil(results.ordersNeeded)} orders) to reach your
            revenue target
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SummaryStat
          label="Orders to Hit Target"
          value={`${Math.ceil(results.ordersNeeded)}`}
          subtitle={`At ${formatCurrency(inputs.aov)} per order`}
          icon={Target}
        />
        <SummaryStat
          label="Revenue at Break-Even"
          value={formatCurrency(inputs.aov * Math.ceil(results.ordersNeeded))}
          subtitle="If all orders are at AOV"
          icon={IndianRupee}
        />
        <SummaryStat
          label="Profit if ROAS = Break-Even"
          value={formatCurrency(0)}
          subtitle="You break even — not a rupee more or less"
          icon={Scale}
        />
      </div>
    </div>
  );
}

interface BreakEvenROASCardProps {
  breakEvenROAS: number;
  isProfitable: boolean;
  showTooltip: boolean;
  onToggleTooltip: () => void;
}

function BreakEvenROASCard({
  breakEvenROAS,
  isProfitable,
  showTooltip,
  onToggleTooltip,
}: BreakEvenROASCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-8 border-2 transition-all duration-300 ${
        isProfitable
          ? 'bg-gradient-to-br from-amber-950 via-slate-900 to-slate-900 border-amber-800'
          : 'bg-gradient-to-br from-red-950 via-slate-900 to-slate-900 border-red-900'
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-25 ${
          isProfitable ? 'bg-amber-500' : 'bg-red-500'
        }`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xl ${
                isProfitable ? 'bg-amber-500' : 'bg-red-500'
              }`}
            >
              <AlertTriangle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Break-Even ROAS</h3>
              <p className="text-sm text-slate-400">
                The absolute minimum ROAS you must maintain on ads
              </p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={onToggleTooltip}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Why?</span>
            </button>
            {showTooltip && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-2xl z-10">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">
                    If your Facebook/Amazon ad ROAS drops below this number, you are losing money
                    on every sale. This is your hard floor — scale ads only when your actual ROAS
                    is comfortably above this.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end gap-4">
          <p
            className={`text-6xl sm:text-7xl font-bold tracking-tight ${
              isProfitable ? 'text-amber-400' : 'text-red-400'
            }`}
          >
            {breakEvenROAS > 0 ? breakEvenROAS.toFixed(2) : '—'}
            <span className="text-3xl sm:text-4xl ml-1">x</span>
          </p>
          <div className="mb-3 flex flex-col gap-1">
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full inline-block w-fit ${
                isProfitable
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-red-500/15 text-red-400'
              }`}
            >
              {isProfitable ? 'WARNING THRESHOLD' : 'UNPROFITABLE'}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div
            className={`flex items-center gap-3 p-4 rounded-xl ${
              isProfitable
                ? 'bg-amber-500/10 text-amber-300'
                : 'bg-red-500/10 text-red-300'
            }`}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-semibold leading-relaxed">
              {isProfitable
                ? `If your ad ROAS drops below ${breakEvenROAS.toFixed(2)}x, you are losing money on every sale.`
                : 'Your costs exceed your selling price — no ROAS will make you profitable. Fix your pricing or costs first.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Formula</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Break-Even ROAS = 1 ÷ Profit Margin
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Example</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                If your margin is 40%, your break-even ROAS is 1 ÷ 0.40 = 2.50x
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MaxCPACardProps {
  maxCPA: number;
  isProfitable: boolean;
}

function MaxCPACard({ maxCPA, isProfitable }: MaxCPACardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-8 border-2 transition-all duration-300 ${
        isProfitable
          ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700'
          : 'bg-gradient-to-br from-slate-900 to-red-950 border-red-900'
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 ${
          isProfitable ? 'bg-emerald-500' : 'bg-red-500'
        }`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xl ${
                isProfitable ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            >
              <Wallet className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Max CPA</h3>
              <p className="text-sm text-slate-400">
                Max you can spend to acquire one customer
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <p
            className={`text-5xl sm:text-6xl font-bold tracking-tight ${
              isProfitable ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(maxCPA)}
          </p>
          <span
            className={`text-sm font-semibold mb-2 px-3 py-1 rounded-full ${
              isProfitable
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            }`}
          >
            PER ORDER
          </span>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Formula</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Max CPA = Gross Profit per Order = AOV − Total Cost
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">What This Means</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isProfitable
                  ? 'Spend up to this amount per acquisition and still break even. Stay below it to profit.'
                  : 'Your cost exceeds your revenue — no ad spend is sustainable.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryStatProps {
  label: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
}

function SummaryStat({ label, value, subtitle, icon: Icon }: SummaryStatProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 transition-all duration-200 hover:shadow-lg hover:border-slate-300">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600" strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}
