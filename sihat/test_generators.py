"""Server-side task generator and scoring engine for SIHAT interactive exercises.

Every attempt receives a freshly generated task variant.  The full task (including data
that must not be shown to the browser) is stored in the attempt snapshot as
``{"seed", "public", "private"}``.  Only ``public`` is sent to the client.  When an attempt
is completed, the browser sends an *event log* (clicks, taps, answers, cursor samples) and
the server replays that log against the stored task.  Nothing the browser claims about its
own score is trusted: results are recomputed here.

The exercises are educational self-observation tools.  No clinical norms, cut-offs or
diagnostic bands are produced; results are meant to be compared with the user's own
previous attempts.
"""

from __future__ import annotations

import math
import random
import secrets
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

RESULT_VERSION = 2


class TelemetryError(ValueError):
    """Raised when a submitted event log is missing, malformed or impossible."""


# --------------------------------------------------------------------------- helpers


def _num(value: Any, name: str, lo: float, hi: float) -> float:
    if isinstance(value, bool) or not isinstance(value, int | float):
        raise TelemetryError(f"{name} must be a number")
    if not math.isfinite(value) or not lo <= value <= hi:
        raise TelemetryError(f"{name} is out of range")
    return float(value)


def _list(value: Any, name: str, max_len: int, min_len: int = 0) -> list[Any]:
    if not isinstance(value, list):
        raise TelemetryError(f"{name} must be a list")
    if len(value) > max_len or len(value) < min_len:
        raise TelemetryError(f"{name} has an invalid length")
    return value


def _obj(value: Any, name: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise TelemetryError(f"{name} must be an object")
    return value


def _by_id(value: Any, name: str, max_len: int, min_len: int = 1) -> dict[Any, dict[str, Any]]:
    return {_obj(r, name).get("id"): _obj(r, name) for r in _list(value, name, max_len, min_len)}


def _pct(part: float, whole: float) -> float:
    return round(100.0 * part / whole, 1) if whole else 0.0


def _mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _sd(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    m = _mean(values)
    return math.sqrt(sum((v - m) ** 2 for v in values) / (len(values) - 1))


def _median(values: list[float]) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    mid = len(ordered) // 2
    return ordered[mid] if len(ordered) % 2 else (ordered[mid - 1] + ordered[mid]) / 2


def _downsample(items: list[Any], limit: int) -> list[Any]:
    if len(items) <= limit:
        return items
    step = len(items) / limit
    return [items[int(i * step)] for i in range(limit)]


def _no_adjacent_repeats(rng: random.Random, length: int, pool: list[int]) -> list[int]:
    out: list[int] = []
    while len(out) < length:
        candidate = rng.choice(pool)
        if not out or candidate != out[-1]:
            out.append(candidate)
    return out


def _seg_dist(px: float, py: float, ax: float, ay: float, bx: float, by: float) -> float:
    dx, dy = bx - ax, by - ay
    length_sq = dx * dx + dy * dy
    if length_sq == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / length_sq))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def _polyline_distance(px: float, py: float, poly: list[dict[str, float]], aspect: float) -> float:
    best = math.inf
    for a, b in zip(poly, poly[1:], strict=False):
        best = min(
            best,
            _seg_dist(px * aspect, py, a["x"] * aspect, a["y"], b["x"] * aspect, b["y"]),
        )
    return best


def _samples(tel: dict[str, Any], duration_ms: float) -> list[tuple[float, float, float]]:
    raw = _list(tel.get("samples"), "samples", 9000, 1)
    out: list[tuple[float, float, float]] = []
    last_t = -1.0
    for item in raw:
        row = _obj(item, "sample")
        t = _num(row.get("t"), "t", 0, duration_ms + 5000)
        x = _num(row.get("x"), "x", -0.2, 1.2)
        y = _num(row.get("y"), "y", -0.2, 1.2)
        if t < last_t:
            raise TelemetryError("samples must be ordered in time")
        last_t = t
        out.append((t, x, y))
    return out


# --------------------------------------------------------------------------- Schulte


def _gen_schulte(rng: random.Random) -> tuple[dict, dict]:
    grid = list(range(1, 26))
    rng.shuffle(grid)
    return {"type": "schulte", "size": 5, "grid": grid}, {}


def _score_schulte(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    clicks = _list(tel.get("clicks"), "clicks", 600, 25)
    expected, errors, last_t = 1, 0, 0.0
    splits: list[float] = []
    prev = -1.0
    for item in clicks:
        row = _obj(item, "click")
        value = int(_num(row.get("v"), "v", 1, 25))
        t = _num(row.get("t"), "t", 0, 900_000)
        if t < prev:
            raise TelemetryError("clicks must be ordered in time")
        prev = t
        if value == expected:
            splits.append(round(t - last_t))
            last_t = t
            expected += 1
            if expected > 25:
                break
        else:
            errors += 1
    if expected <= 25:
        raise TelemetryError("The grid was not completed")
    if last_t < 4000:
        raise TelemetryError("Result is implausibly fast")
    metrics = {
        "total_time_sec": round(last_t / 1000, 2),
        "errors_count": errors,
        "average_step_ms": round(last_t / 25),
        "accuracy_pct": _pct(25, 25 + errors),
        "first_half_sec": round(sum(splits[:12]) / 1000, 2),
        "second_half_sec": round(sum(splits[13:]) / 1000, 2),
    }
    return metrics, {"step_times_ms": splits}


# --------------------------------------------------------------------------- Trail switching

_TRAIL_A = [str(n) for n in range(1, 9)]
_TRAIL_B = ["1", "A", "2", "B", "3", "C", "4", "D"]


def _trail_nodes(rng: random.Random, labels: list[str]) -> list[dict]:
    nodes: list[dict] = []
    min_dist = 19.0
    for label in labels:
        placed = False
        for attempt in range(400):
            d = min_dist if attempt < 300 else min_dist * 0.7
            x, y = rng.uniform(10, 90), rng.uniform(14, 86)
            if all(math.hypot(x - n["x"], y - n["y"]) >= d for n in nodes):
                nodes.append({"id": label, "x": round(x, 1), "y": round(y, 1)})
                placed = True
                break
        if not placed:
            nodes.append({"id": label, "x": round(rng.uniform(10, 90), 1), "y": 50.0})
    rng.shuffle(nodes)
    return nodes


def _gen_trail(rng: random.Random) -> tuple[dict, dict]:
    parts = [
        {"id": "A", "sequence": _TRAIL_A, "nodes": _trail_nodes(rng, _TRAIL_A)},
        {"id": "B", "sequence": _TRAIL_B, "nodes": _trail_nodes(rng, _TRAIL_B)},
    ]
    return {"type": "trail", "parts": parts}, {}


def _replay_trail(clicks: list[Any], sequence: list[str]) -> tuple[float, int, list[float]]:
    idx, errors, last_t, prev = 0, 0, 0.0, -1.0
    splits: list[float] = []
    for item in clicks:
        row = _obj(item, "click")
        node = row.get("id")
        t = _num(row.get("t"), "t", 0, 900_000)
        if t < prev:
            raise TelemetryError("clicks must be ordered in time")
        prev = t
        if node == sequence[idx]:
            splits.append(round(t - last_t))
            last_t = t
            idx += 1
            if idx == len(sequence):
                return last_t, errors, splits
        else:
            errors += 1
    raise TelemetryError("The trail was not completed")


def _score_trail(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    parts = _obj(tel.get("parts"), "parts")
    out: dict[str, tuple[float, int, list[float]]] = {}
    for part in public["parts"]:
        data = _obj(parts.get(part["id"]), f"part {part['id']}")
        out[part["id"]] = _replay_trail(
            _list(data.get("clicks"), "clicks", 300, len(part["sequence"])), part["sequence"]
        )
    a_ms, a_err, a_steps = out["A"]
    b_ms, b_err, b_steps = out["B"]
    if a_ms < 1500 or b_ms < 1500:
        raise TelemetryError("Result is implausibly fast")
    metrics = {
        "part_a_sec": round(a_ms / 1000, 2),
        "part_b_sec": round(b_ms / 1000, 2),
        "switching_cost_sec": round((b_ms - a_ms) / 1000, 2),
        "errors_a": a_err,
        "errors_b": b_err,
        "errors_count": a_err + b_err,
        "accuracy_pct": _pct(16, 16 + a_err + b_err),
    }
    return metrics, {"step_times_a_ms": a_steps, "step_times_b_ms": b_steps}


# --------------------------------------------------------------------------- Corsi blocks


def _gen_corsi(rng: random.Random) -> tuple[dict, dict]:
    blocks = []
    for idx in range(9):
        c, r = idx % 3, idx // 3
        blocks.append(
            {
                "id": idx,
                "x": round(16 + c * 34 + rng.uniform(-6, 6), 1),
                "y": round(16 + r * 34 + rng.uniform(-6, 6), 1),
            }
        )
    trials = []
    for length in range(3, 10):
        for n in (1, 2):
            sequence = _no_adjacent_repeats(rng, length, list(range(9)))
            trials.append({"id": f"{length}-{n}", "length": length, "sequence": sequence})
    return {"type": "corsi", "blocks": blocks, "trials": trials}, {}


def _score_corsi(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    responses = _by_id(tel.get("responses"), "response", 40)
    by_length: dict[int, list[bool]] = {}
    attempted = passed = 0
    for trial in public["trials"]:
        length = trial["length"]
        results = by_length.setdefault(length, [])
        if not results and by_length.get(length - 1) and not any(by_length[length - 1]):
            break
        response = responses.get(trial["id"])
        if response is None:
            break
        taps = _list(response.get("taps"), "taps", 30)
        ok = [t for t in taps if isinstance(t, int)] == trial["sequence"]
        results.append(ok)
        attempted += 1
        passed += int(ok)
    if attempted == 0:
        raise TelemetryError("No trials were recorded")
    max_span = max((length for length, res in by_length.items() if any(res)), default=0)
    series = [
        {"length": length, "passed": sum(res), "of": len(res)}
        for length, res in sorted(by_length.items())
        if res
    ]
    metrics = {
        "max_span": max_span,
        "trials_passed": passed,
        "trials_attempted": attempted,
        "accuracy_pct": _pct(passed, attempted),
    }
    return metrics, {"by_length": series}


# --------------------------------------------------------------------------- Digit span


def _gen_digit_span(rng: random.Random) -> tuple[dict, dict]:
    def trials(prefix: str, lengths: range) -> list[dict]:
        out = []
        for length in lengths:
            for n in (1, 2):
                digits = _no_adjacent_repeats(rng, length, list(range(1, 10)))
                out.append({"id": f"{prefix}{length}-{n}", "length": length, "digits": digits})
        return out

    return {
        "type": "digit_span",
        "forward": trials("f", range(3, 10)),
        "backward": trials("b", range(2, 9)),
    }, {}


def _score_span_mode(
    trials: list[dict], responses: dict, reverse: bool
) -> tuple[int, int, int, list]:
    by_length: dict[int, list[bool]] = {}
    attempted = passed = 0
    for trial in trials:
        length = trial["length"]
        results = by_length.setdefault(length, [])
        if not results and by_length.get(length - 1) and not any(by_length[length - 1]):
            break
        response = responses.get(trial["id"])
        if response is None:
            break
        answer = [d for d in _list(response.get("answer"), "answer", 20) if isinstance(d, int)]
        expected = list(reversed(trial["digits"])) if reverse else trial["digits"]
        ok = answer == expected
        results.append(ok)
        attempted += 1
        passed += int(ok)
    span = max((length for length, res in by_length.items() if any(res)), default=0)
    series = [
        {"length": length, "passed": sum(res), "of": len(res)}
        for length, res in sorted(by_length.items())
        if res
    ]
    return span, attempted, passed, series


def _score_digit_span(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    responses = _by_id(tel.get("responses"), "response", 60)
    f_span, f_att, f_ok, f_series = _score_span_mode(public["forward"], responses, False)
    b_span, b_att, b_ok, b_series = _score_span_mode(public["backward"], responses, True)
    if f_att + b_att == 0:
        raise TelemetryError("No trials were recorded")
    metrics = {
        "forward_span": f_span,
        "backward_span": b_span,
        "trials_passed": f_ok + b_ok,
        "trials_attempted": f_att + b_att,
        "accuracy_pct": _pct(f_ok + b_ok, f_att + b_att),
    }
    return metrics, {"forward": f_series, "backward": b_series}


# --------------------------------------------------------------------------- Symbol-digit

_SYMBOLS = ["circle", "square", "triangle", "diamond", "cross", "star", "hexagon", "bars", "ring"]
_SD_LIMIT_SEC = 90


def _gen_symbol_digit(rng: random.Random) -> tuple[dict, dict]:
    digits = list(range(1, 10))
    rng.shuffle(digits)
    key = [{"symbol": s, "digit": d} for s, d in zip(_SYMBOLS, digits, strict=True)]
    prompts = _no_adjacent_repeats(rng, 140, list(range(9)))
    return {
        "type": "symbol_digit",
        "key": key,
        "prompts": [_SYMBOLS[i] for i in prompts],
        "time_limit_sec": _SD_LIMIT_SEC,
    }, {}


def _score_symbol_digit(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    mapping = {k["symbol"]: k["digit"] for k in public["key"]}
    limit_ms = public["time_limit_sec"] * 1000
    responses = _list(tel.get("responses"), "responses", 400, 5)
    correct = errors = 0
    bins = [0] * 6
    prev_t = -1.0
    for index, item in enumerate(responses):
        if index >= len(public["prompts"]):
            break
        row = _obj(item, "response")
        if int(_num(row.get("i"), "i", 0, 10_000)) != index:
            raise TelemetryError("responses must be sequential")
        t = _num(row.get("t"), "t", 0, limit_ms + 5000)
        if t < prev_t:
            raise TelemetryError("responses must be ordered in time")
        prev_t = t
        if t > limit_ms + 500:
            break
        digit = int(_num(row.get("d"), "d", 0, 9))
        if digit == mapping[public["prompts"][index]]:
            correct += 1
            bins[min(5, int(t // 15000))] += 1
        else:
            errors += 1
    attempted = correct + errors
    metrics = {
        "correct_count": correct,
        "errors_count": errors,
        "items_attempted": attempted,
        "accuracy_pct": _pct(correct, attempted),
        "speed_per_minute": round(correct * 60 / public["time_limit_sec"], 1),
    }
    return metrics, {"correct_per_15s": bins}


# --------------------------------------------------------------------------- Contrast

_CONTRAST_LEVELS = [60.0, 40.0, 28.0, 20.0, 14.0, 10.0, 7.0, 5.0, 3.5, 2.5]


def _gen_contrast(rng: random.Random) -> tuple[dict, dict]:
    trials = []
    for level in _CONTRAST_LEVELS:
        for n in (1, 2):
            trials.append(
                {
                    "id": f"{level}-{n}",
                    "contrast_pct": level,
                    "tilt": rng.choice(["left", "right"]),
                    "phase": round(rng.uniform(0, 6.28), 2),
                }
            )
    return {"type": "contrast", "trials": trials}, {}


def _score_contrast(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    responses = _by_id(tel.get("responses"), "response", 40, 2)
    per_level: dict[float, list[bool]] = {}
    attempted = correct = 0
    for trial in public["trials"]:
        level = trial["contrast_pct"]
        results = per_level.setdefault(level, [])
        index = _CONTRAST_LEVELS.index(level)
        if index > 0:
            previous = per_level.get(_CONTRAST_LEVELS[index - 1], [])
            if len(previous) == 2 and not any(previous):
                break
        response = responses.get(trial["id"])
        if response is None:
            break
        ok = response.get("answer") == trial["tilt"]
        results.append(ok)
        attempted += 1
        correct += int(ok)
    if attempted == 0:
        raise TelemetryError("No trials were recorded")
    reliable = [lvl for lvl, res in per_level.items() if len(res) == 2 and all(res)]
    metrics = {
        "threshold_contrast_pct": min(reliable) if reliable else None,
        "levels_passed": len(reliable),
        "trials_correct": correct,
        "trials_attempted": attempted,
        "accuracy_pct": _pct(correct, attempted),
    }
    series = [
        {"contrast_pct": lvl, "correct": sum(res), "of": len(res)}
        for lvl, res in per_level.items()
        if res
    ]
    return metrics, {"by_level": series}


# --------------------------------------------------------------------------- Visual pairs

_ICONS = [
    "heart", "star", "sun", "moon", "zap", "shield", "leaf", "cloud",
    "flame", "anchor", "bell", "key", "flag", "music", "droplet", "gem",
    "crown", "rocket", "compass", "trophy", "palette", "camera", "gift", "coffee",
    "fish", "bird", "cat", "dog", "bug", "flower", "rainbow", "sparkles",
    "globe", "mountain", "trees", "apple", "feather", "smile", "umbrella",
]  # fmt: skip


def _gen_visual_pairs(rng: random.Random) -> tuple[dict, dict]:
    chosen = rng.sample(_ICONS, 6)
    symbols = chosen * 2
    rng.shuffle(symbols)
    return {
        "type": "visual_pairs",
        "cards": [{"id": i, "symbol": s} for i, s in enumerate(symbols)],
    }, {}


def _score_visual_pairs(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    symbols = {c["id"]: c["symbol"] for c in public["cards"]}
    flips = _list(tel.get("flips"), "flips", 600, 12)
    matched: set[int] = set()
    pending: int | None = None
    moves = mismatches = 0
    outcomes: list[bool] = []
    last_t, prev = 0.0, -1.0
    for item in flips:
        row = _obj(item, "flip")
        card = int(_num(row.get("card"), "card", 0, 11))
        t = _num(row.get("t"), "t", 0, 1_800_000)
        if t < prev:
            raise TelemetryError("flips must be ordered in time")
        prev = t
        if card in matched or card == pending:
            continue
        if pending is None:
            pending = card
            continue
        moves += 1
        if symbols[pending] == symbols[card]:
            matched.update({pending, card})
            outcomes.append(True)
        else:
            mismatches += 1
            outcomes.append(False)
        pending = None
        last_t = t
        if len(matched) == len(symbols):
            break
    if len(matched) != len(symbols):
        raise TelemetryError("Not all pairs were found")
    metrics = {
        "moves_count": moves,
        "mismatches_count": mismatches,
        "time_sec": round(last_t / 1000, 1),
        "efficiency_pct": _pct(6, moves),
    }
    return metrics, {"move_outcomes": outcomes}


# --------------------------------------------------------------------------- Path memory


def _gen_path_memory(rng: random.Random) -> tuple[dict, dict]:
    size = 4
    trials = []
    for number, steps in enumerate((4, 5, 6), start=1):
        while True:
            r, c = rng.randrange(size), rng.randrange(size)
            path = [(r, c)]
            while len(path) < steps:
                options = [
                    (r + dr, c + dc)
                    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1))
                    if 0 <= r + dr < size and 0 <= c + dc < size and (r + dr, c + dc) not in path
                ]
                if not options:
                    break
                r, c = rng.choice(options)
                path.append((r, c))
            if len(path) == steps:
                break
        trials.append({"id": f"p{number}", "path": [{"r": a, "c": b} for a, b in path]})
    return {"type": "path_memory", "size": size, "trials": trials}, {}


def _score_path_memory(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    responses = _by_id(tel.get("responses"), "response", 10)
    trials_ok = steps_ok = steps_total = longest = 0
    series = []
    for trial in public["trials"]:
        response = responses.get(trial["id"])
        if response is None:
            raise TelemetryError("Every route must be answered")
        taps = _list(response.get("taps"), "taps", 30)
        expected = trial["path"]
        matches = 0
        for tap, target in zip(taps, expected, strict=False):
            row = _obj(tap, "tap")
            if row.get("r") == target["r"] and row.get("c") == target["c"]:
                matches += 1
        full = matches == len(expected) and len(taps) == len(expected)
        trials_ok += int(full)
        steps_ok += matches
        steps_total += len(expected)
        if full:
            longest = max(longest, len(expected))
        series.append({"length": len(expected), "correct_steps": matches, "full": full})
    metrics = {
        "routes_correct": trials_ok,
        "routes_total": len(public["trials"]),
        "steps_correct": steps_ok,
        "steps_total": steps_total,
        "longest_route": longest,
        "accuracy_pct": _pct(steps_ok, steps_total),
    }
    return metrics, {"by_route": series}


# --------------------------------------------------------------------------- Pattern sequence

_SHAPES = ["circle", "square", "triangle", "diamond", "hexagon"]
_FILLS = ["#17A884", "#3B82F6", "#8B5CF6", "#F59E0B"]


def _stim(**kw: Any) -> dict:
    base = {
        "shape": "circle",
        "rotation": 0,
        "count": 1,
        "fill": "#17A884",
        "size": 1.0,
        "solid": True,
    }
    base.update(kw)
    return base


def _pattern_cycle(rng: random.Random) -> tuple[list, list, dict, str]:
    a, b, c, d = rng.sample(_SHAPES, 4)
    fill = rng.choice(_FILLS)
    seq = [_stim(shape=s, fill=fill) for s in (a, b, c, a, b)]
    correct = _stim(shape=c, fill=fill)
    wrong = [_stim(shape=a, fill=fill), _stim(shape=b, fill=fill), _stim(shape=d, fill=fill)]
    return seq, wrong, correct, "cycle"


def _pattern_rotation(rng: random.Random) -> tuple[list, list, dict, str]:
    step = rng.choice([45, 90, -45, -90])
    start = rng.choice(range(0, 360, 45))
    fill = rng.choice(_FILLS)

    def rot(k: int) -> int:
        return (start + k * step) % 360

    seq = [_stim(shape="triangle", rotation=rot(k), fill=fill) for k in range(5)]
    correct = _stim(shape="triangle", rotation=rot(5), fill=fill)
    taken = {rot(5)}
    wrong: list[dict] = []
    for candidate in (rot(4), rot(6), rot(5) + 45, rot(5) - 45, rot(3), rot(7)):
        cand = candidate % 360
        if cand not in taken:
            taken.add(cand)
            wrong.append(_stim(shape="triangle", rotation=cand, fill=fill))
        if len(wrong) == 3:
            break
    return seq, wrong, correct, "rotation"


def _pattern_count(rng: random.Random) -> tuple[list, list, dict, str]:
    step = rng.choice([1, 2])
    start = rng.choice([1, 2])
    fill = rng.choice(_FILLS)
    seq = [_stim(count=start + k * step, fill=fill) for k in range(5)]
    answer = start + 5 * step
    correct = _stim(count=answer, fill=fill)
    wrong_counts: list[int] = []
    for n in (answer - 1, answer + 1, answer - step, answer + step + 1, answer + 2):
        if n >= 1 and n != answer and n not in wrong_counts:
            wrong_counts.append(n)
    return seq, [_stim(count=n, fill=fill) for n in wrong_counts[:3]], correct, "count"


def _pattern_alternate(rng: random.Random) -> tuple[list, list, dict, str]:
    shape = rng.choice(_SHAPES)
    other = rng.choice([s for s in _SHAPES if s != shape])
    fill_a, fill_b = rng.sample(_FILLS, 2)
    one = _stim(shape=shape, fill=fill_a, size=1.0, solid=True)
    two = _stim(shape=shape, fill=fill_b, size=0.62, solid=False)
    seq = [one, two, one, two, one]
    wrong = [
        one,
        _stim(shape=shape, fill=fill_b, size=1.0, solid=False),
        _stim(shape=other, fill=fill_b, size=0.62, solid=False),
    ]
    return seq, wrong, two, "alternate"


_PATTERN_FAMILIES = [_pattern_cycle, _pattern_rotation, _pattern_count, _pattern_alternate]


def _gen_pattern(rng: random.Random) -> tuple[dict, dict]:
    order = _PATTERN_FAMILIES + rng.sample(_PATTERN_FAMILIES, 2)
    rng.shuffle(order)
    items, correct_map, rules = [], {}, {}
    for number, family in enumerate(order, start=1):
        seq, wrong, correct, rule = family(rng)
        options = [{"id": "x", "stim": correct}] + [
            {"id": f"w{i}", "stim": w} for i, w in enumerate(wrong)
        ]
        rng.shuffle(options)
        for i, option in enumerate(options):
            if option["id"] == "x":
                correct_map[f"i{number}"] = f"o{i}"
            option["id"] = f"o{i}"
        items.append({"id": f"i{number}", "sequence": seq, "options": options})
        rules[f"i{number}"] = rule
    return {"type": "pattern", "items": items}, {"correct": correct_map, "rules": rules}


def _score_pattern(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    answers = _by_id(tel.get("answers"), "answer", 20)
    correct = 0
    per_rule: dict[str, list[int]] = {}
    times: list[float] = []
    for item in public["items"]:
        answer = answers.get(item["id"])
        if answer is None:
            raise TelemetryError("Every item must be answered")
        ok = answer.get("option") == private["correct"][item["id"]]
        correct += int(ok)
        bucket = per_rule.setdefault(private["rules"][item["id"]], [0, 0])
        bucket[0] += int(ok)
        bucket[1] += 1
        t = answer.get("t")
        if isinstance(t, int | float) and not isinstance(t, bool) and 0 <= t <= 600_000:
            times.append(round(t / 1000, 1))
    total = len(public["items"])
    metrics = {
        "correct_count": correct,
        "total_items": total,
        "errors_count": total - correct,
        "accuracy_pct": _pct(correct, total),
        "mean_item_sec": round(_mean(times), 1) if times else None,
    }
    series = {
        "by_rule": [{"rule": r, "correct": v[0], "of": v[1]} for r, v in per_rule.items()],
        "item_times_sec": times,
    }
    return metrics, series


# --------------------------------------------------------------------------- Sound comparison

_DELTAS_PCT = [9.0, 6.0, 4.0, 2.8, 1.8, 1.2]


def _gen_sound_compare(rng: random.Random) -> tuple[dict, dict]:
    trials, answers = [], {}
    specs: list[tuple[float, str]] = []
    for delta in _DELTAS_PCT:
        specs.append((delta, "higher"))
        specs.append((delta, "lower"))
    specs += [(0.0, "same"), (0.0, "same")]
    rng.shuffle(specs)
    for number, (delta, kind) in enumerate(specs, start=1):
        base = rng.randrange(500, 1600, 10)
        second = base
        if kind == "higher":
            second = round(base * (1 + delta / 100))
        elif kind == "lower":
            second = round(base * (1 - delta / 100))
        swap = kind != "same" and rng.random() < 0.5
        first_tone, second_tone = (second, base) if swap else (base, second)
        truth = kind
        if swap:
            truth = "lower" if kind == "higher" else "higher"
        tid = f"s{number}"
        trials.append(
            {"id": tid, "freq_a": first_tone, "freq_b": second_tone, "tone_ms": 650, "gap_ms": 450}
        )
        answers[tid] = {"answer": truth, "delta": delta}
    return {"type": "sound_compare", "trials": trials}, {"answers": answers}


def _score_sound_compare(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    given = {k: v.get("answer") for k, v in _by_id(tel.get("answers"), "answer", 40).items()}
    correct = same_ok = same_total = 0
    per_delta: dict[float, list[int]] = {}
    for trial in public["trials"]:
        if trial["id"] not in given:
            raise TelemetryError("Every pair must be answered")
        truth = private["answers"][trial["id"]]
        ok = given[trial["id"]] == truth["answer"]
        correct += int(ok)
        if truth["answer"] == "same":
            same_total += 1
            same_ok += int(ok)
        else:
            bucket = per_delta.setdefault(truth["delta"], [0, 0])
            bucket[0] += int(ok)
            bucket[1] += 1
    total = len(public["trials"])
    reliable = [d for d, v in per_delta.items() if v[0] == v[1]]
    metrics = {
        "correct_count": correct,
        "total_trials": total,
        "accuracy_pct": _pct(correct, total),
        "smallest_reliable_delta_pct": min(reliable) if reliable else None,
        "same_pairs_correct": same_ok,
        "same_pairs_total": same_total,
    }
    series = {
        "by_delta": [
            {"delta_pct": d, "correct": v[0], "of": v[1]} for d, v in sorted(per_delta.items())
        ]
    }
    return metrics, series


# --------------------------------------------------------------------------- Digits in noise

_NOISE_LEVELS = [1, 2, 3, 4, 5]


def _gen_digits_noise(rng: random.Random) -> tuple[dict, dict]:
    trials = []
    n = 0
    for level in _NOISE_LEVELS:
        for _ in range(2):
            n += 1
            trials.append(
                {"id": f"d{n}", "noise_level": level, "digits": rng.sample(range(1, 10), 3)}
            )
    return {"type": "digits_noise", "trials": trials}, {}


def _score_digits_noise(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    answers = _by_id(tel.get("answers"), "answer", 20)
    digits_ok = exact = 0
    per_level: dict[int, list[int]] = {}
    for trial in public["trials"]:
        answer = answers.get(trial["id"])
        if answer is None:
            raise TelemetryError("Every item must be answered")
        given = [d for d in _list(answer.get("answer"), "answer", 6) if isinstance(d, int)]
        matches = sum(1 for g, e in zip(given, trial["digits"], strict=False) if g == e)
        digits_ok += matches
        exact += int(matches == 3 and len(given) == 3)
        bucket = per_level.setdefault(trial["noise_level"], [0, 0])
        bucket[0] += matches
        bucket[1] += 3
    total_digits = 3 * len(public["trials"])
    metrics = {
        "digits_correct": digits_ok,
        "digits_total": total_digits,
        "triplets_exact": exact,
        "triplets_total": len(public["trials"]),
        "accuracy_pct": _pct(digits_ok, total_digits),
    }
    series = {
        "by_noise": [
            {"noise_level": lvl, "correct": v[0], "of": v[1]}
            for lvl, v in sorted(per_level.items())
        ]
    }
    return metrics, series


# --------------------------------------------------------------------------- Simple reaction


def _gen_reaction(rng: random.Random) -> tuple[dict, dict]:
    return {
        "type": "reaction",
        "trials": [{"id": f"r{i + 1}", "delay_ms": rng.randint(1400, 4200)} for i in range(8)],
    }, {}


def _score_reaction(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    rows = _by_id(tel.get("trials"), "trial", 20)
    rts: list[float] = []
    anticipations = 0
    for trial in public["trials"]:
        row = rows.get(trial["id"])
        if row is None:
            raise TelemetryError("Every trial must be recorded")
        if row.get("early") is True:
            anticipations += 1
            continue
        rt = _num(row.get("rt_ms"), "rt_ms", 0, 10_000)
        if rt < 100:
            anticipations += 1
        else:
            rts.append(round(rt))
    if len(rts) < 3:
        raise TelemetryError("Too few valid trials; please repeat the exercise")
    metrics = {
        "mean_rt_ms": round(_mean(rts)),
        "median_rt_ms": round(_median(rts)),
        "best_rt_ms": round(min(rts)),
        "slowest_rt_ms": round(max(rts)),
        "variability_ms": round(_sd(rts)),
        "anticipations_count": anticipations,
        "lapses_count": sum(1 for r in rts if r > 500),
        "valid_trials": len(rts),
    }
    return metrics, {"rt_ms": rts}


# --------------------------------------------------------------------------- Go / No-Go

_GNG_TRIALS = 40


def _gen_go_no_go(rng: random.Random) -> tuple[dict, dict]:
    while True:
        kinds = ["go"] * 30 + ["nogo"] * 10
        rng.shuffle(kinds)
        ok = all(k == "go" for k in kinds[:3])
        for i in range(len(kinds) - 3):
            if kinds[i : i + 4] == ["nogo"] * 4:
                ok = False
        if ok:
            break
    trials = [
        {"id": i + 1, "kind": kind, "isi_ms": rng.randint(700, 1400), "show_ms": 800}
        for i, kind in enumerate(kinds)
    ]
    return {"type": "go_no_go", "trials": trials}, {}


def _score_go_no_go(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    rows = {
        int(_num(_obj(r, "trial").get("id"), "id", 1, 500)): _obj(r, "trial")
        for r in _list(tel.get("responses"), "responses", 80, _GNG_TRIALS)
    }
    hits = omissions = commissions = rejections = 0
    rts: list[float] = []
    quarter_errors = [0, 0, 0, 0]
    for trial in public["trials"]:
        row = rows.get(trial["id"])
        if row is None:
            raise TelemetryError("Every trial must be recorded")
        pressed = row.get("pressed") is True
        quarter = min(3, (trial["id"] - 1) * 4 // len(public["trials"]))
        if trial["kind"] == "go":
            if pressed:
                hits += 1
                rts.append(round(_num(row.get("rt_ms"), "rt_ms", 0, 5000)))
            else:
                omissions += 1
                quarter_errors[quarter] += 1
        elif pressed:
            commissions += 1
            quarter_errors[quarter] += 1
        else:
            rejections += 1
    metrics = {
        "go_hits": hits,
        "omissions_count": omissions,
        "commission_errors": commissions,
        "correct_rejections": rejections,
        "mean_rt_ms": round(_mean(rts)) if rts else None,
        "variability_ms": round(_sd(rts)) if rts else None,
        "inhibition_pct": _pct(rejections, commissions + rejections),
        "accuracy_pct": _pct(hits + rejections, len(public["trials"])),
    }
    return metrics, {"rt_ms": rts, "errors_by_quarter": quarter_errors}


# --------------------------------------------------------------------------- Pursuit tracking

_ASPECT = 1.6
_PURSUIT_SEC = 20


def _pursuit_target(p: dict, t_ms: float) -> tuple[float, float]:
    frac = t_ms / (p["duration_sec"] * 1000)
    x = 0.5 + p["ax"] * math.sin(2 * math.pi * p["fx"] * frac + p["px"])
    y = 0.5 + p["ay"] * math.sin(2 * math.pi * p["fy"] * frac + p["py"])
    return x, y


def _gen_pursuit(rng: random.Random) -> tuple[dict, dict]:
    fx, fy = rng.choice([(2, 3), (3, 2), (1, 2), (2, 1), (3, 1), (1, 3)])
    return {
        "type": "pursuit",
        "aspect": _ASPECT,
        "duration_sec": _PURSUIT_SEC,
        "radius": 0.09,
        "target": {
            "fx": fx,
            "fy": fy,
            "px": round(rng.uniform(0, 6.28), 3),
            "py": round(rng.uniform(0, 6.28), 3),
            "ax": 0.36,
            "ay": 0.3,
            "duration_sec": _PURSUIT_SEC,
        },
    }, {}


def _score_pursuit(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    duration_ms = public["duration_sec"] * 1000
    samples = [s for s in _samples(tel, duration_ms) if s[0] <= duration_ms]
    if len(samples) < 150 or samples[-1][0] - samples[0][0] < duration_ms * 0.8:
        raise TelemetryError("Not enough tracking data was recorded")
    distances: list[float] = []
    on_target = 0
    per_second: list[list[float]] = [[] for _ in range(public["duration_sec"])]
    for t, x, y in samples:
        tx, ty = _pursuit_target(public["target"], t)
        dist = math.hypot((x - tx) * public["aspect"], y - ty)
        distances.append(dist)
        on_target += int(dist <= public["radius"])
        per_second[min(public["duration_sec"] - 1, int(t // 1000))].append(dist)
    metrics = {
        "time_on_target_pct": _pct(on_target, len(samples)),
        "deviation_rmse_pct": round(100 * math.sqrt(_mean([d * d for d in distances])), 1),
        "mean_deviation_pct": round(100 * _mean(distances), 1),
        "tracking_duration_sec": public["duration_sec"],
    }
    series = {
        "deviation_per_second": [round(100 * _mean(b), 1) if b else 0 for b in per_second],
        "track": [
            {"t": round(t), "x": round(x, 3), "y": round(y, 3)}
            for t, x, y in _downsample(samples, 120)
        ],
    }
    return metrics, series


# --------------------------------------------------------------------------- Cursor path


def _catmull(points: list[tuple[float, float]], per: int = 10) -> list[dict[str, float]]:
    pts = [points[0], *points, points[-1]]
    out: list[dict[str, float]] = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(per):
            t = k / per
            t2, t3 = t * t, t * t * t
            coords = []
            for axis in (0, 1):
                coords.append(
                    0.5
                    * (
                        2 * p1[axis]
                        + (-p0[axis] + p2[axis]) * t
                        + (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t2
                        + (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t3
                    )
                )
            out.append({"x": round(coords[0], 4), "y": round(coords[1], 4)})
    out.append({"x": round(points[-1][0], 4), "y": round(points[-1][1], 4)})
    return out


def _gen_cursor_path(rng: random.Random) -> tuple[dict, dict]:
    count = 7
    ys: list[float] = []
    while len(ys) < count:
        y = rng.uniform(0.22, 0.78)
        if not ys or abs(y - ys[-1]) >= 0.18:
            ys.append(y)
    xs = [0.07 + i * (0.86 / (count - 1)) for i in range(count)]
    path = _catmull(list(zip(xs, ys, strict=True)))
    return {
        "type": "cursor_path",
        "aspect": _ASPECT,
        "half_width": 0.065,
        "path": path,
        "start": path[0],
        "end": path[-1],
    }, {}


def _score_cursor_path(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    samples = _samples(tel, 120_000)
    path, aspect, half = public["path"], public["aspect"], public["half_width"]
    start, end = public["start"], public["end"]

    def near(point: dict, x: float, y: float) -> bool:
        return math.hypot((x - point["x"]) * aspect, y - point["y"]) <= half * 1.6

    begin_index = next((i for i, s in enumerate(samples) if near(start, s[1], s[2])), None)
    if begin_index is None:
        raise TelemetryError("The route was not started at the start point")
    finish_index = next(
        (i for i in range(begin_index, len(samples)) if near(end, samples[i][1], samples[i][2])),
        None,
    )
    if finish_index is None:
        raise TelemetryError("The route was not completed")
    run = samples[begin_index : finish_index + 1]
    duration = (run[-1][0] - run[0][0]) / 1000
    if duration < 1.2 or len(run) < 10:
        raise TelemetryError("Result is implausibly fast")
    inside = exits = 0
    was_inside = True
    distances: list[float] = []
    bins: list[list[float]] = [[] for _ in range(20)]
    for _t, x, y in run:
        dist = _polyline_distance(x, y, path, aspect)
        distances.append(dist)
        is_inside = dist <= half
        inside += int(is_inside)
        if was_inside and not is_inside:
            exits += 1
        was_inside = is_inside
        bins[max(0, min(19, int((x - 0.07) / 0.86 * 20)))].append(dist)
    metrics = {
        "completion_time_sec": round(duration, 1),
        "in_corridor_pct": _pct(inside, len(run)),
        "boundary_exits": exits,
        "mean_deviation_pct": round(100 * _mean(distances), 1),
    }
    series = {
        "deviation_along_path": [round(100 * _mean(b), 1) if b else 0 for b in bins],
        "track": [{"x": round(x, 3), "y": round(y, 3)} for _t, x, y in _downsample(run, 160)],
    }
    return metrics, series


# --------------------------------------------------------------------------- Color Perception (Ishihara / Rabkin)

_COLOR_PLATES_POOL: list[dict[str, Any]] = [
    # Baseline demonstration plates (visible across normal trichromacy, dichromacy & anomalous trichromacy)
    {
        "id": "base-12",
        "type": "number",
        "value": "12",
        "weight": "baseline",
        "bg_palette": ["#4b8e61", "#5ea574", "#74be8d", "#427f54", "#85cea1", "#539967"],
        "fg_palette": ["#ea583a", "#dd4828", "#f36e4f", "#c93b1e", "#f88366", "#d64426"],
        "distractors": ["72", "21"],
    },
    {
        "id": "base-circle",
        "type": "circle",
        "value": "circle",
        "weight": "baseline",
        "bg_palette": ["#3e734c", "#4f8d63", "#62a578", "#33613f", "#78b88d"],
        "fg_palette": ["#ea5a39", "#dc4725", "#f47352", "#bf3315", "#f68668"],
        "distractors": ["square", "triangle"],
    },
    {
        "id": "base-16",
        "type": "number",
        "value": "16",
        "weight": "baseline",
        "bg_palette": ["#427954", "#55916a", "#69a77f", "#366644", "#7fbe94"],
        "fg_palette": ["#ec6140", "#de502d", "#f37554", "#c43b1c", "#f78a6d"],
        "distractors": ["15", "76"],
    },
    # Protan-sensitive (Red-deficit / L-cone)
    {
        "id": "protan-5",
        "type": "number",
        "value": "5",
        "weight": "protan",
        "bg_palette": ["#cc9b76", "#ba8863", "#ddae89", "#a67551", "#eec09c", "#b3805b"],
        "fg_palette": ["#329471", "#23815e", "#45a582", "#186f4d", "#57b794", "#2b8d6a"],
        "distractors": ["2", "6"],
    },
    {
        "id": "protan-15",
        "type": "number",
        "value": "15",
        "weight": "protan",
        "bg_palette": ["#5a8c72", "#4a7a60", "#6d9f85", "#3d6850", "#7fb297"],
        "fg_palette": ["#e06044", "#cd4c30", "#ee7458", "#b83b1f", "#f4876e"],
        "distractors": ["17", "13"],
    },
    {
        "id": "protan-73",
        "type": "number",
        "value": "73",
        "weight": "protan",
        "bg_palette": ["#568d71", "#44785d", "#6ca285", "#37644c", "#7eb798"],
        "fg_palette": ["#df6144", "#cb4d30", "#ee7559", "#b73b1f", "#f3896f"],
        "distractors": ["13", "78"],
    },
    {
        "id": "protan-star",
        "type": "star",
        "value": "star",
        "weight": "protan",
        "bg_palette": ["#528569", "#417257", "#669a7c", "#345e45", "#7ab191"],
        "fg_palette": ["#df5a3d", "#cd4629", "#ee6f52", "#b73518", "#f48368"],
        "distractors": ["circle", "triangle"],
    },
    {
        "id": "protan-triangle",
        "type": "triangle",
        "value": "triangle",
        "weight": "protan",
        "bg_palette": ["#caa07a", "#b68c67", "#dcaf8a", "#a27954", "#ecc09c"],
        "fg_palette": ["#2f916d", "#1f7d5a", "#42a27e", "#136c49", "#53b38f"],
        "distractors": ["square", "star"],
    },
    # Deutan-sensitive (Green-deficit / M-cone)
    {
        "id": "deutan-8",
        "type": "number",
        "value": "8",
        "weight": "deutan",
        "bg_palette": ["#c7946f", "#b3815c", "#d9a782", "#9f6e4a", "#e9b994"],
        "fg_palette": ["#429b79", "#318765", "#55af8c", "#247554", "#69c3a0"],
        "distractors": ["3", "9"],
    },
    {
        "id": "deutan-6",
        "type": "number",
        "value": "6",
        "weight": "deutan",
        "bg_palette": ["#4b8e61", "#5ea574", "#74be8d", "#427f54", "#85cea1"],
        "fg_palette": ["#ea583a", "#dd4828", "#f36e4f", "#c93b1e", "#f88366"],
        "distractors": ["5", "9"],
    },
    {
        "id": "deutan-26",
        "type": "number",
        "value": "26",
        "weight": "deutan",
        "bg_palette": ["#57896d", "#47765b", "#699c7f", "#39634a", "#7daf93"],
        "fg_palette": ["#de5e42", "#cb4b2e", "#ed7357", "#b7391c", "#f3876d"],
        "distractors": ["2", "6"],
    },
    {
        "id": "deutan-29",
        "type": "number",
        "value": "29",
        "weight": "deutan",
        "bg_palette": ["#52886c", "#417459", "#659c7f", "#336147", "#79af92"],
        "fg_palette": ["#df6144", "#cc4e30", "#ee7659", "#b83c1f", "#f48a70"],
        "distractors": ["70", "20"],
    },
    {
        "id": "deutan-square",
        "type": "square",
        "value": "square",
        "weight": "deutan",
        "bg_palette": ["#cc9771", "#b8835d", "#deab84", "#a3704b", "#eebf99"],
        "fg_palette": ["#369773", "#268360", "#49a884", "#19714e", "#5bb996"],
        "distractors": ["diamond", "circle"],
    },
    {
        "id": "deutan-diamond",
        "type": "diamond",
        "value": "diamond",
        "weight": "deutan",
        "bg_palette": ["#55876b", "#437459", "#679a7d", "#356147", "#7caf92"],
        "fg_palette": ["#dd5b3f", "#ca482c", "#ed7054", "#b5361a", "#f3856a"],
        "distractors": ["triangle", "square"],
    },
    # Tritan-sensitive (Blue-Yellow deficit / S-cone)
    {
        "id": "tritan-7",
        "type": "number",
        "value": "7",
        "weight": "tritan",
        "bg_palette": ["#a88e58", "#947a44", "#bd9f67", "#816834", "#cfb27a"],
        "fg_palette": ["#347bb8", "#256aa6", "#458ec9", "#175791", "#58a0dc"],
        "distractors": ["1", "4"],
    },
    {
        "id": "tritan-42",
        "type": "number",
        "value": "42",
        "weight": "tritan",
        "bg_palette": ["#baa062", "#a68c4e", "#ceb273", "#91783d", "#dfc586"],
        "fg_palette": ["#3877b0", "#28659d", "#4b8abf", "#1b538b", "#609cd3"],
        "distractors": ["4", "2"],
    },
    {
        "id": "tritan-cross",
        "type": "cross",
        "value": "cross",
        "weight": "tritan",
        "bg_palette": ["#b5965b", "#a08147", "#c9a96c", "#8c6e37", "#dac080"],
        "fg_palette": ["#3a7bb5", "#2a69a3", "#4c8fc7", "#1c5790", "#5ea2dc"],
        "distractors": ["heart", "star"],
    },
    {
        "id": "tritan-heart",
        "type": "heart",
        "value": "heart",
        "weight": "tritan",
        "bg_palette": ["#a8905b", "#947d47", "#bca46d", "#826b38", "#cbb57f"],
        "fg_palette": ["#3274b1", "#22639e", "#4587c4", "#15508c", "#5898d5"],
        "distractors": ["circle", "cross"],
    },
    # Letter plates
    {
        "id": "shape-A",
        "type": "letter",
        "value": "A",
        "weight": "shape",
        "bg_palette": ["#51876b", "#407358", "#64997c", "#326046", "#79ae91"],
        "fg_palette": ["#de5e42", "#cb4b2e", "#ed7357", "#b7391c", "#f3876d"],
        "distractors": ["O", "H"],
    },
    {
        "id": "shape-O",
        "type": "letter",
        "value": "O",
        "weight": "shape",
        "bg_palette": ["#c7946f", "#b3815c", "#d9a782", "#9f6e4a", "#e9b994"],
        "fg_palette": ["#399874", "#288561", "#4ba985", "#19734e", "#5eb997"],
        "distractors": ["C", "D"],
    },
]


def _gen_color_perception(rng: random.Random) -> tuple[dict, dict]:
    baseline_pool = [p for p in _COLOR_PLATES_POOL if p["weight"] == "baseline"]
    protan_pool = [p for p in _COLOR_PLATES_POOL if p["weight"] == "protan"]
    deutan_pool = [p for p in _COLOR_PLATES_POOL if p["weight"] == "deutan"]
    tritan_pool = [p for p in _COLOR_PLATES_POOL if p["weight"] == "tritan"]
    shape_pool = [p for p in _COLOR_PLATES_POOL if p["weight"] == "shape"]

    selected = [
        rng.choice(baseline_pool),
        *rng.sample(protan_pool, 2),
        *rng.sample(deutan_pool, 2),
        rng.choice(tritan_pool),
        *rng.sample(shape_pool, 2),
    ]

    # Keep baseline plate first for immediate demonstration/calibration, shuffle remaining 7
    head = selected[:1]
    tail = selected[1:]
    rng.shuffle(tail)
    ordered = head + tail

    public_plates: list[dict[str, Any]] = []
    answers: dict[str, str] = {}

    for item in ordered:
        pid = item["id"]
        val = item["value"]
        answers[pid] = val

        opts = [val, *item["distractors"], "none"]
        rng.shuffle(opts)

        public_plates.append(
            {
                "id": pid,
                "type": item["type"],
                "value": val,
                "weight": item["weight"],
                "bg_palette": item["bg_palette"],
                "fg_palette": item["fg_palette"],
                "options": opts,
                "seed": rng.randint(1000, 999999),
            }
        )

    return {"type": "color_perception", "plates": public_plates, "total_plates": len(public_plates)}, {"answers": answers}


def _score_color_perception(public: dict, private: dict, tel: dict) -> tuple[dict, dict]:
    raw_responses = tel.get("responses")
    raw_answers = tel.get("answers")

    answers_map: dict[str, str] = {}
    if isinstance(raw_responses, list) and raw_responses:
        for r in raw_responses:
            if isinstance(r, dict) and "id" in r and "answer" in r:
                answers_map[str(r["id"])] = str(r["answer"]).strip().lower()
    elif isinstance(raw_answers, dict) and raw_answers:
        for k, v in raw_answers.items():
            answers_map[str(k)] = str(v).strip().lower()
    else:
        raise TelemetryError("Missing plate answers in telemetry")

    plates = _list(public.get("plates"), "plates", 20, 1)
    correct_answers = private.get("answers", {})

    if len(answers_map) < len(plates):
        raise TelemetryError("Not all color plates were answered")

    correct_count = 0
    protan_errors = 0
    deutan_errors = 0
    tritan_errors = 0
    plate_breakdown: list[dict[str, Any]] = []

    for p in plates:
        pid = p["id"]
        expected = str(correct_answers.get(pid, "")).strip().lower()
        chosen = answers_map.get(pid, "")
        is_correct = chosen == expected

        if is_correct:
            correct_count += 1
        else:
            w = p.get("weight")
            if w == "protan":
                protan_errors += 1
            elif w == "deutan":
                deutan_errors += 1
            elif w == "tritan":
                tritan_errors += 1

        plate_breakdown.append(
            {
                "id": pid,
                "type": p.get("type"),
                "weight": p.get("weight"),
                "correct": is_correct,
                "chosen": chosen,
            }
        )

    total_plates = len(plates)
    accuracy_pct = _pct(correct_count, total_plates)
    l_cone_pct = max(0.0, round(100.0 - protan_errors * 50.0, 1))
    m_cone_pct = max(0.0, round(100.0 - deutan_errors * 50.0, 1))
    s_cone_pct = max(0.0, round(100.0 - tritan_errors * 100.0, 1))

    if accuracy_pct >= 87.5:
        status_key = "normal_trichromacy"
    elif protan_errors >= 2 and deutan_errors <= 1:
        status_key = "protan_deficiency"
    elif deutan_errors >= 2 and protan_errors <= 1:
        status_key = "deutan_deficiency"
    elif protan_errors >= 1 and deutan_errors >= 1:
        status_key = "red_green_deficiency"
    elif tritan_errors >= 1:
        status_key = "tritan_deficiency"
    else:
        status_key = "unspecified_variation"

    metrics = {
        "accuracy_pct": accuracy_pct,
        "correct_count": correct_count,
        "total_plates": total_plates,
        "protan_errors": protan_errors,
        "deutan_errors": deutan_errors,
        "tritan_errors": tritan_errors,
        "l_cone_pct": l_cone_pct,
        "m_cone_pct": m_cone_pct,
        "s_cone_pct": s_cone_pct,
    }
    series = {
        "plate_breakdown": plate_breakdown,
        "status_key": status_key,
    }
    return metrics, series


# --------------------------------------------------------------------------- registry


@dataclass(frozen=True)
class Engine:
    kind: str
    generate: Callable[[random.Random], tuple[dict, dict]]
    score: Callable[[dict, dict, dict], tuple[dict, dict]]
    primary: str
    better: str  # "lower" | "higher"


ENGINES: dict[str, Engine] = {
    "attention-concentration": Engine(
        "schulte", _gen_schulte, _score_schulte, "total_time_sec", "lower"
    ),
    "attention-switching": Engine(
        "trail", _gen_trail, _score_trail, "switching_cost_sec", "lower"
    ),
    "visual-memory": Engine("corsi", _gen_corsi, _score_corsi, "max_span", "higher"),
    "short-term-memory": Engine(
        "digit_span", _gen_digit_span, _score_digit_span, "forward_span", "higher"
    ),
    "information-processing-speed": Engine(
        "symbol_digit", _gen_symbol_digit, _score_symbol_digit, "correct_count", "higher"
    ),
    "contrast-sensitivity": Engine(
        "contrast", _gen_contrast, _score_contrast, "threshold_contrast_pct", "lower"
    ),
    "color-perception": Engine(
        "color_perception", _gen_color_perception, _score_color_perception, "accuracy_pct", "higher"
    ),
    "visual-pairs": Engine(
        "visual_pairs", _gen_visual_pairs, _score_visual_pairs, "moves_count", "lower"
    ),
    "path-memory": Engine(
        "path_memory", _gen_path_memory, _score_path_memory, "steps_correct", "higher"
    ),
    "pattern-matrix": Engine("pattern", _gen_pattern, _score_pattern, "correct_count", "higher"),
    "sound-discrimination": Engine(
        "sound_compare", _gen_sound_compare, _score_sound_compare, "accuracy_pct", "higher"
    ),
    "speech-in-noise": Engine(
        "digits_noise", _gen_digits_noise, _score_digits_noise, "digits_correct", "higher"
    ),
    "reaction-speed": Engine("reaction", _gen_reaction, _score_reaction, "mean_rt_ms", "lower"),
    "go-no-go": Engine("go_no_go", _gen_go_no_go, _score_go_no_go, "accuracy_pct", "higher"),
    "mouse-eye-coordination": Engine(
        "pursuit", _gen_pursuit, _score_pursuit, "time_on_target_pct", "higher"
    ),
    "cursor-path": Engine(
        "cursor_path", _gen_cursor_path, _score_cursor_path, "in_corridor_pct", "higher"
    ),
}

ENGINE_SLUGS = frozenset(ENGINES)


def generate_challenge(slug: str, seed: int | None = None) -> dict[str, Any]:
    """Create a fresh task variant: ``{"seed", "public", "private"}``."""
    actual_seed = secrets.randbits(62) if seed is None else seed
    engine = ENGINES.get(slug)
    if engine is None:
        return {"seed": actual_seed, "public": {"type": "standard_exercise"}, "private": {}}
    public, private = engine.generate(random.Random(actual_seed))
    return {"seed": actual_seed, "public": public, "private": private}


def public_challenge(challenge: dict[str, Any] | None) -> dict[str, Any] | None:
    """Return the browser-safe part of a stored challenge (supports pre-v2 snapshots)."""
    if not isinstance(challenge, dict):
        return None
    if "public" in challenge and "private" in challenge:
        return challenge["public"]
    return challenge


def score_attempt(
    slug: str, challenge: dict[str, Any], telemetry: dict[str, Any]
) -> dict[str, Any]:
    """Recompute results from an event log.  Raises :class:`TelemetryError` on bad input."""
    engine = ENGINES.get(slug)
    if engine is None:
        return {"version": RESULT_VERSION, "engine": "questionnaire", "metrics": {}, "series": {}}
    if "public" not in challenge or "private" not in challenge:
        raise TelemetryError("This attempt was created by an older version; please start again")
    metrics, series = engine.score(challenge["public"], challenge["private"], telemetry)
    return {
        "version": RESULT_VERSION,
        "engine": engine.kind,
        "primary": engine.primary,
        "better": engine.better,
        "metrics": metrics,
        "series": series,
    }
