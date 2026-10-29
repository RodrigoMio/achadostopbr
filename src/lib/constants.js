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
