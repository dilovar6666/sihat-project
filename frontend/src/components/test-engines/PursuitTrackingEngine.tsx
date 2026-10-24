import React, { useState, useRef, useEffect } from 'react'
import { MousePointer, Clock, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface PursuitTrackingEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

export const PursuitTrackingEngine: React.FC<PursuitTrackingEngineProps> = ({ lang, onComplete }) => {
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [timeOnTargetMs, setTimeOnTargetMs] = useState(0)
  const [isOnTarget, setIsOnTarget] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const targetPosRef = useRef({ x: 200, y: 150 })
  const mousePosRef = useRef({ x: -100, y: -100 })
  const totRef = useRef(0)
  const lastTimeRef = useRef(0)
  const testDuration = 15

  const t = {
    ru: {
      title: 'Зрительно-моторная координация (Pursuit Tracking)',
      subtitle: 'Удерживайте курсор мыши или палец внутри движущейся цели на протяжении 15 секунд.',
      standard: 'Pursuit Rotor / Time-on-Target (TOT) Standard',
      keepInside: 'Удерживайте курсор внутри зелёного диска!',
      timeLeft: 'Осталось:',
      sec: 'сек',
      startBtn: 'Начать слежение',
      finishTitle: 'Тест координации завершен',
      totResult: 'Время удержания цели (TOT)',
      normOptimal: 'Высокая координация (TOT ≥ 80%)',
      normGood: 'Нормативная координация (TOT 60–79%)',
      normSub: 'Затруднения слежения (TOT < 60%)',
      finishBtn: 'Завершить и сохранить',
      tryAgain: 'Попробовать снова',
    },
    tj: {
      title: 'Ҳамоҳангии чашму даст (Pursuit Tracking)',
      subtitle: 'Нишоннамо (курсор)-ро дар давоми 15 сония дар дохили ҳадафи ҳаракаткунанда нигоҳ доред.',
      standard: 'Pursuit Rotor / Time-on-Target (TOT) Standard',
      keepInside: 'Нишоннаморо дар дохили доираи сабз нигоҳ доред!',
      timeLeft: 'Боқимонда:',
      sec: 'сон',
      startBtn: 'Оғози пайгирӣ',
      finishTitle: 'Санҷиши ҳамоҳангӣ анҷом ёфт',
      totResult: 'Вақти нигоҳдорӣ дар ҳадаф (TOT)',
      normOptimal: 'Ҳамоҳангии баланд (TOT ≥ 80%)',
      normGood: 'Меъёри муътадил (TOT 60–79%)',
      normSub: 'Ҳамоҳангии пастшуда (TOT < 60%)',
      finishBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав гузаштан',
    },
    en: {
      title: 'Eye-Hand Pursuit Tracking (TOT)',
      subtitle: 'Keep your mouse cursor or touch point continuously inside the moving target disk for 15 seconds.',
      standard: 'Pursuit Rotor Paradigm',
      keepInside: 'Keep cursor inside target ring!',
      timeLeft: 'Time remaining:',
      sec: 's',
      startBtn: 'Start Pursuit Test',
      finishTitle: 'Pursuit Tracking Completed',
      totResult: 'Time-on-Target (TOT %)',
      normOptimal: 'Superior Motor Tracking (TOT ≥ 80%)',
      normGood: 'Normal Range (TOT 60–79%)',
      normSub: 'Elevated Tracking Variance (TOT < 60%)',
      finishBtn: 'Complete & Save',
      tryAgain: 'Retry',
    },
  }[lang]

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const startTest = () => {
    setIsActive(true)
    setIsFinished(false)
    setTimeLeft(testDuration)
    setTimeOnTargetMs(0)
    totRef.current = 0
    lastTimeRef.current = performance.now()

    let remaining = testDuration
    const timer = setInterval(() => {
      remaining -= 1
      setTimeLeft(remaining)
      if (remaining <= 0) {
        clearInterval(timer)
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        setIsActive(false)
        setIsFinished(true)
      }
    }, 1000)

    // Canvas animation loop
    const render = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const w = canvas.width
          const h = canvas.height

          // Lissajous curve trajectory
          const t = time / 1100
          const targetX = w / 2 + (Math.sin(t * 1.5) * (w / 2 - 50))
          const targetY = h / 2 + (Math.sin(t * 2.2) * (h / 2 - 40))
          targetPosRef.current = { x: targetX, y: targetY }

          // Check hit
          const dx = mousePosRef.current.x - targetX
          const dy = mousePosRef.current.y - targetY
          const radius = 32
          const inTarget = Math.sqrt(dx * dx + dy * dy) <= radius
          setIsOnTarget(inTarget)

          if (inTarget) {
            totRef.current += delta * 1000
            setTimeOnTargetMs(Math.round(totRef.current))
          }

          // Clear & Draw
          ctx.clearRect(0, 0, w, h)

          // Background orbital path hint
          ctx.beginPath()
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)'
          ctx.lineWidth = 2
          ctx.stroke()

          // Draw Target Disk
          ctx.beginPath()
          ctx.arc(targetX, targetY, radius, 0, Math.PI * 2)
          ctx.fillStyle = inTarget ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.15)'
          ctx.fill()
          ctx.strokeStyle = inTarget ? '#10b981' : '#059669'
          ctx.lineWidth = inTarget ? 4 : 2
          ctx.stroke()

          // Draw Center Dot
          ctx.beginPath()
          ctx.arc(targetX, targetY, 4, 0, Math.PI * 2)
          ctx.fillStyle = inTarget ? '#10b981' : '#047857'
          ctx.fill()
        }
      }

      if (remaining > 0) {
        animFrameRef.current = requestAnimationFrame(render)
      }
    }

    animFrameRef.current = requestAnimationFrame(render)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    mousePosRef.current = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const totPercentage = Math.min(100, Math.round((timeOnTargetMs / (testDuration * 1000)) * 100))

  const handleFinish = () => {
    let category = t.normGood
    if (totPercentage >= 80) category = t.normOptimal
    else if (totPercentage < 60) category = t.normSub

    onComplete({
      summary: `${t.totResult}: ${totPercentage}% (${category}).`,
      metrics: {
        time_on_target_pct: totPercentage,
        time_on_target_ms: timeOnTargetMs,
        duration_sec: testDuration,
        status_category: category,
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1">
          <MousePointer className="w-3 h-3" />
          <span>{t.standard}</span>
        </Badge>
        {isActive && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-zinc-500">
              TOT:{' '}
              <span className={`font-bold ${isOnTarget ? 'text-emerald-500' : 'text-zinc-400'}`}>
                {totPercentage}%
              </span>
            </span>
            <span className="text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span className="font-bold text-cyan-500">{timeLeft}</span> {t.sec}
            </span>
          </div>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4">
            <MousePointer className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={startTest} className="gap-2">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="w-full flex flex-col items-center">
          <div className="text-xs text-zinc-500 mb-2">{t.keepInside}</div>
          <div className="w-full max-w-lg aspect-[4/3] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden relative mb-6">
            <canvas
              ref={canvasRef}
              width={500}
              height={375}
              onPointerMove={handlePointerMove}
              className="w-full h-full cursor-crosshair touch-none"
            />
          </div>
        </div>
      )}

      {isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.finishTitle}</h3>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 max-w-xs mx-auto my-6">
            <div className="text-xs text-zinc-500 mb-1">{t.totResult}</div>
            <div className="text-4xl font-black text-emerald-500 font-mono">
              {totPercentage}%
            </div>
          </div>

          <div className="flex gap-3 justify-center max-w-sm mx-auto">
            <Button variant="outline" onClick={startTest} className="gap-2 flex-1">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" onClick={handleFinish} className="gap-2 flex-1">
              <CheckCircle className="w-4 h-4" />
              <span>{t.finishBtn}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
