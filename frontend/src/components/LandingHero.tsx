import React, { useState } from 'react'
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Activity,
  Globe,
  Compass,
  CheckCircle2,
  RotateCcw,
  Eye,
  Sparkles,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { PseudoisochromaticPlateCanvas, CLINICAL_PLATES } from './test-engines/ColorPerceptionEngine'
import type { Language, Translations } from '../i18n'
import type { TestItem } from '../types'
import { TestMarquee } from './TestMarquee'

interface LandingHeroProps {
  t: Translations
  lang: Language
  tests?: TestItem[]
  onOpenCatalog: () => void
  onOpenMethodology: () => void
  onSelectTest?: (test: TestItem) => void
  onStartScreening: (slug: string) => void
}

const MINI_PLATES = CLINICAL_PLATES.slice(0, 3)

export const LandingHero: React.FC<LandingHeroProps> = ({
  t,
  lang,
  tests = [],
  onOpenCatalog,
  onOpenMethodology,
  onSelectTest,
  onStartScreening,
}) => {
  // Mini-screening for Color Blindness (Ishihara / Rabkin) state
  const [currentPlateIdx, setCurrentPlateIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<string[]>([])
  const [isFinished, setIsFinished] = useState(false)

  const currentPlate = MINI_PLATES[currentPlateIdx]

  const handleSelectOption = (opt: string) => {
    const updated = [...userAnswers, opt]
    setUserAnswers(updated)
    if (currentPlateIdx < MINI_PLATES.length - 1) {
      setCurrentPlateIdx((prev) => prev + 1)
    } else {
      setIsFinished(true)
    }
  }

  const handleResetMiniTest = () => {
    setCurrentPlateIdx(0)
    setUserAnswers([])
    setIsFinished(false)
  }

  const heroBadge = lang === 'ru' 
    ? 'SIHAT 3.0 • Доказательный HealthTech без псевдодиагнозов'
    : lang === 'tj'
    ? 'SIHAT 3.0 • HealthTech-и исботшуда бе ташхиси бардурӯғ'
    : 'SIHAT 3.0 • Evidence-Bounded HealthTech Without Fake Scores'

  const heroTitle = lang === 'ru'
    ? 'Где забота о здоровье встречает'
    : lang === 'tj'
    ? 'Дар куҷое, ки ғамхорӣ ба саломатӣ ба'
    : 'Where Health Care Meets'

  const heroHighlight = lang === 'ru'
    ? 'научную ясность.'
    : lang === 'tj'
    ? 'равшании илмӣ мерасад.'
    : 'Scientific Clarity.'

  const heroSubtitle = lang === 'ru'
    ? '15 интерактивных скринингов сенсорных и моторных функций. Открытые паспорта методик, доказательная медицина и строгая конфиденциальность с правом на немедленное удаление.'
    : lang === 'tj'
    ? '15 санҷиши интерактивии функсияҳои сенсорӣ ва моторӣ. Шиносномаҳои озоди методӣ, тибби исботшуда ва махфияти комил.'
    : '15 interactive screenings of sensory and motor functions. Transparent methodology passports, evidence-based medicine, and strict privacy with immediate deletion rights.'

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Cinematic Hero Background Image with Smart Scrim - "чтобы было видно, но не мозолило глаза" */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 78%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 78%, transparent 100%)',
          }}
        >
          <img
            src="/hero-bg.jpg"
            alt="SIHAT Clinical Screening Environment"
            className="w-full h-full object-cover object-[70%_25%] md:object-[68%_30%] transition-opacity duration-700 opacity-30 dark:opacity-75 filter contrast-[1.04] brightness-[0.92]"
          />

          {/* Theme-adaptive Scrim for eye comfort and text legibility */}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_32%,rgba(250,250,250,0.85)_0%,rgba(250,250,250,0.6)_55%,rgba(250,250,250,0.96)_100%)] dark:bg-[radial-gradient(ellipse_at_50%_32%,rgba(7,11,10,0.78)_0%,rgba(7,11,10,0.52)_55%,rgba(7,11,10,0.88)_100%)]"
          />
        </div>

        {/* Ambient volumetric glow aligned with the monitor's LED strip */}
        <div className="absolute top-1/4 right-1/4 w-[520px] h-[340px] bg-emerald-500/15 dark:bg-emerald-400/20 blur-[130px] rounded-full pointer-events-none mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-6 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{heroBadge}</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-4xl mx-auto leading-[1.12] drop-shadow-sm">
          {heroTitle}{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
            {heroHighlight}
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto leading-relaxed">
          {heroSubtitle}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            variant="emerald"
            onClick={onOpenCatalog}
            className="w-full sm:w-auto gap-2 text-base shadow-lg shadow-emerald-600/25"
          >
            <span>{t.hero?.browseCatalog || 'Открыть каталог скринингов'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onOpenMethodology}
            className="w-full sm:w-auto gap-2 text-base"
          >
            <Compass className="w-4 h-4 text-emerald-500" />
            <span>{lang === 'ru' ? 'Изучить паспорта методик' : lang === 'tj' ? 'Шиносномаҳои методӣ' : 'Methodology Passports'}</span>
          </Button>
        </div>

        {/* 4 Trust Badges Strip */}
        <div className="mt-14 pt-8 border-t border-zinc-200/80 dark:border-zinc-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
          <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-pill">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {lang === 'tj' ? 'Бе ташхис' : lang === 'en' ? 'No Diagnoses' : 'Без диагнозов'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {lang === 'tj' ? 'Танҳо ченакҳои сенсорӣ' : lang === 'en' ? 'Only Sensory Metrics' : 'Только сенсорные метрики'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-pill">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {lang === 'tj' ? 'Махфияти 100%' : lang === 'en' ? '100% Privacy' : 'Приватность 100%'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {lang === 'tj' ? 'Нигоҳдорӣ ё несткунӣ' : lang === 'en' ? 'Save or Wipe' : 'Сохранить или стереть'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-pill">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {lang === 'tj' ? '15 методика' : lang === 'en' ? '15 Methods' : '15 методик'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {lang === 'tj' ? 'Ишихара, Струп, реакция' : lang === 'en' ? 'Ishihara, Stroop, Reaction' : 'Ишихара, Струп, реакция'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl liquid-glass-pill">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {lang === 'tj' ? '3 забон' : lang === 'en' ? '3 Languages' : '3 языка'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Русский, Тоҷикӣ, English</div>
            </div>
          </div>
        </div>

        {/* Real Interactive Screening for Color Blindness (Ishihara / Rabkin Mini-Test) */}
        <div className="mt-14 text-left">
          <Card className="p-6 md:p-8 liquid-glass shadow-2xl overflow-hidden relative rounded-3xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Interactive Ishihara Plate OR Gated Result State */}
              <div className="lg:col-span-6 liquid-glass rounded-3xl p-6 flex flex-col items-center justify-center min-h-[340px] relative shadow-inner">
                {!isFinished ? (
                  <>
                    <div className="w-full flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {lang === 'tj' ? currentPlate.labelTj : lang === 'en' ? currentPlate.labelEn : currentPlate.labelRu}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {currentPlateIdx + 1} / {MINI_PLATES.length}
                      </Badge>
                    </div>

                    {/* Canvas Plate */}
                    <div className="my-2 transition-transform duration-200 hover:scale-[1.02]">
                      <PseudoisochromaticPlateCanvas plate={currentPlate} size={230} />
                    </div>

                    <div className="text-xs text-zinc-600 dark:text-zinc-400 my-3 font-semibold text-center">
                      {currentPlate.type === 'number'
                        ? (lang === 'tj' ? 'Кадом рақамро дар дохили доира мебинед?' : lang === 'en' ? 'Which number do you perceive inside the circle?' : 'Какое число вы видите внутри круга?')
                        : (lang === 'tj' ? 'Кадом шаклро дар дохили доира мебинед?' : lang === 'en' ? 'Which shape do you perceive inside the circle?' : 'Какую фигуру вы видите внутри круга?')}
                    </div>

                    {/* 4 Interactive Choice Buttons */}
                    <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
                      {(lang === 'tj' ? currentPlate.optionsTj : lang === 'en' ? currentPlate.optionsEn : currentPlate.optionsRu).map((opt) => (
                        <Button
                          key={opt}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectOption(opt)}
                          className="h-9 font-bold text-xs hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all shadow-xs"
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Gated Completion State (User requirement: результат только когда нажмет полный) */
                  <div className="w-full flex flex-col items-center justify-center text-center p-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
                      <Lock className="w-7 h-7" />
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
                        <span>{lang === 'tj' ? 'Санҷиши экспресс анҷом ёфт' : lang === 'en' ? 'Mini-Screening Completed' : 'Экспресс-тест завершён'}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {lang === 'tj'
                          ? '3 аз 3 посух дар хотираи маҳаллӣ сабт шуд'
                          : lang === 'en'
                          ? '3 of 3 plate responses securely recorded'
                          : '3 из 3 ответов сохранены в защищённой памяти'}
                      </p>
                    </div>

                    {/* Recorded Answers Status */}
                    <div className="w-full space-y-2 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-left text-xs">
                      {MINI_PLATES.map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                            Таблица #{p.id}:
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {userAnswers[idx] ? `Ответ «${userAnswers[idx]}»` : 'Зафиксировано'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Teaser: Redacted Clinical Metric */}
                    <div className="w-full p-2.5 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-[11px] flex items-center justify-center gap-2 font-mono">
                      <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>{lang === 'tj' ? 'Хулосаи клиникӣ: [Басташуда]' : lang === 'en' ? 'Clinical Verdict: [Locked]' : 'Клинический вердикт: [Заблокировано]'}</span>
                    </div>

                    <button
                      onClick={handleResetMiniTest}
                      className="text-[11px] text-zinc-500 hover:text-emerald-500 underline flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{lang === 'tj' ? 'Аз нав гузаштан' : lang === 'en' ? 'Retry mini-test' : 'Пройти экспресс-тест заново'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Telemetry & Gate Call-to-Action */}
              <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-5">
                <div>
                  <Badge variant="emerald" className="mb-3 font-mono">
                    {isFinished
                      ? (lang === 'tj' ? 'Посухҳо сабт шуданд' : lang === 'en' ? 'Responses Stored' : 'Ответы зафиксированы')
                      : (lang === 'tj' ? 'Ҷадвалҳои Ишихара ва Рабкин' : lang === 'en' ? 'Ishihara & Rabkin Paradigm' : 'Таблицы Ишихары и Рабкина')}
                  </Badge>

                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {isFinished
                      ? (lang === 'tj'
                          ? 'Натиҷаҳо дар контури пӯшида маҳфузанд'
                          : lang === 'en'
                          ? 'Results Ready for Full Decryption'
                          : 'Результат зафиксирован в закрытом контуре')
                      : (lang === 'tj'
                          ? 'Санҷиши зуд барои дальтонизм'
                          : lang === 'en'
                          ? 'Color Vision Mini-Screening'
                          : 'Экспресс-тест на дальтонизм')}
                  </h3>

                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                    {isFinished
                      ? (lang === 'tj'
                          ? 'Шумо ҳамаи 3 лавҳаро посух додед. Барои кушодани шарҳи мукаммали клиникӣ (ташхиси дейтеранопия, протанопия ва ахроматопсия), спектрограмма ва содироти шиносномаи расмии тиббии PDF — тугмаи «Оғози скрининги комил»-ро пахш намоед.'
                          : lang === 'en'
                          ? 'You have completed all 3 test plates. To decrypt the full clinical evaluation (differential analysis of deutan, protan, and tritan defects), view full hue spectrogram, and export official PDF passport — click "Launch Full Screening".'
                          : 'Вы успешно ответили на все 3 демонстрационные таблицы. Чтобы расшифровать клинический вердикт (дифференциация протанопии, дейтераномалии и ахроматопсии по стандарту Рабкина), спектрограмму и получить официальный медицинский PDF-паспорт — нажмите кнопку ниже.')
                      : (lang === 'tj'
                          ? 'Арзёбии фаврии қобилияти системаи биноӣ барои фарқ кардани дарозии мавҷҳои сурх ва сабз (колбачаҳои L ва M) дар матритсаи нуқтавии полихроматикӣ.'
                          : lang === 'en'
                          ? 'Rapid screening of the visual pathway capacity to discriminate red and green wavelengths (L and M cones) embedded in a pseudoisochromatic dot matrix.'
                          : 'Оценка способности зрительной системы различать длины волн красного и зелёного спектров (колбочки L и M) внутри псевдоизохроматической точечной матрицы.')}
                  </p>
                </div>

                {/* Progress / Status Bar Card */}
                <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {lang === 'tj' ? 'Пешрафти экспресс-тест:' : lang === 'en' ? 'Screening Progress:' : 'Прогресс экспресс-теста:'}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isFinished ? '100% (3/3)' : `${Math.round((userAnswers.length / 3) * 100)}% (${userAnswers.length}/3)`}
                    </span>
                  </div>

                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                      style={{ width: `${isFinished ? 100 : Math.max(15, (userAnswers.length / 3) * 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {lang === 'tj' ? 'Ҳолати калибровка:' : lang === 'en' ? 'Display Calibration:' : 'Калибровка дисплея:'}
                    </span>
                    <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      sRGB Standard (50 cm)
                    </span>
                  </div>
                </div>

                {/* CTA Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <Button
                    variant="emerald"
                    className="w-full sm:flex-1 gap-2 shadow-md shadow-emerald-600/25 py-2.5 font-bold"
                    onClick={() => onStartScreening('color-perception')}
                  >
                    <span>
                      {isFinished
                        ? (lang === 'tj'
                            ? 'Дидани натиҷа ва оғози тести пурра'
                            : lang === 'en'
                            ? 'Unlock Result & Launch Full Test'
                            : 'Посмотреть результат и запустить полный скрининг')
                        : (lang === 'tj'
                            ? 'Оғози скрининги комил (15 тест)'
                            : lang === 'en'
                            ? 'Launch Full Screening'
                            : 'Запустить полный скрининг')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={onOpenMethodology}
                    className="w-full sm:w-auto text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    <span>{lang === 'tj' ? 'Шиносномаи методӣ' : lang === 'en' ? 'Methodology Passport' : 'Паспорт методики'}</span>
                  </Button>
                </div>
              </div>

            </div>
          </Card>

          {/* Continuous Infinite Marquee Ribbon of All Available Protocols */}
          <TestMarquee
            tests={tests}
            lang={lang}
            onOpenCatalog={onOpenCatalog}
            onSelectTest={(test) => {
              if (onSelectTest) {
                onSelectTest(test)
              } else {
                onStartScreening(test.slug)
              }
            }}
            onStartAttempt={(test) => onStartScreening(test.slug)}
          />
        </div>
      </div>
    </section>
  )
}
