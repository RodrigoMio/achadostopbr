import { NextResponse } from 'next/server';
import { connectWhatsApp, getPublicState } from '@/server/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  connectWhatsApp().catch(() => {});
  return NextResponse.json(getPublicState());
}
