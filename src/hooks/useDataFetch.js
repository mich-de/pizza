import { useState, useEffect } from 'react';

const API_BASE = '/api';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, RETRY_DELAY * (i + 1)));
    }
  }
}

async function fetchJSON(url) {
  const res = await fetchWithRetry(url);
  return res.json();
}

export function useStitchedData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    fetchJSON(`${API_BASE}/data/stitched`)
      .then(async (stitched) => {
        if (!cancelled) {
          setData(stitched);
          setLoading(false);
        }
      })
      .catch(async (err) => {
        if (cancelled) return;
        console.warn('API stitching failed, falling back to static JSON:', err.message);
        try {
          const [locsRes, pizzeRes, pricesRes] = await Promise.all([
            fetch('/data/towns.json'),
            fetch('/data/venues.json'),
            fetch('/data/prices.json'),
          ]);

          if (!locsRes.ok || !pizzeRes.ok || !pricesRes.ok) {
            throw new Error('Failed to fetch fallback data');
          }

          const [locs, venues, prices] = await Promise.all([
            locsRes.json(),
            pizzeRes.json(),
            pricesRes.json(),
          ]);

          const fallback = venues
            .filter(v => v.status !== 'closed')
            .map(v => {
              const priceEntry = prices.find(p => p.pizzeriaId === v.id);
              const townEntry = locs.find(t => t.id === v.cityId);
              return {
                ...v,
                margheritaPrice: priceEntry ? priceEntry.margheritaPrice : 0,
                lastUpdated: priceEntry ? priceEntry.lastUpdated : null,
                priceSource: priceEntry ? priceEntry.source : null,
                cityName: townEntry ? townEntry.name : 'Unknown',
                cityRegion: townEntry ? townEntry.region : '',
              };
            });

          if (!cancelled) {
            setData(fallback);
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            setError('Impossibile caricare i dati. Riprova piÃ¹ tardi.');
            setLoading(false);
          }
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

export function useAllData() {
  const [pizzerias, setPizzerias] = useState([]);
  const [prices, setPrices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    Promise.all([
      fetchJSON(`${API_BASE}/data/venues`),
      fetchJSON(`${API_BASE}/data/prices`),
      fetchJSON(`${API_BASE}/data/towns`),
    ])
      .then(([p, pr, l]) => {
        if (!cancelled) {
          setPizzerias(p);
          setPrices(pr);
          setLocations(l);
          setLoading(false);
        }
      })
      .catch(async (err) => {
        if (cancelled) return;
        console.warn('API failed, falling back to static JSON:', err.message);
        try {
          const [pRes, prRes, lRes] = await Promise.all([
            fetch('/data/venues.json'),
            fetch('/data/prices.json'),
            fetch('/data/towns.json'),
          ]);
          const [p, pr, l] = await Promise.all([pRes.json(), prRes.json(), lRes.json()]);
          if (!cancelled) {
            setPizzerias(p);
            setPrices(pr);
            setLocations(l);
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            setError('Impossibile caricare i dati. Riprova piÃ¹ tardi.');
            setLoading(false);
          }
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { pizzerias, prices, locations, loading, error };
}


