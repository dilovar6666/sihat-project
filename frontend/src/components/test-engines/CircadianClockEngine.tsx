import React, { useState } from 'react'
import { Sun, Moon, Award, CheckCircle, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface CircadianClockEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

export const CircadianClockEngine: React.FC<CircadianClockEngineProps> = ({ lang, onComplete }) => {
  const [wakeHour, setWakeHour] = useState(7) // 7:00
  const [sleepHour, setSleepHour] = useState(23) // 23:00
  const [screenCutoffHours, setScreenCutoffHours] = useState(1) // 1 hr before bed
  const [daylightMin, setDaylightMin] = useState(45) // 45 min outdoor light
  const [isFinished, setIsFinished] = useState(false)

  const t = {
    ru: {
      title: 'Циркадианный ритм и цифровая гигиена',
      subtitle: 'Анализ светового режима, выработки мелатонина и вечерней синей подсветки.',
      standard: 'Circadian Photobiology & Chronotype Hygiene Standard',
      wakeTitle: 'Время пробуждения:',
      sleepTitle: 'Время отхода ко сну:',
      screenTitle: 'Отказ от ярких экранов до сна:',
      daylightTitle: 'Естественный свет на улице:',
      hours: 'ч',
      min: 'мин',
      syncScore: 'Индекс циркадианной синхронизации',
      normOptimal: 'Отличная циркадианная гигиена (≥ 85%)',
      normGood: 'Удовлетворительный ритм (65–84%)',
      normSub: 'Риск подавления мелатонина (< 65%)',
      finishBtn: 'Рассчитать баланс ритма',
      finishTitle: 'Циркадианный профиль рассчитан',
      completeAndSave: 'Завершить и сохранить',
      tryAgain: 'Скорректировать график',
    },
    tj: {
      title: 'Ритми сиркадӣ ва гигиенаи рақамӣ',
      subtitle: 'Таҳлили равшанӣ, хоб ва таъсири экранҳои электронӣ.',
      standard: 'Circadian Photobiology & Chronotype Hygiene Standard',
      wakeTitle: 'Вақти бедоршавӣ:',
      sleepTitle: 'Вақти хобравӣ:',
      screenTitle: 'Қатъи экранҳо пеш аз хоб:',
      daylightTitle: 'Равшании табиӣ дар кӯча:',
      hours: 'соат',
      min: 'дақ',
      syncScore: 'Шохиси ҳамоҳангии сиркадӣ',
      normOptimal: 'Гигиенаи олии сиркадӣ (≥ 85%)',
      normGood: 'Ритми қаноатбахш (65–84%)',
      normSub: 'Хавфи халалдоршавии хоб (< 65%)',
      finishBtn: 'Ҳисоб кардани ритм',
      finishTitle: 'Профили сиркадӣ ҳисоб шуд',
      completeAndSave: 'Анҷом ва сабт кардан',
      tryAgain: 'Ислоҳ кардани реҷа',
    },
    en: {
      title: 'Circadian Hygiene & Light Alignment',
      subtitle: 'Evaluation of photobiology, melatonin curve integrity, and evening blue light exposure.',
      standard: 'Circadian Photobiology Standard',
      wakeTitle: 'Wake-up time:',
      sleepTitle: 'Bedtime:',
      screenTitle: 'Pre-sleep screen cutoff:',
      daylightTitle: 'Outdoor daylight exposure:',
      hours: 'h',
      min: 'min',
      syncScore: 'Circadian Synchronization Index',
      normOptimal: 'Optimal Circadian Hygiene (≥ 85%)',
      normGood: 'Moderate Alignment (65–84%)',
      normSub: 'Melatonin Suppression Risk (< 65%)',
      finishBtn: 'Calculate Circadian Balance',
      finishTitle: 'Circadian Evaluation Completed',
      completeAndSave: 'Complete & Save',
      tryAgain: 'Adjust Schedule',
    },
  }[lang]

  // Calculate circadian score
  const sleepDuration = (sleepHour > wakeHour ? 24 - sleepHour + wakeHour : wakeHour - sleepHour)
  let score = 50
  if (sleepDuration >= 7 && sleepDuration <= 9) score += 20
  else if (sleepDuration >= 6) score += 10

  if (screenCutoffHours >= 2) score += 20
  else if (screenCutoffHours >= 1) score += 10
  else score -= 10

  if (daylightMin >= 60) score += 15
  else if (daylightMin >= 30) score += 10

  score = Math.max(20, Math.min(98, score))

  const handleFinish = () => {
    let category = t.normGood
    if (score >= 85) category = t.normOptimal
    else if (score < 65) category = t.normSub

    onComplete({
      summary: `${t.syncScore}: ${score}% (${category}). Sleep: ${sleepDuration}h, Daylight: ${daylightMin}min, Screen cutoff: ${screenCutoffHours}h.`,
      metrics: {
        circadian_score: score,
        sleep_hours: sleepDuration,
        daylight_minutes: daylightMin,
        screen_cutoff_hours: screenCutoffHours,
        status_category: category,
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <Sun className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        <span className="text-xs font-mono text-zinc-500">
          Sync: <span className="font-bold text-emerald-500">{score}%</span>
        </span>
      </div>

      {!isFinished ? (
        <div className="w-full flex flex-col items-center">
          {/* Circular 24-Hour Dial Graphic */}
          <div className="w-full max-w-xs aspect-square rounded-full border-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl relative flex items-center justify-center p-6 mb-8">
            {/* Center Dial Hub */}
            <div className="text-center z-10">
              <Sun className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <div className="text-3xl font-black text-emerald-500 font-mono">{score}%</div>
              <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mt-0.5">
                24H RHYTHM
              </div>
            </div>

            {/* Orbiting Moon & Sun Indicators */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[10px] font-mono text-zinc-400">
              <Moon className="w-3 h-3 text-cyan-400" />
              <span>00:00</span>
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-400">
              12:00
            </div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400">
              06:00
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400">
              18:00
            </div>
          </div>

          {/* Interactive Controls */}
          <div className="w-full space-y-4 mb-8">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                <span>{t.wakeTitle}</span>
                <span className="font-mono text-emerald-500 font-bold">{wakeHour}:00</span>
              </div>
              <input
                type="range"
                min="5"
                max="11"
                value={wakeHour}
                onChange={(e) => setWakeHour(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                <span>{t.sleepTitle}</span>
                <span className="font-mono text-cyan-500 font-bold">{sleepHour}:00</span>
              </div>
              <input
                type="range"
                min="20"
                max="26"
                value={sleepHour}
                onChange={(e) => setSleepHour(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                <span>{t.screenTitle}</span>
                <span className="font-mono text-amber-500 font-bold">{screenCutoffHours} {t.hours}</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                value={screenCutoffHours}
                onChange={(e) => setScreenCutoffHours(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                <span>{t.daylightTitle}</span>
                <span className="font-mono text-emerald-500 font-bold">{daylightMin} {t.min}</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={daylightMin}
                onChange={(e) => setDaylightMin(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <Button variant="emerald" size="lg" onClick={() => setIsFinished(true)} className="gap-2 w-full max-w-sm">
            <CheckCircle className="w-5 h-5" />
            <span>{t.finishBtn}</span>
          </Button>
        </div>
      ) : (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 max-w-xs mx-auto my-6">
            <div className="text-xs text-zinc-500 mb-1">{t.syncScore}</div>
            <div className="text-4xl font-black text-emerald-500 font-mono">
              {score}%
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              {score >= 85 ? t.normOptimal : score >= 65 ? t.normGood : t.normSub}
            </div>
          </div>

          <div className="flex gap-3 justify-center max-w-sm mx-auto">
            <Button variant="outline" onClick={() => setIsFinished(false)} className="gap-2 flex-1">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" onClick={handleFinish} className="gap-2 flex-1">
              <CheckCircle className="w-4 h-4" />
              <span>{t.completeAndSave}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
