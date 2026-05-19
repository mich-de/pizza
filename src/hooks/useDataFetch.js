import { useState, useEffect } from 'react';
import { silentFetch } from '../utils/silentFetch';
import { checkAuth } from '../services/authService';

const API_BASE = '/api';

async function fetchFallback(files) {
  const responses = await Promise.all(
    files.map(f => silentFetch(f).then(r => r.ok ? r.json() : null))
  );
  return responses.every(r => r !== null) ? responses : null;
}

let stitchedCache = null;
let stitchedCacheTime = 0;
let allDataCache = null;
let allDataCacheTime = 0;
const DATA_TTL = 30000; // 30 seconds cache for data

export function useStitchedData() {
  const [data, setData] = useState(stitchedCache || []);
  const [loading, setLoading] = useState(!stitchedCache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    if (stitchedCache && now - stitchedCacheTime < DATA_TTL) {
      setLoading(false);
      return;
    }

    setError(null);
    silentFetch(`${API_BASE}/data/stitched`)
      .then(async (res) => {
        if (res.ok) {
          const stitched = await res.json();
          if (!cancelled) {
            stitchedCache = stitched || [];
            stitchedCacheTime = Date.now();
            setData(stitchedCache);
            setLoading(false);
          }
        } else {
          const fallback = await fetchFallback(['/data/towns.json', '/data/venues.json', '/data/prices.json']);
          if (cancelled) return;
          if (!fallback) {
            setError('Impossibile caricare i dati. Riprova più tardi.');
            setLoading(false);
            return;
          }
          const [locs, venues, prices] = fallback;
          const stitchedFallback = venues
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
            stitchedCache = stitchedFallback;
            stitchedCacheTime = Date.now();
            setData(stitchedFallback);
            setLoading(false);
          }
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

export function useAllData() {
  const [pizzerias, setPizzerias] = useState(allDataCache?.pizzerias || []);
  const [prices, setPrices] = useState(allDataCache?.prices || []);
  const [locations, setLocations] = useState(allDataCache?.locations || []);
  const [loading, setLoading] = useState(!allDataCache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    if (allDataCache && now - allDataCacheTime < DATA_TTL) {
      setLoading(false);
      return;
    }

    setError(null);
    silentFetch(`${API_BASE}/data/full`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            allDataCache = { 
              pizzerias: data.venues || [], 
              prices: data.prices || [], 
              locations: data.towns || [] 
            };
            allDataCacheTime = Date.now();
            setPizzerias(allDataCache.pizzerias);
            setPrices(allDataCache.prices);
            setLocations(allDataCache.locations);
            setLoading(false);
          }
        } else {
          // Fallback to individual files if consolidated endpoint fails
          const fallback = await fetchFallback(['/data/venues.json', '/data/prices.json', '/data/towns.json']);
          if (cancelled) return;
          if (!fallback) {
            setError('Impossibile caricare i dati. Riprova più tardi.');
            setLoading(false);
            return;
          }
          if (!cancelled) {
            allDataCache = { pizzerias: fallback[0], prices: fallback[1], locations: fallback[2] };
            allDataCacheTime = Date.now();
            setPizzerias(allDataCache.pizzerias);
            setPrices(allDataCache.prices);
            setLocations(allDataCache.locations);
            setLoading(false);
          }
        }
      });

    return () => { cancelled = true; };
  }, []);

  return { pizzerias, prices, locations, loading, error };
}

let countsCache = null;
let countsCacheTime = 0;
const COUNTS_TTL = 15000; // 15 seconds cache for badge counts

export function usePendingCounts() {
  const [pendingCount, setPendingCount] = useState({ proposals: 0, comments: 0, posts: 0, total: 0 });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      try {
        const user = await checkAuth();
        if (cancelled) return;
        
        if (user && user.role === 'admin') {
          setIsAdmin(true);

          const now = Date.now();
          if (countsCache && now - countsCacheTime < COUNTS_TTL) {
            setPendingCount(countsCache);
            return;
          }
          
          const res = await silentFetch(`${API_BASE}/admin/dashboard-stats`, { credentials: 'include' });

          if (cancelled) return;

          let proposals = 0;
          let comments = 0;
          let posts = 0;

          if (res.ok) {
            const data = await res.json();
            proposals = (data.proposals || []).filter(p => !p.reviewed).length;
            comments = (data.pendingComments || []).filter(c => !c.approved).length;
            posts = (data.pendingFeedPosts || []).filter(p => !p.approved).length;
          }

          if (!cancelled) {
            const newCounts = {
              proposals,
              comments,
              posts,
              total: proposals + comments + posts
            };
            countsCache = newCounts;
            countsCacheTime = Date.now();
            setPendingCount(newCounts);
          }
        } else {
          setIsAdmin(false);
          setPendingCount({ proposals: 0, comments: 0, posts: 0, total: 0 });
        }
      } catch (e) {
        console.error('Error fetching pending counts:', e);
      }
    }
    verify();
    return () => { cancelled = true; };
  }, []);

  return { ...pendingCount, isAdmin };
}
