import Link from 'next/link';
import { MessageCircle, ShieldCheck } from 'lucide-react';

const wrapperClass =
  'flex w-full flex-col gap-3 rounded-2xl p-4 shadow-sm transition sm:flex-row sm:items-center sm:gap-4 sm:p-5';

const gradientStyle = {
  background: 'linear-gradient(90deg, #25D366, #128C7E)',
  color: '#fff',
};

function BannerBody({ disabled }) {
  return (
    <>
      <div className="flex w-full min-w-0 items-start gap-3 sm:contents">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-white/10 sm:h-12 sm:w-12"
          aria-hidden
        >
          <MessageCircle className="h-6 w-6 text-white" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/85 sm:text-xs">
            Receba ofertas
          </p>
          <p className="font-display mt-0.5 text-base font-extrabold leading-snug text-white sm:text-lg">
            Escolha um grupo para receber ofertas selecionadas a dedo!
          </p>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-white/90 sm:items-center sm:text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0" strokeWidth={2} aria-hidden />
            <span>Compra 100% segura direto nas plataformas</span>
          </p>
        </div>
      </div>
      <span
        className={`flex w-full items-center justify-center rounded-full bg-white py-2.5 text-sm font-bold shadow-sm sm:w-auto sm:shrink-0 sm:px-4 sm:py-2 sm:text-sm ${
          disabled ? 'text-slate-400' : 'text-[#128C7E]'
        }`}
      >
        {disabled ? 'Grupo em breve' : 'Ver grupos'}
      </span>
    </>
  );
}

export function WhatsAppBanner({ href, disabled = false, className = '' }) {
  if (disabled) {
    return (
      <div
        className={`${wrapperClass} cursor-not-allowed opacity-75 ${className}`.trim()}
        style={gradientStyle}
        aria-disabled="true"
      >
        <BannerBody disabled />
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`${wrapperClass} hover:opacity-95 ${className}`.trim()}
      style={gradientStyle}
      aria-label="Receba ofertas — ver grupos no WhatsApp"
    >
      <BannerBody disabled={false} />
    </Link>
  );
}
