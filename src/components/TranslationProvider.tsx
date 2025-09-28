'use client';

import React, { createContext, useContext } from 'react';

interface TranslationContextType {
  messages: any;
  locale: string;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

export function TranslationProvider({ 
  children, 
  messages, 
  locale 
}: { 
  children: React.ReactNode; 
  messages: any; 
  locale: string; 
}) {
  const t = (key: string): string => {
    const keys = key.split('.');
    let value = messages;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <TranslationContext.Provider value={{ messages, locale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslations(namespace?: string) {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider');
  }

  return (key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return context.t(fullKey);
  };
}

export function useLocale() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useLocale must be used within a TranslationProvider');
  }
  return context.locale;
}