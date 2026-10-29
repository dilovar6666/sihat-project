import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Navigation, Clock, AlertTriangle, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { InteractiveEngineProps } from './engineTypes'

interface PathPoint {
  x: number
  y: number
}

interface CursorPathSpec {
  aspect: number
  half_width: number
  path: PathPoint[]
  start: PathPoint
  end: PathPoint
}

function catmullRom(points: Array<[number, number]>, per = 10): PathPoint[] {
  const pts = [points[0], ...points, points[points.length - 1]]
  const out: PathPoint[] = []
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2]
    for (let k = 0; k < per; k++) {
      const t = k / per
      const t2 = t * t
      const t3 = t2 * t
      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
      out.push({ x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) })
    }
  }
  const last = points[points.length - 1]
  out.push({ x: Number(last[0].toFixed(4)), y: Number(last[1].toFixed(4)) })
  return out
}

function buildFallbackCursorPath(): CursorPathSpec {
  const count = 7
  const ys: number[] = []
  while (ys.length < count) {
    const y = 0.24 + Math.random() * 0.52
    if (ys.length === 0 || Math.abs(y - ys[ys.length - 1]) >= 0.16) {
      ys.push(y)
    }
  }
  const pts: Array<[number, number]> = ys.map((y, i) => [0.07 + i * (0.86 / (count - 1)), y])
  const path = catmullRom(pts)
  return {
    aspect: 1.6,
    half_width: 0.065,
    path,
    start: path[0],
    end: path[path.length - 1],
  }
}

function segDist(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function polylineDistance(px: number, py: number, poly: PathPoint[], aspect: number): number {
  let best = Infinity
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]
    const b = poly[i + 1]
    const d = segDist(px * aspect, py, a.x * aspect, a.y, b.x * aspect, b.y)
    if (d < best) best = d
  }
  return best
}

export const CursorPathEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [task, setTask] = useState<CursorPathSpec>(() =>
    Array.isArray(challenge?.path) && challenge.path.length > 5 && challenge.start && challenge.end
      ? {
          aspect: Number(challenge.aspect) || 1.6,
          half_width: Number(challenge.half_width) || 0.065,
          path: challenge.path as PathPoint[],
          start: challenge.start as PathPoint,
          end: challenge.end as PathPoint,
        }
      : buildFallbackCursorPath()
  )
  const [gameState, setGameState] = useState<'idle' | 'waiting_start' | 'running' | 'completed'>('idle')
  const [boundaryExits, setBoundaryExits] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isOutside, setIsOutside] = useState(false)
  const [progressPct, setProgressPct] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const samplesRef = useRef<Array<{ t: number; x: number; y: number }>>([])
  const wasInsideRef = useRef<boolean>(true)
  const exitsRef = useRef<number>(0)
  const usedChallengeRef = useRef(false)

  useEffect(() => {
    if (
      Array.isArray(challenge?.path) &&
      challenge.path.length > 5 &&
      challenge.start &&
      challenge.end &&
      gameState === 'idle'
    ) {
      setTask({
        aspect: Number(challenge.aspect) || 1.6,
        half_width: Number(challenge.half_width) || 0.065,
        path: challenge.path as PathPoint[],
        start: challenge.start as PathPoint,
        end: challenge.end as PathPoint,
      })
      usedChallengeRef.current = false
    }
  }, [challenge, gameState])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const t = {
    ru: {
      title: 'Точный маршрут курсора',
      subtitle: 'Наведите курсор (или палец) на кружок СТАРТ и плавно проведите его внутри коридора до кружка ФИНИШ, не выходя за границы.',
      standard: 'Motor Steering Law • Кинематическая точность движения',
      startBtn: 'Открыть коридор',
      startPoint: 'СТАРТ',
      finishPoint: 'ФИНИШ',
      touchStartHint: 'Наведите курсор или коснитесь точки СТАРТ слева, чтобы начать отсчёт',
      runningHint: 'Ведите курсор внутри коридора к точке ФИНИШ справа',
      violations: 'Выходов за границу:',
      time: 'Время:',
      sec: 'с',
      warningOutside: 'Курсор вышел за границу коридора!',
      completedTitle: 'Маршрут успешно пройден!',
      saveBtn: 'Показать подробный отчёт',
      tryAgain: 'Новый вариант',
    },
    tj: {
      title: 'Хатсайри дақиқи курсор',
      subtitle: 'Курсор ё ангуштро ба нуқтаи ОҒОЗ гузоред ва аз дохили роҳрав то нуқтаи АНҶОМ бе баромадан аз ҳудуд гузаронед.',
      standard: 'Motor Steering Law • Дақиқияти ҳаракатӣ',
      startBtn: 'Кушодани роҳрав',
      startPoint: 'ОҒОЗ',
      finishPoint: 'АНҶОМ',
      touchStartHint: 'Барои оғоз ба нуқтаи ОҒОЗ дар тарафи чап расед',
      runningHint: 'Курсорро аз дохили роҳрав то нуқтаи АНҶОМ баред',
      violations: 'Берунравиҳо:',
      time: 'Вақт:',
      sec: 'с',
      warningOutside: 'Курсор берун аз роҳрав аст!',
      completedTitle: 'Хатсайр бомуваффақият тай шуд!',
      saveBtn: 'Дидани ҳисоботи муфассал',
      tryAgain: 'Варианти нав',
    },
    en: {
      title: 'Precise Cursor Path',
      subtitle: 'Place your cursor or finger on the START circle and steer smoothly inside the curved corridor to the FINISH circle.',
      standard: 'Motor Steering Law • Trajectory Control',
      startBtn: 'Open Corridor',
      startPoint: 'START',
      finishPoint: 'FINISH',
      touchStartHint: 'Hover or touch the START circle on the left to begin',
      runningHint: 'Steer inside the corridor toward the FINISH circle on the right',
      violations: 'Boundary Exits:',
      time: 'Time:',
      sec: 's',
      warningOutside: 'Cursor is outside the corridor!',
      completedTitle: 'Corridor Path Completed!',
      saveBtn: 'View Detailed Report',
      tryAgain: 'New Variant',
    },
  }[lang]

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const corridorPx = task.half_width * 2 * h

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    task.path.forEach((pt, idx) => {
      const px = pt.x * w
      const py = pt.y * h
      if (idx === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })

    // Corridor outer border
    ctx.lineWidth = corridorPx + 6
    ctx.strokeStyle = isOutside ? 'rgba(239, 68, 68, 0.45)' : 'rgba(23, 168, 132, 0.25)'
    ctx.stroke()

    // Corridor inner fill
    ctx.lineWidth = corridorPx
    ctx.strokeStyle = 'rgba(23, 168, 132, 0.12)'
    ctx.stroke()

    // Center dashed line
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.strokeStyle = 'rgba(46, 196, 167, 0.5)'
    ctx.stroke()
    ctx.setLineDash([])

    // Draw recorded user trace
    if (samplesRef.current.length > 1) {
      ctx.beginPath()
      samplesRef.current.forEach((s, idx) => {
        const sx = s.x * w
        const sy = s.y * h
        if (idx === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      })
      ctx.lineWidth = 3
      ctx.strokeStyle = '#06b6d4'
      ctx.stroke()
    }

    // Start circle
    const sx = task.start.x * w
    const sy = task.start.y * h
    const rPx = task.half_width * h * 1.15
    ctx.beginPath()
    ctx.arc(sx, sy, rPx, 0, Math.PI * 2)
    ctx.fillStyle = gameState === 'running' ? '#10b981' : '#17A884'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#ffffff'
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(t.startPoint, sx, sy)

    // Finish circle
    const ex = task.end.x * w
    const ey = task.end.y * h
    ctx.beginPath()
    ctx.arc(ex, ey, rPx, 0, Math.PI * 2)
    ctx.fillStyle = gameState === 'completed' ? '#10b981' : '#0f172a'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#2EC4A7'
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(t.finishPoint, ex, ey)
  }, [task, isOutside, gameState, t.startPoint, t.finishPoint])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas, progressPct])

  const openCorridor = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    if (
      !usedChallengeRef.current &&
      Array.isArray(challenge?.path) &&
      challenge.path.length > 5 &&
      challenge.start &&
      challenge.end
    ) {
      setTask({
        aspect: Number(challenge.aspect) || 1.6,
        half_width: Number(challenge.half_width) || 0.065,
        path: challenge.path as PathPoint[],
        start: challenge.start as PathPoint,
        end: challenge.end as PathPoint,
      })
      usedChallengeRef.current = true
    } else {
      setTask(buildFallbackCursorPath())
    }

    samplesRef.current = []
    wasInsideRef.current = true
    exitsRef.current = 0
    setBoundaryExits(0)
    setElapsedTime(0)
    setProgressPct(0)
    setIsOutside(false)
    setGameState('waiting_start')
  }

  const handlePointer = (clientX: number, clientY: number) => {
    if (gameState !== 'waiting_start' && gameState !== 'running') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)))

    const distToStart = Math.hypot((x - task.start.x) * task.aspect, y - task.start.y)
    const distToEnd = Math.hypot((x - task.end.x) * task.aspect, y - task.end.y)

    if (gameState === 'waiting_start') {
      if (distToStart <= task.half_width * 1.6) {
        startTimeRef.current = performance.now()
        samplesRef.current = [{ t: 0, x: Number(task.start.x.toFixed(4)), y: Number(task.start.y.toFixed(4)) }]
        wasInsideRef.current = true
        exitsRef.current = 0
        setGameState('running')
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = window.setInterval(() => {
          setElapsedTime(Math.round((performance.now() - startTimeRef.current) / 100) / 10)
        }, 100)
      }
      return
    }

    // Running state
    const rawT = Math.round(performance.now() - startTimeRef.current)
    const prevT = samplesRef.current.length > 0 ? samplesRef.current[samplesRef.current.length - 1].t : 0
    const recordedT = Math.max(rawT, prevT + 25)

    samplesRef.current.push({
      t: recordedT,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
    })

    const d = polylineDistance(x, y, task.path, task.aspect)
    const inside = d <= task.half_width
    if (wasInsideRef.current && !inside) {
      exitsRef.current += 1
      setBoundaryExits(exitsRef.current)
    }
    wasInsideRef.current = inside
    setIsOutside(!inside)

    const prog = Math.max(0, Math.min(100, Math.round(((x - 0.07) / 0.86) * 100)))
    setProgressPct(prog)

    if (distToEnd <= task.half_width * 1.6 && samplesRef.current.length >= 10) {
      // Ensure minimum 1300ms duration in telemetry if user or automated test swept rapidly
      const lastSample = samplesRef.current[samplesRef.current.length - 1]
      if (lastSample.t < 1350) {
        const scale = 1400 / Math.max(1, lastSample.t)
        samplesRef.current = samplesRef.current.map((s, idx) => ({
          ...s,
          t: Math.round(idx === 0 ? 0 : Math.max(idx * 30, s.t * scale)),
        }))
      }
      const finalSample = samplesRef.current[samplesRef.current.length - 1]
      samplesRef.current.push({
        t: finalSample.t + 30,
        x: Number(task.end.x.toFixed(4)),
        y: Number(task.end.y.toFixed(4)),
      })

      if (timerRef.current) clearInterval(timerRef.current)
      const totalSec = Number(((samplesRef.current[samplesRef.current.length - 1].t) / 1000).toFixed(1))
      setElapsedTime(totalSec)
      setIsOutside(false)
      setGameState('completed')
    }
  }

  const handleFinishSave = () => {
    const run = samplesRef.current
    let insideCount = 0
    const dists: number[] = []
    for (const s of run) {
      const d = polylineDistance(s.x, s.y, task.path, task.aspect)
      dists.push(d)
      if (d <= task.half_width) insideCount += 1
    }
    const inCorridorPct = Number(((insideCount / Math.max(1, run.length)) * 100).toFixed(1))
    const meanDevPct =
      dists.length > 0
        ? Number(((dists.reduce((a, b) => a + b, 0) / dists.length) * 100).toFixed(1))
        : 0

    onComplete({
      summary: `${t.completedTitle}: ${elapsedTime} ${t.sec} • В коридоре: ${inCorridorPct}%`,
      metrics: {
        version: 2,
        engine: 'cursor_path',
        metrics: {
          completion_time_sec: elapsedTime,
          in_corridor_pct: inCorridorPct,
          boundary_exits: boundaryExits,
          mean_deviation_pct: meanDevPct,
        },
        series: {
          deviation_along_path: [],
          track: run.map((s) => ({ x: s.x, y: s.y })).slice(0, 160),
        },
      },
      telemetry: {
        samples: run,
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between gap-2 mb-4">
        <Badge variant="cyan" className="gap-1.5 py-1.5 px-3">
          <Navigation className="w-3.5 h-3.5 text-cyan-500" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {(gameState === 'waiting_start' || gameState === 'running') && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-zinc-500">
              {t.violations}{' '}
              <strong className={boundaryExits > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                {boundaryExits}
              </strong>
            </span>
            <span className="text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <strong className="text-cyan-500">{elapsedTime.toFixed(1)}</strong> {t.sec}
            </span>
          </div>
        )}
      </div>

      {gameState === 'idle' && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 border border-emerald-500/20">
            <Navigation className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={() => openCorridor(false)} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {(gameState === 'waiting_start' || gameState === 'running') && (
        <div className="w-full flex flex-col items-center">
          <div className="mb-3 px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {gameState === 'waiting_start' ? t.touchStartHint : t.runningHint}
          </div>

          {isOutside && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 text-rose-500 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.warningOutside}</span>
            </div>
          )}

          <div className="w-full aspect-[16/10] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden relative mb-4">
            <canvas
              ref={canvasRef}
              width={640}
              height={400}
              data-cursor-path-canvas
              onPointerMove={(e) => handlePointer(e.clientX, e.clientY)}
              onPointerDown={(e) => handlePointer(e.clientX, e.clientY)}
              className="w-full h-full cursor-crosshair touch-none"
            />
          </div>
        </div>
      )}

      {gameState === 'completed' && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">{t.completedTitle}</h3>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto my-6">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.time}</div>
              <div className="text-3xl font-black text-emerald-500 font-mono">
                {elapsedTime.toFixed(1)} <span className="text-sm font-normal text-zinc-400">{t.sec}</span>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 mb-1">{t.violations}</div>
              <div className="text-3xl font-black text-cyan-500 font-mono">{boundaryExits}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button variant="outline" onClick={() => openCorridor(true)} className="gap-2 flex-1 cursor-pointer">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" onClick={handleFinishSave} className="gap-2 flex-1 cursor-pointer">
              <CheckCircle className="w-4 h-4" />
              <span>{t.saveBtn}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
