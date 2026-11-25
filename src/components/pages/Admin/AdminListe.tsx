import { useState, type ReactNode } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { bp, t } from './adminTokens'

/**
 * Kompakt liste for admin-sidene.
 *
 * Før var hver rad et stort kort med alt synlig samtidig: spesifikasjon,
 * kontaktinfo, oppfølgingsmerker og fire knapper. Ti bestillinger ble en halv
 * meter rulling, og man måtte lese hvert kort for å finne det ene man lette
 * etter.
 *
 * Nå er radene tynne og skannbare, og detaljene folder seg ut ved klikk. Det
 * er samme grep som en innboks: lista er til å finne i, raden er til å jobbe i.
 * Alt som fantes før finnes fortsatt – det ligger bare ett klikk unna.
 */

export const Liste = styled.div`
  background: ${t.flate};
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  overflow: hidden;
`

export interface Kolonne {
  merkelapp: string
  verdi: ReactNode
}

export function Rad({
  tittel,
  undertittel,
  status,
  kolonner,
  dato,
  children,
}: {
  tittel: ReactNode
  undertittel?: ReactNode
  /** Statusmerke eller -velger. */
  status?: ReactNode
  /** Opptil to kolonner mellom status og dato. */
  kolonner?: Kolonne[]
  dato?: string
  /** Detaljene som folder seg ut. */
  children?: ReactNode
}) {
  const [apen, settApen] = useState(false)

  return (
    <RadBoks $apen={apen}>
      <Hode
        type="button"
        onClick={() => settApen((a) => !a)}
        aria-expanded={apen}
        $klikkbar={Boolean(children)}
        disabled={!children}
      >
        <Pil aria-hidden="true" $apen={apen}>
          {children && <Icon name="faChevronRight" />}
        </Pil>

        <Navn>
          <strong>{tittel}</strong>
          {undertittel && <small>{undertittel}</small>}
        </Navn>

        {status && <Statusfelt onClick={(e) => e.stopPropagation()}>{status}</Statusfelt>}

        {kolonner?.map((k) => (
          <Kol key={k.merkelapp}>
            <dt>{k.merkelapp}</dt>
            <dd>{k.verdi}</dd>
          </Kol>
        ))}

        {dato && (
          <Kol $hoyre>
            <dt>Mottatt</dt>
            <dd>{dato}</dd>
          </Kol>
        )}
      </Hode>

      {apen && children && <Detaljer>{children}</Detaljer>}
    </RadBoks>
  )
}

const RadBoks = styled.div<{ $apen: boolean }>`
  border-bottom: 1px solid ${t.kantSvak};
  background: ${({ $apen }) => ($apen ? t.senket : 'transparent')};

  &:last-child {
    border-bottom: none;
  }
`

const Hode = styled.button<{ $klikkbar: boolean }>`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto auto auto auto;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: ${({ $klikkbar }) => ($klikkbar ? 'pointer' : 'default')};

  &:hover {
    background: ${({ $klikkbar }) => ($klikkbar ? t.senket : 'transparent')};
  }

  /*
   * På mobil er det ikke plass til kolonner ved siden av hverandre. Navnet får
   * hele bredden, og resten legger seg under som en linje med nøkkelinfo.
   */
  @media (max-width: ${bp.mobil}) {
    grid-template-columns: 18px minmax(0, 1fr);
    gap: 0.5rem 0.6rem;
    padding: 0.8rem 0.85rem;
  }
`

const Pil = styled.span<{ $apen: boolean }>`
  display: grid;
  place-items: center;
  color: ${t.svak};
  font-size: 0.7rem;
  transition: transform 0.15s;
  transform: rotate(${({ $apen }) => ($apen ? '90deg' : '0deg')});
`

const Navn = styled.div`
  min-width: 0;

  strong {
    display: block;
    font-size: 0.93rem;
    font-weight: 700;
    color: ${t.blekk};
    overflow-wrap: anywhere;
  }
  small {
    display: block;
    margin-top: 0.1rem;
    font-size: 0.79rem;
    color: ${t.dempet};
    overflow-wrap: anywhere;
  }
`

const Statusfelt = styled.span`
  display: inline-flex;
  flex-shrink: 0;

  @media (max-width: ${bp.mobil}) {
    grid-column: 2;
  }
`

const Kol = styled.dl<{ $hoyre?: boolean }>`
  margin: 0;
  flex-shrink: 0;
  text-align: ${({ $hoyre }) => ($hoyre ? 'right' : 'left')};

  dt {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${t.svak};
  }
  dd {
    margin: 0.08rem 0 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: ${t.blekk};
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  @media (max-width: ${bp.mobil}) {
    grid-column: 2;
    text-align: left;
    display: flex;
    align-items: baseline;
    gap: 0.4rem;

    dt::after {
      content: ':';
    }
    dd {
      margin: 0;
      font-weight: 600;
    }
  }
`

const Detaljer = styled.div`
  padding: 0 1rem 1rem 2.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (max-width: ${bp.mobil}) {
    padding: 0 0.85rem 0.9rem;
  }
`

/** Fargekodet statusmerke. Tre farger – flere ville bare blitt et lyskryss. */
export const Statusmerke = styled.span<{ $tone?: 'ny' | 'venter' | 'ferdig' }>`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: ${t.radiusRund};
  font-size: 0.74rem;
  font-weight: 600;
  white-space: nowrap;
  color: ${({ $tone }) => ($tone === 'ny' ? t.ny : $tone === 'venter' ? t.venter : t.dempet)};
  background: ${({ $tone }) => ($tone === 'ny' ? t.nySvak : $tone === 'venter' ? t.venterSvak : t.senket)};
`

/** Knapperad til det utfoldede innholdet. */
export const Radhandlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  @media (max-width: ${bp.smal}) {
    > *:first-child {
      flex: 1 1 100%;
    }
    > * {
      flex: 1;
      justify-content: center;
      min-height: 44px;
    }
  }
`
