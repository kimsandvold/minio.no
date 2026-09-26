import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver'
import Icon from '../../shared/Icon'

/**
 * Forside-seksjon som promoterer det interaktive 3D-designverktøyet
 * (/designverktoy). Mørk «tool»-identitet som matcher selve verktøyet, med
 * renderen vist i et app-vindu. Dette er sidens eneste verktøy-seksjon –
 * «noen gjør det for deg» ligger nå samlet i TjenesterPromo og /tjenester.
 */

const Section = styled.section`
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 15% 0%, rgba(168, 81, 44, 0.22), transparent 58%),
    ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
  padding: 6.5rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 3.5rem 1.25rem;
  }
`

const Inner = styled.div<{ $visible: boolean }>`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  align-items: center;
  gap: 3.5rem;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? '0' : '30px')});
  transition: opacity 0.6s ease, transform 0.6s ease;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 2.25rem;
  }
`

const Text = styled.div`
  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.accentLight};
    margin-bottom: 1.1rem;
  }
  .kicker span {
    background: rgba(224, 137, 95, 0.14);
    border: 1px solid rgba(224, 137, 95, 0.38);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    letter-spacing: 0.06em;
  }

  h2 {
    margin: 0 0 1.1rem;
    color: #fff;
  }

  p.lead {
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    margin: 0 0 1.75rem;
    max-width: 30rem;
  }
`

const Points = styled.ul`
  list-style: none;
  margin: 0 0 2rem;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: 1fr;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.95rem;
    color: rgba(250, 247, 242, 0.82);
  }
  svg {
    color: ${({ theme }) => theme.colors.accentLight};
    font-size: 0.85rem;
    flex-shrink: 0;
  }
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
`

const Primary = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  padding: 0.95rem 1.7rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  text-decoration: none;
  transition: transform 0.12s ease, background ${({ theme }) => theme.transitions.default};
  &:hover { background: ${({ theme }) => theme.colors.accentHover}; }
  &:active { transform: translateY(1px); }
`

const Secondary = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(250, 247, 242, 0.85);
  font-size: 1rem;
  font-weight: 600;
  padding: 0.95rem 1.4rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid rgba(255, 255, 255, 0.22);
  text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease;
  &:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.4); }
`

const Frame = styled.div`
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.paper};
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    order: -1;
  }
`

const FrameBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 0.9rem;
  background: ${({ theme }) => theme.colors.neutral[800]};
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  i {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    display: block;
  }
  i:nth-child(1) { background: #ff5f57; }
  i:nth-child(2) { background: #febc2e; }
  i:nth-child(3) { background: #28c840; }
  span {
    margin-left: 0.6rem;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.neutral[400]};
  }
`

const Shot = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 16 / 11;
  object-fit: cover;
  object-position: center 42%;
  background: ${({ theme }) => theme.colors.sunken};
`

export default function DesignerToolPromo() {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.15 })

  return (
    <Section data-surface="dark">
      <Inner ref={ref} $visible={isVisible}>
        <Text>
          <div className="kicker"><span>Nyhet</span> Designverktøy i 3D</div>
          <h2>Tegn ditt eget uteprosjekt – rett i nettleseren</h2>
          <p className="lead">
            Sett mål, velg treslag og farge, og se plantekassen din i 3D fra alle vinkler.
            Helt gratis å designe – byggeplan med materialliste kan du bestille når du er klar.
          </p>
          <Points>
            <li><Icon name="faCheck" /> Gratis å designe</li>
            <li><Icon name="faCheck" /> Se og roter i 3D</li>
            <li><Icon name="faCheck" /> Egne mål og materialer</li>
            <li><Icon name="faCheck" /> Byggeplan &amp; materialliste</li>
          </Points>
          <Actions>
            <Primary to="/designverktoy"><Icon name="faCube" /> Åpne designverktøyet</Primary>
            <Secondary to="/3d-design">Eller la oss tegne det <Icon name="faArrowRight" /></Secondary>
          </Actions>
        </Text>

        <Frame>
          <FrameBar>
            <i /><i /><i />
            <span>minio.no/designverktoy</span>
          </FrameBar>
          <Shot
            src="/images/designer/plantekasse-3d.webp"
            alt="3D-designverktøy – design din egen plantekasse med mål, treslag og farge"
            loading="lazy"
          />
        </Frame>
      </Inner>
    </Section>
  )
}
