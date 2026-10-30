import LoadError from '../components/LoadError'
import { useState, useCallback, useMemo, useEffect } from 'react'
import useFadeOnScroll from '../hooks/useFadeOnScroll'
import useFadeNearHeader from '../hooks/useFadeNearHeader'
import useScrollToMiddle from '../hooks/useScrollToMiddle'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Seo from '../components/Seo'
import { getBottles } from '../utils/dataProvider'
import { previewBottles } from '../mockData/previewBottles'
import { Link, useSearchParams } from 'react-router-dom'
import '../dryck.css'
import '../aktuellt.css'

function DrinkCard({ item }) {
  const [expanded, setExpanded] = useState(false)

  // Determine if we have extra info to show
  // (We show a few fields in summary, rest in details)
  const hasDetails = true

  return (
    <li className={`dryck-item ${expanded ? 'expanded' : ''}`}>
      <div
        className="dryck-item-header"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Stäng detaljer för' : 'Visa mer info om'} ${item.namn}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded)
        }}
      >
        <div className="dryck-info-left">
          <div className="dryck-name">{item.namn}</div>
          <div className="dryck-meta">
            {item.ålder}{' '}
            {item.ålder !== 'NAS' &&
            item.ålder !== 'blend' &&
            !item.ålder.includes('år')
              ? 'år'
              : ''}{' '}
            • {item.procent} • {item.pris} kr/cl
          </div>
        </div>
        <div className="dryck-info-right">
          <span
            className={`dryck-more-chevron ${expanded ? 'open' : ''}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {expanded && (
        <div className="dryck-details-panel">
          <div className="dryck-details-grid">
            {item.fat && (
              <div className="detail-row">
                <span className="detail-label">Fat:</span>
                <span className="detail-value">{item.fat}</span>
              </div>
            )}
            {item.rökighet && (
              <div className="detail-row">
                <span className="detail-label">Rökighet:</span>
                <span className="detail-value">{item.rökighet}</span>
              </div>
            )}
            {item.destilleri && (
              <div className="detail-row">
                <span className="detail-label">Destilleri:</span>
                <span className="detail-value">{item.destilleri}</span>
              </div>
            )}
            {item.stil && (
              <div className="detail-row">
                <span className="detail-label">Stil:</span>
                <span className="detail-value">{item.stil}</span>
              </div>
            )}
            {item.importör && (
              <div className="detail-row">
                <span className="detail-label">Importör:</span>
                <span className="detail-value">{item.importör}</span>
              </div>
            )}
            {item.region && (
              <div className="detail-row detail-region-land">
                <span className="detail-label">Region/Land:</span>
                <span className="detail-value">
                  {item.region}, {item.land}
                </span>
              </div>
            )}
            {item.buteljerad && (
              <div className="detail-row detail-bottled-year">
                <span className="detail-label">Buteljerad:</span>
                <span className="detail-value">{item.buteljerad}</span>
              </div>
            )}
            {item.buteljerare && (
              <div className="detail-row detail-bottler">
                <span className="detail-label">Buteljerare:</span>
                <span className="detail-value">{item.buteljerare}</span>
              </div>
            )}
            {item.fritext && (
              <div className="detail-row detail-more-info">
                <span className="detail-label">Mer info:</span>
                <span className="detail-value">{item.fritext}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

function getItemSearchString(item) {
  return [
    item.namn,
    item.ålder,
    item.procent,
    item.fat,
    item.rökighet,
    item.destilleri,
    item.region,
    item.land,
    item.importör,
    item.buteljerad,
    item.fritext,
    item.buteljerare,
    item.stil,
    item.pris,
  ]
    .map((val) => (val || '').toString().toLowerCase())
    .join(' ')
}

function parseAge(ageStr) {
  if (!ageStr) return null
  const match = String(ageStr ?? '').match(/(\d+)/)
  return match ? parseInt(match[0], 10) : null
}

// Stil and Destilleri are the facets guests reach for first when
// browsing a whisky/rom-lista, so they lead the accordion. Ålder,
// Rökighet and Fat are finer-grained narrowing filters for someone
// who already has a shortlist, so they sit further down.
const FILTER_CATEGORY_ORDER = [
  'Stil',
  'Destilleri',
  'Land & Region',
  'Ålder',
  'Rökighet',
  'Fat',
]

const getUniqueTags = (items) => {
  const categories = {
    Ålder: new Set(),
    'Land & Region': new Set(),
    Stil: new Set(),
    Rökighet: new Set(),
    Fat: new Set(),
    Destilleri: new Set(),
  }

  items.forEach((item) => {
    // Land & Region
    if (item.region) categories['Land & Region'].add(item.region)
    if (item.land) categories['Land & Region'].add(item.land)

    // Stil
    if (item.stil) categories['Stil'].add(item.stil)

    // Rökighet
    if (item.rökighet) categories['Rökighet'].add(item.rökighet)

    // Destilleri
    if (item.destilleri) categories['Destilleri'].add(item.destilleri)

    // Fat (cask)
    if (item.fat) {
      item.fat.split('&').forEach((f) => categories['Fat'].add(f.trim()))
    }

    // Ålder
    const age = parseAge(item.ålder)
    if (age !== null) {
      if (age <= 10) categories['Ålder'].add('0-10 år')
      else if (age <= 15) categories['Ålder'].add('11-15 år')
      else if (age <= 20) categories['Ålder'].add('16-20 år')
      else categories['Ålder'].add('21+ år')
    } else if (item.ålder === 'NAS') {
      categories['Ålder'].add('NAS')
    }
  })

  // Convert Sets to sorted Arrays
  // Custom sorting for specific categories if needed (like Age)
  const result = {}

  // Sort age logic
  const ageOrder = ['0-10 år', '11-15 år', '16-20 år', '21+ år', 'NAS']
  result['Ålder'] = Array.from(categories['Ålder']).sort((a, b) => {
    return ageOrder.indexOf(a) - ageOrder.indexOf(b)
  })

  // Sort others alphabetically
  const otherKeys = [
    'Land & Region',
    'Stil',
    'Rökighet',
    'Fat',
    'Destilleri',
  ]
  otherKeys.forEach((key) => {
    result[key] = Array.from(categories[key]).sort()
  })

  return result
}

export default function App() {
  useFadeOnScroll()
  useFadeNearHeader()
  useScrollToMiddle()
  const [searchParams] = useSearchParams()
  const [loadError, setLoadError] = useState(false)
  const [data, setData] = useState({ whiskey: [], rums: [] })

  useEffect(() => {
    getBottles()
      .then(setData)
      .catch(() => {
        if (import.meta.env.VITE_USE_MOCK_DATA === 'true') setData(previewBottles)
        else setLoadError(true)
      })
  }, [])

  const { whiskey = [], rums = [] } = data || {}
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const requestedCategory = searchParams.get('category')

  // 'Alla' doesn't exist as a mobile toggle, so an explicit
  // ?category=all deep link on mobile falls through to the same
  // default as no category at all.
  const [categoryFilter, setCategoryFilter] = useState(() => {
    if (requestedCategory === 'whiskey' || requestedCategory === 'rom') {
      return requestedCategory
    }
    return window.innerWidth <= 800 ? 'whiskey' : 'all'
  }) // 'all' | 'whiskey' | 'rom'
  const [selectedTags, setSelectedTags] = useState([])

  // Collapsible state for <800px view
  const [whiskeyOpen, setWhiskeyOpen] = useState(true)
  const [rumOpen, setRumOpen] = useState(true)

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 800)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 800)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Only an explicit ?category= in the URL should override the
  // user's current selection after mount — a resize shouldn't yank
  // someone back to a default mid-session.
  useEffect(() => {
    if (requestedCategory === 'whiskey' || requestedCategory === 'rom') {
      setCategoryFilter(requestedCategory)
    }
  }, [requestedCategory])

  const allTags = useMemo(() => {
    const allItems = [...(whiskey || []), ...(rums || [])]
    return getUniqueTags(allItems)
  }, [whiskey, rums])

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const matchTags = useCallback((item) => {
    if (selectedTags.length === 0) return true

    return selectedTags.every((tag) => {
      // Age Range Logic
      if (tag.includes('år') && (tag.includes('-') || tag.includes('+'))) {
        const age = parseAge(item.ålder)
        if (age === null) return false
        if (tag === '0-10 år') return age <= 10
        if (tag === '11-15 år') return age > 10 && age <= 15
        if (tag === '16-20 år') return age > 15 && age <= 20
        if (tag === '21+ år') return age > 20
        // Fallback if tag format matches but logic missed
        return false
      }

      // Check standard properties (Exact Match)
      const exactProps = [
        item.region,
        item.land,
        item.stil,
        item.destilleri,
        item.rökighet,
        item.ålder, // matches 'NAS'
      ]
      if (exactProps.includes(tag)) return true

      // Check Fat (Split Match)
      if (item.fat) {
        const fats = item.fat.split('&').map((f) => f.trim())
        if (fats.includes(tag)) return true
      }

      return false
    })
  }, [selectedTags])

  const filteredWhiskey = useMemo(() => {
    const q = search.trim().toLowerCase()
    return whiskey.filter((w) => {
      const searchStr = getItemSearchString(w)
      const searchStrNoSpace = searchStr.replace(/\s+/g, '')
      const matchesSearch =
        !q ||
        q
          .split(/\s+/)
          .every(
            (term) =>
              searchStr.includes(term) || searchStrNoSpace.includes(term)
          )
      const matchesTags = matchTags(w)
      return matchesSearch && matchesTags
    })
  }, [search, whiskey, matchTags])

  const filteredRums = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rums.filter((r) => {
      const searchStr = getItemSearchString(r)
      const searchStrNoSpace = searchStr.replace(/\s+/g, '')
      const matchesSearch =
        !q ||
        q
          .split(/\s+/)
          .every(
            (term) =>
              searchStr.includes(term) || searchStrNoSpace.includes(term)
          )
      const matchesTags = matchTags(r)
      return matchesSearch && matchesTags
    })
  }, [search, rums, matchTags])

  const isFiltered = Boolean(search.trim()) || selectedTags.length > 0

  return (
    <div className="app-root">
      <Seo
        title="Dryck – ett stort utbud av whisky i Kungälv"
        description="Utforska August Bistros dryckesutbud i Kungälv med ett stort utbud av whisky, ett brett urval av rom och exklusiva drycker för whisky- och cocktailälskare i Göteborgsområdet."
        keywords="dryck Kungälv, whiskylista, whiskybar, ett stort utbud av whisky, August Bistro"
      />
      <Header />
      <main>
      {loadError && <LoadError message="Kunde inte ladda dryckeslistan." />}

      <section className="dryck-page-section" id="dryck-section">
        <div className="dryck-content-wrapper">
          <div className="dryck-content-container">
            <div className="dryck-intro">
              <h1>
                {categoryFilter === 'whiskey' && 'Whiskey'}
                {categoryFilter === 'rom' && 'Rom'}
                {categoryFilter === 'all' && <>Whiskey &amp; Rom</>}
              </h1>
              {categoryFilter === 'whiskey' && (
                <p>
                  Utforska vårt noggrant utvalda sortiment av whiskey,
                  eller boka en av våra uppskattade provningar.
                </p>
              )}
              {categoryFilter === 'rom' && (
                <p>
                  Utforska vårt noggrant utvalda sortiment av rom, eller
                  boka en av våra uppskattade provningar.
                </p>
              )}
              {categoryFilter === 'all' && (
                <p>
                  Utforska vårt noggrant utvalda sortiment av whiskey och
                  rom, eller boka en av våra uppskattade provningar.
                </p>
              )}
              <Link
                to="/dryckesprovningar"
                className="btn CTA_btn dryck-cta"
              >
                Boka provning
              </Link>
            </div>

            <div id="catalogue" />

            {/* Top Bar inside content logic */}
            <div className="dryck-top-bar">
              <div className="dryck-top-row dryck-browse-row">
                <div className="category-toggles">
                  {!isMobile && (
                    <button
                      type="button"
                      className={`cat-btn ${
                        categoryFilter === 'all' ? 'active' : ''
                      }`}
                      aria-pressed={categoryFilter === 'all'}
                      onClick={() => setCategoryFilter('all')}
                    >
                      Alla
                    </button>
                  )}
                  <button
                    type="button"
                    className={`cat-btn ${
                      categoryFilter === 'whiskey' ? 'active' : ''
                    }`}
                    aria-pressed={categoryFilter === 'whiskey'}
                    onClick={() => setCategoryFilter('whiskey')}
                  >
                    Whiskey
                  </button>
                  <button
                    type="button"
                    className={`cat-btn ${
                      categoryFilter === 'rom' ? 'active' : ''
                    }`}
                    aria-pressed={categoryFilter === 'rom'}
                    onClick={() => setCategoryFilter('rom')}
                  >
                    Rom
                  </button>
                </div>

                <div className="search-wrap">
                  <input
                    type="text"
                    placeholder="Sök dryck..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearch('')}
                      aria-label="Rensa sökning"
                    >
                      ✕
                    </button>
                  )}
                  <span className="search-icon">🔍</span>
                </div>

                <button
                  type="button"
                  className={`filter-btn ${showFilter ? 'active' : ''}`}
                  onClick={() => setShowFilter(!showFilter)}
                  aria-expanded={showFilter}
                  aria-controls="dryck-filter-panel"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  Filter{' '}
                  {selectedTags.length > 0 && `(${selectedTags.length})`}
                </button>
              </div>

              {(search.trim() || selectedTags.length > 0) && (
                <div className="active-filters-row" aria-label="Aktiva filter">
                  <span className="active-filters-label">Aktiva filter:</span>
                  {search.trim() && (
                    <button
                      className="active-filter-chip"
                      onClick={() => setSearch('')}
                    >
                      &ldquo;{search.trim()}&rdquo;{' '}
                      <span aria-hidden="true">✕</span>
                    </button>
                  )}
                  {selectedTags.map((tag) => (
                    <button
                      key={tag}
                      className="active-filter-chip"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag} <span aria-hidden="true">✕</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className="clear-filter-btn"
                    onClick={() => {
                      setSelectedTags([])
                      setSearch('')
                    }}
                  >
                    Rensa alla filter
                  </button>
                </div>
              )}
            </div>

            <div
              id="dryck-filter-panel"
              className={`filter-tags-container ${showFilter ? 'open' : ''}`}
              aria-hidden={!showFilter}
              inert={!showFilter}
            >
              {FILTER_CATEGORY_ORDER.map((category) => {
                const tags = allTags[category]
                if (!tags || tags.length === 0) return null
                return (
                  <div key={category} className="filter-category-group">
                    <h2 className="filter-category-title">
                      {category}
                      <span className="filter-category-count">
                        {tags.length}
                      </span>
                    </h2>
                    <div className="tags-wrapper">
                      {tags.map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          className={`filter-tag ${
                            selectedTags.includes(tag) ? 'active' : ''
                          }`}
                          onClick={() => toggleTag(tag)}
                          aria-pressed={selectedTags.includes(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {categoryFilter === 'whiskey' && (
              <h2 className="dryck-cat-title">
                Whiskey <span className="dryck-cat-count">{whiskey.length}</span>
                {isFiltered && (
                  <span className="dryck-cat-filtered">
                    Visar {filteredWhiskey.length}
                  </span>
                )}
              </h2>
            )}
            {categoryFilter === 'rom' && (
              <h2 className="dryck-cat-title">
                Rom <span className="dryck-cat-count">{rums.length}</span>
                {isFiltered && (
                  <span className="dryck-cat-filtered">
                    Visar {filteredRums.length}
                  </span>
                )}
              </h2>
            )}

            <div
              className={`dryck-container-flex view-mode-list ${
                categoryFilter !== 'all' ? 'single-category' : ''
              }`}
            >
              {categoryFilter === 'all' && (
                <>
                  <div className="dryck-column">
                    <h2 className="dryck-category-heading"><button type="button"
                      className={`dryck-cat-title ${whiskeyOpen ? 'open' : ''} collapsible`}
                      onClick={() => setWhiskeyOpen(!whiskeyOpen)}
                      aria-expanded={whiskeyOpen}
                    >
                      Whiskey{' '}
                      <span className="dryck-cat-count">
                        {whiskey.length}
                      </span>
                      {isFiltered && (
                        <span className="dryck-cat-filtered">
                          Visar {filteredWhiskey.length}
                        </span>
                      )}
                    </button></h2>
                    <div
                      inert={!whiskeyOpen}
                      className={`dryck-column-content ${whiskeyOpen ? 'open' : 'closed'}`}
                    >
                      <ul className="dryck-list">
                        {filteredWhiskey.map((item) => (
                          <DrinkCard key={item.id} item={item} />
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="dryck-column">
                    <h2 className="dryck-category-heading"><button type="button"
                      className={`dryck-cat-title ${rumOpen ? 'open' : ''} collapsible`}
                      onClick={() => setRumOpen(!rumOpen)}
                      aria-expanded={rumOpen}
                    >
                      Rom{' '}
                      <span className="dryck-cat-count">{rums.length}</span>
                      {isFiltered && (
                        <span className="dryck-cat-filtered">
                          Visar {filteredRums.length}
                        </span>
                      )}
                    </button></h2>
                    <div
                      inert={!rumOpen}
                      className={`dryck-column-content ${rumOpen ? 'open' : 'closed'}`}
                    >
                      <ul className="dryck-list">
                        {filteredRums.map((item) => (
                          <DrinkCard key={item.id} item={item} />
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {categoryFilter === 'whiskey' && (
                <>
                  <div
                    className={`dryck-column ${
                      filteredWhiskey.length > 1 ? 'has-continuation' : ''
                    }`}
                  >
                    <ul className="dryck-list">
                      {filteredWhiskey
                        .slice(0, Math.ceil(filteredWhiskey.length / 2))
                        .map((item) => (
                          <DrinkCard key={item.id} item={item} />
                        ))}
                    </ul>
                  </div>
                  <div className="dryck-column">
                    <ul className="dryck-list">
                      {filteredWhiskey
                        .slice(Math.ceil(filteredWhiskey.length / 2))
                        .map((item) => (
                          <DrinkCard key={item.id} item={item} />
                        ))}
                    </ul>
                  </div>
                </>
              )}

              {categoryFilter === 'rom' && (
                <>
                  <div
                    className={`dryck-column ${
                      filteredRums.length > 1 ? 'has-continuation' : ''
                    }`}
                  >
                    <ul className="dryck-list">
                      {filteredRums
                        .slice(0, Math.ceil(filteredRums.length / 2))
                        .map((item) => (
                          <DrinkCard key={item.id} item={item} />
                        ))}
                    </ul>
                  </div>
                  <div className="dryck-column">
                    <ul className="dryck-list">
                      {filteredRums
                        .slice(Math.ceil(filteredRums.length / 2))
                        .map((item) => (
                          <DrinkCard key={item.id} item={item} />
                        ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  )
}
