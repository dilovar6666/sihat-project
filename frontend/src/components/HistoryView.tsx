import { useEffect, useState } from 'react'
import { apiRequest, downloadPdfBlob } from '../api'
import type { ComparisonOutput, SavedResult } from '../types'
import type { Translations } from '../i18n'

export function HistoryView({ t, lang = 'en' }: { t: Translations; lang?: string }) {
  const [history, setHistory] = useState<SavedResult[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [comparing, setComparing] = useState<ComparisonOutput | null>(null)
  const [selectedResult, setSelectedResult] = useState<SavedResult | null>(null)
  const [pdfOptions, setPdfOptions] = useState({
    include_result: true,
    include_methodology: true,
    include_limitations: true,
    include_answers: true,
    include_warnings: true,
  })

  const loadHistory = async () => {
    setLoading(true)
    try {
      const items = await apiRequest<SavedResult[]>('/results/history')
      setHistory(items)
      setMessage('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  const deleteSingle = async (resultId: string) => {
    if (!window.confirm(t.history.confirmDeleteSingle)) return
    try {
      await apiRequest(`/results/${resultId}`, { method: 'DELETE' })
      setHistory(history.filter((item) => item.id !== resultId))
      if (selectedResult?.id === resultId) setSelectedResult(null)
      if (comparing?.results.some((item) => item.id === resultId)) setComparing(null)
      setMessage('Запись удалена из вашей приватной истории.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось удалить запись')
    }
  }

  const deleteAllHistory = async () => {
    if (!window.confirm(t.history.confirmDeleteAll)) return
    try {
      await apiRequest('/results/history', { method: 'DELETE' })
      setHistory([])
      setSelectedResult(null)
      setComparing(null)
      setMessage('Вся история результатов была окончательно удалена.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось очистить историю')
    }
  }

  const runCompare = async (resultId: string) => {
    try {
      const cmp = await apiRequest<ComparisonOutput>(`/results/${resultId}/compare`)
      setComparing(cmp)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Сравнение недоступно')
    }
  }

  const exportPdf = async (resultId: string) => {
    try {
      await downloadPdfBlob(resultId, pdfOptions)
      setMessage('Официальный PDF-отчет успешно сформирован и скачан.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Не удалось сформировать PDF')
    }
  }

  return (
    <section className="content-card history-section" aria-label="Private Results History">
      <div className="section-head-split">
        <div>
          <div className="eyebrow-pill">ЛИЧНАЯ ПРИВАТНОСТЬ • ШИФРОВАНИЕ</div>
          <h2 className="section-title-large">{t.history.title}</h2>
          <p className="section-subtitle">{t.history.subtitle}</p>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            className="quiet-button danger-btn"
            onClick={deleteAllHistory}
          >
            🗑️ {t.history.clearAllBtn}
          </button>
        )}
      </div>

      {message && <p className="message" role="alert">{message}</p>}
      {loading && <p className="loading-state">Загрузка приватной истории...</p>}

      {!loading && history.length === 0 && (
        <div className="empty-history-box">
          <div className="empty-history-icon" aria-hidden="true">📋</div>
          <h3 className="empty-history-title">{t.history.emptyMsg}</h3>
          <p className="empty-history-desc">
            Все результаты временных сессий удаляются по умолчанию, если вы не нажали кнопку «Сохранить».
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.history.dateCol}</th>
                <th>{t.history.testCol}</th>
                <th>{t.history.methodologyCol}</th>
                <th>{t.history.scoreCol}</th>
                <th>{t.history.actionsCol}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{new Date(item.completed_at).toLocaleDateString()}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-faint)' }}>
                      {new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <strong>{item.test_title}</strong>
                    <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                      {item.test_type.replace('_', ' ')}
                    </div>
                  </td>
                  <td>
                    <span className="methodology-tag">
                      {item.methodology_name} (v{item.methodology_version})
                    </span>
                  </td>
                  <td>
                    <code className="score-summary-pill">
                      {typeof item.result === 'object' && item.result !== null && 'score' in item.result
                        ? String((item.result as { score: unknown }).score)
                        : typeof item.result === 'object' && item.result !== null && 'reaction_time_ms' in item.result
                        ? `${(item.result as { reaction_time_ms: unknown }).reaction_time_ms} ms`
                        : 'Завершено'}
                    </code>
                  </td>
                  <td>
                    <div className="table-actions-cluster">
                      <button
                        type="button"
                        className="secondary-button compact-btn"
                        onClick={() => setSelectedResult(item)}
                      >
                        {t.history.viewBtn}
                      </button>
                      <button
                        type="button"
                        className="secondary-button compact-btn"
                        onClick={() => runCompare(item.id)}
                      >
                        {t.history.compareBtn}
                      </button>
                      <button
                        type="button"
                        className="quiet-button compact-btn danger-link"
                        onClick={() => deleteSingle(item.id)}
                        aria-label={`${t.history.deleteBtn} ${item.test_title}`}
                      >
                        {t.history.deleteBtn}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Result Details & PDF Modal */}
      {selectedResult && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="history-detail-title">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="section-heading">
              <h2 id="history-detail-title">{selectedResult.test_title} — {t.history.title}</h2>
              <button className="quiet-button" onClick={() => setSelectedResult(null)}>
                {t.passportModal.closeBtn}
              </button>
            </div>

            <div className="detail-meta-grid">
              <div>
                <strong>{t.history.dateCol}:</strong>
                <p>{new Date(selectedResult.completed_at).toLocaleString()}</p>
              </div>
              <div>
                <strong>{t.history.methodologyCol}:</strong>
                <p>{selectedResult.methodology_name} (v{selectedResult.methodology_version})</p>
              </div>
            </div>

            <div className="result-raw-panel">
              <h4>{t.history.resultSummaryTitle}:</h4>
              <pre>{JSON.stringify(selectedResult.result, null, 2)}</pre>
            </div>

            {selectedResult.limitations && (
              <p className="detail-limitation">
                <strong>Ограничения:</strong> {selectedResult.limitations}
              </p>
            )}

            <div className="pdf-export-box">
              <h3>{t.history.exportPdfTitle}</h3>
              <p className="pdf-explainer">{t.history.exportPdfDesc}</p>
              
              <div className="pdf-options-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={pdfOptions.include_answers}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, include_answers: e.target.checked })}
                  />
                  <span>{t.history.includeAnswersPdf}</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={pdfOptions.include_warnings}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, include_warnings: e.target.checked })}
                  />
                  <span>{t.history.includeWarningsPdf}</span>
                </label>
              </div>

              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-primary-emerald"
                  onClick={() => exportPdf(selectedResult.id)}
                >
                  📥 {t.history.downloadPdfBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {comparing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cmp-modal-title">
          <div className="modal-content" style={{ maxWidth: '820px' }}>
            <div className="section-heading">
              <h2 id="cmp-modal-title">{t.comparison.title}</h2>
              <button className="quiet-button" onClick={() => setComparing(null)}>
                {t.passportModal.closeBtn}
              </button>
            </div>

            <p className="comparison-rule-note">
              <strong>{t.comparison.ruleLabel}</strong> {comparing.methodology_version} / {comparing.definition_version}. {t.comparison.compatibleNote}
            </p>

            <div className="comparison-columns-grid">
              {comparing.results.map((res, index) => (
                <div key={res.id} className="comparison-attempt-card">
                  <div className="attempt-badge">
                    {lang === 'en' ? `Completion #${index + 1}` : `Попытка #${index + 1}`}
                  </div>
                  <div className="attempt-date">
                    {new Date(res.completed_at).toLocaleDateString()} {new Date(res.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <pre className="attempt-raw-result">
                    {JSON.stringify(res.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
