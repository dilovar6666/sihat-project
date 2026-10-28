import React, { useState } from 'react'
import { HeartPulse, CheckCircle2, ShieldCheck, ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface Gad7EngineProps {
  lang: Language
  challenge?: {
    type?: string
    items_count?: number
    scale_max?: number
  }
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

export const Gad7Engine: React.FC<Gad7EngineProps> = ({ lang, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>(new Array(7).fill(-1))
  const [isFinished, setIsFinished] = useState(false)

  const t = {
    ru: {
      title: 'Шкала генерализованной тревожности',
      subtitle: 'За последние 2 недели, как часто вас беспокоили следующие проблемы?',
      standard: 'GAD-7 (Spitzer et al., 2006) Educational Self-Assessment',
      disclaimer: 'Опросник носит ознакомительный характер, не является медицинским диагнозом и служит исключительно для самонаблюдения.',
      progress: 'Вопрос',
      of: 'из',
      points: 'баллов',
      scoreTitle: 'Результат оценки тревожности (GAD-7)',
      minBand: 'Минимальный уровень тревожности (0–4 балла)',
      mildBand: 'Лёгкий уровень тревожности (5–9 баллов)',
      modBand: 'Умеренный уровень тревожности (10–14 баллов)',
      sevBand: 'Выраженный уровень тревожности (15–21 балл)',
      recommendationTitle: 'Рекомендации и контекст',
      minText: 'Текущий показатель находится в пределах нормативных фоновых колебаний повседневного стресса.',
      mildText: 'Отмечаются некоторые признаки ситуативного напряжения. Рекомендуется оптимизация сна, режима труда и отдыха.',
      modText: 'Уровень эмоционального напряжения повышен. Полезны техники релаксации, консультация специалиста при стойких симптомах.',
      sevText: 'Высокий уровень дистресса. Рекомендуется очная консультация с квалифицированным психотерапевтом или врачом.',
      nextBtn: 'Следующий вопрос',
      prevBtn: 'Назад',
      finishBtn: 'Рассчитать результат',
      saveBtn: 'Сохранить результат',
      restartBtn: 'Пройти заново',
      options: [
        { value: 0, label: 'Совсем нет', desc: '0 дней' },
        { value: 1, label: 'Несколько дней', desc: '1–6 дней' },
        { value: 2, label: 'Более половины дней', desc: '7–11 дней' },
        { value: 3, label: 'Почти каждый день', desc: '12–14 дней' },
      ],
      questions: [
        '1. Чувство нервозности, тревоги или нахождения на пределе',
        '2. Неспособность остановить или контролировать беспокойство',
        '3. Избыточное беспокойство по самым разным поводам',
        '4. Трудности с расслаблением и снятием напряжения',
        '5. Настолько сильное беспокойство, что тяжело усидеть на одном месте',
        '6. Легкая раздражительность, повышенная вспыльчивость или досада',
        '7. Чувство смутного страха, будто вот-вот произойдет что-то ужасное',
      ],
    },
    tj: {
      title: 'Миқёси изтироби умумӣ',
      subtitle: 'Дар давоми 2 ҳафтаи охир, чанд маротиба шуморо мушкилоти зерин нигарон карданд?',
      standard: 'GAD-7 (Spitzer et al., 2006) Educational Self-Assessment',
      disclaimer: 'Ин пурсишнома хусусияти шиносоӣ дошта, ташхиси тиббӣ намебошад ва танҳо барои худназоратӣ хидмат мекунад.',
      progress: 'Савол',
      of: 'аз',
      points: 'хол',
      scoreTitle: 'Натиҷаи баҳодиҳии изтироб (GAD-7)',
      minBand: 'Сатҳи ҳадди ақали изтироб (0–4 хол)',
      mildBand: 'Сатҳи сабуки изтироб (5–9 хол)',
      modBand: 'Сатҳи миёнаи изтироб (10–14 хол)',
      sevBand: 'Сатҳи баланди изтироб (15–21 хол)',
      recommendationTitle: 'Тавсияҳо ва шарҳ',
      minText: 'Нишондиҳандаи ҳозира дар доираи табиии стресси рӯзмарра қарор дорад.',
      mildText: 'Аломатҳои ками шиддати рӯҳӣ дида мешаванд. Танзими реҷаи хоб ва истироҳат тавсия мешавад.',
      modText: 'Сатҳи шиддати эҳсосӣ баландтар аст. Машқҳои оромбахшӣ ва машварат бо мутахассис муфид аст.',
      sevText: 'Сатҳи баланди стресс. Машварат бо мутахассиси варзида ё духтур тавсия дода мешавад.',
      nextBtn: 'Саволи навбатӣ',
      prevBtn: 'Ба ақиб',
      finishBtn: 'Ҳисоб кардани натиҷа',
      saveBtn: 'Сабти натиҷа',
      restartBtn: 'Аз нав гузаштан',
      options: [
        { value: 0, label: 'Умуман не', desc: '0 рӯз' },
        { value: 1, label: 'Якчанд рӯз', desc: '1–6 рӯз' },
        { value: 2, label: 'Зиёда аз нисфи рӯзҳо', desc: '7–11 рӯз' },
        { value: 3, label: 'Қариб ҳар рӯз', desc: '12–14 рӯз' },
      ],
      questions: [
        '1. Эҳсоси асабоният, изтироб ё дар ҳолати сарборӣ будан',
        '2. Наметавонам нигарониро боздорам ё назорат кунам',
        '3. Нигаронии аз ҳад зиёд оид ба масъалаҳои гуногун',
        '4. Мушкилӣ дар ором шудан ва бартараф кардани шиддат',
        '5. Беқарории зиёд, ки дар як ҷо нишастан душвор аст',
        '6. Зудраҷҷӣ, ба осонӣ ба хашм омадан ё норозигӣ',
        '7. Эҳсоси тарси номуайян, ки гӯё ҳодисаи нохуше рӯй медиҳад',
      ],
    },
    en: {
      title: 'Generalized Anxiety Scale',
      subtitle: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
      standard: 'GAD-7 (Spitzer et al., 2006) Educational Self-Assessment',
      disclaimer: 'This questionnaire is educational only, does not constitute a clinical diagnosis, and serves for personal self-reflection.',
      progress: 'Question',
      of: 'of',
      points: 'points',
      scoreTitle: 'Anxiety Assessment Result (GAD-7)',
      minBand: 'Minimal Anxiety (0–4 points)',
      mildBand: 'Mild Anxiety (5–9 points)',
      modBand: 'Moderate Anxiety (10–14 points)',
      sevBand: 'Severe Anxiety (15–21 points)',
      recommendationTitle: 'Recommendations & Context',
      minText: 'Current score is within normative baseline fluctuation of everyday life stressors.',
      mildText: 'Some situational tension noted. Sleep hygiene and work-rest routine optimization suggested.',
      modText: 'Elevated emotional tension. Relaxation routines and specialist consultation may be beneficial.',
      sevText: 'High distress level. In-person consultation with a qualified mental health clinician recommended.',
      nextBtn: 'Next Question',
      prevBtn: 'Back',
      finishBtn: 'Calculate Score',
      saveBtn: 'Save Result',
      restartBtn: 'Take Again',
      options: [
        { value: 0, label: 'Not at all', desc: '0 days' },
        { value: 1, label: 'Several days', desc: '1–6 days' },
        { value: 2, label: 'More than half the days', desc: '7–11 days' },
        { value: 3, label: 'Nearly every day', desc: '12–14 days' },
      ],
      questions: [
        '1. Feeling nervous, anxious, or on edge',
        '2. Not being able to stop or control worrying',
        '3. Worrying too much about different things',
        '4. Trouble relaxing',
        '5. Being so restless that it is hard to sit still',
        '6. Becoming easily annoyed or irritable',
        '7. Feeling afraid, as if something awful might happen',
      ],
    },
  }[lang]

  const handleSelectOption = (value: number) => {
    const updated = [...answers]
    updated[currentIdx] = value
    setAnswers(updated)

    if (currentIdx < 6) {
      setCurrentIdx((prev) => prev + 1)
    }
  }

  const allAnswered = answers.every((a) => a >= 0)
  const totalScore = answers.reduce((acc, val) => acc + (val >= 0 ? val : 0), 0)

  const getSeverityBand = (score: number) => {
    if (score >= 15) return { label: t.sevBand, text: t.sevText, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' }
    if (score >= 10) return { label: t.modBand, text: t.modText, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
    if (score >= 5) return { label: t.mildBand, text: t.mildText, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' }
    return { label: t.minBand, text: t.minText, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
  }

  const band = getSeverityBand(totalScore)

  const handleFinishSave = () => {
    onComplete({
      summary: `${t.scoreTitle}: ${totalScore}/21 (${band.label})`,
      metrics: {
        gad7_score: totalScore,
        max_score: 21,
        severity_band: band.label,
        answers: answers,
      },
    })
  }

  const handleRestart = () => {
    setAnswers(new Array(7).fill(-1))
    setCurrentIdx(0)
    setIsFinished(false)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center max-w-2xl mx-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-6 h-6 text-[#17A884]" />
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.title}</h3>
            <p className="text-xs text-slate-500">{t.standard}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-[#17A884]/30 text-[#17A884]">
          GAD-7
        </Badge>
      </div>

      {!isFinished ? (
        <div className="w-full">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {t.subtitle}
          </p>

          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 mb-2">
              <span>
                {t.progress} {currentIdx + 1} {t.of} 7
              </span>
              <span>{Math.round(((currentIdx + 1) / 7) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#17A884] to-[#2EC4A7] transition-all duration-300 rounded-full"
                style={{ width: `${((currentIdx + 1) / 7) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 mb-6">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-white leading-relaxed mb-6">
              {t.questions[currentIdx]}
            </h4>

            <div className="space-y-3">
              {t.options.map((opt) => {
                const isSelected = answers[currentIdx] === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(opt.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#17A884] bg-[#17A884]/10 dark:bg-[#17A884]/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-[#2EC4A7]/60 hover:bg-slate-100/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{opt.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'border-[#17A884] bg-[#17A884] text-white'
                          : 'border-slate-300 dark:border-slate-600 text-slate-400'
                      }`}
                    >
                      {opt.value}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              {t.prevBtn}
            </Button>

            {currentIdx < 6 ? (
              <Button
                onClick={() => setCurrentIdx((prev) => Math.min(6, prev + 1))}
                disabled={answers[currentIdx] === -1}
                className="bg-[#17A884] hover:bg-[#103D35] text-white flex items-center gap-1.5"
              >
                {t.nextBtn}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setIsFinished(true)}
                disabled={!allAnswered}
                className="bg-[#103D35] hover:bg-[#17A884] text-white font-bold px-6 flex items-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-[#2EC4A7]" />
                {t.finishBtn}
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="w-full flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#17A884]/15 flex items-center justify-center mb-4 text-[#17A884]">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{t.scoreTitle}</h4>

          {/* Score Badge */}
          <div className="flex items-baseline gap-2 my-4">
            <span className="text-5xl font-extrabold text-[#103D35] dark:text-[#2EC4A7] font-mono">
              {totalScore}
            </span>
            <span className="text-lg text-slate-500 font-medium">/ 21 {t.points}</span>
          </div>

          {/* Severity Banner */}
          <div className={`w-full max-w-md p-4 rounded-xl border mb-6 ${band.bg}`}>
            <h5 className={`text-base font-bold mb-1 ${band.color}`}>{band.label}</h5>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{band.text}</p>
          </div>

          {/* Medical disclaimer */}
          <div className="w-full max-w-md bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.disclaimer}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRestart}
              className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              {t.restartBtn}
            </Button>
            <Button
              onClick={handleFinishSave}
              className="bg-[#17A884] hover:bg-[#103D35] text-white px-6 font-bold flex items-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t.saveBtn}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
