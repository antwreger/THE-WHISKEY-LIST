import { loadItems, saveItems } from '../data.js'
import { normalizeBottleFacets } from './bottles.js'

// August's item -> bottle mapping. Only persistence is replaced for this local demo.
function apiItemToBottleUi(row) {
  const meta = row.metadata || {}
  const alder = meta['ålder'] ?? meta.alder ?? ''
  const rokighet = meta['rökighet'] ?? meta.rokighet ?? ''
  const importor = meta['importör'] ?? meta.importor ?? ''
  const priceRaw = row.price_text ?? meta.pris ?? 0
  const parsedPrice = Number(priceRaw)
  return {
    id: row.id, isActive: row.is_active !== false,
    namn: row.name ?? meta.namn ?? '', ålder: alder, procent: meta.procent ?? '',
    fat: meta.fat ?? '', rökighet: rokighet, destilleri: meta.destilleri ?? '',
    serie: meta.serie ?? '', flaska: meta.flaska ?? '', lagerantal: meta.lagerantal ?? '',
    region: meta.region ?? '', land: meta.land ?? '', stil: meta.stil ?? '',
    importör: importor, buteljerad: meta.buteljerad ?? '',
    buteljerare: meta.buteljerare ?? '', fritext: meta.fritext ?? '',
    pris: Number.isFinite(parsedPrice) ? parsedPrice : 0,
  }
}

export async function getBottles(options = {}) {
  const rows = loadItems()
  const result = { whiskey: [], rums: [] }
  for (const row of rows) {
    if (options.activeOnly !== false && !row.is_active) continue
    const item = apiItemToBottleUi(row)
    if (options.admin !== true) delete item.lagerantal
    result[row.category === 'rum' ? 'rums' : 'whiskey'].push(item)
  }
  const compare = (a,b) => (a.namn || '').localeCompare(b.namn || '', 'sv-SE', { sensitivity:'base', numeric:true })
  result.whiskey.sort(compare)
  result.rums.sort(compare)
  return normalizeBottleFacets(result)
}

export async function saveBottles(data) {
  const reference = await getBottles({ admin: true, activeOnly: false })
  data = normalizeBottleFacets(data, reference)
  for (const item of [...(data.whiskey || []), ...(data.rums || [])]) {
    if (!String(item.namn ?? '').trim()) throw new Error('Flaskan måste ha ett namn.')
    if (item.pris === '' || !Number.isFinite(Number(item.pris)) || Number(item.pris) < 0) throw new Error('Ogiltigt pris.')
  }
  const convert = (item, category, index) => ({
    id:String(item.id), tenant_id:'brygghuset-demo', category, name:item.namn,
    description:item.fritext || '', price_text:String(item.pris), is_active:item.isActive !== false,
    sort_order:(index+1)*10,
    metadata:{ namn:item.namn, alder:item.ålder || '', procent:item.procent || '',
      fat:item.fat || '', rokighet:item.rökighet || '', destilleri:item.destilleri || '',
      serie:item.serie || '', flaska:item.flaska || '', lagerantal:item.lagerantal ?? '',
      region:item.region || '', land:item.land || '', stil:item.stil || '', importor:item.importör || '',
      buteljerad:item.buteljerad || '', buteljerare:item.buteljerare || '', fritext:item.fritext || '', pris:String(item.pris) }
  })
  saveItems([
    ...(data.whiskey || []).map((item,index)=>convert(item,'whiskey',index)),
    ...(data.rums || []).map((item,index)=>convert(item,'rum',index)),
  ])
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('bottles-updated'))
  return data
}

export async function deleteTenantItem(id) {
  saveItems(loadItems().filter(item=>item.id!==String(id)))
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('bottles-updated'))
}
