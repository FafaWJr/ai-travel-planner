// lib/memories/heic-convert.ts

/**
 * Check if a file is HEIC/HEIF format.
 * Checks both MIME type and file extension since browsers
 * report HEIC files inconsistently (Chrome may return empty MIME type).
 */
export function isHeicFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    (type === '' && (name.endsWith('.heic') || name.endsWith('.heif')))
  );
}

/**
 * Convert a HEIC/HEIF file to a JPEG Blob.
 * Returns the original file unchanged if it is not HEIC.
 *
 * Uses dynamic import so the ~180KB heic2any WASM library is only
 * downloaded when a HEIC file is actually detected.
 *
 * IMPORTANT: EXIF metadata (including GPS) must be extracted from the
 * ORIGINAL file BEFORE calling this function. heic2any strips EXIF
 * during conversion.
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;

  try {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });

    const jpegBlob = Array.isArray(result) ? result[0] : result;
    const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
    return new File([jpegBlob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.error('[heic-convert] Failed to convert HEIC:', err);
    return file;
  }
}
