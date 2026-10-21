'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { buildBuyDirectLine, formatProductPrice } from '@/lib/whatsappMessage';

function displayText(value) {
  return value?.trim() ? value : '-';
}

export function WhatsAppSendModal({
  open,
  product,
  initialGroupName = '',
  onClose,
  onProductUpdated,
  onGroupNameSaved,
  onToast,
}) {
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmCount, setConfirmCount] = useState(null);

  useEffect(() => {
    if (!open) return;
    setGroupName(initialGroupName || '');
    setError('');
    setConfirmCount(null);
    setSending(false);
    setConfirming(false);
  }, [open, product, initialGroupName]);

  function handleClose() {
    if (sending || confirming) return;
    setConfirmCount(null);
    onClose();
  }

  async function handleSend(event) {
    event.preventDefault();
    if (!product || sending) return;

    const name = groupName.trim();
    if (!name) {
      setError('Informe o nome do grupo.');
      return;
    }

    setSending(true);
    setError('');
    try {
      const response = await fetch(`/api/products/${product.id_product}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_group_name: name, confirm: false }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao procurar grupos.');
      }
      if (payload.whatsapp_group_name != null) {
        onGroupNameSaved?.(payload.whatsapp_group_name);
      }
      if (payload.product) {
        onProductUpdated?.(payload.product);
      }
      if (!payload.count) {
        onToast?.('Nenhum grupo encontrado');
        return;
      }
      setConfirmCount(payload.count);
    } catch (err) {
      onToast?.(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleConfirm() {
    if (!product || confirming) return;
    setConfirming(true);
    try {
      const response = await fetch(`/api/products/${product.id_product}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_group_name: groupName.trim(),
          confirm: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha no disparo.');
      }
      if (payload.whatsapp_group_name != null) {
        onGroupNameSaved?.(payload.whatsapp_group_name);
      }
      if (payload.product) {
        onProductUpdated?.(payload.product);
      }
      if (payload.sent > 0) {
        onToast?.(`Enviado para ${payload.sent} grupos.`);
        setConfirmCount(null);
        onClose();
        return;
      }
      onToast?.(payload.failed?.[0]?.error || 'Falha no disparo.');
    } catch (err) {
      onToast?.(err.message);
    } finally {
      setConfirming(false);
    }
  }

  const busy = sending || confirming;
  const previewPrice = formatProductPrice(product?.price);

  return (
    <>
      <Dialog open={open} onClose={handleClose} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-slate-950/40" />
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Envio whatsapp
              </DialogTitle>
              <form className="mt-5 grid gap-4" onSubmit={handleSend}>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Informe o nome do grupo
                  </span>
                  <input
                    maxLength={100}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Preview
                  </p>
                  {product?.image_link ? (
                    <img
                      src={product.image_link}
                      alt={displayText(product.title)}
                      className="mb-3 h-40 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="mb-3 flex h-40 items-center justify-center rounded-xl bg-slate-200 text-sm text-slate-500">
                      Sem imagem
                    </div>
                  )}
                  <p className="font-bold text-slate-900">{displayText(product?.title)}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {displayText(product?.ia_description)}
                  </p>
                  {previewPrice ? (
                    <p className="mt-2 text-sm font-medium text-slate-800">{previewPrice}</p>
                  ) : null}
                  <p className="mt-2 text-sm text-slate-800">{buildBuyDirectLine(product)}</p>
                  {product?.affiliated_link ? (
                    <a
                      href={product.affiliated_link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all text-sm text-emerald-700 underline"
                    >
                      {product.affiliated_link}
                    </a>
                  ) : null}
                </div>

                {error ? (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={busy}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {sending ? 'A procurar…' : 'Enviar'}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={confirmCount != null}
        onClose={() => {
          if (!confirming) setConfirmCount(null);
        }}
        className="relative z-[70]"
      >
        <DialogBackdrop className="fixed inset-0 bg-slate-950/50" />
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <DialogPanel className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Confirma envio para {confirmCount} grupos ?
              </DialogTitle>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={confirming}
                  onClick={() => setConfirmCount(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Não
                </button>
                <button
                  type="button"
                  disabled={confirming}
                  onClick={handleConfirm}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {confirming ? 'A enviar…' : 'Sim'}
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
