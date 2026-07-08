# Tuotekorttikone

Sisäinen työkalu ravintolabrändien tuotekorttien, misa-ohjeiden ja printattavien
keittiöohjeiden tekemiseen. Rakennettu Next.js + TypeScript + Tailwind -stackilla.

**Ydinajatus:** brändille rakennetaan ensin visuaalinen pohja (Brand Template
Builder), minkä jälkeen kaikki saman brändin kortit renderöityvät automaattisesti
brändin näköisinä — esikatselussa, printissä ja PDF:ssä identtisesti.

## Käynnistys (2 min, ei vaadi mitään avaimia)

```bash
cd tuotekorttikone
npm install
npm run dev
```

Avaa http://localhost:3000 — sovellus käynnistyy **demo-tilassa**:

- data tallentuu paikallisesti tiedostoon `.data/db.json`
- mukana on valmis testidata: **Dust & Fry** ja **GYRÖ** + 6 esimerkkikorttia
  (Hot Honey Burger, Dust Fry, DF-majoneesi, Berlin Döner, Minttu-punakaali,
  Voipapuhummus)
- kuvat tallentuvat kansioon `public/uploads/`
- roolia (Admin / Editor / Viewer) vaihdetaan sivupalkista

Demo-tilan voi nollata poistamalla `.data`-kansion — seed-data luodaan uudelleen.

## Ympäristömuuttujat

Kopioi `.env.example` → `.env.local` ja täytä tarvittavat:

| Muuttuja | Mitä tekee |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kytkee Supabase-tilan (tietokanta, auth, storage) |
| `SUPABASE_SERVICE_ROLE_KEY` | Palvelinpuolen operaatiot |
| `LLM_PROVIDER` | `anthropic` \| `openai` \| `heuristic` (oletus) |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Smart Importin LLM-jäsennys |
| `PDF_CHROME_PATH` | Chrome/Chromium-binäärin polku PDF-exportia varten |

## Supabase käyttöön

1. Luo projekti [supabase.com](https://supabase.com)
2. Aja `supabase/schema.sql` SQL Editorissa (taulut + RLS-politiikat + allergeenit)
3. Luo Storage-bucket `cards` (public read)
4. Täytä env-muuttujat `.env.local`-tiedostoon
5. Lisää käyttäjät `users`-tauluun ja aseta roolit (`admin` / `editor` / `viewer`)

Skeema sisältää taulut: `users`, `brands`, `brand_templates`, `products`,
`product_versions`, `product_images`, `misas`, `misa_versions`, `allergens`,
`product_allergens`, `exports`, `audit_log` — RLS-politiikat roolien mukaan.

> Demo-tilan tiedostopohjainen varasto (`lib/store.ts`) ja API-reitit
> (`app/api/data/route.ts`) on kirjoitettu niin, että Supabase-adapterin voi
> pudottaa samaan rajapintaan koskematta käyttöliittymään.

## Smart Import ja LLM

Smart Import (`/import`) jäsentää minkä tahansa raakatekstin kortiksi:

- **Ilman API-avainta:** sääntöpohjainen jäsennin (`lib/parser.ts`) tunnistaa
  raaka-aineet määrineen, lämpötilat, ajat, säilyvyydet, hinnat ja allergeenit.
- **API-avaimella:** provider-pohjainen LLM-kerros (`lib/llm.ts`).
  `LLM_PROVIDER=anthropic` käyttää Claudea (`claude-opus-4-7`),
  `LLM_PROVIDER=openai` OpenAI:ta. Provider vaihdetaan env-muuttujalla,
  koodiin ei kosketa. LLM-virhetilanteessa pudotaan automaattisesti
  heuristiseen jäsentimeen.

Jäsennyksen jälkeen sovellus näyttää **puuttuvien tietojen listan** — käyttäjä
täydentää tai merkitsee "ei koske tätä tuotetta" ennen kortin luontia.

## PDF-export

Kaksi reittiä, molemmat tuottavat saman näkymän kuin esikatselu:

1. **Selaimen printti** (toimii aina): jokaisella kortilla on printtinäkymä
   (`/print/card/[id]`) A4-mitoilla — Tulosta → Tallenna PDF.
2. **Playwright-PDF** (`/api/pdf`): asenna Chromium `npx playwright install chromium`
   tai osoita olemassa olevaan Chromeen `PDF_CHROME_PATH`-muuttujalla.
   "Lataa PDF" -napit käyttävät tätä ja putoavat automaattisesti selaimen
   printtiin jos moottoria ei ole.

Exportit: A4 tuotekortti · A4 keittiöohje · Misa-ohje · Allergeenikooste ·
Brändin kaikki kortit yhtenä PDF:nä.

## Roolit

| Rooli | Oikeudet |
|---|---|
| **Admin** | brändien luonti ja muokkaus, korttien poisto, kaikki toiminnot |
| **Editor** | korttien luonti/muokkaus/hyväksyntä, PDF-exportit |
| **Viewer / Kitchen** | katselu ja printtaus |

Demo-tilassa rooli vaihdetaan sivupalkin valikosta (cookie). Supabase-tilassa
rooli tulee `users.role`-sarakkeesta ja RLS valvoo sitä myös tietokantatasolla.

## Toimintalogiikka

1. Valitse brändi → 2. valitse korttityyppi → 3. syötä tiedot lomakkeella tai
Smart Importilla → 4. sovellus jäsentää → 5. puuttuvat tiedot listataan →
6. täydennä tai ohita → 7. lisää kuva (tai luota tyylikkääseen placeholderiin) →
8. brändin mukainen esikatselu päivittyy reaaliajassa → 9. tallenna luonnos tai
lähetä tarkistettavaksi → 10. hyväksytty kortti näkyy keittiön printtinäkymässä.

**Validointi:** korttia ei voi hyväksyä ilman nimeä, brändiä, korttityyppiä,
vähintään yhtä ohjetta/kuvausta, allergeenitietoa (tai "ei tiedossa" -merkintää)
ja versionumeroa. Palvelin tarkistaa tämän myös API-tasolla.

**Versionhallinta:** jokainen muokkaus tallentaa edellisen tilan snapshotina —
versiohistoria näyttää kuka, milloin ja mitä kenttiä muutti, ja version voi
palauttaa.

## Hakemistorakenne

```
app/                    Next.js App Router -sivut
  api/data              CRUD (demo-varasto; Supabase-adapterin paikka)
  api/parse             Smart Import -jäsennys (LLM tai heuristiikka)
  api/upload            Kuvien upload
  api/pdf               Playwright-PDF
  brands/[id]           Brand Template Builder
  print/…               Printtinäkymät (A4, sama renderöinti kuin esikatselu)
components/             BrandCard, CardForm (ProductForm/MisaForm), CardSheet,
                        SmartImport, MissingFieldsPanel, ImageUploader,
                        AllergenSelector, VersionHistory, PdfExportButton…
lib/                    types, store, seed, parser, llm, validate, brand-style
supabase/schema.sql     PostgreSQL-skeema + RLS
```
