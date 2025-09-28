import { useState, useEffect, useCallback, useMemo } from 'react';
import { translateObject, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../services/translation';

// Global language state
let globalLanguage = localStorage.getItem('sokotally_lang') || DEFAULT_LANGUAGE;
const languageListeners = new Set();

// Function to update global language
function setGlobalLanguage(newLang) {
  globalLanguage = newLang;
  localStorage.setItem('sokotally_lang', newLang);
  languageListeners.forEach(listener => listener(newLang));
}

// Function to get current global language
function getGlobalLanguage() {
  return globalLanguage;
}

/**
 * Custom hook for translation management
 * @param {Object} translations - Object containing translations for different languages
 * @returns {Object} Translation utilities and current translations
 */
export function useTranslation(translations = {}) {
  const [currentLang, setCurrentLang] = useState(getGlobalLanguage);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(translations[currentLang] || translations[DEFAULT_LANGUAGE] || {});

  // Listen for global language changes
  useEffect(() => {
    const handleLanguageChange = (newLang) => {
      setCurrentLang(newLang);
    };

    languageListeners.add(handleLanguageChange);
    return () => {
      languageListeners.delete(handleLanguageChange);
    };
  }, []);

  // Translate content when language changes
  useEffect(() => {
    const translateContent = async () => {
      if (currentLang === DEFAULT_LANGUAGE) {
        // Use original English content
        setTranslatedContent(translations[DEFAULT_LANGUAGE] || translations.en || {});
        return;
      }

      // Check if we have cached translations for this language
      const cachedKey = `translations_${currentLang}`;
      const cached = sessionStorage.getItem(cachedKey);
      
      if (cached) {
        try {
          setTranslatedContent(JSON.parse(cached));
          return;
        } catch (e) {
          // Invalid cache, continue with API translation
        }
      }

      // Translate using Google Translate API
      setIsTranslating(true);
      try {
        const englishContent = translations[DEFAULT_LANGUAGE] || translations.en || {};
        const translated = await translateObject(englishContent, currentLang, DEFAULT_LANGUAGE);
        
        setTranslatedContent(translated);
        
        // Cache the translation
        sessionStorage.setItem(cachedKey, JSON.stringify(translated));
      } catch (error) {
        console.error('Translation failed:', error);
        // Fallback to English content
        setTranslatedContent(translations[DEFAULT_LANGUAGE] || translations.en || {});
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [currentLang, translations]);

  // Function to change language
  const changeLanguage = useCallback((newLang) => {
    if (SUPPORTED_LANGUAGES[newLang]) {
      setGlobalLanguage(newLang);
    }
  }, []);

  // Function to translate a single text
  const translateText = useCallback(async (text, targetLang = currentLang) => {
    if (!text || targetLang === DEFAULT_LANGUAGE) return text;
    
    try {
      const { translateText } = await import('../services/translation');
      return await translateText(text, targetLang, DEFAULT_LANGUAGE);
    } catch (error) {
      console.error('Text translation failed:', error);
      return text;
    }
  }, [currentLang]);

  // Memoized translation object
  const t = useMemo(() => translatedContent, [translatedContent]);

  return {
    t,
    currentLang,
    isTranslating,
    changeLanguage,
    translateText,
    supportedLanguages: SUPPORTED_LANGUAGES,
    setLanguage: changeLanguage // Alias for compatibility
  };
}

/**
 * Hook for simple text translation
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language (optional, uses current language)
 * @returns {Object} Translation result with loading state
 */
export function useTranslateText(text, targetLang) {
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const { currentLang } = useTranslation();

  useEffect(() => {
    const translate = async () => {
      if (!text || targetLang === DEFAULT_LANGUAGE || (targetLang || currentLang) === DEFAULT_LANGUAGE) {
        setTranslatedText(text);
        return;
      }

      setIsLoading(true);
      try {
        const { translateText } = await import('../services/translation');
        const result = await translateText(text, targetLang || currentLang, DEFAULT_LANGUAGE);
        setTranslatedText(result);
      } catch (error) {
        console.error('Text translation failed:', error);
        setTranslatedText(text);
      } finally {
        setIsLoading(false);
      }
    };

    translate();
  }, [text, targetLang, currentLang]);

  return { translatedText, isLoading };
}

// Export global language functions and constants for use outside of React components
export { setGlobalLanguage, getGlobalLanguage, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE };
