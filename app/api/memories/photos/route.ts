import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { PhotoMeta } from '@/lib/memories/types';

export const maxDuration = 30;

export type { PhotoMeta };

/**
 * POST /api/memories/photos
 * Upload a single compressed photo to Supabase Storage and record
 * its metadata in the trip_memories row for the specified day.
 *
 * Form data fields:
 * - file: the compressed photo (Blob/File)
 * - tripId: the trip ID
 * - dayNumber: which day this photo belongs to (number)
 * - exifDate: ISO date string from EXIF (optional)
 * - exifLat: latitude from EXIF (optional)
 * - exifLng: longitude from EXIF (optional)
 * - width: photo width after compression (optional)
 * - height: photo height after compression (optional)
 * - blurPlaceholder: base64 tiny preview (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const tripId = formData.get('tripId') as string | null;
    const dayNumberStr = formData.get('dayNumber') as string | null;

    if (!file || !tripId || !dayNumberStr) {
      return Response.json(
        { error: 'Missing required fields: file, tripId, dayNumber' },
        { status: 400 },
      );
    }

    const dayNumber = parseInt(dayNumberStr, 10);
    if (isNaN(dayNumber) || dayNumber < 1) {
      return Response.json({ error: 'Invalid dayNumber' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return Response.json({ error: 'File must be an image' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const photoId = crypto.randomUUID();
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const storagePath = `${user.id}/${tripId}/${dayNumber}/${photoId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from('memory-photos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '2592000',
        upsert: false,
      });

    if (uploadError) {
      console.error('[photos] upload error:', uploadError);
      return Response.json({ error: 'Failed to upload photo' }, { status: 500 });
    }

    const photoMeta: PhotoMeta = {
      id: photoId,
      storagePath,
      originalFilename: file.name,
      width: formData.get('width') ? parseInt(formData.get('width') as string, 10) : null,
      height: formData.get('height') ? parseInt(formData.get('height') as string, 10) : null,
      exifDate: (formData.get('exifDate') as string) || null,
      exifLat: formData.get('exifLat') ? parseFloat(formData.get('exifLat') as string) : null,
      exifLng: formData.get('exifLng') ? parseFloat(formData.get('exifLng') as string) : null,
      sortOrder: 0,
      blurPlaceholder: (formData.get('blurPlaceholder') as string) || '',
    };

    // Dual-lookup: try trip_id first (linked), then id (standalone)
    let memory = null as { id: string; memory_data: Record<string, unknown> } | null;
    const { data: byTripId } = await supabase
      .from('trip_memories')
      .select('id, memory_data')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (byTripId) {
      memory = byTripId as typeof memory;
    } else {
      const { data: byId } = await supabase
        .from('trip_memories')
        .select('id, memory_data')
        .eq('id', tripId)
        .eq('user_id', user.id)
        .single();
      memory = byId as typeof memory;
    }

    if (!memory) {
      await supabase.storage.from('memory-photos').remove([storagePath]);
      return Response.json({ error: 'Memory not found' }, { status: 404 });
    }

    const memoryData = memory.memory_data as {
      days: Array<{
        dayNumber: number;
        photos: PhotoMeta[];
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };

    const dayIndex = memoryData.days.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex < 0) {
      await supabase.storage.from('memory-photos').remove([storagePath]);
      return Response.json({ error: `Day ${dayNumber} not found in memory` }, { status: 400 });
    }

    const existingPhotos = memoryData.days[dayIndex].photos ?? [];
    photoMeta.sortOrder = existingPhotos.length;
    memoryData.days[dayIndex].photos = [...existingPhotos, photoMeta];

    const { error: updateError } = await supabase
      .from('trip_memories')
      .update({ memory_data: memoryData })
      .eq('id', memory.id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[photos] metadata update error:', updateError);
      await supabase.storage.from('memory-photos').remove([storagePath]);
      return Response.json({ error: 'Failed to save photo metadata' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('memory-photos')
      .getPublicUrl(storagePath);

    return Response.json({
      photo: photoMeta,
      publicUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error('[photos] unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/memories/photos
 * Remove a photo from Supabase Storage and its metadata from trip_memories.
 *
 * Body: { tripId, dayNumber, photoId }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripId, dayNumber, photoId } = await request.json() as {
      tripId: string;
      dayNumber: number;
      photoId: string;
    };

    if (!tripId || !dayNumber || !photoId) {
      return Response.json(
        { error: 'Missing required fields: tripId, dayNumber, photoId' },
        { status: 400 },
      );
    }

    // Dual-lookup: try trip_id first (linked), then id (standalone)
    let memory = null as { id: string; memory_data: Record<string, unknown> } | null;
    const { data: byTripId2 } = await supabase
      .from('trip_memories')
      .select('id, memory_data')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (byTripId2) {
      memory = byTripId2 as typeof memory;
    } else {
      const { data: byId2 } = await supabase
        .from('trip_memories')
        .select('id, memory_data')
        .eq('id', tripId)
        .eq('user_id', user.id)
        .single();
      memory = byId2 as typeof memory;
    }

    if (!memory) {
      return Response.json({ error: 'Memory not found' }, { status: 404 });
    }

    const memoryData = memory.memory_data as {
      days: Array<{
        dayNumber: number;
        photos: PhotoMeta[];
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };

    const dayIndex = memoryData.days.findIndex(d => d.dayNumber === dayNumber);
    if (dayIndex < 0) {
      return Response.json({ error: `Day ${dayNumber} not found` }, { status: 400 });
    }

    const photos = memoryData.days[dayIndex].photos ?? [];
    const photoIndex = photos.findIndex(p => p.id === photoId);
    if (photoIndex < 0) {
      return Response.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = photos[photoIndex];

    const { error: removeError } = await supabase.storage
      .from('memory-photos')
      .remove([photo.storagePath]);

    if (removeError) {
      console.error('[photos] storage remove error:', removeError);
      // Continue: remove metadata even if storage delete fails
    }

    memoryData.days[dayIndex].photos = photos.filter(p => p.id !== photoId);
    memoryData.days[dayIndex].photos.forEach((p, i) => { p.sortOrder = i; });

    const { error: updateError } = await supabase
      .from('trip_memories')
      .update({ memory_data: memoryData })
      .eq('id', memory.id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[photos] metadata remove error:', updateError);
      return Response.json({ error: 'Failed to update metadata' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[photos] delete error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
