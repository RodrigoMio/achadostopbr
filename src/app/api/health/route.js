import { NextResponse } from 'next/server';
import { isGeminiConfigured, isPublicOnly, isSupabaseConfigured } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (isPublicOnly()) {
    return NextResponse.json({
      status: 'ok',
      publicOnly: true,
      supabase: isSupabaseConfigured(),
      gemini: isGeminiConfigured(),
    });
  }

  const { getPublicState } = await import('@/server/whatsapp');
  const { qr: _qr, ...whatsapp } = getPublicState();
  return NextResponse.json({
    status: 'ok',
    publicOnly: false,
    whatsapp,
    supabase: isSupabaseConfigured(),
    gemini: isGeminiConfigured(),
  });
}
