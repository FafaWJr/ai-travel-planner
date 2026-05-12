export interface PhotoMeta {
  id: string;
  storagePath: string;
  originalFilename: string;
  width: number | null;
  height: number | null;
  exifDate: string | null;
  exifLat: number | null;
  exifLng: number | null;
  sortOrder: number;
  blurPlaceholder: string;
}

export interface PhotoUploadItem {
  localId: string;
  file: File;
  previewUrl: string;
  dayNumber: number | null;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  meta?: PhotoMeta;
}
