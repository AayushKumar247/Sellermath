import { TrendingUp, TrendingDown, IndianRupee, Percent, Truck, Receipt, RotateCcw, Package, BarChart3 } from 'lucide-react';

interface WaterfallChartProps {
  revenue: number;
  commission: number;
  shipping: number;
  gst: number;
  rto: number;
  cogs: number;
  netProfit: number;
  marketplaceName: string;
}

interface WaterfallStep {
  label: string;
  shortLabel: string;
  value: number;
  type: 'start' | 'deduction' | 'end';
  icon: React.ElementType;
}

function formatINR(val: number): string {
  const sign = val < 0 ? '-' : '';
  return `${sign}₹${Math.abs(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function WaterfallChart({
  revenue,
  commission,
  shipping,
  gst,
  rto,
  cogs,
  netProfit,
  marketplaceName,
}: WaterfallChartProps) {
  const steps: WaterfallStep[] = [
    { label: 'Revenue', shortLabel: 'Revenue', value: revenue, type: 'start', icon: IndianRupee },
    { label: 'Commission + Closing Fee', shortLabel: 'Commission', value: -commission, type: 'deduction', icon: Percent },
    { label: 'Shipping Charges', shortLabel: 'Shipping', value: -shipping, type: 'deduction', icon: Truck },
    { label: 'GST + TCS/TDS', shortLabel: 'GST & Tax', value: -gst, type: 'deduction', icon: Receipt },
    { label: 'RTO / Return Charges', shortLabel: 'RTO', value: -rto, type: 'deduction', icon: RotateCcw },
    { label: 'Product Cost (COGS)', shortLabel: 'COGS', value: -cogs, type: 'deduction', icon: Package },
    { label: 'Real Profit', shortLabel: 'Profit', value: netProfit, type: 'end', icon: TrendingUp },
  ];

  const maxValue = revenue;
  const chartHeight = 280;
  const minBarHeight = 4;

  const runningTotals: number[] = [];
  let running = 0;
  for (const step of steps) {
    if (step.type === 'start') {
      running = step.value;
    } else if (step.type === 'deduction') {
      running += step.value;
    } else {
      running = step.value;
    }
    runningTotals.push(running);
  }

  const isProfit = netProfit >= 0;

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Real Earnings Breakdown</h3>
            <p className="text-sm text-slate-400">Waterfall view — {marketplaceName} profit structure</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* Chart Section */}
        <div className="lg:col-span-3 p-5 sm:p-6">
          <div className="relative" style={{ height: chartHeight + 60 }}>
            {/* Y-axis grid lines */}
            <div className="absolute left-0 right-0 top-0" style={{ height: chartHeight }}>
              {[0, 25, 50, 75, 100].map((pct) => (
                <div
                  key={pct}
                  className="absolute left-0 right-0 border-t border-dashed border-slate-100"
                  style={{ top: `${pct}%` }}
                >
                  <span className="absolute -top-2.5 left-0 text-[10px] text-slate-300 font-medium bg-white pr-2">
                    {formatINR(revenue * (100 - pct) / 100)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div
              className="absolute left-12 right-0 top-0 flex items-end justify-between gap-1 sm:gap-2"
              style={{ height: chartHeight }}
            >
              {steps.map((step, i) => {
                const StepIcon = step.icon;
                const isPositive = step.type === 'start' || step.type === 'end';
                const isFinalProfit = step.type === 'end';

                let barBottom = 0;
                let barHeight = 0;

                if (step.type === 'start') {
                  barBottom = 0;
                  barHeight = (Math.abs(step.value) / maxValue) * chartHeight;
                } else if (step.type === 'deduction') {
                  const topOfDeduction = runningTotals[i - 1] ?? 0;
                  const bottomOfDeduction = runningTotals[i] ?? 0;
                  barBottom = (Math.max(0, bottomOfDeduction) / maxValue) * chartHeight;
                  barHeight = (Math.abs(step.value) / maxValue) * chartHeight;
                } else if (step.type === 'end') {
                  barBottom = 0;
                  barHeight = (Math.abs(step.value) / maxValue) * chartHeight;
                }

                barHeight = Math.max(barHeight, minBarHeight);

                const barColor = isFinalProfit
                  ? isProfit
                    ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                    : 'bg-gradient-to-t from-red-500 to-red-400'
                  : isPositive
                  ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                  : 'bg-gradient-to-t from-red-500 to-rose-400';

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end relative h-full"
                  >
                    {/* Value label above bar */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] sm:text-xs font-bold pointer-events-none transition-all"
                      style={{
                        bottom: barBottom + barHeight + 6,
                      }}
                    >
                      <span className={isPositive ? 'text-emerald-600' : 'text-red-500'}>
                        {isPositive ? '' : '-'}
                        {formatINR(Math.abs(step.value)).replace('-', '')}
                      </span>
                    </div>

                    {/* The bar */}
                    <div
                      className={`w-full max-w-[48px] sm:max-w-[56px] rounded-t-md ${barColor} shadow-sm transition-all duration-500 hover:opacity-80 relative group`}
                      style={{
                        position: 'absolute',
                        bottom: barBottom,
                        height: barHeight,
                      }}
                    >
                      {/* Connector line to next bar */}
                      {i < steps.length - 1 && step.type === 'deduction' && (
                        <div
                          className="absolute top-0 -right-1 sm:-right-2 border-t-2 border-dashed border-slate-300"
                          style={{ width: '0.5rem' }}
                        />
                      )}
                      {i < steps.length - 1 && step.type === 'start' && (
                        <div
                          className="absolute top-0 -right-1 sm:-right-2 border-t-2 border-dashed border-slate-300"
                          style={{ width: '0.5rem' }}
                        />
                      )}

                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap bg-slate-900 text-white text-xs font-medium rounded-lg px-2.5 py-1.5 shadow-xl">
                        {step.label}: {isPositive ? '' : '-'}{formatINR(Math.abs(step.value)).replace('-', '')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div
              className="absolute left-12 right-0 flex justify-between gap-1 sm:gap-2"
              style={{ top: chartHeight + 8 }}
            >
              {steps.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center text-center">
                    <StepIcon
                      className={`w-3.5 h-3.5 mb-1 ${
                        step.type === 'start' || step.type === 'end'
                          ? step.type === 'end' && !isProfit
                            ? 'text-red-500'
                            : 'text-emerald-500'
                          : 'text-red-400'
                      }`}
                    />
                    <span className="text-[9px] sm:text-[11px] font-semibold text-slate-500 leading-tight hidden sm:block">
                      {step.shortLabel}
                    </span>
                    <span className="text-[8px] font-semibold text-slate-400 leading-tight sm:hidden">
                      {step.shortLabel.slice(0, 4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-emerald-600 to-emerald-400" />
              <span className="text-xs font-medium text-slate-500">Revenue / Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-red-500 to-rose-400" />
              <span className="text-xs font-medium text-slate-500">Deductions</span>
            </div>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-2 bg-slate-50 border-t lg:border-t-0 lg:border-l border-slate-200 p-5 sm:p-6">
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            Summary Overview
          </h4>

          <div className="space-y-2.5">
            <SummaryRow
              icon={IndianRupee}
              label="Revenue (Product Price)"
              value={revenue}
              color="emerald"
            />
            <div className="border-t border-slate-200 my-2" />
            <SummaryRow
              icon={Percent}
              label="Commission + Closing Fee"
              value={-commission}
              color="red"
              isDeduction
            />
            <SummaryRow
              icon={Truck}
              label="Shipping Charges"
              value={-shipping}
              color="red"
              isDeduction
            />
            <SummaryRow
              icon={Receipt}
              label="GST + TCS/TDS"
              value={-gst}
              color="red"
              isDeduction
            />
            <SummaryRow
              icon={RotateCcw}
              label="RTO / Return Charges"
              value={-rto}
              color="red"
              isDeduction
            />
            <SummaryRow
              icon={Package}
              label="Product Cost (COGS)"
              value={-cogs}
              color="red"
              isDeduction
            />
            <div className="border-t-2 border-slate-300 my-2" />
            <SummaryRow
              icon={isProfit ? TrendingUp : TrendingDown}
              label="Real Profit"
              value={netProfit}
              color={isProfit ? 'emerald' : 'red'}
              isBold
            />
          </div>

          {/* Profit margin badge */}
          <div className="mt-4 flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3">
            <span className="text-xs font-semibold text-slate-500">Profit Margin</span>
            <span
              className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                isProfit
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {revenue > 0 ? ((netProfit / revenue) * 100).toFixed(2) : '0.00'}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryRowProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'emerald' | 'red';
  isDeduction?: boolean;
  isBold?: boolean;
}

function SummaryRow({ icon: Icon, label, value, color, isDeduction, isBold }: SummaryRowProps) {
  const isNegative = value < 0;
  const valueColor = color === 'emerald' ? 'text-emerald-600' : 'text-red-500';
  const iconBg = color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500';

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
        <span className={`text-xs sm:text-sm ${isBold ? 'font-bold text-slate-800' : 'font-medium text-slate-600'} truncate`}>
          {label}
        </span>
      </div>
      <span className={`text-xs sm:text-sm ${isBold ? 'font-bold' : 'font-semibold'} ${valueColor} whitespace-nowrap`}>
        {isDeduction ? '-' : ''}{formatINR(Math.abs(value)).replace('-', '')}
      </span>
    </div>
  );
}
