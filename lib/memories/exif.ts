import exifr from 'exifr';

export interface PhotoExifData {
  date: Date | null;
  lat: number | null;
  lng: number | null;
  width: number | null;
  height: number | null;
}

/**
 * Extract EXIF metadata from a photo file.
 * Runs entirely in the browser. No server round-trip.
 *
 * Returns null values for missing fields (common with screenshots,
 * downloaded images, and some phone cameras that strip GPS).
 */
export async function extractExif(file: File): Promise<PhotoExifData> {
  try {
    const exif = await exifr.parse(file, {
      pick: [
        'DateTimeOriginal',
        'CreateDate',
        'GPSLatitude',
        'GPSLongitude',
        'ImageWidth',
        'ImageHeight',
        'ExifImageWidth',
        'ExifImageHeight',
      ],
    });

    if (!exif) {
      return { date: null, lat: null, lng: null, width: null, height: null };
    }

    const rawDate = exif.DateTimeOriginal ?? exif.CreateDate ?? null;
    const date = rawDate instanceof Date ? rawDate : rawDate ? new Date(rawDate) : null;

    const lat = typeof exif.GPSLatitude === 'number' ? exif.GPSLatitude : null;
    const lng = typeof exif.GPSLongitude === 'number' ? exif.GPSLongitude : null;

    const width = exif.ExifImageWidth ?? exif.ImageWidth ?? null;
    const height = exif.ExifImageHeight ?? exif.ImageHeight ?? null;

    return { date, lat, lng, width, height };
  } catch (err) {
    console.warn('[exif] extraction failed:', err);
    return { date: null, lat: null, lng: null, width: null, height: null };
  }
}

/**
 * Sort photos into trip days based on EXIF date.
 * Returns a map of dayNumber -> photos and an unsorted array for photos
 * without dates or dates outside the trip range.
 */
export function sortPhotosByDay(
  photos: Array<{ file: File; exif: PhotoExifData; id: string }>,
  tripStartDate: Date,
  tripEndDate: Date,
): {
  sorted: Record<number, Array<{ file: File; exif: PhotoExifData; id: string }>>;
  unsorted: Array<{ file: File; exif: PhotoExifData; id: string }>;
} {
  const sorted: Record<number, Array<{ file: File; exif: PhotoExifData; id: string }>> = {};
  const unsorted: Array<{ file: File; exif: PhotoExifData; id: string }> = [];

  const startMs = new Date(tripStartDate).setHours(0, 0, 0, 0);
  const endMs = new Date(tripEndDate).setHours(23, 59, 59, 999);
  const totalDays = Math.round((endMs - startMs) / 86400000) + 1;

  for (const photo of photos) {
    if (!photo.exif.date) {
      unsorted.push(photo);
      continue;
    }

    const photoMs = photo.exif.date.getTime();
    if (photoMs < startMs || photoMs > endMs) {
      unsorted.push(photo);
      continue;
    }

    const dayNumber = Math.floor((photoMs - startMs) / 86400000) + 1;
    if (dayNumber < 1 || dayNumber > totalDays) {
      unsorted.push(photo);
      continue;
    }

    if (!sorted[dayNumber]) sorted[dayNumber] = [];
    sorted[dayNumber].push(photo);
  }

  for (const dayPhotos of Object.values(sorted)) {
    dayPhotos.sort((a, b) => {
      const aTime = a.exif.date?.getTime() ?? 0;
      const bTime = b.exif.date?.getTime() ?? 0;
      return aTime - bTime;
    });
  }

  return { sorted, unsorted };
}
