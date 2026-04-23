/**
 * 🖼️ IMAGE COMPRESSION UTILITY
 * ------------------------------------------------------------------------------------------
 * Optimizes images on the client-side before uploading to Cloudinary.
 * Reduces bandwidth usage, storage costs, and improves page load performance.
 */

export const compressImage = async (file, { maxWidth = 1280, maxHeight = 1280, quality = 0.8 } = {}) => {
  return new Promise((resolve, reject) => {
    // 1. Validate if it's an image
    if (!file.type.startsWith('image/')) {
      return resolve(file); // Return original if not an image
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
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
            if (!blob) return reject(new Error('Canvas toBlob failed'));
            
            // Create a new file from the blob
            const optimizedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now(),
            });
            
            // Log improvement
            console.log(`🚀 Optimized: ${file.name} | ${(file.size / 1024).toFixed(1)}KB -> ${(optimizedFile.size / 1024).toFixed(1)}KB`);
            resolve(optimizedFile);
          },
          format,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
