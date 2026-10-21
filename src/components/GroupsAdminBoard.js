'use client';

import { useState } from 'react';
import { WhatsappGroupModal } from './WhatsappGroupModal';

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

function displayDash(value) {
  if (value === null || value === undefined || value === '') return '-';
  return value;
}

function statusLabel(row) {
  const saved = row.saved;
  if (!saved) return '-';
  return saved.is_active ? 'Ativo' : 'Inativo';
}

function formFromRow(row) {
  const saved = row.saved;
  return {
    id_group_category: saved?.id_group_category ?? '',
    max_capacity: saved?.max_capacity ?? 1000,
    current_members: row.current_members ?? 0,
    is_active: saved?.is_active ?? true,
  };
}

export function GroupsAdminBoard({ categories, initialPrefix = '' }) {
  const [prefix, setPrefix] = useState(initialPrefix || '');
  const [groups, setGroups] = useState([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [form, setForm] = useState({
    id_group_category: '',
    max_capacity: 1000,
    current_members: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }

  async function handleSearch(event) {
    event?.preventDefault?.();
    setSearchError('');
    setSearching(true);
    try {
      const response = await fetch('/api/whatsapp/groups/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: prefix.trim() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao buscar grupos.');
      }
      setGroups(payload.groups ?? []);
      setSearched(true);
    } catch (err) {
      setSearchError(err.message || 'Falha ao buscar grupos.');
      setGroups([]);
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }

  function openEdit(row) {
    setActiveRow(row);
    setForm(formFromRow(row));
    setSaveError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setActiveRow(null);
    setSaveError('');
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!activeRow?.can_save) {
      setSaveError(
        'Não foi possível obter o link de convite deste grupo. Verifique se a conta WhatsApp é admin do grupo.',
      );
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const response = await fetch('/api/whatsapp/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsapp_group_id: activeRow.whatsapp_group_id,
          title: activeRow.name,
          invite_code: activeRow.invite_code,
          id_group_category: form.id_group_category,
          max_capacity: Number(form.max_capacity),
          current_members: activeRow.current_members,
          is_active: form.is_active,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Falha ao salvar grupo.');
      }

      const saved = payload.group;
      setGroups((current) =>
        current.map((row) =>
          row.whatsapp_group_id === saved.whatsapp_group_id
            ? {
                ...row,
                saved,
              }
            : row,
        ),
      );
      setModalOpen(false);
      setActiveRow(null);
      showToast('Grupo salvo com sucesso.');
    } catch (err) {
      setSaveError(err.message || 'Falha ao salvar grupo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciamento de grupos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Busque grupos do WhatsApp pelo prefixo do nome e cadastre categoria e limites.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
      >
        <label className="block flex-1">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Nome do grupo</span>
          <input
            type="text"
            maxLength={100}
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="Prefixo do nome no WhatsApp"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={searching || !prefix.trim()}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {searching ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {searchError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {searchError}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Nome do grupo</th>
              <th className="px-4 py-3 font-semibold">URL</th>
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold">Limite de membros</th>
              <th className="px-4 py-3 font-semibold">Membros</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">
                <span className="sr-only">Editar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {!searched ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Realize a busca para exibir os grupos
                </td>
              </tr>
            ) : groups.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Nenhum grupo encontrado para este prefixo.
                </td>
              </tr>
            ) : (
              groups.map((row) => (
                <tr key={row.whatsapp_group_id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{displayDash(row.name)}</td>
                  <td className="px-4 py-3">
                    {row.invite_url ? (
                      <a
                        href={row.invite_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 underline-offset-2 hover:underline"
                      >
                        Entrar no grupo
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3">{displayDash(row.saved?.category?.title)}</td>
                  <td className="px-4 py-3">{displayDash(row.saved?.max_capacity)}</td>
                  <td className="px-4 py-3">{displayDash(row.current_members)}</td>
                  <td className="px-4 py-3">{statusLabel(row)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                      aria-label={`Editar ${row.name}`}
                    >
                      <PencilIcon />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast ? (
        <p className="fixed bottom-6 right-6 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </p>
      ) : null}

      <WhatsappGroupModal
        open={modalOpen}
        onClose={closeModal}
        categories={categories}
        row={activeRow}
        form={form}
        setForm={setForm}
        saving={saving}
        error={saveError}
        onSubmit={handleSave}
      />
    </section>
  );
}
