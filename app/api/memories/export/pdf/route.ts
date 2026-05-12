import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildPdfHtml } from '@/lib/memories/pdf-template';
import type { PhotoMeta } from '@/lib/memories/types';

export const maxDuration = 60;
export const runtime = 'nodejs';

interface MemoryDay {
  dayNumber: number;
  dayTitle: string;
  notes: string;
  mood: string | null;
  highlight: boolean;
  photos: PhotoMeta[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memoryId } = await request.json() as { memoryId: string };
    if (!memoryId) {
      return Response.json({ error: 'memoryId is required' }, { status: 400 });
    }

    // Dual-lookup: try by trip_id then by id (handles linked + standalone)
    let memory = null;
    const { data: byTripId } = await supabase
      .from('trip_memories')
      .select('*')
      .eq('trip_id', memoryId)
      .eq('user_id', user.id)
      .single();

    if (byTripId) {
      memory = byTripId;
    } else {
      const { data: byId } = await supabase
        .from('trip_memories')
        .select('*')
        .eq('id', memoryId)
        .eq('user_id', user.id)
        .single();
      memory = byId;
    }

    if (!memory) {
      return Response.json({ error: 'Memory not found' }, { status: 404 });
    }

    if (!memory.narrative) {
      return Response.json(
        { error: 'Generate your story first before exporting to PDF.' },
        { status: 400 },
      );
    }

    // Return cached PDF as binary (private bucket — never expose public URL)
    if (memory.pdf_storage_path) {
      const { data: cachedBlob, error: downloadError } = await supabase.storage
        .from('memory-pdfs')
        .download(memory.pdf_storage_path);

      if (!downloadError && cachedBlob) {
        const cachedBuffer = Buffer.from(await cachedBlob.arrayBuffer());
        const memDataForName = memory.memory_data as { tripDestination?: string } | null;
        const safeNameCached = (memDataForName?.tripDestination ?? 'trip').replace(/[^a-zA-Z0-9]/g, '-');
        return new Response(cachedBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeNameCached}-memory.pdf"`,
            'Cache-Control': 'private, max-age=3600',
          },
        });
      }
    }

    // Build HTML from template
    const memData = memory.memory_data as {
      days: MemoryDay[];
      tripDestination?: string;
      tripTitle?: string;
      tripStartDate?: string;
      tripEndDate?: string;
    };

    const html = buildPdfHtml({
      destination: memData.tripDestination ?? (memory.standalone_destination as string | null) ?? 'A trip',
      title: memData.tripTitle ?? memData.tripDestination ?? 'Trip Memory',
      startDate: memData.tripStartDate ?? (memory.standalone_start_date as string | null) ?? null,
      endDate: memData.tripEndDate ?? (memory.standalone_end_date as string | null) ?? null,
      days: memData.days ?? [],
      narrative: memory.narrative,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    });

    // Launch Chromium and render PDF
    const chromium = await import('@sparticuz/chromium');
    const puppeteer = await import('puppeteer-core');

    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 25000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '20mm', right: '20mm' },
    });

    await browser.close();

    // Cache the PDF in private storage (memory-pdfs bucket)
    const pdfBuffer2 = Buffer.from(pdfBuffer);
    const pdfPath = `pdfs/${user.id}/${memory.id}.pdf`;
    await supabase.storage
      .from('memory-pdfs')
      .upload(pdfPath, pdfBuffer2, {
        contentType: 'application/pdf',
        cacheControl: '2592000',
        upsert: true,
      });

    await supabase
      .from('trip_memories')
      .update({ pdf_storage_path: pdfPath })
      .eq('id', memory.id);

    const safeFilename = (memData.tripDestination ?? 'trip').replace(/[^a-zA-Z0-9]/g, '-');

    return new Response(pdfBuffer2, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}-memory.pdf"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[pdf] generation error:', error);
    return Response.json(
      { error: 'Failed to generate PDF. Please try again.' },
      { status: 500 },
    );
  }
}
