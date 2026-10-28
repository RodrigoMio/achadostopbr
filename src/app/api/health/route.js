import { NextResponse } from 'next/server';
import {
  isGeminiConfigured,
  isInstagramConfigured,
  isPublicOnly,
  isSupabaseConfigured,
} from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  let instagram = { configured: isInstagramConfigured() };
  if (isInstagramConfigured()) {
    const { getInstagramPublicState, startInstagram } = await import('@/server/instagram');
    instagram = getInstagramPublicState();
    if (!instagram.checkedAt) {
      try {
        instagram = await startInstagram();
      } catch (err) {
        instagram = {
          ...getInstagramPublicState(),
          lastError: err.message || 'Falha ao validar o Instagram',
        };
      }
    }
  }

  if (isPublicOnly()) {
    return NextResponse.json({
      status: 'ok',
      publicOnly: true,
      supabase: isSupabaseConfigured(),
      gemini: isGeminiConfigured(),
      instagram,
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
    instagram,
  });
}
