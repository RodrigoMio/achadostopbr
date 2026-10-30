export const STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  BLOCKED: 3,
  GENERATE_IA: 4,
  TO_PROMOTE: 5,
  PROMOTED: 6,
};

export const SESSION_COOKIE = 'aw_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const COMPANY = {
  legalName: 'AMORE ROUPAS E ACESSORIOS LTDA',
  cnpj: '61.763.971/0001-88',
  cep: '38.045-220',
  street: 'R JOAO BATISTA JACQUES GONCALVES, 426',
  district: 'PARQUE DAS AMÉRICAS - UBERABA - MG',
};

export const CONTACT_EMAIL = 'achadostopbr.ofertas@gmail.com';
export const CONTACT_WHATSAPP_DISPLAY = '(34) 99948-5985';
export const CONTACT_WHATSAPP_WA_ME = '5534999485985';

/** Rotas do app — não tratar como slug de vitrine */
export const RESERVED_SLUGS = new Set([
  'admin',
  'products',
  'api',
  'webhook',
  'police',
  'terms',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);
