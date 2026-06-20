/**
 * i18n Configuration
 * Supports Arabic and English with RTL/LTR
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ar from './ar.json';
import en from './en.json';

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Set document direction based on language
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  document.documentElement.dir = dir;
  localStorage.setItem('language', lng);
});

// Set initial direction
const initialLang = i18n.language;
const initialDir = initialLang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = initialLang;
document.documentElement.dir = initialDir;

export default i18n;
