/**
 * 🖼️ IMAGE COMPRESSION UTILITY
 * ------------------------------------------------------------------------------------------
 * Optimizes images on the client-side before uploading to Cloudinary.
 * Reduces bandwidth usage, storage costs, and improves page load performance.
 */

export const compressImage = async (file, { maxWidth = 1280, maxHeight = 1280, quality = 0.8 } = {}) => {
  return new Promise((resolve) => {
    // 1. Validate if it's an image
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return resolve(file); // Return original if not an image
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        try {
          // 2. Calculate new dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          // 3. Draw onto Canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // 4. Convert to Blob (WebP preferred, fallback to JPEG)
          const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn('[compressImage] Canvas toBlob failed, falling back to original file.');
                return resolve(file);
              }
              
              // Create a new file from the blob
              const optimizedFile = new File([blob], file.name || 'image.jpg', {
                type: format,
                lastModified: Date.now(),
              });
              
              resolve(optimizedFile);
            },
            format,
            quality
          );
        } catch (e) {
          console.warn('[compressImage] Error during canvas compression, falling back to original file:', e);
          resolve(file);
        }
      };
      img.onerror = (err) => {
        console.warn('[compressImage] Image load failed, falling back to original file:', err);
        resolve(file);
      };
    };
    reader.onerror = (err) => {
      console.warn('[compressImage] FileReader failed, falling back to original file:', err);
      resolve(file);
    };
  });
};
