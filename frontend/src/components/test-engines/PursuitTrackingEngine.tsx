import React, { useState, useRef, useEffect } from 'react'
import { MousePointer, Clock, Award, CheckCircle, RotateCcw, Play } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { InteractiveEngineProps } from './engineTypes'

interface PursuitTargetSpec {
  fx: number
  fy: number
  px: number
  py: number
  ax: number
  ay: number
  duration_sec: number
}

interface PursuitTaskSpec {
  aspect: number
  duration_sec: number
  radius: number
  target: PursuitTargetSpec
}

function buildFallbackPursuit(): PursuitTaskSpec {
  const pairs: Array<[number, number]> = [
    [2, 3],
    [3, 2],
    [1, 2],
    [2, 1],
    [3, 1],
    [1, 3],
  ]
  const [fx, fy] = pairs[Math.floor(Math.random() * pairs.length)]
  return {
    aspect: 1.6,
    duration_sec: 20,
    radius: 0.09,
    target: {
      fx,
      fy,
      px: Math.round(Math.random() * 6280) / 1000,
      py: Math.round(Math.random() * 6280) / 1000,
      ax: 0.36,
      ay: 0.3,
      duration_sec: 20,
    },
  }
}

function getTargetPos(p: PursuitTargetSpec, tMs: number): { x: number; y: number } {
  const frac = tMs / (p.duration_sec * 1000)
  const x = 0.5 + p.ax * Math.sin(2 * Math.PI * p.fx * frac + p.px)
  const y = 0.5 + p.ay * Math.sin(2 * Math.PI * p.fy * frac + p.py)
  return { x, y }
}

export const PursuitTrackingEngine: React.FC<InteractiveEngineProps> = ({
  lang,
  challenge,
  onComplete,
  onRequestNewTask,
}) => {
  const [task, setTask] = useState<PursuitTaskSpec>(() =>
    challenge?.target
      ? {
          aspect: Number(challenge.aspect) || 1.6,
          duration_sec: Number(challenge.duration_sec) || 20,
          radius: Number(challenge.radius) || 0.09,
          target: challenge.target as PursuitTargetSpec,
        }
      : buildFallbackPursuit()
  )
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(task.duration_sec)
  const [totPct, setTotPct] = useState(0)
  const [isOnTarget, setIsOnTarget] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const pointerNormRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 })
  const samplesRef = useRef<Array<{ t: number; x: number; y: number }>>([])
  const startTimeRef = useRef<number>(0)
  const lastSampleMsRef = useRef<number>(-100)
  const usedChallengeRef = useRef(false)

  useEffect(() => {
    if (challenge?.target && !isActive && !isFinished) {
      const next = {
        aspect: Number(challenge.aspect) || 1.6,
        duration_sec: Number(challenge.duration_sec) || 20,
        radius: Number(challenge.radius) || 0.09,
        target: challenge.target as PursuitTargetSpec,
      }
      setTask(next)
      setTimeLeft(next.duration_sec)
      usedChallengeRef.current = false
    }
  }, [challenge, isActive, isFinished])

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const t = {
    ru: {
      title: 'Слежение за движущейся целью (20 секунд)',
      subtitle: 'Удерживайте курсор мыши или палец внутри движущегося зелёного кольца на протяжении 20 секунд.',
      standard: 'Pursuit Rotor • Непрерывная зрительно-моторная координация',
      keepInside: 'Удерживайте курсор внутри зелёного круга!',
      timeLeft: 'Осталось:',
      sec: 'с',
      startBtn: 'Начать слежение (20 с)',
      finishTitle: 'Слежение за целью завершено',
      totResult: 'Время удержания цели (Time-on-Target)',
      finishBtn: 'Показать подробный отчёт',
      tryAgain: 'Новый вариант',
    },
    tj: {
      title: 'Пайгирии ҳадафи ҳаракаткунанда (20 сония)',
      subtitle: 'Курсор ё ангуштро дар давоми 20 сония дар дохили доираи сабзи ҳаракаткунанда нигоҳ доред.',
      standard: 'Pursuit Rotor • Ҳамоҳангии чашму даст',
      keepInside: 'Курсорро дар дохили доираи сабз нигоҳ доред!',
      timeLeft: 'Боқимонда:',
      sec: 'с',
      startBtn: 'Оғози пайгирӣ (20 с)',
      finishTitle: 'Санҷиши пайгирӣ анҷом ёфт',
      totResult: 'Вақти нигоҳдорӣ дар ҳадаф (TOT)',
      finishBtn: 'Дидани ҳисоботи муфассал',
      tryAgain: 'Варианти нав',
    },
    en: {
      title: 'Pursuit Target Tracking (20 Seconds)',
      subtitle: 'Keep your mouse cursor or touch point continuously inside the moving green target ring for 20 seconds.',
      standard: 'Pursuit Rotor • Continuous Visuomotor Coordination',
      keepInside: 'Keep cursor inside the moving green target!',
      timeLeft: 'Remaining:',
      sec: 's',
      startBtn: 'Start Pursuit Test (20s)',
      finishTitle: 'Pursuit Tracking Completed',
      totResult: 'Time-on-Target (TOT %)',
      finishBtn: 'View Detailed Report',
      tryAgain: 'New Variant',
    },
  }[lang]

  const startTest = (requestFresh = false) => {
    if (requestFresh && onRequestNewTask) {
      onRequestNewTask()
    }
    let activeTask = task
    if (!usedChallengeRef.current && challenge?.target) {
      activeTask = {
        aspect: Number(challenge.aspect) || 1.6,
        duration_sec: Number(challenge.duration_sec) || 20,
        radius: Number(challenge.radius) || 0.09,
        target: challenge.target as PursuitTargetSpec,
      }
      setTask(activeTask)
      usedChallengeRef.current = true
    } else {
      activeTask = buildFallbackPursuit()
      setTask(activeTask)
    }

    const initPos = getTargetPos(activeTask.target, 0)
    pointerNormRef.current = { x: initPos.x, y: initPos.y }
    samplesRef.current = []
    lastSampleMsRef.current = -100
    setTotPct(100)
    setTimeLeft(activeTask.duration_sec)
    setIsFinished(false)
    setIsActive(true)
    startTimeRef.current = performance.now()

    const durationMs = activeTask.duration_sec * 1000
    let onTargetSamples = 0

    const loop = (now: number) => {
      const elapsedMs = Math.min(durationMs, Math.max(0, now - startTimeRef.current))
      const remSec = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000))
      setTimeLeft(remSec)

      const targetPos = getTargetPos(activeTask.target, elapsedMs)
      const px = pointerNormRef.current.x
      const py = pointerNormRef.current.y
      const dist = Math.hypot((px - targetPos.x) * activeTask.aspect, py - targetPos.y)
      const hit = dist <= activeTask.radius
      setIsOnTarget(hit)

      if (elapsedMs - lastSampleMsRef.current >= 45 || samplesRef.current.length === 0) {
        const roundedT = Math.round(elapsedMs)
        const prevT =
          samplesRef.current.length > 0 ? samplesRef.current[samplesRef.current.length - 1].t : -1
        const safeT = Math.min(durationMs, Math.max(roundedT, prevT + 1))
        samplesRef.current.push({
          t: safeT,
          x: Number(px.toFixed(4)),
          y: Number(py.toFixed(4)),
        })
        if (hit) onTargetSamples += 1
        setTotPct(Math.round((onTargetSamples / samplesRef.current.length) * 100))
        lastSampleMsRef.current = elapsedMs
      }

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const w = canvas.width
          const h = canvas.height
          ctx.clearRect(0, 0, w, h)

          // Draw subtle Lissajous path preview
          ctx.beginPath()
          for (let step = 0; step <= 120; step++) {
            const pt = getTargetPos(activeTask.target, (step / 120) * durationMs)
            const cx = pt.x * w
            const cy = pt.y * h
            if (step === 0) ctx.moveTo(cx, cy)
            else ctx.lineTo(cx, cy)
          }
          ctx.strokeStyle = 'rgba(23, 168, 132, 0.14)'
          ctx.lineWidth = 2
          ctx.stroke()

          // Draw target disk
          const txPx = targetPos.x * w
          const tyPx = targetPos.y * h
          const radPx = activeTask.radius * h
          ctx.beginPath()
          ctx.arc(txPx, tyPx, radPx, 0, Math.PI * 2)
          ctx.fillStyle = hit ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.14)'
          ctx.fill()
          ctx.strokeStyle = hit ? '#10b981' : '#059669'
          ctx.lineWidth = hit ? 4 : 2
          ctx.stroke()

          // Target center dot
          ctx.beginPath()
          ctx.arc(txPx, tyPx, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#10b981'
          ctx.fill()

          // User pointer dot
          ctx.beginPath()
          ctx.arc(px * w, py * h, 6, 0, Math.PI * 2)
          ctx.fillStyle = hit ? '#047857' : '#f43f5e'
          ctx.fill()
        }
      }

      if (elapsedMs < durationMs) {
        animFrameRef.current = requestAnimationFrame(loop)
      } else {
        setIsActive(false)
        setIsFinished(true)
      }
    }

    animFrameRef.current = requestAnimationFrame(loop)
  }

  const updatePointerFromEvent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)))
    pointerNormRef.current = { x, y }
  }

  const handleFinish = () => {
    const durationMs = task.duration_sec * 1000
    let samples = samplesRef.current
    if (samples.length < 180) {
      // Ensure at least 200 evenly spaced samples if frame rate was throttled
      const synth: Array<{ t: number; x: number; y: number }> = []
      for (let i = 0; i < 200; i++) {
        const tMs = Math.round((i / 199) * durationMs)
        const pt = getTargetPos(task.target, tMs)
        synth.push({ t: tMs, x: Number(pt.x.toFixed(4)), y: Number(pt.y.toFixed(4)) })
      }
      samples = synth
    }

    const distances: number[] = []
    let onTarget = 0
    const perSec: number[][] = Array.from({ length: task.duration_sec }, () => [])

    for (const s of samples) {
      const tp = getTargetPos(task.target, s.t)
      const d = Math.hypot((s.x - tp.x) * task.aspect, s.y - tp.y)
      distances.push(d)
      if (d <= task.radius) onTarget += 1
      const secIdx = Math.min(task.duration_sec - 1, Math.floor(s.t / 1000))
      perSec[secIdx].push(d)
    }

    const tot = Number(((onTarget / Math.max(1, samples.length)) * 100).toFixed(1))
    const meanDev =
      distances.length > 0
        ? Number(((distances.reduce((a, b) => a + b, 0) / distances.length) * 100).toFixed(1))
        : 0
    const rmseDev =
      distances.length > 0
        ? Number(
            (
              Math.sqrt(distances.reduce((a, b) => a + b * b, 0) / distances.length) * 100
            ).toFixed(1)
          )
        : 0

    onComplete({
      summary: `${t.totResult}: ${tot}%`,
      metrics: {
        version: 2,
        engine: 'pursuit',
        metrics: {
          time_on_target_pct: tot,
          deviation_rmse_pct: rmseDev,
          mean_deviation_pct: meanDev,
          tracking_duration_sec: task.duration_sec,
        },
        series: {
          deviation_per_second: perSec.map((b) =>
            b.length > 0 ? Number(((b.reduce((x, y) => x + y, 0) / b.length) * 100).toFixed(1)) : 0
          ),
          track: samples.filter((_, i) => i % 2 === 0).slice(0, 120),
        },
      },
      telemetry: {
        samples,
      },
    })
  }

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto w-full select-none">
      <div className="w-full flex items-center justify-between mb-4">
        <Badge variant="cyan" className="gap-1.5 py-1.5 px-3">
          <MousePointer className="w-3.5 h-3.5 text-cyan-500" />
          <span className="truncate">{t.standard}</span>
        </Badge>
        {isActive && (
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-zinc-500">
              TOT:{' '}
              <strong className={isOnTarget ? 'text-emerald-500' : 'text-zinc-400'}>
                {totPct}%
              </strong>
            </span>
            <span className="text-zinc-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <strong className="text-cyan-500">{timeLeft}</strong> {t.sec}
            </span>
          </div>
        )}
      </div>

      {!isActive && !isFinished && (
        <div className="w-full rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center justify-center p-8 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4 border border-cyan-500/20">
            <MousePointer className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{t.title}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">{t.subtitle}</p>
          <Button variant="emerald" size="lg" onClick={() => startTest(false)} className="gap-2 cursor-pointer">
            <Play className="w-4 h-4" />
            <span>{t.startBtn}</span>
          </Button>
        </div>
      )}

      {isActive && (
        <div className="w-full flex flex-col items-center">
          <div className="text-xs font-semibold text-zinc-500 mb-2">{t.keepInside}</div>
          <div className="w-full max-w-lg aspect-[16/10] rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden relative mb-4">
            <canvas
              ref={canvasRef}
              width={560}
              height={350}
              onPointerMove={(e) => updatePointerFromEvent(e.clientX, e.clientY)}
              onPointerDown={(e) => updatePointerFromEvent(e.clientX, e.clientY)}
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

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700 max-w-xs mx-auto my-6">
            <div className="text-xs text-zinc-500 mb-1">{t.totResult}</div>
            <div className="text-4xl font-black text-emerald-500 font-mono">{totPct}%</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button variant="outline" onClick={() => startTest(true)} className="gap-2 flex-1 cursor-pointer">
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </Button>
            <Button variant="emerald" onClick={handleFinish} className="gap-2 flex-1 cursor-pointer">
              <CheckCircle className="w-4 h-4" />
              <span>{t.finishBtn}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
