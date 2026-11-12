import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu, Sun, Moon, Search, ChevronDown, ChevronRight, Check,
  Calculator, Sparkles, Truck, FileText, FileSpreadsheet, Key, PenTool,
  Image as ImageIcon, BarChart3, Rocket, Share2, LifeBuoy, ArrowRight,
  Command, ShieldCheck, CornerDownLeft,
} from 'lucide-react';
import { type PageId } from '@/components/Sidebar';

/* ═══════════════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════════════ */

export interface HeaderMenusProps {
  currentPage?: PageId;
  onNavigate?: (page: PageId) => void;
  isDark?: boolean;
  onToggleDark?: () => void;
  onToggleMobileMenu?: () => void;
}

/* ═══════════════════════════════════════════════════════════════════
   NAV CONFIG  (mirrors the original App.tsx header exactly)
   ═══════════════════════════════════════════════════════════════════ */

type IconType = React.ComponentType<{ className?: string }>;
type Tone = 'emerald' | 'blue' | 'amber';

interface NavChild {
  id: PageId;
  label: string;
  hint?: string;
  icon: IconType;
  tone?: Tone;
  badge?: string;
  disabled?: boolean;
}
interface NavItem { id: string; label: string; icon?: IconType; children?: NavChild[] }
interface Tool extends NavChild { group: string }

const P = (s: string) => s as PageId;

const NAV: NavItem[] = [
  { id: 'home', label: 'Home' },
  {
    id: 'calculators', label: 'Calculators',
    children: [
      { id: P('calculator'), label: 'Product Profit Calculator', hint: 'Margin & break-even', icon: Calculator, tone: 'emerald' },
      { id: P('roas'), label: 'ROAS & Break-Even Calculator', hint: 'Ad-spend efficiency', icon: Calculator, tone: 'blue' },
      { id: P('shipping'), label: 'Shipping & RTO Calculator', hint: 'Logistics & returns', icon: Truck, tone: 'amber' },
    ],
  },
  {
    id: 'ai-studio', label: 'AI Studio',
    children: [
      { id: P('listing-writer'), label: 'AI Product Listing Writer', hint: 'Generate product copy', icon: PenTool },
      { id: P('seo-keywords'), label: 'SEO Keyword Generator', hint: 'Rank-ready keywords', icon: Key },
      { id: P('listing-optimizer'), label: 'Marketplace Listing Optimizer', hint: 'Boost discoverability', icon: BarChart3 },
    ],
  },
  {
    id: 'product-studio', label: 'Product Studio',
    children: [
      { id: P('image-resizer'), label: 'Product Image Resizer', hint: 'Compliance sizes', icon: ImageIcon },
      { id: P('bg-remover'), label: 'AI Background Remover', hint: 'Remove image backgrounds', icon: Sparkles },
      { id: P('image-generator'), label: 'AI Image & Lifestyle Studio', hint: 'Generate lifestyle product images', icon: Sparkles },
    ],
  },
  {
    id: 'csv', label: 'CSV Intelligence',
    children: [
      { id: P('bulk-csv'), label: 'Bulk CSV Profit Calculator', hint: 'Up to 500 SKUs', icon: FileSpreadsheet, badge: 'NEW' },
      { id: P('settlement-reconciliation'), label: 'Settlement Reconciliation', hint: 'Match payouts to orders', icon: FileText },
      { id: P('rto-analytics'), label: 'Returns & RTO Analytics', hint: 'Spot leakage', icon: Truck },
    ],
  },
  { id: 'gst-invoice', label: 'GST Invoice' },
  {
    id: 'learn', label: 'Learn',
    children: [
      { id: P('guides'), label: 'E-Commerce Guides', hint: 'Coming soon', icon: BarChart3, disabled: true },
      { id: P('selling-guides'), label: 'Marketplace Selling Guides', hint: 'Coming soon', icon: Rocket, disabled: true },
      { id: P('seller-tutorials'), label: 'Seller Tutorials', hint: 'Step-by-step marketplace playbooks', icon: Sparkles, badge: 'NEW' },
    ],
  },
];

const HOME_ICON = Calculator;

// Palette lists only usable tools (no "Coming soon")
const ALL_TOOLS: Tool[] = NAV.flatMap((n) =>
  n.children
    ? n.children.filter((c) => !c.disabled).map((c) => ({ ...c, group: n.label }))
    : [{ id: P(n.id), label: n.label, hint: '', icon: n.icon ?? HOME_ICON, group: 'General' }],
);

const TONE: Record<Tone, string> = {
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white dark:text-emerald-400 dark:group-hover:text-white',
  blue: 'border-blue-500/20 bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white dark:text-blue-400 dark:group-hover:text-white',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white dark:text-amber-400 dark:group-hover:text-white',
};

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60';

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function useDismiss(open: boolean, ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, ref, onClose]);
}

function useShare(onDone: () => void) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.origin;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'SellerMath', url }); onDone(); return; } catch { /* fall through */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => { setCopied(false); onDone(); }, 1500);
    } catch { onDone(); }
  };
  return { copied, share };
}

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
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false, instant: true });

  const navRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);

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

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 8);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => { setOpenMenu(null); }, [currentPage]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const closeMenu = useCallback(() => setOpenMenu(null), []);
  useDismiss(openMenu !== null, navRef, closeMenu);

  const navigate = useCallback((page: PageId) => {
    onNavigate(page);
    setOpenMenu(null);
    setCmdOpen(false);
  }, [onNavigate]);

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 250);
  };

  const handleSlotEnter = (e: React.PointerEvent<HTMLDivElement>, item: NavItem) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    setPill((p) => ({ left: el.offsetLeft, width: el.offsetWidth, visible: true, instant: !p.visible }));
    if (item.children) { cancelClose(); setOpenMenu(item.id); }
    else scheduleClose();
  };
  const handleSlotLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') scheduleClose();
  };

  const handleDockMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--y', `${e.clientY - rect.top}px`);
  };

  return (
    <header
      className={[
        'sticky top-0 z-40 w-full max-w-full overflow-x-clip select-none border-b backdrop-blur-xl transition-shadow duration-300',
        'border-zinc-200/70 bg-white/80 dark:border-zinc-800/60 dark:bg-zinc-950/70',
        scrolled ? 'shadow-lg shadow-zinc-900/5 dark:shadow-black/40' : '',
      ].join(' ')}
    >
      <div className={`relative mx-auto flex w-full max-w-[1360px] items-center justify-between gap-1.5 sm:gap-3 px-3 transition-[height] duration-300 motion-reduce:transition-none sm:px-6 lg:px-8 ${scrolled ? 'h-14' : 'h-16'}`}>

        {/* LEFT: hamburger + logo */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {onToggleMobileMenu && (
            <button
              type="button"
              aria-label="Open menu"
              onClick={onToggleMobileMenu}
              className={`rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/60 xl:hidden ${FOCUS_RING}`}
            >
              <Menu className="h-6 w-6 sm:h-6 sm:w-6" />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(P('home'))}
            className={`group flex min-w-0 shrink items-center gap-2 sm:gap-3 rounded-xl text-left transition-transform hover:scale-[1.02] active:scale-95 ${FOCUS_RING}`}
          >
            <img
              src="/sellermath-logo.png"
              alt="SellerMath"
              className="h-8 w-8 shrink-0 rounded-xl object-cover drop-shadow-md transition-all duration-300 group-hover:rotate-3 group-hover:drop-shadow-xl"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">SellerMath</h1>
              <p className="hidden truncate text-[10px] text-zinc-500 dark:text-zinc-400 sm:block sm:text-xs">Profit Intelligence</p>
            </div>
          </button>
        </div>

        {/* CENTER: nav dock (desktop xl+, centered like before) */}
        <div
          onMouseMove={handleDockMove}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setPill((p) => ({ ...p, visible: false }));
          }}
          className="group/nav absolute left-1/2 hidden -translate-x-1/2 items-center rounded-2xl p-1 xl:flex"
        >
          <div className="pointer-events-none absolute inset-0 z-0 rounded-2xl border border-zinc-200/60 bg-zinc-100/60 dark:border-zinc-800/60 dark:bg-zinc-900/50" />
          <div
            className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/nav:opacity-100"
            style={{ background: 'radial-gradient(140px circle at var(--x, 50%) var(--y, 50%), rgba(56,189,248,0.16), transparent 80%)' }}
          />

          <nav ref={navRef} aria-label="Primary" className="relative z-10 flex items-center">
            {/* sliding hover pill */}
            <span
              aria-hidden
              className={[
                'pointer-events-none absolute inset-y-0 rounded-xl border border-zinc-200/70 bg-white shadow-sm dark:border-zinc-700/60 dark:bg-zinc-800',
                'transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                pill.instant ? '!transition-[opacity]' : '',
                pill.visible ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
              style={{ left: pill.left, width: pill.width }}
            />

            {NAV.map((item) => {
              const isActive = item.children
                ? item.children.some((c) => c.id === currentPage)
                : item.id === currentPage;
              return (
                <div
                  key={item.id}
                  className="relative"
                  onPointerEnter={(e) => handleSlotEnter(e, item)}
                  onPointerLeave={handleSlotLeave}
                >
                  {item.children ? (
                    <NavDropdown
                      item={item}
                      isActive={isActive}
                      isOpen={openMenu === item.id}
                      currentPage={currentPage}
                      onToggle={() => setOpenMenu((c) => (c === item.id ? null : item.id))}
                      onNavigate={navigate}
                    />
                  ) : (
                    <button
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => navigate(P(item.id))}
                      className={navBtnClass(isActive)}
                    >
                      {item.label}
                      {isActive && <ActiveDot />}
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-3">
          <button
            type="button"
            aria-label="Search tools"
            onClick={() => setCmdOpen(true)}
            className={`group relative flex items-center gap-2 overflow-hidden rounded-xl border border-zinc-200/80 bg-white/70 px-2 py-1.5 text-zinc-600 shadow-sm transition-all hover:border-cyan-400/60 hover:bg-white hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-cyan-500/40 dark:hover:bg-zinc-900 md:px-3 ${FOCUS_RING}`}
          >
            <span className="absolute inset-0 z-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <Search className="relative z-10 h-4 w-4 transition-transform group-hover:scale-110 group-hover:text-cyan-500" />
            <span className="relative z-10 hidden text-xs font-medium md:inline">Search…</span>
            <kbd className="relative z-10 hidden items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 md:inline-flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          <button
            type="button"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={onToggleDark}
            className={`group relative rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-amber-500 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-yellow-400 ${FOCUS_RING}`}
          >
            <span className="relative block h-5 w-5">
              <Sun className={`absolute inset-0 h-5 w-5 transition-all duration-500 group-hover:rotate-45 motion-reduce:transition-none ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
              <Moon className={`absolute inset-0 h-5 w-5 transition-all duration-500 group-hover:-rotate-12 motion-reduce:transition-none ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
            </span>
          </button>

          <SMAvatarMenu onNavigate={navigate} />
        </div>
      </div>

      {/* scroll progress */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
        <div ref={barRef} className="h-full origin-left scale-x-0 bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500 will-change-transform" />
      </div>

      {mounted && createPortal(
        <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onNavigate={navigate} currentPage={currentPage} />,
        document.body,
      )}
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   NAV BUTTON + DROPDOWN
   ═══════════════════════════════════════════════════════════════════ */

function navBtnClass(active: boolean) {
  return [
    'relative flex items-center gap-1 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-colors duration-200',
    FOCUS_RING,
    active
      ? 'font-semibold text-emerald-500 dark:text-emerald-400'
      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50',
  ].join(' ');
}

function ActiveDot() {
  return (
    <span aria-hidden className="absolute -bottom-0.5 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
  );
}

function NavDropdown({
  item, isActive, isOpen, currentPage, onToggle, onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  isOpen: boolean;
  currentPage?: PageId;
  onToggle: () => void;
  onNavigate: (p: PageId) => void;
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(isOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(raf);
    }
    setAnimate(false);
    const t = setTimeout(() => setShouldRender(false), 200);
    return () => clearTimeout(t);
  }, [isOpen]);

  const items = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? []);

  const onPanelKey = (e: React.KeyboardEvent) => {
    const list = items();
    if (!list.length) return;
    const i = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
    if (e.key === 'Escape') { onToggle(); btnRef.current?.focus(); }
  };

  const onBtnKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) onToggle();
      setTimeout(() => items()[0]?.focus(), 60);
    }
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={onToggle}
        onKeyDown={onBtnKey}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={navBtnClass(isActive)}
      >
        {item.label}
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
        {isActive && <ActiveDot />}
      </button>

      {shouldRender && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2">
          <div
            ref={panelRef}
            role="menu"
            onKeyDown={onPanelKey}
            className={[
              'relative min-w-[300px] origin-top overflow-hidden rounded-2xl border p-2 backdrop-blur-2xl',
              'border-zinc-200 bg-white/95 shadow-2xl shadow-zinc-950/15',
              'dark:border-zinc-800 dark:bg-zinc-900/95 dark:shadow-black/60',
              'transition-all duration-200 ease-out motion-reduce:transition-none',
              animate ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-2 scale-95 opacity-0',
            ].join(' ')}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

            {item.children!.map((child, idx) => {
              const Icon = child.icon;
              const current = child.id === currentPage;
              const delay = { transitionDelay: animate ? `${idx * 40}ms` : '0ms' };

              if (child.disabled) {
                return (
                  <div
                    key={child.id}
                    style={delay}
                    className={`flex cursor-not-allowed items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all duration-300 motion-reduce:transition-none ${animate ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-500/20 bg-zinc-500/10 text-zinc-500 dark:text-zinc-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 whitespace-nowrap text-sm font-medium text-zinc-500 dark:text-zinc-400">{child.label}</span>
                    <span className="rounded-full border border-zinc-300/60 bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:border-zinc-700/60 dark:bg-zinc-800 dark:text-zinc-400">Soon</span>
                  </div>
                );
              }

              return (
                <button
                  key={child.id}
                  type="button"
                  role="menuitem"
                  onClick={() => onNavigate(child.id)}
                  style={delay}
                  className={[
                    'group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-300 motion-reduce:transition-none',
                    FOCUS_RING,
                    current
                      ? 'border-emerald-500/20 bg-emerald-500/10'
                      : 'border-transparent hover:border-zinc-300/50 hover:bg-zinc-100 focus-visible:bg-zinc-100 dark:hover:border-zinc-700/50 dark:hover:bg-zinc-800/60 dark:focus-visible:bg-zinc-800/60',
                    animate ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
                  ].join(' ')}
                >
                  <span className="absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-emerald-400 transition-all duration-300 group-hover:h-6 group-focus-visible:h-6" />
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110 ${TONE[child.tone ?? 'emerald']}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block whitespace-nowrap text-sm font-medium ${current ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-200'}`}>{child.label}</span>
                    {child.hint && <span className="block whitespace-nowrap text-[11px] text-zinc-500">{child.hint}</span>}
                  </span>
                  {child.badge && (
                    <span className="animate-pulse rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white motion-reduce:animate-none">{child.badge}</span>
                  )}
                  {current
                    ? <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    : <ChevronRight className="h-4 w-4 shrink-0 -translate-x-2 text-zinc-400 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AVATAR MENU
   ═══════════════════════════════════════════════════════════════════ */

function SMAvatarMenu({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, ref, close);
  const { copied, share } = useShare(close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`group relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 transition-all hover:scale-105 hover:ring-2 hover:ring-emerald-400 active:scale-95 ${FOCUS_RING}`}
      >
        <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 opacity-0 blur transition-opacity duration-300 group-hover:opacity-50" />
        <span className="text-xs font-bold text-white">SM</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right animate-in fade-in zoom-in-95 overflow-hidden rounded-xl border border-zinc-200 bg-white/95 py-1.5 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95">
          {copied ? (
            <span className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4 animate-bounce motion-reduce:animate-none" /> Copied Link!
            </span>
          ) : (
            <button type="button" onClick={share} className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60">
              <Share2 className="h-4 w-4 text-zinc-500 transition-transform group-hover:-translate-y-0.5 group-hover:scale-110" /> Share Tools
            </button>
          )}
          <button
            type="button"
            onClick={() => { setOpen(false); onNavigate(P('contact')); }}
            className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
          >
            <LifeBuoy className="h-4 w-4 text-zinc-500 transition-transform group-hover:rotate-12 group-hover:scale-110" /> Contact Support &amp; Feedback
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMMAND PALETTE  (↑ ↓ Enter Esc)
   ═══════════════════════════════════════════════════════════════════ */

function CommandPalette({
  isOpen, onClose, onNavigate, currentPage,
}: {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (p: PageId) => void;
  currentPage?: PageId;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return ALL_TOOLS;
    return ALL_TOOLS.filter((t) => {
      const hay = `${t.label} ${t.hint ?? ''} ${t.group}`.toLowerCase();
      return tokens.every((tok) => hay.includes(tok));
    });
  }, [query]);

  useEffect(() => { if (isOpen) { setQuery(''); setActive(0); } }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!isOpen) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (filtered.length ? (i + 1) % filtered.length : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) onNavigate(filtered[active].id); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex animate-in fade-in items-start justify-center bg-zinc-950/40 px-4 pt-[12vh] backdrop-blur-sm duration-200"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search tools"
        onKeyDown={onKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg animate-in zoom-in-95 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl duration-200 dark:border-zinc-800/80 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800/80">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            placeholder="Search tools, calculators…"
            className="h-14 flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-50"
          />
          <kbd className="hidden rounded border border-zinc-200 px-1.5 font-mono text-[10px] text-zinc-500 dark:border-zinc-700 sm:inline">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-[22rem] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-zinc-500">No tools found for “{query}”.</p>
          )}
          {filtered.map((tool, i) => {
            const showGroup = i === 0 || filtered[i - 1].group !== tool.group;
            const isActiveRow = i === active;
            const Icon = tool.icon;
            return (
              <React.Fragment key={`${tool.group}-${tool.id}`}>
                {showGroup && (
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{tool.group}</p>
                )}
                <button
                  type="button"
                  data-idx={i}
                  onClick={() => onNavigate(tool.id)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-150 ${
                    isActiveRow ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isActiveRow ? 'bg-emerald-500 text-white shadow-md' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{tool.label}</span>
                    {tool.hint && <span className="block truncate text-[11px] text-zinc-500">{tool.hint}</span>}
                  </span>
                  {tool.id === currentPage && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800">Current</span>
                  )}
                  {isActiveRow && <CornerDownLeft className="h-4 w-4 shrink-0" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-2 text-[11px] text-zinc-500 dark:border-zinc-800/80">
          <span className="flex items-center gap-3">
            <span><kbd className="rounded border border-zinc-200 px-1 font-mono dark:border-zinc-700">↑</kbd> <kbd className="rounded border border-zinc-200 px-1 font-mono dark:border-zinc-700">↓</kbd> move</span>
            <span><kbd className="rounded border border-zinc-200 px-1 font-mono dark:border-zinc-700">↵</kbd> open</span>
          </span>
          <span>{filtered.length} tool{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PROFILE DROPDOWN (kept exported for backwards compatibility)
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
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(isOpen, ref, onClose);
  const { copied, share } = useShare(onClose);

  if (!isOpen) return null;

  return (
    <div ref={ref} className="absolute right-0 z-50 mt-2 w-56 origin-top-right animate-in fade-in zoom-in-95 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      {copied ? (
        <span className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <Check className="h-4 w-4" /> Copied!
        </span>
      ) : (
        <button type="button" onClick={share} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50">
          <Share2 className="h-4 w-4 text-zinc-500" /> Share Tools
        </button>
      )}
      <button
        type="button"
        onClick={() => { onClose(); onNavigate(P('contact')); }}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/50"
      >
        <LifeBuoy className="h-4 w-4 text-zinc-500" /> Contact Support &amp; Feedback
      </button>
    </div>
  );
}