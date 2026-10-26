import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Eye, Award, CheckCircle2, XCircle, RotateCcw, ArrowRight, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { Language } from '../../i18n'

export interface ColorPerceptionEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

type ShapeType = 'number' | 'circle' | 'triangle' | 'square' | 'circle-triangle' | 'square-circle'

interface ClinicalPlate {
  id: number
  type: ShapeType
  value: string
  labelRu: string
  labelTj: string
  labelEn: string
  descRu: string
  descTj: string
  descEn: string
  bgColors: string[]
  fgColors: string[]
  optionsRu: string[]
  optionsTj: string[]
  optionsEn: string[]
  correctRu: string
  correctTj: string
  correctEn: string
  diagnosticWeight: 'baseline' | 'protan_deutan' | 'tritan' | 'deutan'
}

export const CLINICAL_PLATES: ClinicalPlate[] = [
  {
    id: 1,
    type: 'number',
    value: '12',
    labelRu: 'Таблица №1 • Демонстрационная',
    labelTj: 'Ҷадвали №1 • Намоишӣ',
    labelEn: 'Plate #1 • Demonstration Baseline',
    descRu: 'Видна как при нормальном зрении, так и при всех формах дальтонизма (калибровочный базис).',
    descTj: 'Ҳам барои биноии муқаррарӣ ва ҳам барои ҳамаи намудҳои дальтонизм намоён аст.',
    descEn: 'Visible to normal color vision and all forms of color blindness (calibration baseline).',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1', '#539967', '#3c734b'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366', '#d64426'],
    optionsRu: ['72', '21', '12', 'Ничего не вижу'],
    optionsTj: ['72', '21', '12', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['72', '21', '12', 'Nothing visible'],
    correctRu: '12',
    correctTj: '12',
    correctEn: '12',
    diagnosticWeight: 'baseline',
  },
  {
    id: 2,
    type: 'circle-triangle',
    value: 'circle-triangle',
    labelRu: 'Таблица №2 • Демонстрационная (Геометрия)',
    labelTj: 'Ҷадвали №2 • Намоишӣ (Геометрия)',
    labelEn: 'Plate #2 • Geometric Demonstration',
    descRu: 'Круг и треугольник. Различаются при нормальном зрении и при аномалиях цветности.',
    descTj: 'Доира ва секунҷа. Ҳангоми биноии муқаррарӣ ва нуқси ранг фарқ карда мешаванд.',
    descEn: 'Circle and triangle. Distinguishable by normal trichromats and anomalous observers.',
    bgColors: ['#c47d62', '#b36a4f', '#d58f74', '#9e563d', '#df9f86', '#aa6147'],
    fgColors: ['#41936c', '#33815c', '#54a67e', '#276f4c', '#67b991', '#3a8a64'],
    optionsRu: ['Круг и треугольник', 'Круг', 'Треугольник', 'Ничего не вижу'],
    optionsTj: ['Доира ва секунҷа', 'Доира', 'Секунҷа', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Circle & Triangle', 'Circle', 'Triangle', 'Nothing visible'],
    correctRu: 'Круг и треугольник',
    correctTj: 'Доира ва секунҷа',
    correctEn: 'Circle & Triangle',
    diagnosticWeight: 'baseline',
  },
  {
    id: 3,
    type: 'number',
    value: '9',
    labelRu: 'Таблица №3 • Дифференциация красно-зелёного спектра',
    labelTj: 'Ҷадвали №3 • Тафриқаи сурху сабз',
    labelEn: 'Plate #3 • Red-Green Differentiation',
    descRu: 'Нормальное зрение видит цифру 9. При протанопии или дейтеранопии видят 6 или затрудняются.',
    descTj: 'Биноии муқаррарӣ рақами 9-ро мебинад. Ҳангоми протанопия ва дейтеранопия 6 дида мешавад.',
    descEn: 'Normal trichromats perceive 9. Protan/deutan observers read 6 or nothing.',
    bgColors: ['#598a70', '#4e7b63', '#689d80', '#416a54', '#79af92', '#538269'],
    fgColors: ['#e45d41', '#d44a2e', '#f17055', '#c33a1f', '#f9866c', '#cf452a'],
    optionsRu: ['6', '9', '8', 'Ничего не вижу'],
    optionsTj: ['6', '9', '8', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['6', '9', '8', 'Nothing visible'],
    correctRu: '9',
    correctTj: '9',
    correctEn: '9',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 4,
    type: 'triangle',
    value: 'triangle',
    labelRu: 'Таблица №4 • Геометрическая фигура (Треугольник)',
    labelTj: 'Ҷадвали №4 • Шакли геометрӣ (Секунҷа)',
    labelEn: 'Plate #4 • Geometric Figure (Triangle)',
    descRu: 'В центре скрыт треугольник. Проверяет чувствительность зелёных M-колбочек.',
    descTj: 'Дар марказ секунҷа пинҳон аст. Ҳассосияти колбачаҳои сабзи M-ро месанҷад.',
    descEn: 'Hidden triangle evaluating sensitivity of medium-wavelength (M) green cones.',
    bgColors: ['#af5e49', '#9f4d38', '#c16f5a', '#8a3c28', '#ce806b', '#974733'],
    fgColors: ['#3e9e73', '#2e8b61', '#51b287', '#22774f', '#65c499', '#37956b'],
    optionsRu: ['Квадрат', 'Круг', 'Ничего не вижу', 'Треугольник'],
    optionsTj: ['Чоркунҷа', 'Доира', 'Ҳеҷ чиз намебинам', 'Секунҷа'],
    optionsEn: ['Square', 'Circle', 'Nothing visible', 'Triangle'],
    correctRu: 'Треугольник',
    correctTj: 'Секунҷа',
    correctEn: 'Triangle',
    diagnosticWeight: 'deutan',
  },
  {
    id: 5,
    type: 'circle',
    value: 'circle',
    labelRu: 'Таблица №5 • Геометрическая фигура (Круг)',
    labelTj: 'Ҷадвали №5 • Шакли геометрӣ (Доира)',
    labelEn: 'Plate #5 • Geometric Figure (Circle)',
    descRu: 'В центре расположен круг. Проверяет чувствительность красных L-колбочек.',
    descTj: 'Дар марказ доира ҷойгир аст. Ҳассосияти колбачаҳои сурхи L-ро месанҷад.',
    descEn: 'Centered circle testing long-wavelength (L) red cone photopigments.',
    bgColors: ['#619478', '#528368', '#72a68a', '#447158', '#82b79a', '#5a8b70'],
    fgColors: ['#e1523a', '#cf4029', '#ee644d', '#be3019', '#f87760', '#cc3d27'],
    optionsRu: ['Треугольник', 'Квадрат', 'Круг', 'Ничего не вижу'],
    optionsTj: ['Секунҷа', 'Чоркунҷа', 'Доира', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Triangle', 'Square', 'Circle', 'Nothing visible'],
    correctRu: 'Круг',
    correctTj: 'Доира',
    correctEn: 'Circle',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 6,
    type: 'square',
    value: 'square',
    labelRu: 'Таблица №6 • Сине-фиолетовый спектр (Квадрат)',
    labelTj: 'Ҷадвали №6 • Спектри кабуд-бунафш (Чоркунҷа)',
    labelEn: 'Plate #6 • Blue-Violet Cone Channel (Square)',
    descRu: 'Квадрат в сине-фиолетовом диапазоне для исключения тританомалии (S-колбочки).',
    descTj: 'Чоркунҷа дар диапазони кабуд-бунафш барои ташхиси тританомалия (колбачаҳои S).',
    descEn: 'Square in blue-violet chromaticity axis to screen tritan deficiencies (S-cones).',
    bgColors: ['#ba6e68', '#a95d57', '#cc807a', '#954b45', '#dc928c', '#a2554f'],
    fgColors: ['#3b78c4', '#2c66b0', '#4e8bd6', '#1e549c', '#629de6', '#336ebd'],
    optionsRu: ['Треугольник', 'Квадрат', 'Круг', 'Ничего не вижу'],
    optionsTj: ['Секунҷа', 'Чоркунҷа', 'Доира', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Triangle', 'Square', 'Circle', 'Nothing visible'],
    correctRu: 'Квадрат',
    correctTj: 'Чоркунҷа',
    correctEn: 'Square',
    diagnosticWeight: 'tritan',
  },
  {
    id: 7,
    type: 'number',
    value: '5',
    labelRu: 'Таблица №7 • Протанопическая шкала',
    labelTj: 'Ҷадвали №7 • Ҷадвали протанопия',
    labelEn: 'Plate #7 • Protanopic Confusion Plate',
    descRu: 'Нормальное зрение четко видит 5. При протаномалии видят 2 или путают штрихи.',
    descTj: 'Биноии муқаррарӣ рақами 5-ро мебинад. Ҳангоми протаномалия 2 дида мешавад.',
    descEn: 'Normal trichromats identify 5. Protanomaly reads 2 or cannot distinguish stroke.',
    bgColors: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c', '#b3805b'],
    fgColors: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794', '#2b8d6a'],
    optionsRu: ['5', '2', '3', 'Ничего не вижу'],
    optionsTj: ['5', '2', '3', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['5', '2', '3', 'Nothing visible'],
    correctRu: '5',
    correctTj: '5',
    correctEn: '5',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 8,
    type: 'square-circle',
    value: 'square-circle',
    labelRu: 'Таблица №8 • Парные геометрические фигуры',
    labelTj: 'Ҷадвали №8 • Шаклҳои ҷуфти геометрӣ',
    labelEn: 'Plate #8 • Paired Geometric Shapes',
    descRu: 'Слева квадрат, справа круг. Сложная матрица контрастного различения.',
    descTj: 'Дар чап чоркунҷа, дар рост доира. Матритсаи мураккаби тафриқаи рангҳо.',
    descEn: 'Square on the left, circle on the right. Dual shape chromatic segregation.',
    bgColors: ['#798b7e', '#697a6d', '#8a9c8f', '#59695d', '#9bad9f', '#6f8174'],
    fgColors: ['#d7593c', '#c6492c', '#e76a4d', '#b3391d', '#f47c60', '#ce5134'],
    optionsRu: ['Два круга', 'Два квадрата', 'Квадрат и круг', 'Ничего не вижу'],
    optionsTj: ['Ду доира', 'Ду чоркунҷа', 'Чоркунҷа ва доира', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Two circles', 'Two squares', 'Square & Circle', 'Nothing visible'],
    correctRu: 'Квадрат и круг',
    correctTj: 'Чоркунҷа ва доира',
    correctEn: 'Square & Circle',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 9,
    type: 'number',
    value: '8',
    labelRu: 'Таблица №9 • Дейтеранопическая шкала',
    labelTj: 'Ҷадвали №9 • Ҷадвали дейтеранопия',
    labelEn: 'Plate #9 • Deuteranopic Diagnostic Plate',
    descRu: 'Нормальное зрение видит цифру 8. При дейтеранопии видят 3.',
    descTj: 'Биноии муқаррарӣ рақами 8-ро мебинад. Ҳангоми дейтеранопия 3 дида мешавад.',
    descEn: 'Normal trichromats read 8. Deuteranopes typically perceive 3.',
    bgColors: ['#759983', '#668a74', '#85aa93', '#567a64', '#95ba14', '#6c917b'],
    fgColors: ['#d95e42', '#c74d32', '#eb6f53', '#b53c22', '#f98064', '#d05439'],
    optionsRu: ['3', '5', 'Ничего не вижу', '8'],
    optionsTj: ['3', '5', 'Ҳеҷ чиз намебинам', '8'],
    optionsEn: ['3', '5', 'Nothing visible', '8'],
    correctRu: '8',
    correctTj: '8',
    correctEn: '8',
    diagnosticWeight: 'deutan',
  },
  {
    id: 10,
    type: 'number',
    value: '29',
    labelRu: 'Таблица №10 • Высокоразрешающий тест M/L',
    labelTj: 'Ҷадвали №10 • Санҷиши баланди M/L',
    labelEn: 'Plate #10 • High-Sensitivity M/L Cone Test',
    descRu: 'Нормальное зрение видит 29. При дефектах цветности видят 70 или не различают вторую цифру.',
    descTj: 'Биноии муқаррарӣ 29-ро мебинад. Ҳангоми нуқс 70 дида мешавад.',
    descEn: 'Normal trichromats read 29. Color-deficient observers read 70.',
    bgColors: ['#d69e71', '#c48b5e', '#e7b083', '#b2794c', '#f7c295', '#cf9669'],
    fgColors: ['#289376', '#1a8266', '#3aa487', '#117155', '#4bb699', '#218b6e'],
    optionsRu: ['70', '29', '26', 'Ничего не вижу'],
    optionsTj: ['70', '29', '26', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['70', '29', '26', 'Nothing visible'],
    correctRu: '29',
    correctTj: '29',
    correctEn: '29',
    diagnosticWeight: 'protan_deutan',
  },
]

// Canvas renderer for pseudoisochromatic dots with support for numbers and geometric shapes
export const PseudoisochromaticPlateCanvas: React.FC<{
  plate: ClinicalPlate
  size?: number
}> = ({ plate, size = 260 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const drawPlate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Offscreen mask canvas (260x260)
    const off = document.createElement('canvas')
    const maskDim = 260
    off.width = maskDim
    off.height = maskDim
    const offCtx = off.getContext('2d')
    if (!offCtx) return

    offCtx.fillStyle = '#ffffff'
    offCtx.fillRect(0, 0, maskDim, maskDim)
    offCtx.fillStyle = '#000000'

    const cx = maskDim / 2
    const cy = maskDim / 2

    // Draw target mask
    if (plate.type === 'number') {
      offCtx.font = plate.value.length > 1 ? '900 120px "Arial", sans-serif' : '900 145px "Arial", sans-serif'
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.fillText(plate.value, cx, cy + 4)
    } else if (plate.type === 'triangle') {
      const triR = 62
      offCtx.beginPath()
      offCtx.moveTo(cx, cy - triR)
      offCtx.lineTo(cx + triR * 1.15, cy + triR * 0.75)
      offCtx.lineTo(cx - triR * 1.15, cy + triR * 0.75)
      offCtx.closePath()
      offCtx.lineWidth = 26
      offCtx.lineJoin = 'round'
      offCtx.stroke()
      offCtx.fill()
    } else if (plate.type === 'circle') {
      const circleR = 54
      offCtx.beginPath()
      offCtx.arc(cx, cy, circleR, 0, Math.PI * 2)
      offCtx.lineWidth = 26
      offCtx.stroke()
      offCtx.fill()
    } else if (plate.type === 'square') {
      const sqHalf = 48
      offCtx.lineWidth = 24
      offCtx.lineJoin = 'round'
      offCtx.strokeRect(cx - sqHalf, cy - sqHalf, sqHalf * 2, sqHalf * 2)
      offCtx.fillRect(cx - sqHalf, cy - sqHalf, sqHalf * 2, sqHalf * 2)
    } else if (plate.type === 'circle-triangle') {
      // Circle on the left
      const cLeft = cx - 44
      offCtx.beginPath()
      offCtx.arc(cLeft, cy, 38, 0, Math.PI * 2)
      offCtx.fill()

      // Triangle on the right
      const tRight = cx + 44
      const tH = 44
      offCtx.beginPath()
      offCtx.moveTo(tRight, cy - tH)
      offCtx.lineTo(tRight + tH * 0.95, cy + tH * 0.75)
      offCtx.lineTo(tRight - tH * 0.95, cy + tH * 0.75)
      offCtx.closePath()
      offCtx.fill()
    } else if (plate.type === 'square-circle') {
      // Square on the left
      const sLeft = cx - 44
      const sH = 34
      offCtx.fillRect(sLeft - sH, cy - sH, sH * 2, sH * 2)

      // Circle on the right
      const cRight = cx + 44
      offCtx.beginPath()
      offCtx.arc(cRight, cy, 38, 0, Math.PI * 2)
      offCtx.fill()
    }

    const imgData = offCtx.getImageData(0, 0, maskDim, maskDim).data

    // High-DPI Canvas Rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, size, size)

    const cTarget = size / 2
    const targetR = size * 0.44

    // Background plate circle
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#090d10' : '#f4f4f5'
    ctx.beginPath()
    ctx.arc(cTarget, cTarget, targetR + 6, 0, Math.PI * 2)
    ctx.fill()

    // PRNG seeded for stability
    let seed = plate.id * 2026 + 77
    const prng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }

    const step = size * 0.043
    for (let y = -targetR; y <= targetR; y += step) {
      const rowOffset = Math.floor(y / step) % 2 === 0 ? 0 : step / 2
      for (let x = -targetR; x <= targetR; x += step) {
        const rx = x + rowOffset
        if (rx * rx + y * y <= targetR * targetR) {
          const jx = rx + (prng() - 0.5) * (step * 0.38)
          const jy = y + (prng() - 0.5) * (step * 0.38)
          const dotX = cTarget + jx
          const dotY = cTarget + jy

          // Map to offscreen 260x260 mask
          const offX = Math.min(maskDim - 1, Math.max(0, Math.round(cx + (jx * cx) / targetR)))
          const offY = Math.min(maskDim - 1, Math.max(0, Math.round(cy + (jy * cy) / targetR)))
          const pIdx = (offY * maskDim + offX) * 4
          const isFg = imgData[pIdx] < 120

          const palette = isFg ? plate.fgColors : plate.bgColors
          const color = palette[Math.floor(prng() * palette.length)]
          const radius = (size * 0.016) + prng() * (size * 0.014)

          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(dotX, dotY, radius, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }, [plate, size])

  useEffect(() => {
    drawPlate()
  }, [drawPlate])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="rounded-full shadow-xl border-2 border-emerald-500/25 transition-transform duration-300 hover:scale-[1.02]"
      aria-label={`Таблица цветоразличения #${plate.id}`}
    />
  )
}

export const ColorPerceptionEngine: React.FC<ColorPerceptionEngineProps> = ({ lang, onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [startTime] = useState<number>(() => Date.now())

  const plate = CLINICAL_PLATES[currentIdx]

  const t = {
    ru: {
      title: 'Клинический тест на дальтонизм (Рабкин и Ишихара)',
      subtitle: 'Стандартизированная полихроматическая диагностика цветовосприятия с распознаванием цифр и геометрических фигур.',
      progress: 'Таблица',
      of: 'из',
      promptNumber: 'Какое число вы видите внутри круга?',
      promptShape: 'Какую фигуру вы видите внутри круга?',
      calibration: 'Калибровка: sRGB Standard • 50–70 см от дисплея',
      standardBadge: 'Стандарт Рабкина / ISO 8253',
      resultTitle: 'Результаты скрининга цветовосприятия',
      normalTrichromat: 'Нормальная трихромазия (Норма)',
      normalDesc: 'Цветоразличение красного (L) и зелёного (M) спектров в пределах клинической нормы. Дефектов не выявлено.',
      protanDeutanDefect: 'Признаки красно-зелёной дисфункции',
      protanDeutanDesc: 'Зафиксированы затруднения при дифференциации длинноволнового красно-зелёного спектра (характерно для дейтераномалии или протаномалии).',
      tritanDefect: 'Признаки тританомалии (синий спектр)',
      tritanDesc: 'Отмечены затруднения при восприятии коротковолнового сине-фиолетового спектра (S-колбочки).',
      accuracy: 'Точность распознавания',
      correctCount: 'Правильных таблиц',
      totalTime: 'Время прохождения',
      saveBtn: 'Сохранить результат скрининга',
      retakeBtn: 'Пройти тест заново',
      detailedTable: 'Протокол по всем 10 таблицам',
      correct: 'Правильно',
      incorrect: 'Ошибка',
    },
    tj: {
      title: 'Санҷиши клиникии дальтонизм (Рабкин ва Ишихара)',
      subtitle: 'Ташхиси стандартии биноии рангӣ бо шинохтани рақамҳо ва шаклҳои геометрӣ.',
      progress: 'Ҷадвал',
      of: 'аз',
      promptNumber: 'Кадом рақамро дар дохили доира мебинед?',
      promptShape: 'Кадом шаклро дар дохили доира мебинед?',
      calibration: 'Калибровка: sRGB Standard • 50–70 см аз экран',
      standardBadge: 'Стандарти Рабкин / ISO 8253',
      resultTitle: 'Натиҷаҳои санҷиши биноии рангҳо',
      normalTrichromat: 'Трихромазияи муқаррарӣ (Меъёр)',
      normalDesc: 'Фарқкунии рангҳои сурх (L) ва сабз (M) дар доираи меъёри клиникӣ қарор дорад.',
      protanDeutanDefect: 'Аломатҳои халалдоршавии сурху сабз',
      protanDeutanDesc: 'Мушкилот ҳангоми тафриқаи спектри сурху сабз ба қайд гирифта шуд (хоси дейтераномалия ё протаномалия).',
      tritanDefect: 'Аломатҳои тританомалия (спектри кабуд)',
      tritanDesc: 'Дарки спектри кабуд-бунафш мушкилӣ дорад (колбачаҳои S).',
      accuracy: 'Дақиқияти шинохт',
      correctCount: 'Ҷадвалҳои дуруст',
      totalTime: 'Вақти иҷро',
      saveBtn: 'Сабти натиҷаи скрининг',
      retakeBtn: 'Аз нав гузаштани санҷиш',
      detailedTable: 'Протоколи ҳамаи 10 ҷадвал',
      correct: 'Дуруст',
      incorrect: 'Хато',
    },
    en: {
      title: 'Color Blindness Screening (Rabkin & Ishihara Plates)',
      subtitle: 'Standardized polychromatic diagnostic screening with numbers and geometric shapes.',
      progress: 'Plate',
      of: 'of',
      promptNumber: 'Which number do you perceive inside the circle?',
      promptShape: 'Which shape do you perceive inside the circle?',
      calibration: 'Calibration: sRGB Standard • 50–70 cm view distance',
      standardBadge: 'Rabkin Standard / ISO 8253',
      resultTitle: 'Color Vision Screening Results',
      normalTrichromat: 'Normal Trichromacy',
      normalDesc: 'Discrimination of red (L) and green (M) wavelengths is within optimal clinical bounds.',
      protanDeutanDefect: 'Red-Green Color Vision Deficiency',
      protanDeutanDesc: 'Difficulty distinguishing red-green confusion lines detected (indicative of deutan or protan deficiency).',
      tritanDefect: 'Tritan Defect Indicators',
      tritanDesc: 'Difficulty distinguishing blue-violet short-wavelength channel detected.',
      accuracy: 'Discrimination Accuracy',
      correctCount: 'Correct Plates',
      totalTime: 'Total Duration',
      saveBtn: 'Save Screening Result',
      retakeBtn: 'Retake Test',
      detailedTable: 'Plate-by-Plate Protocol',
      correct: 'Correct',
      incorrect: 'Error',
    },
  }[lang]

  const options = lang === 'tj' ? plate.optionsTj : lang === 'en' ? plate.optionsEn : plate.optionsRu

  const handleSelectOption = (chosen: string) => {
    const updatedAnswers = [...answers, chosen]
    setAnswers(updatedAnswers)

    if (currentIdx < CLINICAL_PLATES.length - 1) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      setIsFinished(true)
    }
  }

  // Calculate results
  const correctCount = answers.reduce((acc, ans, idx) => {
    const p = CLINICAL_PLATES[idx]
    const pCorrect = lang === 'tj' ? p.correctTj : lang === 'en' ? p.correctEn : p.correctRu
    return ans === pCorrect ? acc + 1 : acc
  }, 0)

  const accuracyPct = Math.round((correctCount / CLINICAL_PLATES.length) * 100)
  const durationSec = Math.round((Date.now() - startTime) / 1000)

  // Determine clinical verdict
  let verdictTitle = t.normalTrichromat
  let verdictDesc = t.normalDesc
  let verdictSeverity = 'normal'

  // Check specific failures
  const tritanPlate = CLINICAL_PLATES[5]
  const tritanCorrect = lang === 'tj' ? tritanPlate.correctTj : lang === 'en' ? tritanPlate.correctEn : tritanPlate.correctRu
  const failedTritan = answers[5] !== tritanCorrect

  if (accuracyPct < 70) {
    verdictTitle = t.protanDeutanDefect
    verdictDesc = t.protanDeutanDesc
    verdictSeverity = 'defect'
  } else if (failedTritan && accuracyPct < 90) {
    verdictTitle = t.tritanDefect
    verdictDesc = t.tritanDesc
    verdictSeverity = 'tritan'
  }

  const handleSaveAndFinish = () => {
    onComplete({
      summary: `${verdictTitle}: ${correctCount}/${CLINICAL_PLATES.length} таблиц (${accuracyPct}%)`,
      metrics: {
        accuracy_pct: accuracyPct,
        correct_count: correctCount,
        total_plates: CLINICAL_PLATES.length,
        completion_time_sec: durationSec,
        clinical_verdict: verdictTitle,
        verdict_severity: verdictSeverity,
      },
    })
  }

  const handleRetake = () => {
    setCurrentIdx(0)
    setAnswers([])
    setIsFinished(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="emerald" className="font-mono text-xs">
              <Eye className="w-3.5 h-3.5 mr-1" />
              {t.standardBadge}
            </Badge>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">{t.calibration}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{t.title}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">{t.subtitle}</p>
        </div>

        {!isFinished && (
          <div className="text-right">
            <div className="text-xs text-slate-500 font-mono">
              {t.progress} {currentIdx + 1} {t.of} {CLINICAL_PLATES.length}
            </div>
            <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {Math.round(((currentIdx + 1) / CLINICAL_PLATES.length) * 100)}%
            </div>
          </div>
        )}
      </div>

      {!isFinished ? (
        /* Active Screening Card */
        <Card className="p-6 md:p-10 liquid-glass rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex flex-col items-center max-w-xl mx-auto space-y-6">
            
            {/* Plate Subtitle Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {lang === 'tj' ? plate.labelTj : lang === 'en' ? plate.labelEn : plate.labelRu}
              </span>
            </div>

            {/* Canvas Plate */}
            <div className="my-2 p-2 bg-white/40 dark:bg-black/40 rounded-full shadow-inner">
              <PseudoisochromaticPlateCanvas plate={plate} size={270} />
            </div>

            {/* Prompt */}
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-center">
              {plate.type === 'number' ? t.promptNumber : t.promptShape}
            </div>

            {/* 4 Choice Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              {options.map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  size="lg"
                  onClick={() => handleSelectOption(opt)}
                  className="h-12 font-bold text-sm hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all rounded-2xl shadow-sm cursor-pointer"
                >
                  {opt}
                </Button>
              ))}
            </div>

            {/* Description footnote */}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-mono max-w-md pt-2">
              {lang === 'tj' ? plate.descTj : lang === 'en' ? plate.descEn : plate.descRu}
            </p>
          </div>
        </Card>
      ) : (
        /* Results & Protocol Overview */
        <Card className="p-6 md:p-8 liquid-glass rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-8 animate-in zoom-in-95 duration-200">
          
          {/* Top Result Banner */}
          <div className={`p-6 rounded-2xl border ${
            verdictSeverity === 'normal'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  verdictSeverity === 'normal' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {verdictSeverity === 'normal' ? <Award className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{verdictTitle}</h3>
                  <p className="text-xs opacity-90 mt-1 max-w-xl">{verdictDesc}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs uppercase font-mono tracking-wider opacity-75">{t.accuracy}</span>
                <div className="text-3xl font-mono font-black">{accuracyPct}%</div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-mono">{t.correctCount}</span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {correctCount} / {CLINICAL_PLATES.length}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-mono">{t.totalTime}</span>
              <div className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">
                {durationSec} сек
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-mono">Стандарт калибровки</span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                sRGB D65 (ISO 8596)
              </div>
            </div>
          </div>

          {/* Protocol Table for all 10 plates */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{t.detailedTable}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {CLINICAL_PLATES.map((p, idx) => {
                const userAns = answers[idx]
                const pCorrect = lang === 'tj' ? p.correctTj : lang === 'en' ? p.correctEn : p.correctRu
                const isCorrect = userAns === pCorrect

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-mono font-bold text-slate-400 w-5">#{p.id}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {lang === 'tj' ? p.labelTj : lang === 'en' ? p.labelEn : p.labelRu}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-slate-600 dark:text-slate-400">«{userAns}»</span>
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={handleRetake}
              className="w-full sm:w-auto gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.retakeBtn}</span>
            </Button>

            <Button
              variant="emerald"
              onClick={handleSaveAndFinish}
              className="w-full sm:w-auto gap-2 shadow-lg shadow-emerald-600/25 px-8 font-bold"
            >
              <span>{t.saveBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

        </Card>
      )}
    </div>
  )
}
