import React from 'react';
import type { Translations, Language } from '../i18n';

interface LandingHeroProps {
  t: Translations;
  lang: Language;
  onNavigate: (tab: 'catalog' | 'exercises' | 'faq' | 'knowledge') => void;
  onOpenAssistant: () => void;
  onSearch: (query: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  t,
  onNavigate,
  onOpenAssistant,
  onSearch,
}) => {
  const [searchVal, setSearchVal] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearch(searchVal.trim());
      onNavigate('catalog');
    }
  };

  return (
    <section className="landing-section" aria-label="SIHAT Overview">
      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-badge">
          <span className="hero-badge-dot"></span>
          <span>{t.hero.badge}</span>
        </div>
        <h1 className="hero-headline">{t.hero.title}</h1>
        <p className="hero-subheadline">{t.hero.subtitle}</p>

        {/* Quick Search */}
        <form className="hero-search-form" onSubmit={handleSearchSubmit}>
          <input
            type="search"
            className="hero-search-input"
            placeholder={t.hero.searchPlaceholder}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            aria-label={t.hero.searchPlaceholder}
          />
          <button type="submit" className="hero-search-btn">
            {t.catalog.searchLabel.replace('...', '')}
          </button>
        </form>

        {/* Hero CTAs */}
        <div className="hero-actions">
          <button
            type="button"
            className="primary-action-btn"
            onClick={() => onNavigate('catalog')}
          >
            {t.hero.browseCatalog}
          </button>
          <button
            type="button"
            className="secondary-action-btn"
            onClick={() => onNavigate('exercises')}
          >
            {t.hero.tryExercises}
          </button>
          <button
            type="button"
            className="assistant-action-btn"
            onClick={onOpenAssistant}
          >
            {t.hero.aiGuide}
          </button>
        </div>
      </div>

      {/* Medical Safety Disclaimer Callout */}
      <div className="medical-disclaimer-box" role="note" aria-label="Medical safety notice">
        <div className="disclaimer-header">
          <span className="disclaimer-icon" aria-hidden="true">🛡️</span>
          <span className="disclaimer-badge">{t.disclaimer.badge}</span>
        </div>
        <p className="disclaimer-text">{t.disclaimer.text}</p>
      </div>

      {/* Strategic Pillars / Why SIHAT */}
      <div className="pillars-section">
        <div className="pillars-heading">
          <h2>{t.pillars.title}</h2>
          <p>{t.pillars.subtitle}</p>
        </div>
        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon-wrap" aria-hidden="true">📋</div>
            <h3>{t.pillars.p1Title}</h3>
            <p>{t.pillars.p1Desc}</p>
          </div>
          <div className="pillar-card">
            <div className="pillar-icon-wrap" aria-hidden="true">🔒</div>
            <h3>{t.pillars.p2Title}</h3>
            <p>{t.pillars.p2Desc}</p>
          </div>
          <div className="pillar-card">
            <div className="pillar-icon-wrap" aria-hidden="true">⏱️</div>
            <h3>{t.pillars.p3Title}</h3>
            <p>{t.pillars.p3Desc}</p>
          </div>
          <div className="pillar-card">
            <div className="pillar-icon-wrap" aria-hidden="true">🧭</div>
            <h3>{t.pillars.p4Title}</h3>
            <p>{t.pillars.p4Desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
