import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import {
  getAlleForesporsler,
  oppdaterForesporselOppfolging,
  oppdaterForesporselStatus,
} from '../../../services/foresporselService'
import type { DesignForesporsel, ForesporselStatus } from '../../../types/foresporsel'
import { foresporselStatusLabel, foresporselTypeLabel } from '../../../types/foresporsel'
import type { Oppfolging } from '../../../types/oppfolging'
import AdminOppfolging from './AdminOppfolging'
import { AdminPageHead, Tabs, Tab, Loading, Empty } from './adminUi'

/**
 * Ferdig svartekst for byggeplan-forespørsler.
 *
 * Salget går manuelt inntil videre (se VITE_LANSERINGSMODUS i DesignerPage):
 * kunden får tilgangskoden MED fakturaen, ikke etter at den er betalt, slik at
 * planen er tilgjengelig med én gang. Betalingsplikten står uavhengig av om
 * planen er lastet ned – det er også slik salgsbetingelsene § 5 er formulert.
 * Fakturaen sendes fra regnskapsløsningen; denne teksten er følgebrevet.
 */
const FORFALL_DAGER = 14

function svarTekst(f: DesignForesporsel): string {
  return [
    `Hei, og takk for at du brukte designverktøyet!`,
    ``,
    `Byggeplan for «${f.designNavn}»: ${formatKr(f.prisEstimatKr)}`,
    ``,
    `Tilgangskode: ${f.tilgangskode ?? ''}`,
    ``,
    `Åpne designet på minio.no, trykk «Lås opp byggeplan» og skriv inn koden.`,
    `Da får du materialliste, alle mål og byggeplanen som PDF med én gang.`,
    ``,
    f.kunde?.fulltNavn
      ? `Faktura sendes til ${f.kunde.fulltNavn}, ${[f.kunde.adresse, [f.kunde.postnr, f.kunde.poststed].filter(Boolean).join(' ')].filter(Boolean).join(', ')}.`
      : '',
    `Faktura på ${formatKr(f.prisEstimatKr)} kommer i egen e-post, med ${FORFALL_DAGER} dagers`,
    `betalingsfrist. Du trenger ikke vente på den for å bruke planen.`,
    ``,
    `Si fra hvis noe er uklart, så hjelper jeg deg.`,
    ``,
    `Minio`,
  ].join('\n')
}

const formatKr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

// «ufakturert» er arbeidslista: byggeplanene er solgt mot faktura, så det er
// her du ser hvem som har fått koden uten at regningen er sendt.
type FilterKey = 'alle' | ForesporselStatus | 'ufakturert'
const filterOptions: FilterKey[] = ['alle', 'ny', 'besvart', 'lukket', 'ufakturert']
const statuser: ForesporselStatus[] = ['ny', 'besvart', 'lukket']

const filterNavn = (k: FilterKey) =>
  k === 'alle' ? 'Alle' : k === 'ufakturert' ? 'Ikke fakturert' : foresporselStatusLabel[k]

const treffer = (f: DesignForesporsel, k: FilterKey) =>
  k === 'alle' ? true : k === 'ufakturert' ? !f.fakturert : f.status === k

export default function AdminForesporslerPage() {
  const [liste, setListe] = useState<DesignForesporsel[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('alle')

  useEffect(() => {
    getAlleForesporsler().then(setListe).finally(() => setLoading(false))
  }, [])

  const setStatus = async (id: string, status: ForesporselStatus) => {
    setListe((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)))
    try { await oppdaterForesporselStatus(id, status) } catch { /* optimistisk */ }
  }

  const setOppfolging = async (id: string, endring: Oppfolging) => {
    await oppdaterForesporselOppfolging(id, endring)
    setListe((prev) => prev.map((f) => (f.id === id ? { ...f, ...endring } : f)))
  }

  const synlige = liste.filter((f) => treffer(f, filter))
  const antall = (k: FilterKey) => liste.filter((f) => treffer(f, k)).length

  return (
    <>
      <AdminPageHead title="Forespørsler" subtitle="Bygging og byggeplan-koder fra designverktøyet." />

      {loading ? (
        <Loading><Icon name="faSpinner" spin /> Laster forespørsler …</Loading>
      ) : (
        <>
          <Tabs>
            {filterOptions.map((k) => (
              <Tab key={k} $active={filter === k} onClick={() => setFilter(k)}>
                {filterNavn(k)} <em>({antall(k)})</em>
              </Tab>
            ))}
          </Tabs>

          {synlige.length === 0 ? (
            <Empty>
              <h2>Ingen forespørsler</h2>
              <p>{filter === 'ufakturert' ? 'Alt er fakturert.' : 'Ingen forespørsler med denne statusen.'}</p>
            </Empty>
          ) : (
            <Liste>
              {synlige.map((f) => (
                <Kort key={f.id}>
                  <KortTop>
                    <div>
                      <TypeTag $type={f.type}>{foresporselTypeLabel[f.type]}</TypeTag>
                      <h3>{f.designNavn} <span>· {f.produktNavn}</span></h3>
                    </div>
                    <StatusVelg value={f.status} onChange={(e) => f.id && setStatus(f.id, e.target.value as ForesporselStatus)}>
                      {statuser.map((s) => <option key={s} value={s}>{foresporselStatusLabel[s]}</option>)}
                    </StatusVelg>
                  </KortTop>
                  <Fakta>
                    <span><b>Mål</b> {f.maal}</span>
                    <span><b>Areal</b> {f.arealM2 != null ? `${f.arealM2.toFixed(1)} m²` : '–'}</span>
                    <span><b>Materialer</b> {formatKr(f.estimatKr)}</span>
                    <span><b>Prisestimat</b> fra {formatKr(f.prisEstimatKr)}</span>
                  </Fakta>
                  {f.kunde && (
                    <Kunde>
                      <div><em>Faktureres til</em><b>{f.kunde.fulltNavn || '(uten navn)'}</b></div>
                      <div><em>Mobil</em><b>{f.kunde.mobil || '–'}</b></div>
                      <div><em>Adresse</em><b>{[f.kunde.adresse, [f.kunde.postnr, f.kunde.poststed].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '–'}</b></div>
                      <div><em>E-post</em><b>{f.kunde.epost || f.userEmail || '–'}</b></div>
                    </Kunde>
                  )}
                  {f.type === 'byggeplan' && f.tilgangskode && (
                    <KodeBoks>
                      <div>
                        <em>Tilgangskode</em>
                        <b>{f.tilgangskode}</b>
                      </div>
                      <KodeKnapp
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(f.tilgangskode ?? '')}
                        title="Kopier koden"
                      >
                        <Icon name="faCopy" /> Kopier
                      </KodeKnapp>
                    </KodeBoks>
                  )}
                  {f.type === 'byggeplan' && f.adminVarslet === false && (
                    <Advarsel>
                      <Icon name="faExclamationTriangle" /> Varsel-e-posten gikk ikke ut (sjekk
                      RESEND_API_KEY, EPOST_FRA og ADMIN_EPOST). Koden over er gyldig uansett.
                    </Advarsel>
                  )}
                  {f.designId && (
                    <DesignLenke
                      to={`/designverktoy/${f.produktId}?design=${f.designId}`}
                      title="Åpner kundens design i designverktøyet – låst opp, klar til nedlasting"
                    >
                      <Icon name="faFilePdf" />{' '}
                      {f.type === 'byggeplan' ? 'Åpne designet og last ned byggeplanen' : 'Åpne designet'}
                    </DesignLenke>
                  )}
                  <Spec>{f.sammendrag}</Spec>
                  {f.konfigurasjon && <Spec style={{ whiteSpace: 'pre-line' }}>{f.konfigurasjon}</Spec>}
                  {f.melding && <Melding>«{f.melding}»</Melding>}
                  {f.id && (
                    <Oppfolgingsrad>
                      <AdminOppfolging verdi={f} onLagre={(endring) => setOppfolging(f.id as string, endring)} />
                    </Oppfolgingsrad>
                  )}
                  <KortBunn>
                    <a
                      href={`mailto:${f.userEmail}?subject=${encodeURIComponent(
                        f.type === 'byggeplan'
                          ? `Byggeplan for ${f.designNavn} – Minio`
                          : `Svar på din forespørsel – ${f.designNavn}`,
                      )}${f.type === 'byggeplan' ? `&body=${encodeURIComponent(svarTekst(f))}` : ''}`}
                    >
                      <Icon name="faEnvelope" /> {f.userEmail}
                    </a>
                  </KortBunn>
                </Kort>
              ))}
            </Liste>
          )}
        </>
      )}
    </>
  )
}

const Liste = styled.div`display: flex; flex-direction: column; gap: 1rem;`
const Oppfolgingsrad = styled.div`margin-top: 0.9rem;`
const Kort = styled.div`
  background: #fff; border: 1px solid #e7e5df; border-radius: 14px; padding: 1.15rem 1.25rem; box-shadow: 0 1px 3px rgba(60, 42, 28, 0.04);
`
const KortTop = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 0.8rem;
  h3 { margin: 0.35rem 0 0; font-size: 1.05rem; color: #16181d; span { color: #7a6f61; font-weight: 500; } }
`
const TypeTag = styled.span<{ $type: string }>`
  display: inline-block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  padding: 0.2rem 0.55rem; border-radius: 999px;
  color: ${({ $type }) =>
    $type === 'ferdig' ? '#3a5f3a' : $type === 'byggeplan' ? '#2f4a5a' : '#5a4a2f'};
  background: ${({ $type }) =>
    $type === 'ferdig'
      ? 'rgba(123,156,123,0.18)'
      : $type === 'byggeplan'
        ? 'rgba(99,149,189,0.18)'
        : 'rgba(189,149,99,0.18)'};
`
const StatusVelg = styled.select`
  flex-shrink: 0; padding: 0.45rem 0.7rem; border: 1px solid #ddd4c7; border-radius: 8px; background: #fff; font-family: inherit; font-weight: 600; font-size: 0.85rem; cursor: pointer;
`
const Fakta = styled.div`
  display: flex; flex-wrap: wrap; gap: 0.5rem 1.4rem; margin-bottom: 0.7rem;
  span { font-size: 0.88rem; color: #2e2a26; b { color: #7a6f61; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; margin-right: 0.3rem; } }
`
const Spec = styled.div`font-size: 0.8rem; color: #7a7065; line-height: 1.5; padding-top: 0.6rem; border-top: 1px solid #efe9e0;`
const Melding = styled.p`margin: 0.7rem 0 0; padding: 0.7rem 0.85rem; background: #f7f5ef; border-left: 3px solid #7b9c7b; border-radius: 0 8px 8px 0; font-size: 0.9rem; color: #2e2a26; font-style: italic;`
const KortBunn = styled.div`
  margin-top: 0.9rem; padding-top: 0.7rem; border-top: 1px solid #efe9e0;
  a { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.85rem; font-weight: 600; color: #3a5f3a; text-decoration: none; &:hover { text-decoration: underline; } }
`

/* Fakturaopplysningene samlet – det du trenger for å sende regningen. */
const Kunde = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-top: 0.9rem;
  padding: 0.85rem 1rem;
  background: #faf7f2;
  border: 1px solid #ece6dd;
  border-radius: 10px;

  div { display: flex; flex-direction: column; min-width: 0; }
  em {
    font-style: normal;
    font-size: 0.64rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8a7f72;
  }
  b { font-size: 0.86rem; font-weight: 600; overflow-wrap: anywhere; }
`

const KodeBoks = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  margin: 0 0 0.8rem; padding: 0.7rem 0.9rem; border: 1px dashed #b9c6d0;
  background: #f4f8fa; border-radius: 10px;
  em { display: block; font-style: normal; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7c88; }
  b { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.5rem; letter-spacing: 0.22em; color: #16181d; }
`
const Advarsel = styled.div`
  display: flex; align-items: center; gap: 0.5rem;
  margin: 0 0 0.8rem; padding: 0.6rem 0.85rem; border-radius: 9px;
  background: #fdf3e7; border: 1px solid #eccfa4; color: #7a4f16; font-size: 0.82rem;
`

// Åpner kundens design i designverktøyet med ?design=<id>. Admin kan lese
// andres design (firestore.rules) og laster ned byggeplanen manuelt derfra.
const DesignLenke = styled(Link)`
  display: inline-flex; align-items: center; gap: 0.5rem;
  margin: 0 0 0.8rem; padding: 0.55rem 0.9rem;
  border: 1px solid #cfd8de; border-radius: 9px; background: #fff;
  font-size: 0.85rem; font-weight: 600; color: #2f4a5a; text-decoration: none;
  &:hover { background: #f4f8fa; }
`

const KodeKnapp = styled.button`
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 0.8rem; border: 1px solid #b9c6d0; border-radius: 8px;
  background: #fff; font-family: inherit; font-weight: 600; font-size: 0.82rem;
  color: #2f4a5a; cursor: pointer;
  &:hover { background: #eaf1f5; }
`
