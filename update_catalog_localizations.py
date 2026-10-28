"""Update the 15 educational module localizations in PostgreSQL."""

from sihat.db import SessionLocal
from sihat.models import TestDefinition

DESCRIPTIONS = {
    "reaction-speed": {
        "ru": ("Скорость простой реакции", "Сенсомоторная скорость простой реакции в миллисекундах по методике Donders A."),
        "tg": ("Суръати аксуламали оддӣ", "Санҷиши суръати рефлекси биноӣ-ҳаракатӣ бо миллисонияҳо аз рӯи Donders A."),
        "en": ("Simple Reaction Speed", "Visual-motor reflex response latency in milliseconds using Donders A standard."),
    },
    "attention-concentration": {
        "ru": ("Таблицы Шульте", "Концентрация, устойчивость и избирательность зрительного внимания."),
        "tg": ("Ҷадвалҳои Шулте", "Суръати ҷустуҷӯ, тамаркуз ва устувории диққат дар шабакаи 5 ба 5."),
        "en": ("Таблицы Шульте", "Visual search rate, focal concentration, and attention stability."),
    },
    "visual-perception": {
        "ru": ("Острота зрения", "Стандартизированная проверка оптотипов остроты зрения ISO 8596."),
        "tg": ("Тезиши биноӣ", "Санҷиши стандартии тезиши биноӣ бо оптотипҳои ISO 8596."),
        "en": ("Visual Acuity", "ISO 8596 standardized visual acuity optotype screening."),
    },
    "contrast-sensitivity": {
        "ru": ("Контрастная чувствительность", "Оценка различимости символов при ступенчатом снижении контрастности до 1%."),
        "tg": ("Ҳассосияти контрастӣ", "Баҳодиҳии фарқкунии рамзҳо ҳангоми паст шудани контраст то 1%."),
        "en": ("Contrast Sensitivity", "Letter triplet contrast threshold evaluation down to 1% contrast."),
    },
    "color-perception": {
        "ru": ("Тест на дальтонизм", "Клиническая оценка красно-зелёного цветовосприятия и спектра колбочек L, M, S с распознаванием цифр, букв и геометрических фигур."),
        "tg": ("Санҷиши дальтонизм", "Баҳодиҳии клиникии тафриқаи рангҳои сурху сабз ва колбачаҳои биноӣ бо рақамҳо, ҳарфҳо ва шаклҳои геометрӣ."),
        "en": ("Color Blindness Screening", "Clinical polychromatic screening for protan, deutan, and tritan defects using numbers, letters, and geometric figures."),
    },
    "color-hue-discrimination": {
        "ru": ("Цветоразличение оттенков", "Спектральная сортировка цветовых оттенков по кругу Манселла."),
        "tg": ("Фарқкунии тобишҳои ранг", "Тартибдиҳии спектралии доираҳои ранга дар пайдарпайии ҳамвор."),
        "en": ("Color Hue Discrimination", "Spectral hue arrangement across the chromatic circle."),
    },
    "sound-discrimination": {
        "ru": ("Тональная аудиометрия", "Компьютерная пороговая аудиометрия чистыми тонами ISO 8253-1."),
        "tg": ("Аудиометрияи тоналӣ", "Санҷиши компютерии ҳадди шунавоӣ бо садоҳои тозаи ISO 8253-1."),
        "en": ("Pure Tone Audiometry", "Pure-tone hearing threshold evaluation using ISO 8253-1."),
    },
    "speech-in-noise": {
        "ru": ("Разборчивость речи в шуме", "Определение речевого порога (SRT) на фоне акустического шума."),
        "tg": ("Фаҳмоии нутқ дар садои бегона", "Муайян кардани ҳадди фаҳмоии нутқ дар шароити серсадо."),
        "en": ("Speech-in-Noise Discrimination", "Speech reception threshold evaluation under babble noise."),
    },
    "visual-memory": {
        "ru": ("Пространственная память", "Оценка объема пространственной рабочей памяти и удержания последовательностей."),
        "tg": ("Хотираи фазоӣ", "Баҳодиҳии ҳаҷми хотираи фазоӣ ва нигоҳдории пайдарпайӣ."),
        "en": ("Spatial Working Memory", "Spatial working memory span and sequential pattern recall."),
    },
    "short-term-memory": {
        "ru": ("Кратковременная память", "Символьно-вербальная рабочая память с запоминанием числовых рядов."),
        "tg": ("Хотираи кӯтоҳмуддат", "Хотираи кӯтоҳмуддати рақамӣ бо такрори занҷири ададҳо."),
        "en": ("Short-Term Memory", "Working memory capacity through sequential digit recall."),
    },
    "attention-switching": {
        "ru": ("Переключаемость внимания", "Когнитивная гибкость и исполнительный контроль чередования 1-A-2-B."),
        "tg": ("Ивазшавии диққат", "Чаниши фикрӣ ва ивазшавии фаъолонаи диққат 1-A-2-B."),
        "en": ("Cognitive Switching", "Executive switching cost and cognitive flexibility 1-A-2-B."),
    },
    "mouse-eye-coordination": {
        "ru": ("Координация глаз-рука", "Непрерывное слежение за динамической траекторией (Time-on-Target)."),
        "tg": ("Ҳамоҳангии чашму даст", "Пайгирии мунтазами ҳадафи ҳаракаткунанда (Time-on-Target)."),
        "en": ("Eye-Hand Coordination", "Continuous dynamic target tracking (Time-on-Target %)."),
    },
    "information-processing-speed": {
        "ru": ("Скорость обработки символов", "Символьно-цифровой тест быстроты когнитивной обработки под таймером."),
        "tg": ("Суръати коркарди иттилоот", "Санҷиши суръати мувофиқати рамзҳо ва рақамҳо дар 30 сония."),
        "en": ("Symbol Digit Modalities", "Rapid symbol-digit translation under timed 30-second interval."),
    },
    "physical-wellbeing": {
        "ru": ("Соматический тонус и баланс энергии", "Многоосевой радар телесного комфорта, мышечного напряжения и дыхания."),
        "tg": ("Тонуси ҷисмонӣ ва тавозуни нерӯ", "Радари бисёрсамтаи бароҳатии бадан, мушакҳо ва нафаскашӣ."),
        "en": ("Somatic Equilibrium & Energy", "Multi-axial assessment of somatic tension, fatigue, and respiration."),
    },
    "emotional-wellbeing": {
        "ru": ("Психоэмоциональный баланс", "Двухосевая модель аффекта: Валентность настроения и уровень психомоторной энергии."),
        "tg": ("Тавозуни равонӣ-эҳсосӣ", "Модели дусамтаи эҳсосот: Ҳолати шодмонӣ/ғамгинӣ ва сатҳи бедорӣ."),
        "en": ("Affective Equilibrium", "2D affective plane: Valence and Arousal coordinates."),
    },
    "daily-activity": {
        "ru": ("Циркадианный ритм и цифровая гигиена", "Анализ 24-часового цикла, выработки мелатонина и вечерней синей подсветки."),
        "tg": ("Ритми сиркадӣ ва гигиенаи рақамӣ", "Таҳлили давраи 24-соата, хоб ва таъсири равшании экранҳо."),
        "en": ("Circadian Hygiene & Light Alignment", "24-hour photobiology, melatonin curve protection, and screen cutoff."),
    },
}

def main():
    db = SessionLocal()
    updated = 0
    for slug, locs in DESCRIPTIONS.items():
        test = db.query(TestDefinition).filter(TestDefinition.slug == slug).first()
        if not test:
            continue
        test.localizations = {
            "ru": {"title": locs["ru"][0], "description": locs["ru"][1]},
            "tg": {"title": locs["tg"][0], "description": locs["tg"][1]},
            "tj": {"title": locs["tg"][0], "description": locs["tg"][1]},
            "en": {"title": locs["en"][0], "description": locs["en"][1]},
        }
        test.guest_allowed = True
        test.availability_status = "published"
        updated += 1
    db.commit()
    print(f"Successfully updated {updated} test definitions.")

if __name__ == "__main__":
    main()
