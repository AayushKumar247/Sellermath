"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ================================ Types ================================== */

type StudioMode = "product" | "text";
type AspectRatio = "1:1" | "4:5" | "16:9";
type PreviewView = "result" | "compare";
type MarketplacePreset = "amazon" | "flipkart" | "myntra" | "banner";
type ExportFormat = "png" | "jpeg";
type FrameShape = "square" | "portrait" | "landscape";
type OutputSize = "original" | "1000" | "1440" | "1500" | "2000";

interface GeneratedImage {
  url: string;
  prompt: string;
  mode: StudioMode;
  aspect: AspectRatio;
  createdAt: number;
}

interface ToastMessage {
  id: number;
  text: string;
  tone?: "success" | "error" | "info";
}

interface ImageMetadata {
  name: string;
  size: number;
  width: number;
  height: number;
  type: string;
}

interface UseUniversalImageInputOptions {
  onImageReady?: (file: File, preview: string, metadata: ImageMetadata) => void;
  onPasteSuccess?: (source: "paste" | "clipboard") => void;
  onError?: (message: string) => void;
  maxSizeMB?: number;
}

/* ================= Inlined Universal Image Input Hook ==================== */

function useUniversalImageInput(opts: UseUniversalImageInputOptions = {}) {
  const { onImageReady, onPasteSuccess, onError, maxSizeMB = 15 } = opts;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const prevUrlRef = useRef<string | null>(null);

  const acceptFile = useCallback(
    async (incoming?: File | null) => {
      if (!incoming) return;
      const looksLikeImage =
        incoming.type.startsWith("image/") ||
        /\.(png|jpe?g|webp|heic|heif|gif|bmp)$/i.test(incoming.name);
      if (!looksLikeImage) {
        onError?.("Please select a valid image file.");
        return;
      }
      if (incoming.size > maxSizeMB * 1024 * 1024) {
        onError?.(`Image exceeds ${maxSizeMB} MB limit.`);
        return;
      }

      const url = URL.createObjectURL(incoming);
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = url;
      });

      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = url;

      const meta: ImageMetadata = {
        name: incoming.name || `pasted-image-${Date.now()}.png`,
        size: incoming.size,
        width: dims.w,
        height: dims.h,
        type: incoming.type || "image/png",
      };

      setFile(incoming);
      setPreview(url);
      setMetadata(meta);
      onImageReady?.(incoming, url, meta);
    },
    [onImageReady, onError, maxSizeMB]
  );

  const clear = useCallback(() => {
    setFile(null);
    setPreview(null);
    setMetadata(null);
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = "";
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) {
            e.preventDefault();
            void acceptFile(f).then(() => onPasteSuccess?.("paste"));
            return;
          }
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [acceptFile, onPasteSuccess]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard?.read) {
        onError?.("Clipboard read not supported — try Ctrl+V instead.");
        return;
      }
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imgType = item.types.find((t) => t.startsWith("image/"));
        if (imgType) {
          const blob = await item.getType(imgType);
          const ext = imgType.split("/")[1] || "png";
          const f = new File([blob], `clipboard-${Date.now()}.${ext}`, { type: imgType });
          await acceptFile(f);
          onPasteSuccess?.("clipboard");
          return;
        }
      }
      onError?.("No image found in clipboard.");
    } catch {
      onError?.("Clipboard permission denied — try Ctrl+V instead.");
    }
  }, [acceptFile, onPasteSuccess, onError]);

  const dragHandlers = {
    onDragEnter: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(true);
    },
    onDragOver: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(true);
    },
    onDragLeave: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    },
    onDrop: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void acceptFile(f);
    },
  };

  return {
    file, preview, metadata, isDragging,
    inputRef, acceptFile, clear, pasteFromClipboard, dragHandlers,
  };
}

/* ============================== Constants ================================ */

const CREDITS_KEY = "sellermath_img_credits";
const DAILY_CREDITS = 3;
const MAX_PROMPT = 500;
const API_ENDPOINT = "/api/generate-image";

const ASPECTS: Record<
  AspectRatio,
  { title: string; sub: string; res: string; ratio: string; w: number; h: number }
> = {
  "1:1": { title: "Square", sub: "Amazon / Flipkart Main", res: "1080×1080", ratio: "1 / 1", w: 1024, h: 1024 },
  "4:5": { title: "Portrait", sub: "Myntra / Instagram", res: "1080×1350", ratio: "4 / 5", w: 1024, h: 1280 },
  "16:9": { title: "Banner", sub: "Brand Store / A+ Content", res: "1920×1080", ratio: "16 / 9", w: 1280, h: 720 },
};

const PRESETS: { label: string; prompt: string }[] = [
  { label: "✨ Luxury Marble Podium", prompt: "on a luxury white marble podium with dramatic studio lighting, high-end product photography" },
  { label: "🌿 Botanical Wooden Table", prompt: "on a rustic wooden table with fresh botanical greenery, natural soft light, cozy aesthetic" },
  { label: "☀️ Morning Sunlight & Shadows", prompt: "in warm morning sunlight with soft long shadows, airy minimal setting, lifestyle photography" },
  { label: "🪔 Indian Festive Backdrop", prompt: "against a festive Indian backdrop with diyas, marigold garlands, warm golden bokeh, premium festive mood" },
  { label: "⚡ Neon Cyber Tech Desk", prompt: "on a futuristic cyber tech desk with neon blue and pink lighting, sleek dark surfaces, cinematic" },
  { label: "🧴 Minimal Pastel Bathroom", prompt: "on a minimal pastel bathroom shelf, clean soft lighting, spa-like serene atmosphere" },
];

const STYLE_PILLS = ["Studio Softbox", "Natural Daylight", "Macro Bokeh", "4K Commercial"];

const MARKETPLACE_PRESETS: Record<
  MarketplacePreset,
  { icon: string; label: string; dims: string; hint: string; frame: FrameShape }
> = {
  amazon: { icon: "📦", label: "Amazon", dims: "2000×2000", hint: "lifestyle / secondary slot", frame: "square" },
  flipkart: { icon: "🛍️", label: "Flipkart", dims: "1500×1500", hint: "square gallery", frame: "square" },
  myntra: { icon: "👗", label: "Myntra", dims: "1080×1440", hint: "3:4 fashion portrait", frame: "portrait" },
  banner: { icon: "🖼️", label: "Original / Banner", dims: "1920×1080", hint: "A+ brand story", frame: "landscape" },
};

const FRAME_SHAPES: { id: FrameShape; label: string; ratio: number }[] = [
  { id: "square", label: "Square 1:1", ratio: 1 },
  { id: "portrait", label: "Portrait 3:4", ratio: 3 / 4 },
  { id: "landscape", label: "Landscape 16:9", ratio: 16 / 9 },
];

const OUTPUT_SIZES: { id: OutputSize; label: string }[] = [
  { id: "original", label: "Original resolution" },
  { id: "1000", label: "1000 px (Amazon zoom minimum)" },
  { id: "1440", label: "1440 px (Myntra 1080×1440)" },
  { id: "1500", label: "1500 px (Flipkart recommended)" },
  { id: "2000", label: "2000 px (high-res)" },
];

/* =============================== Helpers ================================= */

const todayKey = (): string => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const msUntilMidnight = (): number => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
};

const readCredits = (): number => {
  if (typeof window === "undefined") return DAILY_CREDITS;
  try {
    const raw = window.localStorage.getItem(CREDITS_KEY);
    if (!raw) return DAILY_CREDITS;
    const parsed = JSON.parse(raw) as { date?: string; remaining?: number };
    if (!parsed || parsed.date !== todayKey()) return DAILY_CREDITS;
    const remaining = Number(parsed.remaining);
    if (Number.isNaN(remaining)) return DAILY_CREDITS;
    return Math.min(Math.max(Math.floor(remaining), 0), DAILY_CREDITS);
  } catch {
    return DAILY_CREDITS;
  }
};

const writeCredits = (remaining: number): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CREDITS_KEY, JSON.stringify({ date: todayKey(), remaining }));
  } catch {
    /* storage unavailable */
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const frameRatio = (shape: FrameShape): number =>
  shape === "square" ? 1 : shape === "portrait" ? 3 / 4 : 16 / 9;

const computeExportDims = (outputSize: OutputSize, shape: FrameShape): { w: number; h: number } => {
  const ratio = frameRatio(shape);
  const longEdge = outputSize === "original" ? 2000 : parseInt(outputSize, 10);
  if (ratio >= 1) return { w: longEdge, h: Math.round(longEdge / ratio) };
  return { w: Math.round(longEdge * ratio), h: longEdge };
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });

async function requestGeneration(
  payload: { prompt: string; aspect: AspectRatio; mode: StudioMode },
  file?: File | null
): Promise<{ url: string; fallback: boolean }> {
  try {
    let res: Response;
    if (file) {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("prompt", payload.prompt);
      fd.append("aspect", payload.aspect);
      fd.append("mode", payload.mode);
      res = await fetch(API_ENDPOINT, { method: "POST", body: fd });
    } else {
      res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const url = data?.url ?? data?.imageUrl ?? data?.image;
    if (!url || typeof url !== "string") throw new Error("Missing image URL");
    return { url, fallback: false };
  } catch {
    const seed = Math.random().toString(36).slice(2, 10);
    const { w, h } = ASPECTS[payload.aspect];
    return { url: `https://picsum.photos/seed/${seed}/${w}/${h}`, fallback: true };
  }
}

/* ---------------------- Canvas export pipeline --------------------------- */

interface ExportOptions {
  resultUrl: string;
  outputSize: OutputSize;
  frameShape: FrameShape;
  paddingPct: number;
  warmthPct: number;
  format: ExportFormat;
}

async function buildExportBlob(opts: ExportOptions): Promise<Blob> {
  const img = await loadImage(opts.resultUrl);

  const { w, h } = computeExportDims(opts.outputSize, opts.frameShape);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // White padding background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Inner drawable area with padding
  const padPx = Math.round(Math.min(w, h) * (opts.paddingPct / 100));
  const innerW = Math.max(1, w - padPx * 2);
  const innerH = Math.max(1, h - padPx * 2);
  const imgAspect = img.width / img.height;
  const innerAspect = innerW / innerH;

  let drawW: number;
  let drawH: number;
  if (imgAspect > innerAspect) {
    drawW = innerW;
    drawH = innerW / imgAspect;
  } else {
    drawH = innerH;
    drawW = innerH * imgAspect;
  }
  const dx = (w - drawW) / 2;
  const dy = (h - drawH) / 2;

  ctx.drawImage(img, dx, dy, drawW, drawH);

  // Warmth tint (soft-light overlay) — matches live preview
  if (opts.warmthPct !== 0) {
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    const alpha = (Math.abs(opts.warmthPct) / 20) * 0.35;
    ctx.fillStyle =
      opts.warmthPct > 0
        ? `rgba(255, 180, 80, ${alpha})`
        : `rgba(80, 180, 255, ${alpha})`;
    ctx.beginPath();
    ctx.rect(dx, dy, drawW, drawH);
    ctx.clip();
    ctx.fillRect(dx, dy, drawW, drawH);
    ctx.restore();
  }

  const mime = opts.format === "jpeg" ? "image/jpeg" : "image/png";
  const quality = opts.format === "jpeg" ? 0.95 : undefined;

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      mime,
      quality
    );
  });
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/* ================================ Icons ================================== */

const iconBase = "fill-none stroke-current";

function BoltIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 2 4 14h6l-1.5 8L20 9.5h-6.4L13.5 2Z" />
    </svg>
  );
}
function SparklesIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}
function UploadIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
function ImageIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L20 20" />
    </svg>
  );
}
function DownloadIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}
function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function SquareFrameIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.6" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}
function PortraitFrameIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.6" aria-hidden="true">
      <rect x="7" y="3" width="10" height="18" rx="2" />
    </svg>
  );
}
function LandscapeFrameIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="7" width="18" height="10" rx="2" />
    </svg>
  );
}
function ZoomIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
    </svg>
  );
}
function CopyIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </svg>
  );
}
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}
function ClipboardPasteIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="4" width="12" height="4" rx="1.5" />
      <path d="M8 6H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-3" />
      <path d="M12 11v6M9.5 13.5 12 11l2.5 2.5" />
    </svg>
  );
}
function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}
function ReplaceIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5" />
    </svg>
  );
}
function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`${iconBase} ${className}`} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const ASPECT_ICONS: Record<AspectRatio, (p: { className?: string }) => JSX.Element> = {
  "1:1": SquareFrameIcon,
  "4:5": PortraitFrameIcon,
  "16:9": LandscapeFrameIcon,
};

const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg,#e4e4e7 25%,transparent 25%),linear-gradient(-45deg,#e4e4e7 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e4e4e7 75%),linear-gradient(-45deg,transparent 75%,#e4e4e7 75%)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0,0 7px,7px -7px,-7px 0",
};

const CHECKERBOARD_STYLE_DARK: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg,#27272a 25%,transparent 25%),linear-gradient(-45deg,#27272a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#27272a 75%),linear-gradient(-45deg,transparent 75%,#27272a 75%)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0,0 7px,7px -7px,-7px 0",
};

/* ============================== Component ================================ */

export default function AIImageGenerator() {
  /* ------------------------- Existing state ------------------------- */
  const [mode, setMode] = useState<StudioMode>("product");
  const [aspect, setAspect] = useState<AspectRatio>("1:1");
  const [prompt, setPrompt] = useState("");
  const [remaining, setRemaining] = useState<number>(DAILY_CREDITS);
  const [styleTags, setStyleTags] = useState<Set<string>>(new Set());

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedImage | null>(null);
  const [sessionImages, setSessionImages] = useState<GeneratedImage[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [lightbox, setLightbox] = useState<GeneratedImage | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  /* ------------------------ Phase 2: new state ---------------------- */
  const [previewView, setPreviewView] = useState<PreviewView>("result");
  const [marketplacePreset, setMarketplacePreset] = useState<MarketplacePreset>("amazon");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");

  /* ------------------------ Phase 3: new state ---------------------- */
  const [fineTuneOpen, setFineTuneOpen] = useState(false);
  const [frameShape, setFrameShape] = useState<FrameShape>("square");
  const [paddingPct, setPaddingPct] = useState(6);
  const [warmthPct, setWarmthPct] = useState(0);
  const [outputSize, setOutputSize] = useState<OutputSize>("2000");
  const [justCopied, setJustCopied] = useState(false);

  /* ---------------------- Universal input hook ---------------------- */
  const imageInput = useUniversalImageInput({
    onPasteSuccess: () =>
      setToast({ id: Date.now(), text: "✓ Image pasted from clipboard!", tone: "success" }),
    onError: (msg) => setToast({ id: Date.now(), text: msg, tone: "error" }),
  });

  /* --------------------------- Lifecycle ---------------------------- */
  useEffect(() => {
    setRemaining(readCredits());
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setRemaining(DAILY_CREDITS);
      writeCredits(DAILY_CREDITS);
    }, msUntilMidnight() + 1000);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!justCopied) return;
    const id = window.setTimeout(() => setJustCopied(false), 2200);
    return () => window.clearTimeout(id);
  }, [justCopied]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  /* ---------------------------- Helpers ----------------------------- */
  const finalPrompt = useMemo(() => {
    const parts: string[] = [];
    if (prompt.trim()) parts.push(prompt.trim());
    if (styleTags.size > 0) parts.push(Array.from(styleTags).join(", "));
    return parts.join(", ");
  }, [prompt, styleTags]);

  const canGenerate =
    !isGenerating &&
    remaining > 0 &&
    finalPrompt.length > 0 &&
    (mode === "text" || Boolean(imageInput.file));

  const canCompare = mode === "product" && Boolean(imageInput.preview) && Boolean(result);
  const showCompare = previewView === "compare" && canCompare;

  const exportDims = useMemo(
    () => computeExportDims(outputSize, frameShape),
    [outputSize, frameShape]
  );

  const readoutLabel =
    outputSize === "2000"
      ? "High-Res"
      : outputSize === "1500"
      ? "Flipkart Ready"
      : outputSize === "1440"
      ? "Myntra Ready"
      : outputSize === "1000"
      ? "Amazon Zoom Ready"
      : "Original";

  /* ---------------------------- Handlers ---------------------------- */

  const toggleStyle = (tag: string) => {
    setStyleTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const applyPreset = (presetPrompt: string) => {
    setPrompt((prev) => {
      const base = prev.trim();
      const merged = base ? `${base}, ${presetPrompt}` : presetPrompt;
      return merged.slice(0, MAX_PROMPT);
    });
  };

  const selectMarketplacePreset = (preset: MarketplacePreset) => {
    setMarketplacePreset(preset);
    setFrameShape(MARKETPLACE_PRESETS[preset].frame);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    const nextRemaining = Math.max(0, remaining - 1);
    setRemaining(nextRemaining);
    writeCredits(nextRemaining);

    setIsGenerating(true);
    setResult(null);

    try {
      const { url } = await requestGeneration(
        { prompt: finalPrompt, aspect, mode },
        mode === "product" ? imageInput.file : null
      );
      const newImage: GeneratedImage = {
        url,
        prompt: finalPrompt,
        mode,
        aspect,
        createdAt: Date.now(),
      };
      setResult(newImage);
      setSessionImages((prev) => [newImage, ...prev].slice(0, 8));
    } catch {
      setToast({ id: Date.now(), text: "Generation failed. Please try again.", tone: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const buildExport = useCallback(async (): Promise<Blob | null> => {
    if (!result) return null;
    return buildExportBlob({
      resultUrl: result.url,
      outputSize,
      frameShape,
      paddingPct,
      warmthPct,
      format: exportFormat,
    });
  }, [result, outputSize, frameShape, paddingPct, warmthPct, exportFormat]);

  const handleDownload = useCallback(async () => {
    if (!result || isDownloading) return;
    setIsDownloading(true);
    try {
      const blob = await buildExport();
      if (!blob) return;
      const ext = exportFormat === "jpeg" ? "jpg" : "png";
      downloadBlob(
        blob,
        `sellermath-ai-${marketplacePreset}-${exportDims.w}x${exportDims.h}-${Date.now()}.${ext}`
      );
    } catch {
      setToast({ id: Date.now(), text: "Export failed — try again.", tone: "error" });
    } finally {
      setIsDownloading(false);
    }
  }, [result, isDownloading, buildExport, exportFormat, marketplacePreset, exportDims]);

  const handleCopyImage = useCallback(async () => {
    if (!result || isCopyingImage) return;
    setIsCopyingImage(true);
    try {
      const blob = await buildExport();
      if (!blob) return;
      if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
        throw new Error("Clipboard image write not supported.");
      }
      // Prefer requested format; fall back to PNG if browser rejects it
      const preferredType = exportFormat === "jpeg" ? "image/jpeg" : "image/png";
      try {
        await navigator.clipboard.write([new ClipboardItem({ [preferredType]: blob })]);
      } catch {
        // Some browsers only allow image/png in clipboard
        const pngBlob =
          exportFormat === "png"
            ? blob
            : await buildExportBlob({
                resultUrl: result.url,
                outputSize,
                frameShape,
                paddingPct,
                warmthPct,
                format: "png",
              });
        await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
      }
      setJustCopied(true);
      setToast({ id: Date.now(), text: "Image copied to clipboard!", tone: "success" });
    } catch {
      setToast({
        id: Date.now(),
        text: "Copy failed — try downloading instead.",
        tone: "error",
      });
    } finally {
      setIsCopyingImage(false);
    }
  }, [result, isCopyingImage, buildExport, exportFormat, outputSize, frameShape, paddingPct, warmthPct]);

  const handleCopyPrompt = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      setToast({ id: Date.now(), text: "Prompt copied to clipboard!", tone: "success" });
    } catch {
      setToast({ id: Date.now(), text: "Copy failed.", tone: "error" });
    }
  };

  /* ------------------------------ JSX ------------------------------- */

  const frameAspectCss = `${frameRatio(frameShape)}`;

  return (
    <div className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 box-border overflow-x-hidden">
      {/* =============================== Hero =============================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 ring-1 ring-zinc-200/70 shadow-sm dark:from-zinc-900/95 dark:via-zinc-900/90 dark:to-emerald-950/20 dark:ring-zinc-800/80">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-8 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-500/10" />

        <div className="relative flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-start lg:justify-between lg:p-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
              <SparklesIcon className="h-3.5 w-3.5" />
              AI Studio
            </span>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl lg:text-4xl dark:text-white">
              AI Product Lifestyle &amp; Image Generator
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
              Generate hyper-realistic lifestyle backgrounds for your product cutouts or create
              fresh product concepts from text prompts.
            </p>
          </div>

          <div className="flex flex-col items-start gap-1.5 lg:items-end">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold backdrop-blur transition-colors sm:text-sm ${
                remaining > 0
                  ? "border-emerald-200/80 bg-white/70 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-rose-200/80 bg-rose-50/80 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              }`}
            >
              <BoltIcon className="h-4 w-4" />
              <span>
                {remaining} / {DAILY_CREDITS} Free Generations Left
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-500">Resets daily at midnight</span>
          </div>
        </div>
      </section>

      {/* ============================ Tab switcher ========================== */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Generation mode" className="flex w-full items-center gap-1 rounded-2xl bg-zinc-100/90 p-1 ring-1 ring-zinc-200/70 sm:w-auto dark:bg-zinc-900/70 dark:ring-zinc-800">
          {(
            [
              { id: "product" as StudioMode, label: "Product to Lifestyle" },
              { id: "text" as StudioMode, label: "Text to Image" },
            ]
          ).map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setMode(tab.id)}
                className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-all sm:flex-none sm:px-4 sm:text-sm ${
                  active
                    ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
          {mode === "product"
            ? "Composite your transparent cutout into a brand-new scene."
            : "Create a concept product shot from a single text prompt."}
        </p>
      </div>

      {/* =============================== Studio ============================= */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* --------------------------- Left column --------------------------- */}
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/80 sm:p-6 lg:col-span-5 dark:bg-zinc-900/70 dark:ring-zinc-800">
          {mode === "product" && (
            <section>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">1</span>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Upload Product Cutout</h2>
              </div>

              <input
                ref={imageInput.inputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void imageInput.acceptFile(f);
                }}
              />

              {imageInput.preview ? (
                <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
                  <div className="flex items-start gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-zinc-200 dark:hidden" style={CHECKERBOARD_STYLE}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageInput.preview} alt="Product cutout preview" className="h-full w-full object-contain" />
                    </div>
                    <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-zinc-800 dark:block" style={CHECKERBOARD_STYLE_DARK}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageInput.preview} alt="Product cutout preview" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {imageInput.metadata?.name ?? "product-cutout.png"}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {imageInput.metadata && (
                          <>
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {imageInput.metadata.width} × {imageInput.metadata.height}px
                            </span>
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {formatBytes(imageInput.metadata.size)}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button type="button" onClick={() => imageInput.inputRef.current?.click()} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-800">
                          <ReplaceIcon className="h-3 w-3" /> Replace
                        </button>
                        <button type="button" onClick={imageInput.clear} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50 dark:bg-zinc-900 dark:text-rose-400 dark:ring-rose-900/60 dark:hover:bg-rose-950/30">
                          <TrashIcon className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  {...imageInput.dragHandlers}
                  onClick={() => imageInput.inputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") imageInput.inputRef.current?.click();
                  }}
                  className={`mt-3 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 ${
                    imageInput.isDragging
                      ? "scale-[1.01] border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30"
                      : "border-zinc-300 hover:border-emerald-400/70 hover:bg-emerald-50/40 dark:border-zinc-700 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/10"
                  }`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20">
                    <UploadIcon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {imageInput.isDragging ? "Drop image to load into studio" : "Drop your product cutout here"}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    PNG · JPG · WEBP · HEIC — from desktop, gallery, or camera · up to 15 MB
                  </span>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-[11px]">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Browse files</span>
                    <span className="text-zinc-400">·</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); void imageInput.pasteFromClipboard(); }}
                      className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                    >
                      <ClipboardPasteIcon className="h-3 w-3" /> Paste (Ctrl+V)
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Prompt */}
          <section className={mode === "product" ? "mt-5" : ""}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                {mode === "product" ? "2" : "1"}
              </span>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {mode === "product" ? "Describe the Background" : "Craft Your Scene Prompt"}
              </h2>
              <span className="ml-auto text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">{prompt.length}/{MAX_PROMPT}</span>
            </div>

            <div className="mt-3 -mx-1 overflow-x-auto px-1 pb-1">
              <div className="flex w-max gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p.label} type="button" onClick={() => applyPreset(p.prompt)} className="whitespace-nowrap rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-700/50 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-300">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT))}
              rows={mode === "text" ? 6 : 5}
              placeholder={
                mode === "product"
                  ? "Describe the background... e.g., On a marble kitchen counter with morning sunlight"
                  : "Describe the product scene... e.g., A matte ceramic mug on a linen tablecloth, soft morning window light, 50mm lens, shallow depth of field"
              }
              className="mt-2 w-full resize-none rounded-2xl bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-800 ring-1 ring-inset ring-zinc-200 transition placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-zinc-950/60 dark:text-zinc-100 dark:ring-zinc-800 dark:placeholder:text-zinc-500 dark:focus:ring-emerald-500/60"
            />
          </section>

          {/* Studio Controls & Aspect Ratio */}
          <section className="mt-5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                {mode === "product" ? "3" : "2"}
              </span>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Studio Controls &amp; Aspect Ratio</h2>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {(Object.keys(ASPECTS) as AspectRatio[]).map((id) => {
                const a = ASPECTS[id];
                const active = aspect === id;
                const Icon = ASPECT_ICONS[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAspect(id)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all duration-150 ${
                      active
                        ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/30"
                        : "border-zinc-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-700/50 dark:hover:bg-emerald-950/10"
                    }`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center ${active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-bold leading-tight text-zinc-800 dark:text-zinc-200">{a.title}</span>
                    <span className="text-[8px] leading-tight text-zinc-500 dark:text-zinc-500 text-center">{a.sub}</span>
                    <span className="font-mono text-[8px] text-zinc-400 dark:text-zinc-600">{a.res}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Style Enhancers</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {STYLE_PILLS.map((tag) => {
                  const active = styleTags.has(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleStyle(tag)}
                      aria-pressed={active}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                        active
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                          : "bg-zinc-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Generate */}
          <div className="group relative mt-5">
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 blur-lg transition-opacity duration-300 ${canGenerate ? "opacity-40 group-hover:opacity-70" : "opacity-0"}`}
            />
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={!canGenerate}
              className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {isGenerating ? <Spinner className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
              {isGenerating ? "Generating…" : "Generate AI Image"}
            </button>
          </div>

          <p className="mt-2.5 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
            {remaining === 0
              ? "You've used all free generations today — resets at midnight."
              : mode === "product" && !imageInput.file
              ? "Upload a transparent product cutout to continue."
              : finalPrompt.length === 0
              ? "Add a prompt or tap a preset to begin."
              : `Uses 1 credit · ${remaining} remaining today`}
          </p>
        </div>

        {/* --------------------------- Right column -------------------------- */}
        <div className="flex flex-col rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/80 sm:p-6 lg:col-span-7 dark:bg-zinc-900/70 dark:ring-zinc-800">
          {/* Card header: Result Preview + Result|Compare toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700">
                <ImageIcon className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Result Preview</h2>
            </div>

            <div role="tablist" aria-label="Preview view" className="flex items-center gap-1 rounded-full bg-zinc-100/90 p-1 ring-1 ring-zinc-200/70 dark:bg-zinc-800/70 dark:ring-zinc-700">
              {(
                [
                  { id: "result" as PreviewView, label: "Result" },
                  { id: "compare" as PreviewView, label: "Compare" },
                ]
              ).map((v) => {
                const active = previewView === v.id;
                const disabled = v.id === "compare" && !canCompare;
                return (
                  <button
                    key={v.id}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    disabled={disabled}
                    onClick={() => setPreviewView(v.id)}
                    title={disabled ? "Upload a product cutout & generate to compare" : v.label}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      active
                        ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-white dark:ring-zinc-700"
                        : disabled
                        ? "cursor-not-allowed text-zinc-400 opacity-60 dark:text-zinc-500"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview frame — reflects frame shape + padding + warmth */}
          <div className="mt-3 flex flex-1 items-center justify-center">
            <div
              className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/80 dark:bg-zinc-950 dark:ring-zinc-800"
              style={{ aspectRatio: frameAspectCss }}
            >
              {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div aria-hidden="true" className="absolute inset-0 animate-pulse bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-zinc-900 dark:via-emerald-950/30 dark:to-zinc-900" />
                  <div className="relative flex flex-col items-center gap-3 px-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-emerald-600 ring-1 ring-emerald-200 backdrop-blur dark:bg-zinc-800/80 dark:text-emerald-400 dark:ring-emerald-800">
                      <Spinner className="h-6 w-6" />
                    </span>
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Warming up AI GPUs &amp; generating your scene…
                    </p>
                    <div className="h-1.5 w-40 overflow-hidden rounded-full bg-emerald-200/70 dark:bg-emerald-900/60">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              ) : showCompare ? (
                /* Compare view */
                <div className="absolute inset-0 grid grid-cols-2 gap-2 p-2">
                  <div className="flex flex-col">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Original Product
                    </p>
                    <div className="flex-1 overflow-hidden rounded-lg ring-1 ring-zinc-200 dark:hidden" style={CHECKERBOARD_STYLE}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageInput.preview ?? ""} alt="Original product" className="h-full w-full object-contain" />
                    </div>
                    <div className="hidden flex-1 overflow-hidden rounded-lg ring-1 ring-zinc-800 dark:block" style={CHECKERBOARD_STYLE_DARK}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageInput.preview ?? ""} alt="Original product" className="h-full w-full object-contain" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      AI Lifestyle Scene
                    </p>
                    <div className="relative flex-1 overflow-hidden rounded-lg bg-white ring-1 ring-zinc-200 dark:ring-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={result!.url} alt="AI scene" className="h-full w-full object-cover" />
                      {warmthPct !== 0 && (
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{
                            background:
                              warmthPct > 0
                                ? `rgba(255, 180, 80, ${(Math.abs(warmthPct) / 20) * 0.35})`
                                : `rgba(80, 180, 255, ${(Math.abs(warmthPct) / 20) * 0.35})`,
                            mixBlendMode: "soft-light",
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : result ? (
                /* Result view with live padding + warmth */
                <div className="absolute inset-0" style={{ padding: `${paddingPct}%` }}>
                  <div className="relative h-full w-full overflow-hidden rounded-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={result.url}
                      src={result.url}
                      alt={result.prompt}
                      className="h-full w-full cursor-zoom-in object-cover"
                      onClick={() => setLightbox(result)}
                    />
                    {warmthPct !== 0 && (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            warmthPct > 0
                              ? `rgba(255, 180, 80, ${(Math.abs(warmthPct) / 20) * 0.35})`
                              : `rgba(80, 180, 255, ${(Math.abs(warmthPct) / 20) * 0.35})`,
                          mixBlendMode: "soft-light",
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setLightbox(result)}
                      aria-label="Zoom preview"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-zinc-700 shadow ring-1 ring-zinc-200 backdrop-blur transition hover:bg-white dark:bg-zinc-900/80 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-zinc-900"
                    >
                      <ZoomIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-300 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-600 dark:ring-zinc-800">
                    <ImageIcon className="h-6 w-6" />
                  </span>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Your generated scene will appear here</p>
                  <p className="max-w-xs text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                    {mode === "product"
                      ? "Upload a cutout, describe the setting, and let the studio build the scene."
                      : "Write a prompt, pick a ratio, and generate a fresh product concept."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Compliance badges + readout */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                <CheckIcon className="h-3 w-3" /> AI Lifestyle Composite
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                <CheckIcon className="h-3 w-3" /> 1000px+ (zoom ready)
              </span>
            </div>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-[10px] font-medium text-zinc-600 ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
              {exportDims.w}×{exportDims.h} · {readoutLabel} · {exportFormat.toUpperCase()}
            </span>
          </div>

          {/* MARKETPLACE PRESET grid */}
          <div className="mt-4">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Marketplace Preset
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(MARKETPLACE_PRESETS) as MarketplacePreset[]).map((id) => {
                const p = MARKETPLACE_PRESETS[id];
                const active = marketplacePreset === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectMarketplacePreset(id)}
                    aria-pressed={active}
                    className={`flex flex-col items-start gap-0.5 rounded-xl border p-2 text-left transition ${
                      active
                        ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/30"
                        : "border-zinc-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-emerald-700/50 dark:hover:bg-emerald-950/10"
                    }`}
                  >
                    <span className="text-base leading-none">{p.icon}</span>
                    <span className="mt-0.5 text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{p.label}</span>
                    <span className="font-mono text-[9px] text-zinc-500 dark:text-zinc-400">{p.dims}</span>
                    <span className="text-[9px] leading-tight text-zinc-400 dark:text-zinc-500">{p.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format switcher */}
          <div className="mt-3">
            <div role="tablist" aria-label="Export format" className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100/90 p-1 ring-1 ring-zinc-200/70 dark:bg-zinc-800/70 dark:ring-zinc-700">
              {(
                [
                  { id: "png" as ExportFormat, label: "Lossless Studio (PNG)" },
                  { id: "jpeg" as ExportFormat, label: "Marketplace Optimized (JPEG)" },
                ]
              ).map((f) => {
                const active = exportFormat === f.id;
                return (
                  <button
                    key={f.id}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setExportFormat(f.id)}
                    className={`rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
                      active
                        ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-white dark:ring-zinc-700"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fine-tune export drawer */}
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/40">
            <button
              type="button"
              onClick={() => setFineTuneOpen((v) => !v)}
              aria-expanded={fineTuneOpen}
              className="flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                <span aria-hidden="true">⚙️</span> Fine-tune export
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 text-zinc-500 transition-transform dark:text-zinc-400 ${fineTuneOpen ? "rotate-180" : ""}`}
              />
            </button>

            {fineTuneOpen && (
              <div className="border-t border-zinc-200 px-3 py-3 space-y-3 dark:border-zinc-800">
                {/* Frame shape */}
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Frame shape
                  </p>
                  <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100/90 p-1 ring-1 ring-zinc-200/70 dark:bg-zinc-800/70 dark:ring-zinc-700">
                    {FRAME_SHAPES.map((f) => {
                      const active = frameShape === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFrameShape(f.id)}
                          aria-pressed={active}
                          className={`rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${
                            active
                              ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-white dark:ring-zinc-700"
                              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Padding slider */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Padding / Subject margin
                    </p>
                    <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-300">{paddingPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={1}
                    value={paddingPct}
                    onChange={(e) => setPaddingPct(Number(e.target.value))}
                    className="mt-1 w-full accent-emerald-500"
                  />
                </div>

                {/* Warmth slider */}
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Lighting &amp; color warmth
                    </p>
                    <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-300">
                      {warmthPct > 0 ? "+" : ""}{warmthPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-20}
                    max={20}
                    step={1}
                    value={warmthPct}
                    onChange={(e) => setWarmthPct(Number(e.target.value))}
                    className="mt-1 w-full accent-emerald-500"
                  />
                  <div className="mt-0.5 flex justify-between text-[9px] text-zinc-400 dark:text-zinc-500">
                    <span>Cool Studio (−20%)</span>
                    <span>Warm Golden (+20%)</span>
                  </div>
                </div>

                {/* Output size */}
                <div>
                  <label htmlFor="output-size" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Output size
                  </label>
                  <div className="relative">
                    <select
                      id="output-size"
                      value={outputSize}
                      onChange={(e) => setOutputSize(e.target.value as OutputSize)}
                      className="w-full appearance-none rounded-xl bg-white px-3 py-2 pr-9 text-xs font-medium text-zinc-800 ring-1 ring-inset ring-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
                    >
                      {OUTPUT_SIZES.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Full-width stacked action buttons */}
          <div className="mt-4 space-y-2 border-t border-zinc-200/80 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={!result || isDownloading}
              className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-500/20 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              {isDownloading ? <Spinner className="h-3.5 w-3.5" /> : <DownloadIcon className="h-3.5 w-3.5" />}
              Download High-Res Image
            </button>

            <button
              type="button"
              onClick={() => void handleCopyImage()}
              disabled={!result || isCopyingImage}
              className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {isCopyingImage ? <Spinner className="h-3.5 w-3.5" /> : justCopied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
              {justCopied ? "✓ Copied to clipboard!" : "Copy Image to Clipboard"}
            </button>

            {result && (
              <p className="min-w-0 truncate pt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                {result.prompt}
              </p>
            )}

            {sessionImages.length > 0 && (
              <div className="pt-1">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Recent Creations
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {sessionImages.slice(0, 8).map((img) => {
                    const active = result?.createdAt === img.createdAt;
                    return (
                      <button
                        key={img.createdAt}
                        type="button"
                        onClick={() => setResult(img)}
                        title={img.prompt}
                        className={`relative shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                          active
                            ? "ring-emerald-500"
                            : "ring-zinc-200 hover:ring-emerald-300 dark:ring-zinc-700 dark:hover:ring-emerald-700"
                        }`}
                        style={{ width: 56, height: 56 }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {result && (
              <button
                type="button"
                onClick={() => void handleCopyPrompt()}
                className="mt-1 text-[10px] font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
              >
                📋 Copy prompt
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================== Lightbox ============================= */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-[92vh] max-w-[92vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.url} alt={lightbox.prompt} className="max-h-[88vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close preview"
              className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg transition hover:bg-zinc-100"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* =============================== Toast ============================== */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.tone === "error"
              ? "bg-rose-600 text-white"
              : toast.tone === "info"
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-emerald-600 text-white"
          }`}
        >
          <span className="truncate">{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="ml-1 shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}