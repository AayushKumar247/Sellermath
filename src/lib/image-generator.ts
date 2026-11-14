export type AspectRatioType = "square" | "portrait" | "banner";

const DIMENSIONS: Record<AspectRatioType, { reqW: number; reqH: number; outW: number; outH: number }> = {
  square:   { reqW: 1024, reqH: 1120, outW: 2000, outH: 2000 }, // Extra bottom height to crop out logo
  portrait: { reqW: 832,  reqH: 1120, outW: 1600, outH: 2000 },
  banner:   { reqW: 1280, reqH: 800,  outW: 1920, outH: 1080 },
};

/**
 * Enhances user prompt ONLY with lighting and surface quality tokens
 * (Never include camera brands or "lens" words so the AI doesn't draw a literal camera lens!)
 */
export function buildStudioPrompt(rawPrompt: string, enhancers: string[] = []): string {
  const cleanEnhancers = enhancers.filter(Boolean);
  const qualityTokens = [
    ...cleanEnhancers,
    "exact product subject only",
    "clean studio lighting",
    "natural contact shadow",
    "ultra-sharp focus",
    "high-resolution commercial product photo",
  ].join(", ");

  return `${rawPrompt.trim()}, ${qualityTokens}`;
}

/**
 * Generates a high-res, watermark-free PNG Data URL and strictly follows the user prompt
 */
export async function generateCleanProductImage(
  userPrompt: string,
  aspectRatio: AspectRatioType = "square",
  activeEnhancers: string[] = []
): Promise<string> {
  const { reqW, reqH, outW, outH } = DIMENSIONS[aspectRatio] || DIMENSIONS.square;
  const fullPrompt = buildStudioPrompt(userPrompt, activeEnhancers);
  const seed = Math.floor(Math.random() * 1_000_000);

  // IMPORTANT: enhance=false ensures Pollinations follows the exact user prompt without rewriting it!
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    fullPrompt
  )}?width=${reqW}&height=${reqH}&model=flux&nologo=true&enhance=false&seed=${seed}`;

  const response = await fetch(pollinationsUrl);
  if (!response.ok) {
    throw new Error(`Image generation failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Canvas context failed"));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Dynamically slice off the bottom 8% of the actual loaded image where the Pollinations logo sits
        const srcW = img.naturalWidth;
        const safeSrcH = Math.floor(img.naturalHeight * 0.92);

        // Calculate clean aspect-ratio crop from the safe top area
        const targetRatio = outW / outH;
        const safeRatio = srcW / safeSrcH;

        let cropW = srcW;
        let cropH = safeSrcH;
        let offsetX = 0;
        let offsetY = 0;

        if (safeRatio > targetRatio) {
          cropW = Math.floor(safeSrcH * targetRatio);
          offsetX = Math.floor((srcW - cropW) / 2);
        } else {
          cropH = Math.floor(srcW / targetRatio);
          offsetY = Math.floor((safeSrcH - cropH) / 2); // Centers subject while completely excluding bottom watermark strip
        }

        ctx.drawImage(img, offsetX, offsetY, cropW, cropH, 0, 0, outW, outH);

        const base64Png = canvas.toDataURL("image/png", 1.0);
        URL.revokeObjectURL(objectUrl);
        resolve(base64Png);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to decode generated image"));
    };

    img.src = objectUrl;
  });
}
