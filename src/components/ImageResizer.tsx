import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Upload, Image as ImageIcon, Download, RotateCcw, Maximize, Crop, Lock, Unlock,
  ChevronRight, TrendingUp, RefreshCcw, Layers, ShieldCheck, Zap,
  CheckCircle2, X, Sliders, RotateCw, FlipHorizontal, FlipVertical,
  Gauge, Type, Move, Sparkles, Contrast as ContrastIcon, Package,
  ArrowLeftRight, Sun, Droplet, Camera, Target,
} from 'lucide-react';

/* ================================================================== */
/* Types                                                              */
/* ================================================================== */
interface ResizePreset { id: string; label: string; width: number; height: number; ratio: string; useCase: string; }
interface BackgroundOption { id: 'white' | 'transparent' | 'gray' | 'custom'; label: string; note: string; }
interface FormatOption { id: 'jpg' | 'png' | 'webp' | 'original'; label: string; mime: string; ext: string; }
interface DrawOpts {
  targetW: number; targetH: number;
  fitMode: 'pad' | 'cover'; paddingPct: number; bgColor: string;
  brightness: number; contrast: number; saturation: number;
  rotation: number; flipH: boolean; flipV: boolean;
  shadowEnabled: boolean; shadowIntensity: number;
  watermarkText: string; watermarkPos: 'br' | 'bl' | 'tr' | 'tl' | 'c';
  watermarkOpacity: number; watermarkSize: number;
}
interface BatchResult { presetId: string; label: string; url: string; blob: Blob; sizeKB: number; width: number; height: number; }
interface ImageResizerProps { onNavigate?: (page: string) => void; }

/* ================================================================== */
/* Constants                                                          */
/* ================================================================== */
const PRESETS: ResizePreset[] = [
  { id: 'amazon',   label: 'Amazon India Main',      width: 1000, height: 1000, ratio: '1:1',  useCase: 'Zoom Ready' },
  { id: 'flipkart', label: 'Flipkart Standard',      width: 1000, height: 1000, ratio: '1:1',  useCase: 'Square' },
  { id: 'myntra',   label: 'Myntra / Ajio Fashion',  width: 1080, height: 1440, ratio: '3:4',  useCase: 'Vertical' },
  { id: 'meesho',   label: 'Meesho Catalog',         width: 800,  height: 800,  ratio: '1:1',  useCase: 'Fast Load' },
  { id: 'story',    label: 'Instagram / WhatsApp Story', width: 1080, height: 1920, ratio: '9:16', useCase: 'Story' },
];
const BACKGROUNDS: BackgroundOption[] = [
  { id: 'white',       label: 'Pure White (#FFFFFF)',       note: 'Amazon Compliant' },
  { id: 'transparent', label: 'Transparent',                note: 'PNG/WEBP only' },
  { id: 'gray',        label: 'Soft Studio Gray (#F4F4F5)', note: '' },
  { id: 'custom',      label: 'Custom Hex Color',           note: 'Color picker' },
];
const FORMATS: FormatOption[] = [
  { id: 'jpg',      label: 'JPG',      mime: 'image/jpeg', ext: 'jpg' },
  { id: 'png',      label: 'PNG',      mime: 'image/png',  ext: 'png' },
  { id: 'webp',     label: 'WEBP',     mime: 'image/webp', ext: 'webp' },
  { id: 'original', label: 'Original', mime: '', ext: '' },
];

/* ================================================================== */
/* Pure render function — shared by preview, download, batch export  */
/* ================================================================== */
function drawToCanvas(canvas: HTMLCanvasElement, img: HTMLImageElement, opts: DrawOpts) {
  const { targetW: tW, targetH: tH } = opts;
  canvas.width = tW;
  canvas.height = tH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Background
  if (opts.bgColor === 'transparent') ctx.clearRect(0, 0, tW, tH);
  else { ctx.fillStyle = opts.bgColor; ctx.fillRect(0, 0, tW, tH); }

  // Effective padding (pad mode only)
  const effPad = opts.fitMode === 'pad' ? opts.paddingPct : 0;
  const padPx = Math.round(Math.min(tW, tH) * (effPad / 100));
  const areaW = Math.max(1, tW - padPx * 2);
  const areaH = Math.max(1, tH - padPx * 2);

  // Rotated source dimensions
  const sideways = opts.rotation === 90 || opts.rotation === 270;
  const srcW = sideways ? img.height : img.width;
  const srcH = sideways ? img.width : img.height;

  // Scale
  const scale = opts.fitMode === 'pad'
    ? Math.min(areaW / srcW, areaH / srcH)
    : Math.max(areaW / srcW, areaH / srcH);
  const drawW = Math.max(1, img.width * scale);   // unrotated width
  const drawH = Math.max(1, img.height * scale);  // unrotated height

  // Filters
  if (opts.brightness !== 100 || opts.contrast !== 100 || opts.saturation !== 100) {
    ctx.filter = `brightness(${opts.brightness}%) contrast(${opts.contrast}%) saturate(${opts.saturation}%)`;
  }
  if (opts.shadowEnabled) {
    ctx.shadowColor = `rgba(0,0,0,${(opts.shadowIntensity / 100) * 0.55})`;
    ctx.shadowBlur = Math.max(8, Math.min(tW, tH) * 0.035);
    ctx.shadowOffsetY = Math.max(4, Math.min(tW, tH) * 0.018);
  }
  ctx.save();
  ctx.translate(tW / 2, tH / 2);
  ctx.rotate((opts.rotation * Math.PI) / 180);
  ctx.scale(opts.flipH ? -1 : 1, opts.flipV ? -1 : 1);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
  ctx.filter = 'none';

  // Watermark
  const wm = opts.watermarkText.trim();
  if (wm) {
    const fs = Math.max(12, Math.round(tW * (opts.watermarkSize / 100)));
    ctx.font = `bold ${fs}px system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = 'middle';
    const m = Math.round(fs * 0.8);
    let x = tW - m, y = tH - m;
    ctx.textAlign = 'right';
    switch (opts.watermarkPos) {
      case 'bl': x = m; y = tH - m; ctx.textAlign = 'left'; break;
      case 'tr': x = tW - m; y = m; ctx.textAlign = 'right'; break;
      case 'tl': x = m; y = m; ctx.textAlign = 'left'; break;
      case 'c':  x = tW / 2; y = tH / 2; ctx.textAlign = 'center'; break;
    }
    ctx.globalAlpha = opts.watermarkOpacity / 100;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = Math.max(1, fs / 12);
    ctx.strokeText(wm, x, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(wm, x, y);
    ctx.globalAlpha = 1;
  }
}

/* Approx KB from base64 data URL — instant fallback until blob resolves */
const dataUrlToKB = (url: string): number => {
  const commaIdx = url.indexOf(',');
  const b64Len = url.length - commaIdx - 1;
  return Math.max(1, Math.round((b64Len * 3) / 4 / 1024));
};

/* NOTE: `Image` from lucide-react is imported as `ImageIcon`, and we use
   `window.Image` here so the browser's real HTMLImageElement constructor is
   always used (the old code was calling the lucide icon component). */
const loadImgFromUrl = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });

const formatSize = (kb: number): string => {
  if (!kb) return '0 KB';
  return kb > 1024 ? (kb / 1024).toFixed(2) + ' MB' : Math.round(kb) + ' KB';
};

/* ================================================================== */
/* Component                                                          */
/* ================================================================== */
export default function ImageResizer({ onNavigate }: ImageResizerProps) {
  const HOW_IT_WORKS_STEPS = [
    { num: 1, title: 'Upload Raw Photo', desc: 'Select your product image from phone or PC.' },
    { num: 2, title: 'Pick Marketplace Preset or Custom Size', desc: 'Choose Amazon 1000x1000px or dial in custom dimensions and background fill.' },
    { num: 3, title: 'Export in JPG, PNG, or WEBP', desc: 'Download your compliant, high-resolution catalog image in one click.' },
  ];
  const FEATURES = [
    { id: 'zoom',    icon: <Maximize className="w-5 h-5" />, title: 'Amazon Zoom Compliant', desc: 'Automatically hits the strict 1000px+ requirement so customers can zoom into your product details.' },
    { id: 'padding', icon: <Crop className="w-5 h-5" />,     title: 'Zero-Crop Smart Padding', desc: 'Turns awkward vertical phone photos into perfect 1:1 squares with pure #FFFFFF white fill.' },
    { id: 'privacy', icon: <ShieldCheck className="w-5 h-5" />, title: '100% Browser Privacy', desc: 'Unlike cloud tools that upload your files to external servers, your catalog photos never leave your device.' },
    { id: 'formats', icon: <Layers className="w-5 h-5" />,   title: 'Multi-Format Export', desc: 'Convert heavy files into ultra-fast WEBP, crisp PNGs, or marketplace-ready JPGs on the fly.' },
    { id: 'speed',   icon: <Zap className="w-5 h-5" />,      title: 'Lightning Fast Canvas Engine', desc: 'Powered by hardware-accelerated HTML5 Canvas—resize in milliseconds with zero queues.' },
    { id: 'free',    icon: <CheckCircle2 className="w-5 h-5" />, title: '100% Free Forever', desc: 'No watermarks, no daily limits, no sign-up walls, and zero annoying popup ads.' },
  ];

  /* ---------- SOURCE STATE (pure state, triggers re-renders) ---------- */
  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null);
  const [sourceDims, setSourceDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [sourceSizeKB, setSourceSizeKB] = useState<number>(0);
  const [sourceMime, setSourceMime] = useState<string>('image/jpeg');
  const [sourceFileName, setSourceFileName] = useState<string>('');

  /* ---------- OUTPUT STATE ---------- */
  const [renderedDataUrl, setRenderedDataUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [estimatedKB, setEstimatedKB] = useState<number>(0);
  const [isResizing, setIsResizing] = useState(false);

  /* ---------- DIMENSIONS ---------- */
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [activePreset, setActivePreset] = useState<string>('amazon');
  const [customDims, setCustomDims] = useState({ width: 1000, height: 1000 });
  const [lockAspect, setLockAspect] = useState(true);
  const [fitMode, setFitMode] = useState<'pad' | 'cover'>('pad');
  const [paddingPct, setPaddingPct] = useState(0);

  /* ---------- BACKGROUND / FORMAT ---------- */
  const [bgMode, setBgMode] = useState<'white' | 'transparent' | 'gray' | 'custom'>('white');
  const [customHex, setCustomHex] = useState('#FFFFFF');
  const [format, setFormat] = useState<'jpg' | 'png' | 'webp' | 'original'>('jpg');
  const [quality, setQuality] = useState(92);
  const [targetKB, setTargetKB] = useState<number>(0);

  /* ---------- ADJUSTMENTS ---------- */
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowIntensity, setShadowIntensity] = useState(50);

  /* ---------- WATERMARK ---------- */
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkPos, setWatermarkPos] = useState<'br' | 'bl' | 'tr' | 'tl' | 'c'>('br');
  const [watermarkOpacity, setWatermarkOpacity] = useState(60);
  const [watermarkSize, setWatermarkSize] = useState(4);

  /* ---------- UI ---------- */
  const [showOriginal, setShowOriginal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  /* ---------- BATCH ---------- */
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  /* ---------- REFS ---------- */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ================================================================ */
  /* DERIVED                                                          */
  /* ================================================================ */
  const targetDims = useMemo(() => {
    if (activeTab === 'custom') return customDims;
    const p = PRESETS.find((x) => x.id === activePreset);
    return p ? { width: p.width, height: p.height } : customDims;
  }, [activeTab, activePreset, customDims]);

  const bgColor = useMemo(() => {
    if (bgMode === 'white') return '#FFFFFF';
    if (bgMode === 'gray') return '#F4F4F5';
    if (bgMode === 'custom') return customHex;
    return 'transparent';
  }, [bgMode, customHex]);

  const formatOption = useMemo(() => FORMATS.find((f) => f.id === format)!, [format]);

  const activeMime = useMemo(() => {
    if (format !== 'original') return formatOption.mime;
    return ['image/png', 'image/jpeg', 'image/webp'].includes(sourceMime) ? sourceMime : 'image/png';
  }, [format, formatOption, sourceMime]);

  // JPEG cannot encode alpha
  const resolvedBgColor = useMemo(
    () => (format === 'jpg' && bgColor === 'transparent' ? '#FFFFFF' : bgColor),
    [format, bgColor],
  );

  const effectiveAspect = useMemo(() => {
    if (!sourceDims.width || !sourceDims.height) return null;
    const sideways = rotation === 90 || rotation === 270;
    return sideways ? sourceDims.height / sourceDims.width : sourceDims.width / sourceDims.height;
  }, [sourceDims, rotation]);

  const drawOpts: DrawOpts = useMemo(() => ({
    targetW: targetDims.width,
    targetH: targetDims.height,
    fitMode, paddingPct, bgColor: resolvedBgColor,
    brightness, contrast, saturation, rotation, flipH, flipV,
    shadowEnabled, shadowIntensity,
    watermarkText, watermarkPos, watermarkOpacity, watermarkSize,
  }), [targetDims, fitMode, paddingPct, resolvedBgColor, brightness, contrast,
       saturation, rotation, flipH, flipV, shadowEnabled, shadowIntensity,
       watermarkText, watermarkPos, watermarkOpacity, watermarkSize]);

  /* ================================================================ */
  /* EFFECTS                                                          */
  /* ================================================================ */

  // Sync custom dims with preset selection
  useEffect(() => {
    if (activeTab === 'presets') {
      const p = PRESETS.find((x) => x.id === activePreset);
      if (p) setCustomDims({ width: p.width, height: p.height });
    }
  }, [activeTab, activePreset]);

  // BULLETPROOF RENDER: always synchronous offscreen canvas → dataURL → state
  useEffect(() => {
    if (!sourceDataUrl) return;
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;
      setIsResizing(true);
      try {
        const img = await loadImgFromUrl(sourceDataUrl);
        if (cancelled) return;

        const canvas = document.createElement('canvas');
        drawToCanvas(canvas, img, drawOpts);

        const qArg = (activeMime === 'image/jpeg' || activeMime === 'image/webp')
          ? quality / 100 : undefined;

        // Initial dataURL (guaranteed to exist)
        let dataUrl = canvas.toDataURL(activeMime, qArg);
        let kb = dataUrlToKB(dataUrl);

        // Target KB compression via binary search on quality
        if (
          targetKB > 0 &&
          kb > targetKB &&
          (activeMime === 'image/jpeg' || activeMime === 'image/webp')
        ) {
          let lo = 5, hi = quality, bestUrl = dataUrl, bestKB = kb;
          for (let i = 0; i < 7; i++) {
            const mid = Math.round((lo + hi) / 2);
            const attemptUrl = canvas.toDataURL(activeMime, mid / 100);
            const attemptKB = dataUrlToKB(attemptUrl);
            if (attemptKB <= targetKB) { bestUrl = attemptUrl; bestKB = attemptKB; lo = mid + 1; }
            else hi = mid - 1;
          }
          dataUrl = bestUrl;
          kb = bestKB;
        }

        if (cancelled) return;
        setRenderedDataUrl(dataUrl);
        setEstimatedKB(kb);

        // Blob for download — resolves slightly after dataURL
        canvas.toBlob((blob) => {
          if (cancelled || !blob) return;
          setOutputBlob(blob);
          setEstimatedKB(Math.max(1, Math.round(blob.size / 1024)));
        }, activeMime, qArg);
      } catch (err) {
        console.error('Render error:', err);
      } finally {
        if (!cancelled) setIsResizing(false);
      }
    }, 60);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [sourceDataUrl, drawOpts, activeMime, quality, targetKB]);

  /* ================================================================ */
  /* HANDLERS                                                         */
  /* ================================================================ */

  // Shared loader for File objects (file input + drag & drop)
  const processFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        setSourceDims({
          width: img.naturalWidth || img.width || 800,
          height: img.naturalHeight || img.height || 800,
        });
        setSourceSizeKB(Math.max(1, Math.round(file.size / 1024)));
        setSourceMime(file.type || 'image/jpeg');
        setSourceFileName(file.name);
        setSourceDataUrl(dataUrl);
        setRenderedDataUrl(null);
        setOutputBlob(null);
        setEstimatedKB(0);
      };
      img.onerror = () => console.error('Image decode failed');
      img.src = dataUrl;
    };
    reader.onerror = () => console.error('FileReader failed');
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow same-file re-selection
    if (!file) return;
    processFile(file);
  };

  const loadSampleProduct = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 1000;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    // Bg gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 1000);
    grad.addColorStop(0, '#f0fdf4');
    grad.addColorStop(1, '#dcfce7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 1000);

    // Decor
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.beginPath(); ctx.arc(650, 150, 120, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(150, 850, 140, 0, Math.PI * 2); ctx.fill();

    // Bottle body (safe path — no roundRect)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(320, 280);
    ctx.lineTo(480, 280);
    ctx.lineTo(488, 750);
    ctx.quadraticCurveTo(488, 800, 440, 800);
    ctx.lineTo(360, 800);
    ctx.quadraticCurveTo(312, 800, 312, 750);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(4, 120, 87, 0.18)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cap
    ctx.fillStyle = '#10b981';
    ctx.fillRect(336, 220, 128, 60);
    ctx.fillStyle = '#059669';
    ctx.fillRect(332, 280, 136, 10);

    // Label
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(340, 450, 120, 200);
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AQUA', 400, 520);
    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.fillText('750ml', 400, 560);
    ctx.fillStyle = '#64748b';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText('STAINLESS', 400, 590);
    ctx.fillText('STEEL', 400, 615);

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillRect(356, 320, 10, 100);

    // Badge
    ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
    ctx.fillRect(120, 80, 210, 60);
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('★ BEST SELLER', 140, 110);

    const dataUrl = c.toDataURL('image/png');
    setSourceDims({ width: 800, height: 1000 });
    setSourceSizeKB(64);
    setSourceMime('image/png');
    setSourceFileName('sample-product.png');
    setSourceDataUrl(dataUrl);
    setRenderedDataUrl(null);
    setOutputBlob(null);
    setEstimatedKB(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const handleWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(1, Math.min(4096, Number(e.target.value) || 1));
    setCustomDims((p) => ({
      width: v,
      height: effectiveAspect != null && lockAspect ? Math.max(1, Math.round(v / effectiveAspect)) : p.height,
    }));
  }, [effectiveAspect, lockAspect]);
  const handleHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(1, Math.min(4096, Number(e.target.value) || 1));
    setCustomDims((p) => ({
      width: effectiveAspect != null && lockAspect ? Math.max(1, Math.round(v * effectiveAspect)) : p.width,
      height: v,
    }));
  }, [effectiveAspect, lockAspect]);
  const toggleLockAspect = useCallback(() => {
    setLockAspect((prev) => {
      const next = !prev;
      if (next && effectiveAspect != null) {
        setCustomDims((d) => ({ ...d, height: Math.max(1, Math.round(d.width / effectiveAspect)) }));
      }
      return next;
    });
  }, [effectiveAspect]);

  const getExt = useCallback((): string => {
    if (format !== 'original') return formatOption.ext;
    if (sourceMime === 'image/png') return 'png';
    if (sourceMime === 'image/webp') return 'webp';
    return 'jpg';
  }, [format, formatOption, sourceMime]);

  const handleDownload = useCallback(() => {
    const ext = getExt();
    const filename = `resized-${targetDims.width}x${targetDims.height}.${ext}`;

    if (outputBlob) {
      const url = URL.createObjectURL(outputBlob);
      const a = document.createElement('a');
      a.download = filename;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 200);
    } else if (renderedDataUrl) {
      // DataURL fallback — always works
      const a = document.createElement('a');
      a.download = filename;
      a.href = renderedDataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [outputBlob, renderedDataUrl, getExt, targetDims]);

  const handleReset = useCallback(() => {
    setSourceDataUrl(null);
    setSourceDims({ width: 0, height: 0 });
    setSourceSizeKB(0);
    setSourceMime('image/jpeg');
    setSourceFileName('');
    setRenderedDataUrl(null);
    setOutputBlob(null);
    setEstimatedKB(0);
    setIsResizing(false);
    setActiveTab('presets');
    setActivePreset('amazon');
    setCustomDims({ width: 1000, height: 1000 });
    setLockAspect(true);
    setFitMode('pad');
    setPaddingPct(0);
    setBgMode('white');
    setCustomHex('#FFFFFF');
    setFormat('jpg');
    setQuality(92);
    setTargetKB(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setShadowEnabled(false);
    setShadowIntensity(50);
    setWatermarkText('');
    setWatermarkPos('br');
    setWatermarkOpacity(60);
    setWatermarkSize(4);
    setShowOriginal(false);
  }, []);

  const openBatchExport = async () => {
    if (!sourceDataUrl) return;
    setShowBatchModal(true);
    setBatchLoading(true);
    setBatchResults((prev) => { prev.forEach((r) => URL.revokeObjectURL(r.url)); return []; });
    try {
      const img = await loadImgFromUrl(sourceDataUrl);
      const results: BatchResult[] = [];
      for (const preset of PRESETS) {
        const c = document.createElement('canvas');
        drawToCanvas(c, img, { ...drawOpts, targetW: preset.width, targetH: preset.height });
        const qArg = (activeMime === 'image/jpeg' || activeMime === 'image/webp') ? quality / 100 : undefined;
        const blob = await new Promise<Blob | null>((res) => c.toBlob(res, activeMime, qArg));
        if (blob) {
          results.push({
            presetId: preset.id, label: preset.label,
            url: URL.createObjectURL(blob), blob,
            sizeKB: Math.max(1, Math.round(blob.size / 1024)),
            width: preset.width, height: preset.height,
          });
        }
      }
      setBatchResults(results);
    } catch (err) {
      console.error('Batch export failed:', err);
    } finally {
      setBatchLoading(false);
    }
  };
  const closeBatchModal = () => {
    setBatchResults((prev) => { prev.forEach((r) => URL.revokeObjectURL(r.url)); return []; });
    setShowBatchModal(false);
  };
  const downloadBatchItem = (item: BatchResult) => {
    const ext = getExt();
    const a = document.createElement('a');
    a.download = `${item.presetId}-${item.width}x${item.height}.${ext}`;
    a.href = item.url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExploreListing = useCallback(() => {
    if (onNavigate) return onNavigate('listing-optimizer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onNavigate]);
  const handleCalcProfit = useCallback(() => {
    if (onNavigate) return onNavigate('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onNavigate]);

  /* ---------- COMPLIANCE ---------- */
  const complianceChecks = useMemo(() => ([
    { id: 'res',  label: 'Resolution ≥ 1000px', sub: 'Amazon Zoom Eligible',
      pass: Math.max(targetDims.width, targetDims.height) >= 1000 },
    { id: 'bg',   label: 'Pure White #FFFFFF Background', sub: 'Amazon Main Image Compliant',
      pass: resolvedBgColor.toUpperCase() === '#FFFFFF' },
    { id: 'size', label: 'File Weight < 500 KB', sub: estimatedKB > 0 ? `Current: ${estimatedKB} KB` : 'Processing…',
      pass: estimatedKB > 0 && estimatedKB < 500 },
  ]), [targetDims, resolvedBgColor, estimatedKB]);

  /* ================================================================ */
  /* RENDER                                                           */
  /* ================================================================ */
  const isPad = fitMode === 'pad';
  const targetRatio = targetDims.width / targetDims.height;
  const previewSrc = showOriginal ? sourceDataUrl : (renderedDataUrl || sourceDataUrl);
  const hasSource = !!sourceDataUrl;
  const canDownload = !!renderedDataUrl;

  return (
    <div className="space-y-10 max-w-6xl mx-auto w-full overflow-x-hidden select-none">
      {/* ALWAYS-MOUNTED hidden input — never unmounts */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* ============ PAGE HEADER ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Product Image Resizer
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Resize product photos for Amazon, Flipkart, Meesho &amp; Myntra — 100% client-side.
          </p>
        </div>
        {hasSource && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" /> Start Over
          </button>
        )}
      </div>

      {/* ============ SECTION 1: DROPZONE / STUDIO ============ */}
      {!hasSource ? (
        <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && fileInputRef.current) {
                e.preventDefault();
                fileInputRef.current.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Dropzone to upload product image"
            className={`border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all rounded-2xl p-6 sm:p-8 md:p-12 text-center cursor-pointer ${dragActive ? 'border-emerald-500 bg-emerald-500/10' : ''}`}
          >
            <div className="inline-block relative mb-4">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 blur opacity-30 animate-pulse" />
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center mx-auto bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg">
                <Upload className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 px-2">
              Upload Your Product Photo
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 max-w-xs mx-auto px-2">
              Drag &amp; drop your product image or click to select. Works on mobile &amp; desktop.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 px-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-base transition-all shadow-xl shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                <ImageIcon className="w-5 h-5" /> Select Product Image
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); loadSampleProduct(e); }}
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-base text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                Load Sample Product
              </button>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs px-2">
              <span className="px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 font-medium">Supports JPG, PNG, WEBP</span>
              <span className="px-2.5 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/60 dark:bg-zinc-900/10 text-zinc-600 dark:text-zinc-400 font-medium">100% Client-Side Privacy</span>
              <span className="px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 font-medium">Instant 1000x1000px Zoom Ready</span>
            </div>
          </div>
        </section>
      ) : (
        // ============ SECTION 1: STUDIO EDITOR ============
        <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-start">
            {/* ===== LEFT: STICKY PREVIEW + TOOLBAR + COMPLIANCE ===== */}
            <div className="lg:col-span-7 min-w-0 p-5 sm:p-8 lg:sticky lg:top-24 self-start border-b lg:border-b-0 lg:border-r border-zinc-200/50 dark:border-zinc-800/40">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Live Studio Preview</h2>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${showOriginal ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'}`}>
                  {showOriginal ? 'Original' : 'Resized'}
                </span>
              </div>

              {/* Source / Target stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Source</span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {sourceDims.width && sourceDims.height ? `${sourceDims.width} × ${sourceDims.height} px` : '—'}
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                    {sourceSizeKB ? formatSize(sourceSizeKB) : '—'}
                    {sourceFileName && ` • ${sourceFileName.length > 16 ? sourceFileName.slice(0, 13) + '…' : sourceFileName}`}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">Target</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
                    {targetDims.width} × {targetDims.height} px
                  </span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {targetDims.width}:{targetDims.height} ratio
                  </span>
                </div>
              </div>

              {/* Checkerboard preview — REAL <img>, always visible */}
              <div
                className="relative w-full rounded-xl overflow-hidden bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:16px_16px] dark:bg-[linear-gradient(45deg,#374151_25%,transparent_25%),linear-gradient(-45deg,#374151_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#4b5563_75%),linear-gradient(-45deg,transparent_75%,#4b5563_75%)] dark:bg-[length:16px_16px] ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 flex items-center justify-center p-2 sm:p-3"
                style={{ aspectRatio: targetRatio, maxHeight: 440 }}
              >
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt={showOriginal ? 'Original' : 'Resized preview'}
                    className="max-w-full max-h-[380px] sm:max-h-[420px] w-auto h-auto object-contain rounded-lg shadow-sm select-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700 border-t-emerald-500 animate-spin" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Rendering…</span>
                  </div>
                )}
                {isResizing && previewSrc && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                    <div className="w-3 h-3 rounded-full border border-white/40 border-t-white animate-spin" />
                    <span className="text-[10px] text-white font-medium">Rendering…</span>
                  </div>
                )}
              </div>

              {/* QUICK TOOLBAR */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Rotate
                </button>
                <button
                  onClick={() => setFlipH((v) => !v)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${flipH ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" /> Flip H
                </button>
                <button
                  onClick={() => setShowOriginal((v) => !v)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${showOriginal ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> {showOriginal ? 'Resized' : 'Original'}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" /> Change
                </button>
              </div>

              {/* PADDING / AMAZON RULE */}
              <div className="mt-4 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Safe-Zone Padding</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{paddingPct}%</span>
                </div>
                <input
                  type="range" min={0} max={25} step={0.5} value={paddingPct}
                  onChange={(e) => setPaddingPct(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                />
                <button
                  onClick={() => setPaddingPct(paddingPct === 7.5 ? 0 : 7.5)}
                  className={`mt-2 w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${paddingPct === 7.5 ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                >
                  <Target className="w-3 h-3" />
                  {paddingPct === 7.5 ? '✓ Amazon 85% Frame Active' : 'Apply Amazon 85% Frame Rule'}
                </button>
              </div>

              {/* COMPLIANCE CHECKLIST */}
              <div className="mt-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-3.5">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">Marketplace Compliance</span>
                </div>
                <div className="space-y-2">
                  {complianceChecks.map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${c.pass ? 'bg-emerald-500 text-white' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                        {c.pass ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-[11px] font-semibold leading-tight ${c.pass ? 'text-zinc-800 dark:text-zinc-200' : 'text-amber-700 dark:text-amber-400'}`}>{c.label}</div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-500">{c.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== RIGHT: CONTROLS ===== */}
            <div className="lg:col-span-5 min-w-0 p-5 sm:p-8 flex flex-col">
              <div className="space-y-5">
                {/* Mode Tabs */}
                <div>
                  <div className="flex gap-1 mb-4">
                    {(['presets', 'custom'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                      >
                        {tab === 'presets' ? 'Presets' : 'Custom'}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'presets' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESETS.map((p) => {
                        const active = activePreset === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => { setActiveTab('presets'); setActivePreset(p.id); }}
                            className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border transition-all ${active ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400/50 shadow-sm' : 'bg-zinc-50/40 dark:bg-zinc-800/30 border-zinc-200/60 dark:border-zinc-800/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10'}`}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-200/40 dark:border-zinc-700/40 text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                              {p.ratio}
                            </div>
                            <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 text-center leading-tight line-clamp-2">{p.label}</span>
                            <span className="text-[9px] text-zinc-500 dark:text-zinc-400">{p.width}×{p.height}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Width (px)</label>
                        <input
                          type="number" min={1} max={4096} value={customDims.width}
                          onChange={handleWidthChange}
                          className="w-full px-3 py-2 rounded-lg text-sm border border-zinc-200/80 dark:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="flex flex-col items-center gap-1 pt-4">
                        <button
                          onClick={toggleLockAspect}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${lockAspect ? 'bg-emerald-500 text-white shadow-emerald-500/40' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                          aria-label={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                        >
                          {lockAspect ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Height (px)</label>
                        <input
                          type="number" min={1} max={4096} value={customDims.height}
                          onChange={handleHeightChange}
                          className="w-full px-3 py-2 rounded-lg text-sm border border-zinc-200/80 dark:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Fit / Background */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block">Fit Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setFitMode('pad')}
                        className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all ${isPad ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400/50' : 'bg-zinc-50/40 dark:bg-zinc-800/30 border-zinc-200/60 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>
                        <Maximize className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Pad to Fit</span>
                      </button>
                      <button onClick={() => setFitMode('cover')}
                        className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border transition-all ${!isPad ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400/50' : 'bg-zinc-50/40 dark:bg-zinc-800/30 border-zinc-200/60 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>
                        <Crop className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Cover</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block">Background Fill</label>
                    <div className="space-y-1.5">
                      {BACKGROUNDS.map((b) => {
                        const active = bgMode === b.id;
                        const swatch = b.id === 'custom' ? customHex : b.id === 'white' ? '#FFFFFF' : b.id === 'gray' ? '#F4F4F5' : 'transparent';
                        return (
                          <div
                            key={b.id}
                            onClick={() => setBgMode(b.id)}
                            role="button" tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setBgMode(b.id); } }}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all cursor-pointer ${active ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 ring-1 ring-emerald-400' : 'border-transparent bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
                          >
                            <span
                              className="w-5 h-5 rounded flex-shrink-0 border border-zinc-200/60 dark:border-zinc-700/60"
                              style={{
                                backgroundColor: swatch === 'transparent' ? undefined : swatch,
                                backgroundImage: swatch === 'transparent'
                                  ? 'repeating-linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),repeating-linear-gradient(135deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%)'
                                  : undefined,
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{b.label}</div>
                              {b.note && <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{b.note}</div>}
                            </div>
                            {b.id === 'custom' && (
                              <input type="color" value={customHex} onClick={(e) => e.stopPropagation()} onChange={(e) => setCustomHex(e.target.value)} className="w-7 h-7 rounded border-none p-0 cursor-pointer" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* PRO TOOLS */}
                <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
                  <button
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      <Sparkles className="w-4 h-4 text-emerald-500" /> Pro Tools
                    </span>
                    <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                  </button>
                  {showAdvanced && (
                    <div className="p-3.5 space-y-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
                      {/* Adjustments */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sliders className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">Adjustments</span>
                        </div>
                        <div className="space-y-2.5">
                          {[
                            { icon: <Sun className="w-3.5 h-3.5" />, label: 'Brightness', value: brightness, set: setBrightness, min: 50, max: 150 },
                            { icon: <ContrastIcon className="w-3.5 h-3.5" />, label: 'Contrast', value: contrast, set: setContrast, min: 50, max: 150 },
                            { icon: <Droplet className="w-3.5 h-3.5" />, label: 'Saturation', value: saturation, set: setSaturation, min: 0, max: 200 },
                          ].map(({ icon, label, value, set, min, max }) => (
                            <div key={label}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">{icon}{label}</span>
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{value}%</span>
                              </div>
                              <input type="range" min={min} max={max} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Orientation */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <RotateCw className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">Orientation</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={() => setRotation((r) => (r + 90) % 360)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700">
                            <RotateCw className="w-3 h-3" /> {rotation}°
                          </button>
                          <button onClick={() => setFlipH((v) => !v)} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium ${flipH ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                            <FlipHorizontal className="w-3 h-3" /> Flip H
                          </button>
                          <button onClick={() => setFlipV((v) => !v)} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium ${flipV ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                            <FlipVertical className="w-3 h-3" /> Flip V
                          </button>
                        </div>
                      </div>
                      {/* Layout: shadow */}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                            <Move className="w-3 h-3" /> Product Shadow
                          </span>
                          <button onClick={() => setShadowEnabled((v) => !v)} className={`relative w-9 h-5 rounded-full transition-colors ${shadowEnabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                            <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: shadowEnabled ? 18 : 2 }} />
                          </button>
                        </div>
                        {shadowEnabled && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Intensity</span>
                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{shadowIntensity}%</span>
                            </div>
                            <input type="range" min={10} max={100} value={shadowIntensity} onChange={(e) => setShadowIntensity(Number(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
                          </div>
                        )}
                      </div>
                      {/* Watermark */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Type className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wide">Watermark</span>
                        </div>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="e.g. © YourBrand"
                          maxLength={40}
                          className="w-full px-2.5 py-1.5 mb-2 rounded-lg text-xs border border-zinc-200/80 dark:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                        {watermarkText && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {(['br', 'bl', 'tr', 'tl', 'c'] as const).map((pos) => (
                                <button key={pos} onClick={() => setWatermarkPos(pos)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${watermarkPos === pos ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                                  {pos}
                                </button>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="block text-[10px] text-zinc-500 mb-0.5">Opacity {watermarkOpacity}%</span>
                                <input type="range" min={10} max={100} value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(Number(e.target.value))} className="w-full accent-emerald-500 h-1 bg-zinc-200 dark:bg-zinc-700 rounded appearance-none" />
                              </div>
                              <div>
                                <span className="block text-[10px] text-zinc-500 mb-0.5">Size {watermarkSize}%</span>
                                <input type="range" min={2} max={15} value={watermarkSize} onChange={(e) => setWatermarkSize(Number(e.target.value))} className="w-full accent-emerald-500 h-1 bg-zinc-200 dark:bg-zinc-700 rounded appearance-none" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Format & Quality */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 block">Save Image As</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {FORMATS.map((f) => {
                        const active = format === f.id;
                        return (
                          <label key={f.id}
                            className={`flex items-center justify-center gap-1 px-1.5 py-2 rounded-lg border cursor-pointer transition-all text-[11px] ${active ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-700 dark:text-emerald-400 font-semibold' : 'border-transparent bg-zinc-50 dark:bg-zinc-800/30 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-medium'}`}>
                            <input type="radio" name="fmt" value={f.id} checked={active} onChange={() => setFormat(f.id)} className="accent-emerald-500" />
                            {f.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Quality</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">{quality}%</span>
                    </div>
                    <input type="range" min={10} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-emerald-500 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/30">
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">Target KB</span>
                    </div>
                    <input type="number" min={0} max={5000} value={targetKB || ''} onChange={(e) => setTargetKB(Math.max(0, Math.min(5000, Number(e.target.value) || 0)))} placeholder="Auto"
                      className="w-16 px-1.5 py-0.5 rounded text-xs text-right border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-800/30">
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Output size</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{estimatedKB || '—'}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">KB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 space-y-2">
                <button
                  onClick={handleDownload}
                  disabled={!canDownload}
                  className={`w-full py-3.5 rounded-xl font-bold text-base text-white transition-all flex items-center justify-center gap-2 ${!canDownload ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5'}`}
                >
                  <Download className="w-5 h-5" /> Download Resized Image →
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={openBatchExport}
                    disabled={!renderedDataUrl || isResizing}
                    className="py-2.5 rounded-xl font-semibold text-xs text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5" /> Export All Sizes
                  </button>
                  <button
                    onClick={handleReset}
                    className="py-2.5 rounded-xl font-semibold text-xs text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============ BATCH MODAL ============ */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeBatchModal}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-500" /> Batch Export
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">One product photo → every marketplace.</p>
              </div>
              <button onClick={closeBatchModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {batchLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-emerald-500 animate-spin" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Rendering every size…</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {batchResults.map((r) => (
                    <div key={r.presetId} className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-800/20 p-3">
                      <div className="relative w-full rounded-lg overflow-hidden mb-3 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:12px_12px] dark:bg-[linear-gradient(45deg,#374151_25%,transparent_25%),linear-gradient(-45deg,#374151_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#4b5563_75%),linear-gradient(-45deg,transparent_75%,#4b5563_75%)] dark:bg-[length:12px_12px]" style={{ aspectRatio: r.width / r.height }}>
                        <img src={r.url} alt={r.label} className="absolute inset-0 w-full h-full object-contain" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{r.label}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{r.width}×{r.height}px • {r.sizeKB} KB</p>
                        </div>
                        <button onClick={() => downloadBatchItem(r)} className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold">
                          <Download className="w-3 h-3" /> Get
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ SECTION 3: HOW IT WORKS ============ */}
      <section className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm p-6 md:p-10">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">How to Resize Product Photos</h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">Turn any phone photo into a marketplace-compliant catalog image in three steps.</p>
        </div>
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2">
              {[
                { label: 'Raw Photo', sub: 'Off-center phone shot', icon: <ImageIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />, bg: 'from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900' },
                { label: 'Smart Fit', sub: 'Bounding-box analysis', icon: <ImageIcon className="w-10 h-10 text-zinc-400 dark:text-zinc-600" />, bg: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20' },
                { label: 'Compliant', sub: 'Marketplace ready', icon: <ImageIcon className="w-11 h-11 text-zinc-400 dark:text-zinc-600" />, bg: 'from-white to-white dark:from-zinc-800 dark:to-zinc-900' },
              ].map((item, i) => (
                <div key={i} className="flex-1 min-w-0">
                  <div className={`relative h-24 sm:h-32 w-full rounded-xl border-2 border-dashed ${i === 2 ? 'border-emerald-500 bg-white dark:bg-zinc-900' : 'border-zinc-400/60 dark:border-zinc-600/60 bg-white dark:bg-zinc-800'} flex items-center justify-center`}>
                    <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br ${item.bg} border border-zinc-200/30 flex items-center justify-center p-2 shadow-sm`}>{item.icon}</div>
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{item.label}</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-zinc-500 dark:text-zinc-400 text-center mt-2 truncate">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-4 w-full">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.num} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">{step.num}</div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECTION 4: FEATURES ============ */}
      <section className="py-8 sm:py-12">
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">Why Sellers Trust SellerMath Resizer</h2>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">Built for Indian e-commerce catalogs — from the first pixel to the final download.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((f) => (
            <div key={f.id} className="rounded-2xl p-5 sm:p-7 border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow duration-300 group">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/40 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">{f.icon}</div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{f.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SECTION 5: CROSS-SELL ============ */}
      <section className="py-8 sm:py-12">
        <div className="rounded-2xl p-6 sm:p-8 md:p-12 relative overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-br from-emerald-500 via-emerald-400 to-indigo-500 shadow-xl">
          <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-emerald-400/30 to-indigo-400/30 rounded-[2.5rem] blur-[60px]" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" /> New in AI Studio
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Meet SellerMath AI Studio</h2>
              <p className="text-zinc-100 text-sm leading-relaxed max-w-md">
                Once your product photo is resized, generate SEO-rich Amazon &amp; Flipkart listings and calculate exact net margins after RTO and GST — all inside SellerMath.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button onClick={handleExploreListing} className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 transition-all">
                  Explore AI Listing Optimizer
                </button>
                <button onClick={handleCalcProfit} className="w-full sm:w-auto px-6 py-3 border border-white/30 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-all">
                  Calculate Product Profit
                </button>
              </div>
            </div>
            <div className="flex justify-center min-w-0">
              <div className="w-full max-w-sm relative">
                <div className="rounded-2xl p-5 border border-zinc-200/60 bg-white shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-zinc-200" />
                      <div className="w-2 h-2 rounded-full bg-zinc-200" />
                      <div className="w-2 h-2 rounded-full bg-zinc-200" />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">AI Listing</span>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 mb-3 leading-tight">Stainless Steel Water Bottle 750ml – Leak Proof Gym Bottle for Travel &amp; Office</h3>
                  <div className="flex flex-wrap gap-2 mb-5">
                    {['Amazon SEO', 'Kitchen Essentials', 'Travel Bottle', 'Prime Eligible'].map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-200/50 text-zinc-600 text-[10px] font-medium uppercase tracking-tight">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-600">+38% Net Margin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}