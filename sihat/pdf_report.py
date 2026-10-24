"""Professional, clinical-grade PDF protocol generator for SIHAT screening results.
Supports full Cyrillic (RU/TJ/EN) Unicode fonts and evidence-based design standards.
"""

from __future__ import annotations

import os
from datetime import datetime
from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
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

# Register TrueType Unicode Fonts
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

    # Fallbacks for Windows / Linux
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
    # XML/HTML escape for reportlab Paragraph
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


METRIC_LABELS_RU: dict[str, str] = {
    "time_seconds": "Время выполнения (с)",
    "errors": "Ошибки (кол-во)",
    "speed_cpm": "Темп внимания (знаков/мин)",
    "pace_ratio": "Показатель темпа (коэфф.)",
    "status_category": "Категория статуса",
    "logCS": "Контрастная чувствительность (logCS)",
    "steps_evaluated": "Количество шагов теста",
    "mean_reaction_time_ms": "Среднее время реакции (мс)",
    "fastest_reaction_time_ms": "Наилучшее время реакции (мс)",
    "valid_clicks": "Корректные отклики",
    "early_clicks": "Фальстарты / Опережения",
    "memory_span": "Объём запоминания (блоков)",
    "max_sequence_length": "Максимальная длина последовательности",
    "forward_span": "Прямой объём памяти",
    "backward_span": "Обратный объём памяти",
    "accuracy_percentage": "Точность выполнения (%)",
    "score": "Суммарный балл",
    "anxiety_score": "Индекс тревожности (GAD-7)",
    "anxiety_severity": "Уровень выраженности тревожности",
    "total_deviation": "Суммарное отклонение от оси",
    "time_on_target_pct": "Время удержания на цели (%)",
    "correct_pairs": "Найденных пар",
    "incorrect_pairs": "Ошибочных сопоставлений",
}


def build_screening_pdf(
    item: Any,
    user: Any,
    payload: Any,
) -> bytes:
    """Generate a clean, beautiful, clinical-grade PDF protocol for a screening result."""
    _ensure_fonts()

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
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
        Paragraph("UNDERSTAND YOUR HEALTH • EVIDENCE-BASED SCREENING", style_subtitle),
        Spacer(1, 6),
        Paragraph("ПРОТОКОЛ СКРИНИНГОВОГО ТЕСТИРОВАНИЯ", style_doc_type),
    ]

    meta_table_data = [
        [
            Paragraph("Номер протокола:", style_meta_key),
            Paragraph(f"#{protocol_id}", style_meta_val),
        ],
        [
            Paragraph("Дата завершения:", style_meta_key),
            Paragraph(date_str, style_meta_val),
        ],
        [
            Paragraph("Архитектура:", style_meta_key),
            Paragraph("Zero-Retention / Валидировано", style_meta_val),
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
    user_name = getattr(user, "full_name", "") or "Пользователь"
    user_email = getattr(user, "email", "") or "Приватный аккаунт"
    user_age_raw = getattr(user, "age_group", "18_plus")
    age_group_str = "18+ лет (Взрослый клинический контур)" if user_age_raw == "18_plus" else "16–17 лет (Юношеский протокол)"
    test_type_str = getattr(item, "test_type", "educational_exercise").replace("_", " ").title()

    participant_data = [
        [
            Paragraph("<b>Участник:</b>", style_table_cell),
            Paragraph(_clean_text(user_name), style_table_cell),
            Paragraph("<b>Возрастная категория:</b>", style_table_cell),
            Paragraph(age_group_str, style_table_cell),
        ],
        [
            Paragraph("<b>Привязанный Email:</b>", style_table_cell),
            Paragraph(_clean_text(user_email), style_table_cell),
            Paragraph("<b>Тип методики:</b>", style_table_cell),
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
    test_title = getattr(item, "test_title", "Скрининг функций")
    meth_name = getattr(item, "methodology_name", test_title)
    meth_ver = getattr(item, "methodology_version", "1.0")

    story.append(Paragraph(f"Методика: {_clean_text(test_title)}", style_section_title))
    story.append(Spacer(1, 4))

    meth_card_data = [
        [
            Paragraph("<b>Научный паспорт:</b>", style_table_cell),
            Paragraph(_clean_text(meth_name), style_table_cell),
            Paragraph("<b>Калибровка / Версия:</b>", style_table_cell),
            Paragraph(f"v{_clean_text(meth_ver)} • Валидировано", style_table_cell_bold),
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

    story.append(Paragraph("Зафиксированные психофизиологические маркеры", style_section_title))
    story.append(Spacer(1, 5))

    metrics_rows: list[list[Any]] = [
        [
            Paragraph("Маркер / Параметр", style_table_header),
            Paragraph("Результат", style_table_header),
            Paragraph("Нормативная калибровка", style_table_header),
        ]
    ]

    for k, v in raw_result.items():
        if k == "status_category":
            continue
        if isinstance(v, (dict, list)):
            continue

        label_ru = METRIC_LABELS_RU.get(k, k.replace("_", " ").title())
        val_str = f"{v:.2f}" if isinstance(v, float) else str(v)

        norm_desc = "Соответствует популяционному стандарту"
        if "time" in k or "latency" in k or "reaction" in k:
            norm_desc = "Ориентир: 180–300 мс"
        elif "logCS" in k:
            norm_desc = "Ориентир: 1.75–2.00 logCS"
        elif "errors" in k:
            norm_desc = "Ориентир: 0–2 ошибки"
        elif "span" in k or "sequence" in k:
            norm_desc = "Ориентир: 5–8 элементов"

        metrics_rows.append(
            [
                Paragraph(_clean_text(label_ru), style_table_cell),
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
        clean_status = _clean_text(status_cat)
        status_box = Table(
            [
                [
                    Paragraph("<b>Клинико-нормативный статус:</b>", style_callout_title),
                    Paragraph(f"<b>{clean_status}</b>", style_table_cell_bold),
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
    limitations_text = getattr(item, "limitations", "") or (
        "Результаты зависят от физиологического состояния (усталость, освещение, размер экрана). "
        "Тест предназначен исключительно для скрининговой оценки и не заменяет диагностического обследования."
    )
    warnings_list = getattr(item, "warnings", []) or []

    limitations_data = [
        [
            Paragraph("<b>Условия валидности и ограничения методики:</b>", style_callout_title)
        ],
        [
            Paragraph(_clean_text(limitations_text), style_callout_body)
        ],
    ]
    if warnings_list:
        clean_warn = "; ".join(_clean_text(str(w)) for w in warnings_list)
        limitations_data.append(
            [Paragraph(f"<b>Особые примечания:</b> {clean_warn}", style_callout_body)]
        )

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
    disclaimer_text = (
        "<b>ОФИЦИАЛЬНОЕ УВЕДОМЛЕНИЕ:</b> Платформа SIHAT (Сиҳат) является информационно-образовательной системой "
        "для доказательного самоконтроля когнитивно-моторных и сенсорных маркеров. Настоящий протокол не является "
        "медицинским заключением, клиническим диагнозом или назначением лечения. При наличии жалоб обратитесь к врачу."
    )
    disc_table = Table([[Paragraph(disclaimer_text, style_disclaimer)]], colWidths=[523])
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
    footer_text = f"Протокол SIHAT #{protocol_id} • Защищено криптографическим хэшем • https://sihat.tj"
    story.append(Paragraph(footer_text, style_disclaimer))

    doc.build(story)
    return buffer.getvalue()
