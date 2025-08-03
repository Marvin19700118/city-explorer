
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale } from '@/lib/types';
import en from '@/locales/en.json';
import zh from '@/locales/zh.json';

const translations = { en, zh };

type I18nContextType = {
  i18n: {
    locale: Locale;
    translations: Record<string, string>;
  };
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType | null>(null);

// Helper function to get nested keys
const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || path;
};


export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('zh');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && ['en', 'zh'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem('locale', newLocale);
    setLocaleState(newLocale);
  };
  
  const t = useCallback((key: string): string => {
    return getNestedValue(translations[locale], key);
  }, [locale]);


  const value = {
    i18n: {
      locale,
      translations: translations[locale] as Record<string, string>,
    },
    setLocale,
    t
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
