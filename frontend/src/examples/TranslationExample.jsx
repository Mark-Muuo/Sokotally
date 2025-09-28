// Example component showing how to use the new Google Translate API integration

import React from 'react';
import { useTranslation, useTranslateText } from '../hooks/useTranslation';

const TranslationExample = () => {
  // Method 1: Using useTranslation hook for component-level translations
  const { t, isTranslating, changeLanguage, currentLang } = useTranslation({
    en: {
      title: 'Welcome to Sokotally',
      subtitle: 'Manage your kiosk business efficiently',
      button: 'Get Started',
      description: 'Track sales, expenses, and profits in one place'
    }
  });

  // Method 2: Using useTranslateText hook for single text translation
  const { translatedText, isLoading } = useTranslateText('Hello World', 'sw');

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>
      <p>{t.description}</p>
      
      {/* Show loading state during translation */}
      {isTranslating && (
        <div style={{ 
          padding: '10px', 
          background: '#f0f8ff', 
          border: '1px solid #007bff',
          borderRadius: '4px',
          margin: '10px 0'
        }}>
          🔄 Translating content...
        </div>
      )}
      
      <button 
        onClick={() => changeLanguage('sw')}
        disabled={isTranslating}
        style={{
          padding: '10px 20px',
          margin: '10px 5px',
          borderRadius: '4px',
          border: '1px solid #007bff',
          background: '#007bff',
          color: 'white',
          cursor: isTranslating ? 'not-allowed' : 'pointer',
          opacity: isTranslating ? 0.6 : 1
        }}
      >
        {t.button}
      </button>

      {/* Language selector */}
      <div style={{ margin: '20px 0' }}>
        <label>Language: </label>
        <select 
          value={currentLang} 
          onChange={(e) => changeLanguage(e.target.value)}
          disabled={isTranslating}
        >
          <option value="en">English</option>
          <option value="sw">Swahili</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>

      {/* Single text translation example */}
      <div style={{ margin: '20px 0', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
        <h3>Single Text Translation Example:</h3>
        <p><strong>Original:</strong> Hello World</p>
        <p><strong>Translated:</strong> {isLoading ? 'Loading...' : translatedText}</p>
      </div>

      {/* Current language info */}
      <div style={{ margin: '20px 0', fontSize: '14px', color: '#666' }}>
        Current Language: <strong>{currentLang}</strong>
        {isTranslating && ' (Translating...)'}
      </div>
    </div>
  );
};

export default TranslationExample;
