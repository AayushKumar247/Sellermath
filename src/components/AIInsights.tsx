import { useState } from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  TrendingUp,
  Target,
  Package,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

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
      `Cost of Goods Sold (COGS): ${formatINR(cogs)}`,
      `Current Net Profit: ${formatINR(netProfit)}`,
      `Calculated Break-Even Price: ${formatINR(breakEvenPrice)}`,
    ].join('\n');

    const prompt = `You are an expert Indian e-commerce financial strategist. Analyze these metrics:\n${metrics}\n\nReturn a concise, 3-part strategic report formatted nicely.\nPart 1: Break-Even Pricing (Calculate exact minimum selling price to avoid a net loss).\nPart 2: RTO Strategy (Analyze the impact of the current RTO % and suggest one specific mitigation tactic).\nPart 3: Inventory Viability (Final verdict on whether this margin is healthy enough to scale with paid ads).\n\nFormat each part with a clear heading and keep the response under 300 words total.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

        {/* Loading state */}
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

        {/* Error state */}
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

        {/* Results */}
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

            {/* Re-analyze button */}
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
    </div>
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
