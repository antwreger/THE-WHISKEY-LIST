import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { getBottles, saveBottles, deleteTenantItem } from '../src/utils/dataProvider.js'
import { matchesBottleSearch, bottleSummary, validateBottleForm, normalizeBottleFacets } from '../src/utils/bottles.js'

// Exercise the inherited tag semantics together with the shared search implementation.
const source = readFileSync(new URL('../src/pages/Dryck.jsx', import.meta.url), 'utf8')
const helpers = source.slice(source.indexOf('function parseAge'), source.indexOf('export default function'))
const filtering = source.slice(source.indexOf('  const matchTags ='), source.indexOf('  const isFiltered'))
function filter(whiskey, rums, search='', selectedTags=[]) {
  return runInNewContext(`${helpers}\n${filtering}\n;({whiskey:filteredWhiskey,rums:filteredRums})`, {whiskey,rums,search,selectedTags,matchesBottleSearch,useMemo:fn=>fn(),useCallback:fn=>fn})
}
const bottle = {id:'a',namn:'Lagavulin 16',ålder:'16 år',procent:'43 %',fat:'Bourbon & sherry',rökighet:'Hög',destilleri:'Lagavulin',region:'Islay',land:'Skottland',stil:'Single malt',fritext:'Rök och havssälta',pris:36}

test('Search terms match across fields, in any order, and across removed whitespace',()=>{
  assert.equal(filter([bottle],[],'43 Islay Lagavulin').whiskey.length,1)
  assert.equal(filter([bottle],[],'singlemalt').whiskey.length,1)
  assert.equal(filter([bottle],[],'Islay saknas').whiskey.length,0)
})
test('All six original filter groups combine with AND; casks split at &',()=>{
  assert.equal(filter([bottle],[],'',['16-20 år','Skottland','Single malt','Hög','sherry','Lagavulin']).whiskey.length,1)
  assert.equal(filter([bottle],[],'',['Islay','Speyside']).whiskey.length,0)
  assert.equal(filter([bottle],[],'',['11-15 år']).whiskey.length,0)
  assert.equal(filter([{...bottle,ålder:'NAS'}],[],'',['NAS']).whiskey.length,1)
})
test('Same filtering applies independently to whiskey and rum',()=>{
  assert.equal(filter([bottle],[{...bottle,id:'b',namn:'El Dorado',destilleri:'Demerara',land:'Guyana'}],'Guyana').whiskey.length,0)
  assert.equal(filter([bottle],[{...bottle,id:'b',namn:'El Dorado',destilleri:'Demerara',land:'Guyana'}],'Guyana').rums.length,1)
})
beforeEach(()=>{
  const values = new Map()
  globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value))}
})
test('Local adapter persists edits, preserves IDs and leaves the other category intact',async()=>{
  const data=await getBottles({admin:true})
  const id=data.whiskey[0].id
  data.whiskey[0].pris=42
  await saveBottles(data)
  const saved=await getBottles({admin:true})
  assert.equal(saved.whiskey.find(i=>i.id===id).pris,42)
  assert.equal(saved.rums.length,data.rums.length)
  assert.ok('lagerantal' in saved.whiskey[0])
  assert.ok(!('lagerantal' in (await getBottles()).whiskey[0]))
  await deleteTenantItem(id)
  assert.ok(!(await getBottles()).whiskey.some(i=>i.id===id))
})
test('Local storage failure rejects a save instead of reporting success',async()=>{
  const data=await getBottles({admin:true})
  globalThis.localStorage.setItem=()=>{throw new Error('quota')}
  await assert.rejects(saveBottles(data),/quota/)
})

test('Optional metadata never creates empty separators or a stray age unit',()=>{
  assert.equal(bottleSummary({ålder:'',procent:'',pris:42.5}),'42,5 kr/cl')
  assert.equal(bottleSummary({ålder:'12',procent:'43 %',pris:0}),'12 år • 43 % • 0 kr/cl')
  assert.equal(bottleSummary({ålder:'NAS',procent:'',pris:''}),'NAS')
})

test('Validation accepts decimal prices and zero stock, rejects blank names and invalid quantities',()=>{
  assert.equal(validateBottleForm({flaska:'Test',pris:'12.5',lagerantal:'0'}),'')
  assert.match(validateBottleForm({flaska:'  ',pris:12,lagerantal:''}),/namn/)
  assert.match(validateBottleForm({flaska:'Test',pris:-1,lagerantal:''}),/pris/)
  assert.match(validateBottleForm({flaska:'Test',pris:12,lagerantal:'1.5'}),/heltal/)
})

test('Canonical facet spelling is reused across categories and compound casks',()=>{
  const existing={whiskey:[{stil:'Single malt',land:'Skottland',fat:'Bourbon & Sherry'}],rums:[]}
  const result=normalizeBottleFacets({whiskey:[{stil:' single MALT ',land:'skottland',fat:' bourbon & sherry '}],rums:[]},existing)
  assert.equal(result.whiskey[0].stil,'Single malt')
  assert.equal(result.whiskey[0].land,'Skottland')
  assert.equal(result.whiskey[0].fat,'Bourbon & Sherry')
})

test('Saving a new spelling does not create duplicate facet labels in the public list',async()=>{
  const data=await getBottles({admin:true})
  data.whiskey.push({...data.whiskey[0],id:'new-test',namn:'Testflaska',stil:' single MALT '})
  await saveBottles(data)
  const saved=await getBottles()
  assert.equal(saved.whiskey.find(item=>item.id==='new-test').stil,'Single malt')
})
