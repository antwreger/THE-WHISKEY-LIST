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

## Återanvändning och avgränsning

`src/pages/Dryck.jsx` kommer från [August-2.0](https://github.com/antwreger/August-2.0/blob/master/src/pages/Dryck.jsx). Sökning, filterlogik, tagggrupper, kategoriväxling, listkolumner och Mer info/Stäng är oförändrade. Bara originalsidans SEO, header/footer, bokningslänk och dekorativa scroll-hooks har tagits bort. `src/dryck.css` är originalets stilmall utan bakgrundsbild; `src/demo.css` lägger Brygghusets färger ovanpå.

`src/components/admin/BottleManager.jsx` återanvänds oförändrad från August-2.0. Ingen egen prissortering, filtermeny eller alternativ kortlayout läggs till.

Originalets sökning kräver att alla sökord matchar, oberoende av ordning. Mellanslagsfri sökning stöds. Filtergrupperna är Ålder, Land & Region, Stil, Rökighet, Fat och Destilleri. Alla valda taggar måste matcha. Rensa alla filter tar bort taggvalen, precis som i originalet; söktext och kategori behålls.

`src/utils/dataProvider.js` har samma flaskformat och funktionsgränssnitt som August, men sparar i localStorage utan API- eller produktionsanslutning. ID:n behålls lokalt. Exempeldata ligger i `src/data.js`. De är inte Brygghusets aktuella sortiment eller priser. Samma datakälla används av båda vyerna, och återläses när man går från administration till kundlista.

Brygghusets färger utgår från [företagets webbplats](https://www.brygghusetkrog.se/), kontrollerad 2026-10-30: mässing `#a47e48`, mörkgrå `#424647`/`#2f2f2f` och grå `#636766`. Inga bilder, logotyper eller originaltypsnitt kopieras.

Detta är en lokal demo utan inloggning. Administrationen är öppen. Lagerantal visas bara i adminvyn men localStorage är inte en säkerhetsgräns. Ingen e-post, beställning eller publik publicering ingår.
