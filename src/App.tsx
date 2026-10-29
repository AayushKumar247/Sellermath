import { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Globe, Sparkles, Store, Truck, ShoppingBag, Target, FileText } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import Sidebar, { type PageId } from '@/components/Sidebar';
import MeeshoCalculator from '@/components/MeeshoCalculator';
import FlipkartCalculator from '@/components/FlipkartCalculator';
import BlinkitCalculator from '@/components/BlinkitCalculator';
import AIListingWriter from '@/components/AIListingWriter';
import AmazonFBACalculator from '@/components/AmazonFBACalculator';
import ROASBreakEven from '@/components/ROASBreakEven';
import GSTInvoiceGenerator from '@/components/GSTInvoiceGenerator';
import UniversalCalculator from '@/components/UniversalCalculator';
import Footer from '@/components/Footer';
import InfoPages from '@/components/InfoPages';
import { ProfileDropdown } from '@/components/HeaderMenus';
import ScrollToTop from '@/components/ScrollToTop';

const THEME_KEY = 'sellermath_theme';

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('universal');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
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
  };

  const getActivePageName = () => {
    const pageNames: Record<PageId, string> = {
      'universal': 'Universal Profit Calculator',
      'meesho': 'Meesho Calculator',
      'flipkart': 'Flipkart Calculator',
      'blinkit': 'Blinkit Margin',
      'amazon-fba': 'Amazon FBA Calculator',
      'roas': 'ROAS / Break-Even Tool',
      'gst-invoice': 'GST Invoice Generator',
      'ai-listing': 'AI Listing Writer',
      'about': 'About Us',
      'contact': 'Contact Us',
      'privacy': 'Privacy Policy',
      'terms': 'Terms & Conditions',
    };
    return pageNames[activePage] || 'Universal Profit Calculator';
  };

  const getActivePageIcon = () => {
    const pageIcons: Record<PageId, React.ElementType> = {
      'universal': Globe,
      'meesho': Sparkles,
      'flipkart': Store,
      'blinkit': Truck,
      'amazon-fba': ShoppingBag,
      'roas': Target,
      'gst-invoice': FileText,
      'ai-listing': Sparkles,
      'about': Globe,
      'contact': Globe,
      'privacy': Globe,
      'terms': Globe,
    };
    return pageIcons[activePage] || Globe;
  };

  const renderPage = () => {
    switch (activePage) {
      case 'meesho':
        return <MeeshoCalculator />;
      case 'flipkart':
        return <FlipkartCalculator />;
      case 'blinkit':
        return <BlinkitCalculator />;
      case 'ai-listing':
        return <AIListingWriter />;
      case 'amazon-fba':
        return <AmazonFBACalculator />;
      case 'roas':
        return <ROASBreakEven />;
      case 'gst-invoice':
        return <GSTInvoiceGenerator />;
      case 'universal':
        return <UniversalCalculator />;
      case 'about':
        return <InfoPages page="about" onNavigate={handleNavigate} />;
      case 'contact':
        return <InfoPages page="contact" onNavigate={handleNavigate} />;
      case 'privacy':
        return <InfoPages page="privacy" onNavigate={handleNavigate} />;
      case 'terms':
        return <InfoPages page="terms" onNavigate={handleNavigate} />;
      default:
        return <UniversalCalculator />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors">
      <ScrollToTop trigger={activePage} />
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-[#0c0c0f]/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/80 transition-colors">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 lg:invisible">
              <span className="text-lg font-bold text-slate-900 dark:text-zinc-50">SellerMath</span>
            </div>
            <div className="hidden md:flex items-center gap-3 flex-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                {(() => {
                  const Icon = getActivePageIcon();
                  return <Icon className="w-4 h-4" strokeWidth={2.5} />;
                })()}
              </div>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-50 tracking-tight">{getActivePageName()}</span>
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full px-3 py-1 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                2026 Fee & GST Slabs Active
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 dark:from-zinc-700 dark:to-zinc-900 flex items-center justify-center hover:ring-2 hover:ring-emerald-400 transition-all"
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
