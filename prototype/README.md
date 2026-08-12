# Direct — klikací prototyp mobilní appky

Statický HTML/CSS/JS prototyp bez buildu a bez závislostí. Staví se z Figmy
(`Mobilni Aplikace Direct`, fileKey `GnvGhYR5tQuqQ3Cl4KsUnj`) a z design systému
v `../direct-design-system/`.

## Jak to spustit

```bash
cd ~/Documents/LLM/Projects/App-prototype/prototype
python3 -m http.server 8765
open http://localhost:8765
```

Otevře se i dvojklikem na `index.html` (file://) — server je potřeba jen pro
testování na telefonu: `ipconfig getifaddr en0` → `http://<IP>:8765`.

Vypnout: `pkill -f "http.server 8765"`.

Na desktopu se renderuje jako 393×852 telefon, pod 480 px (nebo na dotykovém
zařízení) přepne na full-screen.

## Soubory

```
index.html          # všechny obrazovky + SVG sprite ikon + bottom sheety
css/tokens.css      # barvy, typografie, spacing, radius, elevace z DS
css/app.css         # shell (phone frame, status bar, screens) + tab bar
css/components.css  # všechny DS komponenty
js/app.js           # routing, sheety, carousely, přepínač stavů
assets/             # obrázky vytažené z Figmy
build.py            # sbalí to celé do jednoho souboru pro sdílení
```

## Sdílení jako Claude Artifact

```bash
python3 prototype/build.py
```

Vyrobí `prototype-bundle.html` v kořeni repa (je v `.gitignore`, necommituje se).
Artefakty nesmí sahat na externí zdroje, takže se CSS a JS inlinují a obrázky
jdou do data URI — proto ten jeden tučný soubor (~4,4 MB, limit je 16 MB).
Obal artefaktu dodává `<!doctype>`, `<html>`, `<head>` i `<body>`, takže build
bere jen obsah `<body>`.

Publikuje se přes Artifact tool na ten bundle. **Aby zůstala stejná URL, musí se
při republishi předat ta původní** — jiná cesta k souboru = nový link.

Aktuální artefakt: `https://claude.ai/code/artifact/4c7ee8ac-5cc8-4d25-a97d-831021504f3e`

**Pozor na font.** `Direct Sans` není v repu jako soubor, prototyp spoléhá na
systémovou instalaci. Komukoliv bez ní to spadne na Arial. Až se sežene
`.woff2`, patří do `build.py` jako `@font-face` s data URI.

## Routing

Hash-based, funguje back button i deep linky. Obrazovky jsou
`<section class="screen" data-screen="…">` v `index.html`.

| Hash | Obrazovka | Figma node |
|---|---|---|
| `#/domu` | Dashboard (default) | `21141:44428` |
| `#/muj-svet` | Můj svět — VerticalCard | `26480:143316` |
| `#/pridat` | Přidat do světa | `25847:15276` |
| `#/pomoc` | Pomoc — mám vozidlo | `3837:26545` |
| `#/vice` | Více | `610:29003` |
| `#/profil-auta` | Profil vozidla — Shrnutí | `23851:64928` |
| `#/profil-stav` | Profil vozidla — Stav | `25098:57918` / `24694:65589` |
| `#/profil-technicke` | Profil vozidla — Technické údaje | `24676:61762` |
| `#/pojisteni-vozidlo` | Detail pojištění — Vozidlo · Shrnutí | `5830:45548` |

Detailové obrazovky (profil, detail pojištění) nemají vlastní tab — mají `data-tab-parent="muj-svet"`,
takže v tab baru zůstane podsvícený Můj svět.

## Konvence v kódu

| Atribut | Co dělá |
|---|---|
| `data-goto="screen"` | klik otevře jinou obrazovku (funguje i na `role="button"` blocích) |
| `data-stop` | zastaví bublání, aby tlačítko uvnitř klikacího bloku fungovalo samo za sebe |
| `data-back` | `history.back()` |
| `data-open-sheet="id"` | otevře `#sheet-id` |
| `data-close-sheet` | zavře otevřený sheet (scrim, křížek, Esc, změna hashe) |
| `data-pilltoggle` | Letní/Zimní přepínač uvnitř karty |
| `data-step="±50"` | stepper tachometru |

**Carousely:** `.hscroll > .hscroll__track` — gutter 16 px je na *tracku*, ne na
scroll boxu (jinak se nevykreslí odsazení zleva). `.dots` hned za `.hscroll` se
automaticky vygenerují podle počtu slidů a sledují scroll.

## Přepínač stavů (prototypová pomůcka, není v designu)

Na profilových obrazovkách zapíná/vypíná **smajlík vpravo nahoře** lištu
`.protobar`. Všechny varianty karty žijí v DOMu uvnitř `.vgroup[data-group="…"]`
a přepínají se `hidden` atributem.

Pokrývá: STK notifikace (30/15/3/0 dní), tachometr (0–60/60–120/120+),
stav vozidla (vyplněno/neuvedeno), pojištění (zaplaceno / čeká / po splatnosti /
jinde / neuvedeno), olej, pneu, dálniční známku, SPZ (čeká na schválení).

Smazat = odstranit blok `.protobar` + `data-toggle-proto` z tlačítka.

## Bottom sheety

`add-vehicle`, `update-km`, `helper-km`, `stk`, `pojisteni-jinde`, `oil-help`,
`tyre-help`, `stk-help`, `vignette`, `vignette-help`, `edit-spz`.

Pozor: sheety v Shrnutí mají v designu **kolečko se šipkou dolů**, sheety ve Stav
a Technických údajích **křížek**. Je to tak i v kódu.

## Assety

Obrázky jsou vytažené z Figmy (`download_assets` → `sips -Z`), ne generované.
Vlajky CZ/AT a ikona mazlíčka jsou kreslené ručně — Iconoir je nemá.

Ikony = Iconoir (design systém je používá), inlinované jako `<symbol>` sprite
v `index.html` se `stroke="currentColor"`, aby se přebarvovaly podle stavu.

## Detail pojištění (pojistná smlouva)

**Stav: Shrnutí — Vozidlo je hotové** (`#/pojisteni-vozidlo`, 11. 8. 2026).
Zbývá PROPERTY (odložené, viz níž), PET, TRAVEL a všechny podstránky.

Ve Figmě je to celá stránka **`🟢 Detail pojištění`** (`2292:38343`). Profil je
zvlášť pro každý typ pojištění (VEHICLE / PROPERTY / PET / TRAVEL) a každý má
podstránky — pilulkový nav pod hlavičkou: `Shrnutí · Pojištění · Moje vozidlo ·
Platby` (scrolluje, dál můžou být další).

### Co je domluvené

- **Teď se dělá jen VEHICLE, a z něj jen obrazovka Shrnutí.**
  PROPERTY (Dům), PET a TRAVEL později, ale struktura na ně má být připravená.
- **PROPERTY je odložené** (rozhodnuto 11. 8. 2026): jediná nemovitost v prototypu
  (`Evropská 1234/32`) je „Pojištěno jinde", takže za ní žádná naše smlouva není
  a obrazovka by neměla kudy. Až se to bude dělat, vstup bude proklik ze
  „Srovnejte s Direct".
- **Struktura = jedna `<section>` na kombinaci typ+podstránka**, tak jak to už
  dělá `profil-auta` / `profil-stav` / `profil-technicke`. Žádná JS šablona,
  žádné přepínání dat podle typu. Nový typ = zkopírovat sekci a vyměnit
  typové bloky. Zvážená a zamítnutá alternativa: jedna šablona + JS, který
  podle hashe přepíná typové bloky — míň duplicity, ale prototyp přestane být
  čitelný „obrazovka = kus HTML" a hrozí, že úprava jednoho typu rozbije ostatní.
- Hash: `#/pojisteni-vozidlo` (`#/pojisteni-dum` až s PROPERTY).
- Podstránky, které se teď nedělají, budou v pilulkovém navu **mrtvé**.

### Odkud se otevírá (napojené)

Tři vstupy, všechny na VEHICLE → `#/pojisteni-vozidlo`:

| Obrazovka | Element |
|---|---|
| `#/muj-svet` | `.panel` s labelem `POJIŠTĚNÍ` v kartě Volvo XC90 |
| `#/domu` | `.dins` v carouselu Můj svět, karta Volvo XC90 |
| `#/profil-auta` | `.scard__head` „Pojištění" (u variant `zaplaceno`, `ceka`, `po-splatnosti`) |

`.dins` i `.panel` jsou sourozenci bloku s `data-goto="profil-auta"`, ne jeho
potomci — takže kolize nehrozí. `data-stop` mají jen `.dpay` a `.subcard` uvnitř,
aby tlačítka „Zaplatit" / „Přidat" nespouštěla proklik.

### Nové komponenty (CSS na konci `components.css`)

`.subnav` (nav podstránek), `.contractcard` (karta smlouvy),
`.paidband` + `.trow--tight` / `.trow--sub` (Platby), `.docrow`
(Dokumenty), `.personrow` + `.tag--mint` (Osoby), `.morelink` / `.listline` /
`.scard__eyebrow` (drobnosti). Nové ikony ve sprite: `ic-eye`, `ic-check-circle`.

**Pozor na jména tříd.** `.pillnav` a `.ccard` už v `components.css` existují pro
jiné obrazovky (ikonový pill v hlavičce Můj svět, malá produktová kartička).
Proto se tyhle jmenují `.subnav` a `.contractcard`. Než přidáš novou třídu,
prohledej `components.css` — soubor je jeden a jmenný prostor je plochý.

### Pravidlo: šipka = existuje detail

Kolečko se šipkou u `POJIŠTĚNÍ` se ukazuje **jen když za ním je naše smlouva**.
Stavy `Pojištěno jinde`, `Nevyplněno` a `Neuvedeno` ji nemají. Platí na
`#/muj-svet`, v carouselu na `#/domu` i na kartě Pojištění v `#/profil-auta`.

### Figma node ID

| Co | Node |
|---|---|
| stránka `🟢 Detail pojištění` | `2292:38343` |
| sekce Shrnutí | `5832:49442` |
| Shrnutí — Vozidlo | `5830:45548` |
| Shrnutí — Dům | `5832:47959` |
| Shrnutí — Byt / PETs / cestovko | `5832:47470` / `5832:48917` / `5832:48391` |
| podstránky: Platby / Dokumenty / Osoby / Předmět pojištění | `2292:40694` / `2292:40395` / `2292:40179` / `5834:38024` |

Bloky Shrnutí — Vozidlo (shora dolů), pro rychlý `get_screenshot`:

| Blok | Node |
|---|---|
| hlavička „Pojistná smlouva" + back | `5830:45551` |
| pilulkový nav podstránek | `5830:45645` |
| produktová karta (Aktivní, Volvo XC90, 1AA 4990, číslo smlouvy, platnost) | `16528:31794` |
| Pojištění — sjednáno | `6078:47162` |
| Potřebujete pomoc? | `6072:37495` |
| ~~Připomínky~~ | `6072:37841` — **nedělat**, viz pravidlo výš |
| Základní údaje o vozidle | `6076:38123` |
| Platby | `12531:44638` |
| dokumenty (viz odchylka níž) | `7754:204254` |
| Osoby na smlouvě | `6078:47456` |

Dům má stejnou kostru, jen jiné typové bloky + navíc „Smlouvy sjednal"
(`12551:66543`).

**Odchylka:** karta s dokumenty (`7754:204254`) má ve Figmě nadpis **„Platby"**,
ale obsah jsou dokumenty (Zelená karta, Akceptační dopis, Smlouva, Všeobecné
podmínky). Vypadá to na překlep v návrhu — v prototypu je napsaná jako
**„Dokumenty"**. Řečeno Markovi 11. 8. 2026.

Blok „Potřebujete pomoc?" na Shrnutí je ten samý, co je na Dashboardu a na
`#/pomoc` — recyklovaný `.helpcard` + `.arow`.

Ve Figmě jsou částky v kartě Platby jen `#### Kč`. V prototypu jsou dopsané tak,
aby seděly na carousel na `#/domu` (další platba 6 091 Kč, splatnost 5. 10. 2026,
pololetní frekvence → 12 182 Kč/rok).

## Co zbývá

- **Detail pojištění:** podstránky (`Pojištění`, `Moje vozidlo`, `Platby`) jsou
  v pilulkovém navu mrtvé; PROPERTY / PET / TRAVEL nejsou
- **Hodnota** — poslední mrtvá položka v segmentovce profilu, chybí Figma link
- Sekce „Maybe Future" ve Figmě — vědomě vynechaná (zadání)
- Sheety za tlačítky „Zaznamenat výměnu", „Nastavit", „Upravit" v sekci Stav
  (Oil Processing / Tire Maintenance formuláře, ~8 dalších sheetů ve Figmě)
- Karta „Přidat havarijní pojištění" má ve Figmě 4 barevná schémata, použité
  je jen bílé

### Pravidlo: žádné Připomínky na detailu pojištění

Karta **Připomínky** na stránky s pojištěním nepatří — **na žádnou**, ani na
podstránky, ani na PROPERTY / PET / TRAVEL, až se budou dělat. Ve Figmě na
Shrnutí je (`6072:37841`), v prototypu vědomě není. Zadání z 11. 8. 2026.

(Připomínky zůstávají tam, kam patří — v profilu vozidla. Vynechané jsou i ve
`#/vice`, viz Odchylky.)

## Vyřešeno: co má Volvo sjednané

Figma si odporovala — detail pojištění i profil tvrdí, že Volvo **má** havarijní
pojištění, ale zároveň ho karty nabízely *přidat*. Rozhodnuto 11. 8. 2026:

- **Sjednáno:** povinné ručení + havarijní pojištění. Nic víc.
- **Upsell je pojištění skel**, od 700 Kč/rok — na `#/muj-svet` (subcard v kartě
  Volvo) i v nabídkovém carouselu na `#/profil-auta`.
- Ze seznamu „sjednáno" na `#/pojisteni-vozidlo` je proto **pojištění skel
  vyškrtnuté** (ve Figmě `6078:47162` tam je).

Kdyby se sáhlo na jedno místo, je potřeba projít všechna tři.

## Odchylky od Figmy (vědomé)

- Opravené překlepy: „Direct pojišťovna" (Figma: pojišťna), „Volvo XC90" v
  Základních údajích (Figma: Vovlo), „Přenos síly" (Figma: Přenost)
- Ikonový pill v hlavičce Můj svět je z framu `AddProduct` — ve VerticalCard není
- Barvy `neutral` a `warning` variant produktové karty jsou odhad z náhledu,
  ne z tokenů (přesné hodnoty mám jen pro Volvo kartu)
- Obsah sheetu „Kde koupit dálniční známku" je dopsaný, ve Figmě rozbalený není
- Blok „Potřebujete pomoc?" na Dashboardu má u „Nahlásit událost" ikonu `ic-shield`,
  na obrazovce Pomoc je podle Figmy `ic-broken-vase` — nesjednoceno
- Ve Více chybí karta **Připomínky** (vynechaná na zadání), zbytek framu sedí
- **Plovoucí chat button se do prototypu nedává.** Je ve Figmě v komponentě
  `bottom bar`, takže vyskočí v každém framu, který odsud taháme — ignorovat ho,
  nepřidávat, neptat se na něj.

## Pracovní postup s Figmou

1. `get_metadata` na node → struktura (u velkých sekcí to spadne na limit a uloží
   se do souboru, pak parsovat přes python)
2. `get_screenshot` na jednotlivé podframy → čtení obsahu (celý screen bývá moc
   dlouhý na to, aby se dal přečíst)
3. `get_design_context` jen na klíčovou komponentu → přesné tokeny
4. `download_assets` na frame → `rawImages` pro fotky
