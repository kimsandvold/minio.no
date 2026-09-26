# Utviklingsnotater

Notater for videre utvikling av minio.no. Ikke påbegynt — idéstadiet.

## Lav-terskel lead-skjema og verdikommunikasjon (2026-09-15)

**Mål:** Gjøre det enkelt for potensielle kunder å knytte kontakt og starte en diskusjon — uten at de må kjøpe noe.

1. **Lav-terskel lead-skjema**
   - Et skjema/kontaktpunkt med minimal friksjon som senker terskelen for å ta kontakt og starte diskusjoner.
   - Må finne en god løsning på formatet (skjema, chat, "book en prat", e.l.).

2. **Vise besparelser**
   - Trenger en måte å vise/fortelle at man sparer **penger, tid og arbeid** ved å bruke Minio.

3. **Merverdi-budskap**
   - Noe som forteller at Minio gir **merverdi for deg som bruker**.

4. **Gratis inngang til nettverket**
   - Kjerneprinsipp: man skal **ikke trenge å kjøpe noe** for å bli en del av nettverket.

## Nettverk = trygghet (2026-09-19)

Diskusjon rundt punktene over. Konklusjon: **nettverkets innhold er trygghet for
sluttbrukeren.** Det gir ordet en referent det manglet.

### Det strukturelle argumentet

SEO-motoren (50+ byggeguider) skaper etterspørsel i **hele Norge**.
Produksjonskapasiteten er **ett verksted på Lillehammer** — se
`src/utils/leveringsavstand.ts`, som bokstavelig talt måler radiusen.
Nettverket er ikke branding, det er den eneste måten å betjene trafikken
som allerede finnes.

Følge: etterspørselssiden er dekket. **Hele cold-start-problemet ligger på
tilbudssiden** (utførere/leverandører).

### Tryggheten finnes allerede i koden — den kalles bare noe annet

| Finnes i dag | Hvor | Egentlig betydning |
|---|---|---|
| `ferdig` \| `materialpakke` | `src/types/foresporsel.ts` | «Klarer du ikke selv, tar vi over» |
| Rådgivning + gjennomgang av tegning | `/byggehjelp` | «Du kan spørre noen» |
| Eurocode / NS 3478 / kappliste | `src/designer/konstruksjon.ts` | «Planen holder» |

Alle tre ligger som produktvalg bak innlogging, langt nede i trakten. Ingen av
dem møter brukeren i **tvilsøyeblikket** (i planleggeren, når hen lurer på om
bjelkene bærer). Billigste store endring: flytt dem dit tvilen oppstår, og
formuler dem som løfte i stedet for prisliste.

### Trygghetsstigen

1. **Planen er kvalitetssikret** — finnes, må bare vises på artefaktet. Nær gratis.
2. **Du mister ikke arbeidet ditt** — prosjektet lagres. Billig.
3. **Du kan spørre om ditt prosjekt** — én async kanal, hengt på konfigurasjonen. Billig, stor effekt.
4. **Noen kan ta over** — `ferdig` / `materialpakke`. Finnes; må kommuniseres, ikke bygges.
5. **Noen i nærheten kan ta over** — krever utførernettverk. Dyrt, senere — og *det* er nettverket.

**Trinn 1–4 er uavhengige av hvilken nettverksform som velges, og kan bygges nå.**

### Designprinsipp for lead-fangsten

Ikke «et lead-skjema». Brukeren har allerede gjort jobben — konfigurasjonen *er*
leadet. Spørsmålet er aldri «vil du kontakte oss?» (salgsgest, høy terskel), men
«vil du ha denne med deg?» (servicegest, ingen terskel). E-post blir middelet til
å få sin egen ting tilbake, ikke en bomstasjon.

Ett felt, kontekstuelt, overalt hvor det finnes et artefakt (planleggere,
designer, kalkulatorer). Payload henger på automatisk: produkt, mål, BOM, estimat.

Avvist: chat (skaper svartidsforventning én person ikke kan holde) og «book en
prat» (for stor forpliktelse for privatperson; B2B-format).

### Innlogging

Google-innlogging beholdes — et nettverk krever identitet, og anonyme brukere er
ikke medlemmer. Men **når**, ikke **om**: innlogging *før* verdi er bunnpropp;
innlogging *som innmelding*, etter at de har laget noe de vil beholde, leser som
medlemskap.

- **Arbeidet må overleve innloggingen.** Planleggerne bruker allerede
  localStorage — lagre lokalt først, migrer til Firestore ved innlogging.
  Enklere enn anonym auth, og Google-kravet beholdes.
- **Google-only koster rekkevidde.** Målgruppa (huseiere 45–65) bruker mye
  Hotmail/Outlook/iCloud. Firebase e-postlenke er ~samme kodemengde og dekker
  resten. Ikke avgjort.

### Om besparelser (punkt 2 over)

Tallene finnes allerede: `estimatKr`, `prisEstimatKr`, kapplista. Besparelsen bør
**utledes fra brukerens eget design**, ikke påstås i markedsføringstekst.

Ikke gå på «billigere enn snekker» — uprøvbart, og inviterer til prisshopping.
Vinkling: planen hindrer de dyre feilene. «Kapplista gir eksakt antall bord.
Typisk overkjøp uten kappliste er 10–15 % → ~1 500 kr på ditt prosjekt.»

NB: udokumenterte besparelsespåstander mot forbruker er regulert
(markedsføringsloven). Bare tall som kan utledes eller kildes, med grunnlaget synlig.

### Svartid

Null stress på *volum* er ikke null stress på *svartid*. Trygghet dør hvis
spørsmålskanalen går tom. Regel: **lov bare det som er automatisk, la menneskelig
svar være en bonus.** Aldri et «svarer innen 24t»-løfte som ikke holder i fellesferien.

### ÅPENT — må avgjøres før trinn 5

Hvem er medlemmene utover sluttbrukerne?

- **A. Utførernettverk** — snekkere/småbedrifter/leverandører som tar jobber
  utenfor Lillehammer-radiusen. Passer businessmodellen (config → produksjon) og
  løser rekkevidde. Krever rekruttering + kvalitetssikring, men kan starte med
  2–3 stk uten at brukeren merker at det er lite.
- **B. Byggernettverk (peers)** — privatpersoner som deler prosjekter og erfaring.
  Sterk trygghetseffekt («342 har bygget denne»), men brutal cold start og krever
  moderering.
- **C. Minio som garantist** — ingen tredjepart. Ærlig MVP (= trinn 1–4), men
  skalerer ikke utover kjøreavstand, og er strengt tatt støtte, ikke nettverk.

Status: til vurdering.
