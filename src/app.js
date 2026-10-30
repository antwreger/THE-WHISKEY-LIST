import { fields, loadItems, saveItems, seedItems, publicItems, matches, sortItems } from './data.js';

const main = document.querySelector('#main');
const dialog = document.querySelector('#bottle-dialog');
const filters = { query: '', category: 'whiskey', region: '', smoke: '', sort: 'name' };
let items = [];
let loadFailed = false;
let toastTimer;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const price = item => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(Number(item.price_text));
const isAdmin = () => location.hash === '#admin';
try { items = loadItems(); } catch { loadFailed = true; }

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4000);
}
function persist(next) {
  if (loadFailed) { notify('Återställ exempeldata innan du gör ändringar.'); return false; }
  try { saveItems(next); items = next; return true; }
  catch { notify('Kunde inte spara. Kontrollera att webbläsaren tillåter lokal lagring.'); return false; }
}
function options(values, selected) {
  return [...new Set(values.filter(Boolean))].sort((a,b) => a.localeCompare(b,'sv')).map(value => `<option ${value === selected ? 'selected' : ''} value="${esc(value)}">${esc(value)}</option>`).join('');
}
function render() {
  const admin = isAdmin();
  document.title = `${admin ? 'Administration' : 'Dryckeslistan'} · Brygghuset`;
  document.querySelector('#customer-link').setAttribute('aria-current', admin ? 'false' : 'page');
  document.querySelector('#admin-link').setAttribute('aria-current', admin ? 'page' : 'false');
  const data = admin ? items : publicItems(items);
  main.innerHTML = `${admin ? `<section class="admin-intro wrap"><div><p class="eyebrow">BRYGGHUSET / DEMOADMINISTRATION</p><h1>Din dryckeslista.</h1><p>Hantera sortimentet. Se resultatet direkt i kundvyn.</p></div><button class="button primary" data-action="add">+ Lägg till flaska</button></section><div class="admin-note wrap"><span>Lokal demo utan inloggning. Ändringar sparas i den här webbläsaren.</span><button class="text-button" data-action="reset">Återställ exempeldata</button></div>` : `<section class="hero"><div class="wrap"><p class="eyebrow">BRYGGHUSET · FISKEBÄCKSKIL</p><h1>Dryckeslistan</h1><p>Utforska whiskey och rom. Sök efter en favorit eller hitta något nytt.</p></div></section>`}
    <section class="catalog wrap" id="sortiment" aria-labelledby="list-title">
      <div class="section-heading"><div><p class="eyebrow">${admin ? 'DITT SORTIMENT' : 'VÅRT DEMOSORTIMENT'}</p><h2 id="list-title">${admin ? 'Alla flaskor' : 'Välj ditt glas'}</h2></div><p class="subtle">${admin ? `${items.length} flaskor · ${items.filter(i=>i.is_active).length} synliga` : 'Alla priser i kr / cl'}</p></div>
      ${loadFailed ? `<div class="error" role="alert">Den sparade listan kunde inte läsas. Den har inte skrivits över. <button class="text-button" data-action="reset">Återställ exempeldata</button></div>` : ''}
      <div class="tabs" role="group" aria-label="Dryckeskategori">${[['whiskey','Whiskey'],['rum','Rom'],['','Alla drycker']].map(([key,label])=>`<button data-category="${key}" aria-pressed="${filters.category === key}">${label}<span>${data.filter(i=> !key || i.category===key).length}</span></button>`).join('')}</div>
      <div class="toolbar"><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Sök destilleri, flaska eller smak…" aria-label="Sök flaskor" value="${esc(filters.query)}"></label>
      <label>Region / land<select id="region"><option value="">Alla regioner</option>${options(data.filter(i=>!filters.category || i.category===filters.category).map(i=>i.metadata.region || i.metadata.land), filters.region)}</select></label>
      <label>Rökighet<select id="smoke"><option value="">Alla nivåer</option>${options(data.map(i=>i.metadata.rokighet),filters.smoke)}</select></label>
      <label>Sortera<select id="sort">${[['name','Namn A–Ö'],['price-up','Pris: lägst först'],['price-down','Pris: högst först']].map(([key,label])=>`<option value="${key}" ${filters.sort===key?'selected':''}>${label}</option>`).join('')}</select></label></div>
      <div class="results-bar"><p id="result-count" role="status" aria-live="polite"></p><button class="text-button" data-action="clear">Rensa filter <span aria-hidden="true">↺</span></button></div>
      <div id="bottles" class="bottle-grid"></div>
      <div class="catalog-footnote"><span aria-hidden="true">✦</span><p>Detta är ett exempelsortiment för demonstration. Flaskor, smakbeskrivningar och priser är inte en aktuell meny från Brygghuset.</p></div>
    </section>`;
  main.querySelector('#search').addEventListener('input', e => { filters.query=e.target.value; renderResults(); });
  for (const key of ['region','smoke','sort']) main.querySelector(`#${key}`).addEventListener('change', e=>{ filters[key]=e.target.value; renderResults(); });
  renderResults();
}
function renderResults() {
  const admin = isAdmin();
  const source = admin ? items : publicItems(items);
  const filtered = sortItems(source.filter(item => matches(item, filters)), filters.sort);
  main.querySelector('#result-count').textContent = `${filtered.length} av ${source.length} flaskor`;
  main.querySelector('#bottles').innerHTML = filtered.length ? filtered.map(item=>{
    const m = item.metadata;
    return `<article class="bottle-card ${admin && !item.is_active ? 'is-hidden' : ''}"><div class="card-top"><span class="eyebrow">${esc(m.region || m.land || (item.category==='rum'?'Rom':'Whiskey'))}</span>${admin ? `<span class="status ${item.is_active?'':'off'}">${item.is_active?'Synlig':'Dold'}</span>` : `<span class="smoke-label">${esc(m.rokighet ? m.rokighet+' rökighet' : m.stil)}</span>`}</div><h3>${esc(item.name)}</h3><p class="bottle-meta">${[m.stil,m.alder,m.procent].filter(Boolean).map(esc).join(' <span>·</span> ')}</p><p class="tasting-note">${esc(m.fritext || item.description || 'Upptäck flaskans detaljer nedan.')}</p><div class="price-line"><p><strong>${price(item)}</strong> kr / cl</p><details><summary>Om flaskan <span aria-hidden="true">+</span></summary><dl>${fields.filter(([key])=>m[key]).map(([key,label])=>`<div><dt>${label}</dt><dd>${esc(m[key])}</dd></div>`).join('')}</dl></details></div>${admin?`<div class="admin-card-actions"><span>Lager: ${esc(m.lagerantal === '' || m.lagerantal == null ? 'Ej angivet' : m.lagerantal)}</span><button data-edit="${esc(item.id)}" class="text-button">Redigera</button><button data-toggle="${esc(item.id)}" class="text-button">${item.is_active?'Dölj':'Visa'}</button><button data-delete="${esc(item.id)}" class="text-button danger">Ta bort</button></div>`:''}</article>`;
  }).join('') : '<div class="empty"><h3>Inga flaskor hittades.</h3><p>Prova en annan sökning eller rensa dina filter.</p><button class="button" data-action="clear">Rensa filter</button></div>';
}
function openEditor(id) {
  const existing = id ? items.find(i=>i.id===id) : null;
  if (id && !existing) return;
  const m = existing?.metadata || {};
  dialog.innerHTML = `<form id="bottle-form"><div class="dialog-header"><div><p class="eyebrow">DRYCKESHANTERING</p><h2 id="dialog-title">${existing?'Redigera flaska':'Lägg till flaska'}</h2></div><button type="button" data-close aria-label="Stäng formuläret" class="close">×</button></div><div class="form-grid"><label>Kategori<select name="category"><option value="whiskey">Whiskey</option><option value="rum" ${existing?.category==='rum'?'selected':''}>Rom</option></select></label><label>Pris (kr / cl) *<input name="price" required type="number" min="0" step="0.01" value="${esc(existing?.price_text ?? '')}"></label>${fields.map(([key,label])=>`<label>${label}${key==='destilleri'?' *':''}${key==='flaska'?' *':''}<input name="${key}" ${key==='destilleri'||key==='flaska'?'required':''} maxlength="160" value="${esc(m[key] || '')}"></label>`).join('')}<label>Antal på lager<input name="lagerantal" type="number" min="0" step="1" value="${esc(m.lagerantal ?? '')}"></label><label class="wide">Smakbeskrivning / extra information<textarea name="fritext" rows="3" maxlength="2000">${esc(m.fritext || existing?.description || '')}</textarea></label><label class="check wide"><input name="active" type="checkbox" ${existing?.is_active !== false?'checked':''}> Visa i kundlistan</label></div><p class="form-note">* Obligatoriskt. Namnet bildas av destilleri, serie och flaska. Lagerantal visas bara i administrationsvyn.</p><p id="form-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button" data-close>Avbryt</button><button class="button primary" type="submit">Spara flaska</button></div></form>`;
  dialog.querySelector('#bottle-form').addEventListener('submit', e=>{
    e.preventDefault();
    const form = new FormData(e.target);
    const metadata = Object.fromEntries(fields.map(([key])=>[key,String(form.get(key) || '').trim()]));
    if (!metadata.destilleri || !metadata.flaska) { dialog.querySelector('#form-error').textContent='Ange destilleri och flaska.'; return; }
    metadata.fritext = String(form.get('fritext') || '').trim();
    metadata.lagerantal = form.get('lagerantal') === '' ? '' : Number(form.get('lagerantal'));
    const next = { id:existing?.id || crypto.randomUUID(), tenant_id:'brygghuset-demo',
      category: form.get('category'), name:[metadata.destilleri,metadata.serie,metadata.flaska].filter(Boolean).join(' '),
      description:metadata.fritext, price_text:String(Number(form.get('price'))), metadata,
      is_active:form.get('active') === 'on', sort_order:existing?.sort_order ?? (items.length+1)*10 };
    if (!persist(existing ? items.map(i=>i.id===id?next:i) : [...items,next])) return;
    dialog.close(); render(); notify('Flaskan har sparats. Kundlistan är uppdaterad.');
  });
  dialog.showModal();
}
document.addEventListener('click', e=>{
  const button=e.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-close')) { dialog.close(); return; }
  if (button.hasAttribute('data-category')) { filters.category=button.dataset.category; filters.region=''; render(); return; }
  const action=button.dataset.action;
  if (action==='clear') { Object.assign(filters,{query:'',region:'',smoke:'',sort:'name'});render(); }
  if (action==='add' && isAdmin()) openEditor();
  if (action==='reset' && window.confirm('Återställ hela listan till exempeldata? Dina lokala ändringar tas bort.')) {
    try { const next=seedItems(); saveItems(next); items=next; loadFailed=false;render();notify('Exempeldata har återställts.'); }
    catch { notify('Kunde inte återställa. Lokal lagring är inte tillgänglig.'); }
  }
  if (!isAdmin()) return;
  if (button.dataset.edit) openEditor(button.dataset.edit);
  if (button.dataset.toggle) { if(persist(items.map(i=>i.id===button.dataset.toggle?{...i,is_active:!i.is_active}:i))) {render();notify('Synligheten har uppdaterats.');} }
  if (button.dataset.delete) {
    const item=items.find(i=>i.id===button.dataset.delete);
    if (item && window.confirm(`Ta bort ${item.name}?`)) if(persist(items.filter(i=>i.id!==item.id))) {render();notify('Flaskan har tagits bort.');}
  }
});
window.addEventListener('hashchange',()=>{ if(dialog.open)dialog.close(); Object.assign(filters,{query:'',region:'',smoke:'',category:'whiskey'});render(); });
window.addEventListener('storage', e=>{ if(e.key !== 'brygghuset.whiskey-list.v1' && e.key !== null)return;try{items=loadItems();loadFailed=false;}catch{loadFailed=true;items=[];}render(); });
render();
