import React, { useState } from 'react';
import {
  Users,
  Mail,
  MapPin,
  Clock,
  Shield,
  FileText,
  CheckCircle2,
  Copy,
  Send,
  LayoutGrid,
  Building2,
  ArrowRight,
  AlertTriangle,
  Lock,
  CreditCard,
  RefreshCw,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

type LegalSection = 'about' | 'contact' | 'privacy' | 'terms' | 'refund' | 'disclaimer';

interface CompanyLegalPagesProps {
  activeSection: LegalSection;
  onNavigate: (page: LegalSection) => void;
}

const SEGMENTS: { id: LegalSection; label: string; icon: React.ElementType }[] = [
  { id: 'about', label: 'About Us', icon: Users },
  { id: 'contact', label: 'Contact Us', icon: Mail },
  { id: 'privacy', label: 'Privacy Policy', icon: Shield },
  { id: 'terms', label: 'Terms & Conditions', icon: FileText },
  { id: 'refund', label: 'Refund Policy', icon: RefreshCw },
  { id: 'disclaimer', label: 'Disclaimer', icon: AlertTriangle },
];

export default function CompanyLegalPages({ activeSection, onNavigate }: CompanyLegalPagesProps) {
  return (
    <div className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 box-border overflow-x-hidden">
      
      {/* FIX #1 & #3: Removed sticky positioning. Added clean responsive pill bar. */}
      <div className="w-full overflow-x-auto no-scrollbar mb-6 sm:mb-8">
        <div className="inline-flex sm:flex sm:flex-wrap items-center justify-start sm:justify-center gap-1.5 p-1.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 min-w-max sm:min-w-0 mx-auto">
          {SEGMENTS.map((segment) => {
            const isActive = activeSection === segment.id;
            const Icon = segment.icon;
            return (
              <button
                key={segment.id}
                type="button"
                onClick={() => {
                  // FIX #4: Smooth scroll to top on click
                  onNavigate(segment.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-pressed={isActive}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'currentColor'}`} strokeWidth={1.5} />
                <span>{segment.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FIX #2: Developer subtitle removed. Content starts cleanly below. */}
      <div className="space-y-10">
        {activeSection === 'about' && <AboutSection />}
        {activeSection === 'contact' && <ContactSection onNavigate={onNavigate} />}
        {activeSection === 'privacy' && <PrivacySection />}
        {activeSection === 'terms' && <TermsSection />}
        {activeSection === 'refund' && <RefundSection />}
        {activeSection === 'disclaimer' && <DisclaimerSection />}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, badge, subtitle }: { icon: React.ElementType; title: string; badge?: string; subtitle: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
          <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
        </div>
        <div>
          {badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              {badge}
            </span>
          )}
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">{title}</h2>
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed max-w-md sm:max-w-none">{subtitle}</p>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-6 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-1">{children}</h3>;
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{children}</p>;
}

function StatCard({ number, label, caption, Icon }: { number: string; label: string; caption: string; Icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 hover:border-emerald-500/50 transition-colors duration-200">
      <div className="w-11 h-11 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-1">{number}</div>
      <div className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">{label}</div>
      <div className="text-xs text-slate-500 dark:text-zinc-500 leading-relaxed">{caption}</div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-10">
      <SectionHeader
        icon={Building2}
        badge="🇮🇳 BUILT FOR INDIAN E-COMMERCE"
        title="Empowering Indian Marketplace Sellers with Precision Profit Intelligence & AI"
        subtitle="Headquartered in Kolkata, West Bengal — helping D2C brands and marketplace sellers stop profit leaks across Amazon, Flipkart, Meesho, Myntra, Nykaa, Ajio, JioMart, and Snapdeal."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <StatCard
          number="8+"
          label="Indian Marketplaces Supported"
          caption="Amazon, Flipkart, Meesho, Myntra, Nykaa, Ajio, JioMart, Snapdeal."
          Icon={LayoutGrid}
        />
        <StatCard
          number="11+"
          label="Seller Utility & AI Tools"
          caption="Profit calculators, GST invoicing, AI background remover, lifestyle studio & more."
          Icon={BarChart3}
        />
        <StatCard
          number="100%"
          label="Client-Side Privacy"
          caption="WASM & Local Storage — your data never leaves your browser."
          Icon={Lock}
        />
        <StatCard
          number="₹0"
          label="Hidden Spreadsheets Needed"
          caption="All marketplace fee math is built in — no manual tracking required."
          Icon={CreditCard}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mt-0.5">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle>Why SellerMath Exists</CardTitle>
                <CardBody>
                  Indian marketplace sellers lose <strong className="text-slate-900 dark:text-zinc-200">15%–30% of their margins</strong> to hidden referral fees, closing charges, volumetric weight jumps, TCS/TDS deductions, and RTO (Return-to-Origin) courier penalties. SellerMath surfaces these hidden costs before you list, so you price for real profit — not guesswork.
                </CardBody>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100/60 dark:border-zinc-800/60 space-y-4">
              <CardTitle>Our 3 Core Pillars</CardTitle>
              <div className="space-y-3">
                <Pillar
                  number="1"
                  title="Marketplace Fee & Settlement Calculators"
                  body="Live commission slabs, closing fees, shipping rate cards, and GST/TDS breakdowns across Amazon, Flipkart, Meesho, Myntra, Nykaa, Ajio, JioMart, and Snapdeal — so you know your exact net payout per order."
                />
                <Pillar
                  number="2"
                  title="Client-Side AI Product Studio"
                  body="Pure white #FFFFFF cutouts via @imgly/background-removal running in WebAssembly, plus FLUX AI Lifestyle Compositing for marketplace-ready product photography — all processed locally in your browser."
                />
                <Pillar
                  number="3"
                  title="Instant GST Billing & UPI Invoicing"
                  body="Generate GST-compliant invoices with HSN lookup, TCS/TDS calculation, and UPI payment links in seconds — no accounting software required."
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="h-full">
            <div className="flex items-start gap-3 mb-5">
              <div className="shrink-0 w-9 h-9 rounded-xl bg-blue-50/60 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mt-0.5">
                <Users className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle>Headquartered in Kolkata, West Bengal</CardTitle>
                <CardBody>
                  Built by sellers, for sellers. We understand the unique margin pressures of selling on Indian marketplaces and design every tool to protect your bottom line.
                </CardBody>
              </div>
            </div>
            <div className="space-y-4">
              <TrustChip label="Made in India 🇮🇳" />
              <TrustChip label="No Server-Side Image Storage" />
              <TrustChip label="Free Forever Tier Available" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Pillar({ number, title, body }: { number: string | number; title: string; body: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-200/50 dark:border-emerald-500/10">
        {number}
      </div>
      <div>
        <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">{title}</div>
        <div className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-0.5">{body}</div>
      </div>
    </div>
  );
}

function TrustChip({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-800/40 text-xs text-slate-600 dark:text-zinc-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      <span>{label}</span>
    </div>
  );
}

function ContactSection({ onNavigate }: { onNavigate: (page: LegalSection) => void }) {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const EMAIL = 'sellermath@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMail = () => {
    window.location.href = `mailto:${EMAIL}`;
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const marketplace = formData.get('marketplace') as string;
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    const mailtoSubject = encodeURIComponent(`[SellerMath Contact] ${subject}`);
    const mailtoBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nMarketplace: ${marketplace}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:${EMAIL}?subject=${mailtoSubject}&body=${mailtoBody}`;

    setConfirmation(`✓ Message prepared for ${EMAIL}!`);
    form.reset();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      {/* Left Column */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <ContactCard
          icon={Mail}
          title="Official Support & Inquiries Email"
          value={EMAIL}
          actions={[
            <button
              key="copy"
              type="button"
              onClick={handleCopyEmail}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs text-slate-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors w-full"
            >
              <Copy className="w-4 h-4" strokeWidth={1.5} />
              {copied ? 'Copied!' : 'Copy Email'}
            </button>,
            <button
              key="open"
              type="button"
              onClick={handleOpenMail}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20 w-full"
            >
              <Mail className="w-4 h-4" strokeWidth={1.5} />
              Open in Gmail
            </button>,
          ]}
        />

        <ContactCard
          icon={MapPin}
          title="Headquarters / Operating Location"
          value="Kolkata, West Bengal, India"
          body="Registered operating base for all SellerMath support, compliance, and grievance redressal operations."
        />

        <ContactCard
          icon={Clock}
          title="Support Hours"
          value="Monday – Saturday, 10:00 AM – 7:00 PM IST"
          body="Response within 24 business hours. All support requests are routed to sellermath@gmail.com."
        />

        <ContactCard
          icon={Shield}
          title="Grievance Officer / Compliance Desk"
          value="SellerMath Compliance Team, Kolkata, West Bengal"
          subvalue={EMAIL}
          body="Required for Indian IT Act & Payment Gateway KYC. Contact the compliance desk for any regulatory or grievance matter."
          actions={[
            <button
              key="open"
              type="button"
              onClick={handleOpenMail}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20 w-full col-span-2"
            >
              <Mail className="w-4 h-4" strokeWidth={1.5} />
              Email Compliance Desk
            </button>,
          ]}
        />
      </div>

      {/* Right Column (Form) */}
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm h-fit">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Send us a Message</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
            We read every message. For grievance &amp; KYC matters, write to the Compliance Desk at {EMAIL}.
          </p>
        </div>

        {confirmation && (
          <div className="mb-6 rounded-xl border border-emerald-200/60 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-500/10 px-4 py-3 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">{confirmation}</div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Your Name</label>
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Rajesh Sharma"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Work / Store Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@yourstore.com"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Primary Marketplace</label>
            <select
              name="marketplace"
              defaultValue="Amazon"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            >
              <option>Amazon</option>
              <option>Flipkart</option>
              <option>Meesho</option>
              <option>Other</option>
            </select>
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Subject</label>
            <select
              name="subject"
              defaultValue="Billing & Pro Plan"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            >
              <option>Bug Report</option>
              <option>Feature Request</option>
              <option>Billing & Pro Plan</option>
              <option>Partnership</option>
            </select>
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Message</label>
            <textarea
              name="message"
              required
              rows={5}
              placeholder="Tell us how we can help..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          
          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-600 dark:to-teal-600 dark:hover:from-emerald-700 dark:hover:to-teal-700 transition-all active:scale-[0.98]"
            >
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
              Send Message
            </button>
            <p className="mt-4 text-xs text-slate-500 dark:text-zinc-500 text-center">
              By submitting this form, you agree to our{' '}
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2"
              >
                Privacy Policy
              </button>
              .
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  value,
  subvalue,
  body,
  actions,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  subvalue?: string;
  body?: string;
  actions?: React.ReactNode[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400">
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="text-[11px] sm:text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            {title}
          </div>
          
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 break-all leading-tight">
            {value}
          </div>
          
          {subvalue && (
            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1 break-all">
              {subvalue}
            </div>
          )}
          {body && (
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2 leading-relaxed">
              {body}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 w-full">
          {actions}
        </div>
      )}
    </div>
  );
}

function PrivacySection() {
  return (
    <div className="space-y-8">
      <SectionHeader
        icon={Lock}
        title="Privacy Policy — DPDP Act 2023 & Browser-First Privacy"
        subtitle="Last Updated: November 2026. SellerMath is built on a zero-server-leak architecture so your seller data never leaves your device unless you choose to share it."
      />

      <Card className="space-y-6">
        <CardTitle>Zero-Server-Leak Architecture</CardTitle>
        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-2">
          SellerMath processes your sensitive seller data — product photos, GST invoice drafts, profit calculations, and AI credits — entirely inside your browser. Nothing is permanently uploaded to SellerMath servers.
        </p>

        <div className="space-y-4">
          <PrivacyPillar
            icon={BarChart3}
            title="Client-Side AI Background Removal"
            body={
              <>
                Uploaded product photos in the AI Background Remover are processed <strong>100% locally</strong> inside your browser via WebAssembly (WASM). Raw product photos are <strong>never permanently stored on SellerMath servers</strong>. They exist only in your browser session memory.
              </>
            }
          />
          <PrivacyPillar
            icon={FileText}
            title="Local Storage Data"
            body={
              <>
                GST Invoice drafts, calculation histories, and daily AI studio credit counters (<code className='font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded'>sellermath_bg_credits</code>, <code className='font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded'>sellermath_img_credits</code>) are stored locally in your browser's{' '}
                <strong>localStorage</strong>, not on our servers. Clearing your browser data will remove these records.
              </>
            }
          />
          <PrivacyPillar
            icon={Users}
            title="Information We Collect"
            body={
              <>
                We only collect information you voluntarily provide: email submissions (for bonus credits / newsletter), support emails sent to{' '}
                <a href="mailto:sellermath@gmail.com" className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-500 dark:hover:text-emerald-400">
                  sellermath@gmail.com
                </a>
                , and anonymized analytics/cookies for service improvement.
              </>
            }
          />
          <PrivacyPillar
            icon={Shield}
            title="Compliance & Your Rights"
            body={
              <>
                SellerMath is compliant with the <strong>Information Technology Act, 2000</strong> and India's{' '}
                <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>. You may request deletion of your personal data at any time by writing to{' '}
                <a href="mailto:sellermath@gmail.com" className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-500 dark:hover:text-emerald-400">
                  sellermath@gmail.com
                </a>
                .
              </>
            }
          />
        </div>
      </Card>
    </div>
  );
}

function PrivacyPillar({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mt-0.5">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">{title}</div>
        <div className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-0.5">{body}</div>
      </div>
    </div>
  );
}

function TermsSection() {
  const sections = [
    {
      title: 'Governing Law & Jurisdiction',
      body:
        'These Terms & Conditions are governed by the laws of India. Any dispute arising from the use of SellerMath shall be subject to the exclusive jurisdiction of the <strong>Courts of Kolkata, West Bengal, India</strong>.',
    },
    {
      title: 'Permitted Use',
      body:
        'SellerMath offers a free daily tier with fair-use daily credit limits for the AI Background Remover and AI Lifestyle Image Generator. Automated scraping, bulk harvesting of rate cards, reverse engineering, or any abusive use of the service is strictly prohibited. We reserve the right to suspend accounts that violate fair-use limits.',
    },
    {
      title: 'User Content & Intellectual Property',
      body:
        'Sellers retain <strong>100% ownership</strong> of their uploaded product images, brand logos, and generated GST invoices. SellerMath does not claim any ownership over your content. You are responsible for ensuring your content complies with applicable marketplace rules.',
    },
    {
      title: 'Marketplace Trademarks & Affiliation',
      body:
        'Amazon, Flipkart, Meesho, Myntra, Nykaa, Ajio, JioMart, and Snapdeal are trademarks of their respective owners. SellerMath is an independent software utility and is <strong>not officially affiliated with or endorsed by</strong> these marketplaces. All fee and rate card data are estimates compiled from public sources and should be verified against your official seller dashboard.',
    },
    {
      title: 'Limitation of Liability',
      body:
        'SellerMath is provided "as is" without warranties of any kind. We are not liable for any direct, indirect, incidental, or consequential damages arising from the use of, or reliance on, calculations produced by this tool. You use SellerMath at your own risk.',
    },
    {
      title: 'Changes to Terms',
      body:
        'We reserve the right to update or modify these Terms at any time. Continued use of SellerMath after changes constitutes acceptance of the revised terms. Questions? Contact us at sellermath@gmail.com.',
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={FileText}
        title="Terms & Conditions"
        subtitle="Governing law & jurisdiction: Courts of Kolkata, West Bengal, India. Last updated November 2026."
      />

      <Card className="space-y-4">
        {sections.map((section, i) => (
          <div key={i} className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{section.title}</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

function RefundSection() {
  return (
    <div className="space-y-8">
      <SectionHeader
        icon={RefreshCw}
        title="Refund & Cancellation Policy — Payment Gateway KYC Ready"
        subtitle="Tailored for digital SaaS subscriptions and credit packs. All refund claims should be submitted to sellermath@gmail.com."
      />

      <Card className="space-y-6">
        <RefundCard
          icon={CreditCard}
          title="Free Forever Tier"
          body={
            <>
              Core calculators, GST invoicing, and daily free AI Studio quotas require <strong>no credit card or payment</strong>. The free tier is not a paid service and therefore carries no refund obligation.
            </>
          }
        />
        <RefundCard
          icon={TrendingUp}
          title="Pro Subscriptions & Add-On Credits"
          body={
            <>
              When upgrading to paid SellerMath Pro plans or purchasing add-on credit packs, you may <strong>cancel recurring renewals at any time before the next billing cycle</strong>. Cancellation takes effect at the end of your current paid period; no partial-period refunds are issued for unused days.
            </>
          }
        />
        <RefundCard
          icon={Shield}
          title="7-Day Technical Issue Refund Guarantee"
          body={
            <>
              If a paid Pro feature fails to function as described due to a technical defect on SellerMath, and our engineering team cannot resolve it within <strong>72 hours</strong> of your report to sellermath@gmail.com, a <strong>100% full refund</strong> will be processed to the original payment source (UPI / Card / NetBanking) within <strong>5–7 business days</strong>.
            </>
          }
        />
        <RefundCard
          icon={AlertTriangle}
          title="Duplicate Charges"
          body={
            <>
              Accidental duplicate payments are refunded <strong>100% within 5 business days</strong>. Please include your transaction ID and date of payment when writing to sellermath@gmail.com.
            </>
          }
        />
      </Card>

      <Card className="bg-emerald-50/40 dark:bg-emerald-500/5 border border-emerald-200/30 dark:border-emerald-500/10">
        <div className="flex gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white mt-0.5">
            <AlertTriangle className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100">How to Request a Refund</div>
            <div className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed mt-0.5">
              Email <a href="mailto:sellermath@gmail.com" className="underline underline-offset-2 hover:text-emerald-600 dark:hover:text-emerald-400">sellermath@gmail.com</a> with your registered email, order/transaction ID, and a short description of the issue. We acknowledge all refund requests within 24 business hours.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function RefundCard({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-zinc-100/50 dark:border-zinc-800/20 pb-5 last:border-0 last:pb-0">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 mt-0.5">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">{title}</div>
        <div className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-0.5">{body}</div>
      </div>
    </div>
  );
}

function DisclaimerSection() {
  return (
    <div className="space-y-8">
      <SectionHeader
        icon={AlertTriangle}
        title="Financial, Tax & Marketplace Fee Disclaimer"
        subtitle="Important legal and financial notices. SellerMath is an estimation and automation tool — not a substitute for professional advice."
      />

      <Card className="space-y-6">
        <DisclaimerCard
          icon={TrendingUp}
          title="Fee & Rate Card Estimates"
          body={
            <>
              While SellerMath updates marketplace commission slabs, closing fees, and shipping rate cards regularly, e-commerce platforms (Amazon, Flipkart, Meesho, Myntra, Nykaa, Ajio, JioMart, and Snapdeal) <strong>revise seller rate cards periodically</strong>. All SellerMath outputs are <strong>estimates for planning purposes</strong>. Sellers must verify final payouts and charges in their official Seller Central / marketplace dashboards before making fulfillment or pricing decisions.
            </>
          }
        />
        <DisclaimerCard
          icon={FileText}
          title="Tax & GST Disclaimer"
          body={
            <>
              SellerMath's GST Invoice Generator, HSN lookup, and TCS/TDS calculators are software automation tools. They <strong>do not constitute formal Chartered Accountant (CA) or legal tax advice</strong>. GST rates, HSN classifications, and TCS/TDS applicability vary by category, state, and transaction. Consult a qualified Chartered Accountant or tax professional before filing returns or making tax decisions based on SellerMath outputs.
            </>
          }
        />
        <DisclaimerCard
          icon={BarChart3}
          title="AI Studio Output Disclaimer"
          body={
            <>
              AI-generated lifestyle backgrounds are synthesized via machine learning models (FLUX / WASM). Outputs may not perfectly represent your physical merchandise. Sellers are <strong>responsible for ensuring exported product listings accurately represent their physical merchandise</strong> per marketplace compliance rules and local consumer-protection laws. SellerMath is not liable for listing rejections, account suspensions, or disputes arising from AI-generated imagery.
            </>
          }
        />
      </Card>

      <Card className="bg-amber-50/40 dark:bg-amber-500/5 border border-amber-200/30 dark:border-amber-500/10">
        <div className="flex gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white mt-0.5">
            <AlertTriangle className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-900 dark:text-amber-100">Questions about this disclaimer?</div>
            <div className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed mt-0.5">
              Write to <a href="mailto:sellermath@gmail.com" className="underline underline-offset-2 hover:text-amber-600 dark:hover:text-amber-400">sellermath@gmail.com</a> (SellerMath Compliance Team, Kolkata, West Bengal).
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DisclaimerCard({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-zinc-100/50 dark:border-zinc-800/20 pb-5 last:border-0 last:pb-0">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 mt-0.5">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-sm font-bold text-slate-900 dark:text-zinc-100">{title}</div>
        <div className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mt-0.5">{body}</div>
      </div>
    </div>
  );
}