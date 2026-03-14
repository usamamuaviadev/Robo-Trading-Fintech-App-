import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import MMKVStorage from 'react-native-mmkv-storage';
import en from './locales/en.json';
import ar from './locales/ar.json';

const MMKV = new MMKVStorage.Loader().initialize();

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (cb: (lang: string) => void) => {
    const lang = await MMKV.getStringAsync('user-language');
    cb(lang || 'en');
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    await MMKV.setStringAsync('user-language', lang);
  },
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: {translation: en},
      ar: {translation: ar},
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
