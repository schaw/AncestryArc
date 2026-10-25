import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Uploads a base64 / data_url image to Firebase Storage if available.
 * If Storage is not enabled or offline, safely returns the compressed data_url directly.
 */
export async function uploadFamilyPhoto(personId, photoType, dataUrl) {
  if (!storage || !dataUrl) {
    return dataUrl;
  }

  // If already an HTTP/HTTPS URL (e.g. ImgBB / Cloudinary), don't re-upload
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  try {
    const filename = `${personId || 'temp'}_${photoType}_${Date.now()}.webp`;
    const photoRef = ref(storage, `family_photos/${filename}`);
    await uploadString(photoRef, dataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(photoRef);
    return downloadUrl;
  } catch (error) {
    console.warn("Firebase Storage upload fallback (using compressed data URL):", error?.message || error);
    return dataUrl;
  }
}
