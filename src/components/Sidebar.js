'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const LINKS = [
  {
    href: '/admin',
    label: 'Gerenciamento de grupos',
    Icon: GroupsIcon,
  },
  {
    href: '/products',
    label: 'Produtos',
    Icon: ProductsIcon,
  },
];

function GroupsIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 8v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      />
    </svg>
  );
}

function ProductsIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5M3 6.5 12 2l9 4.5M12 2v13"
      />
    </svg>
  );
}

function LogOutIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
      />
    </svg>
  );
}

function PanelIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5h16M4 12h16M4 19h16"
      />
    </svg>
  );
}

function ChevronIcon({ className, collapsed }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d={collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
      />
    </svg>
  );
}

export function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('sidebar-collapsed') === '1') {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

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
        const { Icon } = link;
        return (
          <Link
            key={link.href}
            href={link.href}
            title={collapsed ? link.label : undefined}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
              collapsed ? 'lg:justify-center lg:px-2' : ''
            } ${
              active
                ? 'bg-emerald-500/20 text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{link.label}</span>
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
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-950 p-5 text-white transition-[width,transform,padding] duration-200 lg:static lg:translate-x-0 ${
          collapsed ? 'lg:w-[4.5rem] lg:p-3' : ''
        } ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div
          className={`mb-6 flex items-start justify-between gap-2 ${
            collapsed ? 'lg:flex-col lg:items-center' : ''
          }`}
        >
          <div className={collapsed ? 'lg:flex lg:justify-center' : ''}>
            <div className={collapsed ? 'hidden lg:flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400' : ''}>
              {collapsed ? <PanelIcon className="h-5 w-5" /> : null}
            </div>
            <div className={collapsed ? 'lg:hidden' : ''}>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Afiliados</p>
              <h1 className="mt-1 text-lg font-semibold">Painel</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className={`hidden shrink-0 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:inline-flex ${
              collapsed ? 'h-10 w-10 items-center justify-center' : 'p-2'
            }`}
          >
            <ChevronIcon className="h-5 w-5" collapsed={collapsed} />
          </button>
        </div>
        {nav}
        <div className={`mt-auto border-t border-white/10 pt-4 ${collapsed ? 'lg:flex lg:flex-col lg:items-center' : ''}`}>
          <div className={collapsed ? 'lg:hidden' : ''}>
            <p className="truncate text-sm font-medium">{user?.name || 'Utilizador'}</p>
            {user?.slug ? (
              <p className="truncate text-xs text-slate-400">/{user.slug}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={leaving}
            title={collapsed ? 'Sair' : undefined}
            className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15 disabled:opacity-60 ${
              collapsed ? 'lg:h-10 lg:w-10 lg:gap-0 lg:px-0' : ''
            }`}
          >
            <LogOutIcon className="h-5 w-5 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>{leaving ? 'A sair…' : 'Sair'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
