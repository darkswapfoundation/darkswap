/**
 * Internationalization utility for DarkSwap
 * 
 * This utility provides internationalization functions for the DarkSwap application.
 */

import { logger } from './logger';
import { createCache } from './cache';

/**
 * Supported languages
 */
export enum Language {
  EN = 'en', // English
  ES = 'es', // Spanish
  FR = 'fr', // French
  DE = 'de', // German
  JA = 'ja', // Japanese
  ZH = 'zh', // Chinese
  RU = 'ru', // Russian
  KO = 'ko', // Korean
}

/**
 * Language names
 */
export const languageNames: Record<Language, string> = {
  [Language.EN]: 'English',
  [Language.ES]: 'Español',
  [Language.FR]: 'Français',
  [Language.DE]: 'Deutsch',
  [Language.JA]: '日本語',
  [Language.ZH]: '中文',
  [Language.RU]: 'Русский',
  [Language.KO]: '한국어',
};

/**
 * Language direction
 */
export enum LanguageDirection {
  LTR = 'ltr', // Left to right
  RTL = 'rtl', // Right to left
}

/**
 * Language directions
 */
export const languageDirections: Record<Language, LanguageDirection> = {
  [Language.EN]: LanguageDirection.LTR,
  [Language.ES]: LanguageDirection.LTR,
  [Language.FR]: LanguageDirection.LTR,
  [Language.DE]: LanguageDirection.LTR,
  [Language.JA]: LanguageDirection.LTR,
  [Language.ZH]: LanguageDirection.LTR,
  [Language.RU]: LanguageDirection.LTR,
  [Language.KO]: LanguageDirection.LTR,
};

/**
 * Translation storage key
 */
const TRANSLATIONS_KEY = 'darkswap_translations';

/**
 * Language storage key
 */
const LANGUAGE_KEY = 'darkswap_language';

/**
 * Translation cache
 */
const translationCache = createCache<Record<string, string>>({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

/**
 * Get the current language
 * 
 * @returns The current language
 */
export function getCurrentLanguage(): Language {
  try {
    // Get the language from localStorage
    const language = localStorage.getItem(LANGUAGE_KEY);
    
    // If the language doesn't exist, use the browser language
    if (!language) {
      return getBrowserLanguage();
    }
    
    return language as Language;
  } catch (error) {
    logger.error('Failed to get current language', { error });
    
    return Language.EN; // Default to English
  }
}

/**
 * Set the current language
 * 
 * @param language The language to set
 */
export function setCurrentLanguage(language: Language): void {
  try {
    // Store the language in localStorage
    localStorage.setItem(LANGUAGE_KEY, language);
    
    // Set the language direction
    setLanguageDirection(language);
    
    logger.debug(`Set current language to ${language}`);
  } catch (error) {
    logger.error('Failed to set current language', { error });
  }
}

/**
 * Get the browser language
 * 
 * @returns The browser language
 */
export function getBrowserLanguage(): Language {
  try {
    // Get the browser language
    const browserLanguage = navigator.language.split('-')[0];
    
    // Check if the browser language is supported
    if (Object.values(Language).includes(browserLanguage as Language)) {
      return browserLanguage as Language;
    }
    
    return Language.EN; // Default to English
  } catch (error) {
    logger.error('Failed to get browser language', { error });
    
    return Language.EN; // Default to English
  }
}

/**
 * Set the language direction
 * 
 * @param language The language
 */
export function setLanguageDirection(language: Language): void {
  try {
    // Get the language direction
    const direction = languageDirections[language] || LanguageDirection.LTR;
    
    // Set the direction attribute on the html element
    document.documentElement.setAttribute('dir', direction);
    
    logger.debug(`Set language direction to ${direction}`);
  } catch (error) {
    logger.error('Failed to set language direction', { error });
  }
}

/**
 * Get translations for a language
 * 
 * @param language The language
 * @returns The translations
 */
export async function getTranslations(language: Language): Promise<Record<string, string>> {
  try {
    // Check the cache first
    const cachedTranslations = translationCache.get(language);
    
    if (cachedTranslations) {
      return cachedTranslations;
    }
    
    // Load the translations from the server
    const response = await fetch(`/locales/${language}.json`);
    const translations = await response.json();
    
    // Cache the translations
    translationCache.set(language, translations);
    
    // Store the translations in localStorage
    const allTranslations = JSON.parse(localStorage.getItem(TRANSLATIONS_KEY) || '{}');
    allTranslations[language] = translations;
    localStorage.setItem(TRANSLATIONS_KEY, JSON.stringify(allTranslations));
    
    return translations;
  } catch (error) {
    logger.error('Failed to get translations', { error, language });
    
    // Try to get the translations from localStorage
    try {
      const allTranslations = JSON.parse(localStorage.getItem(TRANSLATIONS_KEY) || '{}');
      const translations = allTranslations[language];
      
      if (translations) {
        return translations;
      }
    } catch (storageError) {
      logger.error('Failed to get translations from localStorage', { error: storageError });
    }
    
    return {}; // Return empty translations
  }
}

/**
 * Translate a key
 * 
 * @param key The translation key
 * @param params The translation parameters
 * @param language The language (defaults to the current language)
 * @returns The translated string
 */
export async function translate(
  key: string,
  params: Record<string, string> = {},
  language: Language = getCurrentLanguage()
): Promise<string> {
  try {
    // Get the translations
    const translations = await getTranslations(language);
    
    // Get the translation
    let translation = translations[key] || key;
    
    // Replace parameters
    for (const [param, value] of Object.entries(params)) {
      translation = translation.replace(`{${param}}`, value);
    }
    
    return translation;
  } catch (error) {
    logger.error('Failed to translate key', { error, key, params, language });
    
    return key; // Return the key as a fallback
  }
}

/**
 * Format a date
 * 
 * @param date The date to format
 * @param options The date format options
 * @param language The language (defaults to the current language)
 * @returns The formatted date
 */
export function formatDate(
  date: Date | number,
  options: Intl.DateTimeFormatOptions = {},
  language: Language = getCurrentLanguage()
): string {
  try {
    return new Intl.DateTimeFormat(language, options).format(date);
  } catch (error) {
    logger.error('Failed to format date', { error, date, options, language });
    
    return new Date(date).toISOString(); // Return ISO string as a fallback
  }
}

/**
 * Format a number
 * 
 * @param number The number to format
 * @param options The number format options
 * @param language The language (defaults to the current language)
 * @returns The formatted number
 */
export function formatNumber(
  number: number,
  options: Intl.NumberFormatOptions = {},
  language: Language = getCurrentLanguage()
): string {
  try {
    return new Intl.NumberFormat(language, options).format(number);
  } catch (error) {
    logger.error('Failed to format number', { error, number, options, language });
    
    return number.toString(); // Return string as a fallback
  }
}

/**
 * Format a currency
 * 
 * @param number The number to format
 * @param currency The currency code
 * @param options The number format options
 * @param language The language (defaults to the current language)
 * @returns The formatted currency
 */
export function formatCurrency(
  number: number,
  currency: string = 'USD',
  options: Intl.NumberFormatOptions = {},
  language: Language = getCurrentLanguage()
): string {
  try {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
      ...options,
    }).format(number);
  } catch (error) {
    logger.error('Failed to format currency', { error, number, currency, options, language });
    
    return `${currency} ${number}`; // Return simple format as a fallback
  }
}

/**
 * Format a relative time
 * 
 * @param date The date to format
 * @param options The relative time format options
 * @param language The language (defaults to the current language)
 * @returns The formatted relative time
 */
export function formatRelativeTime(
  date: Date | number,
  options: Intl.RelativeTimeFormatOptions = {},
  language: Language = getCurrentLanguage()
): string {
  try {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((then.getTime() - now.getTime()) / 1000);
    
    const formatter = new Intl.RelativeTimeFormat(language, options);
    
    if (Math.abs(diffInSeconds) < 60) {
      return formatter.format(diffInSeconds, 'second');
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    
    if (Math.abs(diffInMinutes) < 60) {
      return formatter.format(diffInMinutes, 'minute');
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    
    if (Math.abs(diffInHours) < 24) {
      return formatter.format(diffInHours, 'hour');
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (Math.abs(diffInDays) < 30) {
      return formatter.format(diffInDays, 'day');
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    
    if (Math.abs(diffInMonths) < 12) {
      return formatter.format(diffInMonths, 'month');
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    
    return formatter.format(diffInYears, 'year');
  } catch (error) {
    logger.error('Failed to format relative time', { error, date, options, language });
    
    return new Date(date).toISOString(); // Return ISO string as a fallback
  }
}

export default {
  Language,
  languageNames,
  LanguageDirection,
  languageDirections,
  getCurrentLanguage,
  setCurrentLanguage,
  getBrowserLanguage,
  setLanguageDirection,
  getTranslations,
  translate,
  formatDate,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
};