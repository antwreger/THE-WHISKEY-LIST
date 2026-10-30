// Reused from August-2.0/src/pages/Dryck.jsx. List/search/filter logic unchanged.
// Only site chrome, booking link, SEO and decorative scroll hooks omitted for the local demo.
import { useState, useMemo, useEffect } from 'react'







import { getBottles } from '../utils/dataProvider'
import { useSearchParams } from 'react-router-dom'
import '../dryck.css'


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
          <span className="dryck-more-link">
            {expanded ? 'Stäng' : 'Mer info'}
          </span>
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
  const match = ageStr.match(/(\d+)/)
  return match ? parseInt(match[0], 10) : null
}

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
  const [searchParams] = useSearchParams()
  const [data, setData] = useState({ whiskey: [], rums: [] })

  useEffect(() => {
    getBottles()
      .then(setData)
      .catch(() => {
        setData({ whiskey: [], rums: [] })
      })
  }, [])

  const { whiskey = [], rums = [] } = data || {}
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const requestedCategory = searchParams.get('category')
  const validCategoryFilter =
    requestedCategory === 'whiskey' || requestedCategory === 'rom'
      ? requestedCategory
      : 'all'
  const [categoryFilter, setCategoryFilter] = useState(validCategoryFilter) // 'all' | 'whiskey' | 'rom'
  const [selectedTags, setSelectedTags] = useState([])

  // Collapsible state for <800px view
  const [whiskeyOpen, setWhiskeyOpen] = useState(true)
  const [rumOpen, setRumOpen] = useState(true)

  const isMobile = window.innerWidth <= 800 // Initial check, dynamic toggle handled by CSS+User Interaction mainly

  useEffect(() => {
    setCategoryFilter(validCategoryFilter)
  }, [validCategoryFilter])

  const allTags = useMemo(() => {
    const allItems = [...(whiskey || []), ...(rums || [])]
    return getUniqueTags(allItems)
  }, [whiskey, rums])

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const matchTags = (item) => {
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
  }

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
  }, [search, whiskey, selectedTags])

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
  }, [search, rums, selectedTags])

  return (
    <div className="app-root">

      <section className="dryck-page-section" id="dryck-section">
        <div className="dryck-content-wrapper">
          <div className="dryck-content-container">
            {/* Top Bar inside content logic */}
            <div className="dryck-top-bar">
              <div className="controls-left">
                <button
                  className={`filter-btn ${showFilter ? 'active' : ''}`}
                  onClick={() => setShowFilter(!showFilter)}
                >
                  Filter{' '}
                  {selectedTags.length > 0 && `(${selectedTags.length})`}
                </button>

                <div className="category-toggles">
                  <button
                    className={`cat-btn ${
                      categoryFilter === 'all' ? 'active' : ''
                    }`}
                    onClick={() => setCategoryFilter('all')}
                  >
                    Alla
                  </button>
                  <button
                    className={`cat-btn ${
                      categoryFilter === 'whiskey' ? 'active' : ''
                    }`}
                    onClick={() => setCategoryFilter('whiskey')}
                  >
                    Whiskey
                  </button>
                  <button
                    className={`cat-btn ${
                      categoryFilter === 'rom' ? 'active' : ''
                    }`}
                    onClick={() => setCategoryFilter('rom')}
                  >
                    Rom
                  </button>
                </div>
              </div>

              <div className="search-wrap">
                <input
                  type="text"
                  placeholder="Sök dryck..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <span className="search-icon">🔍</span>
              </div>

              <button
                className="clear-filter-btn"
                onClick={() => setSelectedTags([])}
                disabled={selectedTags.length === 0}
              >
                Rensa alla filter
              </button>

            </div>

            <div
              className={`filter-tags-container ${showFilter ? 'open' : ''}`}
            >
              {Object.entries(allTags).map(([category, tags]) => {
                if (tags.length === 0) return null
                return (
                  <div key={category} className="filter-category-group">
                    <h4 className="filter-category-title">{category}</h4>
                    <div className="tags-wrapper">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          className={`filter-tag ${
                            selectedTags.includes(tag) ? 'active' : ''
                          }`}
                          onClick={() => toggleTag(tag)}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              <div className="filter-actions-row"></div>
            </div>

            <div
              className={`dryck-container-flex view-mode-list ${
                categoryFilter !== 'all' ? 'single-category' : ''
              }`}
            >
              {categoryFilter === 'all' && (
                <>
                  <div className="dryck-column">
                    <h2
                      className={`dryck-cat-title ${whiskeyOpen ? 'open' : ''} collapsible`}
                      onClick={() => setWhiskeyOpen(!whiskeyOpen)}
                    >
                      Whiskey ({filteredWhiskey.length})
                    </h2>
                    <div
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
                    <h2
                      className={`dryck-cat-title ${rumOpen ? 'open' : ''} collapsible`}
                      onClick={() => setRumOpen(!rumOpen)}
                    >
                      Rom ({filteredRums.length})
                    </h2>
                    <div
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
                    <h2 className="dryck-cat-title">
                      Whiskey ({filteredWhiskey.length})
                    </h2>
                    <ul className="dryck-list">
                      {filteredWhiskey
                        .slice(0, Math.ceil(filteredWhiskey.length / 2))
                        .map((item) => (
                          <DrinkCard key={item.id} item={item} />
                        ))}
                    </ul>
                  </div>
                  <div className="dryck-column">
                    {/* Keep spacing aligned with hidden header */}
                    <h2
                      className="dryck-cat-title dryck-cat-title-spacer"
                      style={{ visibility: 'hidden' }}
                    >
                      Whiskey ({filteredWhiskey.length})
                    </h2>
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
                    <h2 className="dryck-cat-title">
                      Rom ({filteredRums.length})
                    </h2>
                    <ul className="dryck-list">
                      {filteredRums
                        .slice(0, Math.ceil(filteredRums.length / 2))
                        .map((item) => (
                          <DrinkCard key={item.id} item={item} />
                        ))}
                    </ul>
                  </div>
                  <div className="dryck-column">
                    <h2
                      className="dryck-cat-title dryck-cat-title-spacer"
                      style={{ visibility: 'hidden' }}
                    >
                      Rom ({filteredRums.length})
                    </h2>
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
    </div>
  )
}
