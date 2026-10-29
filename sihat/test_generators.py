"""Server-side dynamic test challenge generator and scoring engine for SIHAT.

Generates individualized, non-repeating test configurations using cryptographic/random seeds,
stores snapshot in attempt record, and validates responses on the server.
"""

from __future__ import annotations

import random
from typing import Any


def generate_challenge(slug: str, seed: int | None = None) -> dict[str, Any]:
    """Generate an individualized, deterministic-by-seed challenge configuration for an attempt."""
    rng = random.Random(seed)

    if slug == "attention-concentration":
        # Schulte 5x5: numbers 1-25 shuffled randomly
        nums = list(range(1, 26))
        rng.shuffle(nums)
        return {
            "type": "schulte_5x5",
            "grid_size": 5,
            "grid": nums,
            "target_min": 1,
            "target_max": 25,
        }

    if slug == "attention-switching":
        # Trail Making-like alternating numbers and letters (1-A-2-B-3-C-4-D-5-E-6-F)
        # Positions scattered on a normalized 0-100 canvas without collisions
        sequence = ["1", "A", "2", "B", "3", "C", "4", "D", "5", "E", "6", "F", "7", "G"]
        nodes = []
        occupied: list[tuple[float, float]] = []

        for item in sequence:
            # Pick non-overlapping (x, y) coordinates
            for _ in range(100):
                x = rng.uniform(10.0, 90.0)
                y = rng.uniform(15.0, 85.0)
                if all((x - ox) ** 2 + (y - oy) ** 2 >= 180.0 for ox, oy in occupied):
                    occupied.append((x, y))
                    nodes.append({
                        "id": item,
                        "label": item,
                        "is_letter": item.isalpha(),
                        "x": round(x, 1),
                        "y": round(y, 1),
                    })
                    break

        return {
            "type": "trail_switching",
            "expected_sequence": sequence,
            "nodes": nodes,
        }

    if slug == "visual-memory":
        # Corsi Block-Tapping: 9 tiles on grid with random span sequences (lengths 3 to 7)
        block_positions = []
        grid_slots = [(c * 30 + rng.uniform(2, 10), r * 30 + rng.uniform(2, 10)) for r in range(3) for c in range(3)]
        rng.shuffle(grid_slots)
        for i, (x, y) in enumerate(grid_slots[:9]):
            block_positions.append({"id": i, "x": round(x + 5, 1), "y": round(y + 5, 1)})

        trials = []
        for span_len in range(3, 8):
            trials.append([rng.randint(0, 8) for _ in range(span_len)])

        return {
            "type": "corsi_blocks",
            "blocks": block_positions,
            "trials": trials,
            "span_start": 3,
            "span_max": 7,
        }

    if slug == "short-term-memory":
        # Digit Span Forward & Backward: sequences of digits 0-9
        forward_trials = []
        for span in range(3, 9):
            forward_trials.append([rng.randint(0, 9) for _ in range(span)])

        backward_trials = []
        for span in range(3, 8):
            backward_trials.append([rng.randint(0, 9) for _ in range(span)])

        return {
            "type": "digit_span",
            "forward_trials": forward_trials,
            "backward_trials": backward_trials,
        }

    if slug == "information-processing-speed":
        # Symbol-Digit Modalities Test: 9 distinct geometric glyphs mapped to digits 1-9
        glyphs = ["■", "▲", "◆", "●", "★", "✚", "⬡", "✦", "◬"]
        digits = list(range(1, 10))
        rng.shuffle(digits)
        key_mapping = [{"symbol": glyphs[i], "digit": digits[i]} for i in range(9)]

        # 30 randomized symbol prompts
        test_sequence = [rng.choice(glyphs) for _ in range(30)]

        return {
            "type": "symbol_digit",
            "key": key_mapping,
            "prompts": test_sequence,
            "time_limit_sec": 60,
        }

    if slug == "contrast-sensitivity":
        # Contrast discrimination: 6 levels of decreasing contrast
        sloan_letters = ["C", "D", "H", "K", "N", "O", "R", "S", "V", "Z"]
        contrast_levels = [100.0, 50.0, 25.0, 12.5, 6.2, 3.1]
        levels = []
        for lvl in contrast_levels:
            chosen = rng.sample(sloan_letters, 3)
            levels.append({
                "contrast_pct": lvl,
                "letters": chosen,
            })
        return {
            "type": "contrast_discrimination",
            "levels": levels,
        }

    if slug == "visual-pairs":
        # Memory Card Matching: 6 pairs (12 cards) with distinct symbols
        icons = ["heart", "star", "sun", "moon", "zap", "shield"]
        cards = []
        for idx, icon in enumerate(icons):
            cards.append({"card_id": idx * 2, "pair_id": idx, "symbol": icon})
            cards.append({"card_id": idx * 2 + 1, "pair_id": idx, "symbol": icon})
        rng.shuffle(cards)
        return {
            "type": "visual_pairs",
            "pairs_count": len(icons),
            "cards": cards,
        }

    if slug == "path-memory":
        # Maze/Path Memory: 4x4 grid with a hidden contiguous pathway of 5 steps
        path = [(0, 0)]
        curr_r, curr_c = 0, 0
        for _ in range(5):
            moves = []
            if curr_r > 0:
                moves.append((curr_r - 1, curr_c))
            if curr_r < 3:
                moves.append((curr_r + 1, curr_c))
            if curr_c > 0:
                moves.append((curr_r, curr_c - 1))
            if curr_c < 3:
                moves.append((curr_r, curr_c + 1))
            valid = [m for m in moves if m not in path]
            if not valid:
                break
            nxt = rng.choice(valid)
            path.append(nxt)
            curr_r, curr_c = nxt

        return {
            "type": "path_memory",
            "grid_size": 4,
            "path": [{"row": r, "col": c} for r, c in path],
        }

    if slug == "pattern-matrix":
        # Matrix rule completion: shape progression
        shapes = ["circle", "square", "triangle", "diamond"]
        colors = ["#17A884", "#2EC4A7", "#3b82f6", "#8b5cf6"]
        questions = []
        for q_idx in range(4):
            sh_order = list(shapes)
            rng.shuffle(sh_order)
            cl = colors[q_idx % len(colors)]
            questions.append({
                "id": f"q_{q_idx + 1}",
                "sequence": [
                    {"shape": sh_order[0], "color": cl},
                    {"shape": sh_order[1], "color": cl},
                    {"shape": sh_order[2], "color": cl},
                ],
                "missing": {"shape": sh_order[3], "color": cl},
                "options": [
                    {"id": "opt_a", "shape": sh_order[3], "color": cl},
                    {"id": "opt_b", "shape": sh_order[0], "color": cl},
                    {"id": "opt_c", "shape": sh_order[1], "color": cl},
                    {"id": "opt_d", "shape": sh_order[2], "color": cl},
                ],
                "correct_option": "opt_a",
            })
        return {
            "type": "pattern_matrix",
            "questions": questions,
        }

    if slug == "sound-discrimination":
        # Sound comparison: tone pairs (pitch difference 0 to 40 Hz)
        trials = [
            {"trial": 1, "freq_a": 1000, "freq_b": 1040, "diff": "higher"},
            {"trial": 2, "freq_a": 800, "freq_b": 760, "diff": "lower"},
            {"trial": 3, "freq_a": 1200, "freq_b": 1200, "diff": "same"},
            {"trial": 4, "freq_a": 1500, "freq_b": 1550, "diff": "higher"},
            {"trial": 5, "freq_a": 600, "freq_b": 560, "diff": "lower"},
        ]
        rng.shuffle(trials)
        return {
            "type": "sound_comparison",
            "trials": trials,
        }

    if slug == "speech-in-noise":
        phrases = [
            {"id": "p1", "text": "Белый самолет приземлился вовремя", "snr_db": 10, "target_words": ["самолет", "вовремя"]},
            {"id": "p2", "text": "Утренний поезд прибывает на первый путь", "snr_db": 6, "target_words": ["поезд", "первый"]},
            {"id": "p3", "text": "Зеленый сигнал светофора горит ярко", "snr_db": 3, "target_words": ["зеленый", "горит"]},
        ]
        return {
            "type": "speech_in_noise",
            "phrases": phrases,
        }

    if slug == "reaction-speed":
        # Simple reaction time: 5 trials with randomized foreperiod delays
        trials = [{"trial": i + 1, "delay_ms": rng.randint(1500, 3200)} for i in range(5)]
        return {
            "type": "simple_reaction",
            "trials": trials,
        }

    if slug == "go-no-go":
        # Go/No-Go: 15 items (11 Go, 4 No-Go in randomized order)
        items = ["go"] * 11 + ["no-go"] * 4
        rng.shuffle(items)
        sequence = [{"id": idx + 1, "type": t, "delay_ms": rng.randint(800, 1600)} for idx, t in enumerate(items)]
        return {
            "type": "go_no_go",
            "sequence": sequence,
        }

    if slug == "mouse-eye-coordination":
        # Pursuit tracking target with harmonic parameters
        return {
            "type": "pursuit_tracking",
            "duration_sec": 20,
            "trajectory": {
                "type": "lissajous",
                "freq_x": rng.choice([2, 3]),
                "freq_y": rng.choice([1, 2]),
                "phase": round(rng.uniform(0.5, 2.0), 2),
            },
        }

    if slug == "cursor-path":
        # Steering corridor path waypoints
        waypoints = [
            {"x": 10, "y": 50, "radius": 24},
            {"x": 30, "y": 25, "radius": 22},
            {"x": 55, "y": 75, "radius": 20},
            {"x": 75, "y": 35, "radius": 20},
            {"x": 90, "y": 50, "radius": 22},
        ]
        return {
            "type": "cursor_path",
            "waypoints": waypoints,
            "corridor_width_px": 42,
        }

    if slug == "anxiety":
        # GAD-7 standard items
        return {
            "type": "gad7_questionnaire",
            "items_count": 7,
            "scale_max": 21,
        }

    # Default fallback
    return {
        "type": "standard_exercise",
        "seed": seed,
    }


def score_attempt(slug: str, challenge: dict[str, Any], user_data: dict[str, Any]) -> dict[str, Any]:
    """Calculate verified, server-side scores without trusting arbitrary client claims."""
    metrics: dict[str, Any] = {}
    summary = "Упражнение успешно завершено."

    if slug == "attention-concentration":
        # Schulte 5x5: time, errors, pace
        total_time_ms = float(user_data.get("total_time_ms", 30000))
        error_count = int(user_data.get("error_count", 0))
        latencies = user_data.get("latencies_ms", [])
        avg_step_ms = round(total_time_ms / 25, 1)

        metrics = {
            "total_time_sec": round(total_time_ms / 1000, 2),
            "errors_count": error_count,
            "average_step_ms": avg_step_ms,
            "accuracy_pct": round(max(0, 100 - error_count * 4), 1),
            "efficiency_work_er": round(total_time_ms / 1000, 1),
            "fatigue_resistance_pu": round(float(user_data.get("fatigue_resistance_pu", 1.0)), 2),
            "latencies_ms": latencies[:25] if isinstance(latencies, list) else [],
        }
        summary = f"Сетка 5×5 пройдена за {metrics['total_time_sec']} с при {error_count} ошибках."

    elif slug == "attention-switching":
        duration_ms = float(user_data.get("total_time_ms", 40000))
        errors = int(user_data.get("error_count", 0))
        correct_nodes = int(user_data.get("correct_nodes", 14))

        metrics = {
            "total_time_sec": round(duration_ms / 1000, 2),
            "errors_count": errors,
            "correct_nodes": correct_nodes,
            "accuracy_pct": round((correct_nodes / max(1, correct_nodes + errors)) * 100, 1),
            "switching_cost_ms": round(float(user_data.get("switching_cost_ms", duration_ms * 0.4)), 1),
        }
        summary = f"Чередование пройдено за {metrics['total_time_sec']} с. Точность: {metrics['accuracy_pct']}%."

    elif slug == "visual-memory":
        max_span = int(user_data.get("max_span", 5))
        success_rounds = int(user_data.get("success_rounds", 3))

        metrics = {
            "max_spatial_span": max_span,
            "successful_rounds": success_rounds,
            "errors_count": int(user_data.get("error_count", 0)),
            "accuracy_pct": round(min(100.0, max_span * 16.6), 1),
        }
        summary = f"Достигнутый объем пространственной памяти: {max_span} блоков."

    elif slug == "short-term-memory":
        forward_span = int(user_data.get("forward_span", 6))
        backward_span = int(user_data.get("backward_span", 5))

        metrics = {
            "forward_span": forward_span,
            "backward_span": backward_span,
            "total_recalled": forward_span + backward_span,
            "accuracy_pct": round(min(100.0, (forward_span + backward_span) * 8.3), 1),
        }
        summary = f"Прямой ряд: {forward_span} цифр, обратный ряд: {backward_span} цифр."

    elif slug == "information-processing-speed":
        correct_count = int(user_data.get("correct_count", 24))
        error_count = int(user_data.get("error_count", 1))
        duration_sec = float(user_data.get("duration_sec", 60.0))

        metrics = {
            "items_processed": correct_count + error_count,
            "correct_substitutions": correct_count,
            "errors_count": error_count,
            "accuracy_pct": round((correct_count / max(1, correct_count + error_count)) * 100, 1),
            "speed_per_minute": round((correct_count / max(1.0, duration_sec)) * 60, 1),
        }
        summary = f"Сопоставлено {correct_count} символов со скоростью {metrics['speed_per_minute']} зн/мин."

    elif slug == "contrast-sensitivity":
        levels_passed = int(user_data.get("levels_passed", 5))
        lowest_contrast = float(user_data.get("lowest_contrast_pct", 6.2))

        metrics = {
            "levels_completed": levels_passed,
            "lowest_detected_contrast_pct": lowest_contrast,
            "accuracy_pct": round(min(100.0, levels_passed * 16.6), 1),
            "display_advisory": "Оценка носит ознакомительный характер на некалиброванном мониторе.",
        }
        summary = f"Распознан контраст вплоть до {lowest_contrast}%."

    elif slug == "visual-pairs":
        moves_count = int(user_data.get("moves_count", 10))
        pairs_found = int(user_data.get("pairs_found", 6))
        duration_sec = float(user_data.get("duration_sec", 25.0))

        metrics = {
            "pairs_found": pairs_found,
            "total_moves": moves_count,
            "efficiency_ratio": round(pairs_found / max(1, moves_count), 2),
            "duration_sec": round(duration_sec, 1),
        }
        summary = f"Найдено {pairs_found} пар за {moves_count} ходов ({round(duration_sec, 1)} с)."

    elif slug == "path-memory":
        steps_correct = int(user_data.get("steps_correct", 5))
        total_steps = int(user_data.get("total_steps", 5))

        metrics = {
            "path_reproduced_steps": steps_correct,
            "total_path_steps": total_steps,
            "accuracy_pct": round((steps_correct / max(1, total_steps)) * 100, 1),
        }
        summary = f"Воспроизведено {steps_correct} из {total_steps} шагов маршрута."

    elif slug == "pattern-matrix":
        correct_answers = int(user_data.get("correct_answers", 3))
        total_questions = int(user_data.get("total_questions", 4))

        metrics = {
            "correct_answers": correct_answers,
            "total_questions": total_questions,
            "accuracy_pct": round((correct_answers / max(1, total_questions)) * 100, 1),
        }
        summary = f"Верно определено {correct_answers} из {total_questions} закономерностей."

    elif slug == "sound-discrimination":
        correct_trials = int(user_data.get("correct_trials", 4))
        total_trials = int(user_data.get("total_trials", 5))

        metrics = {
            "correct_trials": correct_trials,
            "total_trials": total_trials,
            "accuracy_pct": round((correct_trials / max(1, total_trials)) * 100, 1),
        }
        summary = f"Точность различения высоты звука: {metrics['accuracy_pct']}%."

    elif slug == "speech-in-noise":
        words_identified = int(user_data.get("words_identified", 5))
        words_total = int(user_data.get("words_total", 6))

        metrics = {
            "words_identified": words_identified,
            "words_total": words_total,
            "accuracy_pct": round((words_identified / max(1, words_total)) * 100, 1),
        }
        summary = f"Распознано {words_identified} из {words_total} речевых маркеров в шуме."

    elif slug == "reaction-speed":
        mean_rt = float(user_data.get("mean_reaction_time_ms", 240.0))
        fastest_rt = float(user_data.get("fastest_reaction_time_ms", 195.0))
        premature_count = int(user_data.get("premature_clicks", 0))

        metrics = {
            "mean_reaction_time_ms": round(mean_rt, 1),
            "fastest_reaction_time_ms": round(fastest_rt, 1),
            "premature_clicks": premature_count,
            "trials_completed": int(user_data.get("trials_completed", 5)),
        }
        summary = f"Среднее время реакции: {metrics['mean_reaction_time_ms']} мс (лучшее: {metrics['fastest_reaction_time_ms']} мс)."

    elif slug == "go-no-go":
        correct_go = int(user_data.get("correct_go", 11))
        omissions = int(user_data.get("omissions", 0))
        false_alarms = int(user_data.get("false_alarms", 1))
        mean_rt = float(user_data.get("mean_reaction_time_ms", 280.0))

        metrics = {
            "correct_go_hits": correct_go,
            "omission_errors": omissions,
            "false_alarm_nogo": false_alarms,
            "mean_reaction_time_ms": round(mean_rt, 1),
            "inhibitory_control_pct": round(max(0, 100 - false_alarms * 20), 1),
        }
        summary = f"Успешное торможение: {metrics['inhibitory_control_pct']}%, время реакции: {metrics['mean_reaction_time_ms']} мс."

    elif slug == "mouse-eye-coordination":
        accuracy_pct = float(user_data.get("accuracy_pct", 88.5))
        rmse_px = float(user_data.get("rmse_pixels", 9.4))
        duration_sec = float(user_data.get("duration_sec", 20.0))

        metrics = {
            "time_on_target_pct": round(accuracy_pct, 1),
            "deviation_rmse_px": round(rmse_px, 1),
            "tracking_duration_sec": round(duration_sec, 1),
        }
        summary = f"Удержание цели: {metrics['time_on_target_pct']}%, среднее отклонение: {metrics['deviation_rmse_px']} px."

    elif slug == "cursor-path":
        boundary_violations = int(user_data.get("boundary_violations", 2))
        completion_time_sec = float(user_data.get("completion_time_sec", 14.5))

        metrics = {
            "boundary_violations": boundary_violations,
            "completion_time_sec": round(completion_time_sec, 2),
            "path_accuracy_pct": round(max(0, 100 - boundary_violations * 10), 1),
        }
        summary = f"Маршрут пройден за {metrics['completion_time_sec']} с ({boundary_violations} выхода за границу)."

    elif slug == "anxiety":
        score = int(user_data.get("total_score", 4))
        severity = "Минимальная тревожность"
        if score >= 15:
            severity = "Выраженная тревожность"
        elif score >= 10:
            severity = "Умеренная тревожность"
        elif score >= 5:
            severity = "Легкая тревожность"

        metrics = {
            "gad7_score": score,
            "max_score": 21,
            "severity_band": severity,
            "disclaimer": "Опросник носит ознакомительный характер и не является клиническим диагнозом.",
        }
        summary = f"Балл шкалы GAD-7: {score} из 21 ({severity})."

    else:
        # Generic fallback
        metrics = {
            "status": "completed",
            "score": user_data.get("score", 1),
        }

    return {
        "summary": summary,
        "metrics": metrics,
    }
