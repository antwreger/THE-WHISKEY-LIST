import LoadError from '../LoadError'
import React, { useState, useEffect } from 'react'
import { deleteTenantItem, getBottles, saveBottles } from '../../utils/dataProvider'
import { Plus, Search, Edit2, Trash2, X, Eye } from 'lucide-react'

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

function formatBottleAge(value) {
  const age = (value || '').toString().trim()
  return /^\d+(?:[.,]\d+)?$/.test(age) ? `${age} år` : age
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
  const [loadState, setLoadState] = useState('loading')
  const [data, setData] = useState({ whiskey: [], rums: [] })
  const [activeTab, setActiveTab] = useState('whiskey')
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
      window.alert('Kunde inte spara ändringen i databasen.')
      return false
    }
  }

  // Filter items based on search
  const currentItems = data[activeTab] || []
  const filteredItems = currentItems.filter((item) => {
    const term = searchTerm.toLowerCase()
    return (
      item.namn?.toLowerCase().includes(term) ||
      item.destilleri?.toLowerCase().includes(term) ||
      item.serie?.toLowerCase().includes(term) ||
      item.flaska?.toLowerCase().includes(term) ||
      item.buteljerad?.toString().toLowerCase().includes(term) ||
      item.buteljerare?.toLowerCase().includes(term) ||
      item.region?.toLowerCase().includes(term) ||
      item.fat?.toLowerCase().includes(term) ||
      item.fritext?.toLowerCase().includes(term)
    )
  })

  // CRUD Operations
  const handleDelete = async (e, id) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!window.confirm('Är du säker på att du vill ta bort denna flaska?'))
      return

    try {
      await deleteTenantItem(id)
      await loadData()
    } catch (err) {
      console.error('Failed to delete bottle', err)
      window.alert('Kunde inte ta bort flaskan från databasen.')
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData(buildFormData())
    setIsModalOpen(true)
  }

  const openEditModal = (e, item) => {
    e.stopPropagation()
    setEditingId(item.id)
    setFormData(buildFormData(item))
    setIsModalOpen(true)
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
      id: hasEditingId ? editingId : Date.now(),
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
    if (didSave) {
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
            onClick={() => setActiveTab('whiskey')}
          >
            Whiskey ({data.whiskey.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'rums' ? 'active' : ''}`}
            onClick={() => setActiveTab('rums')}
          >
            Rom ({data.rums.length})
          </button>
        </div>
      </div>

      <div className="search-bar-row">
        <Search size={20} color="#666" />
        <input
          type="text"
          className="search-input-field"
          placeholder="Sök på destilleri, serie, flaska, extra info..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="button"
          className="btn-primary layout-row-center gap-small"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Lägg till ny
        </button>
      </div>

      <div className="manager-grid list-view">
        {filteredItems.map((item) => {
          const isExpanded = expandedId === item.id
          const summaryMetadata = [
            formatBottleAge(item.ålder),
            item.procent,
            item.pris !== undefined && item.pris !== null && item.pris !== ''
              ? `${item.pris} kr/cl`
              : '',
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
                <button aria-label="Förhandsgrandska"
                  type="button"
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(item.id)
                  }}
                  title="Förhandsgrandska"
                >
                  <Eye size={18} />
                </button>
                <button aria-label="Redigera"
                  type="button"
                  className="btn-icon"
                  onClick={(e) => openEditModal(e, item)}
                  title="Redigera"
                >
                  <Edit2 size={18} />
                </button>
                <button aria-label="Ta bort"
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
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="manager-card modal-content large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="layout-row-between margin-bottom-xl">
              <h2 className="margin-none">
                {hasEditingId ? 'Redigera Flaska' : 'Lägg till Flaska'} (
                {activeTab === 'whiskey' ? 'Whiskey' : 'Rom'})
              </h2>
              <button aria-label="Stäng"
                type="button"
                className="btn-icon text-alert"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid-form-2">
              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-1">Destilleri</label>
                <input id="bottlemanager-field-1"
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
                <label className="form-label" htmlFor="bottlemanager-field-3">Flaska</label>
                <input id="bottlemanager-field-3"
                  className="form-control"
                  value={formData.flaska}
                  onChange={(e) =>
                    setFormData({ ...formData, flaska: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-4">Pris (kr/cl) *</label>
                <input id="bottlemanager-field-4"
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
                <input id="bottlemanager-field-8"
                  className="form-control"
                  value={formData.fat}
                  onChange={(e) =>
                    setFormData({ ...formData, fat: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-9">Rökighet</label>
                <input id="bottlemanager-field-9"
                  className="form-control"
                  value={formData.rökighet}
                  onChange={(e) =>
                    setFormData({ ...formData, rökighet: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-10">Region</label>
                <input id="bottlemanager-field-10"
                  className="form-control"
                  value={formData.region}
                  onChange={(e) =>
                    setFormData({ ...formData, region: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-11">Land</label>
                <input id="bottlemanager-field-11"
                  className="form-control"
                  value={formData.land}
                  onChange={(e) =>
                    setFormData({ ...formData, land: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bottlemanager-field-12">Stil</label>
                <input id="bottlemanager-field-12"
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
                <input id="bottlemanager-field-14"
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

              <div className="span-2 layout-flex gap-medium-small margin-top-medium justify-content-end">
                <button
                  type="button"
                  className="btn-secondary danger"
                  onClick={() => setIsModalOpen(false)}
                >
                  Avbryt
                </button>
                <button type="submit" className="btn-primary">
                  Spara Flaska
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
