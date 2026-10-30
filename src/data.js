// Same tenant/category/item concept as August-2.0, adapted for a browser-local demo.
// All prices, descriptions and stock figures below are illustrative demo data.
const KEY = 'brygghuset.whiskey-list.v1';
export const fields = [
  ['destilleri', 'Destilleri'], ['serie', 'Serie'], ['flaska', 'Flaska / uttryck'],
  ['alder', 'Ålder'], ['procent', 'Alkoholhalt'], ['fat', 'Fat'],
  ['rokighet', 'Rökighet'], ['region', 'Region'], ['land', 'Land'],
  ['stil', 'Stil'], ['importor', 'Importör'], ['buteljerad', 'Buteljeringsår'],
  ['buteljerare', 'Buteljerare'],
];
const samples = [
  ['whiskey', 'Lagavulin', '16', 36, '16 år', '43 %', 'Bourbon & sherry', 'Hög', 'Islay', 'Skottland', 'Single malt', 'Rök, havssälta och en lång, varm avslutning.'],
  ['whiskey', 'Balvenie', 'DoubleWood 12', 32, '12 år', '40 %', 'Bourbon & sherry', 'Låg', 'Speyside', 'Skottland', 'Single malt', 'Mjuk honung, torkad frukt och toner av vanilj.'],
  ['whiskey', 'Ardbeg', '10', 30, '10 år', '46 %', 'Bourbon', 'Hög', 'Islay', 'Skottland', 'Single malt', 'Intensiv torvrök med citrus och en tydlig sälta.'],
  ['whiskey', 'Glenfiddich', '18', 39, '18 år', '40 %', 'Bourbon & sherry', 'Låg', 'Speyside', 'Skottland', 'Single malt', 'Runda toner av äpple, ek och varma kryddor.'],
  ['whiskey', 'Talisker', '10', 29, '10 år', '45,8 %', 'Bourbon', 'Medel', 'Isle of Skye', 'Skottland', 'Single malt', 'Maritim karaktär med svartpeppar och mjuk rök.'],
  ['whiskey', 'Redbreast', '12', 31, '12 år', '40 %', 'Bourbon & sherry', 'Låg', 'Cork', 'Irland', 'Single pot still', 'Fyllig och fruktig med nötter och kryddig värme.'],
  ['whiskey', 'Woodford Reserve', 'Distiller’s Select', 25, 'NAS', '43,2 %', 'Ny amerikansk ek', 'Låg', 'Kentucky', 'USA', 'Bourbon', 'Vanilj och karamell med en avrundad ekkryddighet.'],
  ['whiskey', 'Nikka', 'From the Barrel', 34, 'NAS', '51,4 %', 'Blandade fat', 'Låg', '', 'Japan', 'Blended whisky', 'Koncentrerad frukt, kryddor och en fyllig avslutning.'],
  ['rum', 'El Dorado', '12', 26, '12 år', '40 %', 'Bourbon', 'Låg', 'Demerara', 'Guyana', 'Mörk rom', 'Rund och generös med kola, tropisk frukt och ek.'],
  ['rum', 'Appleton Estate', '12 Rare Casks', 28, '12 år', '43 %', 'Bourbon', 'Låg', 'Nassau Valley', 'Jamaica', 'Lagrad rom', 'Apelsinskal, mogen frukt och en varm kryddighet.'],
];
export function seedItems() {
  return samples.map(([category, destilleri, flaska, price, alder, procent, fat, rokighet, region, land, stil, fritext], index) => ({
    id: `demo-${index + 1}`, tenant_id: 'brygghuset-demo', category,
    name: `${destilleri} ${flaska}`, description: fritext, price_text: String(price),
    is_active: true, sort_order: (index + 1) * 10,
    metadata: { destilleri, serie: '', flaska, alder, procent, fat, rokighet, region, land, stil, fritext, lagerantal: index % 3 + 1 },
  }));
}
export function validateItems(value) {
  return Array.isArray(value) && value.every(item => item && typeof item.id === 'string' &&
    typeof item.name === 'string' && ['whiskey', 'rum'].includes(item.category) &&
    typeof item.is_active === 'boolean' && typeof item.price_text === 'string' &&
    Number.isFinite(Number(item.price_text)) && Number(item.price_text) >= 0 &&
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) &&
    new Set(value.map(item => item.id)).size === value.length;
}
export function loadItems() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) return seedItems();
  const parsed = JSON.parse(raw);
  if (!validateItems(parsed)) throw new Error('Ogiltigt dataformat');
  return parsed;
}
export function saveItems(items) {
  if (!validateItems(items)) throw new Error('Ogiltigt dataformat');
  // Persist before updating UI so a quota/storage failure never looks like a successful save.
  localStorage.setItem(KEY, JSON.stringify(items));
}
