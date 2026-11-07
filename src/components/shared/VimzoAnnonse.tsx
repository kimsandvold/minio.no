import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import styled, { css } from 'styled-components'
import Icon from './Icon'

/**
 * Annonse for Vimzo (nettsider for små bedrifter). Fem varianter med ulik stil,
 * tekst og oppsett; én trekkes tilfeldig når siden lastes.
 *
 * Fargene er Vimzos egne, ikke minio-temaet – annonsen skal leses som en annen
 * avsender, og er merket «Annonse» etter markedsføringsloven.
 *
 * Trekningen skjer bare i nettleseren (useSyncExternalStore med null som
 * server-snapshot): sidene prerendres, og et tilfeldig valg i HTML-en ville ikke
 * stemt med det React hydrerer. Annonsen står langt nede, så den er på plass før
 * noen scroller dit.
 *
 * utm_content = «<plassering>-<variant>», så Vimzos statistikk viser både hvilken
 * side og hvilken stil klikket kom fra.
 */

const V = {
  ink: '#13111f',
  raised: '#1f1b33',
  accent: '#4f3fd6',
  accentHover: '#4133b8',
  /** Flater med hvit tekst (knapper, fremhevet kort) – Vimzos `accentVivid`. */
  vivid: '#5b4ae8',
  vividHover: '#4a3bd1',
  accentLight: '#b6a9ff',
  soft: '#edeaff',
  paper: '#fcfcfa',
  text: '#fcfcfa',
  muted: 'rgba(252, 252, 250, 0.68)',
  inkMuted: '#4e524d',
  border: 'rgba(182, 169, 255, 0.18)',
  borderLight: '#d4d6d1',
}

const PAKKER = [
  { navn: 'Liten', omfang: '1–3 sider', pris: '19 900' },
  { navn: 'Bedrift', omfang: '4–8 sider', pris: '34 900' },
  { navn: 'Større', omfang: 'Etter behov', pris: '59 900' },
]

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

const Ramme = styled.div<{ $bg: string; $farge: string; $kant?: string }>`
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: ${({ $bg }) => $bg};
  color: ${({ $farge }) => $farge};
  border: 1px solid ${({ $kant = V.border }) => $kant};
  container: vimzo / inline-size;
`

const Merke = styled.span<{ $lys?: boolean }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid ${({ $lys }) => ($lys ? 'rgba(19, 17, 31, 0.18)' : V.border)};
  color: ${({ $lys }) => ($lys ? V.inkMuted : V.muted)};
`

const Logo = styled.p<{ $farge: string }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 1.1rem;
  color: ${({ $farge }) => $farge};

  svg {
    display: block;
    flex-shrink: 0;
    width: 1.9rem;
    height: 1.9rem;
  }

  /* Ordmerket som på vimzo.no: versaler, åpen sperring, kompensert til høyre. */
  span {
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    margin-right: -0.14em;
  }
`

/**
 * Vimzos merke – samme baner som `Logo.tsx` i vimzo-repoet. På lys flate står
 * glyfen hvit på den svarte flisen; på mørk eller farget flate vises glyfen
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
        {!mork && <rect width="1024" height="1024" rx="150" fill="#080808" />}
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

const Overskrift = styled.h2<{ $maks?: string }>`
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2.3rem);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -0.03em;
  max-width: ${({ $maks = '18ch' }) => $maks};
`

const Tekst = styled.p<{ $farge?: string }>`
  margin: 1rem 0 0;
  max-width: 46ch;
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.55;
  color: ${({ $farge = V.muted }) => $farge};
`

const Liste = styled.ul`
  list-style: none;
  margin: 1.5rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.6rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  svg {
    color: ${V.accentLight};
    flex-shrink: 0;
  }
`

const Knapp = styled.a<{ $variant?: 'lilla' | 'hvit' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.4rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s, transform 0.2s;

  ${({ $variant = 'lilla' }) =>
    $variant === 'hvit'
      ? css`
          background: #fff;
          color: ${V.ink};
          &:hover {
            background: ${V.soft};
          }
        `
      : css`
          background: ${V.vivid};
          color: #fff;
          &:hover {
            background: ${V.vividHover};
          }
        `}

  &:hover {
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${V.accentLight};
    outline-offset: 3px;
  }

  ${smalest} {
    width: 100%;
    justify-content: center;
    padding: 1rem 1.4rem;
  }
`

const Notis = styled.span<{ $farge?: string }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ $farge = V.muted }) => $farge};
`

const Handlinger = styled.div<{ $midtstilt?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.5rem;
  margin-top: 2rem;
  ${({ $midtstilt }) => $midtstilt && 'justify-content: center;'}
`

function Cta({ lenke, tekst, variant, notis, notisFarge, midtstilt }: {
  lenke: string
  tekst: string
  variant?: 'lilla' | 'hvit'
  notis?: string
  notisFarge?: string
  midtstilt?: boolean
}) {
  return (
    <Handlinger $midtstilt={midtstilt}>
      <Knapp href={lenke} target="_blank" rel="sponsored noopener" $variant={variant}>
        {tekst} <Icon name="faArrowRight" />
      </Knapp>
      {notis && <Notis $farge={notisFarge}>{notis}</Notis>}
    </Handlinger>
  )
}



/* ---------- 1. Mørk, delt: tekst + nettleser-skisse ---------- */

const Delt = styled.div`
  ${toppluft}
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: clamp(2rem, 4vw, 3.5rem);
  align-items: center;
  padding: clamp(1.75rem, 4vw, 3rem);
  background: radial-gradient(120% 140% at 100% 0%, rgba(79, 63, 214, 0.35) 0%, transparent 55%);

  ${smal} {
    grid-template-columns: 1fr;
  }
`

const Nettleser = styled.div`
  background: ${V.raised};
  border: 1px solid ${V.border};
  border-radius: 14px;
  box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.6);
  overflow: hidden;
  transform: rotate(-1.5deg);

  ${smal} {
    display: none;
  }
`

const Adresselinje = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid ${V.border};

  i {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    background: rgba(252, 252, 250, 0.18);
  }

  span {
    flex: 1;
    margin-left: 0.5rem;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.3);
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.72rem;
    color: ${V.muted};
  }
`

const Skisse = styled.div`
  padding: 1.4rem;
  display: grid;
  gap: 0.75rem;
`

const Strek = styled.div<{ $b: string; $h?: string; $farge?: string }>`
  width: ${({ $b }) => $b};
  height: ${({ $h = '0.55rem' }) => $h};
  border-radius: 4px;
  background: ${({ $farge = 'rgba(252, 252, 250, 0.12)' }) => $farge};
`

const Ruter = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-top: 0.5rem;

  div {
    height: 3.6rem;
    border-radius: 8px;
    background: rgba(252, 252, 250, 0.06);
    border: 1px solid ${V.border};
  }
`

function MorkDelt({ lenke }: { lenke: string }) {
  return (
    <Ramme $bg={V.ink} $farge={V.text}>
      <Merke>Annonse</Merke>
      <Delt>
        <div>
          <Merkevare mork />
          <Overskrift>Har bedriften din en nettside du er stolt av?</Overskrift>
          <Tekst>
            Vimzo lager nettsider for små bedrifter – håndverkere, frisører, konsulenter og alle andre som
            heller vil gjøre jobben sin enn å fikle med nettsiden. Prisen står på nettsiden, ikke i et tilbud
            du må vente på.
          </Tekst>
          <Liste>
            {['Fast pris – fra 19 900 kr eks. mva', 'Domene, e-post og Google-oppsett inkludert', 'Drift og vedlikehold for 449 kr/mnd'].map(p => (
              <li key={p}>
                <Icon name="faCheck" /> {p}
              </li>
            ))}
          </Liste>
          <Cta lenke={lenke} tekst="Se priser på vimzo.no" notis="Fra samme folk som står bak minio.no" />
        </div>
        <Nettleser aria-hidden="true">
          <Adresselinje>
            <i />
            <i />
            <i />
            <span>dinbedrift.no</span>
          </Adresselinje>
          <Skisse>
            <Strek $b="35%" $h="0.5rem" $farge={V.accentLight} />
            <Strek $b="85%" $h="1.3rem" $farge="rgba(252, 252, 250, 0.85)" />
            <Strek $b="60%" $h="1.3rem" $farge="rgba(252, 252, 250, 0.85)" />
            <Strek $b="90%" />
            <Strek $b="70%" />
            <Strek $b="7.5rem" $h="2rem" $farge={V.accent} />
            <Ruter>
              <div />
              <div />
              <div />
            </Ruter>
          </Skisse>
        </Nettleser>
      </Delt>
    </Ramme>
  )
}

/* ---------- 2. Lys lavendel, midtstilt pris-budskap ---------- */

const Midtstilt = styled.div`
  ${toppluft}
  padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1.5rem, 4vw, 3rem);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: radial-gradient(80% 100% at 50% 0%, rgba(182, 169, 255, 0.55) 0%, transparent 70%);

  ${Logo} {
    justify-content: center;
  }

  ${Tekst} {
    margin-left: auto;
    margin-right: auto;
  }
`

const Pris = styled.span`
  color: ${V.accent};
  white-space: nowrap;
`

function LysPris({ lenke }: { lenke: string }) {
  return (
    <Ramme $bg={V.soft} $farge={V.ink} $kant="rgba(79, 63, 214, 0.2)">
      <Merke $lys>Annonse</Merke>
      <Midtstilt>
        <Merkevare />
        <Overskrift $maks="22ch">
          En ferdig nettside for bedriften din fra <Pris>19 900 kr</Pris>.
        </Overskrift>
        <Tekst $farge={V.inkMuted}>
          Tekst, bilder, design, domene og e-post – og du får prisen før du ringer, ikke etter. Ingen maler,
          ingen overraskelser på fakturaen.
        </Tekst>
        <Cta lenke={lenke} tekst="Regn ut prisen din" notis="Alle priser eks. mva" notisFarge={V.inkMuted} midtstilt />
      </Midtstilt>
    </Ramme>
  )
}

/* ---------- 3. Smal lilla stripe ---------- */

const Stripe = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem clamp(1.5rem, 4vw, 2.5rem);

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

    ${Handlinger} {
      margin: 0;
      width: 100%;
    }
  }
`

/* Avsender og «Annonse» samlet til venstre, skilt fra budskapet med en tynn strek. */
const StripeAvsender = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex-shrink: 0;
  padding-right: 1.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.25);

  ${smal} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0;
    border: 0;
  }
`

const StripeTekst = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1.4;
  font-weight: 500;
  letter-spacing: -0.01em;

  strong {
    font-weight: 700;
  }
`

const StripeMerke = styled.span`
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.65);
`

function LillaStripe({ lenke }: { lenke: string }) {
  return (
    <Ramme $bg={`linear-gradient(100deg, ${V.accent} 0%, #6a5cf0 100%)`} $farge="#fff" $kant="transparent">
      <Stripe>
        <StripeAvsender>
          <Merkevare mork />
          <StripeMerke>Annonse</StripeMerke>
        </StripeAvsender>
        <StripeTekst>
          Trenger bedriften ny nettside? <strong>Fast pris fra 19 900 kr</strong> – med domene og e-post.
        </StripeTekst>
        <Cta lenke={lenke} tekst="Se vimzo.no" variant="hvit" />
      </Stripe>
    </Ramme>
  )
}

/* ---------- 4. Lys, Google-søk til venstre, tekst til høyre ---------- */

const Speilet = styled.div`
  ${toppluft}
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: clamp(2rem, 4vw, 3.5rem);
  align-items: center;
  padding: clamp(1.75rem, 4vw, 3rem);

  ${smal} {
    grid-template-columns: 1fr;
  }
`

const Sok = styled.div`
  background: #fff;
  border: 1px solid ${V.borderLight};
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 20px 40px -24px rgba(19, 17, 31, 0.35);
  font-family: Arial, Helvetica, sans-serif;

  ${smal} {
    display: none;
  }
`

const Sokefelt = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1rem;
  border: 1px solid ${V.borderLight};
  border-radius: 999px;
  font-size: 0.85rem;
  color: #202124;

  svg {
    color: #9aa0a6;
  }
`

const Treff = styled.div<{ $dempet?: boolean }>`
  margin-top: 1.1rem;
  opacity: ${({ $dempet }) => ($dempet ? 0.35 : 1)};

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
    <Ramme $bg={V.paper} $farge={V.ink} $kant={V.borderLight}>
      <Merke $lys>Annonse</Merke>
      <Speilet>
        <Sok aria-hidden="true">
          <Sokefelt>
            <Icon name="faSearch" /> snekker i nærheten
          </Sokefelt>
          <Treff>
            <small>dinbedrift.no</small>
            <b>Din Bedrift – snekker med fast pris</b>
            <p>
              <Stjerner>★★★★★</Stjerner> 4,9 · Åpent nå · Ring for befaring. Terrasser, kledning og
              tilbygg…
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
          <Overskrift>Kundene googler deg før de ringer.</Overskrift>
          <Tekst $farge={V.inkMuted}>
            Vimzo lager nettsiden og setter opp Google-profilen og Maps-oppføringen, så det er du som dukker
            opp når noen i nærheten søker etter det du gjør.
          </Tekst>
          <Cta lenke={lenke} tekst="Bli funnet på Google" notis="Fra 19 900 kr eks. mva" notisFarge={V.inkMuted} />
        </div>
      </Speilet>
    </Ramme>
  )
}

/* ---------- 5. Mørk med pakkekort ---------- */

const Pakkeoppsett = styled.div`
  ${toppluft}
  padding: clamp(1.75rem, 4vw, 3rem);
  background: radial-gradient(90% 120% at 0% 100%, rgba(79, 63, 214, 0.3) 0%, transparent 60%);
`

const PakkeHode = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;

  ${Handlinger} {
    margin: 0;
  }

  ${smal} {
    flex-direction: column;
    align-items: stretch;
  }
`

const Pakkerad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 2rem;

  ${smal} {
    grid-template-columns: 1fr;
    gap: 0.6rem;
    margin-top: 1.5rem;
  }
`

const Pakke = styled.div<{ $fremhevet?: boolean }>`
  padding: 1.25rem 1.4rem;
  border-radius: 14px;
  background: ${({ $fremhevet }) => ($fremhevet ? V.vivid : V.raised)};
  border: 1px solid ${({ $fremhevet }) => ($fremhevet ? 'transparent' : V.border)};

  h3 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: 600;
  }

  small {
    display: block;
    margin-top: 0.2rem;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ $fremhevet }) => ($fremhevet ? 'rgba(255,255,255,0.8)' : V.muted)};
  }

  p {
    margin: 1rem 0 0;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.02em;

    span {
      font-size: ${({ theme }) => theme.fontSizes.xs};
      font-weight: 400;
      opacity: 0.75;
    }
  }

  ${smal} {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 1rem;
    padding: 0.9rem 1.1rem;

    h3 {
      grid-column: 1;
    }

    small {
      grid-column: 1;
    }

    p {
      grid-column: 2;
      grid-row: 1 / span 2;
      margin: 0;
      font-size: 1.15rem;
      text-align: right;
      white-space: nowrap;
    }
  }
`

function MorkPakker({ lenke }: { lenke: string }) {
  return (
    <Ramme $bg={V.ink} $farge={V.text}>
      <Merke>Annonse</Merke>
      <Pakkeoppsett>
        <PakkeHode>
          <div>
            <Merkevare mork />
            <Overskrift $maks="20ch">Nettside til bedriften – med prisen på bordet.</Overskrift>
            <Tekst>Velg størrelse, så vet du hva det koster. Drift, backup og domene er 449 kr/mnd.</Tekst>
          </div>
          <Cta lenke={lenke} tekst="Sammenlign pakkene" />
        </PakkeHode>
        <Pakkerad>
          {PAKKER.map((p, i) => (
            <Pakke key={p.navn} $fremhevet={i === 1}>
              <h3>{p.navn}</h3>
              <small>{p.omfang}</small>
              <p>
                fra {p.pris} <span>kr eks. mva</span>
              </p>
            </Pakke>
          ))}
        </Pakkerad>
      </Pakkeoppsett>
    </Ramme>
  )
}

/* ---------- Trekning ---------- */

const VARIANTER: Array<{ id: string; Annonse: (p: { lenke: string }) => ReactNode }> = [
  { id: 'mork-delt', Annonse: MorkDelt },
  { id: 'lys-pris', Annonse: LysPris },
  { id: 'lilla-stripe', Annonse: LillaStripe },
  { id: 'lys-google', Annonse: LysGoogle },
  { id: 'mork-pakker', Annonse: MorkPakker },
]

interface VimzoAnnonseProps {
  /** Hvor annonsen står, f.eks. «gravering». Går til utm_content. */
  plassering: string
}

let trukket: number | null = null

/** Trekkes én gang per sidelasting. ?vimzo=<id> tvinger en bestemt variant. */
function trekk() {
  if (trukket === null) {
    const valgt = new URLSearchParams(window.location.search).get('vimzo')
    const tvunget = VARIANTER.findIndex(v => v.id === valgt)
    trukket = tvunget >= 0 ? tvunget : Math.floor(Math.random() * VARIANTER.length)
  }
  return trukket
}

/**
 * Frekvenstak: annonsen vises på høyst MAKS_SIDER ulike sider per besøk, så den
 * som leser mange guider på rad ikke ser den overalt. Sidene den er vist på
 * huskes i sessionStorage; en side som allerede er telt, viser den fortsatt
 * (ellers ville den forsvunnet igjen idet visningen registreres).
 */
const MAKS_SIDER = 2
const NOKKEL = 'vimzo-annonse-sider'

function visteSider(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(NOKKEL) ?? '[]')
  } catch {
    return []
  }
}

function registrerVisning(side: string) {
  const sider = visteSider()
  if (sider.includes(side)) return
  try {
    sessionStorage.setItem(NOKKEL, JSON.stringify([...sider, side]))
  } catch {
    // Privat modus o.l. – da blir det ingen frekvenstak, og det er greit.
  }
}

function snapshot() {
  const tvunget = new URLSearchParams(window.location.search).has('vimzo')
  const sider = visteSider()
  const side = window.location.pathname
  if (!tvunget && !sider.includes(side) && sider.length >= MAKS_SIDER) return null
  return trekk()
}

const ingenAbonnement = () => () => {}

export default function VimzoAnnonse({ plassering }: VimzoAnnonseProps) {
  const indeks = useSyncExternalStore(ingenAbonnement, snapshot, () => null)

  useEffect(() => {
    if (indeks !== null) registrerVisning(window.location.pathname)
  }, [indeks])

  if (indeks === null) return null

  const { id, Annonse } = VARIANTER[indeks]
  const lenke =
    'https://vimzo.no/?utm_source=minio.no&utm_medium=annonse&utm_campaign=minio' +
    `&utm_content=${encodeURIComponent(`${plassering}-${id}`)}`

  return (
    <aside aria-label="Annonse fra Vimzo">
      <Annonse lenke={lenke} />
    </aside>
  )
}
