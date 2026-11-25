import type { ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'
import Icon from '../../shared/Icon'
import { bp, t } from './adminTokens'

/**
 * Delte UI-deler for admin-panelet.
 *
 * Alle farger og mål kommer fra `adminTokens` – før lå de som rå hex-verdier
 * spredt utover, med fire nyanser av samme grå og én ugyldig verdi ingen
 * oppdaget. Skal noe endres, endres det ett sted.
 */

export function AdminPageHead({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <Head>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <HeadActions>{actions}</HeadActions>}
    </Head>
  )
}

const Head = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.4rem;

  h1 {
    margin: 0;
    font-size: 1.55rem;
    font-weight: 700;
    color: ${t.blekk};
    letter-spacing: -0.015em;
  }
  p {
    margin: 0.3rem 0 0;
    font-size: 0.88rem;
    color: ${t.dempet};
    max-width: 62ch;
  }

  @media (max-width: ${bp.mobil}) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.8rem;
    margin-bottom: 1rem;

    /*
     * Seksjonsnavnet står allerede i den klebrige topplinja. Å gjenta det som
     * overskrift her sa det samme to ganger rett under hverandre. Overskriften
     * blir værende for skjermlesere og for dokumentstrukturen.
     */
    h1 {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    p {
      margin-top: 0;
    }
  }
`

const HeadActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (max-width: ${bp.mobil}) {
    > * {
      flex: 1;
      justify-content: center;
      min-height: 44px;
    }
  }
`

export const Card = styled.div`
  background: ${t.flate};
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  box-shadow: ${t.skygge};
`

export const Tabs = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 1.2rem;

  /*
   * På mobil brettet seks filtre seg over tre linjer og spiste en tredel av
   * skjermen før man så en eneste rad med data. Her ligger de på én linje som
   * sveipes – og stripa blør ut til skjermkanten, så det er synlig at den
   * fortsetter.
   */
  @media (max-width: ${bp.smal}) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    margin: 0 -1rem 1rem;
    padding: 0 1rem 0.2rem;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
    > * {
      scroll-snap-align: start;
    }
  }
`

export const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.48rem 0.9rem;
  border: 1px solid ${({ $active }) => ($active ? t.blekk : t.kant)};
  background: ${({ $active }) => ($active ? t.blekk : t.flate)};
  color: ${({ $active }) => ($active ? '#fff' : t.dempet)};
  border-radius: ${t.radiusRund};
  font-family: inherit;
  font-weight: 600;
  font-size: 0.84rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.14s, border-color 0.14s, color 0.14s;

  em {
    font-style: normal;
    opacity: 0.6;
    font-weight: 600;
  }

  @media (max-width: ${bp.smal}) {
    min-height: 40px;
  }
`

const puls = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`

/**
 * Skjelett i stedet for en snurrende sirkel.
 *
 * En spinner sier bare «vent»; et skjelett viser hva som kommer og hvor mye av
 * det, så siden ikke hopper når dataene lander.
 */
export const Skjelett = styled.div<{ $h?: string; $b?: string; $rund?: boolean }>`
  height: ${({ $h }) => $h ?? '1rem'};
  width: ${({ $b }) => $b ?? '100%'};
  border-radius: ${({ $rund }) => ($rund ? '50%' : t.radiusLiten)};
  background: ${t.kantSvak};
  animation: ${puls} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Noen kort med skjelett, mens lista hentes. */
export function LasterListe({ antall = 3 }: { antall?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <SrOnly>Laster …</SrOnly>
      {Array.from({ length: antall }, (_, i) => (
        <SkjelettKort key={i}>
          <Skjelett $h="40px" $b="40px" $rund />
          <div>
            <Skjelett $h="0.85rem" $b="38%" />
            <Skjelett $h="0.7rem" $b="62%" />
          </div>
        </SkjelettKort>
      ))}
    </div>
  )
}

const SkjelettKort = styled(Card)`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
  margin-bottom: 0.7rem;

  > div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
`

const SrOnly = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
`

export const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3.5rem 1rem;
  color: ${t.dempet};
  font-weight: 600;
`

/**
 * Tom tilstand.
 *
 * Var en stiplet boks med én grå setning midt i. Et ikon og tydelig
 * overskrift gjør den til noe som ser ferdig ut, ikke noe som ser ødelagt ut.
 */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <TomBoks>
      <TomIkon aria-hidden="true">
        <Icon name="faLayerGroup" />
      </TomIkon>
      {children}
    </TomBoks>
  )
}

const TomBoks = styled.div`
  text-align: center;
  color: ${t.dempet};
  background: ${t.flate};
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  padding: 3rem 1.5rem;

  h2 {
    margin: 0 0 0.35rem;
    color: ${t.blekk};
    font-size: 1.02rem;
    font-weight: 700;
  }
  p {
    margin: 0 auto;
    max-width: 44ch;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  @media (max-width: ${bp.smal}) {
    padding: 2.2rem 1.1rem;
  }
`

const TomIkon = styled.div`
  width: 46px;
  height: 46px;
  margin: 0 auto 0.9rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: ${t.senket};
  color: ${t.svak};
  font-size: 1.05rem;
`

/**
 * KPI-kort.
 *
 * Etiketten står OVER tallet, og ikonet er borte. Ikonet pyntet, men tok
 * halve kortet og ga ingen informasjon tallet ikke alt ga – nå er det tallet
 * som er det store, slik det skal være når man skanner en rad med dem.
 */
export function Stat({
  label,
  value,
  under,
  onClick,
}: {
  label: string
  value: ReactNode
  /** Valgfri linje under tallet, f.eks. et beløp. */
  under?: ReactNode
  icon?: string
  tone?: 'default' | 'green' | 'amber'
  onClick?: () => void
}) {
  return (
    <StatBox as={onClick ? 'button' : 'div'} $clickable={Boolean(onClick)} onClick={onClick}>
      <StatLabel>{label}</StatLabel>
      <StatValue>{value}</StatValue>
      {under && <StatUnder>{under}</StatUnder>}
    </StatBox>
  )
}

/**
 * Rutenett for KPI-kortene. To i bredden på mobil; så mange det er plass til
 * ellers.
 */
export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.2rem;

  @media (max-width: ${bp.smal}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }
`

const StatBox = styled.div<{ $clickable: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.9rem 1rem 1rem;
  background: ${t.flate};
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  text-align: left;
  font-family: inherit;
  width: 100%;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: border-color 0.14s, box-shadow 0.15s;

  &:hover {
    ${({ $clickable }) => ($clickable ? `border-color: ${t.svak}; box-shadow: ${t.skyggeHev};` : '')}
  }
`

const StatLabel = styled.div`
  font-size: 0.78rem;
  font-weight: 500;
  color: ${t.dempet};
  line-height: 1.3;
`

const StatValue = styled.div`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${t.blekk};
  line-height: 1.05;
  font-variant-numeric: tabular-nums;

  @media (max-width: ${bp.smal}) {
    font-size: 1.4rem;
  }
`

const StatUnder = styled.div`
  font-size: 0.78rem;
  color: ${t.dempet};
  font-variant-numeric: tabular-nums;
`
