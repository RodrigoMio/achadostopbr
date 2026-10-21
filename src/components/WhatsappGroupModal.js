'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

function SelectField({ label, value, onChange, options, getId, getLabel, required }) {
  const selected = options.find((item) => getId(item) === value) || null;

  return (
    <div className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <Listbox value={value || ''} onChange={onChange}>
        <div className="relative">
          <ListboxButton className="relative w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-900">
            {selected ? getLabel(selected) : 'Selecionar…'}
          </ListboxButton>
          <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {options.map((item) => (
              <ListboxOption
                key={getId(item)}
                value={getId(item)}
                className="cursor-pointer px-3 py-2 text-sm data-focus:bg-emerald-50 data-selected:font-semibold"
              >
                {getLabel(item)}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}

export function WhatsappGroupModal({
  open,
  onClose,
  categories,
  row,
  form,
  setForm,
  saving,
  error,
  onSubmit,
}) {
  const inviteUrl = row?.invite_url || '-';

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-950/40" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {row?.name || 'Grupo WhatsApp'}
            </DialogTitle>
            <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">URL</span>
                <input
                  readOnly
                  value={inviteUrl}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </label>

              <SelectField
                label="Categoria"
                required
                value={form.id_group_category}
                onChange={(id) => setForm((current) => ({ ...current, id_group_category: id }))}
                options={categories}
                getId={(item) => item.id_group_category}
                getLabel={(item) => item.title}
              />

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Limite de membros <span className="text-red-600">*</span>
                </span>
                <input
                  type="number"
                  required
                  min={200}
                  max={1024}
                  value={form.max_capacity}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, max_capacity: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Membros</span>
                <input
                  readOnly
                  value={form.current_members}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_active}
                  onClick={() =>
                    setForm((current) => ({ ...current, is_active: !current.is_active }))
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    form.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                      form.is_active ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="sr-only">{form.is_active ? 'Ativo' : 'Inativo'}</span>
              </label>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={saving || !row?.can_save}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
