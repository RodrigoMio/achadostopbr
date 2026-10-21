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

export function ProductModal({
  open,
  onClose,
  categories,
  platforms,
  form,
  setForm,
  saving,
  error,
  onSubmit,
  mode = 'create',
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-950/40" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              {mode === 'edit' ? 'Editar produto' : 'Novo produto'}
            </DialogTitle>
            <form className="mt-5 grid gap-4" onSubmit={onSubmit}>
              <SelectField
                label="Categoria"
                required
                value={form.id_category}
                onChange={(id) => setForm((current) => ({ ...current, id_category: id }))}
                options={categories}
                getId={(item) => item.id_category}
                getLabel={(item) => item.label}
              />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Link do produto <span className="text-red-600">*</span>
                </span>
                <textarea
                  required
                  maxLength={2048}
                  rows={2}
                  value={form.product_link}
                  onChange={(e) => setForm((current) => ({ ...current, product_link: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  URL da imagem <span className="text-red-600">*</span>
                </span>
                <textarea
                  required
                  maxLength={2048}
                  rows={2}
                  value={form.image_link}
                  onChange={(e) => setForm((current) => ({ ...current, image_link: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Link de afiliado <span className="text-red-600">*</span>
                </span>
                <input
                  required
                  maxLength={2048}
                  value={form.affiliated_link}
                  onChange={(e) => setForm((current) => ({ ...current, affiliated_link: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <SelectField
                label="Plataforma"
                required
                value={form.id_platform}
                onChange={(id) => setForm((current) => ({ ...current, id_platform: id }))}
                options={platforms}
                getId={(item) => item.id_platform}
                getLabel={(item) => item.label}
              />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Título (gerado por I.A.)
                </span>
                <input
                  maxLength={100}
                  value={form.title}
                  onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-slate-400">{(form.title || '').length}/100</span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Descrição (gerado por I.A.)
                </span>
                <textarea
                  maxLength={1500}
                  rows={3}
                  value={form.ia_description}
                  onChange={(e) => setForm((current) => ({ ...current, ia_description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <span className="mt-1 block text-xs text-slate-400">{(form.ia_description || '').length}/1500</span>
              </label>

              {error ? (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? 'A guardar…' : 'Salvar'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
