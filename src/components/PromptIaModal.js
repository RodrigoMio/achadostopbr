'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';

export function PromptIaModal({ open, onClose, value, onChange, saving, error, onSubmit }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-950/40" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-2xl">
            <DialogTitle className="shrink-0 text-lg font-semibold text-slate-900">
              Prompt para geração do texto para divulgação
            </DialogTitle>
            <form className="mt-4 flex min-h-0 flex-1 flex-col gap-4" onSubmit={onSubmit}>
              <label className="flex min-h-0 flex-1 flex-col">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Instruções para a IA
                </span>
                <textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  maxLength={8000}
                  className="min-h-[50vh] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm leading-relaxed"
                  placeholder="Descreva o tom, formato e regras do texto de divulgação…"
                />
                <span className="mt-1 block text-xs text-slate-400">{value.length}/8000</span>
              </label>

              {error ? (
                <p className="shrink-0 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex shrink-0 justify-end gap-2">
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
