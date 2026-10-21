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
  sellingPrice,
  commissionRate,
  shippingFee,
  gstAmount,
  returnRate,
  netProfit,
  cogs,
  breakEvenPrice,
}: AIInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightSection[] | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setInsights(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      setLoading(false);
      setError(
        'AI analysis requires a Gemini API key. Add VITE_GEMINI_API_KEY to your .env file to enable this feature.',
      );
      return;
    }

    const metrics = [
      `Marketplace: ${marketplaceName}`,
      `Selling Price (incl. GST): ${formatINR(sellingPrice)}`,
      `Commission Rate: ${commissionRate}%`,
      `Shipping / Pick & Pack Fee: ${formatINR(shippingFee)}`,
      `GST + TCS/TDS Deductions: ${formatINR(gstAmount)}`,
      `RTO / Return Rate: ${returnRate}%`,
      `Cost of Goods (COGS): ${formatINR(cogs)}`,
      `Current Net Profit: ${formatINR(netProfit)}`,
      `Calculated Break-Even Price: ${formatINR(breakEvenPrice)}`,
    ].join('\n');

    const prompt = `You are an expert Indian e-commerce financial strategist. Analyze these metrics:\n${metrics}\n\nReturn a concise, 3-part strategic report formatted nicely.\nPart 1: Break-Even Pricing (Calculate exact minimum selling price to avoid a net loss).\nPart 2: RTO Strategy (Analyze the impact of the current RTO % and suggest one specific mitigation tactic).\nPart 3: Inventory Viability (Final verdict on whether this margin is healthy enough to scale with paid ads).\n\nFormat each part with a clear heading and keep the response under 300 words total.`;

    try {
      const response = await fetchWith503Retry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const msg =
          errData?.error?.message ||
          `Gemini API returned status ${response.status}. Check your API key and try again.`;
        throw new Error(msg);
      }

      const data = await response.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      if (!text) {
        throw new Error('The AI returned an empty response. Please try again.');
      }

      const parsed = parseInsights(text);
      setInsights(parsed);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong while contacting the AI service.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 bg-emerald-500" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              AI Strategic Insights
              <span className="text-emerald-400">✨</span>
            </h3>
            <p className="text-sm text-slate-400">
              Get an AI-powered profitability report for your {marketplaceName} listing
            </p>
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
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              >
                <Sparkles className="w-5 h-5" />
                Analyze Profitability with AI
              </button>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100" />
                  <Loader2 className="w-16 h-16 text-emerald-500 animate-spin absolute inset-0" strokeWidth={2.5} />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-600 animate-pulse">
                  Crunching your numbers...
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  AI is analyzing your profit metrics
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-700">Analysis Failed</p>
                    <p className="text-xs text-red-600 mt-1 leading-relaxed">{error}</p>
                  </div>
                </div>
                <button
                  onClick={analyze}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
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
                      className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-white border-b border-slate-200">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700">
                          {section.title}
                        </h4>
                        <span className="ml-auto text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                          Part {i + 1}
                        </span>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={analyze}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Re-Analyze with Updated Data
                </button>
              </div>
            )}
          </div>

          {/* Right: visual analyzer */}
          <div className="lg:pl-6 lg:border-l lg:border-slate-200 min-w-0">
            <StrategicVisualAnalyzer
              sellingPrice={sellingPrice}
              breakEvenPrice={breakEvenPrice}
              netProfit={netProfit}
              returnRate={returnRate}
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
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 shadow-xl">
      {rows.map((row) => (
        <div key={String(row.dataKey)} className="flex items-center gap-2 py-0.5">
          <span
            className="h-2 w-2 rounded-sm flex-shrink-0"
            style={{ backgroundColor: row.color }}
          />
          <span className="text-[11px] text-slate-300">{row.name}</span>
          <span className="ml-auto text-[11px] font-bold text-white">
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
}: {
  sellingPrice: number;
  breakEvenPrice: number;
  netProfit: number;
  returnRate: number;
}) {
  const profitBuffer = Math.max(0, sellingPrice - breakEvenPrice);
  const isInDanger = returnRate >= RTO_DANGER_THRESHOLD;
  const meterMax = Math.max(30, returnRate, RTO_DANGER_THRESHOLD);
  const currentMeterPct = Math.min(100, (returnRate / meterMax) * 100);
  const dangerMarkerPct = Math.min(100, (RTO_DANGER_THRESHOLD / meterMax) * 100);

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
    <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-4 sm:p-5 h-full">
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 bg-blue-500 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-blue-400" strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Strategic Visual Analyzer</h4>
            <p className="text-[11px] text-slate-400">Live price vs break-even buffer</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-lg bg-slate-800/80 border border-slate-700 px-2 py-2">
            <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wide">Current</p>
            <p className="text-xs font-bold text-white mt-0.5">{formatINR(sellingPrice)}</p>
          </div>
          <div className="rounded-lg bg-slate-800/80 border border-slate-700 px-2 py-2">
            <p className="text-[10px] font-semibold text-orange-300 uppercase tracking-wide">Break-Even</p>
            <p className="text-xs font-bold text-white mt-0.5">{formatINR(breakEvenPrice)}</p>
          </div>
          <div className="rounded-lg bg-slate-800/80 border border-slate-700 px-2 py-2">
            <p className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wide">Buffer</p>
            <p className={`text-xs font-bold mt-0.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, xMax]}
                tickFormatter={formatAxisINR}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={118}
                tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#475569' }}
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
              ? 'bg-red-500/10 border-red-500/40'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <ShieldAlert
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isInDanger ? 'text-red-400' : 'text-amber-400'}`}
              strokeWidth={2.5}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${isInDanger ? 'text-red-300' : 'text-amber-300'}`}>
                RTO Danger Zone
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {isInDanger
                  ? `${returnRate}% return rate sits in the ${RTO_DANGER_THRESHOLD}%+ risk area — RTO costs are eating into margin.`
                  : `${returnRate}% return rate is below the ${RTO_DANGER_THRESHOLD}% danger threshold, but still a cost drag.`}
              </p>
              <div className="relative mt-2.5 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${isInDanger ? 'bg-red-500' : 'bg-amber-400'}`}
                  style={{ width: `${currentMeterPct}%` }}
                />
                <div
                  className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-red-300/90"
                  style={{ left: `${dangerMarkerPct}%` }}
                  title={`${RTO_DANGER_THRESHOLD}% danger line`}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-500">0%</span>
                <span className="text-[10px] font-semibold text-red-300/80">
                  {RTO_DANGER_THRESHOLD}% risk area
                </span>
                <span className="text-[10px] text-slate-500">{Math.round(meterMax)}%</span>
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
    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
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
      ? 'text-emerald-600'
      : tone === 'negative'
      ? 'text-red-500'
      : 'text-slate-700';

  return (
    <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
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

