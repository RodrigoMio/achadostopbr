'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, MessageCircle, Moon, Search, Sun } from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LegalLinks } from '@/components/LegalLinks';
import { WhatsAppBanner } from '@/components/showcase/WhatsAppBanner';
import { WhatsAppCard } from '@/components/showcase/WhatsAppCard';
import { getPlatformPresentation } from '@/lib/platforms';

function formatPrice(value) {
  const amount = Number(value) || 0;
  if (amount <= 0) return null;
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function offerCountLabel(count) {
  if (count === 1) return '1 oferta encontrada';
  return `${count} ofertas encontradas`;
}

function CategoryScrollRow({ children }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const overflow = maxScroll > 2;
    setHasOverflow(overflow);
    setCanScrollLeft(overflow && el.scrollLeft > 2);
    setCanScrollRight(overflow && el.scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    el.addEventListener('scroll', updateScrollState, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', updateScrollState);
    };
  }, [updateScrollState, children]);

  const scrollBy = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 220, behavior: 'smooth' });
  };

  const arrowClass =
    'h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-30';

  return (
    <div className="flex min-w-0 items-center gap-1 md:gap-2">
      {hasOverflow ? (
        <button
          type="button"
          className={`${arrowClass} hidden md:inline-flex`}
          aria-label="Categorias anteriores"
          disabled={!canScrollLeft}
          onClick={() => scrollBy(-1)}
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : null}
      <div
        ref={scrollRef}
        className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5"
      >
        {children}
      </div>
      {hasOverflow ? (
        <button
          type="button"
          className={`${arrowClass} hidden md:inline-flex`}
          aria-label="Próximas categorias"
          disabled={!canScrollRight}
          onClick={() => scrollBy(1)}
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      ) : null}
    </div>
  );
}

export function ShowcaseGrid({ profile, products, categories, platforms }) {
  const [platformId, setPlatformId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [query, setQuery] = useState('');
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

  const platformsWithOffers = useMemo(() => {
    const ids = new Set(products.map((p) => String(p.id_platform)));
    return platforms.filter((p) => ids.has(String(p.id_platform)));
  }, [products, platforms]);

  const categoriesWithOffers = useMemo(() => {
    const ids = new Set(products.map((p) => String(p.id_category)));
    return categories.filter((c) => ids.has(String(c.id_category)));
  }, [products, categories]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      if (platformId && String(product.id_platform) !== String(platformId)) return false;
      if (categoryId && String(product.id_category) !== String(categoryId)) return false;
      if (term && !(product.title || '').toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, platformId, categoryId, query]);

  const logoHorizontal = dark ? '/brand/logo-dark.png' : '/brand/logo-light.png';
  const logoVertical = dark ? '/brand/logo-dark-vertical.png' : '/brand/logo-light-vertical.png';
  const slug = profile.slug || '';
  const groupsHref = slug ? `/${slug}/groups` : '#';
  const showPlatformFilter = platformsWithOffers.length > 1;

  const joinGroupStyle =
    'items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-95 sm:px-4 sm:py-2.5';

  return (
    <div className={`showcase ${dark ? 'dark' : ''}`}>
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoVertical}
                alt="AchadosTopBr"
                className="h-10 w-auto object-contain object-left sm:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoHorizontal}
                alt="AchadosTopBr"
                className="hidden h-[100px] w-auto object-contain object-left sm:block"
                style={{ marginTop: -30, marginBottom: -30 }}
              />
            </div>

            <label className="relative flex min-w-0 flex-1 items-center sm:max-w-xl lg:mx-auto">
              <Search
                className="pointer-events-none absolute left-4 h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ofertas..."
                className="w-full rounded-full border border-border bg-card py-2.5 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-[#f59e0b]/40"
              />
            </label>

            <Link
              href={groupsHref}
              aria-label="Entrar no grupo"
              className={`${joinGroupStyle} hidden shrink-0 sm:inline-flex`}
              style={{ background: 'linear-gradient(90deg, #25D366, #128C7E)' }}
            >
              <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={2} />
              Entrar no grupo
            </Link>

            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:opacity-90"
              aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {dark ? (
                <Sun className="h-5 w-5 text-[#f59e0b]" strokeWidth={2} />
              ) : (
                <Moon className="h-5 w-5" strokeWidth={2} />
              )}
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
            {showPlatformFilter ? (
              <div className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto overflow-y-visible rounded-full bg-muted p-1 md:overflow-visible">
                <button
                  type="button"
                  onClick={() => setPlatformId('')}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    platformId === ''
                      ? 'bg-white text-slate-900 ring-2 ring-slate-900/15'
                      : 'border border-border bg-card text-foreground hover:opacity-90'
                  }`}
                >
                  Todas
                </button>
                {platformsWithOffers.map((item) => {
                  const selected = String(platformId) === String(item.id_platform);
                  const pres = getPlatformPresentation(item);
                  return (
                    <button
                      key={item.id_platform}
                      type="button"
                      title={item.label || pres.name}
                      aria-label={item.label || pres.name}
                      onClick={() => setPlatformId(String(item.id_platform))}
                      className={`inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border p-0.5 transition ${
                        selected
                          ? 'border-transparent bg-card ring-2 ring-[#f59e0b] ring-offset-2 ring-offset-muted'
                          : 'border-border bg-card hover:opacity-90'
                      }`}
                    >
                      {pres.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pres.icon}
                          alt=""
                          className="h-[44px] w-[44px] rounded-full object-contain"
                        />
                      ) : (
                        <span className="text-sm font-bold">{pres.name.slice(0, 1)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="min-w-0 flex-1 rounded-full bg-muted p-1">
              <CategoryScrollRow>
                <button
                  type="button"
                  onClick={() => setCategoryId('')}
                  className={`inline-flex shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
                    categoryId === ''
                      ? 'bg-gradient-brand text-white shadow'
                      : 'text-foreground hover:opacity-80'
                  }`}
                >
                  Todas
                </button>
                {categoriesWithOffers.map((item) => {
                  const selected = String(categoryId) === String(item.id_category);
                  return (
                    <button
                      key={item.id_category}
                      type="button"
                      onClick={() => setCategoryId(String(item.id_category))}
                      className={`inline-flex shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm ${
                        selected
                          ? 'bg-gradient-brand text-white shadow'
                          : 'text-foreground hover:opacity-80'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </CategoryScrollRow>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 pb-24 sm:px-6 sm:py-8 sm:pb-8">
        <div className="mb-5">
          <WhatsAppBanner href={groupsHref} />
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{offerCountLabel(filtered.length)}</p>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center text-muted-foreground">
            Nenhuma oferta corresponde aos filtros aplicados. Tente outra busca ou remova algum
            filtro.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(0,242px))] md:justify-start md:gap-5">
            {filtered.map((product, i) => {
              const titleLabel = product.title?.trim() || '';
              const price = formatPrice(product.price);
              const oldPrice =
                product.oldPrice != null && Number(product.oldPrice) > 0
                  ? formatPrice(product.oldPrice)
                  : null;
              const pres = getPlatformPresentation(product.platform);
              let discountPct = null;
              if (
                oldPrice &&
                price &&
                Number(product.oldPrice) > Number(product.price) &&
                Number(product.price) > 0
              ) {
                discountPct = Math.round(
                  (1 - Number(product.price) / Number(product.oldPrice)) * 100,
                );
              }

              return (
                <Fragment key={product.id_product}>
                <li className="min-w-0 md:max-w-[242px]">
                  <article className="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl md:max-w-[242px]">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {product.image_link ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_link}
                          alt={titleLabel || 'Produto'}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : null}
                      {pres.icon ? (
                        <span className="absolute left-2 top-2 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-card shadow-sm sm:left-3 sm:top-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pres.icon}
                            alt=""
                            className="h-[22px] w-[22px] rounded-full object-contain"
                          />
                        </span>
                      ) : null}
                      {discountPct != null && discountPct > 0 ? (
                        <span className="bg-gradient-brand absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold text-white shadow sm:right-3 sm:top-3">
                          -{discountPct}%
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-2.5 sm:p-4">
                      {product.category?.label ? (
                        <span className="inline-block max-w-min truncate rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-200/90 dark:text-sky-950 sm:text-[11px]">
                          {product.category.label}
                        </span>
                      ) : null}
                      <h2 className="font-display line-clamp-2 text-sm font-bold text-foreground sm:text-base">
                        {titleLabel || '—'}
                      </h2>
                      {product.ia_description ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                          {product.ia_description}
                        </p>
                      ) : null}
                      <div className="mt-auto space-y-0.5 pt-1">
                        {oldPrice ? (
                          <p className="text-xs text-muted-foreground line-through">{oldPrice}</p>
                        ) : null}
                        {price ? (
                          <p className="font-display text-lg font-extrabold text-foreground sm:text-xl">
                            {price}
                          </p>
                        ) : null}
                      </div>
                      <a
                        href={product.affiliated_link}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        style={{ backgroundColor: pres.bg, color: pres.fg }}
                        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition hover:opacity-90"
                      >
                        {pres.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={pres.icon}
                            alt=""
                            className="h-[22px] w-[22px] rounded-full object-contain"
                          />
                        ) : null}
                        <span className="sm:hidden">Comprar</span>
                        <span className="hidden sm:inline">Comprar no {pres.name}</span>
                      </a>
                    </div>
                  </article>
                </li>
                {(i + 1) % 11 === 0 ? (
                  <li className="min-w-0 md:max-w-[242px]">
                    <div className="w-full md:max-w-[242px]">
                      <WhatsAppCard href={groupsHref} />
                    </div>
                  </li>
                ) : null}
                </Fragment>
              );
            })}
          </ul>
        )}
      </main>

      <footer className="px-4 pb-28 pt-8 text-center text-xs text-muted-foreground sm:pb-10">
        <LegalLinks />
      </footer>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/95 p-3 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <Link
          href={groupsHref}
          className={`${joinGroupStyle} flex w-full sm:hidden`}
          style={{ background: 'linear-gradient(90deg, #25D366, #128C7E)' }}
        >
          <MessageCircle className="h-5 w-5 shrink-0" strokeWidth={2} />
          Entrar no grupo
        </Link>
      </div>
    </div>
  );
}
