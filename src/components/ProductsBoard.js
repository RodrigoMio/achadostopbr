'use client';

import { useEffect, useMemo, useState } from 'react';
import { STATUS } from '@/lib/constants';
import { ProductModal } from './ProductModal';
import { PromptIaModal } from './PromptIaModal';
import { StatusBadge } from './StatusBadge';
import { WhatsAppSendModal } from './WhatsAppSendModal';

const EMPTY_FORM = {
  id_category: '',
  product_link: '',
  image_link: '',
  affiliated_link: '',
  id_platform: '',
  title: '',
  ia_description: '',
};

const PAGE_SIZE = 12;

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function formatPrice(value) {
  const amount = Number(value) || 0;
  if (amount <= 0) return '-';
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function displayText(value) {
  return value?.trim() ? value : '-';
}

function formFromProduct(product) {
  return {
    id_category: product.id_category ?? '',
    product_link: product.product_link ?? '',
    image_link: product.image_link ?? '',
    affiliated_link: product.affiliated_link ?? '',
    id_platform: product.id_platform ?? '',
    title: product.title ?? '',
    ia_description: product.ia_description ?? '',
  };
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.86 4.49 1.69-1.69a1.88 1.88 0 0 1 2.65 2.65l-9.62 9.62a4.5 4.5 0 0 1-1.9 1.13L6 18l.8-2.69a4.5 4.5 0 0 1 1.13-1.89z"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.86 4.49 19.5 7.13"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7zM12.05 20.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.14.82.84-3.06-.2-.31a8.18 8.18 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.22-8.23 8.22m4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.16.25-.64.8-.79.97-.15.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29"
      />
    </svg>
  );
}

export function ProductsBoard({
  initialProducts,
  categories,
  platforms,
  initialPrompt = '',
  initialWhatsappGroupName = '',
}) {
  const [products, setProducts] = useState(initialProducts);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptIa, setPromptIa] = useState(initialPrompt || '');
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptError, setPromptError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(1);
  const [waProduct, setWaProduct] = useState(null);
  const [whatsappGroupName, setWhatsappGroupName] = useState(initialWhatsappGroupName || '');

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, currentPage]);

  function replaceProduct(product) {
    setProducts((current) =>
      current.map((item) => (item.id_product === product.id_product ? product : item)),
    );
  }

  function closeModal() {
    if (saving) return;
    setOpen(false);
    setEditingId(null);
    setError('');
  }

  function closePromptModal() {
    if (promptSaving) return;
    setPromptOpen(false);
    setPromptError('');
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setOpen(true);
  }

  function openEdit(product) {
    setEditingId(product.id_product);
    setForm(formFromProduct(product));
    setError('');
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível guardar.');
      }
      if (editingId) {
        replaceProduct(payload.product);
      } else {
        setProducts((current) => [payload.product, ...current]);
        setPage(1);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePromptSubmit(event) {
    event.preventDefault();
    setPromptSaving(true);
    setPromptError('');
    try {
      const response = await fetch('/api/user/prompt-ia', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_ia: promptIa }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível guardar o prompt.');
      }
      setPromptIa(payload.prompt_ia ?? '');
      setPromptOpen(false);
      setToast('Prompt para IA guardado.');
    } catch (err) {
      setPromptError(err.message);
    } finally {
      setPromptSaving(false);
    }
  }

  async function generateAi(id) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/products/${id}/generate`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Falha na IA');
      replaceProduct(payload.product);
    } catch (err) {
      setToast(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleVitrine(product) {
    const nextStatus =
      product.id_status === STATUS.PROMOTED ? STATUS.TO_PROMOTE : STATUS.PROMOTED;
    setBusyId(product.id_product);
    try {
      const response = await fetch(`/api/products/${product.id_product}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_status: nextStatus }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Falha ao atualizar');
      replaceProduct(payload.product);
    } catch (err) {
      setToast(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Meus produtos publicados</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre ofertas, configure o prompt, gere o texto com IA e libere na vitrine.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPromptError('');
              setPromptOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Prompt para IA
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Novo produto
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Plataforma</th>
                <th className="px-4 py-3 font-semibold">Preço</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Criação</th>
                <th className="px-4 py-3 font-semibold">Envio WhatsApp</th>
                <th className="px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                    Nenhum produto cadastrado ainda.
                  </td>
                </tr>
              ) : (
                visible.map((product) => (
                  <tr key={product.id_product} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{displayText(product.title)}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {displayText(product.ia_description)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.category?.label || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{product.platform?.label || '-'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {product.whatsapp_sent
                        ? formatDate(product.whatsapp_sent)
                        : 'Não enviado'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          title="Editar"
                          aria-label="Editar produto"
                          onClick={() => openEdit(product)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          title="Envio WhatsApp"
                          aria-label="Enviar pelo WhatsApp"
                          onClick={() => setWaProduct(product)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        >
                          <WhatsAppIcon />
                        </button>
                        {product.id_status === STATUS.GENERATE_IA ? (
                          <button
                            type="button"
                            disabled={busyId === product.id_product}
                            onClick={() => generateAi(product.id_product)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
                          >
                            {busyId === product.id_product ? 'A gerar…' : 'Gerar IA'}
                          </button>
                        ) : null}
                        {product.id_status === STATUS.TO_PROMOTE ||
                        product.id_status === STATUS.PROMOTED ? (
                          <button
                            type="button"
                            disabled={busyId === product.id_product}
                            onClick={() => toggleVitrine(product)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
                          >
                            {product.id_status === STATUS.PROMOTED
                              ? 'Ocultar da vitrine'
                              : 'Mostrar na vitrine'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500">
            {currentPage} / {pageCount}
          </span>
          <button
            type="button"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      ) : null}

      {toast ? (
        <div
          className="fixed bottom-4 right-4 z-[80] max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
          role="status"
        >
          {toast}
        </div>
      ) : null}

      <ProductModal
        open={open}
        onClose={closeModal}
        categories={categories}
        platforms={platforms}
        form={form}
        setForm={setForm}
        saving={saving}
        error={error}
        onSubmit={handleSubmit}
        mode={editingId ? 'edit' : 'create'}
      />

      <PromptIaModal
        open={promptOpen}
        onClose={closePromptModal}
        value={promptIa}
        onChange={setPromptIa}
        saving={promptSaving}
        error={promptError}
        onSubmit={handlePromptSubmit}
      />

      <WhatsAppSendModal
        open={Boolean(waProduct)}
        product={waProduct}
        initialGroupName={whatsappGroupName}
        onClose={() => setWaProduct(null)}
        onProductUpdated={replaceProduct}
        onGroupNameSaved={setWhatsappGroupName}
        onToast={setToast}
      />
    </section>
  );
}
