import { translations, Language } from './translations';

// За замовчуванням українська
let currentLanguage: Language = 'uk';

// Ініціалізація з localStorage
if (typeof window !== 'undefined') {
  const savedLang = localStorage.getItem('disgram_language') as Language;
  if (savedLang && (savedLang === 'uk' || savedLang === 'en')) {
    currentLanguage = savedLang;
  }
}

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('disgram_language', lang);
  }
};

export const getLanguage = (): Language => {
  return currentLanguage;
};

export const t = (key: string): string => {
  return translations[currentLanguage][key] || key;
};

export { translations, type Language };
