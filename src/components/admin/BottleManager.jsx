import LoadError from '../LoadError'
import React, { useState, useEffect, useRef } from 'react'
import { deleteTenantItem, getBottles, saveBottles } from '../../utils/dataProvider'
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react'

import Modal from '../Modal'
import { Link, useSearchParams } from 'react-router-dom'
import { matchesBottleSearch, bottleSummary, validateBottleForm, facetFields } from '../../utils/bottles'

// Constants
const INITIAL_FORM_STATE = {
  pris: '',
  ålder: '',
  procent: '',
  fat: '',
  rökighet: '',
  destilleri: '',
  serie: '',
  flaska: '',
  lagerantal: '',
  region: '',
  land: '',
  importör: '',
  buteljerad: '',
  buteljerare: '',
  fritext: '',
  stil: '',
}

function composeBottleName({ destilleri, serie, flaska }) {
  return [destilleri, serie, flaska]
    .map((value) => (value || '').toString().trim())
    .filter(Boolean)
    .join(' ')
}

function getLegacyBottlePart(item, destilleri, serie) {
  if (item.flaska) return item.flaska

  const currentName = (item.namn || '').toString().trim()
  const existingPrefix = composeBottleName({ destilleri, serie, flaska: '' })

  if (
    !existingPrefix ||
    !currentName.toLocaleLowerCase('sv-SE').startsWith(
      existingPrefix.toLocaleLowerCase('sv-SE')
    )
  ) {
    return currentName
  }

  return currentName.slice(existingPrefix.length).trim() || currentName
}

function buildFormData(item = {}) {
  const destilleri = item.destilleri || ''
  const serie = item.serie || ''

  return {
    ...INITIAL_FORM_STATE,
    pris: item.pris ?? '',
    ålder: item.ålder || '',
    procent: item.procent || '',
    fat: item.fat || '',
    rökighet: item.rökighet || '',
    destilleri,
    serie,
    flaska: getLegacyBottlePart(item, destilleri, serie),
    lagerantal: item.lagerantal ?? '',
    region: item.region || '',
    land: item.land || '',
    importör: item.importör || '',
    buteljerad: item.buteljerad || '',
    buteljerare: item.buteljerare || '',
    fritext: item.fritext || '',
    stil: item.stil || '',
  }
}

export default function BottleManager() {
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('category') === 'rom' ? 'rums' : 'whiskey'
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const [confirmation, setConfirmation] = useState(null)
  const initialForm = useRef(INITIAL_FORM_STATE)
  const [loadState, setLoadState] = useState('loading')
  const [data, setData] = useState({ whiskey: [], rums: [] })
  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchTerm, setSearchTerm] = useState('')

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // View State
  const [expandedId, setExpandedId] = useState(null)

  // Form State
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const hasEditingId = editingId !== null && editingId !== undefined

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const loaded = await getBottles({ activeOnly: false, admin: true })
      setData(loaded)
      setLoadState('ready')
    } catch (_err) {
      setLoadState('error')
    }
  }

  const handleSaveData = async (newData) => {
    try {
      await saveBottles(newData)
      await loadData()
      return true
    } catch (err) {
      console.error('Failed to save bottles', err)
      setFormError('Kunde inte spara lokalt. Kontrollera att webbläsaren tillåter lagring och försök igen.')
      return false
    }
  }

  // Filter items based on search
  const currentItems = data[activeTab] || []
  const filteredItems = currentItems.filter(item => matchesBottleSearch(item, searchTerm))

  // CRUD Operations
  const handleDelete = async (e, id) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    const item = currentItems.find(item => item.id === id)
    setConfirmation({ type: 'delete', id, name: item?.namn || 'flaskan' })
  }

  const confirmAction = async () => {
    if (confirmation.type === 'discard') {
      setConfirmation(null)
      setIsModalOpen(false)
      return
    }
    try {
      await deleteTenantItem(confirmation.id)
      await loadData()
      setMessage(`${confirmation.name} har tagits bort.`)
      setConfirmation(null)
    } catch {
      setMessage('Kunde inte ta bort flaskan. Försök igen.')
      setConfirmation(null)
    }
  }

  const requestClose = () => {
    if (savingRef.current) return
    if (JSON.stringify(formData) !== JSON.stringify(initialForm.current)) setConfirmation({ type: 'discard' })
    else setIsModalOpen(false)
  }

  const openAddModal = () => {
    setEditingId(null)
    initialForm.current = buildFormData()
    setFormData(initialForm.current)
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditModal = (e, item) => {
    e.stopPropagation()
    setEditingId(item.id)
    initialForm.current = buildFormData(item)
    setFormData(initialForm.current)
    setFormError('')
    setIsModalOpen(true)
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (savingRef.current) return
    const validationError = validateBottleForm(formData)
    if (validationError) {
      setFormError(validationError)
      const field = validationError.includes('namn') ? '3' : validationError.includes('pris') ? '4' : '5'
      document.getElementById(`bottlemanager-field-${field}`)?.focus()
      return
    }
    savingRef.current = true
    setSaving(true)
    setFormError('')
    const existingItem = hasEditingId
      ? currentItems.find((item) => item.id === editingId)
      : null
    const existingFormData = existingItem ? buildFormData(existingItem) : null
    const identityChanged = existingFormData
      ? ['destilleri', 'serie', 'flaska'].some(
          (field) =>
            formData[field].trim() !== existingFormData[field].trim()
        )
      : true
    const composedName = composeBottleName(formData)
    const bottleName =
      existingItem && !existingItem.flaska && !identityChanged
        ? existingItem.namn
        : composedName

    const itemToSave = {
      namn: bottleName,
      pris: Number(formData.pris),
      ålder: formData.ålder,
      procent: formData.procent,
      fat: formData.fat,
      rökighet: formData.rökighet,
      destilleri: formData.destilleri,
      serie: formData.serie,
      flaska:
        existingItem && !existingItem.flaska && !identityChanged
          ? existingItem.flaska
          : formData.flaska,
      lagerantal:
        formData.lagerantal === '' ? '' : Number(formData.lagerantal),
      region: formData.region,
      land: formData.land,
      importör: formData.importör,
      fritext: formData.fritext,
      buteljerad: formData.buteljerad,
      buteljerare: formData.buteljerare,
      stil: formData.stil,
      isActive: existingItem?.isActive ?? true,
      id: hasEditingId ? editingId : crypto.randomUUID(),
    }

    let updatedList
    if (hasEditingId) {
      updatedList = currentItems.map((item) =>
        item.id === editingId ? itemToSave : item
      )
    } else {
      updatedList = [itemToSave, ...currentItems]
    }

    const didSave = await handleSaveData({
      ...data,
      [activeTab]: updatedList,
    })
    savingRef.current = false
    setSaving(false)
    if (didSave) {
      setMessage(`${itemToSave.namn} har sparats.`)
      setIsModalOpen(false)
    }
  }

  if (loadState !== 'ready') return loadState === 'error' ? <LoadError /> : <p role="status">Laddar…</p>

  return (
    <div className="admin-content-area max-width-container">
      <div className="admin-page-header layout-row-between">
        <h1>Dryckeshanterare</h1>
        <div className="tab-group">
          <button
            className={`tab-btn ${activeTab === 'whiskey' ? 'active' : ''}`}
            aria-pressed={activeTab === 'whiskey'}
            onClick={() => { setActiveTab('whiskey'); setSearchTerm('') }}
          >
            Whiskey ({data.whiskey.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'rums' ? 'active' : ''}`}
            aria-pressed={activeTab === 'rums'}
            onClick={() => { setActiveTab('rums'); setSearchTerm('') }}
          >
            Rom ({data.rums.length})
          </button>
        </div>
      </div>

      <div className="search-bar-row">
        <Search aria-hidden="true" size={20} color="#666" />
        <input
          type="text"
          className="search-input-field"
          aria-label="Sök flaskor i administrationen"
          placeholder="Sök på destilleri, serie, flaska, extra info..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary layout-row-center gap-small"
          data-dialog-fallback
          onClick={openAddModal}
        >
          <Plus size={18} />
          Lägg till ny
        </button>
      </div>

      <div className="admin-feedback"><p role="status">{message}</p><Link to={`/dryck?category=${activeTab === 'rums' ? 'rom' : 'whiskey'}`}>Visa kundlistan</Link></div>
      <p className="admin-result-count" role="status">Visar {filteredItems.length} av {currentItems.length} flaskor</p>
      <div className="manager-grid list-view">
        {filteredItems.map((item) => {
          const isExpanded = expandedId === item.id
          const summaryMetadata = [
            bottleSummary(item),
            item.lagerantal !== undefined &&
            item.lagerantal !== null &&
            item.lagerantal !== ''
              ? `Antal på lager: ${item.lagerantal}`
              : '',
          ]
            .filter(Boolean)
            .join(' • ')

          return (
            <div
              key={item.id}
              className={`manager-card cursor-pointer ${isExpanded ? 'card-active' : ''}`}
              onClick={() => toggleExpand(item.id)}
            >
              <div className="bottle-summary">
                <h2 className="margin-none font-title">{item.namn}</h2>
                <div className="bottle-summary-meta text-color-muted font-small">
                  {summaryMetadata}
                </div>
              </div>

              {isExpanded && (
                <div className="detail-grid-2">
                  {item.destilleri && (
                    <div>
                      <strong className="text-color-brand">Destilleri:</strong>{' '}
                      {item.destilleri}
                    </div>
                  )}
                  {item.serie && (
                    <div>
                      <strong className="text-color-brand">Serie:</strong>{' '}
                      {item.serie}
                    </div>
                  )}
                  {item.fat && (
                    <div>
                      <strong className="text-color-brand">Fat:</strong>{' '}
                      {item.fat}
                    </div>
                  )}
                  {item.rökighet && (
                    <div>
                      <strong className="text-color-brand">Rökighet:</strong>{' '}
                      {item.rökighet}
                    </div>
                  )}
                  {item.region && (
                    <div>
                      <strong className="text-color-brand">Region:</strong>{' '}
                      {item.region}
                    </div>
                  )}
                  {item.land && (
                    <div>
                      <strong className="text-color-brand">Land:</strong>{' '}
                      {item.land}
                    </div>
                  )}
                  {item.stil && (
                    <div>
                      <strong className="text-color-brand">Stil:</strong>{' '}
                      {item.stil}
                    </div>
                  )}
                  {item.importör && (
                    <div>
                      <strong className="text-color-brand">Importör:</strong>{' '}
                      {item.importör}
                    </div>
                  )}
                  {item.buteljerad && (
                    <div>
                      <strong className="text-color-brand">Buteljerad:</strong>{' '}
                      {item.buteljerad}
                    </div>
                  )}
                  {item.buteljerare && (
                    <div>
                      <strong className="text-color-brand">Buteljerare:</strong>{' '}
                      {item.buteljerare}
                    </div>
                  )}
                  {item.fritext && (
                    <div>
                      <strong className="text-color-brand">Mer info:</strong>{' '}
                      {item.fritext}
                    </div>
                  )}
                </div>
              )}

              <div className="card-actions-bottom">
                <Link className="admin-customer-link" aria-label={`Visa ${item.namn} i kundlistan`} to={`/dryck?category=${activeTab === 'rums' ? 'rom' : 'whiskey'}&q=${encodeURIComponent(item.namn)}`} onClick={event => event.stopPropagation()}>Visa hos kund</Link>
                <button aria-label={`Visa detaljer för ${item.namn}`}
                  type="button"
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(item.id)
                  }}
                  title="Visa detaljer"
                >
                  <Eye size={18} />
                </button>
                <button aria-label={`Redigera ${item.namn}`}
                  type="button"
                  className="btn-icon"
                  onClick={(e) => openEditModal(e, item)}
                  title="Redigera"
                >
                  <Edit2 size={18} />
                </button>
                <button aria-label={`Ta bort ${item.namn}`}
                  type="button"
                  className="btn-icon text-alert"
                  onClick={(e) => handleDelete(e, item.id)}
                  title="Ta bort"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="text-align-center text-color-muted margin-top-large">
            <p>Inga flaskor hittades.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal title={`${hasEditingId ? 'Redigera flaska' : 'Lägg till flaska'} (${activeTab === 'whiskey' ? 'Whiskey' : 'Rom'})`} onClose={requestClose}>
            <p className="admin-form-help">* Obligatoriskt. Namnet bildas av destilleri, serie och flaska.</p>
            <form onSubmit={handleSubmit} className="grid-form-2">
              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-1">Destilleri</label>
                <input id="bottlemanager-field-1" list="facet-destilleri"
                  className="form-control"
                  value={formData.destilleri}
                  onChange={(e) =>
                    setFormData({ ...formData, destilleri: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-2">Serie</label>
                <input id="bottlemanager-field-2"
                  className="form-control"
                  value={formData.serie}
                  onChange={(e) =>
                    setFormData({ ...formData, serie: e.target.value })
                  }
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label" htmlFor="bottlemanager-field-3">Flaska *</label>
                <input id="bottlemanager-field-3" required
                  className="form-control"
                  value={formData.flaska}
                  onChange={(e) =>
                    setFormData({ ...formData, flaska: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-4">Pris (kr/cl) *</label>
                <input id="bottlemanager-field-4" min="0" step="0.01"
                  type="number"
                  required
                  className="form-control"
                  value={formData.pris}
                  onChange={(e) =>
                    setFormData({ ...formData, pris: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-5">Antal på lager</label>
                <input id="bottlemanager-field-5"
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  value={formData.lagerantal}
                  onChange={(e) =>
                    setFormData({ ...formData, lagerantal: e.target.value })
                  }
                />
                <small className="display-block font-tiny text-color-muted margin-top-xs">
                  Syns enbart för er
                </small>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-6">Ålder</label>
                <input id="bottlemanager-field-6"
                  className="form-control"
                  placeholder="t.ex. 12 år"
                  value={formData.ålder}
                  onChange={(e) =>
                    setFormData({ ...formData, ålder: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-7">Procent (ABV)</label>
                <input id="bottlemanager-field-7"
                  className="form-control"
                  placeholder="t.ex. 40 %vol"
                  value={formData.procent}
                  onChange={(e) =>
                    setFormData({ ...formData, procent: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-8">Fat (Cask)</label>
                <input id="bottlemanager-field-8" list="facet-fat"
                  className="form-control"
                  value={formData.fat}
                  onChange={(e) =>
                    setFormData({ ...formData, fat: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-9">Rökighet</label>
                <input id="bottlemanager-field-9" list="facet-rökighet"
                  className="form-control"
                  value={formData.rökighet}
                  onChange={(e) =>
                    setFormData({ ...formData, rökighet: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-10">Region</label>
                <input id="bottlemanager-field-10" list="facet-region"
                  className="form-control"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-11">Land</label>
                <input id="bottlemanager-field-11" list="facet-land"
                  className="form-control"
                  value={formData.land}
                  onChange={(e) =>
                    setFormData({ ...formData, land: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-12">Stil</label>
                <input id="bottlemanager-field-12" list="facet-stil"
                  className="form-control"
                  value={formData.stil}
                  onChange={(e) =>
                    setFormData({ ...formData, stil: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-13">Buteljerad (år)</label>
                <input id="bottlemanager-field-13"
                  type="number"
                  className="form-control"
                  value={formData.buteljerad}
                  onChange={(e) =>
                    setFormData({ ...formData, buteljerad: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-14">Buteljerare</label>
                <input id="bottlemanager-field-14" list="facet-buteljerare"
                  className="form-control"
                  value={formData.buteljerare}
                  onChange={(e) =>
                    setFormData({ ...formData, buteljerare: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-15">Fritext</label>
                <input id="bottlemanager-field-15"
                  className="form-control"
                  value={formData.fritext}
                  onChange={(e) =>
                    setFormData({ ...formData, fritext: e.target.value })
                  }
                />
              </div>

              <div className="span-2 admin-name-preview">Visningsnamn: <strong>{composeBottleName(formData) || 'Ange flaskans namn'}</strong></div>
              {formError && <p className="span-2 admin-form-error" role="alert">{formError}</p>}
              <div className="span-2 admin-dialog-actions">
                <button
                  type="button"
                  className="btn-secondary danger"
                  onClick={requestClose}
                >
                  Avbryt
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Sparar…' : 'Spara flaska'}
                </button>
              </div>
              {[...facetFields, 'fat'].map(field => <datalist key={field} id={`facet-${field}`}>{[...new Set([...data.whiskey, ...data.rums].map(item => item[field]).filter(Boolean))].sort().map(value => <option key={value} value={value} />)}</datalist>)}
            </form>
        </Modal>
      )}
      {confirmation && <Modal alert title={confirmation.type === 'discard' ? 'Kasta osparade ändringar?' : 'Ta bort flaska?'} onClose={() => setConfirmation(null)}>
        <p>{confirmation.type === 'discard' ? 'Dina ändringar har inte sparats.' : `${confirmation.name} tas bort även från kundlistan.`}</p>
        <div className="admin-dialog-actions"><button type="button" className="btn-secondary" onClick={() => setConfirmation(null)}>{confirmation.type === 'discard' ? 'Fortsätt redigera' : 'Avbryt'}</button><button type="button" className="btn-primary" onClick={confirmAction}>{confirmation.type === 'discard' ? 'Kasta ändringar' : 'Ta bort'}</button></div>
      </Modal>}
    </div>
  )
}
