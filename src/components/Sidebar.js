'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const LINKS = [
  { href: '/admin', label: 'Gerenciamento de grupos' },
  { href: '/products', label: 'Produtos' },
];

export function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    setLeaving(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/admin');
      router.refresh();
    }
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`rounded-xl px-3 py-2 text-sm font-medium ${
              active
                ? 'bg-emerald-500/20 text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <p className="font-semibold text-slate-900">Afiliados</p>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          onClick={() => setOpen(true)}
        >
          Menu
        </button>
      </header>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-950 p-5 text-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Afiliados</p>
          <h1 className="mt-1 text-lg font-semibold">Painel</h1>
        </div>
        {nav}
        <div className="mt-auto border-t border-white/10 pt-4">
          <p className="truncate text-sm font-medium">{user?.name || 'Utilizador'}</p>
          {user?.slug ? (
            <p className="truncate text-xs text-slate-400">/{user.slug}</p>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            disabled={leaving}
            className="mt-3 w-full rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:opacity-60"
          >
            {leaving ? 'A sair…' : 'Sair'}
          </button>
        </div>
      </aside>
    </>
  );
}
