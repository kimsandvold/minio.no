import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver'
import Icon from '../../shared/Icon'

// Forsidewidget for 3D-design-tjenesten – «done-for-you»-motstykket til den
// gratis planleggeren i TerrassePromo. Lys bakgrunn så de to 3D-seksjonene
// ikke står som to mørke blokker etter hverandre.

const Section = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 5rem 2rem;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 3rem 1rem;
  }
`

const Inner = styled.div<{ $visible: boolean }>`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  align-items: center;
  gap: 3.5rem;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? '0' : '30px')});
  transition: opacity 0.6s ease, transform 0.6s ease;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`

const Visual = styled.div`
  border-radius: ${({ theme }) => theme.borderRadius.large};
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  aspect-ratio: 4 / 3;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    order: -1;
  }
`

const Text = styled.div`
  h2 {
    font-size: 2.5rem;
    line-height: 1.1;
    margin: 1rem 0 1.25rem;
    color: ${({ theme }) => theme.colors.textDark};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.9rem;
    }
  }

  p {
    font-size: 1.05rem;
    line-height: 1.7;
    color: #4a4a4a;
    margin: 0 0 1.75rem;
    max-width: 46ch;
  }
`

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 0.4rem 0.9rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};

  svg {
    font-size: 0.8rem;
  }
`

const Features = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.98rem;
    color: ${({ theme }) => theme.colors.textDark};

    svg {
      color: ${({ theme }) => theme.colors.accent};
      flex-shrink: 0;
    }
  }
`

const Cta = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  font-size: 0.98rem;
  font-weight: 600;
  padding: 0.9rem 1.6rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`

const FEATURES = [
  { icon: 'faCube', text: '3D-skisse + fotorealistisk rendering' },
  { icon: 'faRulerCombined', text: 'Målsatt tegning og materialliste' },
  { icon: 'faStar', text: 'Skisseprisen trekkes fra ved bygg' },
]

export default function DesignPromo() {
  const [ref, isVisible] = useIntersectionObserver()

  return (
    <Section id="3d-design-promo">
      <Inner ref={ref} $visible={isVisible}>
        <Visual>
          {/* PLASSHOLDER – bytt til ekte SketchUp-rendering når den finnes. */}
          <img
            src="/images/planleggere/pergola-hero.webp"
            alt="3D-rendering av pergola i hage"
            loading="lazy"
          />
        </Visual>

        <Text>
          <Badge>
            <Icon name="faPalette" /> Tegnet for deg
          </Badge>
          <h2>Vil du heller at noen tegner det for deg?</h2>
          <p>
            Slipp å planlegge selv. Send meg mål og bilder, så tegner og renderer jeg terrassen,
            pergolaen eller uteprosjektet ditt i 3D – så du ser nøyaktig hvordan det blir før du bygger.
          </p>
          <Features>
            {FEATURES.map((f) => (
              <li key={f.text}>
                <Icon name={f.icon} /> {f.text}
              </li>
            ))}
          </Features>
          <Cta to="/3d-design">
            Se 3D-design <Icon name="faArrowRight" />
          </Cta>
        </Text>
      </Inner>
    </Section>
  )
}
