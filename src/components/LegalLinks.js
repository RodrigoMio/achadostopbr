import Link from 'next/link';

const LINKS = [
  { href: '/terms', label: 'Termos de uso e serviço' },
  { href: '/police', label: 'Políticas de privacidade' },
];

export function LegalLinks({ className = '' }) {
  return (
    <nav aria-label="Documentos legais" className={className}>
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="underline-offset-2 hover:underline">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
