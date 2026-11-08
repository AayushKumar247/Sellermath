import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu, Sun, Moon, Search, ChevronDown, ChevronRight, Check, Home,
  Calculator, Sparkles, Package, FileSpreadsheet, BookOpen, Receipt,
  Share2, LifeBuoy, FileText, Info, TrendingUp, Truck, Key,
  Image as ImageIcon, BarChart3, ArrowRight, Command, ShieldCheck
} from 'lucide-react';
import { type PageId } from '@/components/Sidebar';

/* ═══════════════════════════════════════════════════════════════════
   SAFE PROPS
   ═══════════════════════════════════════════════════════════════════ */

export interface HeaderMenusProps {
  currentPage?: PageId;
  onNavigate?: (page: PageId) => void;
  isDark?: boolean;
  onToggleDark?: () => void;
  onToggleMobileMenu?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════
   NAV CONFIG
   ═══════════════════════════════════════════════════════════════════ */

interface NavChild { id: PageId; label: string; hint?: string; icon: React.ComponentType<{ className?: string }>; disabled?: boolean }
interface NavItem  { id: PageId | string; label: string; icon: React.ComponentType<{ className?: string }>; children?: NavChild[] }

const NAV: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  {
    id: 'calculators', label: 'Calculators', icon: Calculator,
    children: [
      { id: 'calculator', label: 'Product Profit Calculator', icon: Calculator, hint: 'Margin & break-even' },
      { id: 'roas',       label: 'ROAS & Break-Even',         icon: TrendingUp, hint: 'Ad-spend efficiency' },
      { id: 'shipping',   label: 'Shipping & RTO',            icon: Truck,      hint: 'Logistics & returns' },
    ],
  },
  {
    id: 'ai-studio', label: 'AI Studio', icon: Sparkles,
    children: [
      { id: 'listing-writer', label: 'AI Product Listing Writer', icon: FileText, hint: 'Generate product copy' },
      { id: 'seo-keywords', label: 'SEO Keyword Generator', icon: Key, hint: 'Rank-ready keywords' },
      { id: 'listing-optimizer', label: 'Marketplace Listing Optimizer', icon: BarChart3, hint: 'Boost discoverability' },
    ],
  },
  {
    id: 'product-studio', label: 'Product Studio', icon: Package,
    children: [
      { id: 'image-resizer', label: 'Product Image Resizer', icon: ImageIcon, hint: 'Compliance sizes' },
      { id: 'ai-bg-remover', label: 'AI Background Remover', icon: Sparkles, hint: 'Coming soon', disabled: true },
      { id: 'ai-white-bg', label: 'White BG & Lifestyle Generator', icon: Sparkles, hint: 'Coming soon', disabled: true },
    ],
  },
  {
    id: 'csv', label: 'CSV Intelligence', icon: FileSpreadsheet,
    children: [
      { id: 'bulk-csv',  label: 'Bulk CSV Profit Calculator', icon: FileSpreadsheet, hint: 'Up to 500 SKUs' },
      { id: 'analytics', label: 'Returns & RTO Analytics',    icon: TrendingUp,      hint: 'Spot leakage' },
    ],
  },
  { id: 'gst-invoice', label: 'GST Invoice', icon: Receipt },
  {
    id: 'learn', label: 'Learn', icon: BookOpen,
    children: [
      { id: 'learn', label: 'Knowledge Base',   icon: BookOpen, hint: 'Guides & playbooks' },
      { id: 'about', label: 'About SellerMath', icon: Info,     hint: 'Our mission' },
    ],
  },
];

const ALL_TOOLS: NavChild[] = NAV.flatMap((n) =>
  n.children ? n.children : [{ id: n.id as PageId, label: n.label, icon: n.icon, hint: '' }],
);

const FEE_TOOLTIP = 'Amazon, Flipkart, Meesho, Myntra & Quick Commerce 2026 referral & closing fees verified.';

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export function HeaderMenus({
  currentPage,
  onNavigate = () => {},
  isDark = false,
  onToggleDark = () => {},
  onToggleMobileMenu,
}: HeaderMenusProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { setOpenMenu(null); }, [currentPage]);

  const navigate = useCallback((page: PageId) => {
    onNavigate(page);
    setOpenMenu(null);
    setCmdOpen(false);
  }, [onNavigate]);

  const handleNavMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const nav = e.currentTarget;
    const rect = nav.getBoundingClientRect();
    nav.style.setProperty('--x', `${e.clientX - rect.left}px`);
    nav.style.setProperty('--y', `${e.clientY - rect.top}px`);
  };

  return (
    <header className="sticky top-0 z-30 w-full select-none border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
        
        {/* LEFT ZONE */}
        <div className="flex shrink-0 items-center gap-2">
          {onToggleMobileMenu && (
            <button type="button" onClick={onToggleMobileMenu} className="rounded-xl p-2 text-zinc-600 transition-colors hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
          )}
          <button type="button" onClick={() => navigate('home' as PageId)} className="flex items-center gap-2.5 rounded-xl px-1 py-1 transition-all hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-[11px] font-black tracking-tight text-white shadow-lg shadow-cyan-500/25">
              SM
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-[13px] font-bold leading-tight text-zinc-900 dark:text-zinc-50">SellerMath</p>
              <p className="text-[10px] font-medium leading-tight text-zinc-500 dark:text-zinc-500">Profit Intelligence</p>
            </div>
          </button>
        </div>

        {/* CENTER ZONE (Nav Dock with Spotlight) */}
        <div 
          onMouseMove={handleNavMouseMove}
          className="group/nav relative hidden items-center gap-1 rounded-2xl p-1 lg:flex"
        >
          {/* Glassmorphic Background */}
          <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl border border-zinc-200/50 bg-zinc-100/50 opacity-100 dark:border-zinc-800/50 dark:bg-zinc-900/50" />
          
          {/* Spotlight Gradient */}
          <div 
            className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/nav:opacity-100"
            style={{
              background: `radial-gradient(120px circle at var(--x, 50%) var(--y, 50%), rgba(56, 189, 248, 0.15), transparent 80%)`
            }}
          />

          <nav aria-label="Primary" className="relative z-10 flex items-center gap-1">
            {NAV.map((item) => {
              const isActive = item.id === currentPage || item.children?.some((c) => c.id === currentPage);
              if (!item.children) {
                return (
                  <button key={item.id} type="button" onClick={() => navigate(item.id as PageId)} className={navBtnClass(!!isActive)}>
                    {item.label}
                  </button>
                );
              }
              return (
                <NavDropdown 
                  key={item.id} 
                  item={item} 
                  isActive={!!isActive} 
                  isOpen={openMenu === item.id} 
                  onToggle={() => setOpenMenu((c) => (c === item.id ? null : item.id))} 
                  onNavigate={navigate} 
                />
              );
            })}
          </nav>
        </div>

        {/* RIGHT ZONE */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="mx-1 hidden h-5 w-px bg-zinc-300 dark:bg-zinc-700 lg:block" />
          
          <FeeBadge onNavigate={() => navigate('calculator' as PageId)} />

          {/* Command Palette Trigger */}
          <button 
            type="button" 
            onClick={() => setCmdOpen(true)} 
            className="group relative hidden items-center gap-2 overflow-hidden rounded-xl border border-zinc-200/80 bg-white/70 px-2 py-1.5 text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 sm:flex md:px-3"
          >
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <Search className="relative z-10 h-4 w-4 transition-transform group-hover:scale-110 group-hover:text-cyan-500" />
            <span className="relative z-10 hidden text-xs font-medium md:inline">Search…</span>
            <kbd className="relative z-10 hidden items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 md:inline-flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button 
            type="button" 
            onClick={onToggleDark} 
            className="relative rounded-xl p-2 text-zinc-700 transition-all hover:bg-zinc-100 hover:text-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-yellow-400"
          >
            <div className="absolute inset-0 rounded-xl bg-current opacity-0 blur-md transition-opacity hover:opacity-10" />
            {isDark ? <Sun className="h-4 w-4 transition-transform hover:rotate-45" /> : <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />}
          </button>

          <SMAvatarMenu onNavigate={navigate} />
        </div>
      </div>

      {mounted && createPortal(
        <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={navigate} />,
        document.body
      )}
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS & ANIMATIONS
   ═══════════════════════════════════════════════════════════════════ */

function navBtnClass(active: boolean) {
  return [
    'relative flex items-center gap-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-300',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60',
    active 
      ? 'bg-emerald-500/15 font-semibold text-emerald-600 shadow-sm dark:text-emerald-400' 
      : 'text-zinc-700 hover:bg-white/60 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50',
  ].join(' ');
}

function NavDropdown({ item, isActive, isOpen, onToggle, onNavigate }: { item: NavItem; isActive: boolean; isOpen: boolean; onToggle: () => void; onNavigate: (p: PageId) => void; }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => setAnimate(true));
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button type="button" onClick={onToggle} aria-expanded={isOpen} className={navBtnClass(isActive)}>
        {item.label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {shouldRender && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} aria-hidden />
          <div className={`absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/95 p-1.5 shadow-2xl shadow-zinc-900/20 backdrop-blur-2xl transition-all duration-200 ease-out dark:border-zinc-800/80 dark:bg-zinc-900/95 dark:shadow-black/60 ${animate ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-2 scale-95 opacity-0'}`}>
            {item.children!.map((child, idx) => {
              const Icon = child.icon;
              
              if (child.disabled) {
                return (
                  <div key={child.id} style={{ transitionDelay: animate ? `${idx * 40}ms` : '0ms' }} className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-left cursor-not-allowed border border-transparent select-none transition-all duration-300 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 dark:text-zinc-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-zinc-400 dark:text-zinc-500">{child.label}</span>
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full dark:bg-zinc-800 bg-zinc-200 dark:border-zinc-700/60 border-zinc-300/60 dark:text-zinc-400 text-zinc-600">Soon</span>
                  </div>
                );
              }
              
              return (
                <button 
                  key={child.id} 
                  type="button" 
                  onClick={() => onNavigate(child.id)} 
                  style={{ transitionDelay: animate ? `${idx * 40}ms` : '0ms' }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-all duration-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">{child.label}</span>
                    {child.hint && <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-500">{child.hint}</span>}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400 opacity-0 transition-all duration-300 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function FeeBadge({ onNavigate }: { onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button type="button" onClick={() => setOpen((v) => !v)} className="group relative inline-flex items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 transition-all hover:bg-emerald-500/20 hover:shadow-sm dark:text-emerald-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
        <span className="hidden xl:inline">Fee Data: Nov 2026</span>
        <span className="xl:hidden">Nov '26 Fees</span>
      </button>
      
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-2xl border border-zinc-200/80 bg-white/95 p-3 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-zinc-900 dark:text-zinc-50">Fees verified for 2026</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">{FEE_TOOLTIP}</p>
            </div>
          </div>
          <button type="button" onClick={() => { setOpen(false); onNavigate(); }} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-[12px] font-semibold text-white transition-all hover:bg-emerald-600 hover:shadow-md">
            Run the numbers <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function SMAvatarMenu({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleShare = async () => {
    const url = window.location.origin;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'SellerMath', url });
        setOpen(false);
        return;
      } catch { /* ignore */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
    } catch { setOpen(false); }
  };

  return (
    <div ref={ref} className="relative">
      <button 
        type="button" 
        onClick={() => setOpen((v) => !v)} 
        className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-emerald-500/25 active:scale-95 dark:bg-zinc-800"
      >
        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 opacity-0 blur transition-opacity duration-300 group-hover:opacity-60" />
        <div className="absolute inset-0 -z-10 rounded-full border border-zinc-700 transition-colors group-hover:border-emerald-500/50" />
        SM
      </button>
      
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-zinc-200 bg-white/95 py-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900/95">
          {copied ? (
            <span className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4 animate-bounce" /> Copied Link!
            </span>
          ) : (
            <button type="button" onClick={handleShare} className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50">
              <Share2 className="h-4 w-4 text-zinc-500 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110" /> Share Tools
            </button>
          )}
          <button type="button" onClick={() => { setOpen(false); onNavigate('contact' as PageId); }} className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50">
            <LifeBuoy className="h-4 w-4 text-zinc-500 transition-transform group-hover:rotate-12 group-hover:scale-110" /> Contact Support &amp; Feedback
          </button>
        </div>
      )}
    </div>
  );
}

function CommandPalette({ isOpen, onClose, onNavigate }: { isOpen: boolean; onClose: () => void; onNavigate: (p: PageId) => void; }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  
  const filtered = useMemo(() => {
    if (!query.trim()) return ALL_TOOLS;
    return ALL_TOOLS.filter((t) => t.label.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActive(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-zinc-950/40 px-4 pt-[12vh] backdrop-blur-sm animate-in fade-in duration-200" onMouseDown={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl dark:border-zinc-800/80 dark:bg-zinc-900/95 animate-in zoom-in-95 duration-200" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800/80">
          <Search className="h-4 w-4 text-zinc-400" />
          <input autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setActive(0); }} placeholder="Search tools, calculators..." className="h-14 flex-1 bg-transparent text-sm text-zinc-900 focus:outline-none dark:text-zinc-50" />
          <kbd className="hidden rounded border border-zinc-200 px-1.5 font-mono text-[10px] text-zinc-500 sm:inline dark:border-zinc-700">ESC</kbd>
        </div>
        <div className="max-h-[22rem] overflow-y-auto p-2">
          {filtered.length === 0 && <p className="p-4 text-center text-sm text-zinc-500">No tools found.</p>}
          {filtered.map((tool, i) => (
            <button key={tool.id} onClick={() => onNavigate(tool.id)} onMouseEnter={() => setActive(i)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${i === active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 scale-[0.99]' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}>
               <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${i === active ? 'bg-emerald-500 text-white shadow-md' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'}`}>
                 <tool.icon className="h-3.5 w-3.5" />
               </div>
               <span className="font-medium">{tool.label}</span>
               {i === active && <ArrowRight className="ml-auto h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PROFILE DROPDOWN (Backwards Compatibility for App.tsx)
   ═══════════════════════════════════════════════════════════════════ */
export function ProfileDropdown({
  isOpen,
  onClose,
  onNavigate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
}) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [isOpen, onClose]);

  const handleShare = async () => {
    const url = window.location.origin;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'SellerMath', url });
        onClose();
        return;
      } catch { /* ignore */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); onClose(); }, 1200);
    } catch { onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div ref={ref} className="absolute right-0 z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 dark:border-zinc-800 dark:bg-zinc-900">
      {copied ? (
        <span className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-600">
          <Check className="h-4 w-4" /> Copied!
        </span>
      ) : (
        <button
          type="button"
          onClick={handleShare}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50"
        >
          <Share2 className="h-4 w-4 text-zinc-500" /> Share Tools
        </button>
      )}
      <button
        type="button"
        onClick={() => { onClose(); onNavigate('contact' as PageId); }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50"
      >
        <LifeBuoy className="h-4 w-4 text-zinc-500" /> Contact Support &amp; Feedback
      </button>
    </div>
  );
}