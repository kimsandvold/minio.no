import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import styled, { css, keyframes } from 'styled-components'
import Icon from './Icon'

/**
 * Annonser for Vimzo: ti for nettsider til små bedrifter og fire for
 * logoverktøyet. Én trekkes når siden lastes, og de roterer gjennom besøket –
 * en variant vises ikke igjen før alle de andre er vist (se `trekk`).
 *
 * Fargene og formspråket er Vimzos egne (ny design, nov. 2026), ikke minio-
 * temaet – annonsen skal leses som en annen avsender, og er merket «Annonse»
 * etter markedsføringsloven. Holdes i takt med `src/styles/theme.ts` og
 * `src/data/pakker.ts` / `logoprodukter.ts` i vimzo-repoet: blå aksent,
 * grafitt i stedet for svart, pilleknapper, flate kort med hårstrek, og
 * en grå andrelinje i overskriftene.
 *
 * Trekningen skjer bare i nettleseren (useSyncExternalStore med null som
 * server-snapshot): sidene prerendres, og et tilfeldig valg i HTML-en ville ikke
 * stemt med det React hydrerer. Annonsen står langt nede, så den er på plass før
 * noen scroller dit.
 *
 * utm_content = «<plassering>-<variant>», så Vimzos statistikk viser både hvilken
 * side og hvilken annonse klikket kom fra.
 */

const V = {
  ink: '#1D1D1F',
  inkMuted: '#55565C',
  /** Andrelinjen i overskrifter – 3.6:1, nok for stor tekst. */
  inkGra: '#86868B',
  paper: '#FFFFFF',
  sunken: '#F5F5F7',
  border: '#E8E8ED',
  borderStrong: '#D2D2D7',
  deep: '#1D1D1F',
  deepRaised: '#2A2A2E',
  inverted: '#FFFFFF',
  invertedMuted: 'rgba(255, 255, 255, 0.7)',
  invertedBorder: 'rgba(252, 252, 250, 0.14)',
  /** Aksent som tekst på lyst. */
  accent: '#0052B4',
  accentHover: '#00449A',
  /** Aksent som flate (knapper), hvit tekst oppå. */
  vivid: '#005CC8',
  vividHover: '#004FAD',
  /** Aksent på mørke flater. */
  accentLight: '#6CB4FF',
  accentSoft: '#E8F0FB',
  accentInk: '#003E8A',
  success: '#15803D',
}

const PRIS = {
  start: '19 900–28 900',
  bedrift: '34 900–48 900',
  vekst: 'fra 59 900',
  fra: '19 900',
  drift: '449',
  logo: '490',
  profil: '990',
}

/* ---------- Felles byggeklosser ---------- */

/**
 * Annonsen tilpasser seg sin egen bredde, ikke skjermens – den står både i fullbredde
 * seksjoner og i den smale artikkelkolonnen i byggeguidene.
 */
const smal = '@container vimzo (max-width: 720px)'
/** Telefonbredde: her får knappene full bredde, så de er lette å treffe. */
const smalest = '@container vimzo (max-width: 480px)'

/* «Annonse»-merket ligger absolutt øverst til høyre; i smal visning trenger innholdet luft over seg. */
const toppluft = css`
  ${smal} {
    padding-top: 3.25rem;
  }
`

const luft = 'clamp(1.5rem, 5cqi, 3.25rem)'

type Flate = 'lys' | 'dempet' | 'mork' | 'bla'

const FLATER: Record<Flate, { bg: string; farge: string; kant: string }> = {
  lys: { bg: V.paper, farge: V.ink, kant: V.border },
  dempet: { bg: V.sunken, farge: V.ink, kant: 'transparent' },
  mork: { bg: V.deep, farge: V.inverted, kant: 'transparent' },
  bla: { bg: V.vivid, farge: V.inverted, kant: 'transparent' },
}

const Ramme = styled.div<{ $flate: Flate }>`
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  background: ${({ $flate }) => FLATER[$flate].bg};
  color: ${({ $flate }) => FLATER[$flate].farge};
  box-shadow: inset 0 0 0 1px ${({ $flate }) => FLATER[$flate].kant};
  font-family: ${({ theme }) => theme.fonts.body};
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  container: vimzo / inline-size;
`

/** «Annonse» og krysset, samlet øverst til høyre. */
const Hjorne = styled.div`
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.35rem;
`

const Merke = styled.span<{ $mork?: boolean }>`
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.08)' : 'rgba(29, 29, 31, 0.05)')};
  color: ${({ $mork }) => ($mork ? V.invertedMuted : V.inkMuted)};
`

const Kryss = styled.button<{ $mork?: boolean }>`
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.08)' : 'rgba(29, 29, 31, 0.05)')};
  color: ${({ $mork }) => ($mork ? V.invertedMuted : V.inkMuted)};
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.16)' : 'rgba(29, 29, 31, 0.1)')};
    color: ${({ $mork }) => ($mork ? V.inverted : V.ink)};
  }

  &:focus-visible {
    outline: 2px solid ${({ $mork }) => ($mork ? V.accentLight : V.vivid)};
    outline-offset: 2px;
  }
`

/** Lukkefunksjonen, gitt videre fra `VimzoAnnonse` uten å sende den gjennom hver variant. */
const LukkKontekst = createContext<() => void>(() => {})

function Lukknapp({ mork }: { mork?: boolean }) {
  const lukk = useContext(LukkKontekst)
  return (
    <Kryss type="button" $mork={mork} onClick={lukk} aria-label="Skjul annonsen" title="Skjul annonsen">
      <Icon name="faXmark" />
    </Kryss>
  )
}

function Annonsemerke({ flate }: { flate: Flate }) {
  const mork = flate === 'mork' || flate === 'bla'
  return (
    <Hjorne>
      <Merke $mork={mork}>Annonse</Merke>
      <Lukknapp mork={mork} />
    </Hjorne>
  )
}

const Logo = styled.p<{ $farge: string }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 1.4rem;
  color: ${({ $farge }) => $farge};

  svg {
    display: block;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
  }

  /* Ordmerket som på vimzo.no: versaler, åpen sperring, kompensert til høyre. */
  span {
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    margin-right: -0.14em;
  }
`

/**
 * Vimzos merke – samme baner som `Logo.tsx` i vimzo-repoet. På lys flate står
 * glyfen hvit på den grafittgrå flisen; på mørk eller farget flate vises glyfen
 * bar (flisen ville forsvunnet i bakgrunnen) og beskjæres til den.
 */
const MERKE_BANER = [
  'M350 380H515L476 447H393L447 548L620 264L661 337L445 691L310 442Z',
  'M678 367L718 435L500 795L461 721Z',
]

function Merkevare({ mork = false }: { mork?: boolean }) {
  return (
    <Logo $farge={mork ? '#fff' : V.ink}>
      <svg viewBox={mork ? '248 264 531 531' : '0 0 1024 1024'} aria-hidden="true" focusable="false">
        {!mork && <rect width="1024" height="1024" rx="150" fill={V.ink} />}
        <g fill={mork ? 'currentColor' : '#fff'}>
          {MERKE_BANER.map(d => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>
      <span>VIMZO</span>
    </Logo>
  )
}

/** Overskrift i to toner: påstand i full styrke, løftet i grått på linja under. */
const Overskrift = styled.h2<{ $maks?: string; $mork?: boolean }>`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: clamp(1.55rem, 0.9rem + 3.4cqi, 2.75rem);
  font-weight: 600;
  line-height: 1.04;
  letter-spacing: -0.035em;
  max-width: ${({ $maks = '18ch' }) => $maks};
  color: inherit;
  text-wrap: balance;

  span {
    display: block;
    color: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.55)' : V.inkGra)};
  }
`

const Tekst = styled.p<{ $mork?: boolean }>`
  margin: 1.1rem 0 0;
  max-width: 46ch;
  font-size: clamp(1rem, 0.9rem + 0.5cqi, 1.125rem);
  line-height: 1.55;
  letter-spacing: -0.01em;
  color: ${({ $mork }) => ($mork ? V.invertedMuted : V.inkMuted)};
`

const Sjekkliste = styled.ul<{ $mork?: boolean }>`
  list-style: none;
  margin: 1.5rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.65rem;

  li {
    display: flex;
    align-items: baseline;
    gap: 0.65rem;
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: -0.005em;
    color: ${({ $mork }) => ($mork ? V.inverted : V.ink)};
  }

  svg {
    flex-shrink: 0;
    font-size: 0.8em;
    color: ${({ $mork }) => ($mork ? V.accentLight : V.vivid)};
  }
`

function Punkter({ punkter, mork }: { punkter: string[]; mork?: boolean }) {
  return (
    <Sjekkliste $mork={mork}>
      {punkter.map(p => (
        <li key={p}>
          <Icon name="faCheck" /> {p}
        </li>
      ))}
    </Sjekkliste>
  )
}

type KnappVariant = 'aksent' | 'hvit' | 'mork'

const Knapp = styled.a<{ $variant: KnappVariant }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 50px;
  padding: 0 1.6rem;
  border-radius: 999px;
  font-family: inherit;
  font-weight: 500;
  font-size: 1rem;
  letter-spacing: -0.01em;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  svg {
    font-size: 0.85em;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  ${({ $variant }) => {
    switch ($variant) {
      case 'hvit':
        return css`
          background: #fff;
          color: ${V.ink};
          &:hover {
            background: ${V.accentSoft};
            color: ${V.accentInk};
          }
        `
      case 'mork':
        return css`
          background: ${V.ink};
          color: #fff;
          &:hover {
            background: #3a3b40;
          }
        `
      default:
        return css`
          background: ${V.vivid};
          color: #fff;
          &:hover {
            background: ${V.vividHover};
          }
        `
    }
  }}

  &:hover svg {
    transform: translateX(3px);
  }

  &:active {
    transform: scale(0.985);
  }

  &:focus-visible {
    outline: 2px solid ${({ $variant }) => ($variant === 'aksent' || $variant === 'mork' ? V.vivid : V.accentLight)};
    outline-offset: 3px;
  }

  ${smalest} {
    width: 100%;
  }
`

const Notis = styled.span<{ $mork?: boolean }>`
  font-size: 0.875rem;
  letter-spacing: -0.005em;
  color: ${({ $mork }) => ($mork ? V.invertedMuted : V.inkMuted)};
`

const Handlinger = styled.div<{ $midtstilt?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem 1.4rem;
  margin-top: 2rem;
  ${({ $midtstilt }) => $midtstilt && 'justify-content: center;'}
`

function Cta({ lenke, tekst, variant = 'aksent', notis, mork, midtstilt }: {
  lenke: string
  tekst: string
  variant?: KnappVariant
  notis?: string
  mork?: boolean
  midtstilt?: boolean
}) {
  return (
    <Handlinger $midtstilt={midtstilt}>
      <Knapp href={lenke} target="_blank" rel="sponsored noopener" $variant={variant}>
        {tekst} <Icon name="faArrowRight" />
      </Knapp>
      {notis && <Notis $mork={mork}>{notis}</Notis>}
    </Handlinger>
  )
}

/** To kolonner – tekst og illustrasjon – som legger seg under hverandre i smal visning. */
const Delt = styled.div<{ $speilet?: boolean; $skjulBilde?: boolean }>`
  ${toppluft}
  display: grid;
  grid-template-columns: ${({ $speilet }) =>
    $speilet ? 'minmax(0, 1fr) minmax(0, 1.1fr)' : 'minmax(0, 1.1fr) minmax(0, 1fr)'};
  gap: clamp(2rem, 5cqi, 4rem);
  align-items: center;
  padding: ${luft};

  ${smal} {
    grid-template-columns: 1fr;
    gap: 2rem;

    ${({ $skjulBilde }) =>
      $skjulBilde &&
      css`
        > [aria-hidden='true'] {
          display: none;
        }
      `}
  }
`

const blink = keyframes`
  50% { opacity: 0; }
`

/* =====================================================================
 *  NETTSIDER
 * ===================================================================== */

/* ---------- 1. Lys, delt: åpningsbudskapet + nettleser ---------- */

const Nettleser = styled.div`
  background: ${V.paper};
  border-radius: 16px;
  box-shadow: 0 0 0 1px ${V.border}, 0 36px 80px -28px rgba(12, 13, 12, 0.22);
  overflow: hidden;
`

const Adresselinje = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 0.9rem;
  background: ${V.sunken};

  i {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: ${V.borderStrong};
  }

  span {
    flex: 1;
    margin-left: 0.6rem;
    padding: 0.28rem 0.7rem;
    border-radius: 999px;
    background: ${V.paper};
    font-size: 0.72rem;
    color: ${V.inkMuted};
    text-align: center;
  }
`

const Miniside = styled.div`
  padding: 1.4rem 1.4rem 1.6rem;

  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.6rem;

    b {
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    span {
      display: flex;
      gap: 0.6rem;

      i {
        width: 1.6rem;
        height: 0.32rem;
        border-radius: 4px;
        background: ${V.border};
      }
    }
  }

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: ${V.ink};
  }

  p {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    line-height: 1.5;
    color: ${V.inkMuted};
  }

  em {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
    background: ${V.vivid};
    color: #fff;
    font-size: 0.7rem;
    font-style: normal;
    font-weight: 500;
  }
`

const Bilderad = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 0.5rem;
  margin-top: 1.3rem;

  div {
    height: 4rem;
    border-radius: 10px;
    background: linear-gradient(160deg, #dfe7f2 0%, #c8d4e6 100%);
  }

  div:nth-child(2) {
    background: linear-gradient(160deg, #ece9e3 0%, #d9d3c8 100%);
  }

  div:nth-child(3) {
    background: linear-gradient(160deg, #e3ebe4 0%, #c9d8cc 100%);
  }
`

function LysDelt({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="lys">
      <Annonsemerke flate="lys" />
      <Delt $skjulBilde>
        <div>
          <Merkevare />
          <Overskrift>
            Nettsider for små bedrifter.
            <span>Med åpne priser.</span>
          </Overskrift>
          <Tekst>
            Vimzo lager hele nettsiden for deg – tekst, bilder, design og drift. Du ser hva den koster før du tar
            kontakt, ikke i et tilbud du må vente på.
          </Tekst>
          <Cta lenke={lenke} tekst="Se hva din koster" notis={`Fra ${PRIS.fra} kr eks. mva`} />
        </div>
        <Nettleser aria-hidden="true">
          <Adresselinje>
            <i />
            <i />
            <i />
            <span>dinbedrift.no</span>
          </Adresselinje>
          <Miniside>
            <nav>
              <b>DIN BEDRIFT</b>
              <span>
                <i />
                <i />
                <i />
              </span>
            </nav>
            <h3>Fagfolk du kan stole på – i hele distriktet.</h3>
            <p>Ring for befaring, så får du prisen skriftlig før vi begynner.</p>
            <em>Be om pris</em>
            <Bilderad>
              <div />
              <div />
              <div />
            </Bilderad>
          </Miniside>
        </Nettleser>
      </Delt>
    </Ramme>
  )
}

/* ---------- 2. Dempet: estimatkortet fra kalkulatoren ---------- */

const Estimatkort = styled.div`
  padding: clamp(1.25rem, 3.5cqi, 1.75rem);
  border-radius: 22px;
  background: ${V.paper};
  box-shadow: 0 20px 44px -18px rgba(12, 13, 12, 0.16);
`

const Segment = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 0.25rem;
  border-radius: 999px;
  background: ${V.sunken};
  font-size: 0.78rem;
  font-weight: 500;
  text-align: center;
  color: ${V.inkMuted};

  span {
    padding: 0.45rem 0.2rem;
    border-radius: 999px;
    white-space: nowrap;
  }

  span:first-child {
    background: ${V.paper};
    color: ${V.ink};
    box-shadow: 0 2px 6px -2px rgba(12, 13, 12, 0.12);
  }
`

const Estimattall = styled.div`
  margin-top: 1.5rem;

  small {
    display: block;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${V.inkMuted};
  }

  strong {
    display: block;
    margin-top: 0.35rem;
    font-size: clamp(1.6rem, 1rem + 3cqi, 2.2rem);
    font-weight: 600;
    letter-spacing: -0.04em;
    line-height: 1;
    color: ${V.ink};
    white-space: nowrap;

    span {
      font-size: 0.5em;
      font-weight: 500;
      letter-spacing: -0.01em;
      color: ${V.inkMuted};
    }
  }
`

const Estimatlinjer = styled.ul`
  list-style: none;
  margin: 1.4rem 0 0;
  padding: 1.1rem 0 0;
  border-top: 1px solid ${V.border};
  display: grid;
  gap: 0.5rem;

  li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.8rem;
    color: ${V.inkMuted};

    b {
      font-weight: 500;
      color: ${V.ink};
    }
  }
`

function DempetEstimat({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="dempet">
      <Annonsemerke flate="dempet" />
      <Delt>
        <div>
          <Merkevare />
          <Overskrift>
            Hva koster en nettside?
            <span>Tre valg, så ser du det.</span>
          </Overskrift>
          <Tekst>
            Velg hvor mange sider du trenger og hva siden skal gjøre, så regner kalkulatoren på vimzo.no ut prisen.
            Den endelige prisen avtales skriftlig før arbeidet starter.
          </Tekst>
          <Cta lenke={lenke} tekst="Regn ut prisen din" notis="Tar under ett minutt" />
        </div>
        <Estimatkort aria-hidden="true">
          <Segment>
            <span>1–3 sider</span>
            <span>4–8 sider</span>
            <span>Flere</span>
          </Segment>
          <Estimattall>
            <small>Ditt anslag</small>
            <strong>
              {PRIS.start} <span>kr</span>
            </strong>
          </Estimattall>
          <Estimatlinjer>
            <li>
              Tekst, design og domene <b>Inkludert</b>
            </li>
            <li>
              Drift og sikkerhetskopi <b>{PRIS.drift} kr/mnd</b>
            </li>
            <li>
              Bindingstid <b>Ingen</b>
            </li>
          </Estimatlinjer>
        </Estimatkort>
      </Delt>
    </Ramme>
  )
}

/* ---------- 3. Smal blå stripe ---------- */

const Stripe = styled.div`
  display: flex;
  align-items: center;
  gap: 1.75rem;
  padding: 1.4rem 4rem 1.4rem clamp(1.5rem, 4cqi, 2.25rem);

  ${Logo} {
    margin: 0;
  }

  ${Handlinger} {
    margin: 0 0 0 auto;
  }

  ${smal} {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.1rem;
    padding-right: clamp(1.5rem, 4cqi, 2.25rem);

    ${Handlinger} {
      margin: 0;
      width: 100%;
    }
  }
`

/* Avsender og «Annonse» samlet til venstre, skilt fra budskapet med en tynn strek. */
const StripeAvsender = styled.div<{ $mork?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex-shrink: 0;
  padding-right: 1.75rem;
  border-right: 1px solid ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.25)' : V.borderStrong)};

  ${smal} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    /* Plass til krysset øverst til høyre. */
    padding: 0 2.5rem 0 0;
    border: 0;
  }
`

const StripeTekst = styled.p`
  margin: 0;
  font-size: clamp(1.05rem, 0.95rem + 0.6cqi, 1.25rem);
  line-height: 1.4;
  font-weight: 500;
  letter-spacing: -0.015em;
  text-wrap: balance;

  strong {
    font-weight: 600;
  }
`

const StripeMerke = styled.span<{ $mork?: boolean }>`
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ $mork }) => ($mork ? 'rgba(255, 255, 255, 0.7)' : V.inkMuted)};
`

function BlaStripe({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="bla">
      <Hjorne>
        <Lukknapp mork />
      </Hjorne>
      <Stripe>
        <StripeAvsender $mork>
          <Merkevare mork />
          <StripeMerke $mork>Annonse</StripeMerke>
        </StripeAvsender>
        <StripeTekst>
          Trenger bedriften ny nettside? <strong>Fra {PRIS.fra} kr</strong> – med tekst, bilder og domene.
        </StripeTekst>
        <Cta lenke={lenke} tekst="Se prisene" variant="hvit" />
      </Stripe>
    </Ramme>
  )
}

/* ---------- 4. Lys: Google-søk ---------- */

const Sok = styled.div`
  background: #fff;
  border-radius: 18px;
  padding: 1.3rem;
  box-shadow: 0 0 0 1px ${V.border}, 0 24px 50px -24px rgba(12, 13, 12, 0.22);
  font-family: Arial, Helvetica, sans-serif;
`

const Sokefelt = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1rem;
  border-radius: 999px;
  box-shadow: 0 1px 6px rgba(32, 33, 36, 0.18);
  font-size: 0.85rem;
  color: #202124;

  svg {
    color: #9aa0a6;
  }
`

const Treff = styled.div<{ $dempet?: boolean }>`
  margin-top: 1.2rem;
  opacity: ${({ $dempet }) => ($dempet ? 0.38 : 1)};

  small {
    display: block;
    font-size: 0.72rem;
    color: #4d5156;
  }

  b {
    display: block;
    margin: 0.15rem 0 0.25rem;
    font-size: 1rem;
    font-weight: 400;
    color: #1a0dab;
  }

  p {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.45;
    color: #4d5156;
  }
`

const Stjerner = styled.span`
  color: #f4b400;
  letter-spacing: 1px;
`

function LysGoogle({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="lys">
      <Annonsemerke flate="lys" />
      <Delt $speilet $skjulBilde>
        <Sok aria-hidden="true">
          <Sokefelt>
            <Icon name="faSearch" /> snekker i nærheten
          </Sokefelt>
          <Treff>
            <small>dinbedrift.no</small>
            <b>Din Bedrift – snekker med fast pris</b>
            <p>
              <Stjerner>★★★★★</Stjerner> 4,9 · Åpent nå · Terrasser, kledning og tilbygg. Ring for befaring…
            </p>
          </Treff>
          <Treff $dempet>
            <small>konkurrenten.no</small>
            <b>Konkurrenten AS</b>
            <p>Hjemmeside under oppbygging…</p>
          </Treff>
        </Sok>
        <div>
          <Merkevare />
          <Overskrift>
            Kundene googler deg før de ringer.
            <span>Sørg for at de finner deg.</span>
          </Overskrift>
          <Tekst>
            Vimzo lager nettsiden og melder deg inn hos Google og Google Maps, så det er du som dukker opp når noen i
            nærheten søker etter det du gjør.
          </Tekst>
          <Cta lenke={lenke} tekst="Bli funnet på Google" notis={`Fra ${PRIS.fra} kr eks. mva`} />
        </div>
      </Delt>
    </Ramme>
  )
}

/* ---------- 5. Lys med pakkekort ---------- */

const Pakkeoppsett = styled.div`
  ${toppluft}
  padding: ${luft};
`

const PakkeHode = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;

  ${Handlinger} {
    margin: 0;
    flex-shrink: 0;
  }

  ${smal} {
    flex-direction: column;
    align-items: stretch;
  }
`

const Pakkerad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-top: 2.25rem;

  ${smal} {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }
`

const Pakke = styled.div<{ $fremhevet?: boolean }>`
  padding: 1.4rem 1.5rem 1.5rem;
  border-radius: 22px;
  background: ${({ $fremhevet }) => ($fremhevet ? V.deep : V.sunken)};
  color: ${({ $fremhevet }) => ($fremhevet ? V.inverted : V.ink)};

  h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: -0.015em;
  }

  small {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.82rem;
    color: ${({ $fremhevet }) => ($fremhevet ? V.invertedMuted : V.inkMuted)};
  }

  p {
    margin: 1.4rem 0 0;
    font-size: clamp(1.15rem, 0.9rem + 1.2cqi, 1.45rem);
    font-weight: 600;
    letter-spacing: -0.03em;
    white-space: nowrap;

    span {
      display: block;
      margin-top: 0.2rem;
      font-size: 0.75rem;
      font-weight: 400;
      letter-spacing: 0;
      color: ${({ $fremhevet }) => ($fremhevet ? V.invertedMuted : V.inkMuted)};
    }
  }

  ${smal} {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 1rem;
    padding: 1rem 1.2rem;
    border-radius: 18px;

    h3,
    small {
      grid-column: 1;
    }

    p {
      grid-column: 2;
      grid-row: 1 / span 2;
      margin: 0;
      font-size: 1.05rem;
      text-align: right;
    }
  }
`

const PAKKER = [
  { navn: 'Start', omfang: '1–3 sider', pris: PRIS.start },
  { navn: 'Bedrift', omfang: '4–8 sider', pris: PRIS.bedrift },
  { navn: 'Vekst', omfang: 'Med kalkulator eller booking', pris: PRIS.vekst },
]

function LysPakker({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="lys">
      <Annonsemerke flate="lys" />
      <Pakkeoppsett>
        <PakkeHode>
          <div>
            <Merkevare />
            <Overskrift $maks="20ch">
              Nettside til bedriften.
              <span>Med prisen på bordet.</span>
            </Overskrift>
          </div>
          <Cta lenke={lenke} tekst="Sammenlign pakkene" />
        </PakkeHode>
        <Pakkerad>
          {PAKKER.map((p, i) => (
            <Pakke key={p.navn} $fremhevet={i === 1}>
              <h3>{p.navn}</h3>
              <small>{p.omfang}</small>
              <p>
                {p.pris} kr<span>eks. mva</span>
              </p>
            </Pakke>
          ))}
        </Pakkerad>
      </Pakkeoppsett>
    </Ramme>
  )
}

/* ---------- 6. Dempet: vi gjør / du gjør ---------- */

const Fordeling = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 0.75rem;
  align-items: stretch;

  ${smalest} {
    grid-template-columns: 1fr;
  }
`

const Fordelingskort = styled.div<{ $mork?: boolean }>`
  padding: 1.3rem 1.4rem;
  border-radius: 22px;
  background: ${({ $mork }) => ($mork ? V.deep : V.paper)};
  color: ${({ $mork }) => ($mork ? V.inverted : V.ink)};

  h3 {
    margin: 0 0 0.9rem;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${({ $mork }) => ($mork ? V.invertedMuted : V.inkMuted)};
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.55rem;
  }

  li {
    display: flex;
    align-items: baseline;
    gap: 0.55rem;
    font-size: 0.86rem;
    line-height: 1.35;
  }

  svg {
    flex-shrink: 0;
    font-size: 0.8em;
    color: ${({ $mork }) => ($mork ? V.accentLight : V.vivid)};
  }
`

function DempetFordeling({ lenke }: { lenke: string }) {
  const vi = [
    'Kjøper domenet i ditt navn',
    'Skriver alle tekstene',
    'Tar bildene',
    'Designer og koder siden',
    'Melder deg inn hos Google',
    'Drifter og passer på',
  ]
  const du = ['Prater med oss i én time', 'Leser gjennom og sier ja']
  return (
    <Ramme $flate="dempet">
      <Annonsemerke flate="dempet" />
      <Delt>
        <div>
          <Merkevare />
          <Overskrift>
            Du har en bedrift å drive.
            <span>Nettsiden tar vi.</span>
          </Overskrift>
          <Tekst>
            Lista over hva vi gjør er lang. Lista over hva du gjør er kort – du bruker rundt to timer til sammen.
          </Tekst>
          <Cta lenke={lenke} tekst="Se hva som er inkludert" />
        </div>
        <Fordeling aria-hidden="true">
          <Fordelingskort>
            <h3>Vi gjør</h3>
            <ul>
              {vi.map(p => (
                <li key={p}>
                  <Icon name="faCheck" /> {p}
                </li>
              ))}
            </ul>
          </Fordelingskort>
          <Fordelingskort $mork>
            <h3>Du gjør</h3>
            <ul>
              {du.map(p => (
                <li key={p}>
                  <Icon name="faCheck" /> {p}
                </li>
              ))}
            </ul>
          </Fordelingskort>
        </Fordeling>
      </Delt>
    </Ramme>
  )
}

/* ---------- 7. Mørk, midtstilt prisbudskap ---------- */

const Midtstilt = styled.div`
  ${toppluft}
  padding: clamp(2.5rem, 8cqi, 5rem) ${luft};
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;

  ${Logo} {
    justify-content: center;
  }

  ${Tekst} {
    margin-left: auto;
    margin-right: auto;
  }
`

const Prisrad = styled.ul`
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.75rem 0 0;
  padding: 0;

  li {
    padding: 0.45rem 0.95rem;
    border-radius: 999px;
    background: ${V.deepRaised};
    font-size: 0.85rem;
    color: ${V.invertedMuted};
    white-space: nowrap;

    b {
      font-weight: 500;
      color: ${V.inverted};
    }
  }
`

function MorkPris({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="mork">
      <Annonsemerke flate="mork" />
      <Midtstilt>
        <Merkevare mork />
        <Overskrift $maks="22ch" $mork>
          Prisen står på nettsiden.
          <span>Ikke i et tilbud du må vente på.</span>
        </Overskrift>
        <Prisrad>
          <li>
            <b>Start</b> fra {PRIS.fra} kr
          </li>
          <li>
            <b>Bedrift</b> fra 34 900 kr
          </li>
          <li>
            <b>Vekst</b> fra 59 900 kr
          </li>
        </Prisrad>
        <Cta lenke={lenke} tekst="Se alle prisene" variant="hvit" notis="Alle priser eks. mva" mork midtstilt />
      </Midtstilt>
    </Ramme>
  )
}

/* ---------- 8. Mørk med mobil ---------- */

const Mobil = styled.div`
  justify-self: center;
  width: min(100%, 15.5rem);
  padding: 0.55rem;
  border-radius: 2.4rem;
  background: #0f0f10;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), 0 40px 80px -30px rgba(0, 0, 0, 0.7);
`

const Skjerm = styled.div`
  position: relative;
  border-radius: 1.9rem;
  overflow: hidden;
  background: ${V.paper};
  color: ${V.ink};
  padding: 2.2rem 1.1rem 1.2rem;

  /* Kameraøya */
  &::before {
    content: '';
    position: absolute;
    top: 0.6rem;
    left: 50%;
    width: 4.2rem;
    height: 1.05rem;
    border-radius: 999px;
    background: #0f0f10;
    transform: translateX(-50%);
  }

  nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.05em;

    i {
      display: grid;
      gap: 3px;

      &::before,
      &::after {
        content: '';
        display: block;
        width: 0.95rem;
        height: 2px;
        border-radius: 2px;
        background: ${V.ink};
      }
    }
  }

  h3 {
    margin: 1.4rem 0 0;
    font-size: 1.15rem;
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0.45rem 0 0;
    font-size: 0.68rem;
    line-height: 1.45;
    color: ${V.inkMuted};
  }
`

const Mobilbilde = styled.div`
  height: 5.2rem;
  margin-top: 1rem;
  border-radius: 14px;
  background: linear-gradient(160deg, #dfe7f2 0%, #b9c9e0 100%);
`

const Mobilknapp = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.9rem;
  padding: 0.6rem;
  border-radius: 999px;
  background: ${V.vivid};
  color: #fff;
  font-size: 0.72rem;
  font-weight: 500;
`

const Mobilinfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.8rem;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  background: ${V.sunken};
  font-size: 0.62rem;
  color: ${V.inkMuted};

  b {
    font-weight: 600;
    color: ${V.success};
  }
`

function MorkMobil({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="mork">
      <Annonsemerke flate="mork" />
      <Delt $skjulBilde>
        <div>
          <Merkevare mork />
          <Overskrift $mork>
            Kundene finner deg på mobilen.
            <span>Da må den være god der.</span>
          </Overskrift>
          <Tekst $mork>
            Vimzo lager nettsider som er like gode på telefonen som på PC – med telefonnummeret ett trykk unna, og et
            kontaktskjema som lander rett i innboksen din.
          </Tekst>
          <Punkter mork punkter={['Eget design, ingen ferdigmal', 'Tekstene skriver vi', 'Ingen bindingstid på driften']} />
          <Cta lenke={lenke} tekst="Se eksempler" variant="hvit" />
        </div>
        <Mobil aria-hidden="true">
          <Skjerm>
            <nav>
              DIN BEDRIFT <i />
            </nav>
            <h3>Rørlegger med fast pris.</h3>
            <p>Vi kommer samme uke, og du får prisen før vi begynner.</p>
            <Mobilbilde />
            <Mobilknapp>
              <Icon name="faPhone" /> Ring oss
            </Mobilknapp>
            <Mobilinfo>
              <span>
                <Stjerner>★★★★★</Stjerner> 4,9
              </span>
              <b>Åpent nå</b>
            </Mobilinfo>
          </Skjerm>
        </Mobil>
      </Delt>
    </Ramme>
  )
}

/* ---------- 9. Lys: tekstene skriver vi ---------- */

const Kladd = styled.figure`
  margin: 0;
  padding: clamp(1.4rem, 4cqi, 2rem);
  border-radius: 22px;
  background: ${V.sunken};

  figcaption {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${V.inkMuted};

    i {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: ${V.success};
    }
  }

  blockquote {
    margin: 1.1rem 0 0;
    font-size: clamp(1.1rem, 0.9rem + 1cqi, 1.35rem);
    font-weight: 500;
    line-height: 1.35;
    letter-spacing: -0.02em;
    color: ${V.ink};
  }

  /* Skrivemarkøren */
  blockquote::after {
    content: '';
    display: inline-block;
    width: 2px;
    height: 1.1em;
    margin-left: 3px;
    vertical-align: -0.15em;
    background: ${V.vivid};

    @media (prefers-reduced-motion: no-preference) {
      animation: ${blink} 1.1s steps(1) infinite;
    }
  }

  p {
    margin: 1.2rem 0 0;
    font-size: 0.8rem;
    color: ${V.inkMuted};
  }
`

function LysTekst({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="lys">
      <Annonsemerke flate="lys" />
      <Delt>
        <div>
          <Merkevare />
          <Overskrift>
            Du slipper å skrive et eneste ord.
            <span>Det er det som stopper de fleste.</span>
          </Overskrift>
          <Tekst>
            Vi tar en prat om hva bedriften gjør, og skriver tekstene selv – på norsk, slik kundene dine snakker, og
            slik at Google forstår dem.
          </Tekst>
          <Cta lenke={lenke} tekst="Slik jobber vi" notis={`Nettside fra ${PRIS.fra} kr eks. mva`} />
        </div>
        <Kladd aria-hidden="true">
          <figcaption>
            <i /> Forsiden · utkast
          </figcaption>
          <blockquote>Vi fikser lekkasjen samme uke – og prisen får du skriftlig før vi begynner.</blockquote>
          <p>Skrevet av Vimzo etter en times prat.</p>
        </Kladd>
      </Delt>
    </Ramme>
  )
}

/* ---------- 10. Dempet: tryggheten i fire punkter ---------- */

/* På telefonbredde blir fire kort en lang vegg under knappen – da står budskapet alene. */
const Trygghetsgitter = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;

  ${smalest} {
    display: none;
  }

  div {
    padding: 1.15rem 1.2rem;
    border-radius: 20px;
    background: ${V.paper};
  }

  b {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.92rem;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.3;
    color: ${V.ink};

    svg {
      flex-shrink: 0;
      font-size: 0.8em;
      color: ${V.vivid};
    }
  }

  p {
    margin: 0.4rem 0 0;
    font-size: 0.8rem;
    line-height: 1.45;
    color: ${V.inkMuted};
  }
`

const TRYGGHET = [
  { tittel: 'Fast pris, avtalt før start', tekst: 'Tar jobben lengre tid enn vi trodde, er det vårt problem.' },
  { tittel: 'Du eier alt fra dag én', tekst: 'Domenet står i ditt navn, og siden er din om du bytter.' },
  { tittel: 'Alt på norsk', tekst: 'Du snakker med den som lager siden. Ingenting settes ut.' },
  { tittel: 'Ingen bindingstid', tekst: `Drift for ${PRIS.drift} kr/mnd, som kan sies opp når som helst.` },
]

function DempetTrygghet({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="dempet">
      <Annonsemerke flate="dempet" />
      <Delt>
        <div>
          <Merkevare />
          <Overskrift>
            Ingen liten skrift.
            <span>Bare en nettside som virker.</span>
          </Overskrift>
          <Tekst>
            Vimzo lager nettsider for små bedrifter – håndverkere, frisører, rådgivere og alle andre som heller vil
            gjøre jobben sin enn å fikle med nettsiden.
          </Tekst>
          <Cta lenke={lenke} tekst="Les mer på vimzo.no" />
        </div>
        <Trygghetsgitter>
          {TRYGGHET.map(t => (
            <div key={t.tittel}>
              <b>
                <Icon name="faCheck" /> {t.tittel}
              </b>
              <p>{t.tekst}</p>
            </div>
          ))}
        </Trygghetsgitter>
      </Delt>
    </Ramme>
  )
}

/* =====================================================================
 *  LOGOVERKTØYET
 * ===================================================================== */

/** Eksempellogoer – tegnet her, så annonsen ikke laster bilder. Firmanavnene er oppdiktet. */
function Eksempelmerke({ type, farge }: { type: 'fjell' | 'monogram' | 'blad' | 'bolge'; farge: string }) {
  switch (type) {
    case 'fjell':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M4 38 L18 14 L26 27 L31 20 L44 38 Z" fill={farge} />
          <path d="M18 14 L22 21 L19 20 L16 23 Z" fill="#fff" opacity="0.85" />
        </svg>
      )
    case 'monogram':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill="none" stroke={farge} strokeWidth="3" />
          <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="700" fill={farge} fontFamily="Georgia, serif">
            BH
          </text>
        </svg>
      )
    case 'blad':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M10 38 C10 18 22 8 40 8 C40 28 30 38 10 38 Z" fill={farge} />
          <path d="M12 36 L32 16" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <rect x="4" y="4" width="40" height="40" rx="11" fill={farge} />
          <path d="M11 28 C16 22 20 22 24 28 C28 34 32 34 37 28" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M11 20 C16 14 20 14 24 20 C28 26 32 26 37 20" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
        </svg>
      )
  }
}

const EKSEMPLER = [
  { navn: 'Nordli Bygg', type: 'fjell' as const, farge: '#1F4E79', bg: '#EEF3F9', skrift: 'inherit' },
  { navn: 'Berg & Hagen', type: 'monogram' as const, farge: '#7A3E2B', bg: '#F7F1EC', skrift: 'Georgia, serif' },
  { navn: 'Grønn Hage', type: 'blad' as const, farge: '#2F6B3F', bg: '#EEF5EF', skrift: 'inherit' },
  { navn: 'Fjordrør', type: 'bolge' as const, farge: '#0B6E8A', bg: '#EAF4F7', skrift: 'inherit' },
]

const Logogitter = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
`

const Logokort = styled.div<{ $bg: string; $farge: string; $skrift: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  aspect-ratio: 4 / 3;
  padding: 1rem;
  border-radius: 20px;
  background: ${({ $bg }) => $bg};
  color: ${({ $farge }) => $farge};

  svg {
    width: clamp(2.2rem, 7cqi, 3rem);
    height: auto;
  }

  span {
    font-family: ${({ $skrift }) => $skrift};
    font-size: clamp(0.8rem, 0.6rem + 1cqi, 1rem);
    font-weight: 700;
    letter-spacing: -0.01em;
    text-align: center;
  }
`

/* ---------- L1. Lys: galleri med eksempellogoer ---------- */

function LogoGalleri({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="lys">
      <Annonsemerke flate="lys" />
      <Delt>
        <div>
          <Merkevare />
          <Overskrift>
            Lag en logo som ser tegnet ut.
            <span>Gratis å designe.</span>
          </Overskrift>
          <Tekst>
            Skriv navnet på bedriften, velg stil og farger, og plukk blant ferdige forslag i Vimzos logoverktøy – på
            norsk. Du betaler først når du vil ha filene.
          </Tekst>
          <Cta lenke={lenke} tekst="Prøv logoverktøyet" notis={`Filene fra ${PRIS.logo} kr eks. mva`} />
        </div>
        <Logogitter aria-hidden="true">
          {EKSEMPLER.map(e => (
            <Logokort key={e.navn} $bg={e.bg} $farge={e.farge} $skrift={e.skrift}>
              <Eksempelmerke type={e.type} farge={e.farge} />
              <span>{e.navn}</span>
            </Logokort>
          ))}
        </Logogitter>
      </Delt>
    </Ramme>
  )
}

/* ---------- L2. Mørk: tre steg ---------- */

const Stegrad = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;
  counter-reset: steg;

  ${smalest} {
    display: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.2rem;
    border-radius: 20px;
    background: ${V.deepRaised};
  }

  b {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 50%;
    background: rgba(108, 180, 255, 0.14);
    color: ${V.accentLight};
    font-size: 0.9rem;
    font-weight: 600;
  }

  strong {
    display: block;
    font-size: 0.98rem;
    font-weight: 600;
    letter-spacing: -0.015em;
  }

  small {
    display: block;
    margin-top: 0.15rem;
    font-size: 0.8rem;
    color: ${V.invertedMuted};
  }
`

function LogoSteg({ lenke }: { lenke: string }) {
  const steg = [
    { tittel: 'Navn og bransje', tekst: 'Skriv hva bedriften heter og gjør' },
    { tittel: 'Stil og farger', tekst: 'Symbol, monogram eller bare navnet' },
    { tittel: 'Velg og tilpass', tekst: 'Se logoen på skilt, kort og klær' },
  ]
  return (
    <Ramme $flate="mork">
      <Annonsemerke flate="mork" />
      <Delt>
        <div>
          <Merkevare mork />
          <Overskrift $mork>
            Lag logoen selv.
            <span>Uten å kunne tegne.</span>
          </Overskrift>
          <Tekst $mork>
            Logoverktøyet på vimzo.no gir deg forslag med symboler og tolv skrifttyper. Design så mye du vil – det
            koster ingenting før du laster ned.
          </Tekst>
          <Cta lenke={lenke} tekst="Lag logoen din" variant="hvit" notis={`Fra ${PRIS.logo} kr eks. mva`} mork />
        </div>
        <Stegrad aria-hidden="true">
          {steg.map((s, i) => (
            <li key={s.tittel}>
              <b>{i + 1}</b>
              <span>
                <strong>{s.tittel}</strong>
                <small>{s.tekst}</small>
              </span>
            </li>
          ))}
        </Stegrad>
      </Delt>
    </Ramme>
  )
}

/* ---------- L3. Dempet: hva som er i filpakken ---------- */

const Filpakke = styled.div`
  padding: clamp(1.25rem, 3.5cqi, 1.6rem);
  border-radius: 22px;
  background: ${V.paper};
  box-shadow: 0 20px 44px -18px rgba(12, 13, 12, 0.16);
`

const Filhode = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${V.border};

  i {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 12px;
    background: ${V.accentSoft};
  }

  svg {
    width: 1.7rem;
    height: 1.7rem;
  }

  strong {
    display: block;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  small {
    display: block;
    font-size: 0.75rem;
    color: ${V.inkMuted};
  }
`

const Filliste = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0;
    font-size: 0.82rem;
    color: ${V.ink};

    & + li {
      border-top: 1px solid ${V.sunken};
    }
  }

  em {
    flex-shrink: 0;
    width: 2.6rem;
    padding: 0.2rem 0;
    border-radius: 6px;
    background: ${V.accentSoft};
    color: ${V.accentInk};
    font-size: 0.62rem;
    font-style: normal;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-align: center;
  }
`

function LogoFiler({ lenke }: { lenke: string }) {
  const filer = [
    ['SVG', 'Alle versjoner, klare til trykk'],
    ['PDF', 'Til trykkeri og skiltmaker'],
    ['PNG', 'Opptil 4096 px, også på mørk bakgrunn'],
    ['GRAV', 'Graveringsfil i én farge'],
    ['ICO', 'Favikon og ikoner til nettsiden'],
  ]
  return (
    <Ramme $flate="dempet">
      <Annonsemerke flate="dempet" />
      <Delt $speilet $skjulBilde>
        <Filpakke aria-hidden="true">
          <Filhode>
            <i>
              <Eksempelmerke type="fjell" farge={V.vivid} />
            </i>
            <span>
              <strong>nordli-bygg-logo.zip</strong>
              <small>Klar til nedlasting</small>
            </span>
          </Filhode>
          <Filliste>
            {filer.map(([type, tekst]) => (
              <li key={type}>
                <em>{type}</em> {tekst}
              </li>
            ))}
          </Filliste>
        </Filpakke>
        <div>
          <Merkevare />
          <Overskrift>
            Alle logofilene du trenger.
            <span>I én nedlasting.</span>
          </Overskrift>
          <Tekst>
            Lag logoen i Vimzos logoverktøy og få den i alle versjoner – liggende, stående, symbol og navn – med
            fargekoder, skriftfiler og en egen fil for gravering.
          </Tekst>
          <Cta
            lenke={lenke}
            tekst="Design logoen gratis"
            notis={`${PRIS.logo} kr for filene · ${PRIS.profil} kr med visuell profil`}
          />
        </div>
      </Delt>
    </Ramme>
  )
}

/* ---------- L4. Smal lys stripe for logo ---------- */

const Stripemerke = styled.span`
  display: flex;
  gap: 0.35rem;

  ${smal} {
    display: none;
  }

  svg {
    width: 1.9rem;
    height: 1.9rem;
  }
`

function LogoStripe({ lenke }: { lenke: string }) {
  return (
    <Ramme $flate="dempet">
      <Hjorne>
        <Lukknapp />
      </Hjorne>
      <Stripe>
        <StripeAvsender>
          <Merkevare />
          <StripeMerke>Annonse</StripeMerke>
        </StripeAvsender>
        <Stripemerke aria-hidden="true">
          <Eksempelmerke type="bolge" farge={V.vivid} />
          <Eksempelmerke type="blad" farge="#2F6B3F" />
        </Stripemerke>
        <StripeTekst>
          Trenger bedriften en logo? <strong>Design den gratis</strong> – filene koster {PRIS.logo} kr.
        </StripeTekst>
        <Cta lenke={lenke} tekst="Lag logo" />
      </Stripe>
    </Ramme>
  )
}

/* ---------- Trekning ---------- */

interface Variant {
  id: string
  /** Side på vimzo.no klikket går til. */
  sti: string
  Annonse: (p: { lenke: string }) => ReactNode
}

const VARIANTER: Variant[] = [
  { id: 'lys-delt', sti: '/', Annonse: LysDelt },
  { id: 'estimat', sti: '/', Annonse: DempetEstimat },
  { id: 'bla-stripe', sti: '/priser', Annonse: BlaStripe },
  { id: 'google', sti: '/', Annonse: LysGoogle },
  { id: 'pakker', sti: '/priser', Annonse: LysPakker },
  { id: 'fordeling', sti: '/tjenester', Annonse: DempetFordeling },
  { id: 'mork-pris', sti: '/priser', Annonse: MorkPris },
  { id: 'mobil', sti: '/arbeid', Annonse: MorkMobil },
  { id: 'tekst', sti: '/tjenester', Annonse: LysTekst },
  { id: 'trygghet', sti: '/', Annonse: DempetTrygghet },
  { id: 'logo-galleri', sti: '/logo', Annonse: LogoGalleri },
  { id: 'logo-steg', sti: '/logo', Annonse: LogoSteg },
  { id: 'logo-filer', sti: '/logo', Annonse: LogoFiler },
  { id: 'logo-stripe', sti: '/logo', Annonse: LogoStripe },
]

interface VimzoAnnonseProps {
  /** Hvor annonsen står, f.eks. «gravering». Går til utm_content. */
  plassering: string
  /**
   * Luft rundt annonsen (CSS `margin`). Ligger på annonsen selv, ikke på en
   * omsluttende boks, så det ikke blir stående et tomt hull når den er krysset ut.
   */
  luft?: string
  /** Når annonsen skal følge bredden på innholdet rundt, ikke fylle hele flaten. */
  maksbredde?: string
}

const Plass = styled.aside<{ $luft?: string; $maksbredde?: string }>`
  ${({ $luft }) => $luft && `margin: ${$luft};`}
  ${({ $maksbredde }) => $maksbredde && `max-width: ${$maksbredde};`}
`

/** Variantene som er vist i dette besøket, så rotasjonen ikke gjentar seg. */
const VIST_NOKKEL = 'vimzo-annonse-vist'

function lesListe(nokkel: string): string[] {
  try {
    const verdi = JSON.parse(sessionStorage.getItem(nokkel) ?? '[]')
    return Array.isArray(verdi) ? verdi : []
  } catch {
    return []
  }
}

function skrivListe(nokkel: string, liste: string[]) {
  try {
    sessionStorage.setItem(nokkel, JSON.stringify(liste))
  } catch {
    // Privat modus o.l. – da blir trekningen rent tilfeldig, og det er greit.
  }
}

let trukket: number | null = null

/**
 * Trekkes én gang per sidelasting. Velger tilfeldig blant variantene som ikke er
 * vist ennå i besøket; når alle er vist, begynner runden på nytt.
 * ?vimzo=<id> tvinger en bestemt variant.
 */
function trekk() {
  if (trukket === null) {
    const valgt = new URLSearchParams(window.location.search).get('vimzo')
    const tvunget = VARIANTER.findIndex(v => v.id === valgt)
    if (tvunget >= 0) {
      trukket = tvunget
    } else {
      const vist = lesListe(VIST_NOKKEL)
      let ledige = VARIANTER.map((_, i) => i).filter(i => !vist.includes(VARIANTER[i].id))
      if (ledige.length === 0) {
        ledige = VARIANTER.map((_, i) => i)
        skrivListe(VIST_NOKKEL, [])
      }
      trukket = ledige[Math.floor(Math.random() * ledige.length)]
    }
  }
  return trukket
}

/**
 * Annonsen vises på alle sider der den står, helt til leseren krysser den ut.
 * Da er den borte resten av besøket (sessionStorage), på alle sider.
 */
const LUKKET_NOKKEL = 'vimzo-annonse-lukket'

function erLukket() {
  try {
    return sessionStorage.getItem(LUKKET_NOKKEL) === '1'
  } catch {
    return false
  }
}

function registrerVisning(id: string) {
  const vist = lesListe(VIST_NOKKEL)
  if (!vist.includes(id)) skrivListe(VIST_NOKKEL, [...vist, id])
}

function snapshot() {
  const tvunget = new URLSearchParams(window.location.search).has('vimzo')
  if (!tvunget && erLukket()) return null
  return trekk()
}

const ingenAbonnement = () => () => {}

export default function VimzoAnnonse({ plassering, luft, maksbredde }: VimzoAnnonseProps) {
  const indeks = useSyncExternalStore(ingenAbonnement, snapshot, () => null)
  const [lukket, settLukket] = useState(false)

  useEffect(() => {
    if (indeks !== null) registrerVisning(VARIANTER[indeks].id)
  }, [indeks])

  if (indeks === null || lukket) return null

  const lukk = () => {
    settLukket(true)
    try {
      sessionStorage.setItem(LUKKET_NOKKEL, '1')
    } catch {
      // Privat modus o.l. – da er den bare borte på denne siden.
    }
  }

  const { id, sti, Annonse } = VARIANTER[indeks]
  const lenke =
    `https://vimzo.no${sti}?utm_source=minio.no&utm_medium=annonse&utm_campaign=minio` +
    `&utm_content=${encodeURIComponent(`${plassering}-${id}`)}`

  return (
    <Plass aria-label="Annonse fra Vimzo" $luft={luft} $maksbredde={maksbredde}>
      <LukkKontekst.Provider value={lukk}>
        <Annonse lenke={lenke} />
      </LukkKontekst.Provider>
    </Plass>
  )
}
