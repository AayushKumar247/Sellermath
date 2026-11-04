import { useState, useEffect, useRef } from 'react';
import { Menu, Sun, Moon, Globe, ChevronDown, Calculator, Truck, Sparkles, FileText, FileSpreadsheet, PenTool, Image as ImageIcon, Zap } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import Sidebar, { type PageId } from '@/components/Sidebar';
import AIListingWriter from '@/components/AIListingWriter';
import ROASBreakEven from '@/components/ROASBreakEven';
import GSTInvoiceGenerator from '@/components/GSTInvoiceGenerator';
import UniversalCalculator from '@/components/UniversalCalculator';
import BulkCsvCalculator from '@/components/BulkCsvCalculator';
import ShippingRtoCalculator from '@/components/ShippingRtoCalculator';
import Footer from '@/components/Footer';
import InfoPages from '@/components/InfoPages';
import Home from '@/components/Home';
import { ProfileDropdown } from '@/components/HeaderMenus';
import ScrollToTop from '@/components/ScrollToTop';

const THEME_KEY = 'sellermath_theme';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('universal');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [ecomDropdownOpen, setEcomDropdownOpen] = useState(false);
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);
  const ecomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  useEffect(() => {
    return () => {
      if (ecomTimeoutRef.current) {
        clearTimeout(ecomTimeoutRef.current);
      }
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
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
    setEcomDropdownOpen(false);
    setAiDropdownOpen(false);
  };

  const handleEcomMouseEnter = () => {
    if (ecomTimeoutRef.current) {
      clearTimeout(ecomTimeoutRef.current);
      ecomTimeoutRef.current = null;
    }
    setEcomDropdownOpen(true);
  };

  const handleEcomMouseLeave = () => {
    ecomTimeoutRef.current = setTimeout(() => {
      setEcomDropdownOpen(false);
    }, 300);
  };

  const handleAiMouseEnter = () => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    setAiDropdownOpen(true);
  };

  const handleAiMouseLeave = () => {
    aiTimeoutRef.current = setTimeout(() => {
      setAiDropdownOpen(false);
    }, 300);
  };

  const getActivePageName = () => {
    const pageNames: Record<PageId, string> = {
      'bulk-csv': 'Bulk CSV Profit Calculator',
      'universal': 'Profit Calculator',
      'roas': 'ROAS & Break-Even Tool',
      'gst-invoice': 'GST Invoice Generator',
      'ai-listing': 'AI Listing Writer',
      'shipping-rto': 'Shipping & RTO Calculator',
      'home': 'Home',
      'blogs': 'Blog',
      'about': 'About Us',
      'contact': 'Contact Us',
      'privacy': 'Privacy Policy',
      'terms': 'Terms & Conditions',
    };
    return pageNames[activePage] || 'Profit Calculator';
  };

  const getActivePageIcon = () => {
    const pageIcons: Record<PageId, { type: 'image' | 'icon'; value?: string }> = {
      'bulk-csv': { type: 'icon' },
      'universal': { type: 'image', value: '/universal-logo.png' },
      'roas': { type: 'image', value: '/roas-logo.png' },
      'gst-invoice': { type: 'image', value: '/gst-logo.png' },
      'ai-listing': { type: 'image', value: '/ai-writer-logo.png' },
      'shipping-rto': { type: 'icon' },
      'home': { type: 'icon' },
      'blogs': { type: 'icon' },
      'about': { type: 'icon' },
      'contact': { type: 'icon' },
      'privacy': { type: 'icon' },
      'terms': { type: 'icon' },
    };
    return pageIcons[activePage] || { type: 'icon' };
  };

  const renderPage = () => {
    switch (activePage) {
      case 'bulk-csv':
        return <BulkCsvCalculator />;
      case 'ai-listing':
        return <AIListingWriter />;
      case 'roas':
        return <ROASBreakEven />;
      case 'gst-invoice':
        return <GSTInvoiceGenerator />;
      case 'universal':
        return <UniversalCalculator onNavigate={handleNavigate} />;
      case 'shipping-rto':
        return <ShippingRtoCalculator />;
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'blogs':
        return (
          <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Blog</h1>
            <p className="text-gray-600 dark:text-gray-400">Blog section - Coming soon</p>
          </div>
        );
      case 'about':
        return <InfoPages page="about" onNavigate={handleNavigate} />;
      case 'contact':
        return <InfoPages page="contact" onNavigate={handleNavigate} />;
      case 'privacy':
        return <InfoPages page="privacy" onNavigate={handleNavigate} />;
      case 'terms':
        return <InfoPages page="terms" onNavigate={handleNavigate} />;
      default:
        return <UniversalCalculator onNavigate={handleNavigate} />;
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
        className="lg:hidden"
      />

      <div>
        <header className="sticky top-0 z-40 border-b dark:border-zinc-800/60 border-zinc-200/80 dark:bg-zinc-950/80 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 relative">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-zinc-300 hover:bg-zinc-800/60 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo - Left Side on Desktop */}
            <div className="flex items-center gap-3">
              <img
                src="/sellermath-logo.png"
                alt="SellerMath"
                className="w-8 h-8 rounded-xl overflow-hidden object-cover drop-shadow-md"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold dark:text-zinc-50 text-zinc-900 tracking-tight">SellerMath</h1>
                <p className="text-xs dark:text-zinc-400 text-zinc-500">Profit Intelligence</p>
              </div>
            </div>

            {/* Desktop Center Navigation - Absolutely Centered */}
            <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              <button
                onClick={() => handleNavigate('home')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activePage === 'home'
                    ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                    : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                }`}
              >
                Home
              </button>
              
              {/* Ecom Calculators Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleEcomMouseEnter}
                onMouseLeave={handleEcomMouseLeave}
              >
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                    ['universal', 'roas', 'shipping-rto'].includes(activePage)
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                      : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                  }`}
                >
                  Ecom Calculators
                  <ChevronDown className="w-4 h-4" />
                </button>

                {ecomDropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 pt-2 min-w-[280px]"
                  >
                    <div
                      className="dark:bg-zinc-900/90 bg-white/90 backdrop-blur-xl dark:border-zinc-800/80 border-zinc-200/80 shadow-2xl dark:shadow-black/80 shadow-lg rounded-2xl p-2.5 space-y-1.5 z-50"
                      onMouseEnter={handleEcomMouseEnter}
                      onMouseLeave={handleEcomMouseLeave}
                    >
                      <button
                        onClick={() => handleNavigate('universal')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">Profit Calculator</span>
                      </button>
                      <button
                        onClick={() => handleNavigate('roas')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 group-hover:bg-blue-500/20 transition-all">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">ROAS & Break-Even</span>
                      </button>
                      <button
                        onClick={() => handleNavigate('shipping-rto')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400 group-hover:bg-amber-500/20 transition-all">
                          <Truck className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">Shipping & RTO</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* AI Studio Dropdown */}
              <div
                className="relative"
                onMouseEnter={handleAiMouseEnter}
                onMouseLeave={handleAiMouseLeave}
              >
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                    activePage === 'ai-listing'
                      ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                      : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                  }`}
                >
                  AI Studio
                  <ChevronDown className="w-4 h-4" />
                </button>

                {aiDropdownOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 pt-2 min-w-[280px]"
                  >
                    <div
                      className="dark:bg-zinc-900/90 bg-white/90 backdrop-blur-xl dark:border-zinc-800/80 border-zinc-200/80 shadow-2xl dark:shadow-black/80 shadow-lg rounded-2xl p-2.5 space-y-1.5 z-50"
                      onMouseEnter={handleAiMouseEnter}
                      onMouseLeave={handleAiMouseLeave}
                    >
                      <button
                        onClick={() => handleNavigate('ai-listing')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 dark:text-white text-zinc-900 rounded-xl transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400 group-hover:bg-purple-500/20 transition-all">
                          <PenTool className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-200 text-zinc-700">AI Listing Writer</span>
                      </button>
                      <div className="flex items-center gap-3 px-3 py-2.5 dark:text-zinc-400 text-zinc-600 cursor-not-allowed border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 rounded-xl transition-all duration-200 group">
                        <div className="w-9 h-9 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-500/20 transition-all">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-400 text-zinc-600 flex-1">AI Background Remover</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600 rounded-full">COMING SOON</span>
                      </div>
                      <div className="flex items-center gap-3 px-3 py-2.5 dark:text-zinc-400 text-zinc-600 cursor-not-allowed border border-transparent dark:hover:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:border-zinc-700/50 hover:border-zinc-300/50 rounded-xl transition-all duration-200 group">
                        <div className="w-9 h-9 rounded-lg bg-zinc-500/10 border border-zinc-500/20 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-500/20 transition-all">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="whitespace-nowrap font-medium text-sm dark:text-zinc-400 text-zinc-600 flex-1">AI Image Generator</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600 rounded-full">COMING SOON</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => handleNavigate('gst-invoice')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activePage === 'gst-invoice'
                    ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                    : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                }`}
              >
                GST Invoice
              </button>

              <button
                onClick={() => handleNavigate('bulk-csv')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activePage === 'bulk-csv'
                    ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                    : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Bulk CSV
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">NEW</span>
              </button>

              <button
                onClick={() => handleNavigate('blogs')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activePage === 'blogs'
                    ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400'
                    : 'dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100'
                }`}
              >
                Blog
              </button>
            </nav>
            
            <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
              <div className="flex items-center gap-3 relative">
                <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded-full px-3 py-1 text-xs font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  2026 Fee & GST Slabs Active
                </div>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg dark:text-zinc-300 text-zinc-600 dark:hover:bg-zinc-800/60 hover:bg-zinc-100 transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((v) => !v)}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center hover:ring-2 hover:ring-emerald-400 transition-all"
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
