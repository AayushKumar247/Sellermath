import { useState } from 'react';
import {
  Calculator,
  Sparkles,
  PenTool,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Zap,
  Shield,
  DollarSign,
  TrendingUp,
  BarChart3,
  Rocket,
  Clock,
  Target,
  Globe,
  Mail,
  Truck,
} from 'lucide-react';

interface FeatureItem {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  tools: string[];
  status?: 'active' | 'coming-soon' | 'new';
  onClick?: () => void;
}

interface FeatureGroupProps {
  title: string;
  subtitle: string;
  items: FeatureItem[];
  singleColumn?: boolean;
}

function FeatureCard({ icon, iconBg, title, description, tools, status, onClick }: FeatureItem) {
  const [hovered, setHovered] = useState(false);

  const isDisabled = status === 'coming-soon';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick && !isDisabled ? onClick : undefined}
      className={`group relative dark:bg-zinc-900/80 bg-white/80 dark:border-zinc-800/80 border-zinc-200/80 rounded-2xl p-6 transition-all duration-300 ${
        hovered
          ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/20 dark:shadow-emerald-500/20 -translate-y-1'
          : ''
      } ${isDisabled ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer dark:hover:bg-zinc-900/90 hover:bg-zinc-100'}`}
    >
      <div className="absolute top-4 right-4 flex gap-2">
        {status === 'coming-soon' && (
          <span className="px-2 py-0.5 rounded-full dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600 text-[10px] font-semibold tracking-wider uppercase">
            Coming Soon
          </span>
        )}
        {status === 'new' && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold tracking-wider uppercase animate-pulse shadow-lg shadow-emerald-500/30">
            NEW
          </span>
        )}
      </div>

      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mb-4 transition-all duration-300 group-hover:scale-110 ${iconBg}`}>
        {icon}
      </div>

      <h3 className="text-lg font-bold dark:text-zinc-100 text-zinc-900 mb-2 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors select-none">{title}</h3>
      <p className="dark:text-zinc-400 text-zinc-600 text-sm leading-relaxed mb-4 select-none">{description}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {tools.map((tool, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-lg dark:bg-zinc-800/50 bg-zinc-100 dark:border-zinc-800 border-zinc-200 text-[10px] font-medium dark:text-zinc-400 text-zinc-600 uppercase tracking-wider"
          >
            {tool}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t dark:border-zinc-800/50 border-zinc-200/50">
        <span className={isDisabled ? 'text-zinc-500 text-xs' : 'text-emerald-500 dark:text-emerald-400 text-xs font-semibold'}>
          {isDisabled ? 'Coming Soon' : 'Open Tool →'}
        </span>
        {!isDisabled && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
            hovered ? 'bg-emerald-500' : 'dark:bg-zinc-800 bg-zinc-900'
          } text-white text-xs`}>
            <span className="w-3 h-3 border-t-2 border-r-2 border-emerald-500 dark:border-emerald-400 transform rotate-45" />
          </div>
        )}
      </div>

      {isDisabled && (
        <div className="absolute inset-0 dark:bg-zinc-900/40 bg-zinc-900/20 rounded-2xl backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 opacity-50">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-600 border-t-transparent animate-spin" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Coming Soon</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureGroup({ title, subtitle, items, singleColumn = false }: FeatureGroupProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold dark:text-zinc-50 text-zinc-900 tracking-tight select-none">{title}</h2>
          <p className="dark:text-zinc-400 text-zinc-600 text-sm mt-1 max-w-md select-none">{subtitle}</p>
        </div>
      </div>

      <div
        className={`grid gap-6 ${
          singleColumn
            ? 'grid-cols-1 lg:max-w-4xl lg:mx-auto'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {items.map((item) => (
          <FeatureCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

interface HomeProps {
  onNavigate: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="relative overflow-hidden rounded-3xl dark:bg-zinc-900/60 bg-zinc-50/80 dark:border-zinc-800/80 border-zinc-200/80 pt-8 pb-12 md:pt-12 md:pb-16 px-6 md:px-12 mb-2">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-medium mb-4 md:mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Fee Data Updated: Nov 2026
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-zinc-900 dark:text-white mb-2 md:mb-4 select-none">
            India's Most Accurate<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400">
              E-Commerce Profit Engine
            </span>
          </h1>

          <p className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mt-4 leading-relaxed select-none">
            Calculate, analyze, and scale your marketplace profits across Amazon, Flipkart, Meesho, Myntra, Blinkit, and more
            with AI-powered precision. Built for Indian sellers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <button
              onClick={() => onNavigate('profit')}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 select-none focus:outline-none focus:ring-0"
            >
              <Rocket className="w-5 h-5" /> Launch Calculator
            </button>
            <button
              onClick={() => onNavigate('listing')}
              className="w-full sm:w-auto px-6 py-3 dark:bg-zinc-900 hover:dark:bg-zinc-800 bg-white hover:bg-zinc-100 dark:border-zinc-700 border-zinc-200 dark:text-zinc-100 text-zinc-900 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 select-none focus:outline-none focus:ring-0"
            >
              <Sparkles className="w-5 h-5" /> Explore Product Studio
            </button>
          </div>
        </div>
      </section>

      {/* ============ FEATURE SHOWCASE ============ */}
      <section className="space-y-12">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold dark:text-zinc-50 text-zinc-900 mb-3 select-none">Everything You Need to Scale</h2>
          <p className="dark:text-zinc-400 text-zinc-600 select-none">All tools organized exactly as they appear in your navigation — one platform, every marketplace.</p>
        </div>

        <FeatureGroup
          title="Calculators"
          subtitle="Track marketplace commissions, shipping fees, and ROI with precision across all major Indian marketplaces."
          items={[
            {
              icon: <Calculator className="w-5 h-5" />,
              iconBg: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400",
              title: "Product Profit Calculator",
              description: "Calculate exact profit margins across Amazon, Flipkart, Meesho, Myntra, and Blinkit with category-specific commissions and GST slabs.",
              tools: ["Commission tracking", "Shipping fees", "GST calculation", "Break-even analysis"],
              onClick: () => onNavigate('profit'),
            },
            {
              icon: <DollarSign className="w-5 h-5" />,
              iconBg: "bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400",
              title: "ROAS & Break-Even Calculator",
              description: "Determine your return on ad spend and exact break-even point to optimize paid campaigns and pricing strategy.",
              tools: ["ROAS calculator", "Break-even point", "Ad spend optimizer", "Pricing strategy"],
              onClick: () => onNavigate('roas'),
            },
          ]}
        />

        <FeatureGroup
          title="AI Studio"
          subtitle="Automate visual content generation with AI — built for marketplace sellers."
          items={[
            {
              icon: <ImageIcon className="w-5 h-5" />,
              iconBg: "bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400",
              title: "AI Background Remover",
              description: "Studio-quality background removal for product images.",
              tools: ["Background removal", "Studio visuals", "Product photography"],
              status: "coming-soon",
            },
            {
              icon: <Sparkles className="w-5 h-5" />,
              iconBg: "bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400",
              title: "White BG & Lifestyle Generator",
              description: "Generate clean white backgrounds and lifestyle images for your products.",
              tools: ["White background", "Lifestyle images", "Product photos"],
              status: "coming-soon",
            },
            {
              icon: <ImageIcon className="w-5 h-5" />,
              iconBg: "bg-emerald-50/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400",
              title: "Product Image Resizer",
              description: "Resize and optimize product images for all marketplaces automatically.",
              tools: ["Image resizing", "Optimization", "Multi-platform"],
              onClick: () => onNavigate('resize'),
            },
          ]}
        />

        <FeatureGroup
          title="Product Studio"
          subtitle="Automate product listings and SEO optimization with AI — built for marketplace sellers."
          items={[
            {
              icon: <PenTool className="w-5 h-5" />,
              iconBg: "bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400",
              title: "AI Product Listing Writer",
              description: "Instantly generate SEO-optimized product titles, descriptions, and bullet points for Amazon, Flipkart, and Meesho.",
              tools: ["AI product titles", "SEO descriptions", "Bullet points", "Multi-marketplace"],
              onClick: () => onNavigate('listing'),
            },
            {
              icon: <Sparkles className="w-5 h-5" />,
              iconBg: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400",
              title: "SEO Keyword Generator",
              description: "Generate high-performing keywords for your product listings with AI-powered research.",
              tools: ["Keyword research", "SEO optimization", "Search ranking"],
              onClick: () => onNavigate('seo'),
            },
            {
              icon: <Rocket className="w-5 h-5" />,
              iconBg: "bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400",
              title: "Marketplace Listing Optimizer",
              description: "Optimize your listings for maximum visibility and conversion.",
              tools: ["Listing optimization", "Conversion rate", "Visibility"],
              onClick: () => onNavigate('optimize'),
            },
          ]}
        />

        <FeatureGroup
          title="CSV Intelligence"
          subtitle="Upload bulk SKUs for multi-channel profit analysis in seconds."
          singleColumn
          items={[
            {
              icon: <FileSpreadsheet className="w-5 h-5" />,
              iconBg: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400",
              title: "Bulk CSV Profit Calculator",
              description: "Upload CSV files with multiple SKUs and get profit analysis across all channels instantly. Perfect for high-volume sellers.",
              tools: ["Bulk SKU upload", "Multi-channel analysis", "CSV export", "Profit summary"],
              status: "new",
              onClick: () => onNavigate('csv'),
            },
            {
              icon: <FileText className="w-5 h-5" />,
              iconBg: "bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400",
              title: "Settlement Reconciliation",
              description: "Reconcile marketplace settlements with your orders automatically.",
              tools: ["Settlement matching", "Order reconciliation", "Payment tracking"],
              status: "coming-soon",
            },
            {
              icon: <Truck className="w-5 h-5" />,
              iconBg: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400",
              title: "Returns & RTO Analytics",
              description: "Analyze return patterns and RTO rates across marketplaces with single-item and bulk CSV analysis.",
              tools: ["Return analysis", "RTO tracking", "Category insights", "Bulk CSV upload"],
              onClick: () => onNavigate('rto-analytics'),
            },
          ]}
        />

        <FeatureGroup
          title="GST Invoice"
          subtitle="Automated B2B/B2C tax invoice creation compliant with 2026 Indian tax slabs."
          singleColumn
          items={[
            {
              icon: <FileText className="w-5 h-5" />,
              iconBg: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400",
              title: "GST Invoice Generator",
              description: "Create compliant GST invoices with automatic tax calculation, HSN codes, and 2026 Indian GST slab support.",
              tools: ["B2B/B2C invoices", "2026 GST slabs", "HSN codes", "Auto tax calc"],
              onClick: () => onNavigate('gst'),
            },
          ]}
        />

        <FeatureGroup
          title="Learn"
          subtitle="Expert profit guides, e-commerce strategies, and marketplace updates for Indian sellers."
          singleColumn
          items={[
            {
              icon: <BarChart3 className="w-5 h-5" />,
              iconBg: "bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400",
              title: "E-Commerce Guides",
              description: "Read in-depth guides on profit optimization, marketplace fees, GST compliance, and scaling strategies.",
              tools: ["Profit guides", "E-commerce strategies", "Marketplace updates", "Seller tips"],
              status: "coming-soon",
            },
            {
              icon: <Rocket className="w-5 h-5" />,
              iconBg: "bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400",
              title: "Marketplace Selling Guides",
              description: "Platform-specific guides for Amazon, Flipkart, Meesho, and more.",
              tools: ["Platform strategies", "Best practices", "Growth tactics"],
              status: "coming-soon",
            },
            {
              icon: <Sparkles className="w-5 h-5" />,
              iconBg: "bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400",
              title: "Seller Tutorials",
              description: "Step-by-step tutorials for using all SellerMath tools effectively.",
              tools: ["Tool tutorials", "Video guides", "Tips & tricks"],
              status: "coming-soon",
            },
          ]}
        />
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="rounded-2xl dark:bg-zinc-900/50 bg-zinc-50/80 dark:border-zinc-800/80 border-zinc-200/80 p-8 md:p-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-medium mb-6">
          Trusted by 10,000+ Indian Sellers
        </div>
        <h2 className="text-3xl font-bold dark:text-zinc-50 text-zinc-900 mb-4 select-none">Ready to Scale Your Profits?</h2>
        <p className="dark:text-zinc-400 text-zinc-600 mb-8 max-w-lg mx-auto select-none">
          Join thousands of sellers using SellerMath to calculate exact margins, automate GST invoices, and grow across every marketplace.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('profit')}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-emerald-500/25 transform hover:-translate-y-0.5 select-none focus:outline-none focus:ring-0"
          >
            Start Calculating Profits
          </button>
          <button
            onClick={() => onNavigate('csv')}
            className="w-full sm:w-auto px-8 py-4 dark:bg-zinc-900 hover:dark:bg-zinc-800 bg-white hover:bg-zinc-100 dark:border-zinc-700 border-zinc-200 dark:text-zinc-100 text-zinc-900 rounded-xl font-semibold text-lg transition-all transform hover:-translate-y-0.5 select-none focus:outline-none focus:ring-0"
          >
            Try Bulk CSV Calculator
          </button>
        </div>
      </section>
    </div>
  );
}