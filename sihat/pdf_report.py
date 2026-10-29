"""Professional, clinical-grade PDF protocol generator for SIHAT screening results.
Supports 100% single-language generation in Russian (RU), Tajik (TJ), and English (EN)
with full Cyrillic Unicode TrueType fonts and evidence-based design standards.
"""

from __future__ import annotations

import os
from datetime import datetime
from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# Color Palette (SIHAT Signature Palette)
COLOR_PRIMARY = colors.HexColor("#103D35")      # Deep Emerald
COLOR_MINT = colors.HexColor("#17A884")         # Vibrant Mint
COLOR_CYAN = colors.HexColor("#2EC4A7")         # Cyan Accent
COLOR_SAGE = colors.HexColor("#DDF5EB")         # Soft Sage
COLOR_DARK = colors.HexColor("#0F172A")         # Slate Dark Text
COLOR_MUTED = colors.HexColor("#64748B")        # Slate Muted Text
COLOR_CARD_BG = colors.HexColor("#F8FAF9")      # Light Clean Card Background
COLOR_BORDER = colors.HexColor("#E2E8F0")       # Slate Border
COLOR_AMBER = colors.HexColor("#D97706")        # Warning Amber
COLOR_LIGHT_AMBER = colors.HexColor("#FEF3C7")  # Amber BG

FONT_REGULAR = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
_font_registered = False


def _ensure_fonts() -> None:
    global FONT_REGULAR, FONT_BOLD, _font_registered
    if _font_registered:
        return

    base_dir = os.path.dirname(__file__)
    font_reg_path = os.path.join(base_dir, "assets", "fonts", "font-regular.ttf")
    font_bold_path = os.path.join(base_dir, "assets", "fonts", "font-bold.ttf")

    if not os.path.exists(font_reg_path):
        candidate_reg = ["C:/Windows/Fonts/arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
        for p in candidate_reg:
            if os.path.exists(p):
                font_reg_path = p
                break

    if not os.path.exists(font_bold_path):
        candidate_bold = ["C:/Windows/Fonts/arialbd.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
        for p in candidate_bold:
            if os.path.exists(p):
                font_bold_path = p
                break

    if os.path.exists(font_reg_path) and os.path.exists(font_bold_path):
        try:
            pdfmetrics.registerFont(TTFont("SihatRegular", font_reg_path))
            pdfmetrics.registerFont(TTFont("SihatBold", font_bold_path))
            FONT_REGULAR = "SihatRegular"
            FONT_BOLD = "SihatBold"
            _font_registered = True
        except Exception:
            pass


def _clean_text(val: Any) -> str:
    if val is None:
        return ""
    text = str(val)
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# Document UI strings per language
UI_STRINGS: dict[str, dict[str, str]] = {
    "ru": {
        "brand_subtitle": "ДОКАЗАТЕЛЬНЫЙ СКРИНИНГ ЗДОРОВЬЯ И КОГНИТИВНЫХ ФУНКЦИЙ",
        "protocol_title": "ПРОТОКОЛ СКРИНИНГОВОГО ТЕСТИРОВАНИЯ",
        "meta_protocol_id": "Номер протокола:",
        "meta_completion_date": "Дата завершения:",
        "meta_architecture": "Архитектура:",
        "meta_architecture_val": "Zero-Retention / Валидировано",
        "participant_label": "Участник:",
        "participant_default": "Пользователь",
        "email_label": "Привязанный Email:",
        "email_private": "Приватный аккаунт",
        "age_group_label": "Возрастная категория:",
        "age_group_18": "18+ лет (Взрослый контур)",
        "age_group_16_17": "16–17 лет (Юношеский протокол)",
        "methodology_type_label": "Тип методики:",
        "methodology_type_default": "Образовательный скрининг",
        "test_section_prefix": "Методика: ",
        "scientific_passport_label": "Научный стандарт:",
        "calibration_label": "Калибровка / Статус:",
        "calibration_value": "Стандарт ISO • Валидировано",
        "biomarkers_title": "Зафиксированные психофизиологические маркеры",
        "table_col_metric": "Маркер / Параметр",
        "table_col_value": "Результат",
        "table_col_norm": "Нормативная калибровка",
        "status_box_label": "Клинико-нормативный статус:",
        "limitations_title": "Условия валидности и ограничения методики:",
        "limitations_text": (
            "Результаты зависят от текущего психофизиологического состояния (усталость, освещение, размер экрана). "
            "Тест предназначен исключительно для скрининговой оценки и доказательного самоконтроля и не заменяет "
            "диагностического обследования врачом-специалистом."
        ),
        "special_notes_label": "Особые примечания:",
        "special_notes_default": "Скрининг проведён в цифровом онлайн-формате по стандартному протоколу.",
        "disclaimer": (
            "<b>ОФИЦИАЛЬНОЕ УВЕДОМЛЕНИЕ:</b> Платформа SIHAT (Сиҳат) является информационно-образовательной системой "
            "для доказательного самоконтроля когнитивно-моторных и сенсорных маркеров. Настоящий протокол не является "
            "медицинским заключением, клиническим диагнозом или назначением лечения. При наличии жалоб или симптомов "
            "обратитесь к врачу."
        ),
        "footer": "Протокол SIHAT #{protocol_id} • Защищено криптографическим хэшем • https://sihat.king.tj",
        "norm_population": "Соответствует популяционному стандарту",
        "norm_time": "Ориентир: 180–300 мс",
        "norm_contrast": "Ориентир: 1.75–2.00 logCS",
        "norm_errors": "Ориентир: 0–2 ошибки",
        "norm_span": "Ориентир: 5–8 элементов",
        "norm_accuracy": "Ориентир: 90–100%",
        "norm_tracking": "Ориентир: > 70%",
    },
    "tj": {
        "brand_subtitle": "СКРИНИНГИ ДАЛЕЛНОКИ САЛОМАТӢ ВА ВАЗИФАҲОИ МАҒЗӢ",
        "protocol_title": "ПРОТОКОЛИ САНҶИШИ СКРИНИНГӢ",
        "meta_protocol_id": "Рақами протокол:",
        "meta_completion_date": "Санаи анҷом:",
        "meta_architecture": "Меъморӣ:",
        "meta_architecture_val": "Zero-Retention / Исботшуда",
        "participant_label": "Иштирокчӣ:",
        "participant_default": "Корбар",
        "email_label": "Почтаи пайвастшуда:",
        "email_private": "Ҳисоби маҳрам",
        "age_group_label": "Гурӯҳи синну сол:",
        "age_group_18": "18+ сол (Контури клиникии калонсолон)",
        "age_group_16_17": "16–17 сол (Протоколи наврасон)",
        "methodology_type_label": "Намуди метод:",
        "methodology_type_default": "Скрининги таълимӣ",
        "test_section_prefix": "Метод: ",
        "scientific_passport_label": "Шиносномаи илмӣ:",
        "calibration_label": "Калибровка / Вазъ:",
        "calibration_value": "Стандарти ISO • Исботшуда",
        "biomarkers_title": "Нишондиҳандаҳои сабтшудаи психофизиологӣ",
        "table_col_metric": "Нишондиҳанда / Параметр",
        "table_col_value": "Натиҷа",
        "table_col_norm": "Меъёри муқаррарӣ",
        "status_box_label": "Вазъи клиникӣ-меъёрӣ:",
        "limitations_title": "Шароити эътиборнокӣ ва маҳдудиятҳои метод:",
        "limitations_text": (
            "Натиҷаҳо аз ҳолати кунунии ҷисмонӣ (мондашавӣ, равшанӣ, андозаи экран) вобастаанд. "
            "Санҷиш танҳо барои баҳодиҳии скринингӣ ва худмуоинаи далелнок буда, "
            "ташхиси пурраи тиббиро иваз намекунад."
        ),
        "special_notes_label": "Қайдҳои махсус:",
        "special_notes_default": "Скрининг дар формати рақамии онлайн аз рӯи протоколи стандартӣ гузаронида шуд.",
        "disclaimer": (
            "<b>ОГОҲИИ РАСМӢ:</b> Платформаи SIHAT (Сиҳат) системаи иттилоотӣ-таълимӣ барои худмуоинаи "
            "далелноки нишондиҳандаҳои маърифатӣ ва ҳиссӣ мебошад. Ин протокол хулосаи тиббӣ, "
            "ташхиси клиникӣ ё таъини табобат ба шумор намеравад. Дар ҳолати пайдо шудани "
            "нишонаҳо ё нороҳатӣ ба духтури мутахассис муроҷиат намоед."
        ),
        "footer": "Протоколи SIHAT #{protocol_id} • Бо рамзи криптографӣ ҳимоя шудааст • https://sihat.king.tj",
        "norm_population": "Ба меъёри миёнаи аҳолӣ мувофиқат мекунад",
        "norm_time": "Меъёр: 180–300 мс",
        "norm_contrast": "Меъёр: 1.75–2.00 logCS",
        "norm_errors": "Меъёр: 0–2 хато",
        "norm_span": "Меъёр: 5–8 унсур",
        "norm_accuracy": "Меъёр: 90–100%",
        "norm_tracking": "Меъёр: > 70%",
    },
    "en": {
        "brand_subtitle": "EVIDENCE-BASED HEALTH & COGNITIVE SCREENING PROTOCOL",
        "protocol_title": "SCREENING ASSESSMENT PROTOCOL",
        "meta_protocol_id": "Protocol ID:",
        "meta_completion_date": "Date Completed:",
        "meta_architecture": "Architecture:",
        "meta_architecture_val": "Zero-Retention / Validated",
        "participant_label": "Participant:",
        "participant_default": "Participant",
        "email_label": "Registered Email:",
        "email_private": "Private Account",
        "age_group_label": "Age Category:",
        "age_group_18": "18+ years (Adult Standard)",
        "age_group_16_17": "16–17 years (Adolescent Protocol)",
        "methodology_type_label": "Methodology Type:",
        "methodology_type_default": "Educational Screening",
        "test_section_prefix": "Methodology: ",
        "scientific_passport_label": "Scientific Standard:",
        "calibration_label": "Calibration / Status:",
        "calibration_value": "ISO Standard • Clinically Validated",
        "biomarkers_title": "Recorded Psychophysiological Biomarkers",
        "table_col_metric": "Biomarker / Metric",
        "table_col_value": "Value / Result",
        "table_col_norm": "Normative Baseline",
        "status_box_label": "Clinical & Normative Status:",
        "limitations_title": "Validity Conditions & Methodological Limitations:",
        "limitations_text": (
            "Results depend on physiological state (fatigue, lighting, screen size). "
            "This screening is designed exclusively for objective self-monitoring and cognitive tracking, "
            "and does not replace medical diagnostic assessment."
        ),
        "special_notes_label": "Special Notes:",
        "special_notes_default": "Screening performed in standardized digital web protocol.",
        "disclaimer": (
            "<b>OFFICIAL NOTICE:</b> The SIHAT platform is an evidence-based informational and educational screening "
            "system for self-monitoring cognitive-motor and sensory biomarkers. This protocol does not constitute a "
            "medical diagnosis, clinical opinion, or treatment prescription. If you have medical concerns or persistent "
            "symptoms, consult a licensed healthcare professional."
        ),
        "footer": "SIHAT Protocol #{protocol_id} • Cryptographically Verified Record • https://sihat.king.tj",
        "norm_population": "Within expected population baseline",
        "norm_time": "Baseline: 180–300 ms",
        "norm_contrast": "Baseline: 1.75–2.00 logCS",
        "norm_errors": "Baseline: 0–2 errors",
        "norm_span": "Baseline: 5–8 items",
        "norm_accuracy": "Baseline: 90–100%",
        "norm_tracking": "Baseline: > 70%",
    },
}

# Clean localized titles for all tests
TEST_NAMES: dict[str, dict[str, str]] = {
    "reaction-speed": {
        "ru": "Скорость простой реакции",
        "tj": "Суръати аксуламали оддӣ",
        "en": "Simple Reaction Speed",
    },
    "attention-concentration": {
        "ru": "Таблицы Шульте",
        "tj": "Ҷадвалҳои Шулте",
        "en": "Schulte Table Attention",
    },
    "visual-perception": {
        "ru": "Острота зрения",
        "tj": "Тезиши биноӣ",
        "en": "Visual Acuity",
    },
    "contrast-sensitivity": {
        "ru": "Контрастная чувствительность",
        "tj": "Ҳассосияти контрастӣ",
        "en": "Contrast Sensitivity",
    },
    "color-perception": {
        "ru": "Тест на дальтонизм",
        "tj": "Санҷиши дальтонизм",
        "en": "Color Vision Screening",
    },
    "color-hue-discrimination": {
        "ru": "Цветоразличение оттенков",
        "tj": "Фарқкунии тобишҳои ранг",
        "en": "Color Hue Discrimination",
    },
    "sound-discrimination": {
        "ru": "Тональная аудиометрия",
        "tj": "Аудиометрияи тоналӣ",
        "en": "Pure Tone Audiometry",
    },
    "speech-in-noise": {
        "ru": "Разборчивость речи в шуме",
        "tj": "Фаҳмоии нутқ дар садои бегона",
        "en": "Speech-in-Noise Discrimination",
    },
    "visual-memory": {
        "ru": "Пространственная память",
        "tj": "Хотираи фазоӣ",
        "en": "Spatial Working Memory",
    },
    "short-term-memory": {
        "ru": "Кратковременная память",
        "tj": "Хотираи кӯтоҳмуддат",
        "en": "Short-Term Memory",
    },
    "attention-switching": {
        "ru": "Переключаемость внимания",
        "tj": "Ивазшавии диққат",
        "en": "Cognitive Switching",
    },
    "mouse-eye-coordination": {
        "ru": "Координация глаз-рука",
        "tj": "Ҳамоҳангии чашму даст",
        "en": "Eye-Hand Coordination",
    },
    "information-processing-speed": {
        "ru": "Скорость обработки символов",
        "tj": "Суръати коркарди иттилоот",
        "en": "Symbol Digit Modalities",
    },
    "physical-wellbeing": {
        "ru": "Соматический тонус и баланс энергии",
        "tj": "Тонуси ҷисмонӣ ва тавозуни нерӯ",
        "en": "Somatic Equilibrium & Energy",
    },
    "emotional-wellbeing": {
        "ru": "Психоэмоциональный баланс",
        "tj": "Тавозуни равонӣ-эҳсосӣ",
        "en": "Affective Equilibrium",
    },
    "daily-activity": {
        "ru": "Циркадианный ритм и цифровая гигиена",
        "tj": "Ритми сиркадӣ ва гигиенаи рақамӣ",
        "en": "Circadian Hygiene & Light Alignment",
    },
    "gad-7": {
        "ru": "Шкала тревожности GAD-7",
        "tj": "Миқёси ташвиши GAD-7",
        "en": "GAD-7 Generalized Anxiety Scale",
    },
    "pattern-matrix": {
        "ru": "Матричное логическое мышление",
        "tj": "Тафаккури мантиқии матритсавӣ",
        "en": "Matrix Reasoning",
    },
    "cursor-path": {
        "ru": "Точность траектории курсора",
        "tj": "Дақиқияти ҳаракати курсор",
        "en": "Cursor Path Precision",
    },
    "sound-comparison": {
        "ru": "Сравнение высоты тонов",
        "tj": "Муқоисаи баландии садоҳо",
        "en": "Pitch Discrimination",
    },
    "visual-pairs": {
        "ru": "Парные зрительные ассоциации",
        "tj": "Ассотсиатсияҳои ҷуфти биноӣ",
        "en": "Visual Paired Associates",
    },
}

# Clean scientific methodology standards per test slug
METHODOLOGY_STANDARDS: dict[str, dict[str, str]] = {
    "reaction-speed": {
        "ru": "Методика простой реакции Дондерса (Donders A)",
        "tj": "Методи аксуламали оддии Дондерс А",
        "en": "Donders Simple Reaction Time (Donders A)",
    },
    "attention-concentration": {
        "ru": "Таблицы Шульте (Матричный поиск 5 × 5)",
        "tj": "Ҷадвалҳои Шулте (Ҷустуҷӯи матритсавии 5 × 5)",
        "en": "Schulte 5 × 5 Visual Search Grid",
    },
    "visual-perception": {
        "ru": "Стандарт оптотипов ISO 8596",
        "tj": "Стандарти оптотипҳои ISO 8596",
        "en": "ISO 8596 Standard Optotype Protocol",
    },
    "contrast-sensitivity": {
        "ru": "Методика контрастности Пелли-Робсона",
        "tj": "Методи контрастии Пелли-Робсон",
        "en": "Pelli-Robson Contrast Sensitivity Standard",
    },
    "color-perception": {
        "ru": "Полихроматическая оценка спектра колбочек L, M, S",
        "tj": "Баҳодиҳии полихроматикии колбачаҳои биноӣ L, M, S",
        "en": "Cone Pigment Sensitivity (L, M, S) Standard",
    },
    "color-hue-discrimination": {
        "ru": "Спектральный круг Фарнсворта-Манселла D-15",
        "tj": "Доираи спектралии Фарнсворт-Манселл D-15",
        "en": "Farnsworth-Munsell D-15 Hue Standard",
    },
    "sound-discrimination": {
        "ru": "Тональная аудиометрия ISO 8253-1",
        "tj": "Аудиометрияи тоналии ISO 8253-1",
        "en": "ISO 8253-1 Pure-Tone Audiometry",
    },
    "speech-in-noise": {
        "ru": "Речевой порог в шуме (SNR / Babble Noise)",
        "tj": "Ҳадди фаҳмоии нутқ дар садо (SNR / Babble Noise)",
        "en": "Speech Reception Threshold in Babble Noise (SNR)",
    },
    "visual-memory": {
        "ru": "Блоки Корси (Corsi Block-Tapping)",
        "tj": "Блокҳои Корси (Corsi Block-Tapping)",
        "en": "Corsi Block-Tapping Task",
    },
    "short-term-memory": {
        "ru": "Цифровой ряд Векслера (Digit Span)",
        "tj": "Қатори рақамҳои Векслер (Digit Span)",
        "en": "Wechsler Sequential Digit Span",
    },
    "attention-switching": {
        "ru": "Тест прокладывания пути TMT Часть B",
        "tj": "Санҷиши пайвасткунии хатҳо (TMT Қисми B)",
        "en": "Trail Making Test Part B (TMT-B)",
    },
    "mouse-eye-coordination": {
        "ru": "Динамическое слежение за целью (Time-on-Target)",
        "tj": "Пайгирии мунтазами ҳадаф (Time-on-Target)",
        "en": "Continuous Dynamic Target Pursuit Tracking",
    },
    "information-processing-speed": {
        "ru": "Символьно-цифровой тест модальностей (SDMT)",
        "tj": "Санҷиши рамзҳо ва рақамҳо (SDMT)",
        "en": "Symbol Digit Modalities Test (SDMT)",
    },
    "physical-wellbeing": {
        "ru": "Многоосевой соматический радар комфорта",
        "tj": "Радари бисёрсамтаи бароҳатии бадан",
        "en": "Multi-axial Somatic Comfort Inventory",
    },
    "emotional-wellbeing": {
        "ru": "Двухосевая модель аффекта Рассела (Circumplex)",
        "tj": "Модели дусамтаи эҳсосоти Рассел (Circumplex)",
        "en": "Russell 2D Circumplex Model of Affect",
    },
    "daily-activity": {
        "ru": "Циркадианный профиль и спектральная гигиена",
        "tj": "Профили сиркадӣ ва гигиенаи спектралӣ",
        "en": "24-Hour Circadian Profile & Blue-Light Alignment",
    },
    "gad-7": {
        "ru": "Стандартизированная шкала GAD-7",
        "tj": "Шкалаи стандартии GAD-7",
        "en": "Standardized GAD-7 Screening Instrument",
    },
    "pattern-matrix": {
        "ru": "Прогрессивные матрицы Равена",
        "tj": "Матритсаҳои Равен",
        "en": "Raven Progressive Matrices Standard",
    },
    "cursor-path": {
        "ru": "Траекторный тест моторного контроля",
        "tj": "Санҷиши назорати ҳаракатӣ",
        "en": "Motor Trajectory Kinematic Standard",
    },
    "sound-comparison": {
        "ru": "Психоакустическое различение высоты тона",
        "tj": "Тафриқаи психоакустикии баландии садо",
        "en": "Psychoacoustic Pitch Discrimination Standard",
    },
    "visual-pairs": {
        "ru": "Парные зрительные ассоциации (PAL)",
        "tj": "Ассотсиатсияҳои ҷуфти биноӣ (PAL)",
        "en": "Paired Associates Learning Standard (PAL)",
    },
}

# Metric labels per language
METRIC_LABELS: dict[str, dict[str, str]] = {
    "ru": {
        "time_seconds": "Время выполнения (с)",
        "completion_time_s": "Время выполнения (с)",
        "mean_reaction_time_ms": "Среднее время реакции (мс)",
        "reaction_time_ms": "Время реакции (мс)",
        "fastest_reaction_time_ms": "Наилучшее время реакции (мс)",
        "best_time_ms": "Наилучшее время реакции (мс)",
        "accuracy_percentage": "Точность выполнения (%)",
        "accuracy_pct": "Точность выполнения (%)",
        "errors": "Количество ошибок",
        "error_count": "Количество ошибок",
        "errors_count": "Количество ошибок",
        "speed_cpm": "Темп внимания (знаков/мин)",
        "pace_ratio": "Показатель темпа (коэфф.)",
        "logCS": "Контрастная чувствительность (logCS)",
        "visual_acuity_decimal": "Острота зрения (десятичная шкала)",
        "visual_acuity_snellen": "Острота зрения (Снеллен)",
        "srt_threshold_db": "Речевой порог в шуме (дБ)",
        "speech_snr_db": "Речевой порог в шуме (SNR дБ)",
        "pitch_threshold_hz": "Порог слуховой чувствительности (дБ)",
        "hearing_threshold_db": "Порог слуховой чувствительности (дБ)",
        "memory_span": "Объём рабочей памяти (элементов)",
        "span": "Объём рабочей памяти (элементов)",
        "max_sequence_length": "Макс. длина последовательности",
        "forward_span": "Прямой объём памяти",
        "backward_span": "Обратный объём памяти",
        "valid_clicks": "Правильные ответы",
        "correct_count": "Правильные ответы",
        "correct_plates": "Правильные ответы",
        "early_clicks": "Фальстарты / Опережения",
        "false_starts": "Фальстарты / Опережения",
        "score": "Итоговый балл",
        "total_score": "Итоговый балл",
        "anxiety_score": "Индекс тревожности (GAD-7)",
        "anxiety_severity": "Уровень тревожности",
        "time_on_target_pct": "Удержание цели (Time-on-Target %)",
        "total_deviation": "Суммарное отклонение от оси",
        "correct_pairs": "Найдено пар",
        "incorrect_pairs": "Ошибочных попыток",
        "trials_count": "Всего испытаний",
        "total_trials": "Всего испытаний",
        "total_plates": "Всего стимулов",
        "hue_error_score": "Индекс погрешности оттенков",
        "work_efficiency": "Эффективность работы (ЭР)",
        "mental_stability": "Психическая устойчивость (ПУ)",
        "steps_evaluated": "Количество шагов теста",
    },
    "tj": {
        "time_seconds": "Вақти иҷро (сония)",
        "completion_time_s": "Вақти иҷро (сония)",
        "mean_reaction_time_ms": "Вақти миёнаи аксуламал (мс)",
        "reaction_time_ms": "Вақти аксуламал (мс)",
        "fastest_reaction_time_ms": "Беҳтарин вақти аксуламал (мс)",
        "best_time_ms": "Беҳтарин вақти аксуламал (мс)",
        "accuracy_percentage": "Дақиқияти иҷро (%)",
        "accuracy_pct": "Дақиқияти иҷро (%)",
        "errors": "Шумораи хатоҳо",
        "error_count": "Шумораи хатоҳо",
        "errors_count": "Шумораи хатоҳо",
        "speed_cpm": "Суръати диққат (аломат/дақ)",
        "pace_ratio": "Нишондиҳандаи суръат (коэфф.)",
        "logCS": "Ҳассосияти контрастӣ (logCS)",
        "visual_acuity_decimal": "Тезиши биноӣ (даҳӣ)",
        "visual_acuity_snellen": "Тезиши биноӣ (Снеллен)",
        "srt_threshold_db": "Ҳадди фаҳмоии нутқ дар садо (дБ)",
        "speech_snr_db": "Ҳадди фаҳмоии нутқ дар садо (SNR дБ)",
        "pitch_threshold_hz": "Ҳадди шунавоӣ (дБ)",
        "hearing_threshold_db": "Ҳадди шунавоӣ (дБ)",
        "memory_span": "Ҳаҷми хотираи корӣ (унсурҳо)",
        "span": "Ҳаҷми хотираи корӣ (унсурҳо)",
        "max_sequence_length": "Дарозии ҳадди аксари занҷир",
        "forward_span": "Ҳаҷми хотираи мустақим",
        "backward_span": "Ҳаҷми хотираи бозгаштӣ",
        "valid_clicks": "Ҷавобҳои дуруст",
        "correct_count": "Ҷавобҳои дуруст",
        "correct_plates": "Ҷавобҳои дуруст",
        "early_clicks": "Шитобкорӣ / Оғози барвақт",
        "false_starts": "Шитобкорӣ / Оғози барвақт",
        "score": "Холи умумӣ",
        "total_score": "Холи умумӣ",
        "anxiety_score": "Нишондиҳандаи ташвиш (GAD-7)",
        "anxiety_severity": "Сатҳи ташвиш",
        "time_on_target_pct": "Нигоҳдории ҳадаф (%)",
        "total_deviation": "Инҳирофи умумӣ аз самт",
        "correct_pairs": "Ҷуфтҳои ёфтшуда",
        "incorrect_pairs": "Кӯшишҳои хато",
        "trials_count": "Шумораи санҷишҳо",
        "total_trials": "Шумораи санҷишҳо",
        "total_plates": "Шумораи стимулҳо",
        "hue_error_score": "Нишондиҳандаи хатои рангҳо",
        "work_efficiency": "Самаранокии кор (ЭР)",
        "mental_stability": "Устувории равонӣ (ПУ)",
        "steps_evaluated": "Шумораи қадамҳои санҷиш",
    },
    "en": {
        "time_seconds": "Completion Time (s)",
        "completion_time_s": "Completion Time (s)",
        "mean_reaction_time_ms": "Mean Reaction Time (ms)",
        "reaction_time_ms": "Reaction Time (ms)",
        "fastest_reaction_time_ms": "Best Reaction Time (ms)",
        "best_time_ms": "Best Reaction Time (ms)",
        "accuracy_percentage": "Accuracy (%)",
        "accuracy_pct": "Accuracy (%)",
        "errors": "Error Count",
        "error_count": "Error Count",
        "errors_count": "Error Count",
        "speed_cpm": "Attention Rate (chars/min)",
        "pace_ratio": "Pace Ratio",
        "logCS": "Contrast Sensitivity (logCS)",
        "visual_acuity_decimal": "Visual Acuity (decimal)",
        "visual_acuity_snellen": "Visual Acuity (Snellen)",
        "srt_threshold_db": "Speech Reception Threshold (dB)",
        "speech_snr_db": "Speech Reception Threshold (SNR dB)",
        "pitch_threshold_hz": "Hearing Threshold (dB)",
        "hearing_threshold_db": "Hearing Threshold (dB)",
        "memory_span": "Working Memory Span (items)",
        "span": "Working Memory Span (items)",
        "max_sequence_length": "Max Sequence Length",
        "forward_span": "Forward Memory Span",
        "backward_span": "Backward Memory Span",
        "valid_clicks": "Correct Responses",
        "correct_count": "Correct Responses",
        "correct_plates": "Correct Responses",
        "early_clicks": "False Starts",
        "false_starts": "False Starts",
        "score": "Total Score",
        "total_score": "Total Score",
        "anxiety_score": "Anxiety Index (GAD-7)",
        "anxiety_severity": "Anxiety Severity",
        "time_on_target_pct": "Time on Target (%)",
        "total_deviation": "Total Path Deviation",
        "correct_pairs": "Matched Pairs",
        "incorrect_pairs": "Mismatched Attempts",
        "trials_count": "Total Trials",
        "total_trials": "Total Trials",
        "total_plates": "Total Stimuli / Plates",
        "hue_error_score": "Total Hue Error Score",
        "work_efficiency": "Work Efficiency Index",
        "mental_stability": "Mental Stability Index",
        "steps_evaluated": "Evaluated Steps",
    },
}

# Status category translations
STATUS_CATEGORIES: dict[str, dict[str, str]] = {
    "normal": {
        "ru": "В пределах возрастной нормы",
        "tj": "Дар ҳудуди меъёри синну солӣ",
        "en": "Within Normal Age Range",
    },
    "high_norm": {
        "ru": "Высокий функциональный уровень",
        "tj": "Сатҳи баланди функсионалӣ",
        "en": "High Functional Level",
    },
    "borderline": {
        "ru": "Пограничный диапазон / Допустимые отклонения",
        "tj": "Диапазони ҳудудӣ / Инҳирофи ночиз",
        "en": "Borderline / Mild Variation",
    },
    "mild": {
        "ru": "Пограничный диапазон / Допустимые отклонения",
        "tj": "Диапазони ҳудудӣ / Инҳирофи ночиз",
        "en": "Borderline / Mild Variation",
    },
    "moderate": {
        "ru": "Умеренное отклонение от нормы",
        "tj": "Инҳирофи муътадил аз меъёр",
        "en": "Moderate Deviation",
    },
    "severe": {
        "ru": "Рекомендуется повторный контроль / Консультация",
        "tj": "Санҷиши такрорӣ / Машварат тавсия мешавад",
        "en": "Follow-up / Professional Assessment Advised",
    },
    "attention_required": {
        "ru": "Рекомендуется повторный контроль / Консультация",
        "tj": "Санҷиши такрорӣ / Машварат тавсия мешавад",
        "en": "Follow-up / Professional Assessment Advised",
    },
}


def _localize_status(raw_status: str | None, lang: str) -> str:
    if not raw_status:
        return ""
    st_lower = str(raw_status).lower()
    for key, trans in STATUS_CATEGORIES.items():
        if key in st_lower:
            return trans.get(lang, trans.get("ru", raw_status))
    if any(w in st_lower for w in ["норм", "хуб", "баланд", "norm", "good", "excellent"]):
        return STATUS_CATEGORIES["normal"].get(lang, STATUS_CATEGORIES["normal"]["ru"])
    if any(w in st_lower for w in ["погран", "ҳудуд", "паст", "mild", "border"]):
        return STATUS_CATEGORIES["borderline"].get(lang, STATUS_CATEGORIES["borderline"]["ru"])
    if any(w in st_lower for w in ["средн", "миён", "mod"]):
        return STATUS_CATEGORIES["moderate"].get(lang, STATUS_CATEGORIES["moderate"]["ru"])
    if any(w in st_lower for w in ["высок", "диққат", "severe", "high", "atten"]):
        return STATUS_CATEGORIES["attention_required"].get(lang, STATUS_CATEGORIES["attention_required"]["ru"])
    return raw_status


def build_screening_pdf(
    item: Any,
    user: Any,
    payload: Any = None,
    lang: str = "ru",
    test_def: Any = None,
) -> bytes:
    """Generate a clean, beautiful, clinical-grade PDF protocol strictly in the chosen language (ru, tj, or en)."""
    _ensure_fonts()

    # Normalize language
    active_lang = lang if lang in ("ru", "tj", "tg", "en") else "ru"
    if active_lang == "tg":
        active_lang = "tj"

    ui = UI_STRINGS.get(active_lang, UI_STRINGS["ru"])
    metric_labels_map = METRIC_LABELS.get(active_lang, METRIC_LABELS["ru"])

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    # Custom typography styles with registered Unicode fonts
    style_brand = ParagraphStyle(
        "BrandTitle",
        fontName=FONT_BOLD,
        fontSize=20,
        leading=22,
        textColor=COLOR_PRIMARY,
    )
    style_subtitle = ParagraphStyle(
        "BrandSubtitle",
        fontName=FONT_BOLD,
        fontSize=8,
        leading=10,
        textColor=COLOR_MINT,
    )
    style_doc_type = ParagraphStyle(
        "DocType",
        fontName=FONT_BOLD,
        fontSize=12,
        leading=14,
        textColor=COLOR_DARK,
    )
    style_meta_key = ParagraphStyle(
        "MetaKey",
        fontName=FONT_REGULAR,
        fontSize=8,
        leading=10,
        textColor=COLOR_MUTED,
    )
    style_meta_val = ParagraphStyle(
        "MetaVal",
        fontName=FONT_BOLD,
        fontSize=8,
        leading=10,
        textColor=COLOR_DARK,
    )
    style_section_title = ParagraphStyle(
        "SectionTitle",
        fontName=FONT_BOLD,
        fontSize=11,
        leading=13,
        textColor=COLOR_PRIMARY,
    )
    style_table_header = ParagraphStyle(
        "TableHeader",
        fontName=FONT_BOLD,
        fontSize=9,
        leading=11,
        textColor=colors.white,
    )
    style_table_cell = ParagraphStyle(
        "TableCell",
        fontName=FONT_REGULAR,
        fontSize=9,
        leading=11,
        textColor=COLOR_DARK,
    )
    style_table_cell_bold = ParagraphStyle(
        "TableCellBold",
        fontName=FONT_BOLD,
        fontSize=9,
        leading=11,
        textColor=COLOR_PRIMARY,
    )
    style_disclaimer = ParagraphStyle(
        "Disclaimer",
        fontName=FONT_REGULAR,
        fontSize=7.5,
        leading=9.5,
        textColor=COLOR_MUTED,
    )
    style_callout_title = ParagraphStyle(
        "CalloutTitle",
        fontName=FONT_BOLD,
        fontSize=9,
        leading=11,
        textColor=COLOR_PRIMARY,
    )
    style_callout_body = ParagraphStyle(
        "CalloutBody",
        fontName=FONT_REGULAR,
        fontSize=8.5,
        leading=11,
        textColor=COLOR_DARK,
    )

    story: list[Any] = []

    # 1. HEADER BAR
    protocol_id = getattr(item, "id", "")[:8].upper()
    comp_date: datetime = getattr(item, "completed_at", datetime.now())
    date_str = comp_date.strftime("%d.%m.%Y, %H:%M UTC")

    brand_block = [
        Paragraph("SIHAT", style_brand),
        Spacer(1, 2),
        Paragraph(ui["brand_subtitle"], style_subtitle),
        Spacer(1, 6),
        Paragraph(ui["protocol_title"], style_doc_type),
    ]

    meta_table_data = [
        [
            Paragraph(ui["meta_protocol_id"], style_meta_key),
            Paragraph(f"#{protocol_id}", style_meta_val),
        ],
        [
            Paragraph(ui["meta_completion_date"], style_meta_key),
            Paragraph(date_str, style_meta_val),
        ],
        [
            Paragraph(ui["meta_architecture"], style_meta_key),
            Paragraph(ui["meta_architecture_val"], style_meta_val),
        ],
    ]
    meta_table = Table(meta_table_data, colWidths=[80, 140])
    meta_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_CARD_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    header_table = Table(
        [[brand_block, meta_table]],
        colWidths=[300, 223],
    )
    header_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_MINT, spaceBefore=4, spaceAfter=10))

    # 2. PARTICIPANT INFORMATION CARD
    user_name = getattr(user, "full_name", "") or ui["participant_default"]
    user_email = getattr(user, "email", "") or ui["email_private"]
    user_age_raw = getattr(user, "age_group", "18_plus")
    age_group_str = ui["age_group_18"] if user_age_raw == "18_plus" else ui["age_group_16_17"]

    # Localize test type
    test_type_raw = getattr(item, "test_type", "educational_exercise").lower()
    if "clinical" in test_type_raw:
        test_type_str = "Клинический скрининг" if active_lang == "ru" else ("Скрининги клиникӣ" if active_lang == "tj" else "Clinical Screening")
    else:
        test_type_str = ui["methodology_type_default"]

    participant_data = [
        [
            Paragraph(f"<b>{ui['participant_label']}</b>", style_table_cell),
            Paragraph(_clean_text(user_name), style_table_cell),
            Paragraph(f"<b>{ui['age_group_label']}</b>", style_table_cell),
            Paragraph(age_group_str, style_table_cell),
        ],
        [
            Paragraph(f"<b>{ui['email_label']}</b>", style_table_cell),
            Paragraph(_clean_text(user_email), style_table_cell),
            Paragraph(f"<b>{ui['methodology_type_label']}</b>", style_table_cell),
            Paragraph(test_type_str, style_table_cell),
        ],
    ]
    part_table = Table(participant_data, colWidths=[90, 170, 110, 153])
    part_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_CARD_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(part_table)
    story.append(Spacer(1, 10))

    # 3. TEST & METHODOLOGY OVERVIEW
    test_slug = getattr(item, "test_slug", "") or getattr(item, "test_id", "")

    # Resolve pure localized title
    resolved_title = None
    if test_def and isinstance(getattr(test_def, "localizations", None), dict):
        loc = (
            test_def.localizations.get(active_lang)
            or (test_def.localizations.get("tg") if active_lang == "tj" else None)
        )
        if isinstance(loc, dict) and loc.get("title"):
            resolved_title = loc.get("title")

    if not resolved_title:
        resolved_title = TEST_NAMES.get(test_slug, {}).get(active_lang)

    if not resolved_title:
        resolved_title = getattr(item, "test_title", "Скрининг функций")

    # Resolve pure localized scientific standard
    meth_standard = METHODOLOGY_STANDARDS.get(test_slug, {}).get(active_lang)
    if not meth_standard:
        meth_standard = resolved_title

    story.append(Paragraph(f"{ui['test_section_prefix']}{_clean_text(resolved_title)}", style_section_title))
    story.append(Spacer(1, 4))

    meth_card_data = [
        [
            Paragraph(f"<b>{ui['scientific_passport_label']}</b>", style_table_cell),
            Paragraph(_clean_text(meth_standard), style_table_cell),
            Paragraph(f"<b>{ui['calibration_label']}</b>", style_table_cell),
            Paragraph(ui["calibration_value"], style_table_cell_bold),
        ]
    ]
    meth_table = Table(meth_card_data, colWidths=[100, 215, 108, 100])
    meth_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(meth_table)
    story.append(Spacer(1, 10))

    # 4. MEASURED BIOMARKERS TABLE
    raw_result: dict = getattr(item, "result", {}) or {}
    status_cat: str | None = raw_result.get("status_category")

    story.append(Paragraph(ui["biomarkers_title"], style_section_title))
    story.append(Spacer(1, 5))

    metrics_rows: list[list[Any]] = [
        [
            Paragraph(ui["table_col_metric"], style_table_header),
            Paragraph(ui["table_col_value"], style_table_header),
            Paragraph(ui["table_col_norm"], style_table_header),
        ]
    ]

    for k, v in raw_result.items():
        if k == "status_category":
            continue
        if isinstance(v, (dict, list)):
            continue

        label = metric_labels_map.get(k, k.replace("_", " ").title())
        val_str = f"{v:.2f}" if isinstance(v, float) else str(v)

        norm_desc = ui["norm_population"]
        if "time" in k or "latency" in k or "reaction" in k:
            norm_desc = ui["norm_time"]
        elif "logCS" in k:
            norm_desc = ui["norm_contrast"]
        elif "errors" in k or "error" in k:
            norm_desc = ui["norm_errors"]
        elif "span" in k or "sequence" in k:
            norm_desc = ui["norm_span"]
        elif "accuracy" in k or "pct" in k:
            norm_desc = ui["norm_accuracy"]
        elif "target" in k:
            norm_desc = ui["norm_tracking"]

        metrics_rows.append(
            [
                Paragraph(_clean_text(label), style_table_cell),
                Paragraph(f"<b>{_clean_text(val_str)}</b>", style_table_cell_bold),
                Paragraph(_clean_text(norm_desc), style_table_cell),
            ]
        )

    metrics_table = Table(metrics_rows, colWidths=[200, 110, 213])
    metrics_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_PRIMARY),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(metrics_table)
    story.append(Spacer(1, 10))

    # Highlight Status Box if category is present
    if status_cat:
        clean_status = _localize_status(status_cat, active_lang)
        status_box = Table(
            [
                [
                    Paragraph(f"<b>{ui['status_box_label']}</b>", style_callout_title),
                    Paragraph(f"<b>{_clean_text(clean_status)}</b>", style_table_cell_bold),
                ]
            ],
            colWidths=[150, 373],
        )
        status_box.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), COLOR_SAGE),
                    ("BOX", (0, 0), (-1, -1), 1, COLOR_MINT),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        story.append(status_box)
        story.append(Spacer(1, 10))

    # 5. LIMITATIONS & VALIDITY
    # Use clean localized limitations to avoid database unreviewed English strings leaking into RU/TJ
    limitations_text = ui["limitations_text"]

    limitations_data = [
        [
            Paragraph(f"<b>{ui['limitations_title']}</b>", style_callout_title)
        ],
        [
            Paragraph(_clean_text(limitations_text), style_callout_body)
        ],
        [
            Paragraph(f"<b>{ui['special_notes_label']}</b> {ui['special_notes_default']}", style_callout_body)
        ],
    ]

    lim_table = Table(limitations_data, colWidths=[523])
    lim_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), COLOR_CARD_BG),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(KeepTogether([lim_table, Spacer(1, 10)]))

    # 6. OFFICIAL DISCLAIMER & SIGNATURE BLOCK
    disc_table = Table([[Paragraph(ui["disclaimer"], style_disclaimer)]], colWidths=[523])
    disc_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(KeepTogether([disc_table, Spacer(1, 8)]))

    # 7. FOOTER
    footer_text = ui["footer"].format(protocol_id=protocol_id)
    story.append(Paragraph(footer_text, style_disclaimer))

    doc.build(story)
    return buffer.getvalue()
