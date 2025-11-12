import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './resources/en.json';
import ko from './resources/ko.json';

const STORAGE_KEY = 'app.language';
const DEFAULT_LANGUAGE = 'ko';

const detectInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && (stored === 'en' || stored === 'ko')) {
    return stored;
  }

  const browser = window.navigator?.language?.split('-')?.[0];
  if (browser && (browser === 'en' || browser === 'ko')) {
    return browser;
  }

  return DEFAULT_LANGUAGE;
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    lng: detectInitialLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (lng) => {
    window.localStorage.setItem(STORAGE_KEY, lng);
  });
}

export default i18n;
