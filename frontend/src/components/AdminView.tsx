import { useEffect, useState } from 'react'
import { apiRequest } from '../api'
import type { AdminDashboard, AdminUser, SupportTicket, TestItem } from '../types'

export function AdminView({ onNotify }: { onNotify: (msg: string) => void }) {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [tests, setTests] = useState<TestItem[]>([])

  // Questionnaire / Passport Editor modal
  const [editingTest, setEditingTest] = useState<TestItem | null>(null)
  const [methodologyForm, setMethodologyForm] = useState({
    methodology_name: '',
    methodology_version: '1.0',
    evidence_status: 'educational',
    evidence_source: '',
    license_info: '',
    limitations: '',
    warnings: '',
  })

  // AI drafting state
  const [draftTopic, setDraftTopic] = useState('')
  const [draftType, setDraftType] = useState<'faq' | 'article'>('article')
  const [draftResult, setDraftResult] = useState<{ title: string; content: string; note: string } | null>(null)
  const [draftLoading, setDraftLoading] = useState(false)

  const loadData = async () => {
    try {
      const [d, u, t, tst] = await Promise.all([
        apiRequest<AdminDashboard>('/admin/dashboard'),
        apiRequest<AdminUser[]>('/admin/users'),
        apiRequest<SupportTicket[]>('/admin/support/tickets'),
        apiRequest<TestItem[]>('/admin/tests'),
      ])
      setDashboard(d)
      setUsers(u)
      setTickets(t)
      setTests(tst)
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to load administration data')
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const toggleUserActive = async (user: AdminUser) => {
    try {
      const updated = await apiRequest<AdminUser>(`/admin/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !user.is_active }),
      })
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)))
      onNotify(`User ${user.email} updated.`)
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Cannot update user')
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updated = await apiRequest<SupportTicket>(`/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)))
      onNotify('Support ticket updated.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Cannot update ticket')
    }
  }

  const blockTest = async (testId: string) => {
    try {
      const updated = await apiRequest<TestItem>(`/admin/tests/${testId}/block`, { method: 'POST' })
      setTests(tests.map((t) => (t.id === updated.id ? updated : t)))
      onNotify('Test blocked from public catalog.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Cannot block test')
    }
  }

  const unpublishTest = async (testId: string) => {
    try {
      const updated = await apiRequest<TestItem>(`/admin/tests/${testId}/unpublish`, { method: 'POST' })
      setTests(tests.map((t) => (t.id === updated.id ? updated : t)))
      onNotify('Test reverted to draft.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Cannot unpublish test')
    }
  }

  const publishTest = async (testId: string) => {
    try {
      const updated = await apiRequest<TestItem>(`/admin/tests/${testId}/publish`, { method: 'POST' })
      setTests(tests.map((t) => (t.id === updated.id ? updated : t)))
      onNotify('Test published successfully.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Publication blocked. Ensure passport source and license are complete.')
    }
  }

  const openEditor = (item: TestItem) => {
    setEditingTest(item)
    setMethodologyForm({
      methodology_name: item.methodology?.name ?? '',
      methodology_version: item.methodology?.version ?? '1.0',
      evidence_status: item.methodology?.evidence_status ?? 'educational',
      evidence_source: item.methodology?.source ?? '',
      license_info: item.methodology?.license_info ?? '',
      limitations: item.methodology?.limitations ?? 'Educational exercise metrics only.',
      warnings: item.methodology?.warnings?.join('\n') ?? 'Not a clinical medical diagnosis.',
    })
  }

  const savePassport = async () => {
    if (!editingTest) return
    try {
      await apiRequest(`/admin/tests/${editingTest.id}/methodology`, {
        method: 'PUT',
        body: JSON.stringify({
          methodology_name: methodologyForm.methodology_name,
          methodology_version: methodologyForm.methodology_version,
          evidence_status: methodologyForm.evidence_status,
          evidence_source: methodologyForm.evidence_source || null,
          license_info: methodologyForm.license_info || null,
          limitations: methodologyForm.limitations,
          warnings: methodologyForm.warnings.split('\n').filter(Boolean),
          allowed_languages: ['ru', 'tg', 'en'],
          device_conditions: ['standard display'],
        }),
      })
      onNotify('Methodology passport saved.')
      setEditingTest(null)
      void loadData()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to save passport')
    }
  }

  const generateDraft = async () => {
    if (!draftTopic.trim()) return
    setDraftLoading(true)
    try {
      const res = await apiRequest<{ title: string; content: string; note: string }>('/admin/content/draft', {
        method: 'POST',
        body: JSON.stringify({ topic: draftTopic, content_type: draftType, language: 'ru' }),
      })
      setDraftResult(res)
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to generate draft')
    } finally {
      setDraftLoading(false)
    }
  }

  return (
    <section className="content-card" aria-label="Administrative System Panel">
      <div className="section-heading">
        <h2>Administrative Dashboard</h2>
      </div>

      {dashboard && (
        <div>
          <p style={{ fontSize: '.85rem', color: '#566e63', textAlign: 'left' }}>
            Privacy Mandate: System metrics only. Individual medical test responses and attempts are strictly inaccessible.
          </p>
          <div className="stat-grid">
            <div className="stat-box"><p className="stat-value">{dashboard.total_users}</p><p className="stat-label">Total Users</p></div>
            <div className="stat-box"><p className="stat-value">{dashboard.active_users}</p><p className="stat-label">Active Users</p></div>
            <div className="stat-box"><p className="stat-value">{dashboard.total_categories}</p><p className="stat-label">Categories</p></div>
            <div className="stat-box"><p className="stat-value">{dashboard.total_completed_attempts}</p><p className="stat-label">Completed Checks</p></div>
            <div className="stat-box"><p className="stat-value">{dashboard.total_saved_results}</p><p className="stat-label">Consented Records</p></div>
          </div>
        </div>
      )}

      <div className="admin-section">
        <h3>User Management</h3>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Email</th><th>Role</th><th>Age Group</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td><strong>{u.role}</strong></td>
                  <td>{u.age_group}</td>
                  <td>{u.is_active ? 'Active' : 'Disabled'}</td>
                  <td>
                    <button className="quiet-button" style={{ fontSize: '.8rem', padding: '4px 8px' }} onClick={() => toggleUserActive(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h3>Support Inquiries</h3>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Contact</th><th>Subject</th><th>Status</th><th>Update Status</th></tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.contact_email}</td>
                  <td>{t.subject}</td>
                  <td><strong>{t.status}</strong></td>
                  <td>
                    <select value={t.status} onChange={(e) => updateTicketStatus(t.id, e.target.value)} style={{ padding: '4px 8px' }}>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h3>Catalog Tests</h3>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Check Slug</th><th>Type</th><th>Status</th><th>Guest</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id}>
                  <td><strong>{t.slug}</strong></td>
                  <td>{t.type.replace('_', ' ')}</td>
                  <td><span className={'badge-type badge-' + t.status}>{t.status}</span></td>
                  <td>{t.guest_allowed ? 'Yes' : 'No'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="secondary-button" style={{ fontSize: '.78rem', padding: '4px 6px' }} onClick={() => openEditor(t)}>
                        Edit Passport
                      </button>
                      {t.status !== 'published' && (
                        <button className="secondary-button" style={{ fontSize: '.78rem', padding: '4px 6px' }} onClick={() => publishTest(t.id)}>
                          Publish
                        </button>
                      )}
                      {t.status === 'published' && (
                        <button className="quiet-button" style={{ fontSize: '.78rem', padding: '4px 6px' }} onClick={() => unpublishTest(t.id)}>
                          Draft
                        </button>
                      )}
                      {t.status !== 'blocked' && (
                        <button className="quiet-button" style={{ fontSize: '.78rem', padding: '4px 6px', color: '#b91c1c' }} onClick={() => blockTest(t.id)}>
                          Block
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section" style={{ maxWidth: '600px', margin: '32px auto 0', textAlign: 'left' }}>
        <h3>AI Content Drafting</h3>
        <p style={{ fontSize: '.88rem', color: '#496659' }}>
          Draft non-diagnostic educational content. All AI outputs require administrative review before publication.
        </p>
        <div style={{ display: 'grid', gap: '12px' }}>
          <label>Topic<input type="text" value={draftTopic} onChange={(e) => setDraftTopic(e.target.value)} placeholder="e.g. Cognitive flexibility exercises" /></label>
          <label>Format
            <select value={draftType} onChange={(e) => setDraftType(e.target.value as 'faq' | 'article')}>
              <option value="article">Educational Article</option>
              <option value="faq">FAQ Entry</option>
            </select>
          </label>
          <button disabled={draftLoading || !draftTopic.trim()} onClick={generateDraft}>
            {draftLoading ? 'Generating safe draft...' : 'Generate Review Draft'}
          </button>
        </div>
        {draftResult && (
          <div style={{ background: '#f6fbf8', border: '1px solid #c9ded4', borderRadius: '10px', padding: '16px', marginTop: '20px' }}>
            <h4>{draftResult.title}</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{draftResult.content}</p>
            <p style={{ fontSize: '.8rem', color: '#b45309', fontWeight: 600 }}>Note: {draftResult.note}</p>
          </div>
        )}
      </div>

      {/* Passport Editor Modal */}
      {editingTest && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="section-heading">
              <h2>Edit Passport: {editingTest.slug}</h2>
              <button className="quiet-button" onClick={() => setEditingTest(null)}>Close</button>
            </div>
            <div style={{ display: 'grid', gap: '10px', textAlign: 'left' }}>
              <label>Methodology Name<input type="text" value={methodologyForm.methodology_name} onChange={(e) => setMethodologyForm({ ...methodologyForm, methodology_name: e.target.value })} /></label>
              <label>Evidence Status
                <select value={methodologyForm.evidence_status} onChange={(e) => setMethodologyForm({ ...methodologyForm, evidence_status: e.target.value })}>
                  <option value="educational">Educational (Non-clinical)</option>
                  <option value="digital">Digital Check (Orienting)</option>
                  <option value="validated">Validated Screening (Source required)</option>
                  <option value="pending_review">Pending Review (Blocks publication)</option>
                </select>
              </label>
              <label>Scientific Source Citation<input type="text" value={methodologyForm.evidence_source} onChange={(e) => setMethodologyForm({ ...methodologyForm, evidence_source: e.target.value })} placeholder="Required for validated screening" /></label>
              <label>License Information<input type="text" value={methodologyForm.license_info} onChange={(e) => setMethodologyForm({ ...methodologyForm, license_info: e.target.value })} placeholder="Required for validated screening" /></label>
              <label>Limitations<textarea rows={2} value={methodologyForm.limitations} onChange={(e) => setMethodologyForm({ ...methodologyForm, limitations: e.target.value })} /></label>
              <label>Warnings (one per line)<textarea rows={2} value={methodologyForm.warnings} onChange={(e) => setMethodologyForm({ ...methodologyForm, warnings: e.target.value })} /></label>
            </div>
            <div className="runner-actions">
              <button onClick={savePassport}>Save Methodology Passport</button>
              <button className="secondary-button" onClick={() => setEditingTest(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
