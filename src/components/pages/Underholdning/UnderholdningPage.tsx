import styled from 'styled-components'
import { useSEO } from '../../../hooks/useSEO'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { Eyebrow, PilLenke, Wrap } from '../../editorial'
import { RESTEN, SPILL, UTVALGT, type Spill } from '../../../data/spill'

/**
 * Spillhubben. Spillene og hvilket som er utvalgt styres fra src/data/spill.ts.
 */

export default function UnderholdningPage() {
  useSEO({
    title: 'Håndverkerspill – gratis verktøyspill i nettleseren | Minio',
    description:
      'Gratis verktøyspill for håndverkere og hobbysnekkere: slå inn spikeren, sag i takt, finn riktig verktøy og mer. Spill på mobil eller PC – nå målet og få 10 % rabattkode på varmepumpehus.',
  })

  return (
    <PageTransition>
      <Side data-surface="dark">
        <Helt>
          <Wrap>
            <HeltGrid>
              <div>
                <Eyebrow $lys>Underholdning · {SPILL.length} gratis spill</Eyebrow>
                <h1>Håndverkerspill for en liten pause.</h1>
                <HeltIngress>
                  Spiker, sag og verktøykasse – gjort om til korte spill du rekker på en kaffekopp.
                  Rett i nettleseren, uten konto.
                </HeltIngress>
                <Handlinger>
                  <Primaerknapp href={UTVALGT.href}>
                    <Icon name="faPlay" /> Spill {UTVALGT.tittel}
                  </Primaerknapp>
                  <Sekundaerknapp href="#spill">Se flere spill</Sekundaerknapp>
                </Handlinger>
                <Fakta>
                  <li><strong>{SPILL.length}</strong> spill</li>
                  <li><strong>0 kr</strong> og ingen konto</li>
                  <li><strong>Mobil</strong> og PC</li>
                </Fakta>
              </div>

              <UtvalgtKort href={UTVALGT.href} className="spillkort">
                <Tavle>
                  <Merke>{UTVALGT.nytt ? 'Nytt spill' : 'Ukens spill'}</Merke>
                  <Skjerm spill={UTVALGT} />
                </Tavle>
                <UtvalgtTekst>
                  <div>
                    <Kortmeta>{UTVALGT.ferdighet} · {UTVALGT.tid}</Kortmeta>
                    <h2>{UTVALGT.tittel}</h2>
                    <p>{UTVALGT.beskrivelse}</p>
                  </div>
                  <Rundpil aria-hidden="true"><Icon name="faArrowRight" /></Rundpil>
                </UtvalgtTekst>
              </UtvalgtKort>
            </HeltGrid>

            <Billett aria-label="Slik får du rabattkoden">
              <BillettVenstre>
                <BillettTall>10 %</BillettTall>
                <span>rabatt på<br />varmepumpehus</span>
              </BillettVenstre>
              <BillettHoyre>
                <p>
                  <strong>Nå målet i ett av spillene</strong>, så låser du opp en rabattkode du kan bruke
                  i nettbutikken. Målet står på hvert kort.
                </p>
                <Kode aria-hidden="true">VPH<span>··</span></Kode>
              </BillettHoyre>
            </Billett>
          </Wrap>
        </Helt>

        <Spillseksjon id="spill" aria-labelledby="alle-spill">
          <Wrap>
            <SeksjonHode>
              <h2 id="alle-spill">Flere spill</h2>
              <p>Én runde tar noen minutter. Rekorden din lagres i nettleseren – så du kan prøve igjen. Og igjen.</p>
            </SeksjonHode>

            <Rutenett>
              {RESTEN.map((spill, i) => (
                <Kort key={spill.href} href={spill.href} className="spillkort">
                  <Tavle>
                    <Nummer>{String(i + 1).padStart(2, '0')}</Nummer>
                    {spill.nytt && <Merke>Nytt</Merke>}
                    <Skjerm spill={spill} />
                  </Tavle>
                  <Kortinnhold>
                    <Kortmeta>{spill.ferdighet} · {spill.tid}</Kortmeta>
                    <h3>{spill.tittel}</h3>
                    <p>{spill.beskrivelse}</p>
                    <Kortbunn>
                      <Maal>
                        <Icon name="faTrophy" /> Mål: {spill.maal}
                      </Maal>
                      <Spilllenke>
                        Spill <Icon name="faArrowRight" />
                      </Spilllenke>
                    </Kortbunn>
                  </Kortinnhold>
                </Kort>
              ))}
            </Rutenett>
          </Wrap>
        </Spillseksjon>

        <Leah>
          <Wrap>
            <LeahGrid>
              <div>
                <Eyebrow>Gjestespill</Eyebrow>
                <h2>Spill laget av Leah Noelle</h2>
              </div>
              <div>
                <p>
                  Ikke alle spillene her handler om verktøy. Leah Noelle har laget sine egne – med katter,
                  spøkelser og bananshake.
                </p>
                <PilLenke til="/spill-av-leah-noelle">Til Leah Noelles spill</PilLenke>
              </div>
            </LeahGrid>
          </Wrap>
        </Leah>
      </Side>
    </PageTransition>
  )
}

/** Skjermbilde i telefonramme som stikker opp fra hullplaten. */
function Skjerm({ spill }: { spill: Spill }) {
  return (
    <Telefon>
      <img src={spill.bilde} alt="" loading="lazy" width={390} height={844} />
    </Telefon>
  )
}

/* ---------- Flater ---------- */

const Side = styled.div`
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
`

const Helt = styled.header`
  position: relative;
  overflow: hidden;
  padding: clamp(8.5rem, 13vw, 10.5rem) 0 clamp(3rem, 6vw, 4.5rem);
  background:
    radial-gradient(70% 90% at 0% 0%, rgba(168, 81, 44, 0.24), transparent 60%),
    radial-gradient(50% 70% at 100% 30%, rgba(224, 137, 95, 0.08), transparent 60%);

  h1 {
    margin: 0;
    font-size: clamp(2.8rem, 6.4vw, 5.6rem);
    font-weight: 600;
    line-height: 0.98;
    letter-spacing: -0.05em;
    max-width: 11ch;
  }
`

const HeltGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.05fr;
  gap: clamp(2.5rem, 5vw, 5rem);
  align-items: center;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const HeltIngress = styled.p`
  margin: 1.5rem 0 0;
  max-width: 40ch;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
`

const knapp = `
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 52px;
  padding: 0 1.6rem;
  border-radius: 999px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s ease, transform 0.2s ease;

  &:active { transform: scale(0.98); }

  svg { font-size: 0.8em; }
`

const Primaerknapp = styled.a`
  ${knapp}
  background: ${({ theme }) => theme.colors.accentLight};
  color: ${({ theme }) => theme.colors.deep};

  &:hover { background: #ea9b74; }
`

const Sekundaerknapp = styled.a`
  ${knapp}
  color: ${({ theme }) => theme.colors.inkInverted};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.borderInverted};

  &:hover { background: rgba(255, 255, 255, 0.06); }
`

const Fakta = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.75rem;
  margin: 2.5rem 0 0;
  padding: 0;
  list-style: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.inkInvertedMuted};

  strong {
    color: ${({ theme }) => theme.colors.inkInverted};
    font-weight: 600;
  }
`

/* ---------- Tavle (illustrasjonsflate med hullplate-mønster) ---------- */

const Tavle = styled.div`
  position: relative;
  aspect-ratio: 16 / 10;
  padding: 8% 12% 4%;
  background-color: #24211e;
  background-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.55) 0 2.2px, transparent 2.8px);
  background-size: 22px 22px;
  background-position: 11px 11px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderInverted};
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(80% 70% at 50% 45%, transparent 40%, rgba(28, 26, 24, 0.75));
    pointer-events: none;
  }
`

const Telefon = styled.div`
  position: absolute;
  left: 50%;
  top: 9%;
  width: 46%;
  aspect-ratio: 390 / 844;
  translate: -50% 0;
  padding: 2.2%;
  border-radius: 13% / 6%;
  background: #0d0c0b;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.12),
    0 30px 60px -20px rgba(0, 0, 0, 0.9),
    0 0 80px rgba(224, 137, 95, 0.12);
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    border-radius: 11% / 5%;
  }

  .spillkort:hover & {
    transform: translateY(-5%) rotate(-2deg);
  }

  @media (prefers-reduced-motion: reduce) {
    .spillkort:hover & { transform: none; }
  }
`

const Merke = styled.span`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentLight};
  color: ${({ theme }) => theme.colors.deep};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
`

const Nummer = styled.span`
  position: absolute;
  top: 1rem;
  left: 1.1rem;
  z-index: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: rgba(250, 247, 242, 0.5);
`

const kortflate = `
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease, border-color 0.35s ease;

  &:hover { transform: translateY(-4px); }

  @media (prefers-reduced-motion: reduce) {
    &:hover { transform: none; }
  }
`

/* ---------- Utvalgt spill ---------- */

const UtvalgtKort = styled.a`
  ${kortflate}
  background: ${({ theme }) => theme.colors.deepRaised};
  border: 1px solid ${({ theme }) => theme.colors.borderInverted};
  box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.7);

  &:hover { border-color: rgba(224, 137, 95, 0.5); }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focusInverted};
    outline-offset: 3px;
  }
`

const UtvalgtTekst = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem 1.75rem 1.75rem;

  h2 {
    margin: 0.35rem 0 0;
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0.5rem 0 0;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    line-height: 1.5;
  }
`

const Rundpil = styled.span`
  flex: none;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.inkInverted};
  color: ${({ theme }) => theme.colors.deep};
  transition: transform 0.3s ease;

  .spillkort:hover & { transform: translateX(4px); }
`

/* ---------- Billett ---------- */

const Billett = styled.section`
  --perf: 240px;
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  margin-top: clamp(3rem, 6vw, 4.5rem);
  border-radius: 18px;
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};

  /* Utstansede halvsirkler ved perforeringen */
  &::before,
  &::after {
    content: '';
    position: absolute;
    left: var(--perf);
    width: 28px;
    height: 28px;
    margin-left: -14px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.deep};
  }
  &::before { top: -14px; }
  &::after { bottom: -14px; }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;

    &::before,
    &::after { display: none; }
  }
`

const BillettVenstre = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 240px;
  padding: 1.5rem 1.5rem;
  border-right: 2px dashed rgba(122, 58, 30, 0.3);
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.3;

  @media (max-width: 640px) {
    width: auto;
    border-right: 0;
    border-bottom: 2px dashed rgba(122, 58, 30, 0.3);
  }
`

const BillettTall = styled.span`
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 1;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.accent};
`

const BillettHoyre = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.5rem 1.75rem;

  p {
    margin: 0;
    max-width: 56ch;
    line-height: 1.5;
  }

  strong { color: ${({ theme }) => theme.colors.ink}; }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const Kode = styled.span`
  flex: none;
  padding: 0.6rem 1rem;
  border: 2px dashed ${({ theme }) => theme.colors.accent};
  border-radius: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: ${({ theme }) => theme.colors.accent};

  span { opacity: 0.45; }
`

/* ---------- Alle spillene ---------- */

const Spillseksjon = styled.section`
  padding: clamp(3rem, 6vw, 5rem) 0 clamp(4.5rem, 9vw, 7rem);
  scroll-margin-top: 5rem;
`

const SeksjonHode = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem 3rem;
  margin-bottom: clamp(2rem, 4vw, 3rem);

  h2 {
    margin: 0;
    font-size: clamp(2.2rem, 4.6vw, 3.6rem);
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.04em;
  }

  p {
    margin: 0;
    max-width: 38ch;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    line-height: 1.55;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: 1.25rem;
`

const Kort = styled.a`
  ${kortflate}
  background: ${({ theme }) => theme.colors.deepRaised};
  border: 1px solid ${({ theme }) => theme.colors.borderInverted};

  &:hover {
    border-color: rgba(224, 137, 95, 0.45);
    box-shadow: 0 30px 60px -30px rgba(0, 0, 0, 0.8);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focusInverted};
    outline-offset: 3px;
  }
`

const Kortinnhold = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 1.25rem 1.5rem 1.4rem;

  h3 {
    margin: 0.35rem 0 0;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: 600;
    letter-spacing: -0.025em;
  }

  p {
    margin: 0.5rem 0 0;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.55;
  }
`

const Kortmeta = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accentLight};
`

const Kortbunn = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1.25rem;
`

const Maal = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.inkInvertedMuted};

  svg { color: ${({ theme }) => theme.colors.accentLight}; }
`

const Spilllenke = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;

  svg {
    font-size: 0.8em;
    transition: transform 0.25s ease;
  }

  .spillkort:hover & svg { transform: translateX(4px); }
`

/* ---------- Leah Noelle ---------- */

const Leah = styled.section`
  padding: clamp(3.5rem, 7vw, 5.5rem) 0;
  background: ${({ theme }) => theme.colors.paper};
  color: ${({ theme }) => theme.colors.ink};

  h2 {
    margin: 0;
    font-size: clamp(1.8rem, 3.4vw, 2.6rem);
    font-weight: 600;
    letter-spacing: -0.035em;
    line-height: 1.05;
  }

  p {
    margin: 0 0 1.25rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    line-height: 1.6;
    max-width: 48ch;
  }
`

const LeahGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 4rem;
  align-items: end;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`
