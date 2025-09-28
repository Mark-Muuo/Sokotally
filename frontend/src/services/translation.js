// Google Translate API Service
const API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const API_URL = 'https://translation.googleapis.com/language/translate/v2';

// Translation cache to avoid repeated API calls
const translationCache = new Map();

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  sw: 'Swahili',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ar: 'Arabic',
  hi: 'Hindi',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ru: 'Russian'
};

// Default language
export const DEFAULT_LANGUAGE = 'en';

/**
 * Translate text using Google Translate API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (optional, auto-detect if not provided)
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLang, sourceLang = 'auto') {
  if (!text || !text.trim()) return text;
  
  // Check cache first
  const cacheKey = `${text}_${sourceLang}_${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  if (!API_KEY) {
    console.warn('Google Translate API key not found. Using original text.');
    return text;
  }

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        source: sourceLang === 'auto' ? undefined : sourceLang,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.data.translations[0].translatedText;
    
    // Cache the translation
    translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

/**
 * Translate multiple texts in batch
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code
 * @returns {Promise<string[]>} Array of translated texts
 */
export async function translateBatch(texts, targetLang, sourceLang = 'auto') {
  if (!texts || texts.length === 0) return texts;
  
  // Check cache for all texts first
  const results = [];
  const uncachedTexts = [];
  const uncachedIndices = [];
  
  texts.forEach((text, index) => {
    const cacheKey = `${text}_${sourceLang}_${targetLang}`;
    if (translationCache.has(cacheKey)) {
      results[index] = translationCache.get(cacheKey);
    } else {
      uncachedTexts.push(text);
      uncachedIndices.push(index);
    }
  });
  
  // If all texts are cached, return results
  if (uncachedTexts.length === 0) {
    return results;
  }
  
  if (!API_KEY) {
    console.warn('Google Translate API key not found. Using original texts.');
    return texts;
  }

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: uncachedTexts,
        target: targetLang,
        source: sourceLang === 'auto' ? undefined : sourceLang,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    const translations = data.data.translations;
    
    // Cache translations and update results
    translations.forEach((translation, index) => {
      const originalIndex = uncachedIndices[index];
      const originalText = uncachedTexts[index];
      const cacheKey = `${originalText}_${sourceLang}_${targetLang}`;
      
      translationCache.set(cacheKey, translation.translatedText);
      results[originalIndex] = translation.translatedText;
    });
    
    return results;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts; // Return original texts if translation fails
  }
}

/**
 * Translate an object with nested string values
 * @param {Object} obj - Object to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code
 * @returns {Promise<Object>} Translated object
 */
export async function translateObject(obj, targetLang, sourceLang = 'auto') {
  if (!obj || typeof obj !== 'object') return obj;
  
  const translatedObj = {};
  const textsToTranslate = [];
  const textKeys = [];
  
  // Collect all string values
  function collectStrings(currentObj, currentPath = '') {
    for (const [key, value] of Object.entries(currentObj)) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (typeof value === 'string') {
        textsToTranslate.push(value);
        textKeys.push(fullPath);
      } else if (typeof value === 'object' && value !== null) {
        collectStrings(value, fullPath);
      }
    }
  }
  
  collectStrings(obj);
  
  if (textsToTranslate.length === 0) return obj;
  
  // Translate all texts
  const translatedTexts = await translateBatch(textsToTranslate, targetLang, sourceLang);
  
  // Reconstruct the object with translated values
  function reconstructObject(currentObj, currentPath = '') {
    const result = {};
    
    for (const [key, value] of Object.entries(currentObj)) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (typeof value === 'string') {
        const textIndex = textKeys.indexOf(fullPath);
        result[key] = translatedTexts[textIndex] || value;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = reconstructObject(value, fullPath);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
  
  return reconstructObject(obj);
}

/**
 * Clear translation cache
 */
export function clearTranslationCache() {
  translationCache.clear();
}

/**
 * Get cache size
 */
export function getCacheSize() {
  return translationCache.size;
}
