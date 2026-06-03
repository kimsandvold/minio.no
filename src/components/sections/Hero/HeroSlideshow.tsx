import styled from 'styled-components'
import { heroZoom } from '../../../styles/animations'
import { useHeroSlideshow } from '../../../hooks/useHeroSlideshow'

const HeroBgImg = styled.img<{ $opacity: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  pointer-events: none;
  transition: opacity 1.5s ease-in-out;
  opacity: ${({ $opacity }) => $opacity};

  @media (min-width: 769px) {
    animation: ${heroZoom} 15s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    animation: none;
  }
`

const Layer2 = styled(HeroBgImg)`
  z-index: 2;
`

export default function HeroSlideshow() {
  const { layer1Src, layer2Src, layer1Opacity, layer2Opacity } = useHeroSlideshow()

  return (
    <>
      {layer1Src && <HeroBgImg src={layer1Src} alt="" $opacity={layer1Opacity} style={{ zIndex: 1 }} />}
      {layer2Src && <Layer2 src={layer2Src} alt="" $opacity={layer2Opacity} />}
    </>
  )
}
