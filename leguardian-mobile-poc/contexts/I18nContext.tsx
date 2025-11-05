import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import locales
import frLocale from '../locales/fr.json';
import enLocale from '../locales/en.json';

export type Language = 'fr' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const locales = {
  fr: frLocale,
  en: enLocale,
};

// Get device locales outside of hook for use in provider initialization
const getDefaultLanguage = (): Language => {
  try {
    // Note: useLocales must be used inside the component, so we use system default here
    // This will be overridden by saved preference on app load
    return 'en';
  } catch (error) {
    console.error('Error detecting device language:', error);
    return 'en';
  }
};

const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return the key path if not found
    }
  }

  return typeof value === 'string' ? value : path;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('language');
      if (saved === 'fr' || saved === 'en') {
        setLanguageState(saved);
      } else {
        // Use device default language
        const defaultLang = getDefaultLanguage();
        setLanguageState(defaultLang);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('language', lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return getNestedValue(locales[language], key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {isLoaded ? children : <>{children}</>}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
