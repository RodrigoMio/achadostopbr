import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

const baseClass =
  'flex flex-col items-start gap-3 rounded-2xl p-4 shadow-sm transition sm:flex-row sm:items-center sm:p-5';

const gradientStyle = {
  background: 'linear-gradient(90deg, #25D366, #128C7E)',
  color: '#fff',
};

export function WhatsAppBanner({ href, disabled = false, className = '' }) {
  const content = (
    <>
      <MessageCircle className="h-9 w-9 shrink-0" strokeWidth={1.5} />
      <div className="flex-1">
        <p className="font-display text-base font-extrabold leading-tight sm:text-lg">
          Receba ofertas e promoções relâmpago antes de todo mundo
        </p>
        <p className="mt-0.5 text-xs opacity-90 sm:text-sm">
          Entre no Grupo Achados TOP · Ofertas verificadas pelo nosso time
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full bg-card px-4 py-2 text-xs font-bold shadow-sm sm:text-sm ${
          disabled ? 'text-muted-foreground' : 'text-[#128C7E]'
        }`}
      >
        {disabled ? 'Grupo em breve' : 'Ver grupos'}
      </span>
    </>
  );

  if (disabled) {
    return (
      <div
        className={`${baseClass} cursor-not-allowed opacity-75 ${className}`.trim()}
        style={gradientStyle}
        aria-disabled="true"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseClass} hover:opacity-95 ${className}`.trim()}
      style={gradientStyle}
    >
      {content}
    </Link>
  );
}
