# Vipps-betaling – oppsett og veien til produksjon

Byggeplan og søknadshefte selges digitalt fra designverktøyet. All
Vipps-kommunikasjon skjer server-side i Vercel-funksjonene under `/api`;
nøklene finnes aldri i klient-bundelen.

## Hvor ting ligger

| Fil | Ansvar |
| --- | --- |
| `api/_lib/vipps.ts` | ePayment v1-klient: token, opprett, status, kapring |
| `api/_lib/creds.ts` | Leser Vipps-nøklene fra miljøet |
| `api/_lib/pricing.ts` | **Autoritativ pris** pr. produkt og leveranse |
| `api/_lib/entitlements.ts` | Opplåsing + frysing av designet |
| `api/_lib/kode.ts` | Genererer og sammenligner tilgangskoder |
| `api/_lib/email.ts` | Resend – kvittering med tilgangskode |
| `api/vipps/create.ts` | Starter betaling, returnerer `redirectUrl` |
| `api/vipps/status.ts` | Kaprer, låser opp, sender kode på e-post |
| `api/vipps/redeem.ts` | Løser inn 6-sifret tilgangskode |
| `api/plan/bestill.ts` | Manuell salgsvei (lanseringsmodus) |
| `firestore.rules` | Gjør betalingsfeltene server-only |
| `src/services/vippsService.ts` | Klientkall + **prisestimat** for visning |

### Pris må holdes i sync på tre steder

Byggeplanens pris står i `template.fraPris` (kilden kunden ser),
`PRISER` i `api/_lib/pricing.ts` (det serveren faktisk krever) og
`VIPPS_BELOP` i `src/services/vippsService.ts` (klientestimat). Legger du inn
et nytt produkt uten å oppdatere de to siste, faller det tilbake til
`DEFAULT_PRIS.plan` (299 kr) og du selger for lite.

## Sikkerhetsmodellen

`betalt`, `kjopt`, `frosset`, `tilgangskode`, `kodeForsok` og `vipps` er
**server-only**: `firestore.rules` avviser klientskriving av dem, og bare
Vercel-funksjonene (Firebase Admin SDK) kan sette dem.

Tilgangskoden lages av `randomInt` på serveren – aldri utledet av
`templateId`/`userId`/`designId`, som klienten kjenner. Firestore kan ikke
skjule enkeltfelt i et lesbart dokument, så koden legges bare på dokumenter
kunden ikke kan lese:

- **Vipps-kjøp:** koden skrives til designet først ved kapret betaling. Da har
  kunden betalt, og at hen kan lese den er greit.
- **Manuelt salg:** koden ligger på `designForesporsler`-dokumentet, som bare
  admin kan lese.

`redeem` tåler 10 bomforsøk pr. design før koden er død.

## Miljøvariabler

Se `.env.example` for hele lista med kommentarer. Kort:

- **Klient (`VITE_*`, offentlig):** `VITE_LANSERINGSMODUS`, `VITE_VIPPS_NUMMER`,
  `VITE_DESIGNER_DEMO_CODE`, `VITE_VIPPS_API_URL`.
- **Server (hemmelig):** `VIPPS_CLIENT_ID`, `VIPPS_CLIENT_SECRET`,
  `VIPPS_SUBSCRIPTION_KEY`, `VIPPS_MSN`, `VIPPS_ENV`,
  `FIREBASE_SERVICE_ACCOUNT`, `RESEND_API_KEY`, `EPOST_FRA`, `ADMIN_EPOST`,
  `SITE_URL`, `ALLOWED_ORIGIN`.

Sett **aldri** `VITE_`-prefiks på en Vipps-nøkkel – Vite baker `VITE_*` inn i
klient-bundelen i klartekst.

Lokal `.env` er gitignorert og leses **ikke** av Vercel i produksjon.
Produksjonsverdier settes i Vercel:

```bash
vercel login
vercel link
vercel env add VIPPS_CLIENT_SECRET production   # gjenta pr. variabel
```

## Fase 1 – lansering uten Vipps-API (der vi er nå)

Vipps slipper ikke produksjonsnøkler før nettsiden er publisert og
salgsavtalen godkjent. Sett `VITE_LANSERINGSMODUS=1`. Da:

- Byggeplanen låses opp med 6-sifret kode, ikke med Vipps i appen.
- «Betal med Vipps» blir «Be om byggeplan» → `POST /api/plan/bestill` lager
  koden, lagrer forespørselen og varsler `ADMIN_EPOST`.
- Byggesøknad-heftet er avslått og viser «Kommer snart».

Salgsflyten:

1. Kunden designer, lagrer og ber om byggeplanen.
2. Du får e-postvarsel, og ser forespørselen på `/admin/foresporsler` med
   tilgangskoden og en ferdig svartekst i «send e-post»-lenka.
3. Kunden Vippser deg manuelt.
4. Du sender koden. Kunden skriver den inn og laster ned planen.
5. Forespørselen settes automatisk til «lukket» når koden er innløst.

Sett `VITE_VIPPS_NUMMER` så Vipps-nummeret kommer med i svarteksten.

## Fase 2 – slå på Vipps-API i produksjon

1. **Bestill produktet.** I `portal.vippsmobilepay.com` mangler
   produksjonsnøkler til du har bestilt et Online payments-produkt.
   For engangsbetaling på nett er det **Payment Integration** (ikke Recurring
   Payments, som er abonnement, og ikke Login, som bare er innlogging).
   Aktivering tar noen virkedager – Vipps oppgir inntil 10.
2. **Hent nøklene.** Portalen → **For developers** → velg miljø
   **Production** → finn salgsenheten → **Show keys**. Der ligger
   `client_id`, `client_secret`, `Ocp-Apim-Subscription-Key` og MSN.
3. **Sett dem i Vercel** (se kommandoen over), inkludert
   `VIPPS_ENV=production`.
4. **Verifiser mot testmiljøet først** med `VIPPS_ENV=test` og testnøkler:
   opprett betaling, betal i test-appen, sjekk at `kjopt` og `frosset` blir
   satt og at e-posten kommer.
5. **Fjern `VITE_LANSERINGSMODUS`** i Vercel og redeploy. Da er
   Vipps-knappen aktiv og søknadsheftet salgbart igjen.
6. **Fjern `VITE_DESIGNER_DEMO_CODE`** i produksjon – den låser opp alt gratis.

## Etter endring i `firestore.rules`

Reglene i repoet er kilden, men de må publiseres:

```bash
firebase deploy --only firestore:rules
```

eller lim inn i Firebase Console → Firestore Database → Rules → Publish.

## Kjent begrensning

Opplåsingen håndheves i klienten (`har()`/`harNed()` i `DesignerPage`), som er
det man kan gjøre når PDF-en genereres i nettleseren. Reglene og
server-endepunktene stopper juks i databasen, men en teknisk kyndig bruker kan
fortsatt manipulere sin egen nettleser. Skal det tettes helt, må PDF-en
genereres server-side og leveres bak et signert nedlastingskall.
