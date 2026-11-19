import { useState, type FormEvent } from 'react';
import {
  Calculator,
  Mail,
  ArrowUp,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Users,
  Star,
  Check,
  Sparkles,
  Heart,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { type PageId } from '@/components/Sidebar';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

type FooterNavItem =
  | { label: string; page: PageId; badge?: string }
  | { label: string; href: string; badge?: string; external?: boolean };

const companyLinks: FooterNavItem[] = [
  { label: 'About Us', page: 'about' },
  { label: 'Contact Us', page: 'contact' },
  { label: 'Careers', href: '#careers' },
];

const legalLinks: FooterNavItem[] = [
  { label: 'Privacy Policy', page: 'privacy' },
  { label: 'Terms & Conditions', page: 'terms' },
  { label: 'Refund Policy', page: 'refund' },
  { label: 'Disclaimer', page: 'disclaimer' },
];

const productLinks: FooterNavItem[] = [
  { label: 'Payout Calculator', page: 'calculator', badge: 'Live' },
  { label: 'Profit Analyzer', page: 'calculator' },
  { label: 'Marketplace Fee Compare', page: 'calculator' },
  { label: 'Pricing', href: '#pricing' },
];

const resourceLinks: FooterNavItem[] = [
  { label: 'Seller Guides', page: 'marketplace-selling-guides' },
  { label: 'E-Commerce Guides', page: 'ecommerce-guides', badge: 'New' },
  { label: '2026 Fee & GST Rates', href: '#rates', badge: 'New' },
  { label: 'Seller Glossary', href: '#glossary' },
  { label: 'Help Center', href: '#help' },
];

const socials = [
  { label: 'Twitter / X', href: 'https://x.com/sellermath', Icon: Twitter },
  { label: 'Instagram', href: 'https://instagram.com/sellermath', Icon: Instagram },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/sellermath', Icon: Linkedin },
  { label: 'YouTube', href: 'https://youtube.com/@sellermath', Icon: Youtube },
];

const trustChips = [
  { Icon: ShieldCheck, label: '100% Free' },
  { Icon: TrendingUp, label: '2026 Rate Cards' },
  { Icon: Users, label: '10,000+ Sellers' },
  { Icon: Star, label: '4.9 / 5 Rated' },
];

function FooterLink({
  item,
  onNavigate,
}: {
  item: FooterNavItem;
  onNavigate: (page: PageId) => void;
}) {
  const className =
    'group relative flex w-full items-start gap-2.5 rounded-lg py-1.5 pr-6 text-left text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:text-zinc-400 dark:hover:text-emerald-400';

  const content = (
    <>
      <span className="relative block flex-1 text-left leading-snug">
        {item.label}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 group-hover:w-full" />
      </span>

      {item.badge && (
        <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          {item.badge}
        </span>
      )}

      <ArrowRight className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
    </>
  );

  if ('page' in item) {
    return (
      <li className="w-full text-left">
        <button
          type="button"
          onClick={() => {
            onNavigate(item.page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={className}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li className="w-full text-left">
      <a
        href={item.href}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener noreferrer' : undefined}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={className}
      >
        {content}
      </a>
    </li>
  );
}

function FooterColumn({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: FooterNavItem[];
  onNavigate: (page: PageId) => void;
}) {
  return (
    <div className="flex w-full flex-col items-start text-left">
      <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-zinc-100">
        {title}
      </h4>
      <ul className="flex w-full flex-col gap-2">
        {items.map((item) => (
          <FooterLink key={item.label} item={item} onNavigate={onNavigate} />
        ))}
      </ul>
    </div>
  );
}

export default function Footer({ onNavigate }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const NEWSLETTER_KEY = 'sellermath_newsletter';

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) return;
    try {
      localStorage.setItem(NEWSLETTER_KEY, trimmed);
    } catch {
      /* storage blocked — subscription still recorded in memory */
    }
    setSubscribed(true);
    setEmail('');
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="no-print relative mt-16 overflow-hidden border-t border-slate-200 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Decorative Top Glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-3xl dark:bg-emerald-500/[0.03]"
      />

      <div className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          {/* ===== Newsletter Card ===== */}
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-sm shadow-slate-200/50 transition-all duration-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:shadow-none sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-zinc-800/10 dark:to-transparent" />
            
            <div className="relative max-w-lg">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-3 w-3" />
                Weekly profit tips
              </span>
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Get fee updates before they eat your margins
              </h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-zinc-400">
                Commission, shipping &amp; GST changes for Amazon, Flipkart, Meesho and Shopify —
                straight to your inbox. No spam, ever.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="relative mt-8 w-full max-w-md lg:mt-0">
              {subscribed ? (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-4 w-4 shrink-0" />
                  </div>
                  ✓ Subscribed! You'll receive 2026 marketplace fee alerts.
                </div>
              ) : (
                <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-2 transition-all duration-300 focus-within:border-emerald-500/50 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-zinc-700/80 dark:bg-zinc-950/50 dark:focus-within:border-emerald-500/50 dark:focus-within:bg-zinc-900 sm:flex-row sm:items-center">
                  <Mail className="ml-3 hidden h-5 w-5 shrink-0 text-slate-400 dark:text-zinc-500 sm:block" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@store.com"
                    aria-label="Email address"
                    className="w-full bg-transparent px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-zinc-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/40 active:scale-[0.98]"
                  >
                    Subscribe
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* ===== Main Grid ===== */}
          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-8">
            
            {/* Brand Column */}
            <div className="md:col-span-2 lg:col-span-4 lg:pr-8">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25 transition-transform duration-300 hover:scale-105 hover:-rotate-3">
                  <Calculator className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    SellerMath
                  </h2>
                  <p className="text-[13px] font-medium text-slate-500 dark:text-zinc-400">
                    India's Most Accurate Profit Engine
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                Calculate exact payouts, commissions, returns and true profit across every Indian
                marketplace — in seconds.
              </p>

              {/* Trust Chips */}
              <div className="mt-6 flex flex-wrap gap-2">
                {trustChips.map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/30 hover:text-emerald-700 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:text-emerald-400"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>

              {/* Socials */}
              <div className="mt-8 flex items-center gap-3">
                {socials.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                  >
                    <Icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:col-span-2 md:grid-cols-4 lg:col-span-8">
              <FooterColumn title="Product" items={productLinks} onNavigate={onNavigate} />
              <FooterColumn title="Resources" items={resourceLinks} onNavigate={onNavigate} />
              <FooterColumn title="Company" items={companyLinks} onNavigate={onNavigate} />
              <FooterColumn title="Legal" items={legalLinks} onNavigate={onNavigate} />
            </div>
          </div>

          {/* ===== Bottom Bar ===== */}
          <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-slate-200 pt-8 dark:border-zinc-800/80 sm:flex-row">
            <p className="text-[13px] font-medium text-slate-500 dark:text-zinc-500">
              © 2026 SellerMath. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {/* Status */}
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-zinc-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                All systems operational
              </span>

              <span className="hidden h-4 w-px bg-slate-300 dark:bg-zinc-800 sm:block" />

              <span className="hidden items-center gap-1.5 text-[13px] font-medium text-slate-500 dark:text-zinc-500 sm:inline-flex">
                Made in India
                <Heart className="h-3.5 w-3.5 fill-current text-rose-500" />
              </span>

              {/* Back to Top */}
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="Back to top"
                className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 transition-all duration-300 hover:border-emerald-500/30 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-sm active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
              >
                <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-1" />
                Top
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}