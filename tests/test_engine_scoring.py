"""Replay-based scoring tests: a simulated client plays each generated task."""

import math

import pytest

from sihat.test_generators import (
    ENGINE_SLUGS,
    TelemetryError,
    _pursuit_target,
    generate_challenge,
    public_challenge,
    score_attempt,
)


def _perfect(slug: str, ch: dict) -> dict:  # noqa: C901 - one branch per exercise
    pub, priv = ch["public"], ch["private"]
    if slug == "attention-concentration":
        order = sorted(pub["grid"])
        return {"clicks": [{"v": v, "t": 1500 * (i + 1)} for i, v in enumerate(order)]}
    if slug == "attention-switching":
        parts = {}
        for part in pub["parts"]:
            parts[part["id"]] = {
                "clicks": [{"id": n, "t": 900 * (i + 1)} for i, n in enumerate(part["sequence"])]
            }
        return {"parts": parts}
    if slug == "visual-memory":
        return {"responses": [{"id": t["id"], "taps": t["sequence"]} for t in pub["trials"]]}
    if slug == "short-term-memory":
        responses = [{"id": t["id"], "answer": t["digits"]} for t in pub["forward"]]
        responses += [{"id": t["id"], "answer": t["digits"][::-1]} for t in pub["backward"]]
        return {"responses": responses}
    if slug == "information-processing-speed":
        mapping = {k["symbol"]: k["digit"] for k in pub["key"]}
        return {
            "responses": [
                {"i": i, "d": mapping[s], "t": 700 * (i + 1)} for i, s in enumerate(pub["prompts"][:80])
            ]
        }
    if slug == "contrast-sensitivity":
        return {"responses": [{"id": t["id"], "answer": t["tilt"]} for t in pub["trials"]]}
    if slug == "visual-pairs":
        by_symbol: dict[str, list[int]] = {}
        for card in pub["cards"]:
            by_symbol.setdefault(card["symbol"], []).append(card["id"])
        flips, t = [], 0
        for a, b in by_symbol.values():
            for card in (a, b):
                t += 800
                flips.append({"card": card, "t": t})
        return {"flips": flips}
    if slug == "path-memory":
        return {"responses": [{"id": t["id"], "taps": t["path"]} for t in pub["trials"]]}
    if slug == "pattern-matrix":
        return {
            "answers": [
                {"id": i["id"], "option": priv["correct"][i["id"]], "t": 4000} for i in pub["items"]
            ]
        }
    if slug == "sound-discrimination":
        return {
            "answers": [
                {"id": t["id"], "answer": priv["answers"][t["id"]]["answer"]} for t in pub["trials"]
            ]
        }
    if slug == "speech-in-noise":
        return {"answers": [{"id": t["id"], "answer": t["digits"]} for t in pub["trials"]]}
    if slug == "reaction-speed":
        return {"trials": [{"id": t["id"], "rt_ms": 250 + 10 * i} for i, t in enumerate(pub["trials"])]}
    if slug == "go-no-go":
        return {
            "responses": [
                {"id": t["id"], "pressed": t["kind"] == "go", "rt_ms": 300 if t["kind"] == "go" else None}
                for t in pub["trials"]
            ]
        }
    if slug == "mouse-eye-coordination":
        samples = []
        for step in range(0, 20_000, 33):
            x, y = _pursuit_target(pub["target"], step)
            samples.append({"t": step, "x": x, "y": y})
        return {"samples": samples}
    if slug == "cursor-path":
        return {
            "samples": [
                {"t": i * 80, "x": p["x"], "y": p["y"]} for i, p in enumerate(pub["path"])
            ]
        }
    raise AssertionError(slug)


def test_all_fifteen_exercises_are_registered() -> None:
    assert len(ENGINE_SLUGS) == 15
    excluded = {"visual-perception", "color-hue-discrimination", "physical-wellbeing"}
    assert not excluded & ENGINE_SLUGS


@pytest.mark.parametrize("slug", sorted(ENGINE_SLUGS))
def test_perfect_play_is_scored_server_side(slug: str) -> None:
    challenge = generate_challenge(slug)
    result = score_attempt(slug, challenge, _perfect(slug, challenge))
    assert result["version"] == 2
    assert result["metrics"]
    assert result["primary"] in result["metrics"]
    for value in result["metrics"].values():
        assert value is None or (isinstance(value, int | float) and math.isfinite(value))


@pytest.mark.parametrize("slug", sorted(ENGINE_SLUGS))
def test_every_attempt_gets_a_different_task(slug: str) -> None:
    first = generate_challenge(slug)["public"]
    others = [generate_challenge(slug)["public"] for _ in range(4)]
    assert any(other != first for other in others)


@pytest.mark.parametrize("slug", sorted(ENGINE_SLUGS))
def test_same_seed_reproduces_the_snapshot(slug: str) -> None:
    assert generate_challenge(slug, seed=7) == generate_challenge(slug, seed=7)


@pytest.mark.parametrize("slug", sorted(ENGINE_SLUGS))
def test_empty_telemetry_is_rejected(slug: str) -> None:
    with pytest.raises(TelemetryError):
        score_attempt(slug, generate_challenge(slug), {})


def test_private_answers_are_not_in_public_payload() -> None:
    pattern = generate_challenge("pattern-matrix")
    assert "correct" not in str(pattern["public"])
    assert "correct" in pattern["private"]
    sound = generate_challenge("sound-discrimination")
    assert "higher" not in str(sound["public"]) and "answers" in sound["private"]
    assert public_challenge(sound) == sound["public"]


def test_schulte_errors_are_counted_and_incomplete_runs_rejected() -> None:
    challenge = generate_challenge("attention-concentration")
    telemetry = _perfect("attention-concentration", challenge)
    telemetry["clicks"].insert(3, {"v": 25, "t": 3000})
    telemetry["clicks"].sort(key=lambda c: c["t"])
    result = score_attempt("attention-concentration", challenge, telemetry)
    assert result["metrics"]["errors_count"] == 1
    with pytest.raises(TelemetryError):
        score_attempt(
            "attention-concentration", challenge, {"clicks": telemetry["clicks"][:20]}
        )


def test_wrong_answers_lower_the_score() -> None:
    challenge = generate_challenge("pattern-matrix")
    wrong = {
        "answers": [
            {"id": i["id"], "option": next(
                o["id"] for o in i["options"] if o["id"] != challenge["private"]["correct"][i["id"]]
            )}
            for i in challenge["public"]["items"]
        ]
    }
    assert score_attempt("pattern-matrix", challenge, wrong)["metrics"]["correct_count"] == 0


def test_pattern_options_are_unambiguous() -> None:
    for _ in range(50):
        challenge = generate_challenge("pattern-matrix")
        for item in challenge["public"]["items"]:
            stims = [repr(sorted(o["stim"].items())) for o in item["options"]]
            assert len(stims) == len(set(stims)) == 4
            assert len(item["sequence"]) == 5


def test_corsi_stops_after_two_failures_at_one_length() -> None:
    challenge = generate_challenge("visual-memory")
    responses = []
    for trial in challenge["public"]["trials"]:
        ok = trial["length"] < 5
        taps = trial["sequence"] if ok else [(trial["sequence"][0] + 1) % 9]
        responses.append({"id": trial["id"], "taps": taps})
    result = score_attempt("visual-memory", challenge, {"responses": responses})
    assert result["metrics"]["max_span"] == 4
    assert result["metrics"]["trials_attempted"] == 6  # lengths 3,4 pass; both length-5 trials fail


def test_pursuit_rejects_short_recordings_and_scores_offsets() -> None:
    challenge = generate_challenge("mouse-eye-coordination")
    with pytest.raises(TelemetryError):
        score_attempt(
            "mouse-eye-coordination",
            challenge,
            {"samples": [{"t": i * 100, "x": 0.5, "y": 0.5} for i in range(20)]},
        )
    perfect = score_attempt(
        "mouse-eye-coordination", challenge, _perfect("mouse-eye-coordination", challenge)
    )
    center = score_attempt(
        "mouse-eye-coordination",
        challenge,
        {"samples": [{"t": t, "x": 0.5, "y": 0.5} for t in range(0, 20_000, 33)]},
    )
    assert perfect["metrics"]["time_on_target_pct"] == 100.0
    assert center["metrics"]["time_on_target_pct"] < 60


def test_cursor_path_requires_reaching_the_end() -> None:
    challenge = generate_challenge("cursor-path")
    telemetry = _perfect("cursor-path", challenge)
    result = score_attempt("cursor-path", challenge, telemetry)
    assert result["metrics"]["in_corridor_pct"] == 100.0
    half = telemetry["samples"][: len(telemetry["samples"]) // 2]
    with pytest.raises(TelemetryError):
        score_attempt("cursor-path", challenge, {"samples": half})


def test_unknown_slug_falls_back_to_questionnaire_result() -> None:
    challenge = generate_challenge("some-questionnaire")
    assert challenge["public"] == {"type": "standard_exercise"}
    assert score_attempt("some-questionnaire", challenge, {})["engine"] == "questionnaire"
