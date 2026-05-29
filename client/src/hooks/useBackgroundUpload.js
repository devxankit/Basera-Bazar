import { useRef, useCallback } from 'react';
import api from '../services/api';

/**
 * 🚀 useBackgroundUpload — Instant Background Image Upload Hook
 * ─────────────────────────────────────────────────────────────
 * Purpose:
 *   Start compressing and uploading the moment the user picks a file.
 *   By the time they finish filling the form, images are already on Cloudinary.
 *   On form submit, just await the stored promise — it's usually already resolved.
 *
 * Usage:
 *   const { queueUpload, awaitUpload, cancelUpload, cancelAll } = useBackgroundUpload();
 *
 *   // On file select:
 *   queueUpload(field, file);
 *
 *   // On submit:
 *   const url = await awaitUpload(field); // instantly resolves if already done
 *
 *   // On file remove:
 *   cancelUpload(field); // deletes from Cloudinary if already uploaded
 */
export function useBackgroundUpload() {
  /**
   * uploadMap stores per-field state:
   * {
   *   [field]: {
   *     promise: Promise<string | null>,  // resolves to Cloudinary URL
   *     controller: AbortController | null,
   *     status: 'uploading' | 'done' | 'cancelled',
   *     url: string | null,              // populated after upload completes
   *   }
   * }
   */
  const uploadMap = useRef({});

  /**
   * Compress a file using the Canvas API for fast, lightweight optimization.
   */
  const compressFile = useCallback((file) => {
    // Skip non-image files (e.g. PDF for GST cert)
    if (!file || !file.type || !file.type.startsWith('image/')) return Promise.resolve(file);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          try {
            const MAX = 1024;
            let { width, height } = img;
            if (width > height) {
              if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
            } else {
              if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  console.warn('[useBackgroundUpload] Canvas toBlob failed, falling back to original file.');
                  return resolve(file);
                }
                const originalName = file.name || 'image.jpg';
                const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
                const fileName = `${baseName}.jpg`;
                resolve(new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() }));
              },
              'image/jpeg',
              0.80
            );
          } catch (e) {
            console.warn('[useBackgroundUpload] Canvas compression error, falling back to original file:', e);
            resolve(file);
          }
        };
        img.onerror = (err) => {
          console.warn('[useBackgroundUpload] Image load error, falling back to original file:', err);
          resolve(file);
        };
      };
      reader.onerror = (err) => {
        console.warn('[useBackgroundUpload] FileReader error, falling back to original file:', err);
        resolve(file);
      };
    });
  }, []);

  /**
   * Start compressing + uploading immediately in the background.
   * Cancels any existing pending upload for the same field first.
   *
   * @param {string} field   - Unique field identifier (e.g. 'aadhar_image')
   * @param {File}   file    - The raw File object from input[type=file]
   */
  const queueUpload = useCallback((field, file, { onError, onSuccess, uploadUrl = '/upload', headers } = {}) => {
    // Cancel any previous upload for this field
    if (uploadMap.current[field]) {
      _cancelField(field, uploadMap.current);
    }

    const uploadPromise = (async () => {
      try {
        // 1. Compress
        const optimizedFile = await compressFile(file);

        // Check if this field was cancelled during compression
        if (uploadMap.current[field]?.status === 'cancelled') return null;

        // If compression fell back to original and it exceeds server limit, reject early
        if (optimizedFile.size > 4.5 * 1024 * 1024) {
          throw new Error('Image is too large. Please choose a smaller photo (max 5 MB).');
        }

        // 2. Upload
        const formData = new FormData();
        formData.append('image', optimizedFile);
        const response = await api.post(uploadUrl, formData, headers ? { headers } : undefined);
        const url = response.data?.url || null;

        // Store URL so cancelUpload can delete it from Cloudinary
        if (uploadMap.current[field] && uploadMap.current[field].status !== 'cancelled') {
          uploadMap.current[field].status = 'done';
          uploadMap.current[field].url = url;
        } else {
          // Cancelled after upload — delete the just-uploaded file from Cloudinary
          if (url) _deleteFromCloudinary(url);
          return null;
        }

        if (url && onSuccess) onSuccess(url);
        else if (!url) throw new Error('Upload did not return a valid image URL.');

        return url;
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Upload failed. Please re-upload.';
        console.error(`[useBackgroundUpload] Upload failed for field "${field}":`, message);
        if (uploadMap.current[field]) {
          uploadMap.current[field].status = 'error';
          uploadMap.current[field].error = message;
        }
        if (onError) onError(message);
        return null;
      }
    })();

    uploadMap.current[field] = {
      promise: uploadPromise,
      status: 'uploading',
      url: null,
      error: null,
    };
  }, [compressFile]);

  /**
   * Await the upload for a given field.
   * Returns the Cloudinary URL or null on failure.
   *
   * @param {string} field
   * @returns {Promise<string | null>}
   */
  const awaitUpload = useCallback(async (field) => {
    const entry = uploadMap.current[field];
    if (!entry) return null;
    return entry.promise;
  }, []);

  /**
   * Get a preview-ready local URL (ObjectURL) immediately, separate from the upload.
   * Just a utility wrapper — the caller should call URL.revokeObjectURL when done.
   */
  const getLocalPreview = useCallback((file) => {
    if (!file || !(file instanceof File)) return null;
    return URL.createObjectURL(file);
  }, []);

  /**
   * Cancel/remove the upload for a field.
   * If the upload already completed, the image is deleted from Cloudinary.
   * If still in progress, deletion runs after the promise resolves.
   *
   * @param {string} field
   */
  const cancelUpload = useCallback((field) => {
    _cancelField(field, uploadMap.current);
  }, []);

  /**
   * Cancel all pending/completed uploads (e.g. on component unmount or form reset).
   */
  const cancelAll = useCallback(() => {
    Object.keys(uploadMap.current).forEach((field) => {
      _cancelField(field, uploadMap.current);
    });
  }, []);

  const getUploadStatus = useCallback((field) => {
    return uploadMap.current[field]?.status || null; // 'uploading' | 'done' | 'error' | 'cancelled' | null
  }, []);

  const getUploadError = useCallback((field) => {
    return uploadMap.current[field]?.error || null;
  }, []);

  return { queueUpload, awaitUpload, getLocalPreview, cancelUpload, cancelAll, getUploadStatus, getUploadError };
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function _cancelField(field, map) {
  const entry = map[field];
  if (!entry) return;

  if (entry.status === 'done' && entry.url) {
    // Already uploaded — fire-and-forget delete
    _deleteFromCloudinary(entry.url);
  } else if (entry.status === 'uploading') {
    // Mark as cancelled — the promise will detect this and delete after upload
    entry.status = 'cancelled';
  }

  delete map[field];
}

async function _deleteFromCloudinary(url) {
  try {
    await api.delete('/upload', { data: { url } });
  } catch (err) {
    // Non-blocking — log but don't crash the UI
    console.warn('[useBackgroundUpload] Failed to delete from Cloudinary:', err?.message);
  }
}
