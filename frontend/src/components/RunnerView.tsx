import { useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { apiRequest } from '../api'
import type { Activity, Attempt, Completion, TestItem } from '../types'
import type { Translations } from '../i18n'

export const EDUCATIONAL_ACTIVITIES: Activity[] = [
  { slug: 'contrast-sensitivity', title: 'Contrast choices', description: 'Compare subtle light and dark patterns.', kind: 'visual' },
  { slug: 'color-hue-discrimination', title: 'Color choices', description: 'Match a color to its closest shade.', kind: 'visual' },
  { slug: 'visual-perception', title: 'Visual perception', description: 'Find the matching shape.', kind: 'visual' },
  { slug: 'sound-discrimination', title: 'Sound discrimination', description: 'Use sample controls to compare two tones.', kind: 'audio' },
  { slug: 'speech-in-noise', title: 'Speech in noise', description: 'Try a spoken-sample placeholder at a comfortable volume.', kind: 'audio' },
  { slug: 'short-term-memory', title: 'Short-term memory', description: 'Remember a short symbol sequence.', kind: 'memory' },
  { slug: 'visual-memory', title: 'Visual memory', description: 'Recall the cards that were shown.', kind: 'memory' },
  { slug: 'attention-concentration', title: 'Attention concentration', description: 'Select targets in a small field.', kind: 'attention' },
  { slug: 'attention-switching', title: 'Attention switching', description: 'Apply a changing sorting rule.', kind: 'attention' },
  { slug: 'emotional-wellbeing', title: 'Emotional wellbeing', description: 'Take a private moment for self-reflection.', kind: 'reflection' },
  { slug: 'reaction-speed', title: 'Reaction speed', description: 'Respond when the target appears.', kind: 'reaction' },
  { slug: 'mouse-eye-coordination', title: 'Pointer coordination', description: 'Move to and select the target.', kind: 'pointer' },
  { slug: 'information-processing-speed', title: 'Information processing', description: 'Make a quick visual match.', kind: 'processing' },
  { slug: 'physical-wellbeing', title: 'Physical wellbeing', description: 'Reflect privately on physical comfort today.', kind: 'reflection' },
  { slug: 'daily-activity', title: 'Daily activity', description: 'Reflect privately on a daily activity.', kind: 'reflection' },
]

export function ExercisePanel({
  activity,
  onReady,
}: {
  activity: Activity
  onReady: (value: boolean) => void
}) {
  const [notice, setNotice] = useState('')
  const [sequenceVisible, setSequenceVisible] = useState(false)
  const [sequence, setSequence] = useState<string[]>([])
  const [targets, setTargets] = useState<number[]>([])
  const [reaction, setReaction] = useState<'idle' | 'waiting' | 'go' | 'done'>('idle')
  const [startedAt, setStartedAt] = useState(0)
  const [pointer, setPointer] = useState({ left: 52, top: 48 })
  const symbols = ['circle', 'triangle', 'square']

  const setComplete = (text: string) => {
    setNotice(text)
    onReady(true)
  }

  const startReaction = () => {
    setReaction('waiting')
    onReady(false)
    window.setTimeout(() => {
      setStartedAt(performance.now())
      setReaction('go')
    }, 700 + Math.random() * 900)
  }

  const hitTarget = (event: ReactPointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * 100
    const y = ((event.clientY - box.top) / box.height) * 100
    if (Math.hypot(x - pointer.left, y - pointer.top) < 11) {
      setComplete('Target selected. You may continue.')
    } else {
      setNotice('Try selecting closer to the target.')
      setPointer({ left: 20 + Math.random() * 60, top: 20 + Math.random() * 60 })
    }
  }

  let content: ReactNode
  if (activity.kind === 'visual') {
    const values =
      activity.slug === 'color-hue-discrimination'
        ? ['#80b8d8', '#78a9da', '#6fa1d5']
        : activity.slug === 'visual-perception'
        ? ['circle', 'diamond', 'square']
        : ['light', 'medium', 'dark']
    content = (
      <>
        <p className="exercise-instruction">
          Choose the option that feels most similar to the sample. This activity has no clinical meaning.
        </p>
        <div className={'choice-row ' + activity.slug}>
          {values.map((value, index) => (
            <button
              type="button"
              className="visual-choice"
              key={value}
              style={activity.slug === 'color-hue-discrimination' ? { background: value } : undefined}
              onClick={() => setComplete('Choice ' + (index + 1) + ' selected locally. You may continue.')}
            >
              {activity.slug === 'color-hue-discrimination' ? (
                <span className="sr-only">Color choice {index + 1}</span>
              ) : (
                value
              )}
            </button>
          ))}
        </div>
      </>
    )
  } else if (activity.kind === 'audio') {
    content = (
      <>
        <p className="exercise-instruction">
          These controls are asset-free placeholders. No protected or licensed audio is included.
        </p>
        <div className="audio-controls">
          <button type="button" onClick={() => setNotice('Sample A placeholder selected.')}>
            Play sample A
          </button>
          <button type="button" onClick={() => setNotice('Sample B placeholder selected.')}>
            Play sample B
          </button>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setComplete('Comparison noted locally. You may continue.')}
        >
          I compared the samples
        </button>
      </>
    )
  } else if (activity.kind === 'memory' && activity.slug === 'short-term-memory') {
    const addSymbol = (symbol: string) => {
      const next = [...sequence, symbol]
      setSequence(next)
      if (next.length === symbols.length) {
        setComplete('Sequence recorded locally. You may continue.')
      }
    }
    content = (
      <>
        <p className="exercise-instruction">Show the sequence, then enter the same three symbols.</p>
        <button
          type="button"
          onClick={() => {
            setSequence([])
            setSequenceVisible(true)
            onReady(false)
            window.setTimeout(() => setSequenceVisible(false), 1400)
          }}
        >
          Show sequence
        </button>
        <div className="memory-display">
          {sequenceVisible ? symbols.join(' - ') : sequence.length ? sequence.join(' - ') : 'Ready'}
        </div>
        {!sequenceVisible && (
          <div className="symbol-row">
            {symbols.map((symbol) => (
              <button
                type="button"
                key={symbol}
                disabled={sequence.length === symbols.length}
                onClick={() => addSymbol(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>
        )}
      </>
    )
  } else if (activity.kind === 'memory') {
    content = (
      <>
        <p className="exercise-instruction">
          Show the cards, hide them, then mark the activity complete when you have recalled them.
        </p>
        <button
          type="button"
          onClick={() => {
            setSequenceVisible(!sequenceVisible)
            onReady(false)
          }}
        >
          {sequenceVisible ? 'Hide cards' : 'Show cards'}
        </button>
        {sequenceVisible ? (
          <div className="memory-cards">
            <span>sun</span>
            <span>leaf</span>
            <span>moon</span>
          </div>
        ) : (
          <button
            type="button"
            className="secondary-button"
            onClick={() => setComplete('Recall activity completed locally. You may continue.')}
          >
            I recalled the cards
          </button>
        )}
      </>
    )
  } else if (activity.kind === 'attention' && activity.slug === 'attention-concentration') {
    const cells = ['target', 'x', 'target', 'triangle', 'x', 'square', 'target', 'triangle', 'target']
    const selectTarget = (cell: string, index: number) => {
      if (cell !== 'target') {
        setNotice('That is not a target. Try another cell.')
        return
      }
      const next = [...new Set([...targets, index])]
      setTargets(next)
      if (next.length === 4) {
        setComplete('All targets selected. You may continue.')
      }
    }
    content = (
      <>
        <p className="exercise-instruction">Select all four target cells.</p>
        <div className="target-grid">
          {cells.map((cell, index) => (
            <button
              type="button"
              className={targets.includes(index) ? 'selected' : ''}
              key={cell + index}
              onClick={() => selectTarget(cell, index)}
            >
              {cell}
            </button>
          ))}
        </div>
      </>
    )
  } else if (activity.kind === 'attention') {
    content = (
      <>
        <p className="exercise-instruction">Pick a matching rule, switch the rule, then try again.</p>
        <div className="symbol-row">
          <button type="button" onClick={() => setComplete('Rule choice recorded locally. You may continue.')}>
            Blue circle
          </button>
          <button type="button" onClick={() => setComplete('Rule choice recorded locally. You may continue.')}>
            Blue square
          </button>
          <button type="button" onClick={() => setComplete('Rule choice recorded locally. You may continue.')}>
            Orange square
          </button>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setNotice('Rule switched. Choose again if you like.')}
        >
          Switch rule
        </button>
      </>
    )
  } else if (activity.kind === 'reflection') {
    const prompt =
      activity.slug === 'emotional-wellbeing'
        ? 'What would feel supportive right now?'
        : activity.slug === 'physical-wellbeing'
        ? 'What would help you feel comfortable today?'
        : 'What is one activity you noticed today?'
    content = (
      <>
        <label htmlFor="reflection">{prompt}</label>
        <textarea
          id="reflection"
          rows={4}
          placeholder="Write for yourself; this note stays in your browser."
          onChange={(event) => onReady(event.target.value.trim().length > 0)}
        />
        <button
          type="button"
          className="secondary-button"
          onClick={() => setComplete('Private reflection completed. You may continue.')}
        >
          Mark reflection complete
        </button>
      </>
    )
  } else if (activity.kind === 'reaction') {
    content = (
      <>
        <p className="exercise-instruction">Start, then respond only when the target changes.</p>
        {reaction === 'idle' && (
          <button type="button" onClick={startReaction}>
            Start reaction timing
          </button>
        )}
        {reaction === 'waiting' && (
          <button type="button" className="reaction waiting" disabled>
            Wait
          </button>
        )}
        {reaction === 'go' && (
          <button
            type="button"
            className="reaction go"
            onClick={() => {
              const elapsed = Math.round(performance.now() - startedAt)
              setReaction('done')
              setComplete('Response captured locally after ' + elapsed + ' ms. It is not an assessment.')
            }}
          >
            Respond now
          </button>
        )}
        {reaction === 'done' && (
          <button type="button" className="secondary-button" onClick={startReaction}>
            Try again
          </button>
        )}
      </>
    )
  } else if (activity.kind === 'pointer') {
    content = (
      <>
        <p className="exercise-instruction">
          Select the moving circle. This checks browser interaction only, not a health measure.
        </p>
        <div className="pointer-area" onPointerDown={hitTarget} role="application" aria-label="Pointer target area">
          <span className="pointer-target" style={{ left: pointer.left + '%', top: pointer.top + '%' }} />
        </div>
      </>
    )
  } else {
    content = (
      <>
        <p className="exercise-instruction">Which pair matches exactly?</p>
        <div className="symbol-row">
          <button type="button" onClick={() => setNotice('Try comparing the order again.')}>
            7 - 4 - 9 / 7 - 9 - 4
          </button>
          <button type="button" onClick={() => setComplete('Match selected locally. You may continue.')}>
            3 - 8 - 2 / 3 - 8 - 2
          </button>
        </div>
      </>
    )
  }
  return (
    <div className="exercise-panel">
      {content}
      {notice && (
        <p className="exercise-notice" aria-live="polite">
          {notice}
        </p>
      )}
    </div>
  )
}

export function RunnerView({
  test,
  onClose,
  onNotify,
  t,
}: {
  test: TestItem
  onClose: () => void
  onNotify: (msg: string) => void
  t?: Translations
}) {
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [completion, setCompletion] = useState<Completion | null>(null)
  const [ready, setReady] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string>('')
  const [started, setStarted] = useState(false)
  const [conditionsAccepted, setConditionsAccepted] = useState(false)

  const activity = EDUCATIONAL_ACTIVITIES.find((a) => a.slug === test.slug)

  const startAttempt = async () => {
    try {
      const att = await apiRequest<Attempt>('/attempts/start', {
        method: 'POST',
        body: JSON.stringify({ test_slug: test.slug }),
      })
      setAttempt(att)
      setStarted(true)
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to start check')
    }
  }

  const discardAttempt = async () => {
    if (attempt) {
      try {
        await apiRequest(`/attempts/${attempt.id}/discard`, { method: 'DELETE' })
      } catch {
        /* Screen can close safely */
      }
    }
    onClose()
  }

  const submitAnswer = async (answerVal?: string) => {
    if (!attempt?.current_question) return
    const ans = answerVal ?? selectedOption ?? 'completed'
    try {
      const advanced = await apiRequest<Attempt>(`/attempts/${attempt.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ question_id: attempt.current_question.id, answer: ans }),
      })
      setSelectedOption('')
      setReady(false)
      if (advanced.current_question) {
        setAttempt(advanced)
        return
      }
      const finish = await apiRequest<Completion>(`/attempts/${attempt.id}/complete`, { method: 'POST' })
      setCompletion(finish)
      setAttempt(null)
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to record answer')
    }
  }

  const handleDecision = async (save: boolean) => {
    if (!completion) return
    try {
      await apiRequest(`/attempts/${completion.id}/${save ? 'save' : 'do-not-save'}`, { method: 'POST' })
      onNotify(save ? 'Result saved to your private history.' : 'Temporary attempt deleted.')
      onClose()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to record decision')
    }
  }

  // Initial conditions step
  if (!started && !completion) {
    return (
      <section className="runner-card" aria-label="Pre-check conditions">
        <div className="runner-heading">
          <div>
            <p className="eyebrow">{test.type.replace('_', ' ')}</p>
            <h2>{test.localizations.en?.title ?? test.slug}</h2>
          </div>
          <button type="button" className="quiet-button" onClick={onClose}>
            Exit
          </button>
        </div>
        <div style={{ margin: '20px 0', textAlign: 'left' }}>
          <p>
            <strong>Instructions:</strong> {test.localizations.en?.description ?? 'Follow the instructions carefully.'}
          </p>
          <div className="precheck-box">
            <h4 style={{ margin: '0 0 8px' }}>Pre-Check Requirements:</h4>
            <p style={{ margin: 0, fontSize: '.9rem' }}>
              • Minimum required age: <strong>{test.min_age}+</strong>.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '.9rem' }}>
              • Ensure comfortable room lighting and screen brightness.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '.9rem' }}>
              • This is a self-assessment and does not represent a medical diagnosis.
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={conditionsAccepted}
              onChange={(e) => setConditionsAccepted(e.target.checked)}
            />
            I meet the age requirements and understand the test limitations.
          </label>
        </div>
        <div className="runner-actions">
          <button type="button" disabled={!conditionsAccepted} onClick={startAttempt}>
            Begin check
          </button>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </section>
    )
  }

  // Completion Screen with explicit choice
  if (completion) {
    return (
      <section className="completion-card" aria-live="polite">
        <h2>Check Complete</h2>
        <p>{completion.result?.message ?? 'Outcome calculated in temporary on-device session.'}</p>
        <p className="consent-text">
          {t?.runner.consentExplain ??
            'This record will exist only if you click Save. Choosing Do not save permanently discards your answers.'}
        </p>
        <div className="runner-actions">
          <button type="button" onClick={() => handleDecision(true)}>
            {t?.runner.saveBtn ?? 'Save'}
          </button>
          <button type="button" className="secondary-button" onClick={() => handleDecision(false)}>
            {t?.runner.doNotSaveBtn ?? 'Do not save'}
          </button>
        </div>
      </section>
    )
  }

  // Active stimulus / exercise stage
  return (
    <section className="runner-card active-runner" aria-live="polite">
      <div className="runner-heading">
        <div>
          <p className="eyebrow">{test.type.replace('_', ' ')}</p>
          <h2>{test.localizations.en?.title ?? test.slug}</h2>
        </div>
        <button type="button" className="quiet-button" onClick={discardAttempt}>
          Leave check
        </button>
      </div>

      {activity && (
        <ExercisePanel
          key={activity.slug}
          activity={activity}
          onReady={(isReady) => {
            setReady(isReady)
            if (isReady) setSelectedOption('completed')
          }}
        />
      )}

      {attempt?.current_question && !activity && (
        <div className="question-stage">
          <p className="question-text">{attempt.current_question.text}</p>
          {attempt.current_question.type === 'choice' && attempt.current_question.options && (
            <div className="choice-options-grid">
              {attempt.current_question.options.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={'choice-btn' + (selectedOption === opt.value ? ' selected' : '')}
                  onClick={() => {
                    setSelectedOption(opt.value)
                    setReady(true)
                  }}
                >
                  {opt.label || opt.value}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="runner-actions">
        <button
          type="button"
          disabled={!ready}
          onClick={() => submitAnswer()}
        >
          {attempt?.current_question ? 'Next' : 'Complete check'}
        </button>
        <button type="button" className="secondary-button" onClick={discardAttempt}>
          Cancel
        </button>
      </div>
    </section>
  )
}
