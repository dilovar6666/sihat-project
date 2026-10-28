import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Navigation, Clock, AlertTriangle, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { Language } from '../../i18n'

interface CursorPathEngineProps {
  lang: Language
  challenge?: {
    type?: string
    waypoints?: Array<{ x: number; y: number; radius: number }>
    corridor_width_px?: number
  }
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

export const CursorPathEngine: React.FC<CursorPathEngineProps> = ({ lang, challenge, onComplete }) => {
  const defaultWaypoints = [
    { x: 10, y: 50, radius: 24 },
    { x: 30, y: 25, radius: 22 },
    { x: 55, y: 75, radius: 20 },
    { x: 75, y: 35, radius: 20 },
    { x: 90, y: 50, radius: 22 },
  ]

  const waypoints = challenge?.waypoints || defaultWaypoints
  const corridorWidth = challenge?.corridor_width_px || 44

  const [gameState, setGameState] = useState<'idle' | 'running' | 'completed'>('idle')
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState(0)
  const [boundaryViolations, setBoundaryViolations] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isOutside, setIsOutside] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const violationsRef = useRef<number>(0)
  const lastViolationTimeRef = useRef<number>(0)

  const t = {
    ru: {
      title: 'Удержание траектории',
      subtitle: 'Проведите курсор или палец по коридору от точки СТАРТ до ФИНИШ через все контрольные узлы, не выходя за пределы траектории.',
      standard: 'Motor Steering Law / Accot-Zhai Corridor Paradigm',
      startBtn: 'Начать попытку',
      startPoint: 'СТАРТ',
      finishPoint: 'ФИНИШ',
      currentNext: 'Следующая цель:',
      violations: 'Выходов за границы:',
      time: 'Время:',
      sec: 'с',
      warningOutside: 'Курсор вне границ коридора!',
      completedTitle: 'Траектория успешно пройдена',
      accuracy: 'Точность удержания:',
      normHigh: 'Высокая точность управления (≤ 1 выхода)',
      normAvg: 'Нормативная моторика (2–4 выхода)',
      normSub: 'Повышенная вариативность (> 4 выходов)',
      saveBtn: 'Завершить и сохранить',
      tryAgain: 'Попробовать снова',
    },
    tj: {
      title: 'Идораи траектория',
      subtitle: 'Нишоннаморо аз оғоз (СТАРТ) то анҷом (ФИНИШ) тавассути нуқтаҳои назоратӣ гузаронед, бидуни берун баромадан аз роҳрав.',
      standard: 'Motor Steering Law / Accot-Zhai Corridor Paradigm',
      startBtn: 'Оғози кӯшиш',
      startPoint: 'ОҒОЗ',
      finishPoint: 'АНҶОМ',
      currentNext: 'Ҳадафи навбатӣ:',
      violations: 'Берунравиҳо аз роҳрав:',
      time: 'Вақт:',
      sec: 'сон',
      warningOutside: 'Нишоннамо берун аз роҳрав аст!',
      completedTitle: 'Масир бомуваффақият тай шуд',
      accuracy: 'Дақиқии идора:',
      normHigh: 'Дақиқии баланд (≤ 1 берунравӣ)',
      normAvg: 'Меъёри миёна (2–4 берунравӣ)',
      normSub: 'Ноустувории ҳаракат (> 4 берунравӣ)',
      saveBtn: 'Анҷом ва сабт кардан',
      tryAgain: 'Аз нав кӯшиш кардан',
    },
    en: {
      title: 'Steering Corridor Path',
      subtitle: 'Steer the cursor or touch from START to FINISH through all waypoints while staying within the boundaries of the corridor.',
      standard: 'Motor Steering Law / Accot-Zhai Corridor Paradigm',
      startBtn: 'Start Attempt',
      startPoint: 'START',
      finishPoint: 'FINISH',
      currentNext: 'Next Target:',
      violations: 'Boundary Violations:',
      time: 'Time:',
      sec: 's',
      warningOutside: 'Cursor is outside the corridor!',
      completedTitle: 'Corridor Completed Successfully',
      accuracy: 'Path Accuracy:',
      normHigh: 'High Motor Precision (≤ 1 boundary breach)',
      normAvg: 'Normative Control (2–4 breaches)',
      normSub: 'High Motor Variability (> 4 breaches)',
      saveBtn: 'Finish & Save',
      tryAgain: 'Try Again',
    },
  }[lang]

  // Distance from point to line segment
  const distToSegment = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)
    if (l2 === 0) return Math.hypot(px - x1, py - y1)
    let tVal = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2
    tVal = Math.max(0, Math.min(1, tVal))
    const projX = x1 + tVal * (x2 - x1)
    const projY = y1 + tVal * (y2 - y1)
    return Math.hypot(px - projX, py - projY)
  }

  // Draw the corridor and waypoints
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // Calculate absolute coordinates
    const absPoints = waypoints.map((pt) => ({
      x: (pt.x / 100) * w,
      y: (pt.y / 100) * h,
      radius: pt.radius,
    }))

    // 1. Draw corridor background path (tube)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    absPoints.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })

    // Outer corridor border
    ctx.lineWidth = corridorWidth + 12
    ctx.strokeStyle = isOutside ? 'rgba(239, 68, 68, 0.4)' : 'rgba(23, 168, 132, 0.15)'
    ctx.stroke()

    // Inner corridor tube
    ctx.lineWidth = corridorWidth
    ctx.strokeStyle = 'rgba(23, 168, 132, 0.1)'
    ctx.stroke()

    // Center guiding dash line
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.strokeStyle = 'rgba(46, 196, 167, 0.4)'
    ctx.stroke()
    ctx.setLineDash([])

    // 2. Draw waypoints
    absPoints.forEach((p, idx) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)

      if (idx < currentWaypointIdx) {
        // Passed waypoint
        ctx.fillStyle = '#10B981'
        ctx.fill()
        ctx.lineWidth = 3
        ctx.strokeStyle = '#059669'
        ctx.stroke()

        // Checkmark inside
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('✓', p.x, p.y)
      } else if (idx === currentWaypointIdx) {
        // Active target
        ctx.fillStyle = '#2EC4A7'
        ctx.fill()
        ctx.lineWidth = 4
        ctx.strokeStyle = '#103D35'
        ctx.stroke()

        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${idx + 1}`, p.x, p.y)
      } else {
        // Future waypoint
        ctx.fillStyle = 'rgba(100, 116, 139, 0.3)'
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)'
        ctx.stroke()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${idx + 1}`, p.x, p.y)
      }
    })
  }, [waypoints, corridorWidth, currentWaypointIdx, isOutside])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'running') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    const w = canvas.width
    const h = canvas.height

    const absPoints = waypoints.map((pt) => ({
      x: (pt.x / 100) * w,
      y: (pt.y / 100) * h,
      radius: pt.radius,
    }))

    // Check hit on current waypoint
    const currentWp = absPoints[currentWaypointIdx]
    const distToWp = Math.hypot(x - currentWp.x, y - currentWp.y)
    if (distToWp <= currentWp.radius + 8) {
      if (currentWaypointIdx + 1 >= waypoints.length) {
        // Finished!
        finishTest()
        return
      } else {
        setCurrentWaypointIdx((prev) => prev + 1)
      }
    }

    // Check boundary constraint along active segment
    const startWp = currentWaypointIdx === 0 ? absPoints[0] : absPoints[currentWaypointIdx - 1]
    const targetWp = absPoints[currentWaypointIdx]
    const segDist = distToSegment(x, y, startWp.x, startWp.y, targetWp.x, targetWp.y)

    const maxAllowedDist = corridorWidth / 2 + 10
    if (segDist > maxAllowedDist) {
      setIsOutside(true)
      const now = performance.now()
      if (now - lastViolationTimeRef.current > 400) {
        violationsRef.current += 1
        setBoundaryViolations(violationsRef.current)
        lastViolationTimeRef.current = now
      }
    } else {
      setIsOutside(false)
    }
  }

  const startTest = () => {
    setGameState('running')
    setCurrentWaypointIdx(0)
    setBoundaryViolations(0)
    violationsRef.current = 0
    setIsOutside(false)
    startTimeRef.current = performance.now()

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = window.setInterval(() => {
      setElapsedTime(Math.round((performance.now() - startTimeRef.current) / 100) / 10)
    }, 100)
  }

  const finishTest = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setGameState('completed')
    setIsOutside(false)
    const totalSec = Math.round((performance.now() - startTimeRef.current) / 100) / 10
    setElapsedTime(totalSec)
  }

  const handleFinishSave = () => {
    const accuracyPct = Math.max(0, 100 - boundaryViolations * 10)
    onComplete({
      summary: `${t.completedTitle}: ${elapsedTime} ${t.sec}, ${boundaryViolations} ${t.violations.toLowerCase()}`,
      metrics: {
        boundary_violations: boundaryViolations,
        completion_time_sec: elapsedTime,
        path_accuracy_pct: accuracyPct,
      },
    })
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-6 h-6 text-[#17A884]" />
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.title}</h3>
            <p className="text-xs text-slate-500">{t.standard}</p>
          </div>
        </div>
        <Badge variant="outline" className="border-[#17A884]/30 text-[#17A884]">
          {waypoints.length} waypoints
        </Badge>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center max-w-xl">
        {t.subtitle}
      </p>

      {/* Status HUD */}
      {gameState === 'running' && (
        <div className="w-full max-w-2xl flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl px-5 py-3 mb-4 border border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-[#17A884]" />
            <span className="text-sm font-semibold">{t.time}</span>
            <span className="text-base font-mono font-bold text-[#103D35] dark:text-[#2EC4A7]">
              {elapsedTime.toFixed(1)} {t.sec}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">{t.currentNext}</span>
            <span className="px-2 py-0.5 bg-[#2EC4A7]/20 text-[#103D35] dark:text-[#2EC4A7] font-bold rounded text-xs">
              {currentWaypointIdx === 0
                ? t.startPoint
                : currentWaypointIdx === waypoints.length - 1
                ? t.finishPoint
                : `№ ${currentWaypointIdx + 1}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${boundaryViolations > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.violations}</span>
            <span className={`font-mono font-bold text-sm ${boundaryViolations > 0 ? 'text-amber-500' : 'text-slate-500'}`}>
              {boundaryViolations}
            </span>
          </div>
        </div>
      )}

      {/* Warning message if outside */}
      {isOutside && gameState === 'running' && (
        <div className="mb-2 px-4 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-lg flex items-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          {t.warningOutside}
        </div>
      )}

      {/* Canvas Area */}
      <div className="relative w-full max-w-2xl aspect-[16/9] bg-slate-900 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-700/50 touch-none flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          onPointerMove={handlePointerMove}
          className="w-full h-full cursor-crosshair"
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <Navigation className="w-12 h-12 text-[#2EC4A7] mb-3 animate-pulse" />
            <h4 className="text-lg font-bold text-white mb-2">{t.title}</h4>
            <p className="text-xs text-slate-300 max-w-md mb-6">{t.subtitle}</p>
            <Button
              onClick={startTest}
              className="bg-[#17A884] hover:bg-[#103D35] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
            >
              <Play className="w-5 h-5" />
              {t.startBtn}
            </Button>
          </div>
        )}

        {gameState === 'completed' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle className="w-14 h-14 text-[#2EC4A7] mb-3" />
            <h4 className="text-xl font-bold text-white mb-2">{t.completedTitle}</h4>

            <div className="grid grid-cols-2 gap-4 max-w-sm w-full my-4">
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">{t.time}</div>
                <div className="text-xl font-mono font-bold text-[#2EC4A7]">
                  {elapsedTime.toFixed(1)} {t.sec}
                </div>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">{t.violations}</div>
                <div className="text-xl font-mono font-bold text-amber-400">
                  {boundaryViolations}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6">
              {boundaryViolations <= 1 ? t.normHigh : boundaryViolations <= 4 ? t.normAvg : t.normSub}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={startTest}
                className="border-slate-600 text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {t.tryAgain}
              </Button>
              <Button
                onClick={handleFinishSave}
                className="bg-[#17A884] hover:bg-[#103D35] text-white px-6 font-bold flex items-center gap-2 shadow-lg"
              >
                <CheckCircle className="w-4 h-4" />
                {t.saveBtn}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
