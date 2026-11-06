import { useState } from 'react';
import { Sparkles, Copy, Check, Search, Tag, TrendingUp, AlertCircle } from 'lucide-react';
import { postCalculate } from '@/lib/calculateApi';

interface SEOKeywordsResponse {
  topSearchTerms: string[];
  platinumKeywords: string[];
  misspellings: string[];
}

export default function SEOKeywords() {
  const [productName, setProductName] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SEOKeywordsResponse | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!productName.trim()) {
      setError('Please enter a product name or category');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await postCalculate<SEOKeywordsResponse>('/api/seo-keywords', {
        productName: productName.trim(),
        keyFeatures: keyFeatures.trim(),
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Our AI engine is currently experiencing high demand. Please try generating keywords again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const copyAllToClipboard = () => {
    if (!result) return;
    const allText = [
      'Top Search Terms:\n' + result.topSearchTerms.join(', '),
      '\n\nPlatinum Keywords:\n' + result.platinumKeywords.join(', '),
      '\n\nMisspellings/Long-tail:\n' + result.misspellings.join(', '),
    ].join('');
    copyToClipboard(allText, 'all');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered SEO Tool
        </div>
        <h1 className="text-3xl md:text-4xl font-bold dark:text-zinc-50 text-zinc-900 mb-3 select-none">SEO Keyword Generator</h1>
        <p className="dark:text-zinc-400 text-zinc-600 max-w-2xl mx-auto select-none">
          Generate high-converting search terms for Amazon India and Flipkart listings. Optimize your product visibility with AI-powered keyword research.
        </p>
      </div>

      {/* Input Card */}
      <div className="dark:bg-zinc-900/80 bg-white/80 backdrop-blur-xl border dark:border-zinc-800/80 border-zinc-200/80 rounded-2xl p-6 shadow-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium dark:text-zinc-300 text-zinc-700 mb-2">
              Product Name / Category <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Cotton Bedsheet, Wireless Earbuds, Women's Kurti"
              className="w-full px-4 py-3 rounded-xl dark:bg-zinc-800/50 bg-zinc-100 dark:border-zinc-700 border-zinc-300 dark:text-zinc-100 text-zinc-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-zinc-300 text-zinc-700 mb-2">
              Key Features or Target Audience <span className="dark:text-zinc-500 text-zinc-400">(optional)</span>
            </label>
            <textarea
              value={keyFeatures}
              onChange={(e) => setKeyFeatures(e.target.value)}
              placeholder="e.g., 100% cotton, king size, for double beds, premium quality, breathable fabric"
              rows={3}
              className="w-full px-4 py-3 rounded-xl dark:bg-zinc-800/50 bg-zinc-100 dark:border-zinc-700 border-zinc-300 dark:text-zinc-100 text-zinc-900 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !productName.trim()}
            className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 select-none focus:outline-none focus:ring-0"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating Keywords...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate SEO Keywords
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Copy All Button */}
          <div className="flex justify-end">
            <button
              onClick={copyAllToClipboard}
              className="px-4 py-2 dark:bg-zinc-800/50 bg-zinc-100 hover:dark:bg-zinc-700/50 hover:bg-zinc-200 dark:text-zinc-300 text-zinc-700 rounded-lg text-sm font-medium transition-all flex items-center gap-2 select-none focus:outline-none focus:ring-0"
            >
              {copiedSection === 'all' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All Keywords
                </>
              )}
            </button>
          </div>

          {/* Top Search Terms */}
          <div className="dark:bg-zinc-900/80 bg-white/80 backdrop-blur-xl border dark:border-zinc-800/80 border-zinc-200/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Search className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold dark:text-zinc-100 text-zinc-900 select-none">Top 20 Search Terms</h3>
                  <p className="text-xs dark:text-zinc-400 text-zinc-500 select-none">High-volume backend keywords</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(result.topSearchTerms.join(', '), 'top')}
                className="p-2 rounded-lg dark:bg-zinc-800/50 bg-zinc-100 hover:dark:bg-zinc-700/50 hover:bg-zinc-200 dark:text-zinc-300 text-zinc-700 transition-all select-none focus:outline-none focus:ring-0"
              >
                {copiedSection === 'top' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.topSearchTerms.map((term, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-lg dark:bg-zinc-800/50 bg-zinc-100 dark:border-zinc-700/50 border-zinc-200/50 dark:text-zinc-300 text-zinc-700 text-sm font-medium"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>

          {/* Platinum Keywords */}
          <div className="dark:bg-zinc-900/80 bg-white/80 backdrop-blur-xl border dark:border-zinc-800/80 border-zinc-200/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold dark:text-zinc-100 text-zinc-900 select-none">Platinum Keywords</h3>
                  <p className="text-xs dark:text-zinc-400 text-zinc-500 select-none">High-conversion premium terms</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(result.platinumKeywords.join(', '), 'platinum')}
                className="p-2 rounded-lg dark:bg-zinc-800/50 bg-zinc-100 hover:dark:bg-zinc-700/50 hover:bg-zinc-200 dark:text-zinc-300 text-zinc-700 transition-all select-none focus:outline-none focus:ring-0"
              >
                {copiedSection === 'platinum' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.platinumKeywords.map((term, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-lg dark:bg-purple-500/10 bg-purple-50 dark:border-purple-500/20 border-purple-200/50 dark:text-purple-300 text-purple-700 text-sm font-medium"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>

          {/* Misspellings & Long-tail */}
          <div className="dark:bg-zinc-900/80 bg-white/80 backdrop-blur-xl border dark:border-zinc-800/80 border-zinc-200/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold dark:text-zinc-100 text-zinc-900 select-none">Misspellings & Long-tail</h3>
                  <p className="text-xs dark:text-zinc-400 text-zinc-500 select-none">Low-competition, high-intent variations</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(result.misspellings.join(', '), 'misspellings')}
                className="p-2 rounded-lg dark:bg-zinc-800/50 bg-zinc-100 hover:dark:bg-zinc-700/50 hover:bg-zinc-200 dark:text-zinc-300 text-zinc-700 transition-all select-none focus:outline-none focus:ring-0"
              >
                {copiedSection === 'misspellings' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.misspellings.map((term, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 rounded-lg dark:bg-amber-500/10 bg-amber-50 dark:border-amber-500/20 border-amber-200/50 dark:text-amber-300 text-amber-700 text-sm font-medium"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="dark:bg-zinc-900/50 bg-zinc-50/80 rounded-xl p-4 border dark:border-zinc-800/50 border-zinc-200/50">
        <h4 className="text-sm font-semibold dark:text-zinc-300 text-zinc-700 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          Pro Tips
        </h4>
        <ul className="text-xs dark:text-zinc-400 text-zinc-600 space-y-1">
          <li>• Use specific product categories (e.g., "Cotton Bedsheet" instead of just "Bedsheet")</li>
          <li>• Include key features like material, size, color, or target audience for better results</li>
          <li>• Mix Platinum Keywords with top search terms in your product title for maximum visibility</li>
          <li>• Use long-tail variations in your bullet points to capture niche searches</li>
        </ul>
      </div>
    </div>
  );
}
