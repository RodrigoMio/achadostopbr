import { connectWhatsApp, getPublicState, subscribeWhatsApp } from '@/server/whatsapp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  connectWhatsApp().catch(() => {});

  const encoder = new TextEncoder();
  let unsubscribe = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (state) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`));
        } catch {
          unsubscribe();
        }
      };

      send(getPublicState());
      unsubscribe = subscribeWhatsApp(send);
    },
    cancel() {
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
