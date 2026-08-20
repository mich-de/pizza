import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { formatAmount } from '../utils/formatAmount';

// eslint-disable-next-line react-refresh/only-export-components
export const I18nContext = createContext();

const STORAGE_KEY = 'pizza-peninsula-lang';

async function loadTranslations(lang) {
  const res = await fetch(`/data/i18n/${lang}.json`);
  if (!res.ok) throw new Error(`Translation file not found: ${lang}`);
  return res.json();
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'it');
  const [translations, setTranslations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTranslations(lang).then((data) => {
      setTranslations(data);
      setLoading(false);
    });
  }, [lang]);

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const t = useCallback(
    (key, params) => {
      if (!translations) return key;
      let value = getNestedValue(translations, key);
      if (typeof value !== 'string') return key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, v);
        });
      }
      return value;
    },
    [translations]
  );

  /* Il denaro esce da qui come il testo, e per la stessa ragione.
     `formatAmount(valore, lang)` esisteva gia', ma voleva `lang` in mano: chi
     stava tre componenti sotto non ce l'aveva e ripiegava su `toFixed(2)`, che
     scrive il punto anche in italiano — «€ 7.85» in una pagina dove tutto il
     resto dice «7,85». Passandolo per il contesto la lingua se la prende da
     sola, e nessuno ha piu' motivo di arrangiarsi. */
  const money = useCallback((value) => formatAmount(value, lang), [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, money, loading }}>
      {children}
    </I18nContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
