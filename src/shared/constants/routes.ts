export const Routes = {
  HOME: '/',
  ABOUT: '/about',
  SERVICES: '/services',
  SERVICE_DETAIL: (id: string) => `/services/${id}` as const,
  PORTFOLIO: '/portfolio',
  PORTFOLIO_DETAIL: (id: string) => `/portfolio/${id}` as const,
  REVIEWS: '/reviews',
  CONTACTS: '/contacts',
} as const;

export const SITE = {
  NAME: 'ihornone',
  URL: 'https://ihornone.site',
  LOCALE: 'uk_UA',
} as const;
