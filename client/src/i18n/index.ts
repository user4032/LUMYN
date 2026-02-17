import { translations, Language } from './translations';

let currentLanguage: Language = 'en';

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
};

export const getLanguage = (): Language => {
  return currentLanguage;
};

export const t = (key: string): string => {
  return translations[currentLanguage][key as keyof typeof translations[Language]] || key;
};

export { translations, type Language };
