import { useCallback, useEffect, useRef, useState } from 'react';
import MarketplaceLogo from '@/components/MarketplaceLogo';

type ExportMode = 'transparent' | 'white';
type Ratio = 'free' | '1:1' | '3:4';
type OutSize = 'original' | 1000 | 1440 | 1500 | 2000;
type Status = 'idle' | 'processing' | 'done';
type ViewMode = 'result' | 'compare';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — big raw camera files can freeze mobile browsers

/* ───────────── Daily credit limiter (localStorage, auto-resets at local midnight) ───────────── */

const CREDITS_KEY = 'sellermath_bg_credits';
const NEWSLETTER_KEY = 'sellermath_newsletter';
const WAITLIST_KEY = 'sellermath_pro_waitlist';
const BASE_DAILY_LIMIT = 5;
const BONUS_DAILY_LIMIT = 10;

interface Credits {
  date: string; // YYYY-MM-DD (user's local calendar day)
  used: number;
  bonusUnlocked: boolean;
}

export interface AIBackgroundRemoverProps {
  /** Optional hook to send captured leads to your backend (Supabase, Mailchimp, etc.). */
  onLeadCapture?: (kind: 'bonus' | 'waitlist', value: string) => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Local calendar day, so "midnight" really means the seller's midnight (IST for Indian users). */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// In-memory mirror: keeps limits working in the session even if localStorage is blocked (private mode).
let memoryCredits: Credits | null = null;

function writeCredits(c: Credits) {
  memoryCredits = c;
  try {
    localStorage.setItem(CREDITS_KEY, JSON.stringify(c));
  } catch {
    /* storage unavailable — memory mirror still enforces the limit this session */
  }
}

function readCredits(): Credits {
  const today = todayKey();
  let saved: Credits | null = null;
  try {
    const raw = localStorage.getItem(CREDITS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p.date === 'string' && typeof p.used === 'number' && Number.isFinite(p.used)) {
        saved = { date: p.date, used: Math.max(0, Math.floor(p.used)), bonusUnlocked: p.bonusUnlocked === true };
      }
    }
  } catch {
    /* corrupt JSON or blocked storage — fall through */
  }
  if (!saved) saved = memoryCredits;

  // New calendar day (or first visit) → automatic reset
  if (!saved || saved.date !== today) {
    const fresh: Credits = { date: today, used: 0, bonusUnlocked: false };
    writeCredits(fresh);
    return fresh;
  }
  return saved;
}

/** +1 used credit. Called ONLY after background removal succeeds. */
function consumeCredit(): Credits {
  const c = readCredits();
  const next = { ...c, used: c.used + 1 };
  writeCredits(next);
  return next;
}

function unlockBonus(): Credits {
  const next = { ...readCredits(), bonusUnlocked: true };
  writeCredits(next);
  return next;
}

function readSavedLead(): string {
  try {
    const raw = localStorage.getItem(NEWSLETTER_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p.value === 'string') return p.value;
    }
  } catch {
    /* ignore */
  }
  return '';
}

function isWaitlisted(): boolean {
  try {
    return localStorage.getItem(WAITLIST_KEY) !== null;
  } catch {
    return false;
  }
}

function resetTimeLabel() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (/Calcutta|Kolkata/i.test(tz)) return '12:00 AM IST';
  } catch {
    /* ignore */
  }
  return 'midnight (your local time)';
}
const MAX_INPUT_SIDE = 4096; // downscale huge photos before AI for speed + memory
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|avif|heic|heif)$/i;
const NATIVE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const RATIO_VALUE: Record<Exclude<Ratio, 'free'>, number> = { '1:1': 1, '3:4': 0.75 };

interface Settings {
  ratio: Ratio;
  size: OutSize;
  padding: number;
}

/** One-tap marketplace presets. */
const PRESETS: { id: string; label: string; emoji: string; hint: string; s: Settings }[] = [
  { id: 'amazon', label: 'Amazon', emoji: '📦', hint: '2000×2000 · white', s: { ratio: '1:1', size: 2000, padding: 6 } },
  { id: 'flipkart', label: 'Flipkart', emoji: '🛍️', hint: '1500×1500 · white', s: { ratio: '1:1', size: 1500, padding: 8 } },
  { id: 'myntra', label: 'Myntra', emoji: '👗', hint: '1080×1440 · 3:4', s: { ratio: '3:4', size: 1440, padding: 6 } },
  { id: 'free', label: 'Original shape', emoji: '🖼️', hint: 'No crop', s: { ratio: 'free', size: 'original', padding: 0 } },
];

/* ───────────────────────── helpers ───────────────────────── */

const isImageFile = (f: File) => f.type.startsWith('image/') || IMAGE_EXT.test(f.name);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Normalises any input (HEIC from iPhone, GIF, AVIF, huge camera photos…)
 * into a PNG/JPEG/WEBP that is at most MAX_INPUT_SIDE px on its longest edge.
 */
async function normalizeInput(file: File): Promise<File> {
  const needsConvert = !NATIVE_TYPES.includes(file.type);
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (!needsConvert && longest <= MAX_INPUT_SIDE) return file;

    const scale = Math.min(1, MAX_INPUT_SIDE / longest);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, 'image/png');
    if (!blob) throw new Error('encode failed');
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Tight bounding box of non-transparent pixels (computed on a small copy for speed). */
function findSubjectBox(img: HTMLImageElement) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const probe = Math.min(1, 800 / Math.max(w, h));
  const pw = Math.max(1, Math.round(w * probe));
  const ph = Math.max(1, Math.round(h * probe));
  const c = document.createElement('canvas');
  c.width = pw;
  c.height = ph;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { x: 0, y: 0, w, h };
  ctx.drawImage(img, 0, 0, pw, ph);
  const { data } = ctx.getImageData(0, 0, pw, ph);

  let minX = pw, minY = ph, maxX = -1, maxY = -1;
  for (let y = 0; y < ph; y++) {
    for (let x = 0; x < pw; x++) {
      if (data[(y * pw + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w, h };
  const inv = 1 / probe;
  return {
    x: Math.max(0, Math.floor(minX * inv)),
    y: Math.max(0, Math.floor(minY * inv)),
    w: Math.min(w, Math.ceil((maxX - minX + 1) * inv)),
    h: Math.min(h, Math.ceil((maxY - minY + 1) * inv)),
  };
}

interface RenderOpts extends Settings {
  mode: ExportMode;
  quality: number; // 0.7-1
}

/** Composites the transparent cut-out into the final export blob. */
async function renderExport(cutout: Blob, o: RenderOpts): Promise<{ blob: Blob; w: number; h: number }> {
  const srcUrl = URL.createObjectURL(cutout);
  try {
    const img = await loadImage(srcUrl);
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    let cw: number, ch: number, dx: number, dy: number, dw: number, dh: number;

    if (o.ratio !== 'free') {
      const box = findSubjectBox(img);
      sx = box.x; sy = box.y; sw = box.w; sh = box.h;
      const r = RATIO_VALUE[o.ratio];
      const inner = 1 - 2 * (o.padding / 100);
      const outH = o.size === 'original' ? Math.min(4096, Math.ceil(Math.max(sh, sw / r) / inner)) : o.size;
      ch = outH;
      cw = Math.round(outH * r);
      const scale = Math.min((cw * inner) / sw, (ch * inner) / sh);
      dw = Math.round(sw * scale);
      dh = Math.round(sh * scale);
      dx = Math.round((cw - dw) / 2);
      dy = Math.round((ch - dh) / 2);
    } else {
      const longest = Math.max(sw, sh);
      const scale = o.size === 'original' ? 1 : o.size / longest;
      cw = dw = Math.round(sw * scale);
      ch = dh = Math.round(sh * scale);
      dx = dy = 0;
    }

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.imageSmoothingQuality = 'high';

    if (o.mode === 'white') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, cw, ch);
    }
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

    const blob =
      o.mode === 'white'
        ? await canvasToBlob(canvas, 'image/jpeg', o.quality)
        : await canvasToBlob(canvas, 'image/png');
    if (!blob) throw new Error('Failed to encode image');
    return { blob, w: cw, h: ch };
  } finally {
    URL.revokeObjectURL(srcUrl);
  }
}

const CHECKER: React.CSSProperties = {
  backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)',
  backgroundSize: '20px 20px',
};

/* ───────────────────────── small UI pieces ───────────────────────── */

function StepPill({ n, label, state }: { n: number; label: string; state: 'todo' | 'active' | 'done' }) {
  const base = 'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium border transition-colors';
  const cls =
    state === 'done'
      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
      : state === 'active'
        ? 'border-emerald-400 dark:border-emerald-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
        : 'border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-500';
  return (
    <div className={`${base} ${cls}`} aria-current={state === 'active' ? 'step' : undefined}>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
          state === 'done'
            ? 'bg-emerald-500 text-white'
            : state === 'active'
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
        }`}
      >
        {state === 'done' ? '✓' : n}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}

function Badge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-medium ${
        ok
          ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
          : 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
      }`}
    >
      {ok ? '✓' : '!'} {children}
    </span>
  );
}

/** Before/after slider. Uses a transparent native range input on top → mouse, touch AND keyboard all work. */
function CompareSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="relative w-full h-72 sm:h-96 select-none overflow-hidden" style={CHECKER}>
      <img src={after} alt="After: background removed" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      <div className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="Before: original photo" className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      </div>

      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">Before</span>
      <span className="absolute right-3 top-3 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">After</span>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs font-bold text-zinc-700 shadow-lg ring-1 ring-black/10">
          ⇆
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare before and after"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

/** Live credit counter pill: emerald → amber (≤2 left) → rose (0 left). */
function CreditPill({ remaining, limit, bonus }: { remaining: number; limit: number; bonus: boolean }) {
  const tone = remaining === 0 ? 'rose' : remaining <= 2 ? 'amber' : 'emerald';
  const styles = {
    emerald: {
      box: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    },
    amber: {
      box: 'border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300',
      bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
    },
    rose: {
      box: 'border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300',
      bar: 'bg-gradient-to-r from-rose-500 to-rose-600',
    },
  }[tone];
  const pct = limit > 0 ? (remaining / limit) * 100 : 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full lg:w-auto lg:min-w-[270px] lg:max-w-xs flex-shrink-0 rounded-2xl border px-3.5 py-2.5 backdrop-blur transition-colors ${styles.box}`}
    >
      <div className="flex flex-wrap items-center gap-x-1.5 text-sm font-semibold">
        <span>
          ⚡ {remaining} / {limit} Free Daily Cutouts Left
        </span>
        <span className="text-xs font-normal opacity-80">• Resets at Midnight</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
        role="progressbar"
        aria-label="Daily cutouts remaining"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={remaining}
      >
        <div className={`h-full rounded-full transition-all duration-500 ${styles.bar}`} style={{ width: `${pct}%` }} />
      </div>
      {bonus && <p className="mt-1.5 text-[11px] opacity-80">🎁 +5 bonus cutouts active today</p>}
    </div>
  );
}

/* ───────────────────────── main component ───────────────────────── */

export default function AIBackgroundRemover({ onLeadCapture }: AIBackgroundRemoverProps = {}) {
  const [status, setStatus] = useState<Status>('idle');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [originalMeta, setOriginalMeta] = useState<{ name: string; size: number; w?: number; h?: number } | null>(null);
  const [cutout, setCutout] = useState<Blob | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewDims, setPreviewDims] = useState<{ w: number; h: number } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [view, setView] = useState<ViewMode>('result');

  // Daily credits + lead capture
  const [credits, setCredits] = useState<Credits>(() => readCredits());
  const [leadInput, setLeadInput] = useState<string>(() => readSavedLead());
  const [leadError, setLeadError] = useState<string | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState<boolean>(() => isWaitlisted());

  // Export controls
  const [exportMode, setExportMode] = useState<ExportMode>('white');
  const [ratio, setRatio] = useState<Ratio>('1:1');
  const [padding, setPadding] = useState(6);
  const [size, setSize] = useState<OutSize>(2000);
  const [quality, setQuality] = useState(0.95);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const originalUrlRef = useRef<string | null>(null);
  const cutoutUrlRef = useRef<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const runIdRef = useRef(0);
  const dragDepthRef = useRef(0);
  const toastTimer = useRef<number | null>(null);

  const flash = useCallback((msg: string, ms = 2600) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), ms);
  }, []);

  useEffect(() => {
    return () => {
      [originalUrlRef, cutoutUrlRef, previewUrlRef].forEach((r) => r.current && URL.revokeObjectURL(r.current));
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const clearAll = useCallback(() => {
    runIdRef.current++; // cancels any in-flight job
    [originalUrlRef, cutoutUrlRef, previewUrlRef].forEach((r) => {
      if (r.current) URL.revokeObjectURL(r.current);
      r.current = null;
    });
    setOriginalUrl(null);
    setOriginalMeta(null);
    setCutout(null);
    setCutoutUrl(null);
    setPreviewUrl(null);
    setPreviewBlob(null);
    setPreviewDims(null);
    setProgress(null);
    setView('result');
    setStatus('idle');
  }, []);

  /* ── main pipeline ── */
  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Daily credit guard — read fresh from storage so a stale render can never bypass it.
      const fresh = readCredits();
      if (fresh.used >= (fresh.bonusUnlocked ? BONUS_DAILY_LIMIT : BASE_DAILY_LIMIT)) {
        setCredits(fresh);
        flash('Daily free limit reached — your quota resets at midnight.', 4000);
        return;
      }

      if (!isImageFile(file)) {
        setError('That doesn’t look like an image. Please use PNG, JPG, WEBP or HEIC.');
        return;
      }

      // File size guard (applies to upload, camera, drag & drop AND paste)
      if (file.size > MAX_FILE_BYTES) {
        flash('File exceeds 10MB limit. Please upload a JPG/PNG/WEBP under 10MB.', 5000);
        return;
      }

      clearAll();
      const myRun = ++runIdRef.current;

      const url = URL.createObjectURL(file);
      originalUrlRef.current = url;
      setOriginalUrl(url);
      setOriginalMeta({ name: file.name || 'pasted-image', size: file.size });
      setStatus('processing');

      try {
        const prepared = await normalizeInput(file);
        if (myRun !== runIdRef.current) return;

        // Dynamic import keeps the heavy model bundle out of the main chunk.
        const { removeBackground } = await import('@imgly/background-removal');
        const blob = await removeBackground(prepared, {
          progress: (_key: string, current: number, total: number) => {
            if (myRun === runIdRef.current && total > 0) {
              setProgress(Math.min(100, Math.round((current / total) * 100)));
            }
          },
        });
        if (myRun !== runIdRef.current) return;

        // Success → NOW spend one credit (failed removals never cost the seller anything).
        setCredits(consumeCredit());

        const cUrl = URL.createObjectURL(blob);
        cutoutUrlRef.current = cUrl;
        setCutoutUrl(cUrl);
        setCutout(blob);
        setStatus('done');
        flash('Background removed ✨');
      } catch (err) {
        if (myRun !== runIdRef.current) return;
        console.error('[bg-remover] failed:', err);
        const decodeIssue = err instanceof Error && err.message === 'decode failed';
        setError(
          decodeIssue
            ? 'Your browser couldn’t read this image format. Try a PNG or JPG (on iPhone: Settings → Camera → Formats → Most Compatible).'
            : 'Background removal failed. Check your connection and try again — the AI model downloads on first use.',
        );
        setStatus('idle');
      } finally {
        if (myRun === runIdRef.current) setProgress(null);
      }
    },
    [clearAll, flash],
  );

  /* ── live preview: re-render whenever cut-out or any export setting changes ── */
  useEffect(() => {
    if (!cutout) return;
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const { blob, w, h } = await renderExport(cutout, { mode: exportMode, ratio, padding, size, quality });
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setPreviewBlob(blob);
        setPreviewDims({ w, h });
      } catch (err) {
        if (!cancelled) {
          console.error('[bg-remover] render failed:', err);
          setError('Could not generate the preview. Try different export settings.');
        }
      }
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [cutout, exportMode, ratio, padding, size, quality]);

  /* ── input methods: picker / camera, page-wide drag & drop, paste ── */

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) {
            e.preventDefault();
            const ext = item.type.split('/')[1] || 'png';
            void handleFile(f.name ? f : new File([f], `pasted-${Date.now()}.${ext}`, { type: f.type }));
            return;
          }
        }
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [handleFile]);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current++;
      setIsDragging(true);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragging(false);
    };
    const onDropWin = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDragging(false);
      const file = Array.from(e.dataTransfer?.files ?? []).find(isImageFile);
      if (file) void handleFile(file);
      else setError('No image found in what you dropped.');
    };
    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDropWin);
    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onDropWin);
    };
  }, [handleFile]);

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
      e.target.value = ''; // allow re-selecting the same file
    },
    [handleFile],
  );

  // "Paste" button — for phones/tablets where there is no Ctrl+V
  const pasteFromClipboard = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.clipboard?.read) throw new Error('unsupported');
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          void handleFile(new File([blob], `pasted-${Date.now()}.${type.split('/')[1]}`, { type }));
          return;
        }
      }
      setError('No image found on your clipboard. Copy an image first, then tap Paste.');
    } catch {
      setError('Couldn’t read your clipboard. Allow clipboard access, or just press Ctrl/Cmd + V on this page.');
    }
  }, [handleFile]);

  /* ── output actions ── */
  const handleDownload = useCallback(() => {
    if (!previewBlob) return;
    const ext = exportMode === 'white' ? 'jpg' : 'png';
    const base = (originalMeta?.name || 'image').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-').slice(0, 40);
    const url = URL.createObjectURL(previewBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seller-math-${exportMode}-${base}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    flash('Download started 📥');
  }, [previewBlob, exportMode, originalMeta, flash]);

  const handleCopy = useCallback(async () => {
    if (!previewBlob) return;
    try {
      let png = previewBlob;
      if (previewBlob.type !== 'image/png') {
        const u = URL.createObjectURL(previewBlob);
        const img = await loadImage(u);
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext('2d')?.drawImage(img, 0, 0);
        URL.revokeObjectURL(u);
        const b = await canvasToBlob(c, 'image/png');
        if (!b) throw new Error('encode');
        png = b;
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      flash('Copied to clipboard ✓');
    } catch {
      setError('Copy isn’t supported in this browser. Use Download instead.');
    }
  }, [previewBlob, flash]);

  /* ── credits: midnight auto-reset, re-sync on tab focus, cross-tab sync ── */
  useEffect(() => {
    const sync = () => setCredits(readCredits());
    let timer = 0;
    const schedule = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = window.setTimeout(() => {
        sync();
        schedule();
      }, nextMidnight.getTime() - now.getTime());
    };
    schedule();

    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === CREDITS_KEY) sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  /* ── lead capture handlers ── */
  const submitLead = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const v = leadInput.trim();
      const looksLikeEmail = v.includes('@');
      if (v.length < 2 || (looksLikeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))) {
        setLeadError('Please enter a valid work email or your store name.');
        return;
      }
      setLeadError(null);
      try {
        localStorage.setItem(NEWSLETTER_KEY, JSON.stringify({ value: v, date: todayKey(), ts: Date.now() }));
      } catch {
        /* ignore — unlock still applies for this session */
      }
      onLeadCapture?.('bonus', v);
      setCredits(unlockBonus());
      flash('🎉 +5 bonus cutouts unlocked for today!', 3500);
    },
    [leadInput, onLeadCapture, flash],
  );

  const joinWaitlist = useCallback(() => {
    const v = readSavedLead() || leadInput.trim();
    try {
      localStorage.setItem(WAITLIST_KEY, JSON.stringify({ value: v, ts: Date.now() }));
    } catch {
      /* ignore */
    }
    onLeadCapture?.('waitlist', v);
    setWaitlistJoined(true);
    flash('✨ You’re on the SellerMath Pro waitlist!', 3500);
  }, [leadInput, onLeadCapture, flash]);

  /* ── derived credit state ── */
  const dailyLimit = credits.bonusUnlocked ? BONUS_DAILY_LIMIT : BASE_DAILY_LIMIT;
  const remainingCredits = Math.max(0, dailyLimit - credits.used);
  const limitReached = remainingCredits === 0;
  const resetLabel = resetTimeLabel();

  /* ── derived UI state ── */
  const activePreset = PRESETS.find((p) => p.s.ratio === ratio && p.s.size === size && p.s.padding === padding)?.id;
  const applyPreset = (s: Settings) => {
    setRatio(s.ratio);
    setSize(s.size);
    setPadding(s.padding);
  };

  const step1: 'todo' | 'active' | 'done' = originalUrl ? 'done' : 'active';
  const step2: 'todo' | 'active' | 'done' = status === 'processing' ? 'active' : status === 'done' ? 'done' : 'todo';
  const step3: 'todo' | 'active' | 'done' = status === 'done' ? 'active' : 'todo';

  const minSide = previewDims ? Math.min(previewDims.w, previewDims.h) : 0;

  const segBtn = (active: boolean) =>
    `rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all text-left sm:text-center leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
      active
        ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
    }`;

  const secondaryBtn =
    'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-zinc-900';

  return (
    <div className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 box-border overflow-x-hidden">
      <style>{`
        @keyframes bgr-scan { 0% { top: 0%; } 50% { top: calc(100% - 3px); } 100% { top: 0%; } }
        @keyframes bgr-pop { from { opacity: 0; transform: translate(-50%, 8px) scale(.96); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        @media (prefers-reduced-motion: reduce) { .bgr-anim { animation: none !important; } }
      `}</style>

      {/* Full-page drop overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-500/10 backdrop-blur-sm pointer-events-none">
          <div className="rounded-3xl border-4 border-dashed border-emerald-500 bg-white/90 dark:bg-zinc-900/90 px-8 py-10 text-center shadow-2xl">
            <div className="text-5xl mb-2">📥</div>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Drop your photo anywhere</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">We’ll remove the background instantly</p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{ animation: 'bgr-pop .2s ease-out' }}
          className="bgr-anim fixed bottom-6 left-1/2 z-50 w-max max-w-[92vw] -translate-x-1/2 rounded-2xl bg-zinc-900 dark:bg-white px-4 py-2.5 text-center text-sm font-medium text-white dark:text-zinc-900 shadow-xl"
        >
          {toast}
        </div>
      )}

      {/* ─────────────────── Hero Header ─────────────────── */}
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 dark:from-zinc-900/95 dark:via-zinc-900/90 dark:to-emerald-950/25 p-5 sm:p-7 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg shadow-emerald-500/25">
            ✨
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              AI Background Remover &amp; Pure White Studio
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Instantly strip backgrounds and export 100% pure white (#FFFFFF) compliant images for Amazon, Flipkart,
              and Myntra. Runs securely in your browser.
            </p>
          </div>
        </div>

        {/* Live daily credit counter (top-right on desktop, full-width under the title on mobile) */}
        <CreditPill remaining={remainingCredits} limit={dailyLimit} bonus={credits.bonusUnlocked} />
        </div>

        {/* Progress stepper */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mb-1" aria-label="Progress">
          <StepPill n={1} label="Upload" state={step1} />
          <StepPill n={2} label="AI Cut-out" state={step2} />
          <StepPill n={3} label="Export" state={step3} />
        </div>
      </div>

      {/* ─────────────────── Daily limit reached banner ─────────────────── */}
      {limitReached && (
        <div
          role="alert"
          className="mb-6 rounded-3xl border border-rose-200/80 dark:border-rose-900/50 bg-gradient-to-br from-white/80 via-rose-50/60 to-amber-50/40 dark:from-zinc-900/80 dark:via-zinc-900/70 dark:to-rose-950/30 backdrop-blur p-4 sm:p-6 shadow-sm"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white text-xl sm:text-2xl shadow-lg shadow-rose-500/25">
              {credits.bonusUnlocked ? '⏳' : '🎁'}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Daily Free Limit Reached ({credits.used}/{dailyLimit} Used)
              </h2>

              {!credits.bonusUnlocked ? (
                /* Option A — instant free unlock */
                <>
                  <p className="mt-1 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                    Drop your work email or store name and unlock <strong className="text-zinc-900 dark:text-zinc-100">+5 bonus cutouts</strong>{' '}
                    right now — free. Otherwise your quota resets automatically at {resetLabel}.
                  </p>
                  <form onSubmit={submitLead} noValidate className="mt-4 flex flex-col sm:flex-row gap-2">
                    <label htmlFor="sellermath-lead" className="sr-only">
                      Work email or store name
                    </label>
                    <input
                      id="sellermath-lead"
                      type="text"
                      autoComplete="email"
                      value={leadInput}
                      onChange={(e) => {
                        setLeadInput(e.target.value);
                        if (leadError) setLeadError(null);
                      }}
                      placeholder="Work email or store name"
                      aria-invalid={leadError ? true : undefined}
                      className="min-w-0 flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      Unlock +5 Bonus Cutouts Today — Free
                    </button>
                  </form>
                  {leadError && <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{leadError}</p>}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">No spam — just seller tips &amp; new SellerMath tools.</p>
                </>
              ) : (
                /* Option B — all 10/10 used */
                <>
                  <p className="mt-1 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                    You&apos;ve used all {BONUS_DAILY_LIMIT} daily cutouts! Your free quota resets automatically at {resetLabel}
                  </p>
                  {waitlistJoined ? (
                    <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      ✓ You&apos;re on the SellerMath Pro waitlist
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={joinWaitlist}
                      className="mt-4 w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      ✨ Join SellerMath Pro Waitlist (Unlimited Bulk Cutouts)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── Two-column workspace ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* ── LEFT: Upload ── */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Upload Product Photo</h2>

          <div
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={limitReached ? -1 : 0}
            aria-disabled={limitReached}
            aria-label="Upload a product photo"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center min-h-[300px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              limitReached ? 'opacity-60 pointer-events-none' : ''
            } ${
              originalUrl ? 'p-3 sm:p-4' : 'p-6 sm:p-10'
            } ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 scale-[1.01]'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-emerald-400 dark:hover:border-emerald-600 bg-zinc-50/60 dark:bg-zinc-950/30'
            }`}
          >
            {/* Gallery / desktop file picker */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileInput} className="hidden" />
            {/* Direct camera capture on phones & tablets */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onFileInput} className="hidden" />

            {originalUrl ? (
              <div className="relative">
                <img
                  src={originalUrl}
                  alt="Original upload"
                  onLoad={(e) => {
                    const t = e.currentTarget;
                    setOriginalMeta((m) => (m ? { ...m, w: t.naturalWidth, h: t.naturalHeight } : m));
                  }}
                  className="max-h-72 w-auto max-w-full rounded-lg object-contain shadow-sm"
                />
                {status === 'processing' && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
                    <div className="absolute inset-0 bg-emerald-500/10" />
                    <div
                      className="bgr-anim absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_16px_4px_rgba(16,185,129,0.6)]"
                      style={{ animation: 'bgr-scan 2s ease-in-out infinite' }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="relative mb-4">
                  <div className="absolute -inset-3 rounded-3xl bg-emerald-500/10 blur-xl" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-500/25">
                    📤
                  </div>
                </div>
                <p className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">Tap to upload or drop a photo here</p>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">PNG, JPG, WEBP or HEIC · up to 10 MB</p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1">🖱️ Click</span>
                  <span className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1">🧲 Drag &amp; drop</span>
                  <span className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1">
                    <kbd className="font-sans">Ctrl/⌘</kbd> + <kbd className="font-sans">V</kbd>
                  </span>
                </div>
              </>
            )}
          </div>

          {originalMeta && (
            <p className="mt-2 truncate text-center text-xs text-zinc-500 dark:text-zinc-400">
              {originalMeta.name} · {formatBytes(originalMeta.size)}
              {originalMeta.w && originalMeta.h ? ` · ${originalMeta.w}×${originalMeta.h}px` : ''}
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" disabled={limitReached} onClick={() => cameraInputRef.current?.click()} className={secondaryBtn}>
              📷 Take Photo
            </button>
            <button type="button" disabled={limitReached} onClick={() => void pasteFromClipboard()} className={secondaryBtn}>
              📋 Paste Image
            </button>
          </div>

          {originalUrl && (
            <button type="button" onClick={clearAll} className={`mt-2 w-full ${secondaryBtn}`}>
              ↺ Start over with a different photo
            </button>
          )}

          {error && (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm text-red-700 dark:text-red-400"
            >
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="font-bold leading-none opacity-70 hover:opacity-100">
                ✕
              </button>
            </div>
          )}
        </section>

        {/* ── RIGHT: Result + Export ── */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100">Result Preview</h2>
            {status === 'done' && cutoutUrl && originalUrl && (
              <div className="flex gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1" role="tablist" aria-label="Preview mode">
                <button type="button" role="tab" aria-selected={view === 'result'} onClick={() => setView('result')} className={segBtn(view === 'result')}>
                  Result
                </button>
                <button type="button" role="tab" aria-selected={view === 'compare'} onClick={() => setView('compare')} className={segBtn(view === 'compare')}>
                  Compare
                </button>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden min-h-[300px] flex items-center justify-center"
            style={previewUrl && status === 'done' && view === 'result' ? (exportMode === 'transparent' ? CHECKER : { backgroundColor: '#FFFFFF' }) : undefined}
          >
            {status === 'processing' ? (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="bgr-anim w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 max-w-xs">
                  Loading AI Model &amp; Extracting Subject (This takes a few seconds)...
                </p>
                {progress !== null && (
                  <div className="w-52">
                    <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{progress}%</p>
                  </div>
                )}
                <p className="text-xs text-zinc-400 dark:text-zinc-500">First run downloads the model · later runs are much faster</p>
              </div>
            ) : status === 'done' && view === 'compare' && cutoutUrl && originalUrl ? (
              <CompareSlider before={originalUrl} after={cutoutUrl} />
            ) : previewUrl && status === 'done' ? (
              <img src={previewUrl} alt="Background removed" className="max-h-80 w-auto max-w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 p-8 text-center text-zinc-400 dark:text-zinc-500">
                <div className="text-5xl">🖼️</div>
                <p className="text-sm font-medium">Your processed image will appear here</p>
                <p className="text-xs">Upload a photo to get started — it never leaves your device.</p>
              </div>
            )}
          </div>

          {status === 'done' && previewUrl && (
            <div className="mt-4 space-y-4">
              {/* Marketplace compliance badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge ok={exportMode === 'white'}>Pure white #FFFFFF</Badge>
                <Badge ok={minSide >= 1000}>{minSide >= 1000 ? '1000px+ (zoom ready)' : 'Under 1000px'}</Badge>
                {previewDims && previewBlob && (
                  <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                    {previewDims.w}×{previewDims.h} · {formatBytes(previewBlob.size)} · {exportMode === 'white' ? 'JPEG' : 'PNG'}
                  </span>
                )}
              </div>

              {/* Marketplace presets */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Marketplace preset</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESETS.map((p) => {
                    const active = activePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => applyPreset(p.s)}
                        className={`rounded-xl border px-3 py-2 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          active
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {p.id === 'free' ? <span>{p.emoji}</span> : <MarketplaceLogo marketplace={p.id} size="xs" />}
                          {p.label}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{p.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Export mode toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <button type="button" onClick={() => setExportMode('transparent')} className={segBtn(exportMode === 'transparent')}>
                  Transparent Background (PNG)
                </button>
                <button type="button" onClick={() => setExportMode('white')} className={segBtn(exportMode === 'white')}>
                  Pure White Background (JPEG — Marketplace Compliant)
                </button>
              </div>

              {/* Fine-tune */}
              <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/30 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-zinc-800 dark:text-zinc-200 select-none">⚙️ Fine-tune export</summary>

                <div className="mt-3 space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <div>
                    <span className="font-medium">Frame shape</span>
                    <div className="mt-1 grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      {(['1:1', '3:4', 'free'] as Ratio[]).map((r) => (
                        <button key={r} type="button" onClick={() => setRatio(r)} className={`${segBtn(ratio === r)} !text-center`}>
                          {r === 'free' ? 'Original' : r === '1:1' ? 'Square 1:1' : 'Portrait 3:4'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {ratio !== 'free' && (
                    <label className="block">
                      <span className="flex justify-between font-medium">
                        <span>Padding around product</span>
                        <span className="text-zinc-500 dark:text-zinc-400">{padding}%</span>
                      </span>
                      <input type="range" min={0} max={20} value={padding} onChange={(e) => setPadding(Number(e.target.value))} className="w-full accent-emerald-500" />
                    </label>
                  )}

                  <label className="block">
                    <span className="font-medium">Output size</span>
                    <select
                      value={String(size)}
                      onChange={(e) => setSize(e.target.value === 'original' ? 'original' : (Number(e.target.value) as OutSize))}
                      className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                    >
                      <option value="original">Original resolution</option>
                      <option value="1000">1000 px (Amazon zoom minimum)</option>
                      <option value="1440">1440 px (Myntra 1080×1440)</option>
                      <option value="1500">1500 px</option>
                      <option value="2000">2000 px (high-res)</option>
                    </select>
                  </label>

                  {exportMode === 'white' && (
                    <label className="block">
                      <span className="flex justify-between font-medium">
                        <span>JPEG quality</span>
                        <span className="text-zinc-500 dark:text-zinc-400">{Math.round(quality * 100)}%</span>
                      </span>
                      <input type="range" min={0.7} max={1} step={0.01} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-emerald-500" />
                    </label>
                  )}
                </div>
              </details>

              {/* Actions — sticky on mobile so the main CTA is always in thumb reach */}
              <div className="sticky bottom-3 z-10 space-y-2 rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur p-1 lg:static lg:bg-transparent lg:backdrop-blur-none lg:p-0">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  📥 Download High-Res Image
                </button>
                <button type="button" onClick={() => void handleCopy()} className={`w-full ${secondaryBtn}`}>
                  📄 Copy Image to Clipboard
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}