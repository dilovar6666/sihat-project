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

  // 10 Disciplines data with tailored individual motifs and non-pseudoscientific attributes
  const disciplines = [
    {
      id: 'vision',
      isMajor: true,
      iconType: 'optotype',
      title: lang === 'ru' ? 'Зрение и контрастная чувствительность' : lang === 'tj' ? 'Биноӣ ва ҳассосияти контрастӣ' : 'Vision & Contrast Sensitivity',
      badge: lang === 'ru' ? 'Оптотипы Ландольта' : lang === 'tj' ? 'Оптотипҳои Ландольт' : 'Landolt C Optotypes',
      metric: lang === 'ru' ? '1.02 Visus / 50 см' : lang === 'tj' ? '1.02 Visus / 50 см' : '1.02 Visus / 50 cm',
      duration: '3 мин',
      desc: lang === 'ru' 
        ? 'Проверка разрешающей способности глаза и пороговой контрастности при экранной работе. Калибровка дистанции просмотра.'
        : lang === 'tj'
        ? 'Санҷиши қобилияти ҷудокунии чашм ва ҳассосияти контрастӣ ҳангоми кори экранӣ бо калибровкаи масофа.'
        : 'Screen-based visual acuity threshold and contrast sensitivity evaluation with distance calibration.',
    },
    {
      id: 'hearing',
      iconType: 'frequency',
      title: lang === 'ru' ? 'Слух и звуковосприятие' : lang === 'tj' ? 'Шунавоӣ ва дарки садо' : 'Hearing & Auditory Perception',
      badge: lang === 'ru' ? 'Тональные частоты' : lang === 'tj' ? 'Басомадҳои тоналӣ' : 'Tone Frequencies',
      metric: '125 – 8000 Гц',
      duration: '4 мин',
      desc: lang === 'ru'
        ? 'Пороговое различение чистых тонов и ориентировочная оценка восприятия речи в шуме на комфортной громкости.'
        : lang === 'tj'
        ? 'Дарки овозҳои тоза ва арзёбии шунавоӣ дар муҳити садонок бо баландии мусоид.'
        : 'Threshold pure tone differentiation and speech-in-noise perception indicators at comfortable volume.',
    },
    {
      id: 'memory',
      iconType: 'sequence',
      title: lang === 'ru' ? 'Кратковременная память' : lang === 'tj' ? 'Хотираи кӯтоҳмуддат' : 'Short-Term Working Memory',
      badge: lang === 'ru' ? 'Блоки Корси' : lang === 'tj' ? 'Блокҳои Корси' : 'Corsi Blocks',
      metric: lang === 'ru' ? 'Спан 6.8 единиц' : lang === 'tj' ? 'Спани 6.8 воҳид' : 'Span 6.8 units',
      duration: '3 мин',
      desc: lang === 'ru'
        ? 'Пространственное воспроизведение динамических зрительных последовательностей и оперативный буфер.'
        : lang === 'tj'
        ? 'Бозсозии пайдарпаии динамикии фазоӣ ва санҷиши хотираи кории рақамӣ.'
        : 'Spatial recall span of dynamic visual sequences and working memory buffer capacity.',
    },
    {
      id: 'attention',
      iconType: 'grid',
      title: lang === 'ru' ? 'Внимание и концентрация' : lang === 'tj' ? 'Диққат ва тамаркуз' : 'Attention & Focus',
      badge: lang === 'ru' ? 'Таблицы Шульте' : lang === 'tj' ? 'Ҷадвалҳои Шулте' : 'Schulte Matrix',
      metric: lang === 'ru' ? 'Индекс врабатываемости' : lang === 'tj' ? 'Индекси тамаркуз' : 'Workability Index',
      duration: '2 мин',
      desc: lang === 'ru'
        ? 'Устойчивость фокуса, скорость зрительного поиска и сопротивляемость отвлекающим факторам.'
        : lang === 'tj'
        ? 'Устувории диққат, суръати ҷустуҷӯи визуалӣ ва тақсимоти тамаркуз.'
        : 'Focus endurance, visual visual scan rate, and resistance to environmental attentional switching.',
    },
    {
      id: 'reaction',
      iconType: 'latency',
      title: lang === 'ru' ? 'Скорость сенсомоторной реакции' : lang === 'tj' ? 'Суръати вокуниши ҳаракат' : 'Sensorimotor Reaction Latency',
      badge: lang === 'ru' ? 'Хронометрия мс' : lang === 'tj' ? 'Хронометрия бо мс' : 'Chronometry ms',
      metric: lang === 'ru' ? 'Латентность: ~180 мс' : lang === 'tj' ? 'Вокуниш: ~180 мс' : 'Latency: ~180 ms',
      duration: '2 мин',
      desc: lang === 'ru'
        ? 'Высокоточное измерение времени простого зрительно-моторного ответа с аппаратной компенсацией задержки браузера.'
        : lang === 'tj'
        ? 'Андозагирии дақиқи вақти вокуниши чашму даст бо ҷуброни таъхири браузер.'
        : 'Millisecond-precision measurement of simple visual-motor response latency with VSync calibration.',
    },
    {
      id: 'coordination',
      iconType: 'pointer',
      title: lang === 'ru' ? 'Моторная координация' : lang === 'tj' ? 'Ҳамоҳангии моторӣ' : 'Motor Coordination',
      badge: lang === 'ru' ? 'Траектория Фиттса' : lang === 'tj' ? 'Қонуни Фиттс' : 'Fitts Law Target',
      metric: lang === 'ru' ? 'Точность 99.4%' : lang === 'tj' ? 'Дақиқӣ 99.4%' : 'Accuracy 99.4%',
      duration: '3 мин',
      desc: lang === 'ru'
        ? 'Точность позиционирования курсора, микротремор руки и плавность траекторного наведения на цель.'
        : lang === 'tj'
        ? 'Дақиқии ҳаракати нишоннамо ва муайян кардани ларзиши дасту суръати расидан ба ҳадаф.'
        : 'Cursor micro-aim precision, ballistic path smoothness, and tremor indicators in browser workspace.',
    },
    {
      id: 'processing',
      iconType: 'symbol',
      title: lang === 'ru' ? 'Скорость обработки информации' : lang === 'tj' ? 'Суръати коркарди маълумот' : 'Information Processing Speed',
      badge: lang === 'ru' ? 'Когнитивное различение' : lang === 'tj' ? 'Шинохти рамзҳо' : 'Symbol Differentiation',
      metric: lang === 'ru' ? 'Символов/мин' : lang === 'tj' ? 'Рамзҳо/дақ' : 'Symbols/min',
      duration: '3 мин',
      desc: lang === 'ru'
        ? 'Быстрое сопоставление символьных пар и проверка устойчивости к когнитивной интерференции.'
        : lang === 'tj'
        ? 'Муқоисаи фаврии ҷуфтҳои рамзӣ ва санҷиши суръати қабули қарор.'
        : 'Rapid symbolic pair association and resilience against perceptual cognitive interference.',
    },
    {
      id: 'wellbeing',
      iconType: 'balance',
      title: lang === 'ru' ? 'Эмоциональный баланс' : lang === 'tj' ? 'Мувозинати эҳсосӣ' : 'Emotional Wellbeing',
      badge: lang === 'ru' ? 'Саморефлексия' : lang === 'tj' ? 'Худшиносӣ' : 'Self-Reflection',
      metric: lang === 'ru' ? 'Приватная шкала' : lang === 'tj' ? 'Шкалаи шахсӣ' : 'Private Scale',
      duration: '4 мин',
      desc: lang === 'ru'
        ? 'Структурированные шкалы оценки уровня тревожности и субъективного эмоционального напряжения.'
        : lang === 'tj'
        ? 'Пурсишномаҳои сохторёфта барои фаҳмидани сатҳи стресс ва хастагии равонӣ бе тамғазанӣ.'
        : 'Structured self-guided questionnaires for awareness of emotional tension and stress markers.',
    },
    {
      id: 'comfort',
      iconType: 'posture',
      title: lang === 'ru' ? 'Физический комфорт и осанка' : lang === 'tj' ? 'Бароҳатии ҷисмонӣ ва қомат' : 'Physical Comfort & Ergonomics',
      badge: lang === 'ru' ? 'Эргономика рабочего места' : lang === 'tj' ? 'Эргономикаи ҷойи кор' : 'Workplace Ergonomics',
      metric: lang === 'ru' ? 'Шейно-плечевой угол' : lang === 'tj' ? 'Кунҷи сару гардан' : 'Cervical Angle Marker',
      duration: '3 мин',
      desc: lang === 'ru'
        ? 'Оценка мышечного напряжения шейно-плечевой зоны и факторов экранной астенопии при сидячей работе.'
        : lang === 'tj'
        ? 'Муайян намудани шиддати мушакҳои гардан ва хастагии нишасти тӯлонӣ дар сари компютер.'
        : 'Self-assessment of musculoskeletal tension markers and screen asthenopia in sedentary desk setups.',
    },
    {
      id: 'vitality',
      iconType: 'circadian',
      title: lang === 'ru' ? 'Повседневная активность и биоритм' : lang === 'tj' ? 'Фаъолияти рӯзона ва биоритм' : 'Daily Vitality & Chronotype',
      badge: lang === 'ru' ? 'Циркадный профиль' : lang === 'tj' ? 'Реҷаи шабонарӯзӣ' : 'Circadian Rhythm',
      metric: lang === 'ru' ? 'Фаза бодрости' : lang === 'tj' ? 'Марҳилаи бедорӣ' : 'Alertness Peak Phase',
      duration: '3 мин',
      desc: lang === 'ru'
        ? 'Оценка фаз естественной бодрости, субъективного восстановления сна и циркадных интервалов энергии.'
        : lang === 'tj'
        ? 'Арзёбии марҳилаҳои бедории табиӣ, сифати барқароршавии хоб ва соатҳои фаъоли организми шумо.'
        : 'Exploration of personal circadian vigor peaks, restorative rest indices, and ultradian rhythm alignment.',
    },
  ];

  return (
    <div className="landing-wrapper" aria-label="SIHAT Organic Editorial HealthTech">
      {/* 1. BIO-SPATIAL ORGANIC HERO SECTION */}
      <section className="hero-clarity-section" id="hero">
        <div className="hero-clarity-grid">
          {/* Left Column: Editorial Typography & Actions */}
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
                  Здоровье начинается с{' '}
                  <span className="hero-gradient-text">{t.hero.titleHighlight}</span>
                </>
              ) : lang === 'tj' ? (
                <>
                  Саломатӣ аз{' '}
                  <span className="hero-gradient-text">{t.hero.titleHighlight}</span> оғоз меёбад.
                </>
              ) : (
                <>
                  Health begins with{' '}
                  <span className="hero-gradient-text">{t.hero.titleHighlight}</span>
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

            {/* Quick Filter Sensory Chips */}
            <div className="quick-chips-row">
              <span className="quick-label">{t.hero.quickJump}</span>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipVision, 'vision')}>
                {t.hero.chipVision}
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipMemory, 'memory')}>
                {t.hero.chipMemory}
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipReaction || 'Reaction', 'reaction')}>
                {t.hero.chipReaction || 'Reaction'}
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipHearing, 'hearing')}>
                {t.hero.chipHearing}
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipAttention, 'attention')}>
                {t.hero.chipAttention}
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleChipClick(t.hero.chipCoordination || 'Coordination', 'coordination')}>
                {t.hero.chipCoordination || 'Coordination'}
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

          {/* Right Column: Bio-Spatial Organic 'S' Scene & Client Sandbox HUD */}
          <div className="hero-bento-col">
            <div className="bento-ambient-glow" aria-hidden="true"></div>
            
            {/* Luminous Organic S-Wave Composition */}
            <div className="spatial-stage-wrapper">
              <div className="spatial-canvas-aura" aria-hidden="true">
                <svg className="spatial-s-wave" viewBox="0 0 420 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="sihatRibbonGrad1" x1="40" y1="40" x2="380" y2="380" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#103D35" stopOpacity="0.8" />
                      <stop offset="45%" stopColor="#17A884" />
                      <stop offset="85%" stopColor="#2EC4A7" />
                      <stop offset="100%" stopColor="#DDF5EB" />
                    </linearGradient>
                    <linearGradient id="sihatRibbonGrad2" x1="380" y1="40" x2="40" y2="380" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#2EC4A7" stopOpacity="0.4" />
                      <stop offset="60%" stopColor="#17A884" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#103D35" stopOpacity="0" />
                    </linearGradient>
                    <filter id="stageGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="16" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Volumetric Ribbon S-Curves */}
                  <path
                    d="M 280 80 C 330 110, 340 180, 270 210 C 190 245, 120 270, 160 330 C 190 375, 270 365, 300 320"
                    stroke="url(#sihatRibbonGrad2)"
                    strokeWidth="32"
                    strokeLinecap="round"
                    filter="url(#stageGlow)"
                  />
                  <path
                    d="M 280 80 C 330 110, 340 180, 270 210 C 190 245, 120 270, 160 330 C 190 375, 270 365, 300 320"
                    stroke="url(#sihatRibbonGrad1)"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  
                  {/* Complementary Counter-Wave */}
                  <path
                    d="M 140 100 C 100 150, 130 210, 210 240 C 290 270, 310 320, 260 350"
                    stroke="url(#sihatRibbonGrad1)"
                    strokeWidth="5"
                    strokeDasharray="8 8"
                    opacity="0.6"
                  />

                  {/* Focal Luminous Orbit Points */}
                  <circle cx="270" cy="210" r="7" fill="#DDF5EB" />
                  <circle cx="270" cy="210" r="14" stroke="#2EC4A7" strokeWidth="2" opacity="0.6" />
                  <circle cx="160" cy="330" r="5" fill="#17A884" />
                  <circle cx="280" cy="80" r="6" fill="#2EC4A7" />
                </svg>
              </div>

              {/* Floating Frosted Diagnostic HUD Card */}
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

                <div className="bento-center-stage">
                  <div className="hud-calibration-badge">
                    <span className="live-status-dot" aria-hidden="true"></span>
                    <span>{t.hero.calibrationTag}</span>
                  </div>
                  <h3 className="bento-card-title">{t.disciplines.title}</h3>
                  <p className="bento-card-desc">{t.hero.calibrationText}</p>
                </div>

                {/* 3 Transparent Protocol Metrics */}
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
        </div>
      </section>

      {/* 2. 10 OBJECTIVE DISCIPLINES EDITORIAL MATRIX */}
      <section className="disciplines-section" id="disciplines" aria-label="10 Objective Disciplines">
        <div className="section-head-split">
          <div>
            <div className="eyebrow-pill">{t.disciplines.badge}</div>
            <h2 className="section-title-large">{t.disciplines.title}</h2>
            <p className="section-subtitle">{t.disciplines.subtitle}</p>
          </div>
          <div className="disciplines-badge-info">
            <span className="std-pill">✓ Открытые паспорта</span>
            <span className="std-pill">✓ Без вымышленных диагнозов</span>
            <span className="std-pill">✓ Песочница браузера</span>
          </div>
        </div>

        <div className="disciplines-editorial-matrix">
          {disciplines.map((item) => {
            if (item.isMajor) {
              return (
                <article key={item.id} className="discipline-major-card">
                  <div className="major-card-inner">
                    <div className="major-card-left">
                      <div className="card-top-row">
                        <span className="major-featured-tag">{t.disciplines.featuredTag}</span>
                        <span className="standard-code-badge">{item.badge}</span>
                      </div>
                      <h3 className="major-card-title">{item.title}</h3>
                      <p className="major-card-desc">{item.desc}</p>
                      
                      <div className="discipline-meta-row">
                        <span className="meta-metric-chip">📊 {item.metric}</span>
                        <span className="meta-time-chip">⏱️ {item.duration}</span>
                      </div>

                      <div className="major-card-actions">
                        <button
                          type="button"
                          className="btn-primary-emerald"
                          onClick={() => handleChipClick(item.title, item.id)}
                        >
                          <span>{t.disciplines.startBtn}</span>
                          <span className="arrow-icon" aria-hidden="true">→</span>
                        </button>
                        <button
                          type="button"
                          className="btn-ghost-outline"
                          onClick={() => onNavigate('exercises')}
                        >
                          {t.nav.exercises}
                        </button>
                      </div>
                    </div>

                    {/* Optotype Visual Stage Illustration */}
                    <div className="major-card-graphic" aria-hidden="true">
                      <div className="optotype-circle-frame">
                        <svg className="landolt-svg" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="38" stroke="var(--emerald-900)" strokeWidth="16" />
                          {/* Gap in the Landolt Ring */}
                          <rect x="74" y="42" width="22" height="16" fill="var(--bg-surface)" />
                        </svg>
                        <div className="optotype-dist-label">Калибровка: 50 см</div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }

            return (
              <article key={item.id} className="discipline-glass-card">
                <div className="card-top-row">
                  <div className="discipline-icon-box">
                    {item.iconType === 'frequency' && '〰️'}
                    {item.iconType === 'sequence' && '🧩'}
                    {item.iconType === 'grid' && '▦'}
                    {item.iconType === 'latency' && '⚡'}
                    {item.iconType === 'pointer' && '🎯'}
                    {item.iconType === 'symbol' && '🔣'}
                    {item.iconType === 'balance' && '🌱'}
                    {item.iconType === 'posture' && '📐'}
                    {item.iconType === 'circadian' && '☀️'}
                  </div>
                  <span className="standard-code-badge">{item.badge}</span>
                </div>

                <h3 className="discipline-card-title">{item.title}</h3>
                <p className="discipline-card-desc">{item.desc}</p>

                <div className="discipline-card-footer">
                  <div className="discipline-micro-stats">
                    <span className="micro-metric">{item.metric}</span>
                    <span className="micro-time">• {item.duration}</span>
                  </div>
                  <button
                    type="button"
                    className="discipline-link-btn"
                    onClick={() => handleChipClick(item.title, item.id)}
                    aria-label={`${item.title} — ${t.disciplines.startBtn}`}
                  >
                    <span>{t.disciplines.startBtn}</span>
                    <span className="arrow-icon" aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3. КАК РАБОТАЕТ SIHAT (3-STEP TRANSPARENT CLARITY JOURNEY) */}
      <section className="journey-section" id="journey" aria-label="How SIHAT Works">
        <div className="journey-header">
          <div className="eyebrow-pill">{t.journey.badge}</div>
          <h2 className="section-title-large">{t.journey.title}</h2>
          <p className="section-subtitle">{t.journey.subtitle}</p>
        </div>

        <div className="journey-steps-grid">
          <div className="journey-step-card">
            <div className="step-num-bubble">1</div>
            <div className="step-tag-pill">{t.journey.step1Tag}</div>
            <h3 className="step-title">{t.journey.step1Title}</h3>
            <p className="step-desc">{t.journey.step1Desc}</p>
          </div>

          <div className="journey-step-card highlighted">
            <div className="step-num-bubble">2</div>
            <div className="step-tag-pill">{t.journey.step2Tag}</div>
            <h3 className="step-title">{t.journey.step2Title}</h3>
            <p className="step-desc">{t.journey.step2Desc}</p>
          </div>

          <div className="journey-step-card">
            <div className="step-num-bubble">3</div>
            <div className="step-tag-pill">{t.journey.step3Tag}</div>
            <h3 className="step-title">{t.journey.step3Title}</h3>
            <p className="step-desc">{t.journey.step3Desc}</p>
          </div>
        </div>
      </section>

      {/* 4. GEMINI AI HEALTH NAVIGATOR SHOWCASE */}
      <section className="ai-showcase-section" id="assistant-showcase" aria-label="Gemini AI Health Navigator">
        <div className="ai-showcase-grid">
          <div className="ai-text-col">
            <div className="eyebrow-pill">{t.aiShowcase.badge}</div>
            <h2 className="section-title-large">{t.aiShowcase.title}</h2>
            <p className="section-subtitle">{t.aiShowcase.subtitle}</p>

            <ul className="ai-benefits-list">
              <li>
                <span className="check-bullet" aria-hidden="true">✓</span>
                <span>{t.aiShowcase.check1}</span>
              </li>
              <li>
                <span className="check-bullet" aria-hidden="true">✓</span>
                <span>{t.aiShowcase.check2}</span>
              </li>
              <li className="prohibited-item">
                <span className="cross-bullet" aria-hidden="true">✕</span>
                <strong>{t.aiShowcase.prohibitedNote}</strong>
              </li>
            </ul>

            <div className="ai-voice-badge">
              <span className="voice-wave-anim" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
              </span>
              <span>{t.aiShowcase.voiceActive}</span>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="btn-primary-emerald"
                onClick={onOpenAssistant}
              >
                <span>{t.aiShowcase.launchBtn}</span>
                <span className="arrow-icon" aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          {/* Interactive Assistant Conversational Preview Card */}
          <div className="ai-mockup-col">
            <div className="chat-window-card">
              <div className="chat-window-header">
                <div className="chat-header-identity">
                  <span className="ai-sparkle-mark" aria-hidden="true">✦</span>
                  <div>
                    <div className="chat-header-title">{t.aiShowcase.chatTitle}</div>
                    <div className="chat-header-status">{t.aiShowcase.chatStatus}</div>
                  </div>
                </div>
                <span className="chat-badge-safe">{t.aiShowcase.chatBadge}</span>
              </div>

              <div className="chat-window-body">
                <div className="chat-bubble user-bubble">
                  <p>{t.aiShowcase.userQuery}</p>
                </div>

                <div className="chat-bubble ai-bubble">
                  <div className="ai-bubble-sender">SIHAT AI</div>
                  <p>{t.aiShowcase.aiReplyText}</p>
                  <div className="ai-recommendation-chips">
                    <button
                      type="button"
                      className="rec-chip"
                      onClick={() => handleChipClick('Зрение', 'vision')}
                    >
                      {t.aiShowcase.aiItem1}
                    </button>
                    <button
                      type="button"
                      className="rec-chip"
                      onClick={() => handleChipClick('Внимание', 'attention')}
                    >
                      {t.aiShowcase.aiItem2}
                    </button>
                  </div>
                  <p className="ai-clinical-warning">{t.aiShowcase.aiSafetyNotice}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MEDICAL DISCLAIMER & ETHICAL TRANSPARENCY CALLOUT */}
      <section className="disclaimer-callout-section" aria-label="Medical Disclaimer">
        <div className="disclaimer-callout-card">
          <div className="disclaimer-icon-box" aria-hidden="true">ℹ️</div>
          <div>
            <div className="disclaimer-badge">{t.disclaimer.badge}</div>
            <h3 className="disclaimer-headline">{t.disclaimer.headline}</h3>
            <p className="disclaimer-text">{t.disclaimer.text}</p>
          </div>
        </div>
      </section>
    </div>
  );
};
