import styled from 'styled-components'
import Icon from '../../shared/Icon'
import GraveringPreview from '../Gravering/GraveringPreview'
import type { GraveringBestilling, GraveringStatus } from '../../../services/graveringService'
import type { Oppfolging } from '../../../types/oppfolging'
import AdminOppfolging from './AdminOppfolging'
import { bp, t } from './adminTokens'

const kr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

function datoTekst(createdAt: unknown): string {
  const d = (createdAt as { toDate?: () => Date } | undefined)?.toDate?.()
  return d ? d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

interface Props {
  b: GraveringBestilling
  /** Hvor mange varer som hører til samme ordre – til «1 av 3». */
  iOrdren: number
  statuser: GraveringStatus[]
  statusNavn: Record<GraveringStatus, string>
  onStatus: (status: GraveringStatus) => void
  onOppfolging: (endring: Oppfolging) => Promise<void>
  onLastNed: () => void
  svarLenke: string
}

/**
 * Én graveringsbestilling.
 *
 * Trukket ut av sida for å kunne tegnes med prøvedata i en rigg – uten det var
 * den eneste måten å se kortet på å logge inn i produksjon, og da ble den
 * aldri sett før den sto der.
 *
 * Oppbygningen følger rekkefølgen arbeidet faktisk gjøres i: hvem og hva
 * øverst, så pengene og datoen, så kontaktveien, og til slutt fila og
 * knappene. Spesifikasjonen er en vegg med tekst man trenger av og til – den
 * er sammenslått på mobil og åpen på skjerm.
 */
export default function GraveringKort({
  b,
  iOrdren,
  statuser,
  statusNavn,
  onStatus,
  onOppfolging,
  onLastNed,
  svarLenke,
}: Props) {
  const dato = datoTekst(b.createdAt)

  return (
    <Kort>
      <Visning>
        <GraveringPreview dekorativ valg={b.valg} />
      </Visning>

      <Innhold>
        <Topp>
          <Navnefelt>
            <h3>{b.navn}</h3>
            <Merker>
              <Merke>
                {b.produktNavn}
                {b.antall > 1 ? ` × ${b.antall}` : ''}
              </Merke>
              {/* Flere varer i samme bestilling deler ordreId og skal pakkes
                  og faktureres sammen. */}
              {iOrdren > 1 && <Merke $svak>1 av {iOrdren} i ordren</Merke>}
            </Merker>
          </Navnefelt>

          <StatusVelg
            value={b.status}
            onChange={(e) => onStatus(e.target.value as GraveringStatus)}
            aria-label="Status"
          >
            {statuser.map((s) => (
              <option key={s} value={s}>
                {statusNavn[s]}
              </option>
            ))}
          </StatusVelg>
        </Topp>

        {/* Pengene og datoen er det man skanner etter i en lang liste. */}
        <Noekkeltall>
          <div>
            <dt>Sum</dt>
            <dd>{kr(b.prisSum)}</dd>
          </div>
          {dato && (
            <div>
              <dt>Mottatt</dt>
              <dd>{dato}</dd>
            </div>
          )}
          <div>
            <dt>Mål</dt>
            <dd>{b.maal}</dd>
          </div>
        </Noekkeltall>

        {/*
         * Kontaktveiene er lenker, ikke tekst. På mobil er det forskjellen på
         * å ringe kunden og å måtte merke et nummer og lime det inn selv.
         */}
        <Kontakt>
          <a href={`mailto:${b.epost}`}>
            <Icon name="faEnvelope" />
            <span>{b.epost}</span>
          </a>
          {b.telefon && (
            <a href={`tel:${b.telefon.replace(/\s/g, '')}`}>
              <Icon name="faPhone" />
              <span>{b.telefon}</span>
            </a>
          )}
          {b.adresse && (
            <Adresse>
              <Icon name="faTruck" />
              <span>
                {b.adresse}, {b.postnr} {b.sted}
              </span>
            </Adresse>
          )}
        </Kontakt>

        <Spekboks>
          <summary>
            <Icon name="faChevronRight" />
            Spesifikasjon
          </summary>
          <Spek>{b.sammendrag}</Spek>
        </Spekboks>

        {b.melding && <Melding>«{b.melding}»</Melding>}

        {b.id && <AdminOppfolging verdi={b} onLagre={onOppfolging} />}

        <Handlinger>
          <Primaer type="button" onClick={onLastNed} disabled={!b.svg}>
            <Icon name="faDownload" /> Last ned SVG
          </Primaer>
          <Sekundaer href={svarLenke}>
            <Icon name="faPaperPlane" /> Svar på e-post
          </Sekundaer>
          <Sekundaer as="button" type="button" onClick={() => navigator.clipboard?.writeText(b.epost)}>
            <Icon name="faCopy" /> Kopier e-post
          </Sekundaer>
        </Handlinger>
      </Innhold>
    </Kort>
  )
}

const Kort = styled.div`
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 1.4rem;
  padding: 1.1rem;
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  background: ${t.flate};
  box-shadow: ${t.skygge};

  @media (max-width: ${bp.mobil}) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.9rem;
    padding: 0.9rem;
  }
`

const Visning = styled.div`
  align-self: start;
  padding: 0.7rem;
  border-radius: 12px;
  background: ${t.senket};

  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  @media (max-width: ${bp.mobil}) {
    /* På mobil er forhåndsvisningen en bekreftelse på at man ser på riktig
       bestilling, ikke noe man studerer – da holder det med et bånd. */
    max-height: 150px;
    display: grid;
    place-items: center;
    svg {
      max-height: 136px;
      width: auto;
      max-width: 100%;
    }
  }
`

/**
 * `min-width: 0` er ikke valgfritt her. Grid-barn har `min-width: auto`, og
 * uten dette nekter kolonnen å krympe under innholdet sitt – lange e-poster
 * og spesifikasjonslinjer dyttet da hele kortet ut av skjermen, med vannrett
 * rulling på hele admin-siden som resultat.
 */
const Innhold = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const Topp = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;

  @media (max-width: ${bp.smal}) {
    flex-direction: column;
    gap: 0.55rem;
  }
`

const Navnefelt = styled.div`
  min-width: 0;

  h3 {
    margin: 0 0 0.3rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: ${t.blekk};
    overflow-wrap: anywhere;
  }
`

const Merker = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`

const Merke = styled.span<{ $svak?: boolean }>`
  padding: 0.16rem 0.5rem;
  border-radius: ${t.radiusRund};
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ $svak }) => ($svak ? t.dempet : t.aksent)};
  background: ${({ $svak }) => ($svak ? t.senket : t.aksentSvak)};
`

const StatusVelg = styled.select`
  flex-shrink: 0;
  padding: 0.42rem 0.6rem;
  border: 1px solid ${t.kant};
  border-radius: ${t.radiusLiten};
  background: ${t.flate};
  color: ${t.blekk};
  font-family: inherit;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;

  @media (max-width: ${bp.smal}) {
    width: 100%;
    min-height: 44px;
  }
`

const Noekkeltall = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 1.6rem;
  margin: 0;
  padding: 0.6rem 0.75rem;
  border-radius: ${t.radiusLiten};
  background: ${t.senket};

  dt {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${t.svak};
  }
  dd {
    margin: 0.1rem 0 0;
    font-size: 0.92rem;
    font-weight: 700;
    color: ${t.blekk};
    font-variant-numeric: tabular-nums;
  }
`

const Kontakt = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 1.1rem;
  font-size: 0.85rem;

  a,
  span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
    color: ${t.dempet};
    text-decoration: none;
  }
  a {
    color: ${t.blekk};
  }
  a:hover {
    text-decoration: underline;
  }
  svg {
    flex-shrink: 0;
    font-size: 0.78rem;
    color: ${t.svak};
  }
  span {
    overflow-wrap: anywhere;
  }

  @media (max-width: ${bp.smal}) {
    flex-direction: column;
    gap: 0.1rem;
    a {
      /* Egen linje med høyde nok til å treffes med tommelen. */
      min-height: 38px;
    }
  }
`

const Adresse = styled.span`
  color: ${t.dempet};
`

/**
 * Spesifikasjonen er lang og trengs sjelden. På skjerm står den åpen fordi
 * plassen finnes; på mobil er den slått sammen så resten av kortet er
 * overkommelig.
 */
const Spekboks = styled.details`
  border: 1px solid ${t.kantSvak};
  border-radius: ${t.radiusLiten};
  overflow: hidden;

  summary {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: ${t.dempet};
    cursor: pointer;
    list-style: none;
    &::-webkit-details-marker {
      display: none;
    }
    svg {
      font-size: 0.65rem;
      transition: transform 0.15s;
    }
  }
  &[open] summary svg {
    transform: rotate(90deg);
  }

  @media (min-width: calc(${bp.mobil} + 1px)) {
    summary {
      min-height: 0;
    }
  }
`

const Spek = styled.pre`
  margin: 0;
  padding: 0 0.75rem 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.74rem;
  line-height: 1.65;
  color: ${t.dempet};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`

const Melding = styled.p`
  margin: 0;
  padding: 0.6rem 0.8rem;
  border-left: 3px solid ${t.aksent};
  border-radius: 0 ${t.radiusLiten} ${t.radiusLiten} 0;
  background: ${t.aksentSvak};
  font-size: 0.88rem;
  font-style: italic;
  color: ${t.blekk};
  overflow-wrap: anywhere;
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;

  /*
   * Dette er knappene verkstedet trykker på stående ved maskinen, ofte med én
   * hånd. «Last ned SVG» er den som brukes hver gang og får full bredde; de to
   * andre deler linja under.
   */
  @media (max-width: ${bp.smal}) {
    > *:first-child {
      flex: 1 1 100%;
    }
    > * {
      flex: 1;
      justify-content: center;
      min-height: 46px;
    }
  }
`

const knapp = `
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.95rem;
  border-radius: 999px;
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
`

const Primaer = styled.button`
  ${knapp}
  border: none;
  background: ${t.aksent};
  color: #fff;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

const Sekundaer = styled.a`
  ${knapp}
  border: 1px solid ${t.kant};
  background: ${t.flate};
  color: ${t.blekk};

  &:hover {
    border-color: ${t.svak};
  }
`
