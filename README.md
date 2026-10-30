# THE WHISKEY LIST

Steg 1: fristående lokal demo av en kundvänd dryckeslista och tillhörande flaskadministration för Brygghuset i Fiskebäckskil.

## Starta lokalt

Kräver Python 3 och en modern webbläsare. Inga npm-paket, byggsteg, API-nycklar eller produktionsanslutningar.

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Öppna http://127.0.0.1:4173 för kundlistan och http://127.0.0.1:4173/#admin för administrationen. Kör från repots rot. Använd HTTP-servern, inte `file://`.

## Funktioner

- Whiskey och rom, fritextsökning, filter för region/land och rökighet samt pris-/namnsortering.
- Expanderbara flaskdetaljer och responsiv kundvy utan bilder eller logotyper.
- Skapa, redigera, visa/dölj och radera flaskor. Pris och lagerantal valideras i formuläret.
- Samma lista i kundvy och administration. Dolda flaskor saknas i kundvyn.
- localStorage behåller ändringar mellan omladdningar. Flikar på samma origin uppdateras via storage-event.
- Återställ exempeldata med bekräftelse. Lagringsfel visas utan att ge sken av att data sparats.

Alla priser, lagerantal och smaktexter är exempel. Färgerna utgår från [Brygghusets webbplats](https://www.brygghusetkrog.se/), kontrollerad 2026-10-30: accent `#a47e48`, mörkgrå `#424647`/`#2f2f2f` och textgrå `#636766`. Ljus bakgrund och systemtypsnitt håller demot enkelt; inga logotyper, bilder eller originaltypsnitt har kopierats. Detta är en förenklad tolkning av webbplatsens stil, inte en grafisk manual.

## Struktur och återanvändning från August

- `index.html`: sidstruktur och vyväxling.
- `src/data.js`: lokal datakälla, exempeldata, filter och sortering. Modell: tenant/category/item med `metadata`, `price_text`, `is_active` och stabila ID:n.
- `src/app.js`: kundlista, formulär och CRUD.
- `src/styles.css`: färger, typografi och responsiv layout.

Modell och funktioner bygger på analysen av [August-2.0](https://github.com/antwreger/August-2.0), särskilt `BottleManager.jsx`, `Dryck.jsx` och `dataProvider.js`. React-komponenterna har **inte** kopierats: vyerna är nyimplementerade i vanlig JavaScript för en demo utan byggberoenden. Flaskegenskaper använder API:ts ASCII-nycklar (`alder`, `rokighet`, `importor`). Sparande använder stabila ID:n i stället för Augusts kategoriersättning. `src/data.js` är utbytespunkten för ett framtida backend-API.

## Avgränsningar

Ingen inloggning, serverdatabas, publicering eller riktig bokning/beställning. Administrationen är avsiktligt öppen i denna lokala demo. Data delas endast inom samma webbläsare/origin. Lagerantal utelämnas när kundvyn skapas, men all lokal data går att läsa med webbläsarverktyg; detta är inte en behörighetsgräns. För en publik driftversion krävs backendbehörigheter och serverfiltrering.

## Manuell kontroll

1. Sök efter `Islay`, filtrera på hög rökighet och ändra prissortering. Rensa filter.
2. Lägg till en flaska under Administration. Växla till kundlistan och sök efter namnet.
3. Ändra priset, ladda om och kontrollera att ändringen finns kvar och ID:t är oförändrat.
4. Dölj flaskan: den ska försvinna för kunden. Visa den igen och radera den med bekräftelse.
5. Testa tom träfflista, mobilbredd, tangentbord och dialogens Escape/Avbryt.
6. Öppna två flikar på samma adress och kontrollera att en sparning uppdaterar den andra.
