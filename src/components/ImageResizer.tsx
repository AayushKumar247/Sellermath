import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ImagePlus,
  ImageMinus,
  Maximize,
  Download,
  ArrowLeftRight,
  MoveVertical,
  RotateCcw,
} from 'lucide-react';

interface ImageDimension {
  width: number;
  height: number;
}

interface ResizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  description: string;
}

const PRESETS: ResizePreset[] = [
  {
    id: 'square',
    label: 'Amazon / Flipkart (1:1 Square)',
    width: 1500,
    height: 1500,
    description: 'Optimized for Zoom',
  },
  {
    id: 'vertical',
    label: 'Myntra / Ajio (3:4 Vertical)',
    width: 1080,
    height: 1440,
    description: 'Apparel & fashion listings',
  },
];

export default function ImageResizer() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resizedUrl, setResizedUrl] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('square');
  const [customDimensions, setCustomDimensions] = useState<ImageDimension>({
    width: 1500,
    height: 1500,
  });
  const [isResizing, setIsResizing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'jpeg' | 'png'>('jpeg');

  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const targetDimensions = useMemo(() => {
    if (activePreset === 'custom') {
      return customDimensions;
    }
    const preset = PRESETS.find((p) => p.id === activePreset);
    return preset
      ? { width: preset.width, height: preset.height }
      : customDimensions;
  }, [activePreset, customDimensions]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setResizedUrl(null);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  // Resize the image on canvas whenever source or target dims change
  useEffect(() => {
    if (!imageFile || !imageUrl) return;

    setIsResizing(true);

    const img = new Image();
    img.onload = () => {
      originalImgRef.current = img;

      const canvas = document.createElement('canvas');
      const { width: targetW, height: targetH } = targetDimensions;
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsResizing(false);
        return;
      }

      // White letterbox background so aspect ratio is preserved
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);

      // Fit image inside target while keeping aspect ratio
      const scale = Math.min(targetW / img.width, targetH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const x = (targetW - drawW) / 2;
      const y = (targetH - drawH) / 2;

      ctx.drawImage(img, x, y, drawW, drawH);

      const mime = downloadFormat === 'png' ? 'image/png' : 'image/jpeg';
      const quality = downloadFormat === 'png' ? undefined : 0.95;
      const dataUrl = canvas.toDataURL(mime, quality);
      setResizedUrl(dataUrl);
      setIsResizing(false);
    };

    img.onerror = () => {
      setIsResizing(false);
    };

    img.src = imageUrl;
  }, [imageFile, imageUrl, targetDimensions, downloadFormat]);

  const handleDownload = useCallback(() => {
    if (!resizedUrl) return;
    const link = document.createElement('a');
    const ext = downloadFormat === 'png' ? 'png' : 'jpg';
    link.download = `resized-product-${targetDimensions.width}x${targetDimensions.height}.${ext}`;
    link.href = resizedUrl;
    link.click();
  }, [resizedUrl, downloadFormat, targetDimensions]);

  const handleReset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (resizedUrl) URL.revokeObjectURL(resizedUrl);
    setImageFile(null);
    setImageUrl(null);
    setResizedUrl(null);
    setActivePreset('square');
    setCustomDimensions({ width: 1500, height: 1500 });
  };

  const glassPanel =
    'relative rounded-2xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl dark:shadow-black/80';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-zinc-50 text-zinc-900 tracking-tight select-none">
            Product Image Resizer
          </h1>
          <p className="text-sm dark:text-zinc-400 text-zinc-600 mt-1 select-none">
            Resize product photos for Indian marketplaces — 100% client-side, no upload to server.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors select-none focus:outline-none focus:ring-0"
        >
          <RotateCcw className="w-3 h-3" /> Start Over
        </button>
      </div>

      {!imageFile ? (
        // === Upload state ===
        <>
          <div className={glassPanel}>
            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInput.current?.click()}
              className={`relative rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all border-2 ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10'
                  : 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-900/40'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInput.current?.click()}
            >
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 transition-colors">
                <ImagePlus className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold dark:text-zinc-100 text-zinc-900 mb-2 select-none">
                {dragActive ? 'Drop your image here' : 'Upload Product Image'}
              </h3>
              <p className="text-sm dark:text-zinc-400 text-zinc-600 mb-6 max-w-md mx-auto leading-relaxed select-none">
                {dragActive
                  ? 'Release to upload'
                  : 'Drag & drop a product photo, or click to browse. Supports JPG, PNG, WebP.'}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                <span className="flex items-center gap-1">
                  <ImageMinus className="w-3 h-3" /> 100% Client-Side
                </span>
                <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-700" />
                <span>No server upload</span>
              </div>
            </div>
            {/* Resizing Controls */}
            <div className="mt-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4 select-none">
                Resize To
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {PRESETS.map((preset) => {
                  const isActive = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setActivePreset(preset.id);
                        setCustomDimensions({ width: preset.width, height: preset.height });
                      }}
                      className={`group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm shadow-emerald-500/20'
                          : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-1 ${
                        isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'
                      }">
                        <Maximize className="w-5 h-5" />
                      </div>
                      <span className={`text-sm font-semibold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {preset.label.split(' (')[0]}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-500">
                        {preset.width} × {preset.height}px
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        {preset.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom dimensions */}
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-800/60 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Custom Dimensions</span>
                  <button
                    onClick={() => setActivePreset('custom')}
                    className={`text-xs font-medium px-2 py-1 rounded transition-colors select-none focus:outline-none focus:ring-0 ${
                      activePreset === 'custom'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    Use custom size
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4096"
                      value={customDimensions.width}
                      onChange={(e) =>
                        setCustomDimensions({ ...customDimensions, width: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm border border-zinc-200/80 dark:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4096"
                      value={customDimensions.height}
                      onChange={(e) =>
                        setCustomDimensions({ ...customDimensions, height: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-full px-3 py-2 rounded-lg text-sm border border-zinc-200/80 dark:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (

        // === Preview state ===
        <>
          <div className={glassPanel}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold dark:text-zinc-50 text-zinc-900 select-none">Preview</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 select-none">
                  Original → Resized {targetDimensions.width}×{targetDimensions.height}px
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Format</label>
                <div className="flex gap-1">
                  {['jpeg', 'png'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setDownloadFormat(fmt)}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors select-none focus:outline-none focus:ring-0 ${
                        downloadFormat === fmt
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Original */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Original</span>
                </div>
                <div
                  className="aspect-square rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden relative flex items-center justify-center"
                >
                  <img src={imageUrl || undefined} alt="Original" className="max-w-full max-h-full object-contain" />
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                    {imageFile?.size > 1024 * 1024
                      ? ((imageFile.size / (1024 * 1024)).toFixed(2) + ' MB')
                      : (imageFile.size / 1024).toFixed(1) + ' KB'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <ArrowLeftRight className="w-6 h-6 text-zinc-400 dark:text-zinc-500 hidden sm:block" />
                <MoveVertical className="w-6 h-6 text-zinc-400 dark:text-zinc-500 lg:hidden" />
              </div>

              {/* Resized */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Resized</span>
                </div>
                <div
                  className={`aspect-square rounded-xl border-2 border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden relative flex items-center justify-center ${
                    isResizing ? 'animate-pulse' : ''
                  }`}
                >
                  {isResizing ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-emerald-500 animate-spin" />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Resizing…</span>
                    </div>
                  ) : (
                    <img src={resizedUrl || undefined} alt="Resized" className="max-w-full max-h-full object-contain" />
                  )}
                  <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded">
                    {targetDimensions.width} × {targetDimensions.height}px
                  </span>
                </div>
              </div>
            </div>

            {/* Download */}
            <div className="mt-8">
              <button
                onClick={handleDownload}
                disabled={!resizedUrl || isResizing}
                className={`w-full py-4.5 rounded-xl font-bold text-lg transition-all shadow-lg select-none focus:outline-none focus:ring-0 ${
                  !resizedUrl || isResizing
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30 transform hover:-translate-y-0.5'
                }`}
              >
                <Download className="w-5 h-5 mr-2" />
                {isResizing ? 'Preparing Download…' : 'Download Resized Image'}
              </button>
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-3 text-center">
                High-quality {downloadFormat.toUpperCase()} download. Works offline on mobile & desktop.
              </p>
            </div>
          </div>

          {/* Back to upload */}
          <div className="text-center">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 select-none focus:outline-none focus:ring-0"
            >
              <ImageMinus className="w-4 h-4" /> Upload a different image
            </button>
          </div>
        </>
      )}
    </div>
  );
}

