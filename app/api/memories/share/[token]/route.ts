import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: memory, error } = await serviceSupabase
    .from('trip_memories')
    .select('id, trip_id, memory_data, narrative, status, share_token, created_at')
    .eq('share_token', token)
    .eq('status', 'complete')
    .single();

  if (error || !memory) {
    return Response.json({ error: 'Memory not found or not yet published' }, { status: 404 });
  }

  return Response.json({ memory });
}
