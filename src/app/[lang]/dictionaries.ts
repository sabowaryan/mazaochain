import 'server-only'

const dictionaries = {
  en: () => import('../../../messages/en.json').then((module) => module.default),
  fr: () => import('../../../messages/fr.json').then((module) => module.default),
  ln: () => import('../../../messages/ln.json').then((module) => module.default),
} as const;

export const getDictionary = async (locale: 'en' | 'fr' | 'ln') => {
  console.log('getDictionary called with locale:', locale, 'type:', typeof locale);
  
  // Ensure locale is a string and one of our supported locales
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
    console.log(`Successfully loaded dictionary for ${normalizedLocale}`);
    return result;
  } catch (error) {
    console.error(`Failed to load dictionary for ${normalizedLocale}:`, error);
    return dictionaries.en();
  }
}