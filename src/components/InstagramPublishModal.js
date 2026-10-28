'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Bookmark, Heart, MessageCircle, Send } from 'lucide-react';
import { buildDefaultInstagramCaption, INSTAGRAM_CAPTION_MAX } from '@/lib/instagram';

function displayText(value) {
  return value?.trim() ? value : 'produto';
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR');
}

export function InstagramPublishModal({ open, product, onClose, onProductUpdated, onToast }) {
  const [caption, setCaption] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState(null);

  useEffect(() => {
    if (!open) return;
    setCaption(product ? buildDefaultInstagramCaption(product) : '');
    setError('');
    setConfirmInfo(null);
    setPublishing(false);
    setConfirming(false);

    let cancelled = false;
    fetch('/api/instagram/status')
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        if (payload?.username) setUsername(payload.username);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [open, product]);

  function handleClose() {
    if (publishing || confirming) return;
    setConfirmInfo(null);
    onClose();
  }

  async function publish(confirm) {
    if (!product) return;
    const text = caption.trim();
    if (!text) {
      setError('Informe a legenda da publicação.');
      return;
    }

    if (confirm) {
      setConfirming(true);
    } else {
      setPublishing(true);
    }
    setError('');

    try {
      const response = await fetch(`/api/products/${product.id_product}/instagram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: text, confirm }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao publicar no Instagram.');
      }
      if (payload.needs_confirm) {
        setConfirmInfo({
          count: payload.posts_count,
          lastPublishedAt: payload.last_published_at,
        });
        return;
      }
      if (payload.product) {
        onProductUpdated?.(payload.product);
      }
      onToast?.('Publicado no Instagram.');
      setConfirmInfo(null);
      onClose();
    } catch (err) {
      setError(err.message);
      onToast?.(err.message);
    } finally {
      setPublishing(false);
      setConfirming(false);
    }
  }

  const busy = publishing || confirming;
  const handle = username ? `@${username}` : 'instagram';

  return (
    <>
      <Dialog open={open} onClose={handleClose} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-slate-950/40" />
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Publicar no Instagram
              </DialogTitle>
              <p className="mt-1 text-sm text-slate-500">
                Preview no formato do feed. Podes editar a legenda antes de confirmar.
              </p>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-[10px] font-bold text-white">
                    IG
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{handle}</p>
                    <p className="truncate text-xs text-slate-500">{displayText(product?.title)}</p>
                  </div>
                </div>

                {product?.image_link ? (
                  <img
                    src={product.image_link}
                    alt={displayText(product?.title)}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-slate-100 text-sm text-slate-500">
                    Sem imagem
                  </div>
                )}

                <div className="flex items-center justify-between px-3 py-2 text-slate-800">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5" aria-hidden="true" />
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                    <Send className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <Bookmark className="h-5 w-5" aria-hidden="true" />
                </div>

                <label className="block border-t border-slate-100 px-3 py-3">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Legenda
                  </span>
                  <textarea
                    value={caption}
                    maxLength={INSTAGRAM_CAPTION_MAX}
                    rows={7}
                    onChange={(event) => setCaption(event.target.value)}
                    className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  />
                  <span className="mt-1 block text-right text-xs text-slate-400">
                    {caption.length}/{INSTAGRAM_CAPTION_MAX}
                  </span>
                </label>
              </div>

              {error ? (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={busy}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  disabled={busy || !product?.image_link || !caption.trim()}
                  onClick={() => publish(false)}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-pink-600 hover:to-purple-700 disabled:opacity-60"
                >
                  {publishing ? 'A publicar…' : 'Publicar no Instagram'}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={confirmInfo != null}
        onClose={() => {
          if (!confirming) setConfirmInfo(null);
        }}
        className="relative z-[70]"
      >
        <DialogBackdrop className="fixed inset-0 bg-slate-950/50" />
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Este produto já foi publicado
              </DialogTitle>
              <p className="mt-2 text-sm text-slate-600">
                {confirmInfo?.count
                  ? `${confirmInfo.count} publicação(ões) no feed.`
                  : 'Já existe uma publicação deste produto no Instagram.'}{' '}
                {confirmInfo?.lastPublishedAt
                  ? `Última: ${formatDate(confirmInfo.lastPublishedAt)}.`
                  : null}{' '}
                Publicar novamente?
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => setConfirmInfo(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Não
                </button>
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => publish(true)}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-pink-600 hover:to-purple-700 disabled:opacity-60"
                >
                  {confirming ? 'A publicar…' : 'Sim, publicar'}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
