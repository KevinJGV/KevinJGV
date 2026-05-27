import esStrings from './es';
import enStrings from './en';

export type Locale = 'es' | 'en';
export const locales: Locale[] = ['es', 'en'];
export const defaultLocale: Locale = 'es';

const dict = { es: esStrings, en: enStrings };

/** Get string by dotted key path, fallback to ES if missing in target locale. */
export function t(locale: Locale, key: string): string {
  const segments = key.split('.');
  let value: unknown = dict[locale];
  for (const seg of segments) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[seg];
    } else {
      value = undefined;
      break;
    }
  }
  if (typeof value === 'string') return value;
  if (locale !== 'es') return t('es', key);
  return key; // dev signal: missing translation
}

/** Helper for Astro components: returns (key) => string fn bound to the route's locale. */
export function tFor(astro: { currentLocale?: string | undefined }): (key: string) => string {
  const locale: Locale = astro.currentLocale === 'en' ? 'en' : 'es';
  return (key: string) => t(locale, key);
}

/** Map a current path to its equivalent in target locale (for switcher + hreflang). */
export function getAlternatePath(currentPath: string, targetLocale: Locale): string {
  const isCurrentlyEn = currentPath.startsWith('/en/') || currentPath === '/en';
  const baseSegment = isCurrentlyEn
    ? currentPath.replace(/^\/en(\/|$)/, '/')
    : currentPath;
  if (targetLocale === 'en') {
    if (baseSegment === '/') return '/en';
    return '/en' + baseSegment;
  }
  return baseSegment || '/';
}
