'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Clock,
  Lightbulb,
  Rocket,
  Search,
  X,
  ArrowRight,
  BookOpen,
  Truck,
  CreditCard,
  Image,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trophy,
  AlertTriangle,
} from 'lucide-react';

const STORAGE_KEY = 'sellermath_completed_tutorials';

type Category =
  | 'All Tutorials'
  | 'Profit & Pricing'
  | 'AI Product Photography'
  | 'Settlements & RTO'
  | 'GST & Compliance';
type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface TutorialStep {
  title: string;
  explanation: string;
  exampleBox?: string;
  proTip?: string;
}
interface RealWorldExample {
  scenario: string;
  naiveMath: string;
  realMath: string;
  keyTakeaway: string;
}
interface Tutorial {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  readTime: string;
  difficulty: Difficulty;
  targetPage: string;
  targetLabel: string;
  Icon: React.ElementType;
  overview: string;
  realWorldExample: RealWorldExample;
  steps: TutorialStep[];
  commonMistake: string;
  formula: string;
}

const CATEGORIES: Category[] = [
  'All Tutorials',
  'Profit & Pricing',
  'AI Product Photography',
  'Settlements & RTO',
  'GST & Compliance',
];

const DIFF_BADGE: Record<Difficulty, string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  Intermediate: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  Advanced: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
};

const CAT_BADGE: Record<Category, string> = {
  'All Tutorials':
    'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800',
  'Profit & Pricing':
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  'AI Product Photography':
    'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  'Settlements & RTO':
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  'GST & Compliance':
    'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
};

const TUTORIALS: Tutorial[] = [
  {
    id: 'tut-1',
    title: 'Price a ₹499 Product on Meesho & Flipkart Without Losing Money to RTO',
    subtitle:
      'The complete break-even math new sellers ignore until their first 50 returns.',
    category: 'Profit & Pricing',
    readTime: '5 min',
    difficulty: 'Beginner',
    targetPage: 'calculator',
    targetLabel: 'Universal Calculator',
    Icon: Calculator,
    overview:
      'Most new sellers price a ₹499 product by adding a flat 30% margin to their sourcing cost — then get blindsided when returns, RTO penalties, commissions, and TCS eat 40% of every order. On Meesho and Flipkart, the true cost of a "sale" isn\'t what you charge — it\'s what actually lands in your bank after returns, reverse shipping, commission, and tax. This tutorial walks you through the real math Indian sellers use.',
    realWorldExample: {
      scenario:
        'You source a product at ₹180, list it at ₹499 on Flipkart, and celebrate a "₹299 profit per order."',
      naiveMath:
        'Selling price ₹499 − Cost ₹180 − Packaging ₹20 = ₹299 "profit." Run 100 orders → ₹29,900 in your head.',
      realMath:
        'After 15% RTO (₹1,650), 15% commission (₹7,485), TCS 1% (₹499), and shipping (₹5,525) → net ≈ ₹8,800. That\'s ~₹88/order, not ₹299.',
      keyTakeaway:
        'A 15% return rate alone can wipe out 70% of your apparent profit. Always price for the return rate, not just the sale.',
    },
    steps: [
      {
        title: 'Lock in your true landed cost',
        explanation:
          'Landed cost is everything required to get one unit into a packed, ready-to-ship box — product, inbound freight, polybag, tape, and label. New sellers routinely forget inbound freight and packing consumables, which silently inflate the "profit" by ₹25–₹40 per order.',
        exampleBox:
          'Product ₹150 + Inbound freight ₹15 + Polybag ₹10 + Tape/Label ₹5 = ₹180 landed cost.',
      },
      {
        title: 'Build the RTO buffer',
        explanation:
          'Return to Origin (RTO) is the silent killer on Meesho fashion and Flipkart apparel. When a customer refuses delivery, you pay forward AND reverse shipping, and lose the entire sale. A 15% RTO rate is common — bake that cost into your selling price, not your ads budget.',
        exampleBox:
          '15% RTO × (₹65 forward + ₹45 reverse) = ₹110 buffer per order.',
        proTip:
          'Category RTO benchmarks: fashion 15–22%, home 6–10%, beauty 4–8%. Price accordingly.',
      },
      {
        title: 'Subtract commission and TCS',
        explanation:
          'Flipkart commission runs 5–20% depending on category — fashion is usually 15–18%. TCS is 1% deducted at source. Both come off the top of every sale, and GST input credit only partially offsets the difference.',
        exampleBox:
          'Commission 15% of ₹499 = ₹75. TCS 1% = ₹5. GST 18% = ₹76 (offset by input credit).',
      },
      {
        title: 'Set your minimum safe selling price',
        explanation:
          'Work backwards from target profit. If you want ₹150 net per order, your selling price must cover landed cost + RTO buffer + commission + shipping + TCS. Only after this math should you run ads — otherwise you\'re buying orders at a loss.',
        exampleBox:
          '₹180 + ₹110 + ₹75 + ₹65 + ₹5 ≈ ₹435 break-even. Selling at ₹499 gives ~₹64 net. Selling at ₹649 gives ~₹214 net.',
        proTip:
          'Never launch ads until your organic price clears break-even by at least 20%.',
      },
    ],
    commonMistake:
      'New sellers calculate profit as "Selling Price − Product Cost" and never subtract return shipping, platform commission, or TCS. On a 15% RTO product, this flips a ₹299 "profit" into a ₹50 loss per order — across 100 orders, that\'s a ₹30,000+ swing you didn\'t see coming.',
    formula:
      'Break-even SP = (Product Cost + Packaging + RTO Buffer + Shipping) ÷ (1 − Commission% − TCS 1%) + GST.',
  },
  {
    id: 'tut-2',
    title:
      'Create Amazon & Flipkart Compliant #FFFFFF Pure White Main Images from a Phone Photo',
    subtitle:
      'Turn a casual phone snap into a zoom-eligible, search-boosting hero image.',
    category: 'AI Product Photography',
    readTime: '4 min',
    difficulty: 'Beginner',
    targetPage: 'bg-remover',
    targetLabel: 'AI Background Remover',
    Icon: Image,
    overview:
      'Amazon and Flipkart reject or down-rank products whose main image is not on a pure white (#FFFFFF) background. Sellers lose 30–50% of click-through when their hero image looks "off-white" next to competitors. The good news: you don\'t need a studio — you need correct lighting, a clean cutout, the right padding, and the right export format.',
    realWorldExample: {
      scenario:
        'You shoot a product on a white bedsheet near a window and upload the raw phone JPEG directly.',
      naiveMath:
        'Photo "looks white enough" → upload → Amazon marks it non-compliant or shows it small because the product fills only 60% of the frame.',
      realMath:
        'True #FFFFFF background + 6% padding + 2000×2000 canvas → product fills 85% of frame → eligible for zoom + higher CTR (typically +18–25%).',
      keyTakeaway:
        'Pure white + correct padding = more clicks, no compliance rejections, and zoom eligibility on both Amazon and Flipkart.',
    },
    steps: [
      {
        title: 'Shoot in soft daylight, no flash',
        explanation:
          'Harsh flash creates blown-out highlights and muddy shadows that AI cutout tools struggle with. Diffused window light gives even illumination and a clean edge for auto-removal.',
        exampleBox:
          'Shoot between 10am–4pm near a north-facing window, product on a neutral grey surface.',
      },
      {
        title: 'Cut out the background in-browser',
        explanation:
          'Use SellerMath AI Background Remover (WASM, 100% local). No uploads leave your device — critical for NDA-bound suppliers and confidential product drops.',
        exampleBox: 'Upload → auto-cutout in 2–4 seconds → transparent PNG ready.',
      },
      {
        title: 'Apply the marketplace preset',
        explanation:
          'Amazon wants 2000×2000, Flipkart wants 1500×1500. Both require the product to fill ~85% of the frame (~6% padding each side) for zoom eligibility. Anything smaller looks grey, anything bigger gets clipped.',
        exampleBox:
          'Amazon 2000×2000 · 6% padding · product fills 1700px width ≈ 85%.',
        proTip:
          'Marketplaces reject #F5F5F5 and #FAFAFA. Sample the corner pixel in any editor — only #FFFFFF is accepted.',
      },
      {
        title: 'Export as compliant JPEG',
        explanation:
          'Export at 90% quality, sRGB color profile, JPEG. PNG is fine for secondary slots but the main image must be JPEG on Amazon.',
        exampleBox:
          'File size 1.2 MB · 2000×2000 · sRGB · JPEG quality 90.',
      },
    ],
    commonMistake:
      'Sellers shoot on a "white" bedsheet or paper and assume it\'s fine. The camera captures it as #F1EDE6 or #F5F5F5 — neither is #FFFFFF. Amazon down-ranks non-compliant main images silently, so sellers blame their price or ads instead of the image. The fix costs 2 minutes — the ad spend wasted trying to compensate for it can cost ₹50,000+.',
    formula:
      'Pure #FFFFFF + product at 85% of canvas + 6% padding = zoom eligibility + higher CTR on Amazon & Flipkart.',
  },
  {
    id: 'tut-3',
    title:
      'Generate Luxury AI Lifestyle & Festive Scenes for A+ Content & Sponsored Ads',
    subtitle:
      'Turn a plain cutout into scroll-stopping lifestyle scenes that lift ad CTR.',
    category: 'AI Product Photography',
    readTime: '4 min',
    difficulty: 'Intermediate',
    targetPage: 'image-generator',
    targetLabel: 'AI Image Generator',
    Icon: Sparkles,
    overview:
      'A white-background hero shot wins the click — but a lifestyle scene wins the add-to-cart. Amazon Sponsored Brands and A+ Content with lifestyle imagery consistently deliver 2–3× higher CTR than plain white backgrounds. This tutorial shows Indian sellers how to generate premium, market-relevant scenes without a photographer, studio rental, or 3-week turnaround.',
    realWorldExample: {
      scenario:
        'You have a clean cutout of a brass diya set but zero budget for a festive photoshoot before Diwali.',
      naiveMath:
        'Use the same white-background hero shot as your Sponsored Brand image → CTR ~0.35% → high CPC, low ROAS, ad spend bleeds.',
      realMath:
        'Match with a Festive Indian Decor scene + warm key light + soft contact shadow → CTR ~1.0–1.2% → ROAS up 2–3× on the same daily budget.',
      keyTakeaway:
        'A ₹0 studio budget does not mean flat imagery. AI lifestyle scenes deliver professional results for a fraction of a traditional shoot.',
    },
    steps: [
      {
        title: 'Start with a clean transparent cutout',
        explanation:
          'Upload a background-removed PNG into Product-to-Lifestyle mode. The AI reads the cutout edges to match scene lighting and place realistic shadows. A messy cutout edge = a messy lifestyle render.',
        exampleBox: 'Input: 2000×2000 transparent PNG · 1 product · no other objects.',
      },
      {
        title: 'Pick a high-CTR scene preset',
        explanation:
          'SellerMath presets are trained on top-performing Indian marketplace imagery. Luxury Marble Podium works for premium electronics and gifting. Festive Indian Decor works for ethnic products and Diwali/Raksha Bandhan campaigns.',
        exampleBox:
          'Festive Indian Decor preset → marigold garland + brass accents + warm bokeh.',
      },
      {
        title: 'Match light warmth and contact shadow',
        explanation:
          'The #1 giveaway of fake AI images is a missing or misplaced shadow. Ensure the scene key-light direction matches the product\'s own highlight direction, and keep a soft ground shadow. Match the warmth (3000K warm · 5500K neutral).',
        exampleBox:
          'Warm 3500K key light from upper-left → product shadow falls lower-right, soft edge.',
        proTip:
          'Avoid scenes where the shadow falls towards the viewer — the product looks like it\'s floating.',
      },
      {
        title: 'Export watermark-free PNG',
        explanation:
          'For Sponsored Brands and A+ Content, use 2000px PNG. For secondary gallery slots, 1500px JPEG is fine. Never upscale — always export from the original resolution.',
        exampleBox: 'Export 2000px PNG · watermark off · sRGB.',
      },
    ],
    commonMistake:
      'Sellers generate a beautiful scene but keep the original white-background cutout shadow. The mismatch between scene light and shadow direction makes the product look pasted-on — hurting CTR and brand trust. Always regenerate the shadow in the new scene, don\'t reuse the old one.',
    formula:
      'Warm key light (3000K–4000K) + soft contact shadow + scene-matched shadow direction = up to 3× higher CTR than plain white backgrounds in Sponsored Ads.',
  },
  {
    id: 'tut-4',
    title: 'Catch Volumetric Weight Traps & Shipping Overcharges in Courier Slabs',
    subtitle: 'Stop paying for air inside oversized boxes.',
    category: 'Settlements & RTO',
    readTime: '4 min',
    difficulty: 'Intermediate',
    targetPage: 'shipping',
    targetLabel: 'Shipping Calculator',
    Icon: Truck,
    overview:
      'Couriers bill by the higher of dead weight and volumetric weight. A 420g product packed in a 25×18×10 cm box bills as 900g → 1kg tier, not 500g. That one mistake costs ₹28–₹45 per order, or ₹30,000+ per 1,000 orders.',
    realWorldExample: {
      scenario: 'You ship a 420g phone case in a 25×18×10 cm box.',
      naiveMath: 'Dead weight 420g → assume ₹45 shipping at the 500g slab.',
      realMath:
        'Volumetric = 25×18×10 ÷ 5000 = 900g → billed at 1kg slab = ₹72. You paid ₹27 extra per order.',
      keyTakeaway:
        'Shaving 2cm off one dimension often drops a full courier slab — saving ₹28–₹45 per order.',
    },
    steps: [
      {
        title: 'Measure the sealed box',
        explanation:
          'Measure the outer dimensions of the packed, sealed box — not the flat-packed size. Courier scales measure the final parcel.',
        exampleBox: 'L 25 × B 18 × H 10 cm (sealed).',
      },
      {
        title: 'Compute volumetric weight',
        explanation:
          'Volumetric kg = (L × B × H) ÷ 5000. Compare with dead weight — courier bills the higher of the two.',
        exampleBox: '25 × 18 × 10 ÷ 5000 = 0.9 kg → billed as 1 kg tier.',
      },
      {
        title: 'Trim to drop a slab',
        explanation:
          'Reduce any dimension by 2–3 cm to push volumetric weight below the next tier threshold. Courier scales typically jump at 500g, 1kg, 2kg, 5kg.',
        exampleBox:
          '25 → 23 cm → 0.828 kg → still 1 kg. 25 → 21 cm → 0.756 kg → drops to 750g tier. Save ₹28/order.',
        proTip:
          'Always test a box size just below the threshold. A 1cm saving can halve the slab.',
      },
    ],
    commonMistake:
      'Sellers reuse whatever box is lying around. A slightly larger box can push volumetric weight into the next slab, silently adding ₹30–₹45 per order — ₹30,000+ per 1,000 orders. Buy a small range of box sizes and match to product, not the other way around.',
    formula:
      'Volumetric kg = (L × B × H) ÷ 5000. Courier bills max(dead, volumetric). Shave 2cm to drop a slab.',
  },
  {
    id: 'tut-5',
    title:
      'Audit Weekly Amazon & Flipkart Settlement Reports for Hidden Deduction Leaks',
    subtitle: 'Recover silent leaks from mis-tiered commissions & uncredited returns.',
    category: 'Settlements & RTO',
    readTime: '5 min',
    difficulty: 'Advanced',
    targetPage: 'settlement-reconciliation',
    targetLabel: 'Settlement Reconciliation',
    Icon: CreditCard,
    overview:
      'Marketplace settlement reports hide silent leaks — a commission billed at 18% instead of 15%, a return that never got credited, a shipping overcharge. At ₹5L monthly GMV, even a 0.5% leak is ₹2,500/month gone. Weekly auditing catches it within the 7-day dispute window.',
    realWorldExample: {
      scenario: 'You expect ₹2,40,000 payout for the week but receive ₹2,31,500.',
      naiveMath:
        'Assume "marketplace fees are complicated" and accept the ₹8,500 difference.',
      realMath:
        'Breakdown shows ₹4,200 uncredited returns + ₹2,100 wrong commission tier + ₹2,200 damage claims not raised → recoverable via SPF within 7 days.',
      keyTakeaway:
        'Weekly reconciliation recovers 3–5% of monthly revenue that most sellers silently lose.',
    },
    steps: [
      {
        title: 'Download the settlement report',
        explanation:
          'Export the weekly settlement (Payment Report) from Seller Central or Flipkart Seller Hub. Match with your bank NEFT credit line by line.',
        exampleBox: 'Expected ₹2,40,000 → NEFT ₹2,31,500 → gap ₹8,500.',
      },
      {
        title: 'Line-item reconcile every order',
        explanation:
          'Match each order ID against expected commission, shipping, and TCS. Flag discrepancies over ₹50 — small leaks compound into five-figure monthly losses.',
        exampleBox:
          'Order #A123 · expected commission 15% (₹75) · billed 18% (₹90) → ₹15 leak.',
      },
      {
        title: 'Raise claims within 7 days',
        explanation:
          'Safe-T (Amazon) and SPF (Flipkart) claims must be raised within 7 days. After that, they\'re auto-rejected. Reconcile every Monday — anything older than a week is likely unrecoverable.',
        exampleBox:
          'SPF claim raised for ₹4,200 returns + ₹2,100 commission + ₹2,200 damage = ₹8,500 recovered.',
        proTip:
          'Keep a running spreadsheet of leaks — patterns reveal platform bugs worth escalating.',
      },
    ],
    commonMistake:
      'Sellers look only at the total payout, not line items. Small per-order leaks (₹10–₹30) across 300 orders look tiny but compound into ₹3,000–₹9,000 per week of silent loss — ₹1.5L+ per year.',
    formula:
      'Expected Payout = (Order Value − Commission − Shipping − TCS) × GST Credit − Returns − Clawbacks. Anything less is a leak.',
  },
  {
    id: 'tut-6',
    title: 'Create B2B & Customer GST Tax Invoices with HSN Codes & UPI QR',
    subtitle: 'Compliant tax invoices with the right tax split every time.',
    category: 'GST & Compliance',
    readTime: '3 min',
    difficulty: 'Beginner',
    targetPage: 'gst-invoice',
    targetLabel: 'GST Invoice Generator',
    Icon: BookOpen,
    overview:
      'A wrong Place of Supply on a GST invoice means the wrong tax split (CGST+SGST vs IGST), which means your customer\'s input credit gets rejected — and they return the invoice. This 3-minute checklist gets it right every time.',
    realWorldExample: {
      scenario:
        'You raise an invoice with IGST 18% for a customer in your own state (Maharashtra → Maharashtra).',
      naiveMath:
        'IGST 18% on ₹10,000 = ₹1,800 collected, invoice "looks GST compliant."',
      realMath:
        'Wrong. Intra-state must be CGST 9% + SGST 9%. Customer cannot claim IGST credit for an intra-state supply → invoice rejected, payment delayed.',
      keyTakeaway:
        'Place of Supply determines the tax split. Get it wrong and your B2B customer returns the invoice.',
    },
    steps: [
      {
        title: 'Check Place of Supply',
        explanation:
          'Compare seller GSTIN state code with buyer Place of Supply. Same state → CGST + SGST. Different state → IGST. This single check prevents 90% of GST invoice rejections.',
        exampleBox:
          'Seller MH-27 · Buyer MH-27 → CGST 9% + SGST 9%. Seller MH-27 · Buyer KA-29 → IGST 18%.',
      },
      {
        title: 'Enter HSN and GSTIN',
        explanation:
          'Enter the 4/6-digit HSN code and the seller\'s GSTIN. Buyer GSTIN is required for B2B invoices over ₹50,000. HSN codes drive audit compliance.',
        exampleBox:
          'HSN 6302 · Seller 27AAECS1234A1Z5 · Buyer 29AACCP5678B1Z3.',
      },
      {
        title: 'Attach UPI QR and export',
        explanation:
          'Attach a UPI QR for instant payment collection. Export as A4 PDF for print, or PDF for email. Keep a copy in your books for 8 years.',
        exampleBox: 'UPI QR encoded with business VPA · A4 print-ready PDF · sRGB.',
        proTip:
          'Never mix CGST+SGST and IGST on one invoice. Multi-state orders need separate invoices.',
      },
    ],
    commonMistake:
      'Sellers default to IGST 18% for every invoice because it\'s "the standard rate." For intra-state sales, this is wrong — your customer\'s credit gets rejected and the invoice bounces back, delaying payment by weeks.',
    formula:
      'Same state = CGST 9% + SGST 9%. Different state = IGST 18%. Never mix them on one invoice.',
  },
];

/* ----------------------------- Helper Components ---------------------------- */

function ProgressRing({ percent, size = 64 }: { percent: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke="currentColor"
          fill="none"
          className="text-zinc-200/70 dark:text-zinc-800/70"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          stroke="currentColor"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-emerald-500 transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-zinc-900 tabular-nums dark:text-zinc-100">
        {percent}%
      </span>
    </div>
  );
}

function ArticleModal({
  tutorial,
  isCompleted,
  onToggle,
  onClose,
  onNavigate,
}: {
  tutorial: Tutorial;
  isCompleted: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNavigate: (page: any) => void;
}) {
  const [viewMode, setViewMode] = useState<'blog' | 'focus'>('blog');
  const [focusStep, setFocusStep] = useState(0);
  const total = tutorial.steps.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (viewMode === 'focus') {
        if (e.key === 'ArrowRight') setFocusStep(s => Math.min(total - 1, s + 1));
        if (e.key === 'ArrowLeft') setFocusStep(s => Math.max(0, s - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, total, viewMode]);

  const current = tutorial.steps[focusStep];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-zinc-200/80 bg-white shadow-2xl sm:max-h-[88vh] sm:rounded-3xl dark:border-zinc-800/80 dark:bg-zinc-900">
        {/* Sticky header */}
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200/80 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CAT_BADGE[tutorial.category]}`}
            >
              {tutorial.category}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <Clock className="h-3 w-3" /> {tutorial.readTime}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${DIFF_BADGE[tutorial.difficulty]}`}
            >
              {tutorial.difficulty}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="hidden rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 sm:flex dark:border-zinc-800 dark:bg-zinc-800/50">
              <button
                onClick={() => setViewMode('blog')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  viewMode === 'blog'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-emerald-600 dark:text-zinc-400'
                }`}
              >
                📖 Full Blog
              </button>
              <button
                onClick={() => setViewMode('focus')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  viewMode === 'focus'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-emerald-600 dark:text-zinc-400'
                }`}
              >
                🎯 Focus
              </button>
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'blog' ? 'focus' : 'blog')}
              className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-600 sm:hidden dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400"
            >
              {viewMode === 'blog' ? '🎯 Focus' : '📖 Blog'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              aria-label="Close tutorial"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6">
          {/* Hero */}
          <div>
            <h2
              id="article-title"
              className="text-xl font-bold leading-tight text-zinc-900 sm:text-2xl dark:text-white"
            >
              {tutorial.title}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              {tutorial.subtitle}
            </p>
          </div>

          {/* Why This Matters */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              📌 Why This Matters
            </p>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {tutorial.overview}
            </p>
          </div>

          {/* Reality Check */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              🔍 Seller Reality Check
            </p>
            <p className="mb-3 text-xs italic text-zinc-500 dark:text-zinc-400">
              {tutorial.realWorldExample.scenario}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  ❌ What Beginners Calculate
                </p>
                <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {tutorial.realWorldExample.naiveMath}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  ✅ Actual Marketplace Reality
                </p>
                <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {tutorial.realWorldExample.realMath}
                </p>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-300">
              <strong className="text-zinc-900 dark:text-white">🎯 Key Takeaway:</strong>{' '}
              {tutorial.realWorldExample.keyTakeaway}
            </p>
          </div>

          {/* Steps */}
          {viewMode === 'blog' ? (
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                🧭 Step-by-Step Playbook
              </p>
              <ol className="space-y-4">
                {tutorial.steps.map((s, i) => (
                  <li key={i} className="relative pl-10">
                    {i < tutorial.steps.length - 1 && (
                      <span
                        className="absolute left-[15px] top-8 -bottom-4 w-0.5 bg-emerald-500/25"
                        aria-hidden="true"
                      />
                    )}
                    <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-500/30">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                        {s.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {s.explanation}
                      </p>
                      {s.exampleBox && (
                        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Example:
                          </span>{' '}
                          {s.exampleBox}
                        </pre>
                      )}
                      {s.proTip && (
                        <p className="mt-2 flex gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                          <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>{s.proTip}</span>
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  🎯 Focus Mode · Step {focusStep + 1} of {total}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-white p-5 dark:border-zinc-800/80 dark:from-zinc-800/40 dark:to-zinc-900">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/30">
                    {focusStep + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                      {current.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {current.explanation}
                    </p>
                    {current.exampleBox && (
                      <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-[11px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Example:
                        </span>{' '}
                        {current.exampleBox}
                      </pre>
                    )}
                    {current.proTip && (
                      <p className="mt-2 flex gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                        <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{current.proTip}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => setFocusStep(s => Math.max(0, s - 1))}
                  disabled={focusStep === 0}
                  className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex gap-1">
                  {tutorial.steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFocusStep(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === focusStep
                          ? 'w-5 bg-emerald-500'
                          : i < focusStep
                            ? 'w-1.5 bg-emerald-500/50'
                            : 'w-1.5 bg-zinc-300 hover:bg-emerald-400 dark:bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setFocusStep(s => Math.min(total - 1, s + 1))}
                  disabled={focusStep === total - 1}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Common Mistake */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Common Seller Trap
            </p>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {tutorial.commonMistake}
            </p>
          </div>

          {/* Formula */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              <Lightbulb className="h-3.5 w-3.5" /> Pro Seller Formula
            </p>
            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {tutorial.formula}
            </p>
          </div>
        </div>

        {/* Sticky footer */}
        <footer className="grid shrink-0 grid-cols-1 gap-2.5 border-t border-zinc-200/80 bg-zinc-50/90 p-3 backdrop-blur sm:grid-cols-2 sm:p-4 dark:border-zinc-800/80 dark:bg-zinc-900/90">
          <button
            onClick={onToggle}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              isCompleted
                ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                : 'border border-zinc-300 text-zinc-700 hover:border-emerald-500/50 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-emerald-400'
            }`}
          >
            <Check className={`h-4 w-4 ${isCompleted ? 'fill-current' : ''}`} />
            {isCompleted ? 'Completed' : 'Mark Completed'}
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigate(tutorial.targetPage);
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-emerald-600/30"
          >
            <Rocket className="h-4 w-4" /> Try in {tutorial.targetLabel} →
          </button>
        </footer>
      </div>
    </div>
  );
}

/* --------------------------------- Main ----------------------------------- */

export default function SellerTutorials({
  onNavigate,
}: {
  onNavigate: (page: any) => void;
}) {
  const [cat, setCat] = useState<Category>('All Tutorials');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    if (!window.confirm('Reset all tutorial progress? This cannot be undone.')) return;
    setCompleted(new Set());
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    m.set('All Tutorials', TUTORIALS.length);
    TUTORIALS.forEach(t => m.set(t.category, (m.get(t.category) || 0) + 1));
    return m;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TUTORIALS.filter(t => {
      const matchCat = cat === 'All Tutorials' || t.category === cat;
      const matchQ =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.overview.toLowerCase().includes(q) ||
        t.steps.some(
          s =>
            s.title.toLowerCase().includes(q) || s.explanation.toLowerCase().includes(q)
        );
      return matchCat && matchQ;
    });
  }, [cat, query]);

  const completedCount = completed.size;
  const progressPct = Math.round((completedCount / TUTORIALS.length) * 100);
  const allComplete = completedCount === TUTORIALS.length;

  const nextUpId = useMemo(
    () => TUTORIALS.find(t => !completed.has(t.id))?.id,
    [completed]
  );

  const tut = selectedId ? TUTORIALS.find(t => t.id === selectedId) : null;
  const isCompleted = (id: string) => completed.has(id);

  return (
    <section className="mx-auto w-full max-w-[1360px] overflow-x-hidden px-3 py-6 box-border sm:px-6 sm:py-8 lg:px-8">
      {/* Progress panel */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-white to-zinc-50/60 p-4 dark:border-zinc-800/80 dark:from-zinc-900 dark:to-zinc-900/50 sm:p-5">
        <div className="flex items-center gap-4">
          <ProgressRing percent={progressPct} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {completedCount} of {TUTORIALS.length}{' '}
                <span className="font-medium text-zinc-500 dark:text-zinc-400">
                  Seller Playbooks Completed
                </span>
              </p>
              {completedCount > 0 && (
                <button
                  onClick={resetProgress}
                  className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
                  title="Reset progress"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {allComplete
                ? '🎉 All playbooks completed — you’re a SellerMath pro!'
                : completedCount === 0
                  ? 'Start with your first playbook to unlock progress tracking.'
                  : `You’re ${TUTORIALS.length - completedCount} tutorial${TUTORIALS.length - completedCount === 1 ? '' : 's'} away from completion.`}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800/70">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {allComplete && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <Trophy className="h-8 w-8 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                All 6 Playbooks Mastered!
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                You now know every SellerMath workflow. Go launch some tools.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">
          🎓 Interactive Seller Academy
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl lg:text-[2rem] dark:text-zinc-50">
          Step-by-Step Marketplace &amp; Profit Tutorials
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Actionable 3-minute playbooks for Amazon, Flipkart, Meesho, and Myntra sellers. Learn a
          workflow and launch the matching tool in one click.
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex flex-wrap gap-2 px-1 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
          {CATEGORIES.map(c => {
            const active = cat === c;
            const count = categoryCounts.get(c) || 0;
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'border-zinc-200/80 bg-white text-zinc-700 hover:border-emerald-500/40 hover:text-emerald-600 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-emerald-400'
                }`}
              >
                {c}
                <span
                  className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-100 text-zinc-500 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search: RTO, White Background, Volumetric…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-200/80 bg-white py-2 pl-9 pr-9 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(t => {
          const done = isCompleted(t.id);
          const isNext = !done && t.id === nextUpId;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`group relative flex flex-col rounded-2xl border bg-white p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-900/5 dark:bg-zinc-900 dark:hover:shadow-black/40 ${
                done
                  ? 'border-emerald-500/30 dark:border-emerald-500/25'
                  : isNext
                    ? 'border-emerald-500/40 shadow-md shadow-emerald-500/5 dark:border-emerald-500/30'
                    : 'border-zinc-200/80 dark:border-zinc-800/80'
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white dark:text-emerald-400">
                  <t.Icon className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isNext && (
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      Start here
                    </span>
                  )}
                  {done && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <Check className="h-2.5 w-2.5" /> Done
                    </span>
                  )}
                </div>
              </div>

              <h3 className="mb-1.5 line-clamp-3 text-sm font-bold leading-snug text-zinc-900 transition-colors group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                {t.title}
              </h3>

              <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {t.subtitle}
              </p>

              <div className="mb-3 flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CAT_BADGE[t.category]}`}
                >
                  {t.category}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${DIFF_BADGE[t.difficulty]}`}
                >
                  {t.difficulty}
                </span>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800/60">
                <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <Clock className="h-3 w-3" /> {t.readTime}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 transition-transform group-hover:translate-x-0.5 dark:text-emerald-400">
                  Read playbook <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Search className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No tutorials match “{query || cat}”
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Try clearing the filter or searching a different keyword.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setCat('All Tutorials');
              }}
              className="mt-4 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Article modal */}
      {tut && (
        <ArticleModal
          tutorial={tut}
          isCompleted={isCompleted(tut.id)}
          onToggle={() => toggleComplete(tut.id)}
          onClose={() => setSelectedId(null)}
          onNavigate={onNavigate}
        />
      )}
    </section>
  );
}