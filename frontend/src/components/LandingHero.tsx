import React, { useState } from 'react';
import type { Translations, Language } from '../i18n';

interface LandingHeroProps {
  t: Translations;
  lang: Language;
  onNavigate: (tab: 'catalog' | 'exercises' | 'faq' | 'knowledge') => void;
  onOpenAssistant: () => void;
  onSearch: (query: string) => void;
  onSelectCategory?: (slug: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  t,
  lang,
  onNavigate,
  onOpenAssistant,
  onSearch,
  onSelectCategory,
}) => {
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onSearch(searchVal.trim());
      onNavigate('catalog');
    }
  };

  const handleChipClick = (term: string, catSlug?: string) => {
    if (catSlug && onSelectCategory) {
      onSelectCategory(catSlug);
    } else {
      onSearch(term);
    }
    onNavigate('catalog');
  };

  // 10 Disciplines data
  const disciplines = [
    {
      id: 'vision',
      icon: '👁️',
      title: lang === 'ru' ? 'Зрение и контрастность' : lang === 'tj' ? 'Биноӣ ва контраст' : 'Vision & Contrast',
      badge: 'ISO 8596',
      desc: lang === 'ru' ? 'Контрастная чувствительность, оптотипы и зрительное утомление.' : lang === 'tj' ? 'Ҳассосияти контрастӣ ва хастагии чашм.' : 'Contrast sensitivity, optotypes, and visual fatigue.',
    },
    {
      id: 'hearing',
      icon: '👂',
      title: lang === 'ru' ? 'Слух и звуковосприятие' : lang === 'tj' ? 'Шунавоӣ ва дарки садо' : 'Hearing & Auditory',
      badge: 'ISO 8253',
      desc: lang === 'ru' ? 'Пороговые частотные тесты и восприятие речи на фоне шума.' : lang === 'tj' ? 'Санҷиши басомадҳои садо ва дарки гуфтор.' : 'Threshold frequency tests and speech perception in noise.',
    },
    {
      id: 'memory',
      icon: '🧠',
      title: lang === 'ru' ? 'Кратковременная память' : lang === 'tj' ? 'Хотираи кӯтоҳмуддат' : 'Short-Term Memory',
      badge: 'Corsi Span',
      desc: lang === 'ru' ? 'Пространственный спан блоков Корси и оперативный буфер.' : lang === 'tj' ? 'Спани фазоии Корси ва хотираи корӣ.' : 'Corsi blocks spatial span and working memory buffer.',
    },
    {
      id: 'attention',
      icon: '🎯',
      title: lang === 'ru' ? 'Внимание и концентрация' : lang === 'tj' ? 'Диққат ва тамаркуз' : 'Attention & Focus',
      badge: 'Schulte Grid',
      desc: lang === 'ru' ? 'Таблицы Шульте, устойчивость удержания и переключения фокуса.' : lang === 'tj' ? 'Ҷадвалҳои Шулте ва тақсимоти диққат.' : 'Schulte grids, sustained focus, and attentional switching.',
    },
    {
      id: 'wellbeing',
      icon: '🌱',
      title: lang === 'ru' ? 'Эмоциональный баланс' : lang === 'tj' ? 'Мувозинати эҳсосӣ' : 'Emotional Wellbeing',
      badge: 'PHQ-9/GAD-7',
      desc: lang === 'ru' ? 'Стандартизированные опросники настроения и уровней стресса.' : lang === 'tj' ? 'Пурсишномаҳои стандартии рӯҳия ва сатҳи стресс.' : 'Standardized mood screening and stress level markers.',
    },
    {
      id: 'reaction',
      icon: '⚡',
      title: lang === 'ru' ? 'Скорость реакции' : lang === 'tj' ? 'Суръати вокуниш' : 'Reaction Latency',
      badge: 'Latency ms',
      desc: lang === 'ru' ? 'Латентность простого и дифференцировочного зрительного ответа.' : lang === 'tj' ? 'Латентнокии вокуниши чашму ҳаракат бо миллисония.' : 'Simple and discriminative sensorimotor response latency in ms.',
    },
    {
      id: 'coordination',
      icon: '🖐️',
      title: lang === 'ru' ? 'Моторная координация' : lang === 'tj' ? 'Ҳамоҳангии моторӣ' : 'Motor Coordination',
      badge: 'Fitts Law',
      desc: lang === 'ru' ? 'Точность позиционирования курсора и траекторное отслеживание.' : lang === 'tj' ? 'Дақиқии ҳаракати нишоннамо ва санҷиши тремор.' : 'Cursor positioning precision and trajectory tracking.',
    },
    {
      id: 'processing',
      icon: '⚙️',
      title: lang === 'ru' ? 'Скорость обработки' : lang === 'tj' ? 'Суръати коркард' : 'Processing Speed',
      badge: 'DSST / Stroop',
      desc: lang === 'ru' ? 'Тест замены цифровых символов и когнитивная интерференция.' : lang === 'tj' ? 'Ивазкунии рамзҳо ва интерференсияи Струа.' : 'Digital symbol substitution and cognitive interference.',
    },
    {
      id: 'comfort',
      icon: '🪑',
      title: lang === 'ru' ? 'Физический комфорт' : lang === 'tj' ? 'Бароҳатии ҷисмонӣ' : 'Physical Comfort',
      badge: 'Ergonomics',
      desc: lang === 'ru' ? 'Маркеры мышечного напряжения и экранной астенопии.' : lang === 'tj' ? 'Нишондиҳандаҳои шиддати мушакҳо ва хастагии нишаст.' : 'Musculoskeletal strain markers and screen asthenopia.',
    },
    {
      id: 'vitality',
      icon: '🔋',
      title: lang === 'ru' ? 'Повседневная активность' : lang === 'tj' ? 'Фаъолияти рӯзона' : 'Daily Vitality',
      badge: 'PSQI / Vitality',
      desc: lang === 'ru' ? 'Субъективный индекс восстановления и циркадная бодрость.' : lang === 'tj' ? 'Нишондиҳандаи барқароршавӣ ва сифати хоб.' : 'Recovery index, sleep quality awareness, and circadian vigor.',
    },
  ];

  return (
    <div className="landing-wrapper" aria-label="SIHAT Living Clarity Platform">
      {/* 1. HERO SECTION */}
      <section className="hero-clarity-section" id="hero">
        <div className="hero-clarity-grid">
          {/* Left Column: Headlines & Actions */}
          <div className="hero-content-col">
            <div className="eyebrow-pill">
              <span className="calm-pulse-dot" aria-hidden="true"></span>
              <span>{t.hero.badge}</span>
              <span className="eyebrow-sep" aria-hidden="true">•</span>
              <span className="eyebrow-motto">
                {lang === 'ru' ? 'Понимайте состояние своего здоровья' : lang === 'tj' ? 'Саломатии худро беҳтар фаҳмед' : 'Understand Your Health'}
              </span>
            </div>

            <h1 className="hero-display-headline">
              {lang === 'ru' ? (
                <>
                  Понимай <span className="hero-gradient-text">{t.hero.titleHighlight}</span>. Начни с простого.
                </>
              ) : lang === 'tj' ? (
                <>
                  Саломатии <span className="hero-gradient-text">худро фаҳмед</span>. Аз чизи оддӣ оғоз намоед.
                </>
              ) : (
                <>
                  Understand <span className="hero-gradient-text">your health</span>. Start with what is simple.
                </>
              )}
            </h1>

            <p className="hero-lede-desc">{t.hero.subtitle}</p>

            {/* Instant Search Bar */}
            <form className="clarity-search-box" onSubmit={handleSearchSubmit}>
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                type="search"
                className="clarity-search-input"
                placeholder={t.hero.searchPlaceholder}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                aria-label={t.hero.searchPlaceholder}
              />
              <button type="submit" className="clarity-search-submit" aria-label="Submit Search">
                ↵
              </button>
            </form>

            {/* Quick Filter Chips */}
            <div className="quick-chips-row">
              <span className="quick-label">{t.hero.quickJump}</span>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipVision, 'vision')}>
                {t.hero.chipVision}
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipMemory, 'memory')}>
                {t.hero.chipMemory}
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipAttention, 'attention')}>
                {t.hero.chipAttention}
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipHearing, 'hearing')}>
                {t.hero.chipHearing}
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipStress, 'wellbeing')}>
                {t.hero.chipStress}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="hero-action-buttons">
              <button
                type="button"
                className="btn-primary-emerald"
                onClick={() => onNavigate('catalog')}
              >
                <span>{t.hero.browseCatalog}</span>
                <span className="arrow-icon" aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="btn-soft-mint"
                onClick={onOpenAssistant}
              >
                <span className="sparkle-icon" aria-hidden="true">✦</span>
                <span>{t.hero.aiGuide}</span>
              </button>
              <button
                type="button"
                className="btn-ghost-outline"
                onClick={() => onNavigate('exercises')}
              >
                {t.hero.tryExercises}
              </button>
            </div>
          </div>

          {/* Right Column: Floating Bento Card with S-Mark */}
          <div className="hero-bento-col">
            <div className="bento-ambient-glow" aria-hidden="true"></div>
            <div className="glass-card-elevated bento-card">
              <div className="bento-card-header">
                <div className="protocol-info">
                  <div className="shield-symbol" aria-hidden="true">🛡️</div>
                  <div>
                    <div className="protocol-name">{t.bento.protocolTitle}</div>
                    <div className="protocol-ver">{t.bento.protocolVersion}</div>
                  </div>
                </div>
                <span className="active-engine-badge">{t.bento.statusActive}</span>
              </div>

              {/* Central Glowing S-Mark Graphic */}
              <div className="bento-center-stage">
                <div className="s-symbol-ring">
                  <svg className="s-svg-graphic" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                    <defs>
                      <linearGradient id="stitchHeroGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#103D35" />
                        <stop offset="50%" stopColor="#17A884" />
                        <stop offset="100%" stopColor="#5BE2BC" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 44 20 C 42 15, 36 12, 30 12 C 22 12, 17 17, 17 23 C 17 31, 27 33, 33 36 C 40 39, 45 42, 45 49 C 45 57, 37 60, 28 60 C 20 60, 14 56, 12 50 C 14 51, 18 52, 22 52 C 28 52, 36 50, 36 44 C 36 38, 28 35, 23 32 C 16 28, 11 25, 11 18 C 11 10, 20 6, 31 6 C 39 6, 45 9, 47 13 Z"
                      fill="url(#stitchHeroGrad)"
                    />
                    <circle cx="34" cy="22" r="3.5" fill="#DDF5EB" />
                    <circle cx="26" cy="44" r="3.5" fill="#DDF5EB" />
                  </svg>
                </div>
                <div className="bento-badge-tag">{t.bento.objectiveBadge}</div>
                <h3 className="bento-card-title">{t.disciplines.title}</h3>
                <p className="bento-card-desc">{t.bento.objectiveDesc}</p>
              </div>

              {/* 3 Telemetry Metrics */}
              <div className="bento-metrics-grid">
                <div className="telemetry-box">
                  <div className="telemetry-val">{t.bento.metric1Val}</div>
                  <div className="telemetry-lbl">{t.bento.metric1Label}</div>
                </div>
                <div className="telemetry-box">
                  <div className="telemetry-val highlight">{t.bento.metric2Val}</div>
                  <div className="telemetry-lbl">{t.bento.metric2Label}</div>
                </div>
                <div className="telemetry-box">
                  <div className="telemetry-val">{t.bento.metric3Val}</div>
                  <div className="telemetry-lbl">{t.bento.metric3Label}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 10 DISCIPLINES SHOWCASE */}
      <section className="disciplines-section" id="disciplines" aria-label="10 Objective Disciplines">
        <div className="section-head-split">
          <div>
            <div className="eyebrow-pill">{t.disciplines.badge}</div>
            <h2 className="section-title-large">{t.disciplines.title}</h2>
            <p className="section-subtitle">{t.disciplines.subtitle}</p>
          </div>
          <div className="standards-tag-group">
            <span className="std-pill">DIN 58220</span>
            <span className="std-pill">ISO 8596</span>
            <span className="std-pill">APA / WHO</span>
          </div>
        </div>

        <div className="disciplines-cards-grid">
          {disciplines.map((item) => (
            <article key={item.id} className="discipline-glass-card">
              <div className="card-top-row">
                <div className="discipline-icon-box">{item.icon}</div>
                <span className="standard-code-badge">{item.badge}</span>
              </div>
              <h3 className="discipline-card-title">{item.title}</h3>
              <p className="discipline-card-desc">{item.desc}</p>
              <button
                type="button"
                className="discipline-link-btn"
                onClick={() => handleChipClick(item.title, item.id)}
              >
                <span>{t.disciplines.startBtn}</span>
                <span className="arrow-icon" aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* 3. КАК РАБОТАЕТ SIHAT (3-STEP CLARITY JOURNEY) */}
      <section className="journey-section" id="journey" aria-label="How SIHAT Works">
        <div className="journey-header">
          <div className="eyebrow-pill">{t.journey.badge}</div>
          <h2 className="section-title-large">{t.journey.title}</h2>
          <p className="section-subtitle">{t.journey.subtitle}</p>
        </div>

        <div className="journey-steps-grid">
          <div className="journey-step-card">
            <div className="step-num-bubble">1</div>
            <h3 className="step-title">{t.journey.step1Title}</h3>
            <p className="step-desc">{t.journey.step1Desc}</p>
            <div className="step-footer-tag">
              <span aria-hidden="true">📖</span> {t.journey.step1Tag}
            </div>
          </div>

          <div className="journey-step-card">
            <div className="step-num-bubble highlight">2</div>
            <h3 className="step-title">{t.journey.step2Title}</h3>
            <p className="step-desc">{t.journey.step2Desc}</p>
            <div className="step-footer-tag">
              <span aria-hidden="true">🔒</span> {t.journey.step2Tag}
            </div>
          </div>

          <div className="journey-step-card">
            <div className="step-num-bubble">3</div>
            <h3 className="step-title">{t.journey.step3Title}</h3>
            <p className="step-desc">{t.journey.step3Desc}</p>
            <div className="step-footer-tag">
              <span aria-hidden="true">🛡️</span> {t.journey.step3Tag}
            </div>
          </div>
        </div>
      </section>

      {/* 4. GEMINI AI INTERACTIVE SHOWCASE */}
      <section className="gemini-showcase-section" id="gemini-guide" aria-label="SIHAT AI Navigator">
        <div className="gemini-showcase-grid">
          {/* Left Context */}
          <div className="ai-context-col">
            <div className="eyebrow-pill">
              <span aria-hidden="true">✨</span>
              <span>{t.aiShowcase.badge}</span>
            </div>
            <h2 className="section-title-large">{t.aiShowcase.title}</h2>
            <p className="section-subtitle">{t.aiShowcase.subtitle}</p>

            <div className="ai-features-list">
              <div className="ai-feature-row">
                <span className="check-dot">✓</span>
                <p>{t.aiShowcase.check1}</p>
              </div>
              <div className="ai-feature-row">
                <span className="check-dot">✓</span>
                <p>{t.aiShowcase.check2}</p>
              </div>
              <div className="ai-feature-row prohibited">
                <span className="prohibited-dot">✕</span>
                <p>{t.aiShowcase.prohibitedNote}</p>
              </div>
            </div>

            <div className="architecture-note-box">
              <div className="arch-label">{t.aiShowcase.architectureTitle}</div>
              <div className="arch-desc">{t.aiShowcase.architectureDesc}</div>
            </div>
          </div>

          {/* Right Chat Mockup */}
          <div className="ai-chat-mockup-col">
            <div className="chat-window-card">
              <div className="chat-header-bar">
                <div className="chat-title-group">
                  <span className="chat-ai-icon" aria-hidden="true">🤖</span>
                  <div>
                    <div className="chat-title-text">{t.aiShowcase.chatTitle}</div>
                    <div className="chat-status-text">
                      <span className="online-dot"></span>
                      <span>{t.aiShowcase.chatStatus}</span>
                    </div>
                  </div>
                </div>
                <span className="chat-version-tag">{t.aiShowcase.chatBadge}</span>
              </div>

              {/* Chat Stream */}
              <div className="chat-stream-body">
                {/* User Bubble */}
                <div className="chat-bubble-user">
                  <p>{t.aiShowcase.userQuery}</p>
                  <span className="chat-timestamp">17:42</span>
                </div>

                {/* Assistant Bubble */}
                <div className="chat-bubble-ai">
                  <div className="ai-avatar" aria-hidden="true">✦</div>
                  <div className="ai-reply-card">
                    <p>{t.aiShowcase.aiReplyText}</p>
                    <div className="ai-suggested-checks">
                      <div className="suggested-chip">
                        <span>👁️</span>
                        <span>{t.aiShowcase.aiItem1}</span>
                      </div>
                      <div className="suggested-chip">
                        <span>🎯</span>
                        <span>{t.aiShowcase.aiItem2}</span>
                      </div>
                    </div>
                    <div className="ai-safety-alert">
                      {t.aiShowcase.aiSafetyNotice}
                    </div>
                    <button
                      type="button"
                      className="btn-launch-ai"
                      onClick={onOpenAssistant}
                    >
                      {t.aiShowcase.launchBtn} →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. NON-DIAGNOSTIC MEDICAL GUARANTEE CALLOUT */}
      <section className="safety-guarantee-section" aria-label="Medical Safety Guarantee">
        <div className="guarantee-box">
          <div className="shield-large-box" aria-hidden="true">🛡️</div>
          <div className="guarantee-content">
            <div className="eyebrow-pill">{t.disclaimer.badge}</div>
            <h3 className="guarantee-headline">{t.disclaimer.headline}</h3>
            <p className="guarantee-text">{t.disclaimer.text}</p>
          </div>
        </div>
      </section>
    </div>
  );
};
