import type { ChatImageAttachment } from '../engine/couponAnalyzer';

export interface PreparedChatImage extends ChatImageAttachment {
  id: string;
  previewUrl: string;
  sizeKb: number;
}

const MAX_DIMENSION_PX = 1600;
const JPEG_QUALITY = 0.86;
const MAX_INPUT_FILE_BYTES = 12 * 1024 * 1024; // 12MB raw before resize

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read image file'));
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unsupported or corrupted image file'));
    img.src = src;
  });
}

/**
 * Prepares a user-selected/pasted/dropped screenshot (e.g. from Misli or any betting site)
 * for multimodal Gemini analysis: validates type/size and scales down oversized captures
 * cleanly while preserving sharp legibility of small decimal odds.
 */
export async function prepareScreenshotAttachment(file: File): Promise<PreparedChatImage> {
  const mime = file.type.toLowerCase();
  if (mime !== 'image/png' && mime !== 'image/jpeg' && mime !== 'image/webp') {
    throw new Error('UNSUPPORTED_IMAGE_TYPE');
  }
  if (file.size > MAX_INPUT_FILE_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }

  const rawDataUrl = await readFileAsDataUrl(file);
  const img = await loadImageElement(rawDataUrl);

  const needsResize = img.width > MAX_DIMENSION_PX || img.height > MAX_DIMENSION_PX || file.size > 1_200_000;

  let finalDataUrl = rawDataUrl;
  let finalMime: ChatImageAttachment['mimeType'] = mime;

  if (needsResize) {
    const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      finalMime = 'image/jpeg';
      finalDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    }
  }

  const base64Data = finalDataUrl.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').trim();
  const sizeKb = Math.max(1, Math.round((base64Data.length * 3) / 4 / 1024));

  return {
    id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    mimeType: finalMime,
    data: base64Data,
    fileName: file.name || 'screenshot.png',
    previewUrl: finalDataUrl,
    sizeKb,
  };
}
