import { useState } from 'react';
import { CATEGORY_BADGE_COLORS } from '../../config/exploreConfig';
import PriceProposalForm from './PriceProposalForm';

function PriceQuickReport({ pizzeriaId, pizzeriaName, currentPrice, onReport }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onReport?.(); }}
      className="inline-flex items-center gap-1 text-xs font-headline font-bold uppercase tracking-widest text-on-secondary bg-secondary border-2 border-primary px-2 py-1 hover:bg-secondary-container hover:text-secondary transition-colors shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
    >
      <span className="material-symbols-outlined text-sm">edit_note</span>
      Segnala prezzo
    </button>
  );
}


export default function ExploreCards({ filtered, stats, t, lang, onSelect, onReportPrice }) {

  const handleCardClick = (pz) => {
    onSelect?.(pz);
  };

  const handleReportClick = (pz, e) => {
    e.stopPropagation();
    onReportPrice?.(pz);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
      {filtered.map((pz, idx) => (
        <article
          key={pz.id}
          onClick={() => handleCardClick(pz)}
          className="bg-surface border-4 border-primary shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col group relative overflow-hidden hover:-translate-y-1 transition-transform cursor-pointer"
        >
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1">
                <h3 className="text-xl font-headline font-black uppercase group-hover:text-tertiary transition-colors leading-tight">{pz.name}</h3>
                <p className="font-body text-on-surface-variant text-xs flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {pz.frazione ? `${pz.frazione}, ${pz.address}` : pz.address}
                </p>
                <p className="font-body text-on-surface-variant text-xs">{pz.cityName}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <div className="font-headline font-bold text-lg text-primary">
                  {t('common.euro')}{pz.margheritaPrice?.toFixed(2)}
                </div>
                <div className="flex items-center justify-end gap-1 font-label font-bold text-xs">
                  <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {pz.rating}
                </div>
              </div>
            </div>
            <p className="font-body text-on-surface-variant text-xs mb-3 flex-1">{lang === 'it' ? (pz.descriptionIt || pz.description) : pz.description}</p>
            <div className="border-t-2 border-primary pt-3 mt-auto flex items-center justify-between">
              <button
                onClick={(e) => handleReportClick(pz, e)}
                className="inline-flex items-center gap-1 text-xs font-headline font-bold uppercase tracking-widest text-on-secondary bg-secondary border-2 border-primary px-2 py-1 hover:bg-secondary-container hover:text-secondary transition-colors shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
              >
                <span className="material-symbols-outlined text-sm">edit_note</span>
                Segnala prezzo
              </button>
              <div className="flex gap-2">
                <a
                  href={pz.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pz.name + ' ' + pz.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-primary text-on-primary font-label font-bold uppercase text-xs py-1.5 px-3 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-secondary hover:border-secondary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="material-symbols-outlined text-sm">map</span>
                  Maps
                </a>
                {pz.tripadvisor && (
                  <a
                    href={pz.tripadvisor}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-[#34E0A1] text-[#0d4030] font-label font-bold uppercase text-xs py-1.5 px-3 border-2 border-[#1a9b6e] shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] hover:bg-[#1a9b6e] hover:text-white transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="material-symbols-outlined text-sm">travel_explore</span>
                    TripAdvisor
                  </a>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
