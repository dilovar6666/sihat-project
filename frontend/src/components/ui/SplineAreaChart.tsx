import React, { useState } from 'react'

export interface SplineSeries {
  name: string
  color: string // e.g. '#A3E635' (lime) or '#38BDF8' (sky/blue)
  gradientColor?: string
  data: number[]
}

export interface SplineAreaChartProps {
  title?: string
  subtitle?: string
  xLabels: string[]
  series: SplineSeries[]
  yMin?: number
  yMax?: number
  height?: number
  unit?: string
  className?: string
  showLegend?: boolean
}

/**
 * Computes smooth cubic Bezier control points for Catmull-Rom spline.
 */
function getSplinePath(points: { x: number; y: number }[], tension = 0.22): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i < points.length - 2 ? points[i + 2] : p2

    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension

    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }

  return d
}

export const SplineAreaChart: React.FC<SplineAreaChartProps> = ({
  title,
  subtitle,
  xLabels,
  series,
  yMin,
  yMax,
  height = 280,
  unit = '',
  className = '',
  showLegend = true,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // Canvas bounds
  const paddingLeft = 45
  const paddingRight = 25
  const paddingTop = 25
  const paddingBottom = 40
  const width = 800 // base viewBox coordinate width

  const plotWidth = width - paddingLeft - paddingRight
  const plotHeight = height - paddingTop - paddingBottom

  // Calculate data ranges
  const allValues = series.flatMap((s) => s.data)
  const computedMin = yMin !== undefined ? yMin : Math.min(0, Math.min(...allValues))
  const computedMax =
    yMax !== undefined
      ? yMax
      : Math.max(10, Math.ceil((Math.max(...allValues, 100) * 1.15) / 10) * 10)

  const yRange = Math.max(1, computedMax - computedMin)

  // Map values to coordinates
  const getX = (index: number) => {
    if (xLabels.length <= 1) return paddingLeft + plotWidth / 2
    return paddingLeft + (index / (xLabels.length - 1)) * plotWidth
  }

  const getY = (val: number) => {
    const clamped = Math.max(computedMin, Math.min(computedMax, val))
    const ratio = (clamped - computedMin) / yRange
    return paddingTop + plotHeight - ratio * plotHeight
  }

  // Y-axis tick steps (5 ticks)
  const tickCount = 5
  const yTicks = Array.from({ length: tickCount }).map((_, i) => {
    const val = computedMin + (i / (tickCount - 1)) * yRange
    return Math.round(val)
  })

  return (
    <div
      className={`rounded-3xl bg-slate-50 dark:bg-[#131C1A] border border-slate-200/80 dark:border-[#1E302B] p-5 sm:p-6 shadow-sm space-y-4 ${className}`}
    >
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            {title && (
              <h4 className="text-base font-bold text-slate-900 dark:text-white">{title}</h4>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>

          {showLegend && (
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              {series.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span
                    className="w-3 h-1.5 rounded-full inline-block shadow-sm"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SVG Container */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible font-mono"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {series.map((s, idx) => {
              const gradId = `spline-grad-${idx}`
              const gradColor = s.gradientColor || s.color
              return (
                <linearGradient key={gradId} id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradColor} stopOpacity="0.45" />
                  <stop offset="60%" stopColor={gradColor} stopOpacity="0.12" />
                  <stop offset="100%" stopColor={gradColor} stopOpacity="0.0" />
                </linearGradient>
              )
            })}
          </defs>

          {/* Dotted Horizontal Grid lines & Y-axis labels */}
          {yTicks.map((tickVal, i) => {
            const y = getY(tickVal)
            return (
              <g key={`ytick-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-slate-200/80 dark:text-slate-800/80"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {tickVal}
                </text>
              </g>
            )
          })}

          {/* Vertical Dotted Grid lines */}
          {xLabels.map((_, i) => {
            const x = getX(i)
            return (
              <line
                key={`xgrid-${i}`}
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={paddingTop + plotHeight}
                stroke="currentColor"
                strokeDasharray="2 3"
                className="text-slate-200/50 dark:text-slate-800/50"
                strokeWidth="1"
              />
            )
          })}

          {/* Hover Column Indicator */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={paddingTop}
              x2={getX(hoverIndex)}
              y2={paddingTop + plotHeight}
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="opacity-70"
            />
          )}

          {/* Render Series Areas and Lines */}
          {series.map((s, idx) => {
            const points = s.data.map((val, i) => ({ x: getX(i), y: getY(val) }))
            if (points.length === 0) return null

            const linePath = getSplinePath(points)
            const areaPath = `${linePath} L ${points[points.length - 1].x} ${
              paddingTop + plotHeight
            } L ${points[0].x} ${paddingTop + plotHeight} Z`

            return (
              <g key={`series-${idx}`}>
                {/* Area Gradient Fill */}
                <path d={areaPath} fill={`url(#spline-grad-${idx})`} className="transition-all duration-300" />

                {/* Spline Stroke Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300 filter drop-shadow(0 2px 6px rgba(0,0,0,0.25))"
                />

                {/* Point Dots on Vertices */}
                {points.map((pt, pIdx) => {
                  const isHovered = hoverIndex === pIdx
                  return (
                    <circle
                      key={`pt-${pIdx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill={s.color}
                      stroke="#070D0B"
                      strokeWidth={isHovered ? 2.5 : 2}
                      className="transition-all duration-200 cursor-pointer"
                    />
                  )
                })}
              </g>
            )
          })}

          {/* Interactive Mouse Hover Hitboxes */}
          {xLabels.map((_, i) => {
            const x = getX(i)
            const stepWidth = plotWidth / Math.max(1, xLabels.length - 1)
            return (
              <rect
                key={`hit-${i}`}
                x={x - stepWidth / 2}
                y={paddingTop}
                width={stepWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              />
            )
          })}

          {/* X-axis Labels */}
          {xLabels.map((label, i) => {
            const x = getX(i)
            const isHovered = hoverIndex === i
            return (
              <text
                key={`xlabel-${i}`}
                x={x}
                y={paddingTop + plotHeight + 20}
                textAnchor="middle"
                className={`text-[10px] font-mono transition-colors ${
                  isHovered
                    ? 'fill-emerald-400 font-bold'
                    : 'fill-slate-400 dark:fill-slate-500'
                }`}
              >
                {label}
              </text>
            )
          })}
        </svg>

        {/* Floating Tooltip when Hovering a Data Point */}
        {hoverIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none p-2.5 rounded-xl bg-slate-900/95 dark:bg-black/90 backdrop-blur-md border border-slate-700/80 shadow-2xl text-[11px] font-mono z-30 transition-all duration-150"
            style={{
              left: `${Math.min(80, Math.max(15, (getX(hoverIndex) / width) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-bold text-slate-300 pb-1 border-b border-slate-800 mb-1.5 flex items-center justify-between gap-3">
              <span>{xLabels[hoverIndex]}</span>
            </div>
            <div className="space-y-1">
              {series.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-400">{s.name}:</span>
                  </div>
                  <span className="font-bold text-white">
                    {s.data[hoverIndex] ?? '—'} {unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
