import { Mail, MessageCircle } from 'lucide-react';
import { LegalLinks } from '@/components/LegalLinks';
import {
  COMPANY,
  CONTACT_EMAIL,
  CONTACT_WHATSAPP_DISPLAY,
  CONTACT_WHATSAPP_WA_ME,
} from '@/lib/constants';

export function SiteFooter({ className = '', tagline = null }) {
  return (
    <footer className={className}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 text-center sm:gap-8 sm:text-left">
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
          <section aria-labelledby="footer-company-heading">
            <h2
              id="footer-company-heading"
              className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-90"
            >
              Dados da empresa
            </h2>
            <address className="space-y-0.5 not-italic leading-relaxed">
              <p className="font-medium opacity-95">{COMPANY.legalName}</p>
              <p>CNPJ {COMPANY.cnpj}</p>
              <p>CEP {COMPANY.cep}</p>
              <p>{COMPANY.street}</p>
              <p>{COMPANY.district}</p>
            </address>
          </section>

          <section aria-labelledby="footer-contact-heading">
            <h2
              id="footer-contact-heading"
              className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-90"
            >
              Contato
            </h2>
            <ul className="space-y-2">
              <li className="flex justify-center sm:justify-start">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 underline-offset-2 hover:underline"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li className="flex justify-center sm:justify-start">
                <a
                  href={`https://wa.me/${CONTACT_WHATSAPP_WA_ME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 underline-offset-2 hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {CONTACT_WHATSAPP_DISPLAY}
                </a>
              </li>
            </ul>
          </section>
        </div>

        {tagline ? <p className="text-center">{tagline}</p> : null}

        <LegalLinks className="justify-center sm:justify-start" />
      </div>
    </footer>
  );
}
