import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Eye, Award, CheckCircle2, XCircle, RotateCcw, ArrowRight, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { Language } from '../../i18n'

export interface ColorPerceptionEngineProps {
  lang: Language
  onComplete: (result: { summary: string; metrics: Record<string, unknown> }) => void
}

export type ShapeType =
  | 'number'
  | 'letter'
  | 'triangle'
  | 'circle'
  | 'square'
  | 'star'
  | 'diamond'
  | 'cross'
  | 'heart'
  | 'ring'
  | 'pentagon'
  | 'arrow'
  | 'circle-triangle'
  | 'square-circle'
  | 'triangle-square'
  | 'star-circle'
  | 'diamond-triangle'

export interface ClinicalPlate {
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

// Full clinical library of 50 distinct polychromatic plates
export const ALL_CLINICAL_PLATES: ClinicalPlate[] = [
  // --- Numbers (1-20) ---
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
    optionsRu: ['72', '21', '12', '1', 'Ничего не вижу'],
    optionsTj: ['72', '21', '12', '1', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['72', '21', '12', '1', 'Nothing visible'],
    correctRu: '12',
    correctTj: '12',
    correctEn: '12',
    diagnosticWeight: 'baseline',
  },
  {
    id: 2,
    type: 'number',
    value: '9',
    labelRu: 'Таблица №2 • Спектр M/L',
    labelTj: 'Ҷадвали №2 • Спектри M/L',
    labelEn: 'Plate #2 • Red-Green Differentiation',
    descRu: 'Нормальное зрение видит цифру 9. При протанопии или дейтеранопии видят 6 или затрудняются.',
    descTj: 'Биноии муқаррарӣ рақами 9-ро мебинад. Ҳангоми протанопия ва дейтеранопия 6 дида мешавад.',
    descEn: 'Normal trichromats perceive 9. Protan/deutan observers read 6 or nothing.',
    bgColors: ['#598a70', '#4e7b63', '#689d80', '#416a54', '#79af92', '#538269'],
    fgColors: ['#e45d41', '#d44a2e', '#f17055', '#c33a1f', '#f9866c', '#cf452a'],
    optionsRu: ['6', '9', '8', '3', 'Ничего не вижу'],
    optionsTj: ['6', '9', '8', '3', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['6', '9', '8', '3', 'Nothing visible'],
    correctRu: '9',
    correctTj: '9',
    correctEn: '9',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 3,
    type: 'number',
    value: '5',
    labelRu: 'Таблица №3 • Протанопическая шкала',
    labelTj: 'Ҷадвали №3 • Ҷадвали протанопия',
    labelEn: 'Plate #3 • Protanopic Confusion Plate',
    descRu: 'Нормальное зрение четко видит 5. При протаномалии видят 2 или путают штрихи.',
    descTj: 'Биноии муқаррарӣ рақами 5-ро мебинад. Ҳангоми протаномалия 2 дида мешавад.',
    descEn: 'Normal trichromats identify 5. Protanomaly reads 2 or cannot distinguish stroke.',
    bgColors: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c', '#b3805b'],
    fgColors: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794', '#2b8d6a'],
    optionsRu: ['5', '2', '6', '3', 'Ничего не вижу'],
    optionsTj: ['5', '2', '6', '3', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['5', '2', '6', '3', 'Nothing visible'],
    correctRu: '5',
    correctTj: '5',
    correctEn: '5',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 4,
    type: 'number',
    value: '8',
    labelRu: 'Таблица №4 • Дейтеранопическая шкала',
    labelTj: 'Ҷадвали №4 • Ҷадвали дейтеранопия',
    labelEn: 'Plate #4 • Deuteranopic Diagnostic Plate',
    descRu: 'Нормальное зрение видит цифру 8. При дейтеранопии видят 3.',
    descTj: 'Биноии муқаррарӣ рақами 8-ро мебинад. Ҳангоми дейтеранопия 3 дида мешавад.',
    descEn: 'Normal trichromats read 8. Deuteranopes typically perceive 3.',
    bgColors: ['#759983', '#668a74', '#85aa93', '#567a64', '#95ba14', '#6c917b'],
    fgColors: ['#d95e42', '#c74d32', '#eb6f53', '#b53c22', '#f98064', '#d05439'],
    optionsRu: ['3', '5', '8', '9', 'Ничего не вижу'],
    optionsTj: ['3', '5', '8', '9', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['3', '5', '8', '9', 'Nothing visible'],
    correctRu: '8',
    correctTj: '8',
    correctEn: '8',
    diagnosticWeight: 'deutan',
  },
  {
    id: 5,
    type: 'number',
    value: '29',
    labelRu: 'Таблица №5 • Высокоразрешающий тест M/L',
    labelTj: 'Ҷадвали №5 • Санҷиши баланди M/L',
    labelEn: 'Plate #5 • High-Sensitivity M/L Cone Test',
    descRu: 'Нормальное зрение видит 29. При дефектах цветности видят 70 или не различают вторую цифру.',
    descTj: 'Биноии муқаррарӣ 29-ро мебинад. Ҳангоми нуқс 70 дида мешавад.',
    descEn: 'Normal trichromats read 29. Color-deficient observers read 70.',
    bgColors: ['#d69e71', '#c48b5e', '#e7b083', '#b2794c', '#f7c295', '#cf9669'],
    fgColors: ['#289376', '#1a8266', '#3aa487', '#117155', '#4bb699', '#218b6e'],
    optionsRu: ['70', '29', '26', '79', 'Ничего не вижу'],
    optionsTj: ['70', '29', '26', '79', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['70', '29', '26', '79', 'Nothing visible'],
    correctRu: '29',
    correctTj: '29',
    correctEn: '29',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 6,
    type: 'number',
    value: '74',
    labelRu: 'Таблица №6 • Красно-зелёный контраст',
    labelTj: 'Ҷадвали №6 • Контрасти сурху сабз',
    labelEn: 'Plate #6 • Red-Green Distinction',
    descRu: 'Нормальное зрение видит 74. При протаномалии видят 21.',
    descTj: 'Биноии муқаррарӣ 74-ро мебинад. Ҳангоми протаномалия 21 дида мешавад.',
    descEn: 'Normal observers recognize 74; anomalous color vision reads 21.',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['21', '74', '71', '14', 'Ничего не вижу'],
    optionsTj: ['21', '74', '71', '14', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['21', '74', '71', '14', 'Nothing visible'],
    correctRu: '74',
    correctTj: '74',
    correctEn: '74',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 7,
    type: 'number',
    value: '6',
    labelRu: 'Таблица №7 • Протанопический порог',
    labelTj: 'Ҷадвали №7 • Остонаи протанопия',
    labelEn: 'Plate #7 • Protan Threshold',
    descRu: 'Нормальное зрение видит цифру 6. При снижении L-колбочек фон сливается с цифрой.',
    descTj: 'Биноии муқаррарӣ рақами 6-ро мебинад. Замина метавонад бо рақам омезиш ёбад.',
    descEn: 'Normal trichromats discern 6 clearly; L-cone defect merges it into background.',
    bgColors: ['#598a70', '#4e7b63', '#689d80', '#416a54', '#79af92'],
    fgColors: ['#e45d41', '#d44a2e', '#f17055', '#c33a1f', '#f9866c'],
    optionsRu: ['5', '6', '8', '9', 'Ничего не вижу'],
    optionsTj: ['5', '6', '8', '9', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['5', '6', '8', '9', 'Nothing visible'],
    correctRu: '6',
    correctTj: '6',
    correctEn: '6',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 8,
    type: 'number',
    value: '3',
    labelRu: 'Таблица №8 • Дейтеранопический порог',
    labelTj: 'Ҷадвали №8 • Остонаи дейтеранопия',
    labelEn: 'Plate #8 • Deuteranopic Threshold',
    descRu: 'Нормальное зрение видит цифру 3. При дейтераномалии цифра может читаться как 5.',
    descTj: 'Биноии муқаррарӣ рақами 3-ро мебинад. Ҳангоми дейтераномалия ҳамчун 5 дида мешавад.',
    descEn: 'Normal observers read 3; green-cone deficiencies mistake it for 5.',
    bgColors: ['#c47d62', '#b36a4f', '#d58f74', '#9e563d', '#df9f86'],
    fgColors: ['#41936c', '#33815c', '#54a67e', '#276f4c', '#67b991'],
    optionsRu: ['5', '3', '8', '9', 'Ничего не вижу'],
    optionsTj: ['5', '3', '8', '9', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['5', '3', '8', '9', 'Nothing visible'],
    correctRu: '3',
    correctTj: '3',
    correctEn: '3',
    diagnosticWeight: 'deutan',
  },
  {
    id: 9,
    type: 'number',
    value: '45',
    labelRu: 'Таблица №9 • Двузначное распознавание',
    labelTj: 'Ҷадвали №9 • Шинохти дурақама',
    labelEn: 'Plate #9 • Two-Digit Segregation',
    descRu: 'Нормальное зрение видит 45. Нарушение красно-зелёного спектра затрудняет распознавание.',
    descTj: 'Биноии муқаррарӣ 45-ро мебинад.',
    descEn: 'Normal trichromats see 45; red-green defectives struggle to perceive it.',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['45', '46', '15', '43', 'Ничего не вижу'],
    optionsTj: ['45', '46', '15', '43', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['45', '46', '15', '43', 'Nothing visible'],
    correctRu: '45',
    correctTj: '45',
    correctEn: '45',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 10,
    type: 'number',
    value: '16',
    labelRu: 'Таблица №10 • Контраст тёплых тонов',
    labelTj: 'Ҷадвали №10 • Контрасти рангҳои гарм',
    labelEn: 'Plate #10 • Warm Tone Contrast',
    descRu: 'Нормальное зрение видит 16. Проверяет баланс между зелёными и оранжевыми тонами.',
    descTj: 'Биноии муқаррарӣ 16-ро мебинад.',
    descEn: 'Normal vision reads 16; tests discrimination between olive and orange shades.',
    bgColors: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c'],
    fgColors: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794'],
    optionsRu: ['16', '18', '76', '15', 'Ничего не вижу'],
    optionsTj: ['16', '18', '76', '15', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['16', '18', '76', '15', 'Nothing visible'],
    correctRu: '16',
    correctTj: '16',
    correctEn: '16',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 11,
    type: 'number',
    value: '7',
    labelRu: 'Таблица №11 • Односимвольный порог',
    labelTj: 'Ҷадвали №11 • Остонаи як рамзӣ',
    labelEn: 'Plate #11 • Single-Digit Acuity',
    descRu: 'Нормальное зрение видит цифру 7.',
    descTj: 'Биноии муқаррарӣ рақами 7-ро мебинад.',
    descEn: 'Normal vision reads 7 clearly.',
    bgColors: ['#598a70', '#4e7b63', '#689d80', '#416a54', '#79af92'],
    fgColors: ['#e45d41', '#d44a2e', '#f17055', '#c33a1f', '#f9866c'],
    optionsRu: ['1', '7', '2', '4', 'Ничего не вижу'],
    optionsTj: ['1', '7', '2', '4', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['1', '7', '2', '4', 'Nothing visible'],
    correctRu: '7',
    correctTj: '7',
    correctEn: '7',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 12,
    type: 'number',
    value: '2',
    labelRu: 'Таблица №12 • Слабый хроматический контраст',
    labelTj: 'Ҷадвали №12 • Контрасти сусти хроматикӣ',
    labelEn: 'Plate #12 • Low Chromatic Contrast',
    descRu: 'Нормальное зрение видит цифру 2.',
    descTj: 'Биноии муқаррарӣ рақами 2-ро мебинад.',
    descEn: 'Normal vision perceives digit 2 under subtle chromatic separation.',
    bgColors: ['#c47d62', '#b36a4f', '#d58f74', '#9e563d', '#df9f86'],
    fgColors: ['#41936c', '#33815c', '#54a67e', '#276f4c', '#67b991'],
    optionsRu: ['2', '7', '3', '5', 'Ничего не вижу'],
    optionsTj: ['2', '7', '3', '5', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['2', '7', '3', '5', 'Nothing visible'],
    correctRu: '2',
    correctTj: '2',
    correctEn: '2',
    diagnosticWeight: 'deutan',
  },
  {
    id: 13,
    type: 'number',
    value: '73',
    labelRu: 'Таблица №13 • Дифференциальный тест',
    labelTj: 'Ҷадвали №13 • Санҷиши дифференсиалӣ',
    labelEn: 'Plate #13 • Differential Plate',
    descRu: 'Нормальное зрение видит 73. При дефектах цветности фон маскирует символы.',
    descTj: 'Биноии муқаррарӣ 73-ро мебинад.',
    descEn: 'Normal observers read 73; deficiency blends it into surrounding matrix.',
    bgColors: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c'],
    fgColors: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794'],
    optionsRu: ['73', '13', '78', '75', 'Ничего не вижу'],
    optionsTj: ['73', '13', '78', '75', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['73', '13', '78', '75', 'Nothing visible'],
    correctRu: '73',
    correctTj: '73',
    correctEn: '73',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 14,
    type: 'number',
    value: '26',
    labelRu: 'Таблица №14 • Двухцветная матрица',
    labelTj: 'Ҷадвали №14 • Матритсаи дуранга',
    labelEn: 'Plate #14 • Dual Color Plate',
    descRu: 'Нормальное зрение видит 26. Протанопы видят только 6, дейтеранопы — только 2.',
    descTj: 'Биноии муқаррарӣ 26-ро мебинад.',
    descEn: 'Normal trichromats read 26; protanopes read 6, deuteranopes read 2.',
    bgColors: ['#798b7e', '#697a6d', '#8a9c8f', '#59695d', '#9bad9f'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['26', '6', '2', '20', 'Ничего не вижу'],
    optionsTj: ['26', '6', '2', '20', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['26', '6', '2', '20', 'Nothing visible'],
    correctRu: '26',
    correctTj: '26',
    correctEn: '26',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 15,
    type: 'number',
    value: '42',
    labelRu: 'Таблица №15 • Протанопическая пара',
    labelTj: 'Ҷадвали №15 • Ҷуфти протанопия',
    labelEn: 'Plate #15 • Protanopic Pair',
    descRu: 'Нормальное зрение видит 42. При аномалиях различается только одна из цифр.',
    descTj: 'Биноии муқаррарӣ 42-ро мебинад.',
    descEn: 'Normal color vision sees 42; deficient observers usually perceive only 2 or 4.',
    bgColors: ['#c98967', '#b57654', '#dc9c7a', '#a06242', '#eea583'],
    fgColors: ['#2ca58d', '#1e957d', '#3eb79f', '#12836b', '#52c9b1'],
    optionsRu: ['42', '4', '2', '47', 'Ничего не вижу'],
    optionsTj: ['42', '4', '2', '47', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['42', '4', '2', '47', 'Nothing visible'],
    correctRu: '42',
    correctTj: '42',
    correctEn: '42',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 16,
    type: 'number',
    value: '35',
    labelRu: 'Таблица №16 • Скрытая комбинация',
    labelTj: 'Ҷадвали №16 • Комбинатсияи пинҳонӣ',
    labelEn: 'Plate #16 • Hidden Combination',
    descRu: 'Нормальное зрение видит 35. При аномалиях видят только 5 или 3.',
    descTj: 'Биноии муқаррарӣ 35-ро мебинад.',
    descEn: 'Normal trichromats read 35; anomalous readers see 5 or 3.',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['35', '5', '3', '36', 'Ничего не вижу'],
    optionsTj: ['35', '5', '3', '36', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['35', '5', '3', '36', 'Nothing visible'],
    correctRu: '35',
    correctTj: '35',
    correctEn: '35',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 17,
    type: 'number',
    value: '96',
    labelRu: 'Таблица №17 • Комплексный тест L/M',
    labelTj: 'Ҷадвали №17 • Санҷиши комплексии L/M',
    labelEn: 'Plate #17 • Complex L/M Verification',
    descRu: 'Нормальное зрение видит 96.',
    descTj: 'Биноии муқаррарӣ 96-ро мебинад.',
    descEn: 'Normal vision reads 96.',
    bgColors: ['#759983', '#668a74', '#85aa93', '#567a64', '#8eb39c'],
    fgColors: ['#d95e42', '#c74d32', '#eb6f53', '#b53c22', '#f98064'],
    optionsRu: ['96', '9', '6', '86', 'Ничего не вижу'],
    optionsTj: ['96', '9', '6', '86', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['96', '9', '6', '86', 'Nothing visible'],
    correctRu: '96',
    correctTj: '96',
    correctEn: '96',
    diagnosticWeight: 'deutan',
  },
  {
    id: 18,
    type: 'number',
    value: '15',
    labelRu: 'Таблица №18 • Тонкая дифференциация',
    labelTj: 'Ҷадвали №18 • Тафриқаи нозук',
    labelEn: 'Plate #18 • Fine Discrimination',
    descRu: 'Нормальное зрение видит 15.',
    descTj: 'Биноии муқаррарӣ 15-ро мебинад.',
    descEn: 'Normal observers recognize 15.',
    bgColors: ['#598a70', '#4e7b63', '#689d80', '#416a54', '#79af92'],
    fgColors: ['#e45d41', '#d44a2e', '#f17055', '#c33a1f', '#f9866c'],
    optionsRu: ['15', '13', '18', '16', 'Ничего не вижу'],
    optionsTj: ['15', '13', '18', '16', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['15', '13', '18', '16', 'Nothing visible'],
    correctRu: '15',
    correctTj: '15',
    correctEn: '15',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 19,
    type: 'number',
    value: '68',
    labelRu: 'Таблица №19 • Тест на скрытые контуры',
    labelTj: 'Ҷадвали №19 • Санҷиши контурҳои пинҳонӣ',
    labelEn: 'Plate #19 • Hidden Contour Plate',
    descRu: 'Нормальное зрение видит 68.',
    descTj: 'Биноии муқаррарӣ 68-ро мебинад.',
    descEn: 'Normal trichromats discern 68.',
    bgColors: ['#d69e71', '#c48b5e', '#e7b083', '#b2794c', '#f7c295'],
    fgColors: ['#289376', '#1a8266', '#3aa487', '#117155', '#4bb699'],
    optionsRu: ['68', '88', '63', '58', 'Ничего не вижу'],
    optionsTj: ['68', '88', '63', '58', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['68', '88', '63', '58', 'Nothing visible'],
    correctRu: '68',
    correctTj: '68',
    correctEn: '68',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 20,
    type: 'number',
    value: '57',
    labelRu: 'Таблица №20 • Калибровка чувствительности',
    labelTj: 'Ҷадвали №20 • Калибровкаи ҳассосият',
    labelEn: 'Plate #20 • Sensitivity Calibration',
    descRu: 'Нормальное зрение видит 57. При аномалиях видят 35.',
    descTj: 'Биноии муқаррарӣ 57-ро мебинад.',
    descEn: 'Normal trichromats perceive 57; color defective individuals read 35.',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['57', '37', '51', '35', 'Ничего не вижу'],
    optionsTj: ['57', '37', '51', '35', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['57', '37', '51', '35', 'Nothing visible'],
    correctRu: '57',
    correctTj: '57',
    correctEn: '57',
    diagnosticWeight: 'protan_deutan',
  },

  // --- Letters (21-35) ---
  {
    id: 21,
    type: 'letter',
    value: 'A',
    labelRu: 'Таблица №21 • Буквенный оптотип A',
    labelTj: 'Ҷадвали №21 • Ҳарфи A',
    labelEn: 'Plate #21 • Letter Optotype A',
    descRu: 'В центре скрыта буква A на зелёном фоне.',
    descTj: 'Дар марказ ҳарфи A дар заминаи сабз пинҳон аст.',
    descEn: 'Letter A concealed on a green chromatic field.',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['A', 'H', 'R', 'O', 'Ничего не вижу'],
    optionsTj: ['A', 'H', 'R', 'O', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['A', 'H', 'R', 'O', 'Nothing visible'],
    correctRu: 'A',
    correctTj: 'A',
    correctEn: 'A',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 22,
    type: 'letter',
    value: 'B',
    labelRu: 'Таблица №22 • Буквенный оптотип B',
    labelTj: 'Ҷадвали №22 • Ҳарфи B',
    labelEn: 'Plate #22 • Letter Optotype B',
    descRu: 'В центре скрыта буква B. Проверяет чувствительность M-колбочек.',
    descTj: 'Дар марказ ҳарфи B ҷойгир аст.',
    descEn: 'Letter B screening M-cone green pathway.',
    bgColors: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c'],
    fgColors: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794'],
    optionsRu: ['B', 'P', 'R', '8', 'Ничего не вижу'],
    optionsTj: ['B', 'P', 'R', '8', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['B', 'P', 'R', '8', 'Nothing visible'],
    correctRu: 'B',
    correctTj: 'B',
    correctEn: 'B',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 23,
    type: 'letter',
    value: 'C',
    labelRu: 'Таблица №23 • Буквенный оптотип C',
    labelTj: 'Ҷадвали №23 • Ҳарфи C',
    labelEn: 'Plate #23 • Letter Optotype C',
    descRu: 'Буква C в мягких бирюзово-песочных тонах.',
    descTj: 'Ҳарфи C дар заминаи регӣ.',
    descEn: 'Letter C in cyan-sand chromaticity contrast.',
    bgColors: ['#d69e71', '#c48b5e', '#e7b083', '#b2794c', '#f7c295'],
    fgColors: ['#289376', '#1a8266', '#3aa487', '#117155', '#4bb699'],
    optionsRu: ['C', 'O', 'G', 'D', 'Ничего не вижу'],
    optionsTj: ['C', 'O', 'G', 'D', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['C', 'O', 'G', 'D', 'Nothing visible'],
    correctRu: 'C',
    correctTj: 'C',
    correctEn: 'C',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 24,
    type: 'letter',
    value: 'E',
    labelRu: 'Таблица №24 • Буквенный оптотип E',
    labelTj: 'Ҷадвали №24 • Ҳарфи E',
    labelEn: 'Plate #24 • Letter Optotype E',
    descRu: 'Буква E с горизонтальными штрихами.',
    descTj: 'Ҳарфи E бо хатҳои уфуқӣ.',
    descEn: 'Letter E evaluating stroke pattern separation.',
    bgColors: ['#598a70', '#4e7b63', '#689d80', '#416a54', '#79af92'],
    fgColors: ['#e45d41', '#d44a2e', '#f17055', '#c33a1f', '#f9866c'],
    optionsRu: ['E', 'F', 'B', 'H', 'Ничего не вижу'],
    optionsTj: ['E', 'F', 'B', 'H', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['E', 'F', 'B', 'H', 'Nothing visible'],
    correctRu: 'E',
    correctTj: 'E',
    correctEn: 'E',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 25,
    type: 'letter',
    value: 'H',
    labelRu: 'Таблица №25 • Буквенный оптотип H',
    labelTj: 'Ҷадвали №25 • Ҳарфи H',
    labelEn: 'Plate #25 • Letter Optotype H',
    descRu: 'Буква H на контрастном фоне.',
    descTj: 'Ҳарфи H дар заминаи контрастӣ.',
    descEn: 'Letter H embedded in chromatic dot matrix.',
    bgColors: ['#c47d62', '#b36a4f', '#d58f74', '#9e563d', '#df9f86'],
    fgColors: ['#41936c', '#33815c', '#54a67e', '#276f4c', '#67b991'],
    optionsRu: ['H', 'A', 'N', 'K', 'Ничего не вижу'],
    optionsTj: ['H', 'A', 'N', 'K', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['H', 'A', 'N', 'K', 'Nothing visible'],
    correctRu: 'H',
    correctTj: 'H',
    correctEn: 'H',
    diagnosticWeight: 'deutan',
  },
  {
    id: 26,
    type: 'letter',
    value: 'K',
    labelRu: 'Таблица №26 • Буквенный оптотип K',
    labelTj: 'Ҷадвали №26 • Ҳарфи K',
    labelEn: 'Plate #26 • Letter Optotype K',
    descRu: 'Буква K с диагональными штрихами.',
    descTj: 'Ҳарфи K бо хатҳои моил.',
    descEn: 'Letter K with diagonal strokes.',
    bgColors: ['#759983', '#668a74', '#85aa93', '#567a64', '#8eb39c'],
    fgColors: ['#d95e42', '#c74d32', '#eb6f53', '#b53c22', '#f98064'],
    optionsRu: ['K', 'X', 'R', 'H', 'Ничего не вижу'],
    optionsTj: ['K', 'X', 'R', 'H', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['K', 'X', 'R', 'H', 'Nothing visible'],
    correctRu: 'K',
    correctTj: 'K',
    correctEn: 'K',
    diagnosticWeight: 'deutan',
  },
  {
    id: 27,
    type: 'letter',
    value: 'M',
    labelRu: 'Таблица №27 • Буквенный оптотип M',
    labelTj: 'Ҷадвали №27 • Ҳарфи M',
    labelEn: 'Plate #27 • Letter Optotype M',
    descRu: 'Широкая буква M в оливково-красном спектре.',
    descTj: 'Ҳарфи M дар спектри равғанӣ-сурх.',
    descEn: 'Wide letter M in olive-red chromaticity.',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['M', 'N', 'W', 'V', 'Ничего не вижу'],
    optionsTj: ['M', 'N', 'W', 'V', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['M', 'N', 'W', 'V', 'Nothing visible'],
    correctRu: 'M',
    correctTj: 'M',
    correctEn: 'M',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 28,
    type: 'letter',
    value: 'P',
    labelRu: 'Таблица №28 • Буквенный оптотип P',
    labelTj: 'Ҷадвали №28 • Ҳарфи P',
    labelEn: 'Plate #28 • Letter Optotype P',
    descRu: 'Буква P на зелёном фоне.',
    descTj: 'Ҳарфи P дар заминаи сабз.',
    descEn: 'Letter P on green background.',
    bgColors: ['#598a70', '#4e7b63', '#689d80', '#416a54', '#79af92'],
    fgColors: ['#e45d41', '#d44a2e', '#f17055', '#c33a1f', '#f9866c'],
    optionsRu: ['P', 'R', 'B', 'D', 'Ничего не вижу'],
    optionsTj: ['P', 'R', 'B', 'D', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['P', 'R', 'B', 'D', 'Nothing visible'],
    correctRu: 'P',
    correctTj: 'P',
    correctEn: 'P',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 29,
    type: 'letter',
    value: 'T',
    labelRu: 'Таблица №29 • Буквенный оптотип T',
    labelTj: 'Ҷадвали №29 • Ҳарфи T',
    labelEn: 'Plate #29 • Letter Optotype T',
    descRu: 'Буква T с чётким Т-образным перекрестием.',
    descTj: 'Ҳарфи T бо чорроҳаи равшан.',
    descEn: 'Letter T with distinct crossbar.',
    bgColors: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c'],
    fgColors: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794'],
    optionsRu: ['T', 'I', 'Y', 'L', 'Ничего не вижу'],
    optionsTj: ['T', 'I', 'Y', 'L', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['T', 'I', 'Y', 'L', 'Nothing visible'],
    correctRu: 'T',
    correctTj: 'T',
    correctEn: 'T',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 30,
    type: 'letter',
    value: 'X',
    labelRu: 'Таблица №30 • Буквенный оптотип X',
    labelTj: 'Ҷадвали №30 • Ҳарфи X',
    labelEn: 'Plate #30 • Letter Optotype X',
    descRu: 'Буква X с пересекающимися диагоналями.',
    descTj: 'Ҳарфи X бо хатҳои буридашаванда.',
    descEn: 'Letter X with crossing diagonal strokes.',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['X', 'K', 'Y', 'Z', 'Ничего не вижу'],
    optionsTj: ['X', 'K', 'Y', 'Z', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['X', 'K', 'Y', 'Z', 'Nothing visible'],
    correctRu: 'X',
    correctTj: 'X',
    correctEn: 'X',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 31,
    type: 'letter',
    value: 'O',
    labelRu: 'Таблица №31 • Сине-фиолетовый тест (Буква O)',
    labelTj: 'Ҷадвали №31 • Спектри кабуд (Ҳарфи O)',
    labelEn: 'Plate #31 • Blue-Violet Cone Test (Letter O)',
    descRu: 'Буква O в сине-фиолетовом диапазоне для исключения тританомалии.',
    descTj: 'Ҳарфи O дар диапазони кабуд-бунафш.',
    descEn: 'Letter O in blue-violet channel for tritan deficiency screening.',
    bgColors: ['#ba6e68', '#a95d57', '#cc807a', '#954b45', '#dc928c'],
    fgColors: ['#3b78c4', '#2c66b0', '#4e8bd6', '#1e549c', '#629de6'],
    optionsRu: ['O', 'C', 'Q', 'D', 'Ничего не вижу'],
    optionsTj: ['O', 'C', 'Q', 'D', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['O', 'C', 'Q', 'D', 'Nothing visible'],
    correctRu: 'O',
    correctTj: 'O',
    correctEn: 'O',
    diagnosticWeight: 'tritan',
  },
  {
    id: 32,
    type: 'letter',
    value: 'S',
    labelRu: 'Таблица №32 • Буквенный оптотип S',
    labelTj: 'Ҷадвали №32 • Ҳарфи S',
    labelEn: 'Plate #32 • Letter Optotype S',
    descRu: 'Буква S с плавными изгибами.',
    descTj: 'Ҳарфи S бо хатҳои каҷ.',
    descEn: 'Letter S with curved stroke contour.',
    bgColors: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c'],
    fgColors: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794'],
    optionsRu: ['S', '5', '8', 'Z', 'Ничего не вижу'],
    optionsTj: ['S', '5', '8', 'Z', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['S', '5', '8', 'Z', 'Nothing visible'],
    correctRu: 'S',
    correctTj: 'S',
    correctEn: 'S',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 33,
    type: 'letter',
    value: 'D',
    labelRu: 'Таблица №33 • Буквенный оптотип D',
    labelTj: 'Ҷадвали №33 • Ҳарфи D',
    labelEn: 'Plate #33 • Letter Optotype D',
    descRu: 'Буква D на зелёном фоне.',
    descTj: 'Ҳарфи D дар заминаи сабз.',
    descEn: 'Letter D on green field.',
    bgColors: ['#598a70', '#4e7b63', '#689d80', '#416a54', '#79af92'],
    fgColors: ['#e45d41', '#d44a2e', '#f17055', '#c33a1f', '#f9866c'],
    optionsRu: ['D', 'O', 'B', 'P', 'Ничего не вижу'],
    optionsTj: ['D', 'O', 'B', 'P', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['D', 'O', 'B', 'P', 'Nothing visible'],
    correctRu: 'D',
    correctTj: 'D',
    correctEn: 'D',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 34,
    type: 'letter',
    value: 'R',
    labelRu: 'Таблица №34 • Буквенный оптотип R',
    labelTj: 'Ҷадвали №34 • Ҳарфи R',
    labelEn: 'Plate #34 • Letter Optotype R',
    descRu: 'Буква R в бирюзово-песочных тонах.',
    descTj: 'Ҳарфи R дар тобишҳои фирӯзаӣ.',
    descEn: 'Letter R in teal-tan chromatic separation.',
    bgColors: ['#d69e71', '#c48b5e', '#e7b083', '#b2794c', '#f7c295'],
    fgColors: ['#289376', '#1a8266', '#3aa487', '#117155', '#4bb699'],
    optionsRu: ['R', 'P', 'B', 'K', 'Ничего не вижу'],
    optionsTj: ['R', 'P', 'B', 'K', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['R', 'P', 'B', 'K', 'Nothing visible'],
    correctRu: 'R',
    correctTj: 'R',
    correctEn: 'R',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 35,
    type: 'letter',
    value: 'N',
    labelRu: 'Таблица №35 • Буквенный оптотип N',
    labelTj: 'Ҷадвали №35 • Ҳарфи N',
    labelEn: 'Plate #35 • Letter Optotype N',
    descRu: 'Буква N с диагональной связкой.',
    descTj: 'Ҳарфи N бо пайвандаки моил.',
    descEn: 'Letter N with diagonal bridge stroke.',
    bgColors: ['#759983', '#668a74', '#85aa93', '#567a64', '#8eb39c'],
    fgColors: ['#d95e42', '#c74d32', '#eb6f53', '#b53c22', '#f98064'],
    optionsRu: ['N', 'M', 'H', 'Z', 'Ничего не вижу'],
    optionsTj: ['N', 'M', 'H', 'Z', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['N', 'M', 'H', 'Z', 'Nothing visible'],
    correctRu: 'N',
    correctTj: 'N',
    correctEn: 'N',
    diagnosticWeight: 'deutan',
  },

  // --- Single Shapes (36-45) ---
  {
    id: 36,
    type: 'triangle',
    value: 'triangle',
    labelRu: 'Таблица №36 • Геометрическая фигура (Треугольник)',
    labelTj: 'Ҷадвали №36 • Шакли геометрӣ (Секунҷа)',
    labelEn: 'Plate #36 • Geometric Shape (Triangle)',
    descRu: 'В центре скрыт треугольник. Проверяет чувствительность зелёных M-колбочек.',
    descTj: 'Дар марказ секунҷа пинҳон аст. Ҳассосияти колбачаҳои сабзи M-ро месанҷад.',
    descEn: 'Hidden triangle evaluating sensitivity of medium-wavelength (M) green cones.',
    bgColors: ['#af5e49', '#9f4d38', '#c16f5a', '#8a3c28', '#ce806b'],
    fgColors: ['#3e9e73', '#2e8b61', '#51b287', '#22774f', '#65c499'],
    optionsRu: ['Треугольник', 'Круг', 'Квадрат', 'Ромб', 'Ничего не вижу'],
    optionsTj: ['Секунҷа', 'Доира', 'Чоркунҷа', 'Ромб', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Triangle', 'Circle', 'Square', 'Diamond', 'Nothing visible'],
    correctRu: 'Треугольник',
    correctTj: 'Секунҷа',
    correctEn: 'Triangle',
    diagnosticWeight: 'deutan',
  },
  {
    id: 37,
    type: 'circle',
    value: 'circle',
    labelRu: 'Таблица №37 • Геометрическая фигура (Круг)',
    labelTj: 'Ҷадвали №37 • Шакли геометрӣ (Доира)',
    labelEn: 'Plate #37 • Geometric Shape (Circle)',
    descRu: 'В центре расположен круг. Проверяет чувствительность красных L-колбочек.',
    descTj: 'Дар марказ доира ҷойгир аст. Ҳассосияти колбачаҳои сурхи L-ро месанҷад.',
    descEn: 'Centered circle testing long-wavelength (L) red cone photopigments.',
    bgColors: ['#619478', '#528368', '#72a68a', '#447158', '#82b79a'],
    fgColors: ['#e1523a', '#cf4029', '#ee644d', '#be3019', '#f87760'],
    optionsRu: ['Круг', 'Овал', 'Кольцо', 'Квадрат', 'Ничего не вижу'],
    optionsTj: ['Доира', 'Байзавӣ', 'Ҳалқа', 'Чоркунҷа', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Circle', 'Oval', 'Ring', 'Square', 'Nothing visible'],
    correctRu: 'Круг',
    correctTj: 'Доира',
    correctEn: 'Circle',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 38,
    type: 'square',
    value: 'square',
    labelRu: 'Таблица №38 • Геометрическая фигура (Квадрат)',
    labelTj: 'Ҷадвали №38 • Шакли геометрӣ (Чоркунҷа)',
    labelEn: 'Plate #38 • Geometric Shape (Square)',
    descRu: 'Квадрат в сине-фиолетовом диапазоне для исключения тританомалии.',
    descTj: 'Чоркунҷа дар диапазони кабуд-бунафш.',
    descEn: 'Square in blue-violet chromaticity axis to screen tritan deficiencies.',
    bgColors: ['#ba6e68', '#a95d57', '#cc807a', '#954b45', '#dc928c'],
    fgColors: ['#3b78c4', '#2c66b0', '#4e8bd6', '#1e549c', '#629de6'],
    optionsRu: ['Квадрат', 'Ромб', 'Прямоугольник', 'Круг', 'Ничего не вижу'],
    optionsTj: ['Чоркунҷа', 'Ромб', 'Росткунҷа', 'Доира', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Square', 'Diamond', 'Rectangle', 'Circle', 'Nothing visible'],
    correctRu: 'Квадрат',
    correctTj: 'Чоркунҷа',
    correctEn: 'Square',
    diagnosticWeight: 'tritan',
  },
  {
    id: 39,
    type: 'star',
    value: 'star',
    labelRu: 'Таблица №39 • Символическая фигура (Звезда)',
    labelTj: 'Ҷадвали №39 • Шакли ситора (Ситора)',
    labelEn: 'Plate #39 • Symbolic Shape (Star)',
    descRu: 'В центре скрыта пятиконечная звезда. Проверяет восприятие лучевых контуров.',
    descTj: 'Дар марказ ситораи панҷгӯша пинҳон аст.',
    descEn: 'Five-pointed star assessing radial contour segregation.',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['Звезда', 'Крест', 'Цветок', 'Треугольник', 'Ничего не вижу'],
    optionsTj: ['Ситора', 'Салиб', 'Гул', 'Секунҷа', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Star', 'Cross', 'Flower', 'Triangle', 'Nothing visible'],
    correctRu: 'Звезда',
    correctTj: 'Ситора',
    correctEn: 'Star',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 40,
    type: 'diamond',
    value: 'diamond',
    labelRu: 'Таблица №40 • Геометрическая фигура (Ромб)',
    labelTj: 'Ҷадвали №40 • Шакли геометрӣ (Ромб)',
    labelEn: 'Plate #40 • Geometric Shape (Diamond)',
    descRu: 'В центре скрыт ромб на контрастном фоне.',
    descTj: 'Дар марказ шакли ромб пинҳон аст.',
    descEn: 'Diamond / rhombus shape on contrasting matrix.',
    bgColors: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c'],
    fgColors: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794'],
    optionsRu: ['Ромб', 'Квадрат', 'Треугольник', 'Звезда', 'Ничего не вижу'],
    optionsTj: ['Ромб', 'Чоркунҷа', 'Секунҷа', 'Ситора', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Diamond', 'Square', 'Triangle', 'Star', 'Nothing visible'],
    correctRu: 'Ромб',
    correctTj: 'Ромб',
    correctEn: 'Diamond',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 41,
    type: 'cross',
    value: 'cross',
    labelRu: 'Таблица №41 • Символическая фигура (Крест)',
    labelTj: 'Ҷадвали №41 • Шакли геометрӣ (Салиб)',
    labelEn: 'Plate #41 • Symbolic Shape (Cross)',
    descRu: 'Симметричный крест в зелёно-красном спектре.',
    descTj: 'Салиби симметрӣ дар спектри сабзу сурх.',
    descEn: 'Symmetrical plus/cross shape on green-red axis.',
    bgColors: ['#598a70', '#4e7b63', '#689d80', '#416a54', '#79af92'],
    fgColors: ['#e45d41', '#d44a2e', '#f17055', '#c33a1f', '#f9866c'],
    optionsRu: ['Крест', 'Звезда', 'Квадрат', 'Стрелка', 'Ничего не вижу'],
    optionsTj: ['Салиб', 'Ситора', 'Чоркунҷа', 'Тир', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Cross', 'Star', 'Square', 'Arrow', 'Nothing visible'],
    correctRu: 'Крест',
    correctTj: 'Салиб',
    correctEn: 'Cross',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 42,
    type: 'heart',
    value: 'heart',
    labelRu: 'Таблица №42 • Символическая фигура (Сердце)',
    labelTj: 'Ҷадвали №42 • Шакли рамзӣ (Дил)',
    labelEn: 'Plate #42 • Symbolic Shape (Heart)',
    descRu: 'Фигура сердца с плавными кривыми.',
    descTj: 'Шакли дил бо хатҳои ҳамвор.',
    descEn: 'Heart silhouette with curved borders.',
    bgColors: ['#d69e71', '#c48b5e', '#e7b083', '#b2794c', '#f7c295'],
    fgColors: ['#289376', '#1a8266', '#3aa487', '#117155', '#4bb699'],
    optionsRu: ['Сердце', 'Круг', 'Капля', 'Звезда', 'Ничего не вижу'],
    optionsTj: ['Дил', 'Доира', 'Қатра', 'Ситора', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Heart', 'Circle', 'Drop', 'Star', 'Nothing visible'],
    correctRu: 'Сердце',
    correctTj: 'Дил',
    correctEn: 'Heart',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 43,
    type: 'ring',
    value: 'ring',
    labelRu: 'Таблица №43 • Геометрическая фигура (Кольцо)',
    labelTj: 'Ҷадвали №43 • Шакли геометрӣ (Ҳалқа)',
    labelEn: 'Plate #43 • Geometric Shape (Ring)',
    descRu: 'Кольцо с пустым центром. Проверяет чёткость внутренних границ.',
    descTj: 'Ҳалқа бо маркази холӣ.',
    descEn: 'Annular ring testing internal border acuity.',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['Кольцо', 'Круг', 'Овал', 'Квадрат', 'Ничего не вижу'],
    optionsTj: ['Ҳалқа', 'Доира', 'Байзавӣ', 'Чоркунҷа', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Ring', 'Circle', 'Oval', 'Square', 'Nothing visible'],
    correctRu: 'Кольцо',
    correctTj: 'Ҳалқа',
    correctEn: 'Ring',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 44,
    type: 'pentagon',
    value: 'pentagon',
    labelRu: 'Таблица №44 • Геометрическая фигура (Пятиугольник)',
    labelTj: 'Ҷадвали №44 • Шакли геометрӣ (Панҷкунҷа)',
    labelEn: 'Plate #44 • Geometric Shape (Pentagon)',
    descRu: 'Пятиугольник с пятью равными гранями.',
    descTj: 'Панҷкунҷаи баробартараф.',
    descEn: 'Equilateral pentagon polygon.',
    bgColors: ['#759983', '#668a74', '#85aa93', '#567a64', '#8eb39c'],
    fgColors: ['#d95e42', '#c74d32', '#eb6f53', '#b53c22', '#f98064'],
    optionsRu: ['Пятиугольник', 'Шестиугольник', 'Круг', 'Квадрат', 'Ничего не вижу'],
    optionsTj: ['Панҷкунҷа', 'Шашкунҷа', 'Доира', 'Чоркунҷа', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Pentagon', 'Hexagon', 'Circle', 'Square', 'Nothing visible'],
    correctRu: 'Пятиугольник',
    correctTj: 'Панҷкунҷа',
    correctEn: 'Pentagon',
    diagnosticWeight: 'deutan',
  },
  {
    id: 45,
    type: 'arrow',
    value: 'arrow',
    labelRu: 'Таблица №45 • Символическая фигура (Стрелка)',
    labelTj: 'Ҷадвали №45 • Шакли геометрӣ (Тир)',
    labelEn: 'Plate #45 • Symbolic Shape (Arrow)',
    descRu: 'Направленная стрелка. Проверяет восприятие асимметричных фигур.',
    descTj: 'Тири самтдор.',
    descEn: 'Directional arrow evaluating asymmetric shape acuity.',
    bgColors: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c'],
    fgColors: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794'],
    optionsRu: ['Стрелка', 'Треугольник', 'Крест', 'Ромб', 'Ничего не вижу'],
    optionsTj: ['Тир', 'Секунҷа', 'Салиб', 'Ромб', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Arrow', 'Triangle', 'Cross', 'Diamond', 'Nothing visible'],
    correctRu: 'Стрелка',
    correctTj: 'Тир',
    correctEn: 'Arrow',
    diagnosticWeight: 'protan_deutan',
  },

  // --- Paired Shapes (46-50) ---
  {
    id: 46,
    type: 'circle-triangle',
    value: 'circle-triangle',
    labelRu: 'Таблица №46 • Парные фигуры (Круг и треугольник)',
    labelTj: 'Ҷадвали №46 • Шаклҳои ҷуфт (Доира ва секунҷа)',
    labelEn: 'Plate #46 • Paired Shapes (Circle & Triangle)',
    descRu: 'Круг слева и треугольник справа. Различаются при нормальном зрении.',
    descTj: 'Доира дар чап ва секунҷа дар рост.',
    descEn: 'Circle on the left and triangle on the right.',
    bgColors: ['#c47d62', '#b36a4f', '#d58f74', '#9e563d', '#df9f86'],
    fgColors: ['#41936c', '#33815c', '#54a67e', '#276f4c', '#67b991'],
    optionsRu: ['Круг и треугольник', 'Два круга', 'Два треугольника', 'Квадрат и круг', 'Ничего не вижу'],
    optionsTj: ['Доира ва секунҷа', 'Ду доира', 'Ду секунҷа', 'Чоркунҷа ва доира', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Circle & Triangle', 'Two circles', 'Two triangles', 'Square & Circle', 'Nothing visible'],
    correctRu: 'Круг и треугольник',
    correctTj: 'Доира ва секунҷа',
    correctEn: 'Circle & Triangle',
    diagnosticWeight: 'baseline',
  },
  {
    id: 47,
    type: 'square-circle',
    value: 'square-circle',
    labelRu: 'Таблица №47 • Парные фигуры (Квадрат и круг)',
    labelTj: 'Ҷадвали №47 • Шаклҳои ҷуфт (Чоркунҷа ва доира)',
    labelEn: 'Plate #47 • Paired Shapes (Square & Circle)',
    descRu: 'Слева квадрат, справа круг. Сложная матрица контрастного различения.',
    descTj: 'Дар чап чоркунҷа, дар рост доира.',
    descEn: 'Square on the left, circle on the right.',
    bgColors: ['#798b7e', '#697a6d', '#8a9c8f', '#59695d', '#9bad9f'],
    fgColors: ['#d7593c', '#c6492c', '#e76a4d', '#b3391d', '#f47c60'],
    optionsRu: ['Квадрат и круг', 'Два квадрата', 'Два круга', 'Треугольник и круг', 'Ничего не вижу'],
    optionsTj: ['Чоркунҷа ва доира', 'Ду чоркунҷа', 'Ду доира', 'Секунҷа ва доира', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Square & Circle', 'Two squares', 'Two circles', 'Triangle & Circle', 'Nothing visible'],
    correctRu: 'Квадрат и круг',
    correctTj: 'Чоркунҷа ва доира',
    correctEn: 'Square & Circle',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 48,
    type: 'triangle-square',
    value: 'triangle-square',
    labelRu: 'Таблица №48 • Парные фигуры (Треугольник и квадрат)',
    labelTj: 'Ҷадвали №48 • Шаклҳои ҷуфт (Секунҷа ва чоркунҷа)',
    labelEn: 'Plate #48 • Paired Shapes (Triangle & Square)',
    descRu: 'Слева треугольник, справа квадрат.',
    descTj: 'Дар чап секунҷа, дар рост чоркунҷа.',
    descEn: 'Triangle on the left, square on the right.',
    bgColors: ['#4b8e61', '#5ea574', '#74be8d', '#427f54', '#85cea1'],
    fgColors: ['#ea583a', '#dd4828', '#f36e4f', '#c93b1e', '#f88366'],
    optionsRu: ['Треугольник и квадрат', 'Два треугольника', 'Круг и треугольник', 'Два квадрата', 'Ничего не вижу'],
    optionsTj: ['Секунҷа ва чоркунҷа', 'Ду секунҷа', 'Доира ва секунҷа', 'Ду чоркунҷа', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Triangle & Square', 'Two triangles', 'Circle & Triangle', 'Two squares', 'Nothing visible'],
    correctRu: 'Треугольник и квадрат',
    correctTj: 'Секунҷа ва чоркунҷа',
    correctEn: 'Triangle & Square',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 49,
    type: 'star-circle',
    value: 'star-circle',
    labelRu: 'Таблица №49 • Парные фигуры (Звезда и круг)',
    labelTj: 'Ҷадвали №49 • Шаклҳои ҷуфт (Ситора ва доира)',
    labelEn: 'Plate #49 • Paired Shapes (Star & Circle)',
    descRu: 'Слева звезда, справа круг.',
    descTj: 'Дар чап ситора, дар рост доира.',
    descEn: 'Star on the left, circle on the right.',
    bgColors: ['#cc9b76', '#ba8863', '#ddae89', '#a67551', '#eec09c'],
    fgColors: ['#329471', '#23815e', '#45a582', '#186f4d', '#57b794'],
    optionsRu: ['Звезда и круг', 'Две звезды', 'Звезда и квадрат', 'Два круга', 'Ничего не вижу'],
    optionsTj: ['Ситора ва доира', 'Ду ситора', 'Ситора ва чоркунҷа', 'Ду доира', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Star & Circle', 'Two stars', 'Star & Square', 'Two circles', 'Nothing visible'],
    correctRu: 'Звезда и круг',
    correctTj: 'Ситора ва доира',
    correctEn: 'Star & Circle',
    diagnosticWeight: 'protan_deutan',
  },
  {
    id: 50,
    type: 'diamond-triangle',
    value: 'diamond-triangle',
    labelRu: 'Таблица №50 • Парные фигуры (Ромб и треугольник)',
    labelTj: 'Ҷадвали №50 • Шаклҳои ҷуфт (Ромб ва секунҷа)',
    labelEn: 'Plate #50 • Paired Shapes (Diamond & Triangle)',
    descRu: 'Слева ромб, справа треугольник.',
    descTj: 'Дар чап ромб, дар рост секунҷа.',
    descEn: 'Diamond on the left, triangle on the right.',
    bgColors: ['#598a70', '#4e7b63', '#689d80', '#416a54', '#79af92'],
    fgColors: ['#e45d41', '#d44a2e', '#f17055', '#c33a1f', '#f9866c'],
    optionsRu: ['Ромб и треугольник', 'Два ромба', 'Квадрат и треугольник', 'Ромб и круг', 'Ничего не вижу'],
    optionsTj: ['Ромб ва секунҷа', 'Ду ромб', 'Чоркунҷа ва секунҷа', 'Ромб ва доира', 'Ҳеҷ чиз намебинам'],
    optionsEn: ['Diamond & Triangle', 'Two diamonds', 'Square & Triangle', 'Diamond & Circle', 'Nothing visible'],
    correctRu: 'Ромб и треугольник',
    correctTj: 'Ромб ва секунҷа',
    correctEn: 'Diamond & Triangle',
    diagnosticWeight: 'deutan',
  },
]

// Balanced random selection: 10 plates each session from pool of 50
export const CLINICAL_PLATES = ALL_CLINICAL_PLATES

export function pick10RandomPlates(): ClinicalPlate[] {
  // Balanced random selection: 4 numbers, 3 letters, 3 shapes from 50 pool
  const numbers = ALL_CLINICAL_PLATES.filter((p) => p.type === 'number')
  const letters = ALL_CLINICAL_PLATES.filter((p) => p.type === 'letter')
  const shapes = ALL_CLINICAL_PLATES.filter((p) => p.type !== 'number' && p.type !== 'letter')

  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const pickedNumbers = shuffle(numbers).slice(0, 4)
  const pickedLetters = shuffle(letters).slice(0, 3)
  const pickedShapes = shuffle(shapes).slice(0, 3)

  const selected = shuffle([...pickedNumbers, ...pickedLetters, ...pickedShapes])
  return selected
}

// Canvas renderer for pseudoisochromatic dots with support for numbers, letters, and geometric shapes
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
    } else if (plate.type === 'letter') {
      offCtx.font = '900 140px "Arial", sans-serif'
      offCtx.textAlign = 'center'
      offCtx.textBaseline = 'middle'
      offCtx.fillText(plate.value, cx, cy + 4)
    } else if (plate.type === 'triangle') {
      const triR = 64
      offCtx.beginPath()
      offCtx.moveTo(cx, cy - triR)
      offCtx.lineTo(cx + triR * 1.15, cy + triR * 0.75)
      offCtx.lineTo(cx - triR * 1.15, cy + triR * 0.75)
      offCtx.closePath()
      offCtx.fill()
    } else if (plate.type === 'circle') {
      offCtx.beginPath()
      offCtx.arc(cx, cy, 56, 0, Math.PI * 2)
      offCtx.fill()
    } else if (plate.type === 'square') {
      const sqHalf = 48
      offCtx.fillRect(cx - sqHalf, cy - sqHalf, sqHalf * 2, sqHalf * 2)
    } else if (plate.type === 'star') {
      const spikes = 5
      const outerR = 64
      const innerR = 28
      let rot = (Math.PI / 2) * 3
      const step = Math.PI / spikes
      offCtx.beginPath()
      offCtx.moveTo(cx, cy - outerR)
      for (let i = 0; i < spikes; i++) {
        let x1 = cx + Math.cos(rot) * outerR
        let y1 = cy + Math.sin(rot) * outerR
        offCtx.lineTo(x1, y1)
        rot += step
        let x2 = cx + Math.cos(rot) * innerR
        let y2 = cy + Math.sin(rot) * innerR
        offCtx.lineTo(x2, y2)
        rot += step
      }
      offCtx.lineTo(cx, cy - outerR)
      offCtx.closePath()
      offCtx.fill()
    } else if (plate.type === 'diamond') {
      const dW = 52
      const dH = 68
      offCtx.beginPath()
      offCtx.moveTo(cx, cy - dH)
      offCtx.lineTo(cx + dW, cy)
      offCtx.lineTo(cx, cy + dH)
      offCtx.lineTo(cx - dW, cy)
      offCtx.closePath()
      offCtx.fill()
    } else if (plate.type === 'cross') {
      const cW = 20
      const cL = 58
      offCtx.fillRect(cx - cW, cy - cL, cW * 2, cL * 2)
      offCtx.fillRect(cx - cL, cy - cW, cL * 2, cW * 2)
    } else if (plate.type === 'heart') {
      const hS = 52
      offCtx.beginPath()
      offCtx.moveTo(cx, cy + hS * 0.6)
      offCtx.bezierCurveTo(cx - hS * 1.1, cy + hS * 0.1, cx - hS * 1.1, cy - hS * 0.8, cx, cy - hS * 0.3)
      offCtx.bezierCurveTo(cx + hS * 1.1, cy - hS * 0.8, cx + hS * 1.1, cy + hS * 0.1, cx, cy + hS * 0.6)
      offCtx.closePath()
      offCtx.fill()
    } else if (plate.type === 'ring') {
      offCtx.beginPath()
      offCtx.arc(cx, cy, 60, 0, Math.PI * 2)
      offCtx.arc(cx, cy, 28, 0, Math.PI * 2, true)
      offCtx.closePath()
      offCtx.fill()
    } else if (plate.type === 'pentagon') {
      const pR = 58
      offCtx.beginPath()
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2
        const px = cx + pR * Math.cos(a)
        const py = cy + pR * Math.sin(a)
        if (i === 0) offCtx.moveTo(px, py)
        else offCtx.lineTo(px, py)
      }
      offCtx.closePath()
      offCtx.fill()
    } else if (plate.type === 'arrow') {
      offCtx.beginPath()
      offCtx.moveTo(cx + 48, cy)
      offCtx.lineTo(cx, cy - 38)
      offCtx.lineTo(cx, cy - 16)
      offCtx.lineTo(cx - 48, cy - 16)
      offCtx.lineTo(cx - 48, cy + 16)
      offCtx.lineTo(cx, cy + 16)
      offCtx.lineTo(cx, cy + 38)
      offCtx.closePath()
      offCtx.fill()
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
    } else if (plate.type === 'triangle-square') {
      // Triangle on the left
      const tLeft = cx - 44
      const tH = 44
      offCtx.beginPath()
      offCtx.moveTo(tLeft, cy - tH)
      offCtx.lineTo(tLeft + tH * 0.95, cy + tH * 0.75)
      offCtx.lineTo(tLeft - tH * 0.95, cy + tH * 0.75)
      offCtx.closePath()
      offCtx.fill()

      // Square on the right
      const sRight = cx + 44
      const sH = 34
      offCtx.fillRect(sRight - sH, cy - sH, sH * 2, sH * 2)
    } else if (plate.type === 'star-circle') {
      // Small star on the left
      const stLeft = cx - 44
      const spikes = 5
      const outerR = 38
      const innerR = 16
      let rot = (Math.PI / 2) * 3
      const step = Math.PI / spikes
      offCtx.beginPath()
      offCtx.moveTo(stLeft, cy - outerR)
      for (let i = 0; i < spikes; i++) {
        let x1 = stLeft + Math.cos(rot) * outerR
        let y1 = cy + Math.sin(rot) * outerR
        offCtx.lineTo(x1, y1)
        rot += step
        let x2 = stLeft + Math.cos(rot) * innerR
        let y2 = cy + Math.sin(rot) * innerR
        offCtx.lineTo(x2, y2)
        rot += step
      }
      offCtx.lineTo(stLeft, cy - outerR)
      offCtx.closePath()
      offCtx.fill()

      // Circle on the right
      const cRight = cx + 44
      offCtx.beginPath()
      offCtx.arc(cRight, cy, 38, 0, Math.PI * 2)
      offCtx.fill()
    } else if (plate.type === 'diamond-triangle') {
      // Diamond on the left
      const dLeft = cx - 44
      const dW = 34
      const dH = 42
      offCtx.beginPath()
      offCtx.moveTo(dLeft, cy - dH)
      offCtx.lineTo(dLeft + dW, cy)
      offCtx.lineTo(dLeft, cy + dH)
      offCtx.lineTo(dLeft - dW, cy)
      offCtx.closePath()
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

    // PRNG seeded for stability per plate
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
          const radius = size * 0.016 + prng() * (size * 0.014)

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
  // 10 plates randomly selected for this specific attempt
  const [plates, setPlates] = useState<ClinicalPlate[]>(() => pick10RandomPlates())
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [isFinished, setIsFinished] = useState(false)
  const [startTime] = useState<number>(() => Date.now())

  const plate = plates[currentIdx]

  const t = {
    ru: {
      title: 'Тест на дальтонизм',
      subtitle: 'Стандартизированная полихроматическая диагностика цветовосприятия с распознаванием цифр, букв и геометрических фигур.',
      progress: 'Таблица',
      of: 'из',
      promptNumber: 'Какое число вы видите внутри круга?',
      promptLetter: 'Какую букву вы видите внутри круга?',
      promptShape: 'Какую фигуру вы видите внутри круга?',
      promptShapes: 'Какие фигуры вы видите внутри круга?',
      calibration: 'Калибровка: sRGB Standard • 50–70 см от дисплея',
      standardBadge: 'Стандарт ISO 8596 / Цветовосприятие',
      resultTitle: 'Результаты скрининга цветовосприятия',
      normalTrichromat: 'Нормальная трихромазия (Норма)',
      normalDesc: 'Цветоразличение красного (L) и зелёного (M) спектров в пределах клинической нормы. Дефектов не выявлено.',
      protanDeutanDefect: 'Признаки красно-зелёной дисфункции',
      protanDeutanDesc: 'Зафиксированы затруднения при дифференциации красно-зелёного спектра (характерно для дейтераномалии или протаномалии).',
      tritanDefect: 'Признаки тританомалии (синий спектр)',
      tritanDesc: 'Отмечены затруднения при восприятии коротковолнового сине-фиолетового спектра (S-колбочки).',
      accuracy: 'Точность распознавания',
      correctCount: 'Правильных таблиц',
      totalTime: 'Время прохождения',
      saveBtn: 'Сохранить результат скрининга',
      retakeBtn: 'Пройти тест заново',
      detailedTable: 'Протокол по всем 10 таблицам сессии',
      correct: 'Правильно',
      incorrect: 'Ошибка',
    },
    tj: {
      title: 'Санҷиши дальтонизм',
      subtitle: 'Ташхиси стандартии биноии рангӣ бо шинохтани рақамҳо, ҳарфҳо ва шаклҳои геометрӣ.',
      progress: 'Ҷадвал',
      of: 'аз',
      promptNumber: 'Кадом рақамро дар дохили доира мебинед?',
      promptLetter: 'Кадом ҳарфро дар дохили доира мебинед?',
      promptShape: 'Кадом шаклро дар дохили доира мебинед?',
      promptShapes: 'Кадом шаклҳоро дар дохили доира мебинед?',
      calibration: 'Калибровка: sRGB Standard • 50–70 см аз экран',
      standardBadge: 'Стандарти ISO 8596 / Биноии рангӣ',
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
      detailedTable: 'Протоколи ҳамаи 10 ҷадвали ин санҷиш',
      correct: 'Дуруст',
      incorrect: 'Хато',
    },
    en: {
      title: 'Color Blindness Screening',
      subtitle: 'Standardized polychromatic diagnostic screening with numbers, letters, and geometric shapes.',
      progress: 'Plate',
      of: 'of',
      promptNumber: 'Which number do you perceive inside the circle?',
      promptLetter: 'Which letter do you perceive inside the circle?',
      promptShape: 'Which shape do you perceive inside the circle?',
      promptShapes: 'Which shapes do you perceive inside the circle?',
      calibration: 'Calibration: sRGB Standard • 50–70 cm view distance',
      standardBadge: 'ISO 8596 Standard / Color Vision',
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
      detailedTable: 'Plate-by-Plate Protocol for Current 10 Plates',
      correct: 'Correct',
      incorrect: 'Error',
    },
  }[lang]

  // Shuffled options per plate so answer position is unpredictable
  const currentOptions = useMemo(() => {
    if (!plate) return []
    const raw = lang === 'tj' ? plate.optionsTj : lang === 'en' ? plate.optionsEn : plate.optionsRu
    // Randomize options order
    const shuffled = [...raw]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [plate, lang])

  const handleSelectOption = (chosen: string) => {
    const updatedAnswers = [...answers, chosen]
    setAnswers(updatedAnswers)

    if (currentIdx < plates.length - 1) {
      setCurrentIdx((prev) => prev + 1)
    } else {
      setIsFinished(true)
    }
  }

  // Calculate results
  const correctCount = answers.reduce((acc, ans, idx) => {
    const p = plates[idx]
    if (!p) return acc
    const pCorrect = lang === 'tj' ? p.correctTj : lang === 'en' ? p.correctEn : p.correctRu
    return ans === pCorrect ? acc + 1 : acc
  }, 0)

  const accuracyPct = Math.round((correctCount / plates.length) * 100)
  const durationSec = Math.round((Date.now() - startTime) / 1000)

  // Determine clinical verdict
  let verdictTitle = t.normalTrichromat
  let verdictDesc = t.normalDesc
  let verdictSeverity = 'normal'

  // Check specific failures
  const failedTritan = plates.some((p, idx) => {
    if (p.diagnosticWeight !== 'tritan') return false
    const c = lang === 'tj' ? p.correctTj : lang === 'en' ? p.correctEn : p.correctRu
    return answers[idx] !== c
  })

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
      summary: `${verdictTitle}: ${correctCount}/${plates.length} таблиц (${accuracyPct}%)`,
      metrics: {
        accuracy_pct: accuracyPct,
        correct_count: correctCount,
        total_plates: plates.length,
        completion_time_sec: durationSec,
        clinical_verdict: verdictTitle,
        verdict_severity: verdictSeverity,
      },
    })
  }

  const handleRetake = () => {
    // Generate new random set of 10 plates from 50 pool
    setPlates(pick10RandomPlates())
    setCurrentIdx(0)
    setAnswers([])
    setIsFinished(false)
  }

  const getPromptText = () => {
    if (!plate) return ''
    if (plate.type === 'number') return t.promptNumber
    if (plate.type === 'letter') return t.promptLetter
    if (
      plate.type === 'circle-triangle' ||
      plate.type === 'square-circle' ||
      plate.type === 'triangle-square' ||
      plate.type === 'star-circle' ||
      plate.type === 'diamond-triangle'
    ) {
      return t.promptShapes
    }
    return t.promptShape
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
              {t.progress} {currentIdx + 1} {t.of} {plates.length}
            </div>
            <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {Math.round(((currentIdx + 1) / plates.length) * 100)}%
            </div>
          </div>
        )}
      </div>

      {!isFinished && plate ? (
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
              {getPromptText()}
            </div>

            {/* Varied Choice Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
              {currentOptions.map((opt) => (
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
          <div
            className={`p-6 rounded-2xl border ${
              verdictSeverity === 'normal'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    verdictSeverity === 'normal' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
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
                {correctCount} / {plates.length}
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

          {/* Protocol Table for all 10 plates of current session */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{t.detailedTable}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {plates.map((p, idx) => {
                const userAns = answers[idx]
                const pCorrect = lang === 'tj' ? p.correctTj : lang === 'en' ? p.correctEn : p.correctRu
                const isCorrect = userAns === pCorrect

                return (
                  <div
                    key={`${p.id}-${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-mono font-bold text-slate-400 w-5">#{idx + 1}</span>
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
            <Button variant="outline" onClick={handleRetake} className="w-full sm:w-auto gap-2">
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
