import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads to ImgBB if an API key is provided
 * 100% free, lifetime hosting, no credit card required
 */
export async function uploadToImgBB(dataUrl) {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY || localStorage.getItem('imgbb_api_key');
  if (!apiKey || !dataUrl) return null;

  try {
    const base64Clean = dataUrl.replace(/^data:.+;base64,/, '');
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', base64Clean);

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    const json = await res.json();
    if (json.success && json.data?.url) {
      return json.data.url;
    }
  } catch (err) {
    console.warn("ImgBB upload failed, falling back:", err);
  }
  return null;
}

/**
 * Uploads a family photo using the best available free tier:
 * 1. If ImgBB API key is configured -> uploads to ImgBB CDN (free lifetime)
 * 2. If Firebase Storage is enabled -> uploads to Firebase Storage
 * 3. Default -> returns the client-side compressed WebP (stored directly in Firestore for free, no billing account needed)
 */
export async function uploadFamilyPhoto(personId, photoType, dataUrl) {
  if (!dataUrl) return dataUrl;

  // If already an HTTP/HTTPS URL, don't re-upload
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  // 1. Try ImgBB if key exists
  const imgbbUrl = await uploadToImgBB(dataUrl);
  if (imgbbUrl) return imgbbUrl;

  // 2. Try Firebase Storage if initialized
  if (storage) {
    try {
      const filename = `${personId || 'temp'}_${photoType}_${Date.now()}.webp`;
      const photoRef = ref(storage, `family_photos/${filename}`);
      await uploadString(photoRef, dataUrl, 'data_url');
      const downloadUrl = await getDownloadURL(photoRef);
      return downloadUrl;
    } catch (error) {
      // Storage requires billing (Blaze) or is blocked -> safely fall back to Firestore compressed storage
      console.info("Using built-in Firestore compressed photo storage (no billing account required).");
    }
  }

  // 3. Fallback: return lightweight compressed WebP directly (saved inside Firestore document)
  return dataUrl;
}

