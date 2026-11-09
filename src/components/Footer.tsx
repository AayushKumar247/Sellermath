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

/**
 * A footer link can either navigate to an in-app page (PageId)
 * or point to an anchor / external URL.
 */
type FooterNavItem =
  | { label: string; page: PageId; badge?: string }
  | { label: string; href: string; badge?: string; external?: boolean };

// Pages that already exist in your PageId union
const companyLinks: FooterNavItem[] = [
  { label: 'About Us', page: 'about' },
  { label: 'Contact Us', page: 'contact' },
  { label: 'Careers', href: '#careers' },
];

const legalLinks: FooterNavItem[] = [
  { label: 'Privacy Policy', page: 'privacy' },
  { label: 'Terms & Conditions', page: 'terms' },
  { label: 'Refund Policy', href: '#refund' },
  { label: 'Disclaimer', href: '#disclaimer' },
];

// Product links that map to in-app calculator pages use `page` + onNavigate.
const productLinks: FooterNavItem[] = [
  { label: 'Payout Calculator', page: 'calculator', badge: 'Live' },
  { label: 'Profit Analyzer', page: 'calculator' },
  { label: 'Marketplace Fee Compare', page: 'calculator' },
  { label: 'Pricing', href: '#pricing' },
];

const resourceLinks: FooterNavItem[] = [
  { label: 'Seller Guides', href: '#blog' },
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
    'group inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:text-zinc-400 dark:hover:text-emerald-400 dark:focus-visible:ring-offset-zinc-950';

  const content = (
    <>
      <span className="relative">
        {item.label}
        {/* gradient underline that grows on hover */}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 group-hover:w-full" />
      </span>

      {item.badge && (
        <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
          {item.badge}
        </span>
      )}

      {/* arrow slides in on hover (space reserved so nothing shifts) */}
      <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
    </>
  );

  if ('page' in item) {
    return (
      <li>
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
    <li>
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
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white">
        {title}
      </h4>
      <ul className="mt-4 space-y-3">
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
    <footer className="no-print relative mt-12 overflow-hidden border-t border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950">
      {/* animated-ish gradient top line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
      {/* soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5"
      />

      <div className="relative px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* ===== Newsletter / CTA card ===== */}
          <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 transition-shadow duration-300 hover:shadow-md hover:shadow-slate-200/70 dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-none dark:hover:shadow-none sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-3 w-3" />
                Weekly profit tips
              </span>
              <h3 className="mt-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Get fee updates before they eat your margins
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-zinc-400">
                Commission, shipping &amp; GST changes for Amazon, Flipkart, Meesho and Shopify —
                straight to your inbox. No spam.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="w-full max-w-md">
              {subscribed ? (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <Check className="h-4 w-4 shrink-0" />
                  ✓ Subscribed! You'll receive 2026 marketplace fee alerts.
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white p-1.5 transition-all duration-300 focus-within:border-emerald-500/60 focus-within:ring-4 focus-within:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-emerald-500/60">
                  <Mail className="ml-2.5 h-4 w-4 shrink-0 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@store.com"
                    aria-label="Email address"
                    className="w-full bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-zinc-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/40 active:scale-95"
                  >
                    Subscribe
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* ===== Main grid ===== */}
          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:grid-cols-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-3 lg:col-span-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25 transition-transform duration-300 hover:scale-105 hover:rotate-3">
                  <Calculator className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    SellerMath
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                    India&apos;s Most Accurate E-Commerce Profit Engine
                  </p>
                </div>
              </div>

              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                Calculate exact payouts, commissions, returns and true profit across every Indian
                marketplace — in seconds.
              </p>

              {/* trust chips */}
              <div className="mt-5 flex flex-wrap gap-2">
                {trustChips.map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:text-emerald-600 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-emerald-400"
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>

              {/* socials */}
              <div className="mt-6 flex items-center gap-2">
                {socials.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:text-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-emerald-400"
                  >
                    <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <div className="lg:col-span-2">
              <FooterColumn title="Product" items={productLinks} onNavigate={onNavigate} />
            </div>
            <div className="lg:col-span-2">
              <FooterColumn title="Resources" items={resourceLinks} onNavigate={onNavigate} />
            </div>
            <div className="lg:col-span-2">
              <FooterColumn title="Company" items={companyLinks} onNavigate={onNavigate} />
            </div>
            <div className="lg:col-span-2">
              <FooterColumn title="Legal" items={legalLinks} onNavigate={onNavigate} />
            </div>
          </div>

          {/* ===== Bottom bar ===== */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-zinc-800 sm:flex-row">
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              © 2026 SellerMath. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {/* live status */}
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                All systems operational
              </span>

              <span className="hidden h-3 w-px bg-slate-300 dark:bg-zinc-700 sm:block" />

              <span className="hidden items-center gap-1 text-xs text-slate-500 dark:text-zinc-500 sm:inline-flex">
                Made in India
                <Heart className="h-3 w-3 fill-current text-rose-500" />
              </span>

              {/* back to top */}
              <button
                type="button"
                onClick={scrollToTop}
                aria-label="Back to top"
                className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-all duration-300 hover:border-emerald-500/50 hover:text-emerald-600 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-emerald-400"
              >
                <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
                Back to top
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}