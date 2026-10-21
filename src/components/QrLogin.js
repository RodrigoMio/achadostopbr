'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const EMPTY = {
  connected: false,
  connecting: true,
  qr: null,
  authorized: false,
  error: null,
  user: null,
};

export function QrLogin() {
  const router = useRouter();
  const [state, setState] = useState(EMPTY);
  const completing = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const completeSession = async () => {
      if (completing.current) return;
      completing.current = true;
      try {
        const response = await fetch('/api/auth/session', { method: 'POST' });
        const payload = await response.json();
        if (response.ok) {
          router.replace(payload.redirect || '/admin');
          router.refresh();
          return;
        }
        completing.current = false;
      } catch {
        completing.current = false;
      }
    };

    const tick = async () => {
      try {
        const response = await fetch('/api/whatsapp/status', { cache: 'no-store' });
        const payload = await response.json();
        if (cancelled) return;
        setState(payload);
        if (payload.connected && payload.authorized) {
          completeSession();
        }
      } catch {
        /* ignore */
      }
    };

    tick();
    const pollTimer = setInterval(tick, 1500);

    return () => {
      cancelled = true;
      clearInterval(pollTimer);
    };
  }, [router]);

  const statusLabel = state.connected
    ? state.authorized
      ? 'Número autorizado. A entrar…'
      : 'A validar o número…'
    : state.qr
      ? 'Escaneie o QR Code com o WhatsApp'
      : 'A preparar a conexão…';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Afiliados
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Entrar com WhatsApp</h1>
          <p className="mt-2 text-sm text-slate-500">
            Use o número já cadastrado e ativo para aceder ao painel.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex h-72 w-72 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
            {state.qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.qr} alt="QR Code do WhatsApp" className="h-64 w-64" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                <span className="text-sm">A gerar QR Code…</span>
              </div>
            )}
          </div>

          <p className="text-center text-sm font-medium text-slate-700">{statusLabel}</p>

          {state.error ? (
            <p
              className="w-full rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700"
              role="alert"
            >
              {state.error}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
