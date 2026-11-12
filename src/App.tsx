import { useState, useEffect, useCallback, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Sidebar, { type PageId } from '@/components/Sidebar';
import AIListingWriter from '@/components/AIListingWriter';
import ROASBreakEven from '@/components/ROASBreakEven';
import GSTInvoiceGenerator from '@/components/GSTInvoiceGenerator';
import UniversalCalculator from '@/components/UniversalCalculator';
import BulkCsvCalculator from '@/components/BulkCsvCalculator';
import ShippingRtoCalculator from '@/components/ShippingRtoCalculator';
import ReturnsRTOAnalytics from '@/components/ReturnsRTOAnalytics';
import SettlementReconciliation from '@/components/settlement-reconciliation';
import SEOKeywords from '@/components/SEOKeywords';
import ImageResizer from '@/components/ImageResizer';
import AIBackgroundRemover from '@/components/AIBackgroundRemover';
import AIImageGenerator from '@/components/AIImageGenerator';
import MarketplaceOptimizer from '@/components/MarketplaceOptimizer';
import Footer from '@/components/Footer';
import CompanyLegalPages from '@/components/CompanyLegalPages';
import Home from '@/components/Home';
import { HeaderMenus } from '@/components/HeaderMenus';
import ScrollToTop from '@/components/ScrollToTop';
import SellerTutorials from '@/components/SellerTutorials';

const THEME_KEY = 'sellermath_theme';

/* ------------------------------------------------------------------ */
/* URL <-> PageId mapping                                             */
/* ------------------------------------------------------------------ */
const PAGE_TO_PATH: Record<PageId, string> = {
  home: '/',
  calculator: '/calculator',
  roas: '/roas-calculator',
  shipping: '/shipping-calculator',
  'listing-writer': '/ai-listing',
  'seo-keywords': '/seo-keywords',
  'listing-optimizer': '/listing-optimizer',
  'image-resizer': '/image-resizer',
  'bg-remover': '/bg-remover',
  'image-generator': '/image-generator',
  'bulk-csv': '/csv-calculator',
  'rto-analytics': '/rto-analytics',
  'settlement-reconciliation': '/settlement-reconciliation',
  'gst-invoice': '/gst-invoice',
  'seller-tutorials': '/seller-tutorials',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy-policy',
  terms: '/terms-and-conditions',
  refund: '/refund-policy',
  disclaimer: '/disclaimer',
};

const PATH_TO_PAGE: Record<string, PageId> = Object.entries(PAGE_TO_PATH).reduce(
  (acc, [page, path]) => {
    acc[path] = page as PageId;
    return acc;
  },
  {} as Record<string, PageId>
);

const normalizePath = (pathname: string): string => {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

const getPageFromLocation = (): PageId => {
  const path = normalizePath(window.location.pathname);
  return PATH_TO_PAGE[path] ?? 'home';
};

/* ------------------------------------------------------------------ */

export default function App() {
  // Initialise activePage from the URL on first load / hard refresh
  const [activePage, setActivePage] = useState<PageId>(() => getPageFromLocation());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Keeps track of the "current" page synchronously (needed inside handleNavigate)
  const activePageRef = useRef<PageId>(activePage);
  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  /* Dynamic document.title per route (SEO) */
  useEffect(() => {
    const titles: Record<PageId, string> = {
      home: "SellerMath — India's Most Accurate E-Commerce Profit & Settlement Suite",
      calculator: "Product Profit Calculator (Amazon, Flipkart, Meesho, Blinkit) | SellerMath",
      roas: "ROAS & Break-Even Ad Spend Calculator | SellerMath",
      shipping: "Courier Shipping & Volumetric Weight Calculator | SellerMath",
      'listing-writer': "AI Product Listing Writer | SellerMath",
      'seo-keywords': "Marketplace SEO Keyword & 250-Byte Builder | SellerMath",
      'listing-optimizer': "Marketplace Listing Optimizer & 100-Point Audit | SellerMath",
      'image-resizer': "E-Commerce Product Image Resizer | SellerMath",
      'bg-remover': "AI Background Remover & Pure White Studio | SellerMath",
      'image-generator': "AI Product Lifestyle & Image Generator | SellerMath",
      'bulk-csv': "Bulk CSV Catalogue Profit Calculator | SellerMath",
      'rto-analytics': "Returns & RTO Loss Analytics | SellerMath",
      'settlement-reconciliation': "Payment Settlement & Leak Reconciliation | SellerMath",
      'gst-invoice': "Free GST Tax Invoice Generator with UPI QR | SellerMath",
      'seller-tutorials': "Seller Tutorials & Playbooks | SellerMath",
      about: "About Us | SellerMath",
      contact: "Contact Us | SellerMath",
      privacy: "Privacy Policy | SellerMath",
      terms: "Terms & Conditions | SellerMath",
      refund: "Refund Policy | SellerMath",
      disclaimer: "Financial, Tax & Marketplace Fee Disclaimer | SellerMath",
    };
    document.title = titles[activePage] ?? titles.home;
  }, [activePage]);

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

  /* ----------------- Browser History Sync ----------------- */

  // 1) On first mount, mirror the current page into the URL via replaceState
  //    so that pressing Back always has a "home" anchor to return to.
  useEffect(() => {
    const initialPage = getPageFromLocation();
    window.history.replaceState({ page: initialPage }, '', PAGE_TO_PATH[initialPage]);
  }, []);

  // 2) Listen for browser Back / Forward (and Android/iOS swipe gestures).
  //    We NEVER pushState here — the browser already moved the history cursor.
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const statePage = event.state?.page as PageId | undefined;
      const target: PageId =
        statePage && statePage in PAGE_TO_PATH ? statePage : getPageFromLocation();

      activePageRef.current = target;
      setActivePage(target);
      setSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 3) Every in-app navigation pushes exactly one history entry.
  const handleNavigate = useCallback((page: PageId) => {
    setSidebarOpen(false);

    // Don't create duplicate history entries for the same page.
    if (page === activePageRef.current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const path = PAGE_TO_PATH[page] ?? '/';

    activePageRef.current = page;
    window.history.pushState({ page }, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActivePage(page);
  }, []);

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
      'bg-remover': 'AI Background Remover',
      'image-generator': 'AI Image & Lifestyle Studio',
      'bulk-csv': 'Bulk CSV Profit Calculator',
      'rto-analytics': 'Returns & RTO Analytics',
      'settlement-reconciliation': 'Settlement Reconciliation',
      'gst-invoice': 'GST Invoice Generator',
      'about': 'About Us',
      'contact': 'Contact Us',
      'privacy': 'Privacy Policy',
      'terms': 'Terms & Conditions',
      'refund': 'Refund Policy',
      'disclaimer': 'Disclaimer',
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
      'refund': { type: 'icon' },
      'disclaimer': { type: 'icon' },
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
      case 'bg-remover':
        return <AIBackgroundRemover />;
      case 'image-generator':
        return <AIImageGenerator />;
      case 'bulk-csv':
        return <BulkCsvCalculator />;
      case 'rto-analytics':
        return <ReturnsRTOAnalytics />;
      case 'settlement-reconciliation':
        return <SettlementReconciliation />;
      case 'gst-invoice':
        return <GSTInvoiceGenerator />;
      case 'seller-tutorials':
        return <SellerTutorials onNavigate={handleNavigate} />;
      case 'about':
        return <CompanyLegalPages activeSection="about" onNavigate={handleNavigate} />;
      case 'contact':
        return <CompanyLegalPages activeSection="contact" onNavigate={handleNavigate} />;
      case 'privacy':
        return <CompanyLegalPages activeSection="privacy" onNavigate={handleNavigate} />;
      case 'terms':
        return <CompanyLegalPages activeSection="terms" onNavigate={handleNavigate} />;
      case 'refund':
        return <CompanyLegalPages activeSection="refund" onNavigate={handleNavigate} />;
      case 'disclaimer':
        return <CompanyLegalPages activeSection="disclaimer" onNavigate={handleNavigate} />;
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
        <HeaderMenus
          currentPage={activePage}
          onNavigate={handleNavigate}
          isDark={isDark}
          onToggleDark={toggleTheme}
          onToggleMobileMenu={() => setSidebarOpen(true)}
        />

        <main className="w-full max-w-full overflow-x-hidden">
          {/* Home.tsx and every tool page already supply their own px-3 sm:px-6 lg:px-8 */}
          {renderPage()}
        </main>
        <Footer onNavigate={handleNavigate} />
      </div>
      <Analytics />
    </div>
  );
}