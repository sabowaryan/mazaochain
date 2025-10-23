import 'server-only'
import { cache } from 'react'

const dictionaries = {
  en: () => import('../../../messages/en.json').then((module) => module.default),
  fr: () => import('../../../messages/fr.json').then((module) => module.default),
  ln: () => import('../../../messages/ln.json').then((module) => module.default),
} as const;

// Cache dictionary loading per request using React cache
// This prevents multiple loads of the same dictionary during a single request
const loadDictionary = cache(async (locale: 'en' | 'fr' | 'ln') => {
  const normalizedLocale = String(locale).toLowerCase() as 'en' | 'fr' | 'ln';
  
  if (!['en', 'fr', 'ln'].includes(normalizedLocale)) {
    console.warn(`Unsupported locale: ${locale}, falling back to 'en'`);
    return dictionaries.en();
  }
  
  const dictionaryLoader = dictionaries[normalizedLocale];
  if (typeof dictionaryLoader !== 'function') {
    console.error(`Dictionary loader is not a function for locale: ${normalizedLocale}`);
    return dictionaries.en();
  }
  
  try {
    const result = await dictionaryLoader();
    return result;
  } catch (error) {
    console.error(`Failed to load dictionary for ${normalizedLocale}:`, error);
    return dictionaries.en();
  }
});

export const getDictionary = async (locale: 'en' | 'fr' | 'ln') => {
  // Use cached version - only logs once per request now
  return loadDictionary(locale);
}