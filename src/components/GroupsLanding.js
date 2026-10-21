'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  Baby,
  Cpu,
  Dumbbell,
  Flower2,
  Folder,
  MessageCircle,
  Moon,
  Rainbow,
  Search,
  Shirt,
  Sofa,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { buildWhatsAppGroupInviteUrl } from '@/lib/whatsappInvite';

const CATEGORY_STYLES = {
  Mulher: { icon: Flower2, color: '#E91E63' },
  'Esporte & Fitness': { icon: Dumbbell, color: '#FF6D00' },
  'Casa & Decor': { icon: Sofa, color: '#8D6E63' },
  'Infantil & Bebê': { icon: Baby, color: '#29B6F6' },
  Homem: { icon: Shirt, color: '#1E3A8A' },
  Tecnologia: { icon: Cpu, color: '#7C3AED' },
  'Rainbow & Diversidade': { icon: Rainbow, color: '#EC4899' },
  'Raibow & Diversidade': { icon: Rainbow, color: '#EC4899' },
};

const PILLARS = [
  {
    icon: Search,
    title: 'Nosso time está sempre buscando',
    description:
      'Garimpamos todos os dias as melhores ofertas no Mercado Livre, Shopee, Amazon e Magalu.',
  },
  {
    icon: BadgeCheck,
    title: 'Ofertas verificadas',
    description: 'Cada promoção é conferida pelo nosso time antes de chegar até você.',
  },
  {
    icon: Sparkles,
    title: 'Escolha seu interesse',
    description: 'Entre só nos grupos das categorias que combinam com você.',
  },
];

function getCategoryVisual(title) {
  return CATEGORY_STYLES[title] || { icon: Folder, color: '#64748B' };
}

export function GroupsLanding({ profile, categories }) {
  const [dark, setDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') setDark(true);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark, themeReady]);

  const logoSrc = dark ? '/brand/logo-dark.png' : '/brand/logo-light.png';
  const showcaseHref = `/${profile.slug}`;
  const hasGroups = categories.length > 0;

  return (
    <div className={`showcase ${dark ? 'dark' : ''}`}>
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:px-6 sm:py-3">
          <Link href={showcaseHref} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="Buscador de Ofertas"
              className="h-10 w-auto object-contain object-left sm:h-14"
            />
          </Link>
          <div className="flex-1" />
          <Link
            href={showcaseHref}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-semibold shadow-sm transition hover:bg-muted sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Ver ofertas
          </Link>
          <button
            type="button"
            onClick={() => setDark((value) => !value)}
            aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card shadow-sm transition hover:bg-muted sm:h-11 sm:w-11"
          >
            {dark ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {hasGroups ? (
        <>
          <section
            className="px-3 py-12 text-center text-white sm:py-20"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
          >
            <MessageCircle
              className="mx-auto h-14 w-14 sm:h-20 sm:w-20"
              strokeWidth={1.5}
              aria-hidden
            />
            <h1 className="mx-auto mt-4 max-w-3xl font-display text-3xl font-extrabold leading-tight sm:text-5xl">
              Faça parte do Grupo Achados TOP
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm opacity-95 sm:text-lg">
              Receba ofertas e promoções relâmpago antes de todo mundo, direto no seu WhatsApp. É
              grátis!
            </p>
          </section>

          <main className="mx-auto max-w-6xl px-3 py-10 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {PILLARS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl bg-card p-5 shadow-sm dark:border dark:border-border"
                >
                  <Icon className="h-7 w-7 text-amber-500" aria-hidden />
                  <p className="mt-2 font-display font-bold">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>

            <h2 className="mt-12 text-center font-display text-2xl font-extrabold sm:text-3xl">
              Escolha seu grupo
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const visual = getCategoryVisual(category.title);
                const IconComponent = visual.icon;

                return (
                  <div
                    key={category.id_group_category}
                    className="flex flex-col rounded-2xl bg-card p-5 shadow-sm dark:border dark:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-sm"
                        style={{ background: visual.color }}
                      >
                        <IconComponent className="h-5 w-5" aria-hidden />
                      </span>
                      <p className="font-display text-xl font-extrabold">{category.title}</p>
                    </div>

                    {category.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {category.description}
                      </p>
                    ) : null}

                    <div className="mt-auto flex flex-col gap-2 pt-4">
                      {category.groups.map((group, index) => {
                        const href = buildWhatsAppGroupInviteUrl(group.invite_code);
                        if (!href) return null;
                        return (
                          <a
                            key={group.id_whatsapp_group}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99]"
                          >
                            <MessageCircle className="h-4 w-4" aria-hidden />
                            {`AchadosTop ${category.title} #${index + 1}`}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          <footer className="py-8 text-center text-xs text-muted-foreground">
            Buscador de Ofertas · Grupos AchadosTop
          </footer>
        </>
      ) : (
        <main className="mx-auto max-w-6xl px-3 py-16 sm:px-6">
          <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground sm:text-base">
            Aguardando liberação de novos grupos
          </p>
        </main>
      )}
    </div>
  );
}
