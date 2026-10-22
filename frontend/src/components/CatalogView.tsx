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
  initialCategory = 'all',
}: {
  token: string
  onStartTest: (test: TestItem) => void
  t: Translations
  lang?: Language
  initialQuery?: string
  initialCategory?: string
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [tests, setTests] = useState<TestItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [ageFilter, setAgeFilter] = useState<number | ''>('')
  const [selectedTestModal, setSelectedTestModal] = useState<TestItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory)
    }
  }, [initialCategory])

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
    return item.localizations[lang]?.title ?? item.localizations.ru?.title ?? item.localizations.en?.title ?? item.slug
  }

  const getTestDesc = (item: TestItem) => {
    return item.localizations[lang]?.description ?? item.localizations.ru?.description ?? item.localizations.en?.description ?? t.catalog.subtitle
  }

  const getCategoryTitle = (cat: Category) => {
    return cat.localizations[lang]?.title ?? cat.localizations.ru?.title ?? cat.localizations.en?.title ?? cat.slug
  }

  return (
    <section className="catalog-section" aria-label="Tests and Questionnaires Catalog">
      {/* Editorial Header */}
      <div className="section-head-split">
        <div>
          <div className="eyebrow-pill">{t.disciplines.badge}</div>
          <h2 className="section-title-large">{t.catalog.title}</h2>
          <p className="section-subtitle">{t.catalog.subtitle}</p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="catalog-filters">
        <div className="search-box">
          <input
            type="search"
            placeholder={t.catalog.searchLabel}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search checks"
          />
        </div>
        <div className="age-select-box">
          <label htmlFor="catalog-age-select" className="sr-only">{t.catalog.ageFilterLabel}</label>
          <select
            id="catalog-age-select"
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value ? Number(e.target.value) : '')}
            aria-label="Filter by Age"
          >
            <option value="">{t.catalog.ageAll}</option>
            <option value="16">{t.catalog.age1617}</option>
            <option value="18">{t.catalog.age18}</option>
          </select>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="category-pills" role="tablist" aria-label="Filter by Category">
        <button
          className={'cat-pill' + (selectedCategory === 'all' ? ' active' : '')}
          onClick={() => setSelectedCategory('all')}
          role="tab"
          aria-selected={selectedCategory === 'all'}
        >
          {t.catalog.allCategories}
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

      {loading && <p className="loading-state" aria-live="polite">Загрузка каталога...</p>}
      {error && <p className="message" role="alert">{error}</p>}

      {/* Grid of Tests */}
      <div className="activity-grid">
        {tests.map((test) => (
          <article key={test.id} className="test-card">
            <div className="test-card-top">
              <span className={'badge-type badge-' + test.type}>{test.type.replace('_', ' ')}</span>
              {test.guest_allowed ? (
                <span className="badge-guest">{t.catalog.guestAllowed}</span>
              ) : (
                <span className="badge-auth">{t.catalog.authRequired}</span>
              )}
            </div>
            
            <h3 className="test-card-heading">{getTestTitle(test)}</h3>
            <p className="test-card-description">{getTestDesc(test)}</p>
            
            <div className="test-card-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedTestModal(test)}
              >
                {lang === 'en' ? 'Methodology Passport' : t.catalog.passportBtn}
              </button>
              <button
                type="button"
                className="btn-primary-emerald"
                style={{ padding: '8px 16px', fontSize: '.88rem' }}
                onClick={() => onStartTest(test)}
              >
                {t.catalog.startBtn}
              </button>
            </div>
          </article>
        ))}

        {!loading && tests.length === 0 && (
          <div className="empty-catalog-card" style={{ gridColumn: '1 / -1' }}>
            <p className="empty-text">{t.catalog.noTests}</p>
          </div>
        )}
      </div>

      {/* Methodology Passport Modal */}
      {selectedTestModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="passport-title">
          <div className="modal-content passport-modal-content">
            <div className="section-heading">
              <h2 id="passport-title">{getTestTitle(selectedTestModal)} — {t.passportModal.title}</h2>
              <button type="button" className="quiet-button" onClick={() => setSelectedTestModal(null)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="passport-details">
              <div className="passport-row">
                <strong>Формат:</strong>
                <span className={'badge-type badge-' + selectedTestModal.type}>{selectedTestModal.type.replace('_', ' ')}</span>
              </div>
              <div className="passport-row">
                <strong>Возрастные требования:</strong>
                <span>{selectedTestModal.min_age}+ лет</span>
              </div>

              {selectedTestModal.methodology ? (
                <>
                  <div className="passport-row">
                    <strong>Методика:</strong>
                    <span>{selectedTestModal.methodology.name} (v{selectedTestModal.methodology.version})</span>
                  </div>
                  <div className="passport-row">
                    <strong>{t.passportModal.evidence}:</strong>
                    <span className={'badge-type badge-' + selectedTestModal.methodology.evidence_status}>
                      {selectedTestModal.methodology.evidence_status}
                    </span>
                  </div>
                  {selectedTestModal.methodology.source && (
                    <div className="passport-row">
                      <strong>{t.passportModal.scientificSource}:</strong>
                      <span>{selectedTestModal.methodology.source}</span>
                    </div>
                  )}
                  {selectedTestModal.methodology.license_info && (
                    <div className="passport-row">
                      <strong>{t.passportModal.license}:</strong>
                      <span>{selectedTestModal.methodology.license_info}</span>
                    </div>
                  )}
                  {selectedTestModal.methodology.device_conditions && selectedTestModal.methodology.device_conditions.length > 0 && (
                    <div className="passport-row">
                      <strong>{t.passportModal.deviceRestrictions}:</strong>
                      <span>{selectedTestModal.methodology.device_conditions.join(', ')}</span>
                    </div>
                  )}
                  <div className="passport-row">
                    <strong>{t.passportModal.methodLimitations}:</strong>
                    <span>{selectedTestModal.methodology.limitations}</span>
                  </div>
                  {selectedTestModal.methodology.warnings && selectedTestModal.methodology.warnings.length > 0 && (
                    <div className="passport-warnings-box">
                      <strong>{t.passportModal.medicalWarnings}:</strong>
                      <ul>
                        {selectedTestModal.methodology.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p>Паспорт методики формируется научным комитетом.</p>
              )}
            </div>

            <div className="runner-actions">
              <button
                type="button"
                className="btn-primary-emerald"
                onClick={() => {
                  const tst = selectedTestModal;
                  setSelectedTestModal(null);
                  onStartTest(tst);
                }}
              >
                {t.passportModal.startCheckBtn}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedTestModal(null)}
              >
                {lang === 'en' ? 'Dismiss' : t.passportModal.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
