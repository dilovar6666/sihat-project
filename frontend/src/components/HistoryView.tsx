import { useEffect, useState } from 'react'
import { apiRequest, downloadPdfBlob } from '../api'
import type { ComparisonOutput, SavedResult } from '../types'
import type { Translations } from '../i18n'

export function HistoryView({ t }: { t?: Translations }) {
  const [history, setHistory] = useState<SavedResult[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [comparing, setComparing] = useState<ComparisonOutput | null>(null)
  const [selectedResult, setSelectedResult] = useState<SavedResult | null>(null)
  const [pdfOptions, setPdfOptions] = useState({ include_answers: true, include_warnings: true })

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
    const promptText = t ? t.history.confirmDeleteSingle : 'Delete this saved result from your private history?'
    if (!window.confirm(promptText)) return
    try {
      await apiRequest(`/results/${resultId}`, { method: 'DELETE' })
      setHistory(history.filter((item) => item.id !== resultId))
      if (selectedResult?.id === resultId) setSelectedResult(null)
      if (comparing?.base_result.id === resultId) setComparing(null)
      setMessage('Result deleted from your private history.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to delete result')
    }
  }

  const deleteAllHistory = async () => {
    const promptText = t ? t.history.confirmDeleteAll : 'Are you sure you want to delete ALL saved results in your private history? This cannot be undone.'
    if (!window.confirm(promptText)) return
    try {
      await apiRequest('/results/history', { method: 'DELETE' })
      setHistory([])
      setSelectedResult(null)
      setComparing(null)
      setMessage('All private results have been permanently deleted.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to clear history')
    }
  }

  const runCompare = async (resultId: string) => {
    try {
      const cmp = await apiRequest<ComparisonOutput>(`/results/${resultId}/compare`)
      setComparing(cmp)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to compare results')
    }
  }

  const exportPdf = async (resultId: string) => {
    try {
      await downloadPdfBlob(resultId, pdfOptions)
      setMessage('PDF downloaded successfully.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'PDF export failed')
    }
  }

  return (
    <section className="content-card" aria-label="Private Results History">
      <div className="section-heading">
        <h2>{t ? t.history.title : 'Your Private Results History'}</h2>
        {history.length > 0 && (
          <button className="quiet-button" style={{ color: '#b91c1c', borderColor: '#fca5a5' }} onClick={deleteAllHistory}>
            {t ? t.history.clearAllBtn : 'Delete all history'}
          </button>
        )}
      </div>

      <p className="exercise-instruction">
        {t ? t.history.subtitle : 'These records exist only because you chose Save after completion. They are private to your account and never used to compute a composite health score.'}
      </p>

      {message && <p className="message" role="alert">{message}</p>}
      {loading && <p>Loading history...</p>}

      {!loading && history.length === 0 && (
        <div style={{ textAlign: 'center', padding: '36px 12px' }}>
          <p style={{ color: 'var(--text-muted)' }}>{t ? t.history.emptyMsg : 'You have no saved results yet.'}</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t ? t.history.dateCol : 'Date'}</th>
                <th>{t ? t.history.testCol : 'Check Title'}</th>
                <th>Methodology</th>
                <th>{t ? t.history.actionsCol : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.completed_at).toLocaleDateString()}</td>
                  <td>
                    <strong>{item.test_title}</strong>
                    <div style={{ fontSize: '.78rem', color: 'var(--text-faint)' }}>{item.test_type.replace('_', ' ')}</div>
                  </td>
                  <td>{item.methodology_name} (v{item.methodology_version})</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button className="secondary-button" style={{ fontSize: '.8rem', padding: '4px 8px' }} onClick={() => setSelectedResult(item)}>
                        {t ? t.history.viewBtn : 'Details'} / PDF
                      </button>
                      <button className="secondary-button" style={{ fontSize: '.8rem', padding: '4px 8px' }} onClick={() => runCompare(item.id)}>
                        {t ? t.history.compareBtn : 'Compare'}
                      </button>
                      <button className="quiet-button" style={{ fontSize: '.8rem', padding: '4px 8px', color: '#b91c1c' }} onClick={() => deleteSingle(item.id)}>
                        {t ? t.history.deleteBtn : 'Delete'}
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
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="section-heading">
              <h2>{selectedResult.test_title} — Saved Result</h2>
              <button className="quiet-button" onClick={() => setSelectedResult(null)}>Close</button>
            </div>
            <p><strong>Completed At:</strong> {new Date(selectedResult.completed_at).toLocaleString()}</p>
            <p><strong>Methodology:</strong> {selectedResult.methodology_name} (v{selectedResult.methodology_version})</p>
            <p><strong>Definition Version:</strong> {selectedResult.definition_version}</p>
            <div style={{ background: 'var(--bg-subtle)', padding: '14px', borderRadius: '10px', margin: '14px 0', border: '1px solid var(--border-light)' }}>
              <p><strong>Result Summary:</strong></p>
              <pre style={{ whiteSpace: 'pre-wrap', font: 'inherit', margin: 0 }}>
                {JSON.stringify(selectedResult.result, null, 2)}
              </pre>
            </div>
            <p><strong>Limitations:</strong> {selectedResult.limitations}</p>

            <div style={{ margin: '18px 0', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
              <h3>Export Official Record (PDF)</h3>
              <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
                Every PDF export carries an explicit non-diagnostic notice and contains no fictional health percentage.
              </p>
              <div style={{ display: 'flex', gap: '16px', margin: '10px 0', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '.9rem' }}>
                  <input
                    type="checkbox"
                    checked={pdfOptions.include_answers}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, include_answers: e.target.checked })}
                  />
                  {t ? t.history.includeAnswersPdf : 'Include recorded answers'}
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '.9rem' }}>
                  <input
                    type="checkbox"
                    checked={pdfOptions.include_warnings}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, include_warnings: e.target.checked })}
                  />
                  {t ? t.history.includeWarningsPdf : 'Include methodology warnings'}
                </label>
              </div>
              <button onClick={() => exportPdf(selectedResult.id)}>Download PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {comparing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '800px' }}>
            <div className="section-heading">
              <h2>{t ? t.comparison.title : 'Compatible Result Comparison'}</h2>
              <button className="quiet-button" onClick={() => setComparing(null)}>Close</button>
            </div>
            <p style={{ fontSize: '.9rem', color: 'var(--text-muted)' }}>
              <strong>Rule:</strong> {comparing.compatibility_rule}. {t ? t.comparison.compatibleNote : 'Only records with matching methodology versions and compatible conditions are compared.'}
            </p>
            <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: '16px' }}>
              {comparing.results.map((res, index) => (
                <div key={res.id} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '14px' }}>
                  <p className="eyebrow">Completion #{index + 1}</p>
                  <p style={{ fontWeight: 700, margin: '4px 0' }}>{new Date(res.completed_at).toLocaleDateString()}</p>
                  <pre style={{ fontSize: '.8rem', background: 'var(--bg-surface)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-medium)' }}>
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
