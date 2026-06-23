import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver'
import Icon from '../../shared/Icon'

const Section = styled.section`
  background: ${({ theme }) => theme.colors.darkBg};
  color: ${({ theme }) => theme.colors.textLight};
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
  grid-template-columns: 1.05fr 0.95fr;
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

const Text = styled.div`
  h2 {
    font-size: 2.5rem;
    line-height: 1.1;
    margin: 1rem 0 1.25rem;
    color: #fff;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.9rem;
    }
  }

  p {
    font-size: 1.05rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.78);
    margin: 0 0 1.75rem;
    max-width: 46ch;
  }
`

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
`

const Features = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: 1fr;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.92rem;
    color: rgba(255, 255, 255, 0.9);

    svg {
      color: #fff;
      opacity: 0.7;
      flex-shrink: 0;
    }
  }
`

const Cta = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.9rem 1.6rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  text-decoration: none;
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  }
`

const Visual = styled.div`
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 100%);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);

  > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    display: block;
    padding: 1rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    order: -1;
  }
`

const FloatingThumb = styled.div`
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  z-index: 2;
  width: 38%;
  max-width: 220px;
  background: #fff;
  border-radius: 12px;
  padding: 0.5rem 0.5rem 0.35rem;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);

  img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: contain;
    display: block;
  }
  span {
    display: block;
    text-align: center;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.textDark};
    margin-top: 0.15rem;
  }
`

const FEATURES = [
  { icon: 'faCube', text: '3D-visning i sanntid' },
  { icon: 'faRulerCombined', text: 'Terrasse og pergola' },
  { icon: 'faDownload', text: 'Materialliste som PDF' },
  { icon: 'faSave', text: 'Lagre prosjektene dine' },
]

export default function TerrassePromo() {
  const [ref, isVisible] = useIntersectionObserver()

  return (
    <Section id="terrasseplanlegger-promo">
      <Inner ref={ref} $visible={isVisible}>
        <Text>
          <Badge>
            <Icon name="faStar" /> Gratis 3D-verktøy
          </Badge>
          <h2>Planlegg uteplassen i 3D</h2>
          <p>
            Tegn terrassen eller pergolaen akkurat slik du vil ha den – velg form, sett målene og se den
            umiddelbart i 3D. Få komplett materialliste med antall bord, bjelker, stolper og skruer, og et
            veiledende prisestimat på kjøpet.
          </p>
          <Features>
            {FEATURES.map((f) => (
              <li key={f.text}>
                <Icon name={f.icon} /> {f.text}
              </li>
            ))}
          </Features>
          <Cta to="/planleggere">
            Se planleggerne <Icon name="faArrowRight" />
          </Cta>
        </Text>

        <Visual>
          <img
            src="/images/planleggere/terrasse.webp"
            alt="L-formet terrasse i tre med rekkverk og trapp, tegnet i Minios terrasseplanlegger"
            loading="lazy"
          />
          <FloatingThumb>
            <img
              src="/images/planleggere/pergola.webp"
              alt="Frittstående pergola i tre, tegnet i Minios pergolaplanlegger"
              loading="lazy"
            />
            <span>Pergola</span>
          </FloatingThumb>
        </Visual>
      </Inner>
    </Section>
  )
}
