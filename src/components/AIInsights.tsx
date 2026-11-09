import { useMemo, useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
  Target,
  Package,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AIInsightsProps {
  marketplaceName: string;
  categoryName: string;
  marketplaceGradient: string;
  marketplaceId?: string;
  sellingPrice: number;
  commissionRate: number;
  shippingFee: number;
  gstAmount: number;
  returnRate: number;
  netProfit: number;
  cogs: number;
  breakEvenPrice: number;
}

interface InsightSection {
  title: string;
  icon: React.ElementType;
  content: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retries a fetch on HTTP 503 (high demand), waiting 2s between tries, up to 3 retries. */
async function fetchWith503Retry(
  url: string,
  init: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let response: Response | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    response = await fetch(url, init);
    if (response.status !== 503 || attempt === maxRetries) {
      return response;
    }
    await wait(2000);
  }

  return response as Response;
}

function formatINR(val: number): string {
  const sign = val < 0 ? '-' : '';
  return `${sign}₹${Math.abs(val).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AIInsights({
  marketplaceName,
  categoryName,
  marketplaceGradient,
  marketplaceId,
  sellingPrice,
  commissionRate,
  shippingFee,
  gstAmount,
  returnRate,
  netProfit,
  cogs,
  breakEvenPrice,
}: AIInsightsProps) {
  const isBlinkit = marketplaceId === 'blinkit';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightSection[] | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      const response = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketplaceName,
          sellingPrice,
          commissionRate,
          shippingFee,
          gstAmount,
          returnRate,
          cogs,
          netProfit,
          breakEvenPrice,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const msg =
          errData?.error ||
          'AI analysis temporarily unavailable. Please try again later.';
        throw new Error(msg);
      }

      const data = await response.json();
      const text = data.text ?? '';

      if (!text) {
        throw new Error('The AI returned an empty response. Please try again.');
      }

      const parsed = parseInsights(text);
      setInsights(parsed);
    } catch (err) {
      console.error('AI Insights error:', err);
      setError(
        'Our AI engine is currently experiencing high demand. Your profit math remains 100% accurate—please try the AI insight again in a moment.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-slate-200 dark:border-zinc-800 overflow-hidden shadow-lg">
      {/* Header */}
      <div className={`bg-gradient-to-r ${marketplaceGradient} p-5 sm:p-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 bg-emerald-500" />
        <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${isBlinkit ? 'bg-slate-900/20 dark:bg-slate-800/30' : 'bg-white/20 dark:bg-white/10'} flex items-center justify-center backdrop-blur-sm`}>
              <Sparkles className={`w-6 h-6 ${isBlinkit ? 'text-slate-900 dark:text-zinc-100' : 'text-white dark:text-zinc-100'}`} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className={`text-lg sm:text-xl font-bold ${isBlinkit ? 'text-slate-900 dark:text-zinc-100' : 'text-white dark:text-zinc-100'} flex items-center gap-2`}>
                AI Strategic Insights
                <span className="text-emerald-400 dark:text-emerald-300">✨</span>
              </h3>
              <p className={`text-sm ${isBlinkit ? 'text-slate-900/80 dark:text-zinc-400' : 'text-white/80 dark:text-zinc-300'}`}>
                Get an AI-powered profitability report for your {marketplaceName} listing
              </p>
            </div>
          </div>
          <div className={`${isBlinkit ? 'bg-slate-900/15 text-slate-900 border-slate-900/25 dark:bg-zinc-800/50 dark:text-zinc-200 dark:border-zinc-700' : 'bg-white/15 backdrop-blur-sm text-white border-white/25 dark:bg-white/10 dark:text-zinc-200 dark:border-zinc-700'} text-xs font-semibold px-3.5 py-1.5 rounded-full border shadow-sm`}>
            {marketplaceName} ({categoryName})
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left: AI insights */}
          <div className="min-w-0">
            {/* Data preview chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              <DataChip label="Marketplace" value={marketplaceName} />
              <DataChip label="Selling Price" value={formatINR(sellingPrice)} />
              <DataChip label="Commission" value={`${commissionRate}%`} />
              <DataChip label="Shipping" value={formatINR(shippingFee)} />
              <DataChip label="RTO Rate" value={`${returnRate}%`} />
              <DataChip
                label="Net Profit"
                value={formatINR(netProfit)}
                tone={netProfit >= 0 ? 'positive' : 'negative'}
              />
            </div>

            {/* Analyze button */}
            {!loading && !insights && !error && (
              <button
                onClick={analyze}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 select-none focus:outline-none focus:ring-0"
              >
                <Sparkles className="w-5 h-5" />
                Analyze Profitability with AI
              </button>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-zinc-100 dark:border-zinc-800" />
                  <Loader2 className="w-16 h-16 text-emerald-500 animate-spin absolute inset-0 dark:text-emerald-400" strokeWidth={2.5} />
                </div>
                <p className="mt-4 text-sm font-semibold text-zinc-600 animate-pulse dark:text-zinc-300">
                  Crunching your numbers...
                </p>
                <p className="text-xs text-zinc-400 mt-1 dark:text-zinc-500">
                  AI is analyzing your profit metrics
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 dark:bg-red-950/30 dark:border-red-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 dark:bg-red-900/30">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">Analysis Failed</p>
                    <p className="text-xs text-red-600 mt-1 leading-relaxed dark:text-red-400">{error}</p>
                  </div>
                </div>
                <button
                  onClick={analyze}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors select-none focus:outline-none focus:ring-0 dark:bg-red-600 dark:hover:bg-red-500"
                >
                  <ArrowRight className="w-4 h-4 rotate-0" />
                  Try Again
                </button>
              </div>
            )}

            {insights && !loading && (
              <div className="space-y-4">
                {insights.map((section, i) => {
                  const Icon = section.icon || TrendingUp;
                  return (
                    <div
                      key={i}
                      className="bg-zinc-50 rounded-xl border border-zinc-200 overflow-hidden dark:bg-zinc-800/50 dark:border-zinc-700"
                    >
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-white border-b border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 dark:bg-emerald-900/30">
                          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                        </div>
                        <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-200">
                          {section.title}
                        </h4>
                        <span className="ml-auto text-[10px] font-bold text-zinc-300 uppercase tracking-wide dark:text-zinc-500">
                          Part {i + 1}
                        </span>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap dark:text-zinc-300">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={analyze}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors select-none focus:outline-none focus:ring-0 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <Sparkles className="w-4 h-4" />
                  Re-Analyze with Updated Data
                </button>
              </div>
            )}
          </div>

          {/* Right: visual analyzer */}
          <div className="lg:pl-6 lg:border-l lg:border-zinc-200 min-w-0 dark:lg:border-zinc-700">
            <StrategicVisualAnalyzer
              sellingPrice={sellingPrice}
              breakEvenPrice={breakEvenPrice}
              netProfit={netProfit}
              returnRate={returnRate}
              marketplaceName={marketplaceName}
              categoryName={categoryName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const RTO_DANGER_THRESHOLD = 15;

type AnalyzerRow = {
  name: string;
  current: number;
  breakEven: number;
  buffer: number;
};

function formatAxisINR(val: number): string {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
  return `₹${Math.round(val)}`;
}

function barLabel(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!n || n <= 0) return '';
  return formatINR(n);
}

function AnalyzerTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: number; color?: string; name?: string }>;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => (p.value ?? 0) > 0);
  if (rows.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white/95 px-3 py-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900/95">
      {rows.map((row) => (
        <div key={String(row.dataKey)} className="flex items-center gap-2 py-0.5">
          <span
            className="h-2 w-2 rounded-sm flex-shrink-0"
            style={{ backgroundColor: row.color }}
          />
          <span className="text-[11px] text-zinc-600 dark:text-zinc-300">{row.name}</span>
          <span className="ml-auto text-[11px] font-bold text-zinc-900 dark:text-white">
            {formatINR(row.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

function StrategicVisualAnalyzer({
  sellingPrice,
  breakEvenPrice,
  netProfit,
  returnRate,
  marketplaceName,
  categoryName,
}: {
  sellingPrice: number;
  breakEvenPrice: number;
  netProfit: number;
  returnRate: number;
  marketplaceName: string;
  categoryName: string;
}) {
  const profitBuffer = Math.max(0, sellingPrice - breakEvenPrice);
  const safeReturnRate = typeof returnRate === 'number' && !isNaN(returnRate) ? returnRate : 0;
  const isInDanger = safeReturnRate >= RTO_DANGER_THRESHOLD;
  // Dynamic progress bar width based directly on returnRate (capped at 100%)
  const currentMeterPct = Math.min(100, Math.max(0, safeReturnRate));
  const dangerMarkerPct = Math.min(100, RTO_DANGER_THRESHOLD);

  const data = useMemo<AnalyzerRow[]>(
    () => [
      {
        name: 'Current Price',
        current: Math.max(0, sellingPrice),
        breakEven: 0,
        buffer: 0,
      },
      {
        name: 'Break-Even Limit',
        current: 0,
        breakEven: Math.max(0, breakEvenPrice),
        buffer: profitBuffer,
      },
    ],
    [sellingPrice, breakEvenPrice, profitBuffer],
  );

  const xMax = Math.max(sellingPrice, breakEvenPrice, 1) * 1.08;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90 p-4 sm:p-5 h-full">
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 bg-blue-500 pointer-events-none dark:opacity-10" />

      <div className="relative z-10">
        <div className="flex items-start sm:items-center justify-between gap-4 w-full mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/20 flex items-center justify-center dark:bg-blue-500/10 dark:border-blue-400/30">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Strategic Visual Analyzer</h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">Live price vs break-even buffer</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide bg-zinc-100 text-zinc-800 border border-zinc-200 whitespace-nowrap dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
            {marketplaceName} ({categoryName})
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg bg-zinc-50 border border-zinc-200/80 px-2 py-2 dark:bg-zinc-800/80 dark:border-zinc-700/80">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide dark:text-blue-400">Current</p>
            <p className="text-xs font-bold text-zinc-900 mt-0.5 dark:text-zinc-100">{formatINR(sellingPrice)}</p>
          </div>
          <div className="rounded-lg bg-zinc-50 border border-zinc-200/80 px-2 py-2 dark:bg-zinc-800/80 dark:border-zinc-700/80">
            <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide dark:text-orange-400">Break-Even</p>
            <p className="text-xs font-bold text-zinc-900 mt-0.5 dark:text-zinc-100">{formatINR(breakEvenPrice)}</p>
          </div>
          <div className="rounded-lg bg-zinc-50 border border-zinc-200/80 px-2 py-2 dark:bg-zinc-800/80 dark:border-zinc-700/80">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide dark:text-emerald-400">Buffer</p>
            <p className={`text-xs font-bold mt-0.5 ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatINR(netProfit)}
            </p>
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 8, right: 28, left: 4, bottom: 4 }}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, xMax]}
                tickFormatter={formatAxisINR}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={118}
                tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                content={<AnalyzerTooltip />}
              />
              <Bar
                dataKey="current"
                name="Current Price"
                fill="#3b82f6"
                stackId="price"
                barSize={22}
                radius={[0, 6, 6, 0]}
              >
                <LabelList dataKey="current" position="right" formatter={barLabel} fill="#93c5fd" fontSize={10} />
              </Bar>
              <Bar
                dataKey="breakEven"
                name="Break-Even Limit"
                fill="#f97316"
                stackId="price"
                barSize={22}
                radius={profitBuffer > 0 ? [0, 0, 0, 0] : [0, 6, 6, 0]}
              >
                <LabelList dataKey="breakEven" position="inside" formatter={barLabel} fill="#fff7ed" fontSize={10} />
              </Bar>
              <Bar
                dataKey="buffer"
                name="Net Profit Buffer"
                fill="#10b981"
                stackId="price"
                barSize={22}
                radius={[0, 6, 6, 0]}
              >
                <LabelList dataKey="buffer" position="inside" formatter={barLabel} fill="#ecfdf5" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-2 mb-4">
          <LegendDot color="bg-blue-500" label="Current Price" />
          <LegendDot color="bg-orange-500" label="Break-Even Limit" />
          <LegendDot color="bg-emerald-500" label="Net Profit Buffer" />
        </div>

        <div
          className={`rounded-xl border p-3 ${
            isInDanger
              ? 'bg-rose-50/80 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-500/30 dark:text-rose-300'
              : 'bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-500/30 dark:text-amber-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isInDanger ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}
              strokeWidth={2.5}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${isInDanger ? 'text-rose-800 dark:text-rose-300' : 'text-amber-800 dark:text-amber-300'}`}>
                RTO Danger Zone
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                {isInDanger
                  ? `${safeReturnRate}% return rate sits in the ${RTO_DANGER_THRESHOLD}%+ risk area — RTO costs are eating into margin.`
                  : `${safeReturnRate}% return rate is below the ${RTO_DANGER_THRESHOLD}% danger threshold, but still a cost drag.`}
              </p>
              <div className="relative mt-2.5 h-2 rounded-full bg-zinc-200 overflow-hidden dark:bg-zinc-700">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${isInDanger ? 'bg-rose-500 dark:bg-rose-500' : 'bg-amber-400 dark:bg-amber-400'}`}
                  style={{ width: `${currentMeterPct}%` }}
                />
                <div
                  className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-rose-300/90 dark:bg-rose-400/90"
                  style={{ left: `${dangerMarkerPct}%` }}
                  title={`${RTO_DANGER_THRESHOLD}% danger threshold`}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-500">0%</span>
                <span className={`text-[10px] font-semibold ${isInDanger ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {safeReturnRate}% return rate
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-500">100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
      <span className={`h-2 w-2 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function DataChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'positive' | 'negative';
}) {
  const valueColor =
    tone === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'negative'
      ? 'text-red-600 dark:text-red-400'
      : 'text-zinc-700 dark:text-zinc-300';

  return (
    <div className="inline-flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 dark:bg-zinc-800 dark:border-zinc-700">
      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
        {label}
      </span>
      <span className={`text-xs font-bold ${valueColor}`}>{value}</span>
    </div>
  );
}

function parseInsights(text: string): InsightSection[] {
  const parts: InsightSection[] = [];

  const sectionPatterns: { title: string; icon: React.ElementType; keywords: string[] }[] = [
    { title: 'Break-Even Pricing', icon: Target, keywords: ['break-even', 'break even', 'pricing', 'part 1', 'part-1'] },
    { title: 'RTO Strategy', icon: Package, keywords: ['rto', 'return', 'part 2', 'part-2'] },
    { title: 'Inventory Viability', icon: CheckCircle2, keywords: ['inventory', 'viability', 'scale', 'paid ads', 'verdict', 'part 3', 'part-3'] },
  ];

  const lowerText = text.toLowerCase();

  const sectionIndices: { start: number; end: number; title: string; icon: React.ElementType }[] = [];
  for (const section of sectionPatterns) {
    let foundIdx = -1;
    for (const kw of section.keywords) {
      const idx = lowerText.indexOf(kw);
      if (idx !== -1) {
        if (foundIdx === -1 || idx < foundIdx) {
          foundIdx = idx;
        }
      }
    }
    if (foundIdx !== -1) {
      sectionIndices.push({ start: foundIdx, end: -1, title: section.title, icon: section.icon });
    }
  }

  sectionIndices.sort((a, b) => a.start - b.start);

  if (sectionIndices.length >= 2) {
    for (let i = 0; i < sectionIndices.length; i++) {
      const start = sectionIndices[i].start;
      const end = i + 1 < sectionIndices.length ? sectionIndices[i + 1].start : text.length;
      const raw = text.slice(start, end).trim();
      const cleaned = cleanSection(raw, sectionIndices[i].title);
      parts.push({ title: sectionIndices[i].title, icon: sectionIndices[i].icon, content: cleaned });
    }
  }

  if (parts.length === 0) {
    const fallback: InsightSection = {
      title: 'AI Analysis Report',
      icon: TrendingUp,
      content: text.trim(),
    };
    parts.push(fallback);
  }

  return parts;
}

function cleanSection(raw: string, expectedTitle: string): string {
  let cleaned = raw;

  const titlePatterns = [
    new RegExp(`^.*?${expectedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^:]*:\\s*`, 'i'),
    /^part\s*\d+\s*[:\-]?\s*/i,
    /^#{1,4}\s*/,
    /^\*\*[^*]+\*\*\s*:?\s*/,
  ];

  for (const pattern of titlePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  cleaned = cleaned.replace(/^\s*[-–—]\s*/, '').trim();

  return cleaned;
}

