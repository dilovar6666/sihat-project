import { useEffect, useState } from 'react'
import { apiRequest } from '../api'
import type { Category, TestItem } from '../types'
import type { Translations, Language } from '../i18n'

export function CatalogView({
  token,
  onStartTest,
  t,
  lang = 'ru',
  initialQuery = '',
}: {
  token: string
  onStartTest: (test: TestItem) => void
  t?: Translations
  lang?: Language
  initialQuery?: string
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [tests, setTests] = useState<TestItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [ageFilter, setAgeFilter] = useState<number | ''>('')
  const [selectedTestModal, setSelectedTestModal] = useState<TestItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialQuery && initialQuery !== searchQuery) {
      setSearchQuery(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    apiRequest<Category[]>('/categories')
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    if (searchQuery.trim().length >= 2) params.set('query', searchQuery.trim())
    if (ageFilter !== '') params.set('age', String(ageFilter))

    const url = `/tests${params.toString() ? `?${params.toString()}` : ''}`
    apiRequest<TestItem[]>(url)
      .then((items) => {
        setTests(items)
        setError('')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedCategory, searchQuery, ageFilter, token])

  const getTestTitle = (item: TestItem) => {
    return item.localizations[lang]?.title ?? item.localizations.en?.title ?? item.localizations.ru?.title ?? item.slug
  }

  const getTestDesc = (item: TestItem) => {
    return item.localizations[lang]?.description ?? item.localizations.en?.description ?? item.localizations.ru?.description ?? 'Structured health screening questionnaire.'
  }

  const getCategoryTitle = (cat: Category) => {
    return cat.localizations[lang]?.title ?? cat.localizations.en?.title ?? cat.localizations.ru?.title ?? cat.slug
  }

  return (
    <section className="catalog-section" aria-label="Tests and Questionnaires Catalog">
      <div className="section-heading">
        <h2>{t ? t.catalog.title : 'Health Checks and Educational Catalog'}</h2>
      </div>
      <p className="exercise-instruction">
        {t ? t.catalog.subtitle : 'Browse validated self-reflection questionnaires, oriented digital checks, and educational exercises. SIHAT checks do not diagnose conditions or replace clinical evaluation.'}
      </p>

      {/* Filter and Search controls */}
      <div className="catalog-filters">
        <div className="search-box">
          <input
            type="search"
            placeholder={t ? t.catalog.searchLabel : 'Search checks by title...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search checks"
          />
        </div>
        <div className="age-select-box">
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value ? Number(e.target.value) : '')}
            aria-label="Filter by Age"
          >
            <option value="">{t ? t.catalog.ageAll : 'All Age Groups'}</option>
            <option value="16">{t ? t.catalog.age1617 : 'Age 16+'}</option>
            <option value="18">{t ? t.catalog.age18 : 'Age 18+'}</option>
          </select>
        </div>
      </div>

      <div className="category-pills" role="tablist" aria-label="Filter by Category">
        <button
          className={'cat-pill' + (selectedCategory === 'all' ? ' active' : '')}
          onClick={() => setSelectedCategory('all')}
          role="tab"
          aria-selected={selectedCategory === 'all'}
        >
          {t ? t.catalog.allCategories : 'All Categories'}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={'cat-pill' + (selectedCategory === cat.slug ? ' active' : '')}
            onClick={() => setSelectedCategory(cat.slug)}
            role="tab"
            aria-selected={selectedCategory === cat.slug}
          >
            {getCategoryTitle(cat)}
          </button>
        ))}
      </div>

      {loading && <p>Loading checks...</p>}
      {error && <p className="message">{error}</p>}

      <div className="activity-grid" style={{ marginTop: '24px' }}>
        {tests.map((test) => (
          <article key={test.id} className="test-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <span className={'badge-type badge-' + test.type}>{test.type.replace('_', ' ')}</span>
              {test.guest_allowed ? (
                <span className="badge-guest">{t ? t.catalog.guestAllowed : 'Guest OK'}</span>
              ) : (
                <span className="badge-auth">{t ? t.catalog.authRequired : 'Account required'}</span>
              )}
            </div>
            <h3>{getTestTitle(test)}</h3>
            <p>{getTestDesc(test)}</p>
            <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="secondary-button" style={{ fontSize: '.85rem', padding: '6px 10px' }} onClick={() => setSelectedTestModal(test)}>
                Methodology Passport
              </button>
              <button style={{ fontSize: '.85rem', padding: '6px 12px' }} onClick={() => onStartTest(test)}>
                {t ? t.catalog.startBtn : 'Start Check'}
              </button>
            </div>
          </article>
        ))}
        {!loading && tests.length === 0 && (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t ? t.catalog.noTests : 'No published checks found matching your criteria.'}
          </p>
        )}
      </div>

      {/* Methodology Passport Modal */}
      {selectedTestModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="passport-title">
          <div className="modal-content">
            <div className="section-heading">
              <h2 id="passport-title">{getTestTitle(selectedTestModal)} — Methodology</h2>
              <button className="quiet-button" onClick={() => setSelectedTestModal(null)}>Close</button>
            </div>
            <div className="passport-details">
              <p><strong>Type:</strong> {selectedTestModal.type.replace('_', ' ')}</p>
              <p><strong>Minimum Age:</strong> {selectedTestModal.min_age}+</p>
              {selectedTestModal.methodology ? (
                <>
                  <p><strong>Methodology:</strong> {selectedTestModal.methodology.name} (v{selectedTestModal.methodology.version})</p>
                  <p><strong>Evidence Status:</strong> <span className={'badge-type badge-' + selectedTestModal.methodology.evidence_status}>{selectedTestModal.methodology.evidence_status}</span></p>
                  {selectedTestModal.methodology.source && (
                    <p><strong>Scientific Source:</strong> {selectedTestModal.methodology.source}</p>
                  )}
                  {selectedTestModal.methodology.license_info && (
                    <p><strong>License Terms:</strong> {selectedTestModal.methodology.license_info}</p>
                  )}
                  {selectedTestModal.methodology.device_conditions && selectedTestModal.methodology.device_conditions.length > 0 && (
                    <p><strong>Recommended Device Conditions:</strong> {selectedTestModal.methodology.device_conditions.join(', ')}</p>
                  )}
                  <p><strong>Limitations:</strong> {selectedTestModal.methodology.limitations}</p>
                  {selectedTestModal.methodology.warnings.length > 0 && (
                    <div>
                      <strong>Critical Disclaimers:</strong>
                      <ul>
                        {selectedTestModal.methodology.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p>Passport metadata is being compiled by medical editors.</p>
              )}
            </div>
            <div className="runner-actions">
              <button onClick={() => { const tst = selectedTestModal; setSelectedTestModal(null); onStartTest(tst) }}>
                Start this check
              </button>
              <button className="secondary-button" onClick={() => setSelectedTestModal(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
