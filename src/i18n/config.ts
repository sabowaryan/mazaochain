export const locales = ['en', 'fr', 'ln'] as const;
export const defaultLocale = 'en' as const;

export type Locale = typeof locales[number];