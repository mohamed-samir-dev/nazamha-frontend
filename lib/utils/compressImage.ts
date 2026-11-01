/**
 * Compresses and resizes an image file in the browser before upload.
 * Reduces 5-15MB phone camera photos down to ~80-200KB without visible quality loss.
 */
export async function compressImage(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<File | Blob> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  // If already under 150KB and already webp/jpeg, return as-is
  if (file.size <= 150 * 1024 && (file.type === "image/webp" || file.type === "image/jpeg")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = "image/webp";
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: "image/webp",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // fallback to jpeg if webp not supported or bigger
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob && jpegBlob.size < file.size) {
                    const jpegFile = new File([jpegBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    });
                    resolve(jpegFile);
                  } else {
                    resolve(file);
                  }
                },
                "image/jpeg",
                quality
              );
            }
          },
          mimeType,
          quality
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
