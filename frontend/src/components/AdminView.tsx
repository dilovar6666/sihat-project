import { useEffect, useState } from 'react'
import { apiRequest } from '../api'
import type { AdminDashboard, AdminUser, SupportTicket, TestItem } from '../types'
import type { Translations } from '../i18n'

export function AdminView({
  onNotify,
  t,
  lang = 'en',
}: {
  onNotify: (msg: string) => void
  t: Translations
  lang?: string
}) {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [tests, setTests] = useState<TestItem[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tickets' | 'tests' | 'authoring'>('overview')

  // Methodology Passport Editor modal
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
      const [d, u, tData, tst] = await Promise.all([
        apiRequest<AdminDashboard>('/admin/dashboard'),
        apiRequest<AdminUser[]>('/admin/users'),
        apiRequest<SupportTicket[]>('/admin/support/tickets'),
        apiRequest<TestItem[]>('/admin/tests'),
      ])
      setDashboard(d)
      setUsers(u)
      setTickets(tData)
      setTests(tst)
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Не удалось загрузить данные администрирования')
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
      onNotify(`Пользователь ${user.email} обновлен.`)
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления пользователя')
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updated = await apiRequest<SupportTicket>(`/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setTickets(tickets.map((tk) => (tk.id === updated.id ? updated : tk)))
      onNotify('Статус обращения изменен.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Ошибка обновления тикета')
    }
  }

  const blockTest = async (testId: string) => {
    try {
      const updated = await apiRequest<TestItem>(`/admin/tests/${testId}/block`, { method: 'POST' })
      setTests(tests.map((tItem) => (tItem.id === updated.id ? updated : tItem)))
      onNotify('Модуль заблокирован.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Ошибка блокировки')
    }
  }

  const unpublishTest = async (testId: string) => {
    try {
      const updated = await apiRequest<TestItem>(`/admin/tests/${testId}/unpublish`, { method: 'POST' })
      setTests(tests.map((tItem) => (tItem.id === updated.id ? updated : tItem)))
      onNotify('Модуль переведен в черновик.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Ошибка снятия с публикации')
    }
  }

  const publishTest = async (testId: string) => {
    try {
      const updated = await apiRequest<TestItem>(`/admin/tests/${testId}/publish`, { method: 'POST' })
      setTests(tests.map((tItem) => (tItem.id === updated.id ? updated : tItem)))
      onNotify('Модуль опубликован.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Ошибка публикации')
    }
  }

  const openEditMethodology = (testItem: TestItem) => {
    setEditingTest(testItem)
    setMethodologyForm({
      methodology_name: testItem.methodology?.name ?? '',
      methodology_version: testItem.methodology?.version ?? '1.0',
      evidence_status: testItem.methodology?.evidence_status ?? 'educational',
      evidence_source: testItem.methodology?.source ?? '',
      license_info: testItem.methodology?.license_info ?? '',
      limitations: testItem.methodology?.limitations ?? '',
      warnings: testItem.methodology?.warnings?.join('\n') ?? '',
    })
  }

  const saveMethodology = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTest) return
    try {
      const payload = {
        name: methodologyForm.methodology_name,
        version: methodologyForm.methodology_version,
        evidence_status: methodologyForm.evidence_status,
        source: methodologyForm.evidence_source || undefined,
        license_info: methodologyForm.license_info || undefined,
        limitations: methodologyForm.limitations,
        warnings: methodologyForm.warnings ? methodologyForm.warnings.split('\n').filter(Boolean) : [],
      }
      await apiRequest(`/admin/tests/${editingTest.id}/passport`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      onNotify('Паспорт методики успешно обновлен.')
      setEditingTest(null)
      void loadData()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Ошибка сохранения паспорта')
    }
  }

  const runDrafting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draftTopic.trim()) return
    setDraftLoading(true)
    setDraftResult(null)
    try {
      const res = await apiRequest<{ title: string; content: string; note: string }>('/admin/content/draft', {
        method: 'POST',
        body: JSON.stringify({ topic: draftTopic.trim(), content_type: draftType }),
      })
      setDraftResult(res)
      onNotify('Черновик успешно сгенерирован Gemini AI.')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Ошибка генерации')
    } finally {
      setDraftLoading(false)
    }
  }

  return (
    <section className="content-card admin-console-section" aria-label="Admin Dashboard">
      <div className="section-head-split">
        <div>
          <div className="eyebrow-pill">УПРАВЛЕНИЕ И БЕЗОПАСНОСТЬ</div>
          <h2 className="section-title-large">{lang === 'en' ? 'Administrative Dashboard' : t.admin.title}</h2>
          <p className="section-subtitle">{t.admin.subtitle}</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="admin-nav-bar" role="tablist">
        <button
          type="button"
          className={'admin-tab-btn' + (activeTab === 'overview' ? ' active' : '')}
          onClick={() => setActiveTab('overview')}
          role="tab"
          aria-selected={activeTab === 'overview'}
        >
          📊 {t.admin.tabDashboard}
        </button>
        <button
          type="button"
          className={'admin-tab-btn' + (activeTab === 'users' ? ' active' : '')}
          onClick={() => setActiveTab('users')}
          role="tab"
          aria-selected={activeTab === 'users'}
        >
          👥 {t.admin.tabUsers} ({users.length})
        </button>
        <button
          type="button"
          className={'admin-tab-btn' + (activeTab === 'tickets' ? ' active' : '')}
          onClick={() => setActiveTab('tickets')}
          role="tab"
          aria-selected={activeTab === 'tickets'}
        >
          📨 {t.admin.tabTickets} ({tickets.length})
        </button>
        <button
          type="button"
          className={'admin-tab-btn' + (activeTab === 'tests' ? ' active' : '')}
          onClick={() => setActiveTab('tests')}
          role="tab"
          aria-selected={activeTab === 'tests'}
        >
          🧪 {t.admin.tabTests} ({tests.length})
        </button>
        <button
          type="button"
          className={'admin-tab-btn' + (activeTab === 'authoring' ? ' active' : '')}
          onClick={() => setActiveTab('authoring')}
          role="tab"
          aria-selected={activeTab === 'authoring'}
        >
          ✍️ {t.admin.tabAuthoring}
        </button>
      </div>

      {/* 1. Overview Dashboard */}
      {dashboard && (
        <div className="admin-overview-grid">
          <div className="stat-card">
            <span className="stat-title">{lang === 'en' ? 'Total Users' : t.admin.totalUsers}</span>
            <div className="stat-val">{dashboard.total_users}</div>
          </div>
          <div className="stat-card">
            <span className="stat-title">{lang === 'en' ? 'Active Users' : t.admin.activeUsers}</span>
            <div className="stat-val highlight">{dashboard.active_users}</div>
          </div>
          <div className="stat-card">
            <span className="stat-title">{lang === 'en' ? 'Completed Checks' : t.admin.completedAttempts}</span>
            <div className="stat-val">{dashboard.total_completed_attempts}</div>
          </div>
          <div className="stat-card">
            <span className="stat-title">{lang === 'en' ? 'Consented Records' : t.admin.savedResults}</span>
            <div className="stat-val highlight">{dashboard.total_saved_results}</div>
          </div>
        </div>
      )}

      {/* 2. Users Directory */}
      {(activeTab === 'overview' || activeTab === 'users') && (
        <div className="admin-section-block">
          <h3 className="admin-section-heading">{lang === 'en' ? 'User Directory' : t.admin.tabUsers}</h3>
          <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t.admin.userEmailCol}</th>
                <th>{t.admin.userRoleCol}</th>
                <th>Возрастная группа</th>
                <th>{t.admin.userStatusCol}</th>
                <th>{t.admin.userActionCol}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.email}</strong></td>
                  <td><span className="role-tag">{u.role}</span></td>
                  <td>{u.age_group}</td>
                  <td>
                    <span className={'status-badge ' + (u.is_active ? 'active' : 'inactive')}>
                      {u.is_active ? 'Активен' : 'Отключен'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="quiet-button compact-btn"
                      onClick={() => toggleUserActive(u)}
                    >
                      {u.is_active ? t.admin.deactivateBtn : t.admin.activateBtn}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* 3. Support Tickets */}
      {(activeTab === 'overview' || activeTab === 'tickets') && (
        <div className="admin-section-block">
          <h3 className="admin-section-heading">{lang === 'en' ? 'Support Inquiries' : t.admin.tabTickets}</h3>
          <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email контакта</th>
                <th>Тема</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>{ticket.contact_email}</td>
                  <td>
                    <strong>{ticket.subject}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '.8rem', color: 'var(--text-muted)' }}>
                      {ticket.message}
                    </p>
                  </td>
                  <td>
                    <span className={'status-badge ' + ticket.status}>{ticket.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {ticket.status !== 'resolved' && (
                        <button
                          type="button"
                          className="secondary-button compact-btn"
                          onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                        >
                          Решено
                        </button>
                      )}
                      {ticket.status !== 'in_progress' && (
                        <button
                          type="button"
                          className="quiet-button compact-btn"
                          onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                        >
                          В работе
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
      )}

      {/* 4. Tests & Methodology Passports */}
      {(activeTab === 'overview' || activeTab === 'tests') && (
        <div className="admin-section-block">
          <h3 className="admin-section-heading">{lang === 'en' ? 'Test Catalog & Passports Moderation' : t.admin.tabTests}</h3>
          <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Тип</th>
                <th>Статус публикации</th>
                <th>Доступность</th>
                <th>Методология</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id}>
                  <td>
                    <strong>{test.slug}</strong>
                  </td>
                  <td><span className="badge-type">{test.type}</span></td>
                  <td>
                    <span className={'status-badge ' + (test.status ?? 'draft')}>
                      {test.status ?? 'draft'}
                    </span>
                  </td>
                  <td>{test.guest_allowed ? 'Гость разрешен' : 'Только аккаунт'}</td>
                  <td>
                    {test.methodology ? (
                      <span className="methodology-tag">{test.methodology.name} (v{test.methodology.version})</span>
                    ) : (
                      <span style={{ color: 'var(--text-faint)' }}>Не назначен</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="secondary-button compact-btn"
                        onClick={() => openEditMethodology(test)}
                      >
                        Паспорт
                      </button>
                      {test.status === 'published' ? (
                        <button
                          type="button"
                          className="quiet-button compact-btn"
                          onClick={() => unpublishTest(test.id)}
                        >
                          В черновик
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary-emerald compact-btn"
                          onClick={() => publishTest(test.id)}
                        >
                          Опубликовать
                        </button>
                      )}
                      <button
                        type="button"
                        className="quiet-button compact-btn danger-link"
                        onClick={() => blockTest(test.id)}
                      >
                        Блок
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* 5. Content Authoring (Gemini AI Drafting) */}
      {(activeTab === 'overview' || activeTab === 'authoring') && (
        <div className="admin-section-block">
          <h3 className="admin-section-heading">{lang === 'en' ? 'AI Content Drafting' : t.admin.tabAuthoring}</h3>
          <div className="authoring-container">
          <form onSubmit={runDrafting} className="authoring-form">
            <div className="form-group">
              <label htmlFor="draft-type">Формат контента:</label>
              <select
                id="draft-type"
                value={draftType}
                onChange={(e) => setDraftType(e.target.value as 'faq' | 'article')}
              >
                <option value="article">Статья базы знаний</option>
                <option value="faq">Вопрос-ответ (FAQ)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="draft-topic">Тема для генерации черновика (Gemini AI):</label>
              <input
                id="draft-topic"
                type="text"
                placeholder="например: Профилактика зрительного утомления при работе с кодом"
                value={draftTopic}
                onChange={(e) => setDraftTopic(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary-emerald" disabled={draftLoading}>
              {draftLoading ? 'Генерация через Gemini...' : '✦ Сгенерировать черновик'}
            </button>
          </form>

          {draftResult && (
            <div className="draft-result-box">
              <h3>{draftResult.title}</h3>
              <p className="draft-content">{draftResult.content}</p>
              <p className="draft-note"><em>{draftResult.note}</em></p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Methodology Editor Modal */}
      {editingTest && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="editor-title">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="section-heading">
              <h2 id="editor-title">Редактирование паспорта: {editingTest.slug}</h2>
              <button className="quiet-button" onClick={() => setEditingTest(null)}>✕</button>
            </div>

            <form onSubmit={saveMethodology} className="methodology-edit-form">
              <div className="form-group">
                <label>Название методики:</label>
                <input
                  type="text"
                  value={methodologyForm.methodology_name}
                  onChange={(e) => setMethodologyForm({ ...methodologyForm, methodology_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Версия:</label>
                <input
                  type="text"
                  value={methodologyForm.methodology_version}
                  onChange={(e) => setMethodologyForm({ ...methodologyForm, methodology_version: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Статус доказательности:</label>
                <select
                  value={methodologyForm.evidence_status}
                  onChange={(e) => setMethodologyForm({ ...methodologyForm, evidence_status: e.target.value })}
                >
                  <option value="educational">educational (образовательный)</option>
                  <option value="digital">digital (цифровой скрининг)</option>
                  <option value="experimental">experimental (экспериментальный)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Научный источник:</label>
                <input
                  type="text"
                  value={methodologyForm.evidence_source}
                  onChange={(e) => setMethodologyForm({ ...methodologyForm, evidence_source: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Ограничения методики:</label>
                <textarea
                  rows={3}
                  value={methodologyForm.limitations}
                  onChange={(e) => setMethodologyForm({ ...methodologyForm, limitations: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Предупреждения (по одному на строку):</label>
                <textarea
                  rows={3}
                  value={methodologyForm.warnings}
                  onChange={(e) => setMethodologyForm({ ...methodologyForm, warnings: e.target.value })}
                />
              </div>

              <div className="runner-actions">
                <button type="submit" className="btn-primary-emerald">Сохранить паспорт</button>
                <button type="button" className="secondary-button" onClick={() => setEditingTest(null)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
