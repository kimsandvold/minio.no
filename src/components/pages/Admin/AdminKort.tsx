import type { ReactNode } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { bp, t } from './adminTokens'

/**
 * Felles kort for alle listesidene i admin.
 *
 * Bestillinger, forespørsler, henvendelser, prosjektidéer og graveringer har
 * samme form: hvem, hva, status, kontaktvei, detaljer, knapper. De var likevel
 * tegnet fem ganger med hver sine farger, marger og brytpunkter – derfor så de
 * ulike ut uten at forskjellen betydde noe.
 *
 * Rekkefølgen her følger arbeidet: hvem og hva øverst, så tallene man skanner
 * etter, så kontaktveien, og til slutt det man bare trenger av og til.
 */

export interface Fakta {
  merkelapp: string
  verdi: ReactNode
}

export function AdminKort({
  tittel,
  merker,
  status,
  forhaandsvisning,
  fakta,
  epost,
  telefon,
  adresse,
  children,
  handlinger,
}: {
  tittel: string
  merker?: ReactNode
  /** Statusvelgeren. Ligger øverst til høyre, eller i full bredde på mobil. */
  status?: ReactNode
  forhaandsvisning?: ReactNode
  fakta?: Fakta[]
  epost?: string
  telefon?: string
  adresse?: string
  children?: ReactNode
  handlinger?: ReactNode
}) {
  return (
    <Kort $medBilde={Boolean(forhaandsvisning)}>
      {forhaandsvisning && <Visning>{forhaandsvisning}</Visning>}

      <Innhold>
        <Topp>
          <Navnefelt>
            <h3>{tittel}</h3>
            {merker && <Merker>{merker}</Merker>}
          </Navnefelt>
          {status}
        </Topp>

        {fakta && fakta.length > 0 && (
          <Noekkeltall>
            {fakta.map((f) => (
              <div key={f.merkelapp}>
                <dt>{f.merkelapp}</dt>
                <dd>{f.verdi}</dd>
              </div>
            ))}
          </Noekkeltall>
        )}

        {(epost || telefon || adresse) && (
          /*
           * Kontaktveiene er lenker, ikke tekst. På mobil er det forskjellen på
           * å ringe kunden og å måtte merke nummeret og lime det inn selv.
           */
          <Kontakt>
            {epost && (
              <a href={`mailto:${epost}`}>
                <Icon name="faEnvelope" />
                <span>{epost}</span>
              </a>
            )}
            {telefon && (
              <a href={`tel:${telefon.replace(/\s/g, '')}`}>
                <Icon name="faPhone" />
                <span>{telefon}</span>
              </a>
            )}
            {adresse && (
              <Statisk>
                <Icon name="faTruck" />
                <span>{adresse}</span>
              </Statisk>
            )}
          </Kontakt>
        )}

        {children}

        {handlinger && <Handlinger>{handlinger}</Handlinger>}
      </Innhold>
    </Kort>
  )
}

const Kort = styled.div<{ $medBilde: boolean }>`
  display: grid;
  grid-template-columns: ${({ $medBilde }) => ($medBilde ? '190px minmax(0, 1fr)' : 'minmax(0, 1fr)')};
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
    /* På mobil er bildet en bekreftelse på at man ser på riktig rad, ikke noe
       man studerer – da holder det med et bånd. */
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
 * `min-width: 0` er ikke valgfritt. Grid-barn har `min-width: auto`, og uten
 * dette nekter kolonnen å krympe under innholdet sitt – en lang e-postadresse
 * dyttet da hele kortet ut av skjermen, med vannrett rulling på hele siden.
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
    /* Velgeren tar full bredde når den står på egen linje. */
    > select {
      width: 100%;
      min-height: 44px;
    }
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

/** Tallene man skanner etter i en lang liste. */
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
    overflow-wrap: anywhere;
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

const Statisk = styled.span`
  color: ${t.dempet};
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;

  /*
   * Knappene trykkes ofte stående, med én hånd. Den første er den som brukes
   * hver gang og får full bredde; resten deler linja under.
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

// --- Deler sidene setter inn i kortet --------------------------------------

export const Merke = styled.span<{ $svak?: boolean }>`
  padding: 0.16rem 0.5rem;
  border-radius: ${t.radiusRund};
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ $svak }) => ($svak ? t.dempet : t.aksent)};
  background: ${({ $svak }) => ($svak ? t.senket : t.aksentSvak)};
`

export const StatusVelg = styled.select`
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
`

/** Lang tekst man trenger av og til – slått sammen til man ber om den. */
export const Utbrett = styled.details`
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
`

export const Forhaandstekst = styled.pre`
  margin: 0;
  padding: 0 0.75rem 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.74rem;
  line-height: 1.65;
  color: ${t.dempet};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`

export const Sitat = styled.p`
  margin: 0;
  padding: 0.6rem 0.8rem;
  border-left: 3px solid ${t.aksent};
  border-radius: 0 ${t.radiusLiten} ${t.radiusLiten} 0;
  background: ${t.aksentSvak};
  font-size: 0.88rem;
  color: ${t.blekk};
  overflow-wrap: anywhere;
  white-space: pre-wrap;
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

export const Primaer = styled.button`
  ${knapp}
  border: none;
  background: ${t.aksent};
  color: #fff;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`

export const Sekundaer = styled.a`
  ${knapp}
  border: 1px solid ${t.kant};
  background: ${t.flate};
  color: ${t.blekk};

  &:hover {
    border-color: ${t.svak};
  }
`
