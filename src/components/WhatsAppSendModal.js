'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Search, X } from 'lucide-react';
import { buildProductWhatsAppCaption } from '@/lib/whatsappMessage';
import { isHttpUrl } from '@/utils/validateSendPayload';

const STORAGE_PREFIX = 'afiliados_whatsapp_send_groups_';

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`;
}

function loadStoredGroups(userId) {
  if (!userId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        jid: typeof item?.jid === 'string' ? item.jid.trim() : '',
        name: typeof item?.name === 'string' ? item.name.trim() : '',
      }))
      .filter((item) => item.jid && item.name);
  } catch {
    return [];
  }
}

function saveStoredGroups(userId, groups) {
  if (!userId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(groups));
  } catch {
    /* ignore quota / private mode */
  }
}

function mergeGroupSelections(existing, incoming) {
  const map = new Map(existing.map((group) => [group.jid, group]));
  for (const group of incoming) {
    map.set(group.jid, group);
  }
  return [...map.values()];
}

function displayText(value) {
  return value?.trim() ? value : '-';
}

function WhatsAppCaptionPreview({ caption }) {
  const lines = caption?.split('\n') ?? [];

  if (lines.length === 0 || !caption?.trim()) {
    return <p className="text-sm text-slate-500">—</p>;
  }

  return (
    <div className="space-y-1 text-sm text-slate-800">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={`sp-${index}`} className="h-2" aria-hidden />;
        }

        if (isHttpUrl(trimmed)) {
          return (
            <a
              key={`ln-${index}`}
              href={trimmed}
              target="_blank"
              rel="noreferrer"
              className="block break-all text-emerald-700 underline"
            >
              {trimmed}
            </a>
          );
        }

        const boldMatch = /^\*(.+)\*$/.exec(trimmed);
        if (boldMatch) {
          return (
            <p key={`ln-${index}`} className="font-bold text-slate-900">
              {boldMatch[1]}
            </p>
          );
        }

        return (
          <p key={`ln-${index}`} className="whitespace-pre-wrap text-slate-600">
            {line}
          </p>
        );
      })}
    </div>
  );
}

export function WhatsAppSendModal({
  open,
  userId,
  product,
  initialGroupName = '',
  storeUrl = '',
  onClose,
  onProductUpdated,
  onGroupNameSaved,
  onToast,
}) {
  const [groupName, setGroupName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmCount, setConfirmCount] = useState(null);
  const [pendingJids, setPendingJids] = useState([]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchChecked, setSearchChecked] = useState({});

  const caption = useMemo(
    () => (product ? buildProductWhatsAppCaption(product, storeUrl) : ''),
    [product, storeUrl],
  );

  const persistGroups = useCallback(
    (groups) => {
      saveStoredGroups(userId, groups);
    },
    [userId],
  );

  const applySelectedGroups = useCallback(
    (updater) => {
      setSelectedGroups((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater;
        persistGroups(next);
        return next;
      });
    },
    [persistGroups],
  );

  const removeInvalidJids = useCallback(
    (invalidJids) => {
      if (!invalidJids?.length) return;
      const drop = new Set(invalidJids);
      applySelectedGroups((current) => current.filter((group) => !drop.has(group.jid)));
    },
    [applySelectedGroups],
  );

  useEffect(() => {
    if (!open) return;
    setGroupName(initialGroupName || '');
    setSelectedGroups(loadStoredGroups(userId));
    setError('');
    setConfirmCount(null);
    setPendingJids([]);
    setSending(false);
    setConfirming(false);
    setSearchOpen(false);
    setSearchResults([]);
    setSearchChecked({});
  }, [open, product, initialGroupName, userId]);

  function handleClose() {
    if (sending || confirming) return;
    setConfirmCount(null);
    setPendingJids([]);
    onClose();
  }

  async function handleSearchClick() {
    const prefix = groupName.trim();
    if (!prefix) {
      onToast?.('Informe o nome do grupo para buscar.');
      return;
    }

    setSearching(true);
    setError('');
    try {
      const response = await fetch('/api/whatsapp/groups/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix, include_invites: false }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao buscar grupos.');
      }

      const groups = (payload.groups ?? []).map((group) => ({
        jid: group.whatsapp_group_id,
        name: group.name,
      }));

      if (groups.length === 0) {
        onToast?.('Nenhum grupo encontrado');
        return;
      }

      const checked = {};
      for (const group of groups) {
        checked[group.jid] = true;
      }
      setSearchResults(groups);
      setSearchChecked(checked);
      setSearchOpen(true);
    } catch (err) {
      onToast?.(err.message);
    } finally {
      setSearching(false);
    }
  }

  const allSearchChecked =
    searchResults.length > 0 && searchResults.every((group) => searchChecked[group.jid]);

  function toggleSelectAllSearch() {
    if (searchResults.length === 0) return;
    const nextChecked = !allSearchChecked;
    const next = {};
    for (const group of searchResults) {
      next[group.jid] = nextChecked;
    }
    setSearchChecked(next);
  }

  function toggleSearchGroup(jid) {
    setSearchChecked((current) => ({ ...current, [jid]: !current[jid] }));
  }

  function closeSearchDialog() {
    if (searching) return;
    setSearchOpen(false);
  }

  function confirmSearchSelection() {
    const picked = searchResults.filter((group) => searchChecked[group.jid]);
    if (picked.length === 0) return;
    applySelectedGroups((current) => mergeGroupSelections(current, picked));
    setSearchOpen(false);
  }

  function removeSelectedGroup(jid) {
    applySelectedGroups((current) => current.filter((group) => group.jid !== jid));
  }

  function clearSelectedGroups() {
    applySelectedGroups([]);
  }

  const searchConfirmDisabled = !searchResults.some((group) => searchChecked[group.jid]);

  async function handleSend(event) {
    event.preventDefault();
    if (!product || sending) return;

    const name = groupName.trim();
    if (!name) {
      setError('Informe o nome do grupo.');
      return;
    }

    if (selectedGroups.length === 0) {
      setError('Selecione ao menos um grupo.');
      return;
    }

    const groupJids = selectedGroups.map((group) => group.jid);

    setSending(true);
    setError('');
    try {
      const response = await fetch(`/api/products/${product.id_product}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_group_name: name,
          group_jids: groupJids,
          confirm: false,
        }),
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
      if (payload.invalid_jids?.length) {
        removeInvalidJids(payload.invalid_jids);
      }
      if (!payload.count) {
        onToast?.('Nenhum grupo encontrado');
        return;
      }
      setPendingJids((payload.groups ?? []).map((group) => group.jid));
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
      const jidsToSend =
        pendingJids.length > 0 ? pendingJids : selectedGroups.map((group) => group.jid);
      const response = await fetch(`/api/products/${product.id_product}/whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_group_name: groupName.trim(),
          group_jids: jidsToSend,
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
      if (payload.invalid_jids?.length) {
        removeInvalidJids(payload.invalid_jids);
      }
      if (payload.sent > 0) {
        onToast?.(`Enviado para ${payload.sent} grupos.`);
        setConfirmCount(null);
        setPendingJids([]);
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
                  <div className="flex gap-2">
                    <input
                      maxLength={100}
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSearchClick}
                      disabled={busy || searching || !groupName.trim()}
                      aria-label="Buscar grupos no WhatsApp"
                      className="flex shrink-0 items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <Search className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </label>

                {selectedGroups.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Grupos selecionados
                      </p>
                      <button
                        type="button"
                        onClick={clearSelectedGroups}
                        disabled={busy}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-60"
                      >
                        Limpar seleção
                      </button>
                    </div>
                    <ul className="flex flex-wrap gap-2">
                      {selectedGroups.map((group) => (
                        <li
                          key={group.jid}
                          className="inline-flex max-w-full items-center gap-1 rounded-lg border border-slate-200 bg-white py-1 pl-2.5 pr-1 text-sm text-slate-800"
                        >
                          <span className="truncate">{group.name}</span>
                          <button
                            type="button"
                            onClick={() => removeSelectedGroup(group.jid)}
                            disabled={busy}
                            aria-label={`Remover ${group.name}`}
                            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

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
                  <WhatsAppCaptionPreview caption={caption} />
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
                    {sending ? 'A validar…' : 'Enviar'}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <Dialog open={searchOpen} onClose={closeSearchDialog} className="relative z-[60]">
        <DialogBackdrop className="fixed inset-0 bg-slate-950/50" />
        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <DialogPanel className="flex max-h-[min(32rem,85vh)] w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-2xl">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Grupos encontrados
              </DialogTitle>
              <label className="mt-4 flex cursor-pointer items-center gap-2 border-b border-slate-100 pb-3 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={allSearchChecked}
                  onChange={toggleSelectAllSearch}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Selecionar todos
              </label>
              <ul className="mt-2 flex-1 space-y-1 overflow-y-auto pr-1">
                {searchResults.map((group) => (
                  <li key={group.jid}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={Boolean(searchChecked[group.jid])}
                        onChange={() => toggleSearchGroup(group.jid)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-800">{group.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeSearchDialog}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  disabled={searchConfirmDisabled}
                  onClick={confirmSearchSelection}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Confirmar
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={confirmCount != null}
        onClose={() => {
          if (!confirming) {
            setConfirmCount(null);
            setPendingJids([]);
          }
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
                  onClick={() => {
                    setConfirmCount(null);
                    setPendingJids([]);
                  }}
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
