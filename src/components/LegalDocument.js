import Link from 'next/link';
import { LegalLinks } from '@/components/LegalLinks';

export const LEGAL_CONTACT_EMAIL = 'achadostopbr.ofertas@gmail.com';
export const LEGAL_UPDATED_AT = '29 de outubro de 2026';

export function LegalDocument({ title, children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-sm font-extrabold text-slate-900">
            AchadosTopBr
          </Link>
          <LegalLinks className="text-xs text-slate-500" />
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Atualizado em {LEGAL_UPDATED_AT}</p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed sm:text-base">{children}</div>
      </article>
    </div>
  );
}

export function LegalSection({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="font-display text-xl font-bold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
