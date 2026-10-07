import { t } from '../i18n';

const MAX_DIMENSION = 1600;
const SMALL_FILE_BYTES = 400_000;

export function isSafeImageUrl(url) {
  if (typeof url !== 'string') return false;
  return (
    /^https?:\/\/\S+$/i.test(url) ||
    /^data:image\/(png|jpe?g|gif|webp|avif|bmp|svg\+xml);base64,[a-z0-9+/=]+$/i.test(url)
  );
}

/**
 * Reads an image file into a base64 data URL. Large photos are downscaled so
 * they fit comfortably inside localStorage and shared links.
 */
export function readImageFile(file, maxDimension = MAX_DIMENSION) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error(t('imageErrors.chooseImage')));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(t('imageErrors.cantRead')));
    reader.onload = () => {
      const dataUrl = reader.result;
      // Animated GIFs and vector SVGs would be ruined by rasterizing.
      if (/image\/(gif|svg\+xml)/.test(file.type)) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error(t('imageErrors.cantDecode')));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        if (scale === 1 && file.size < SMALL_FILE_BYTES) {
          resolve(dataUrl);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        // WebP keeps transparency; browsers without WebP encoding fall back to PNG.
        resolve(canvas.toDataURL('image/webp', 0.85));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(t('imageErrors.cantLoadLink')));
    img.src = url;
  });
}
