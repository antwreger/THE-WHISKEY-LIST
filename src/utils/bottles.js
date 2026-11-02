const searchFields = ['namn', 'ålder', 'procent', 'fat', 'rökighet', 'destilleri', 'serie', 'flaska', 'region', 'land', 'importör', 'buteljerad', 'buteljerare', 'stil', 'fritext', 'pris']

export function matchesBottleSearch(item, query = '') {
  const text = searchFields.map(key => String(item[key] ?? '').toLocaleLowerCase('sv')).join(' ')
  const compact = text.replace(/\s+/g, '')
  return query.trim().toLocaleLowerCase('sv').split(/\s+/).every(term => text.includes(term) || compact.includes(term))
}

export function formatBottleAge(value) {
  const age = String(value ?? '').trim()
  return /^\d+(?:[.,]\d+)?$/.test(age) ? `${age} år` : age
}

export function bottleSummary(item) {
  return [formatBottleAge(item.ålder), String(item.procent ?? '').trim(),
    item.pris !== '' && item.pris != null ? `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(Number(item.pris))} kr/cl` : '']
    .filter(Boolean).join(' • ')
}

export function validateBottleForm(form) {
  if (!String(form.flaska ?? '').trim()) return 'Ange flaskans namn.'
  if (form.pris === '' || !Number.isFinite(Number(form.pris)) || Number(form.pris) < 0) return 'Ange ett pris som är noll eller högre.'
  if (form.lagerantal !== '' && (!Number.isInteger(Number(form.lagerantal)) || Number(form.lagerantal) < 0)) return 'Lagerantal måste vara ett heltal som är noll eller högre.'
  return ''
}

export const facetFields = ['stil', 'rökighet', 'land', 'region', 'destilleri', 'buteljerare']

// Reuse the first established spelling, including individual cask names.
export function normalizeBottleFacets(data, reference = data) {
  const dictionaries = Object.fromEntries([...facetFields, 'fat'].map(field => [field, new Map()]))
  const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ')
  const key = value => clean(value).toLocaleLowerCase('sv')
  for (const item of [...(reference.whiskey || []), ...(reference.rums || [])]) {
    for (const field of facetFields) {
      const value = clean(item[field])
      if (value && !dictionaries[field].has(key(value))) dictionaries[field].set(key(value), value)
    }
    for (const part of String(item.fat ?? '').split('&').map(clean).filter(Boolean)) {
      if (!dictionaries.fat.has(key(part))) dictionaries.fat.set(key(part), part)
    }
  }
  const canonical = (field, value) => {
    value = clean(value)
    if (value && !dictionaries[field].has(key(value))) dictionaries[field].set(key(value), value)
    return dictionaries[field].get(key(value)) || value
  }
  const normalize = item => ({ ...item,
    ...Object.fromEntries(facetFields.map(field => [field, canonical(field, item[field])])),
    fat: String(item.fat ?? '').split('&').map(part => canonical('fat', part)).filter(Boolean).join(' & '),
  })
  return { whiskey: (data.whiskey || []).map(normalize), rums: (data.rums || []).map(normalize) }
}
