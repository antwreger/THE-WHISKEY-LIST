import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { getBottles, saveBottles, deleteTenantItem } from '../src/utils/dataProvider.js'

// Exercise the actual unchanged search/filter code from the reused component.
const source = readFileSync(new URL('../src/pages/Dryck.jsx', import.meta.url), 'utf8')
const helpers = source.slice(source.indexOf('function getItemSearchString'), source.indexOf('export default function'))
const filtering = source.slice(source.indexOf('  const matchTags ='), source.indexOf('\n  return (', source.indexOf('  const filteredRums =')))
function filter(whiskey, rums, search='', selectedTags=[]) {
  return runInNewContext(`${helpers}\n${filtering}\n;({whiskey:filteredWhiskey,rums:filteredRums})`, {whiskey,rums,search,selectedTags,useMemo:fn=>fn()})
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
