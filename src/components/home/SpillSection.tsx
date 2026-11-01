import styled, { keyframes } from 'styled-components'
import Icon from '../shared/Icon'
import { Eyebrow, Ingress, PilLenke, Reveal, Seksjon, Wrap } from '../editorial'
import { RESTEN, SPILL, UTVALGT } from '../../data/spill'

/**
 * «Reklamepausen» nederst på forsiden: spillene presentert som en annonse –
 * rullende bånd, telefoner i vifte og rabattkoden som lokkemat. Spillene er
 * statiske HTML-sider, så lenkene til selve spillene er vanlige <a>.
 */

/** Det utvalgte spillet i midten, to av de andre på hver side. */
const VIFTE = [RESTEN[0], UTVALGT, RESTEN[1]].filter(Boolean)

export default function SpillSection() {
  return (
    <Flate $flate="deep" id="spill" data-surface="dark" aria-labelledby="spill-tittel">
      <Baand aria-hidden="true">
        <BaandSpor>
          {[0, 1].map((kopi) => (
            <BaandInnhold key={kopi}>
              {SPILL.map((s) => (
                <span key={s.href}>
                  {s.tittel} <i>✦</i>
                </span>
              ))}
            </BaandInnhold>
          ))}
        </BaandSpor>
      </Baand>

      <Wrap>
        <Grid>
          <Reveal>
            <Eyebrow $lys>Pause fra snekringa · {SPILL.length} gratis spill</Eyebrow>
            <Overskrift id="spill-tittel">
              Ta en pause.
              <br />
              <em>Slå rekorden.</em>
            </Overskrift>
            <Ingress $lys>
              Spiker, sag og terrassebord – gjort om til korte spill du rekker på en kaffekopp. Rett i
              nettleseren, uten konto.
            </Ingress>

            <Handlinger>
              <Spillknapp href={UTVALGT.href}>
                <Icon name="faPlay" /> Spill {UTVALGT.tittel}
              </Spillknapp>
              <PilLenke til="/underholdning" lys>
                Se alle spillene
              </PilLenke>
            </Handlinger>

            <Premie>
              <strong>10 %</strong>
              <span>
                Nå målet i et spill og lås opp en rabattkode på varmepumpehus.
              </span>
            </Premie>
          </Reveal>

          <Reveal forsinkelse={120}>
            <Scene href={UTVALGT.href} aria-label={`Spill ${UTVALGT.tittel}`}>
              <Glod aria-hidden="true" />
              {VIFTE.map((spill, i) => (
                <Telefon key={spill.href} $plass={i - 1} aria-hidden="true">
                  <img src={spill.bilde} alt="" loading="lazy" width={390} height={844} />
                </Telefon>
              ))}
              {UTVALGT.nytt && <Nytt aria-hidden="true">Nytt spill</Nytt>}
            </Scene>
          </Reveal>
        </Grid>
      </Wrap>
    </Flate>
  )
}

/* ---------- Flate ---------- */

const Flate = styled(Seksjon)`
  position: relative;
  overflow: hidden;
  padding-top: 0;
  background:
    radial-gradient(60% 80% at 85% 60%, rgba(224, 137, 95, 0.16), transparent 65%),
    radial-gradient(50% 60% at 0% 100%, rgba(168, 81, 44, 0.2), transparent 60%),
    ${({ theme }) => theme.colors.deep};

  /* Hullplate som toner ut mot kantene – samme motiv som spillsiden. */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.5) 0 2px, transparent 2.6px);
    background-size: 24px 24px;
    mask-image: radial-gradient(70% 70% at 70% 55%, #000 20%, transparent 75%);
    -webkit-mask-image: radial-gradient(70% 70% at 70% 55%, #000 20%, transparent 75%);
    pointer-events: none;
  }

  > * { position: relative; }
`

/* ---------- Rullende bånd ---------- */

const rull = keyframes`
  to { transform: translateX(-50%); }
`

const Baand = styled.div`
  margin: 0 -2rem clamp(3.5rem, 7vw, 6rem);
  padding: 0.9rem 0;
  background: ${({ theme }) => theme.colors.accentLight};
  color: ${({ theme }) => theme.colors.deep};
  transform: rotate(-1.5deg) translateY(2.75rem);
  box-shadow: 0 20px 40px -20px rgba(0, 0, 0, 0.6);
  overflow: hidden;
`

const BaandSpor = styled.div`
  display: flex;
  width: max-content;
  animation: ${rull} 40s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const BaandInnhold = styled.div`
  display: flex;
  flex: none;

  span {
    padding: 0 1.25rem;
    font-size: clamp(1.1rem, 2vw, 1.5rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  i {
    margin-left: 1.25rem;
    font-style: normal;
    opacity: 0.55;
  }
`

/* ---------- Innhold ---------- */

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(2.5rem, 6vw, 5rem);
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Overskrift = styled.h2`
  margin: 0;
  font-size: clamp(2.8rem, 6vw, 5.2rem);
  font-weight: 600;
  line-height: 0.98;
  letter-spacing: -0.05em;

  em {
    font-style: normal;
    color: ${({ theme }) => theme.colors.accentLight};
  }
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.75rem;
  margin-top: 2rem;
`

const Spillknapp = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 54px;
  padding: 0 1.75rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentLight};
  color: ${({ theme }) => theme.colors.deep};
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  box-shadow: 0 12px 30px -10px rgba(224, 137, 95, 0.6);
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;

  svg { font-size: 0.8em; }

  &:hover {
    background: #ea9b74;
    transform: translateY(-2px);
    box-shadow: 0 18px 36px -12px rgba(224, 137, 95, 0.7);
  }

  &:active { transform: scale(0.98); }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focusInverted};
    outline-offset: 3px;
  }
`

const Premie = styled.p`
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 30rem;
  margin: 2.5rem 0 0;
  padding: 0.9rem 1.25rem;
  border: 1.5px dashed rgba(224, 137, 95, 0.5);
  border-radius: 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.45;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};

  strong {
    flex: none;
    font-size: 1.9rem;
    font-weight: 700;
    letter-spacing: -0.05em;
    color: ${({ theme }) => theme.colors.accentLight};
  }
`

/* ---------- Telefonvifte ---------- */

const sveve = keyframes`
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -10px; }
`

const Scene = styled.a`
  position: relative;
  display: block;
  aspect-ratio: 1 / 0.95;
  max-width: 560px;
  margin: 0 auto;
  border-radius: 24px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focusInverted};
    outline-offset: 6px;
  }
`

const Glod = styled.div`
  position: absolute;
  inset: 15% 20%;
  border-radius: 50%;
  background: rgba(224, 137, 95, 0.35);
  filter: blur(70px);
`

/** $plass: -1 venstre, 0 midten, 1 høyre. */
const Telefon = styled.div<{ $plass: number }>`
  --x: ${({ $plass }) => $plass * 62}%;
  --r: ${({ $plass }) => $plass * 9}deg;
  --spre: 1;

  position: absolute;
  left: 50%;
  top: ${({ $plass }) => ($plass === 0 ? '2%' : '10%')};
  width: ${({ $plass }) => ($plass === 0 ? '40%' : '34%')};
  aspect-ratio: 390 / 844;
  margin-left: ${({ $plass }) => ($plass === 0 ? '-20%' : '-17%')};
  z-index: ${({ $plass }) => ($plass === 0 ? 2 : 1)};
  padding: 2.2%;
  border-radius: 13% / 6%;
  background: #0d0c0b;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.14),
    0 40px 70px -25px rgba(0, 0, 0, 0.95);
  transform: translateX(calc(var(--x) * var(--spre))) rotate(calc(var(--r) * var(--spre)));
  filter: ${({ $plass }) => ($plass === 0 ? 'none' : 'brightness(0.7)')};
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), filter 0.4s ease;
  animation: ${sveve} 6s ease-in-out infinite;
  animation-delay: ${({ $plass }) => $plass * -2}s;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    border-radius: 11% / 5%;
  }

  ${Scene}:hover &,
  ${Scene}:focus-visible & {
    --spre: 1.18;
    filter: none;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`

const Nytt = styled.span`
  position: absolute;
  top: 6%;
  right: 12%;
  z-index: 3;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.inkInverted};
  color: ${({ theme }) => theme.colors.deep};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  transform: rotate(8deg);
  box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.6);
`
