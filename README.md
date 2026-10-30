# THE WHISKEY LIST

Lokal Brygghuset-demo med August Bistros befintliga dryckeslista och flaskeditor.

## Kör lokalt

Node.js 22.12+ krävs.

```sh
npm ci
npm run dev
```

- Kundlista: http://127.0.0.1:4173/dryck
- Flaskadministration: http://127.0.0.1:4173/admin
- Direktval av kategori: `/dryck?category=whiskey` eller `/dryck?category=rom`.
- `npm test` kontrollerar sök-/filterbeteendet och lokal datalagring.
- `npm run build` skapar `dist/`; `npm run preview` visar bygget lokalt.

## Källa: design-revision

Källan är **August-2.0, grenen `design-revision`**, commit `b054073d4bf7a8cd1183316500bebf27ea730404`.

- `src/pages/Dryck.jsx` är kopierad **utan ändringar** från den grenen.
- `src/components/admin/BottleManager.jsx` är kopierad **utan ändringar** från samma gren.
- Listans hooks, felkomponent och reservdata är också hämtade direkt från grenen.
- `src/dryck.css`, `src/index.css`, `src/aktuellt.css` och `src/admin.css` är originalets stilmallar. Bara bakgrundsfotot och den oanvända logotypsfonten har utelämnats enligt demots avgränsning utan bilder/logotyper. Playfair Display och Lato laddas på samma sätt som i originalet.
- `src/demo.css` gäller endast omgivande demonavigation, adminbehållare och bokningsavgränsning. Den ändrar inga list-, filter-, typografi- eller färgregler i katalogen.

## Demoanpassning

`src/utils/dataProvider.js` har Augusts flaskformat och funktionsgränssnitt men använder localStorage i stället för produktions-API:t. Stabilt ID behålls vid lokal sparning. Båda vyerna delar data; ändringar återläses när man går till kundlistan. Ursprunglig list- och filterfunktionalitet från design-revision används direkt, inklusive aktiva filterchips, sökrensning, filterpanel och mobilkategorier.

Sidans Header, Footer och Seo är små lokala demoadaptrar så att katalogen kan köras utan hela August-webbplatsen, logotyp och produktionsmetadata. Boka provning-länken behålls från originalet men leder till en lokal informationsvy: bokning ingår inte i demot.

Exempeldata i `src/data.js` är inte Brygghusets aktuella sortiment eller priser. Administrationen är öppen i denna lokala demo utan inloggning. Lagerantal utelämnas ur kundvyns data men localStorage är ingen säkerhetsgräns. Ingen produktionsanslutning, e-post eller publik publicering ingår.
