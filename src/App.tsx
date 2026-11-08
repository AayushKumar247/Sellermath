import { useState, useEffect, useRef } from 'react';
import { Menu, Sun, Moon, ChevronDown, Calculator, Truck, Sparkles, FileText, FileSpreadsheet, Key, PenTool, Image as ImageIcon, BarChart3, Rocket } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import Sidebar, { type PageId } from '@/components/Sidebar';
import AIListingWriter from '@/components/AIListingWriter';
import ROASBreakEven from '@/components/ROASBreakEven';
import GSTInvoiceGenerator from '@/components/GSTInvoiceGenerator';
import UniversalCalculator from '@/components/UniversalCalculator';
import BulkCsvCalculator from '@/components/BulkCsvCalculator';
import ShippingRtoCalculator from '@/components/ShippingRtoCalculator';
import ReturnsRTOAnalytics from '@/components/ReturnsRTOAnalytics';
import SEOKeywords from '@/components/SEOKeywords';
import ImageResizer from '@/components/ImageResizer';
import MarketplaceOptimizer from '@/components/MarketplaceOptimizer';
import Footer from '@/components/Footer';
import InfoPages from '@/components/InfoPages';
import Home from '@/components/Home';
import { ProfileDropdown } from '@/components/HeaderMenus';
import ScrollToTop from '@/components/ScrollToTop';

const THEME_KEY = 'sellermath_theme';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [calculatorsDropdownOpen, setCalculatorsDropdownOpen] = useState(false);
  const [aiStudioDropdownOpen, setAiStudioDropdownOpen] = useState(false);
  const [productStudioDropdownOpen, setProductStudioDropdownOpen] = useState(false);
  const [csvIntelligenceDropdownOpen, setCsvIntelligenceDropdownOpen] = useState(false);
  const [learnDropdownOpen, setLearnDropdownOpen] = useState(false);
  const calculatorsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiStudioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const productStudioTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const csvIntelligenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const learnTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  useEffect(() => {
    return () => {
      if (calculatorsTimeoutRef.current) {
        clearTimeout(calculatorsTimeoutRef.current);
      }
      if (aiStudioTimeoutRef.current) {
        clearTimeout(aiStudioTimeoutRef.current);
      }
      if (productStudioTimeoutRef.current) {
        clearTimeout(productStudioTimeoutRef.current);
      }
      if (csvIntelligenceTimeoutRef.current) {
        clearTimeout(csvIntelligenceTimeoutRef.current);
      }
      if (learnTimeoutRef.current) {
        clearTimeout(learnTimeoutRef.current);
      }
    };
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    setSidebarOpen(false);
    setProfileOpen(false);
    setCalculatorsDropdownOpen(false);
    setAiStudioDropdownOpen(false);
    setProductStudioDropdownOpen(false);
    setCsvIntelligenceDropdownOpen(false);
    setLearnDropdownOpen(false);
  };

  const handleCalculatorsMouseEnter = () => {
    if (calculatorsTimeoutRef.current) {
      clearTimeout(calculatorsTimeoutRef.current);
      calculatorsTimeoutRef.current = null;
    }
    setCalculatorsDropdownOpen(true);
  };

  const handleCalculatorsMouseLeave = () => {
    calculatorsTimeoutRef.current = setTimeout(() => {
      setCalculatorsDropdownOpen(false);
    }, 300);
  };

  const handleAiStudioMouseEnter = () => {
    if (aiStudioTimeoutRef.current) {
      clearTimeout(aiStudioTimeoutRef.current);
      aiStudioTimeoutRef.current = null;
    }
    setAiStudioDropdownOpen(true);
  };

  const handleAiStudioMouseLeave = () => {
    aiStudioTimeoutRef.current = setTimeout(() => {
      setAiStudioDropdownOpen(false);
    }, 300);
  };

  const handleProductStudioMouseEnter = () => {
    if (productStudioTimeoutRef.current) {
      clearTimeout(productStudioTimeoutRef.current);
      productStudioTimeoutRef.current = null;
    }
    setProductStudioDropdownOpen(true);
  };

  const handleProductStudioMouseLeave = () => {
    productStudioTimeoutRef.current = setTimeout(() => {
      setProductStudioDropdownOpen(false);
    }, 300);
  };

  const handleCsvIntelligenceMouseEnter = () => {
    if (csvIntelligenceTimeoutRef.current) {
      clearTimeout(csvIntelligenceTimeoutRef.current);
      csvIntelligenceTimeoutRef.current = null;
    }
    setCsvIntelligenceDropdownOpen(true);
  };

  const handleCsvIntelligenceMouseLeave = () => {
    csvIntelligenceTimeoutRef.current = setTimeout(() => {
      setCsvIntelligenceDropdownOpen(false);
    }, 300);
  };

  const handleLearnMouseEnter = () => {
    if (learnTimeoutRef.current) {
      clearTimeout(learnTimeoutRef.current);
      learnTimeoutRef.current = null;
    }
    setLearnDropdownOpen(true);
  };

  const handleLearnMouseLeave = () => {
    learnTimeoutRef.current = setTimeout(() => {
      setLearnDropdownOpen(false);
    }, 300);
  };

  const getActivePageName = () => {
    const pageNames: Record<string, string> = {
      'home': 'Home',
      'calculator': 'Product Profit Calculator',
      'roas': 'ROAS & Break-Even Calculator',
      'shipping': 'Shipping & RTO Calculator',
      'listing-writer': 'AI Product Listing Writer',
      'seo-keywords': 'SEO Keyword Generator',
      'listing-optimizer': 'Marketplace Listing Optimizer',
      'image-resizer': 'Product Image Resizer',
      'bulk-csv': 'Bulk CSV Profit Calculator',
      'rto-analytics': 'Returns & RTO Analytics',
      'gst-invoice': 'GST Invoice Generator',
      'about': 'About Us',
      'contact': 'Contact Us',
      'privacy': 'Privacy Policy',
      'terms': 'Terms & Conditions',
    };
    return pageNames[activePage] || 'Home';
  };

  const getActivePageIcon = () => {
    const pageIcons: Record<string, { type: 'image' | 'icon'; value?: string }> = {
      'home': { type: 'icon' },
      'calculator': { type: 'image', value: '/universal-logo.png' },
      'roas': { type: 'image', value: '/roas-logo.png' },
      'gst-invoice': { type: 'image', value: '/gst-logo.png' },
      'listing-writer': { type: 'image', value: '/ai-writer-logo.png' },
      'shipping': { type: 'icon' },
      'about': { type: 'icon' },
      'contact': { type: 'icon' },
      'privacy': { type: 'icon' },
      'terms': { type: 'icon' },
    };
    return pageIcons[activePage] || { type: 'icon' };
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'calculator':
        return <UniversalCalculator onNavigate={handleNavigate} />;
      case 'roas':
        return <ROASBreakEven />;
      case 'shipping':
        return <ShippingRtoCalculator />;
      case 'listing-writer':
        return <AIListingWriter />;
      case 'seo-keywords':
        return <SEOKeywords />;
      case 'listing-optimizer':
        return <MarketplaceOptimizer />;
      case 'image-resizer':
        return <ImageResizer />;
      case 'bulk-csv':
        return <BulkCsvCalculator />;
      case 'rto-analytics':
        return <ReturnsRTOAnalytics />;
      case 'gst-invoice':
        return <GSTInvoiceGenerator />;
      case 'about':
        return <InfoPages page="about" onNavigate={handleNavigate} />;
      case 'contact':
        return <InfoPages page="contact" onNavigate={handleNavigate} />;
      case 'privacy':
        return <InfoPages page="privacy" onNavigate={handleNavigate} />;
      case 'terms':
        return <InfoPages page="terms" onNavigate={handleNavigate} />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen dark:bg-zinc-950 bg-zinc-50 transition-colors">
      <ScrollToTop trigger={activePage} />
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        className="xl:hidden"
      />

      <div>
        <header className="sticky top-0 z-40 border-b dark:border-zinc-800/60 border-zinc-200/80 dark:bg-zinc-950/80 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 h-16 relative">
            {/* Left Group: Hamburger + Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="xl:hidden p-2 rounded-lg dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100 transition-colors select-none focus:outline-none focus:ring-0"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Logo */}
              <div className="flex items-center gap-3 flex-1 min-w-0 shrink">
                <img
                  src="/sellermath-logo.png"
                  alt="SellerMath"
                  className="w-8 h-8 rounded-xl overflow-hidden object-cover drop-shadow-md shrink-0"
                />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold dark:text-zinc-50 text-zinc-900 tracking-tight truncate">SellerMath</h1>
                  <p className="text-[10px] sm:text-xs dark:text-zinc-400 text-zinc-500 truncate">Profit Intelligence</p>
                </div>
              </div>
            </div>

            {/* Desktop Center Navigation - 7 Items for xl: */}
            <nav className="hidden xl:flex items-center gap-2 2xl:gap-5 absolute left-1/2 -translate-x-1/2">
              {/* 1. Home */}
              <button
                onClick={() => handleNavigate('home')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap select-none focus:outline-none focus:ring-0 ${
                  activePage === 'home'
                    ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                    : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                }`}
              >
                Home
              </button>

              {/* 2. Calculators Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleCalculatorsMouseEnter}
                onMouseLeave={handleCalculatorsMouseLeave}
              >
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap select-none focus:outline-none focus:ring-0 ${
                    ['calculator', 'roas', 'shipping'].includes(activePage)
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                      : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                  }`}
                >
                  Calculators
                  <ChevronDown className="w-4 h-4" />
                </button>

                {calculatorsDropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 pt-2 min-w-[280px]"
                  >
                    <div
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-950/15 dark:shadow-black/60 rounded-2xl p-2 space-y-1.5 z-50"
                      onMouseEnter={handleCalculatorsMouseEnter}
                      onMouseLeave={handleCalculatorsMouseLeave}
                    >
                      <button
                        onClick={() => handleNavigate('calculator')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group select-none focus:outline-none focus:ring-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">Product Profit Calculator</span>
                      </button>
                      <button
                        onClick={() => handleNavigate('roas')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group select-none focus:outline-none focus:ring-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 group-hover:bg-blue-500/20 transition-all">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">ROAS & Break-Even Calculator</span>
                      </button>
                      <button
                        onClick={() => handleNavigate('shipping')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group select-none focus:outline-none focus:ring-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 group-hover:bg-amber-500/20 transition-all">
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">Shipping & RTO Calculator</span>
                      </button>

                    </div>
                  </div>
                )}
              </div>

              {/* 3. AI Studio Dropdown — NOW OWNS 'listing-writer' */}
              <div
                className="relative"
                onMouseEnter={handleAiStudioMouseEnter}
                onMouseLeave={handleAiStudioMouseLeave}
              >
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap select-none focus:outline-none focus:ring-0 ${
                    ['listing-writer', 'seo-keywords', 'listing-optimizer'].includes(activePage)
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                      : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                  }`}
                >
                  AI Studio
                  <ChevronDown className="w-4 h-4" />
                </button>

                {aiStudioDropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 pt-2 min-w-[280px]"
                  >
                    <div
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-950/15 dark:shadow-black/60 rounded-2xl p-2 space-y-1.5 z-50"
                      onMouseEnter={handleAiStudioMouseEnter}
                      onMouseLeave={handleAiStudioMouseLeave}
                    >
                      <button
                        onClick={() => handleNavigate('listing-writer')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group select-none focus:outline-none focus:ring-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                          <PenTool className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">AI Product Listing Writer</span>
                      </button>
                      <button
                        onClick={() => handleNavigate('seo-keywords')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group select-none focus:outline-none focus:ring-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                          <Key className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">SEO Keyword Generator</span>
                      </button>
                      <button
                        onClick={() => handleNavigate('listing-optimizer')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group select-none focus:outline-none focus:ring-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">Marketplace Listing Optimizer</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Product Studio Dropdown — no longer owns 'listing-writer' */}
              <div
                className="relative"
                onMouseEnter={handleProductStudioMouseEnter}
                onMouseLeave={handleProductStudioMouseLeave}
              >
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap select-none focus:outline-none focus:ring-0 ${
                    ['image-resizer'].includes(activePage)
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                      : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                  }`}
                >
                  Product Studio
                  <ChevronDown className="w-4 h-4" />
                </button>

                {productStudioDropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 pt-2 min-w-[280px]"
                  >
                    <div
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-950/15 dark:shadow-black/60 rounded-2xl p-2 space-y-1.5 z-50"
                      onMouseEnter={handleProductStudioMouseEnter}
                      onMouseLeave={handleProductStudioMouseLeave}
                    >
                      <button
                        onClick={() => handleNavigate('image-resizer')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group select-none focus:outline-none focus:ring-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700 flex-1">Product Image Resizer</span>
                      </button>
                      <div className="flex items-center gap-3 px-3 py-2.5 dark:text-zinc-400 text-zinc-600 cursor-not-allowed border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 rounded-xl transition-all duration-200 group select-none">
                        <div className="w-9 h-9 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-500/20 transition-all">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-400 text-zinc-600 flex-1">AI Background Remover</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600 rounded-full">Soon</span>
                      </div>
                      <div className="flex items-center gap-3 px-3 py-2.5 dark:text-zinc-400 text-zinc-600 cursor-not-allowed border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 rounded-xl transition-all duration-200 group select-none">
                        <div className="w-9 h-9 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-500/20 transition-all">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-400 text-zinc-600 flex-1">White BG & Lifestyle Generator</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600 rounded-full">Soon</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. CSV Intelligence Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleCsvIntelligenceMouseEnter}
                onMouseLeave={handleCsvIntelligenceMouseLeave}
              >
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap select-none focus:outline-none focus:ring-0 ${
                    ['bulk-csv', 'rto-analytics'].includes(activePage)
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                      : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                  }`}
                >
                  CSV Intelligence
                  <ChevronDown className="w-4 h-4" />
                </button>

                {csvIntelligenceDropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 pt-2 min-w-[280px]"
                  >
                    <div
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-950/15 dark:shadow-black/60 rounded-2xl p-2 space-y-1.5 z-50"
                      onMouseEnter={handleCsvIntelligenceMouseEnter}
                      onMouseLeave={handleCsvIntelligenceMouseLeave}
                    >
                      <button
                        onClick={() => handleNavigate('bulk-csv')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group select-none focus:outline-none focus:ring-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">Bulk CSV Profit Calculator</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500 text-white animate-pulse">NEW</span>
                      </button>
                      <div className="flex items-center gap-3 px-3 py-2.5 dark:text-zinc-400 text-zinc-600 cursor-not-allowed border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 rounded-xl transition-all duration-200 group select-none">
                        <div className="w-9 h-9 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-500/20 transition-all">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-400 text-zinc-600 flex-1">Settlement Reconciliation</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600 rounded-full">Soon</span>
                      </div>
                      <button
                        onClick={() => handleNavigate('rto-analytics')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group select-none focus:outline-none focus:ring-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700 flex-1">Returns & RTO Analytics</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. GST Invoice - Direct Button */}
              <button
                onClick={() => handleNavigate('gst-invoice')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap select-none focus:outline-none focus:ring-0 ${
                  activePage === 'gst-invoice'
                    ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                    : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                }`}
              >
                GST Invoice
              </button>

              {/* 7. Learn Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleLearnMouseEnter}
                onMouseLeave={handleLearnMouseLeave}
              >
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap select-none focus:outline-none focus:ring-0 ${
                    false
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                      : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                  }`}
                >
                  Learn
                  <ChevronDown className="w-4 h-4" />
                </button>

                {learnDropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 pt-2 min-w-[280px]"
                  >
                    <div
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-950/15 dark:shadow-black/60 rounded-2xl p-2 space-y-1.5 z-50"
                      onMouseEnter={handleLearnMouseEnter}
                      onMouseLeave={handleLearnMouseLeave}
                    >
                      <div className="flex items-center gap-3 px-3 py-2.5 dark:text-zinc-400 text-zinc-600 cursor-not-allowed border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 rounded-xl transition-all duration-200 group select-none">
                        <div className="w-9 h-9 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-500/20 transition-all">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-400 text-zinc-600 flex-1">E-Commerce Guides</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600 rounded-full">Soon</span>
                      </div>
                      <div className="flex items-center gap-3 px-3 py-2.5 dark:text-zinc-400 text-zinc-600 cursor-not-allowed border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 rounded-xl transition-all duration-200 group select-none">
                        <div className="w-9 h-9 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-500/20 transition-all">
                          <Rocket className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-400 text-zinc-600 flex-1">Marketplace Selling Guides</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600 rounded-full">Soon</span>
                      </div>
                      <div className="flex items-center gap-3 px-3 py-2.5 dark:text-zinc-400 text-zinc-600 cursor-not-allowed border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 rounded-xl transition-all duration-200 group select-none">
                        <div className="w-9 h-9 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-500/20 transition-all">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-400 text-zinc-600 flex-1">Seller Tutorials</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600 rounded-full">Soon</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            <div className="shrink-0 flex items-center gap-2 sm:gap-4 justify-end">
              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-full px-3 py-1 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Fee Data Updated: Nov 2026
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100 transition-colors select-none focus:outline-none focus:ring-0"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center hover:ring-2 hover:ring-emerald-400 transition-all select-none focus:outline-none focus:ring-0"
                >
                  <span className="text-xs font-bold text-white">SM</span>
                </button>
                <ProfileDropdown
                  isOpen={profileOpen}
                  onClose={() => setProfileOpen(false)}
                  onNavigate={handleNavigate}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto flex-1">
          {renderPage()}
        </main>
        <Footer onNavigate={handleNavigate} />
      </div>
      <Analytics />
    </div>
  );
}