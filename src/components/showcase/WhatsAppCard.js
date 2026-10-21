import Link from 'next/link';
import { BadgeCheck, MessageCircle, Users } from 'lucide-react';

export function WhatsAppCard({ href, disabled = false }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border dark:border-border">
      <div
        className="relative grid aspect-square place-items-center"
        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
      >
        <MessageCircle
          className="h-16 w-16 text-white transition-transform duration-300 group-hover:scale-110 sm:h-24 sm:w-24"
          strokeWidth={1.5}
        />
        <span className="absolute left-2 top-2 rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-[#128C7E] shadow-sm sm:text-[11px]">
          Entre no Grupo Achados TOP
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <span className="flex w-fit max-w-full items-center gap-1 truncate rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
          <BadgeCheck className="h-3 w-3 shrink-0 text-[#128C7E]" />
          Ofertas verificadas pelo nosso time
        </span>

        <h3 className="font-display text-sm font-bold leading-snug sm:text-base">
          Receba ofertas e promoções relâmpago antes de todo mundo
        </h3>

        {disabled ? (
          <span
            className="mt-auto flex cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-muted px-2 py-2 text-xs font-bold text-muted-foreground sm:text-sm"
            aria-disabled="true"
          >
            <Users className="h-4 w-4" /> Grupo em breve
          </span>
        ) : (
          <Link
            href={href}
            className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-2 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 sm:text-sm"
          >
            <Users className="h-4 w-4" /> Ver grupos
          </Link>
        )}
      </div>
    </article>
  );
}
