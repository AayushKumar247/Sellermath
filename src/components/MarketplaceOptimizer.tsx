import { useState, useCallback } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Rocket,
  LayoutList,
  FileText,
} from 'lucide-react';

type Marketplace = 'Amazon India' | 'Flipkart' | 'Meesho' | 'Myntra';

const MARKETPLACE_GUIDANCE: Record<Marketplace, string> = {
  'Amazon India':
    'Amazon India: SEO-rich, keyword-dense title; longer, detailed benefit-led bullets (exactly 5); comprehensive description covering features, usage, and warranty.',
  Flipkart:
    'Flipkart: concise, scannable title and exactly 5 bullets; lead with key specifications, dimensions, and material; plain Indian-English phrasing.',
  Meesho:
    'Meesho: simple, plain-language exactly 5 bullets; value and affordability focused; short sentences, minimal jargon.',
  Myntra:
    'Myntra: fashion-focused title; exactly 5 bullets covering fabric, fit, style, care, and occasion; trendy aspirational description.',
};

interface ListingResult {
  title: string;
  description: string;
  highlights: string[];
}

const glass =
  'rounded-2xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl dark:shadow-black/80';
const inputCls =
  'w-full text-base font-medium text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800/50 rounded-xl border border-zinc-200/80 dark:border-zinc-700 px-4 py-3 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all';

export default function MarketplaceOptimizer() {
  const [productName, setProductName] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [marketplace, setMarketplace] = useState<Marketplace>('Amazon India');
  const [result, setResult] = useState<ListingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<{
    title: boolean;
    bullets: boolean;
    description: boolean;
  }>({ title: false, bullets: false, description: false });

  const generateListing = useCallback(async () => {
    if (!productName.trim() || !keyFeatures.trim()) {
      setError('Please enter both the product name and key features.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          category: marketplace,
          keyFeatures: keyFeatures.trim(),
          targetKeywords: '',
        }),
      });
      if (!response.ok) throw new Error('Failed to generate listing');
      const data = await response.json();
      setResult({
        title: data.title || productName.trim(),
        description: data.description || '',
        highlights: Array.isArray(data.highlights) ? data.highlights.slice(0, 5) : [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while generating the listing.');
    } finally {
      setLoading(false);
    }
  }, [productName, keyFeatures, marketplace]);

  const copyToClipboard = async (text: string, kind: 'title' | 'bullets' | 'description') => {
    await navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [kind]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [kind]: false })), 2000);
  };

  const bulletsText = result?.highlights.map((b, i) => `${i + 1}. ${b}`).join('\n') || '';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className={glass}>
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="w-6 h-6 text-emerald-500" />
          <h1 className="text-2xl font-bold dark:text-zinc-50 text-zinc-900 tracking-tight select-none">
            Marketplace Listing Optimizer
          </h1>
        </div>
        <p className="text-sm dark:text-zinc-400 text-zinc-600 select-none">
          Generate AI-optimized titles, bullet points, and descriptions tailored to your target marketplace.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className={glass}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4 select-none">
            Listing Details
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 select-none">
                Base Product Name
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 select-none">
                e.g. Cotton Printed Kurta
              </p>
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter base product name"
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 select-none">
                Key Features / Specs
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 select-none">
                Materials, dimensions, use cases, warranty
              </p>
              <textarea
                value={keyFeatures}
                onChange={(e) => setKeyFeatures(e.target.value)}
                placeholder="100% cotton, relaxed fit, machine wash, pocket detail..."
                rows={4}
                className={`${inputCls} resize-none min-h-[120px]`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 select-none">
                Target Marketplace
              </label>
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value as Marketplace)}
                className={inputCls}
              >
                {(['Amazon India', 'Flipkart', 'Meesho', 'Myntra'] as Marketplace[]).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 select-none italic">
                {MARKETPLACE_GUIDANCE[marketplace].split('; ')[0]}
              </p>
            </div>
            {error && (
              <div className="rounded-lg bg-red-50/50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/60 p-3 text-sm text-red-700 dark:text-red-400 select-none">
                {error}
              </div>
            )}
            <button
              onClick={generateListing}
              disabled={loading || !productName.trim() || !keyFeatures.trim()}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-base transition-all duration-200 select-none focus:outline-none focus:ring-0 ${
                loading || !productName.trim() || !keyFeatures.trim()
                  ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Generate Optimized Listing
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className={glass}>
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4 select-none">
            Generated Listing
          </h2>
          {!result ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 select-none">
                Fill in your product details
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1 select-none">
                Then click Generate Optimized Listing
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                    Title
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-zinc-900 dark:text-zinc-100 break-words select-none">
                    {result.title}
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.title, 'title')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-800/30 select-none focus:outline-none focus:ring-0"
                  >
                    {copied.title ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied.title ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Bullets */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                    Key Bullets ({result.highlights.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-zinc-900 dark:text-zinc-100 break-words whitespace-pre-line select-none">
                    {bulletsText}
                  </span>
                  <button
                    onClick={() => copyToClipboard(bulletsText, 'bullets')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-800/30 select-none focus:outline-none focus:ring-0"
                  >
                    {copied.bullets ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied.bullets ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                    Description
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-zinc-900 dark:text-zinc-100 break-words whitespace-pre-line select-none">
                    {result.description}
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.description, 'description')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-800/30 select-none focus:outline-none focus:ring-0"
                  >
                    {copied.description ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied.description ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}