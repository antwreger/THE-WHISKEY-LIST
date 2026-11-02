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

- `src/pages/Dryck.jsx` är hämtad direkt från den grenen och därefter förbättrad enligt UX-granskningen 2026-11-02.
- `src/components/admin/BottleManager.jsx` är hämtad direkt från samma gren och därefter förbättrad enligt samma granskning.
- Listans hooks, felkomponent och reservdata är också hämtade direkt från grenen.
- `src/dryck.css`, `src/index.css`, `src/aktuellt.css` och `src/admin.css` är originalets stilmallar. Bara bakgrundsfotot och den oanvända logotypsfonten har utelämnats enligt demots avgränsning utan bilder/logotyper. Playfair Display och Lato laddas på samma sätt som i originalet.
- `src/demo.css` innehåller demonavigation och avgränsade UX-fixar: korrekt headerhöjd, symmetriska adminflikar, tydliga fält/fokus, mobilformulär, kategorirubriker och tomlägen. Listans ursprungliga design och taggfiltrering är fortsatt grunden.

## Demoanpassning

`src/utils/dataProvider.js` har Augusts flaskformat och funktionsgränssnitt men använder localStorage i stället för produktions-API:t. Stabilt ID behålls vid lokal sparning. Båda vyerna delar data; kundlistan uppdateras vid sparande, ändringar i andra flikar och återfokus. Ursprunglig list- och filterfunktionalitet från design-revision används direkt, inklusive aktiva filterchips, sökrensning, filterpanel och mobilkategorier.

Sidans Header, Footer och Seo är små lokala demoadaptrar så att katalogen kan köras utan hela August-webbplatsen, logotyp och produktionsmetadata. Bokningsknappen har tagits bort ur listan eftersom bokning inte ingår i demot. Den äldre demoadressen `/dryckesprovningar` visar fortfarande en informationsvy.

Exempeldata i `src/data.js` är inte Brygghusets aktuella sortiment eller priser. Administrationen är öppen i denna lokala demo utan inloggning. Lagerantal utelämnas ur kundvyns data men localStorage är ingen säkerhetsgräns. Ingen produktionsanslutning, e-post eller publik publicering ingår.

## UX-förbättringar 2026-11-02

- Inbyggda HTML-dialoger med fokus, Escape, återställt fokus och skydd för osparade ändringar. Radering använder en dialog med flasknamn i stället för webbläsarens confirm.
- Obligatoriskt flasknamn, decimalpris, synligt visningsnamn och sparbekräftelse. Befintliga egenskaper föreslås och normaliseras för att undvika skilda taggar för samma stil.
- Gemensam sökning i admin och kundvy. Enskilda adminposter länkar direkt till en filtrerad kundvy via `q`.
- Lika breda Whiskey-/Rom-flikar och 44 px höga adminåtgärder. Tydligare inmatningsfält och sticky formulärfot på mobil.
- Tomma ålders-/ABV-fält utelämnas. Land visas utan krav på region. Decimalpriser formateras med svensk decimalavskiljare.
- Tydligt nollträffsläge, namngiven sökning, annonserat träffantal och bibehållen All-markering vid resize. Originalets OCH-logik för taggar är bevarad.
