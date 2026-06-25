import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import Icon from './Icon'
import { useBasketContext } from '../../context/BasketContext'
import type { AnimalHouseConfig } from './AnimalHouseVisualizer'

type Finish = AnimalHouseConfig['finish']
type Roof = AnimalHouseConfig['roof']

export interface DimRange {
  min: number
  max: number
}

export interface AnimalHousePricingProps {
  /** Vises i forespørselen/kurven. */
  type: string
  basePrice: number
  width: DimRange
  depth: DimRange
  height: DimRange
  /** kr per cm³ over minste volum. */
  volumeCostFactor: number
  finishPrices: { primed: number; painted: number }
  roofPrices: { felt: number }
  /** Kattehus: vis stolpehøyde-slider. */
  showPole?: boolean
  pole?: DimRange
  polePricePerCm?: number
  onConfigChange: (cfg: AnimalHouseConfig) => void
}

const Container = styled.div`
  padding: 0;
`

const SectionTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  margin: 1.25rem 0 0.5rem 0;

  &:first-child {
    margin-top: 0;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  margin-bottom: 1rem;
`

const ButtonGroupBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 0.45rem 0.3rem;
  font-size: 0.72rem;
  border: none;
  background: ${({ $active }) => ($active ? '#333' : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#555')};
  cursor: pointer;
  transition: all 0.15s;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  white-space: nowrap;

  &:not(:last-child) {
    border-right: 1px solid #e0e0e0;
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#333' : '#f5f5f5')};
  }
`

const SliderGroup = styled.div`
  margin-bottom: 0.75rem;
`

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 0.25rem;
`

const SliderValue = styled.span`
  font-weight: 600;
  font-size: 0.78rem;
`

const StyledSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  appearance: none;
  cursor: pointer;
  touch-action: none;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.textDark};
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.textDark};
    cursor: pointer;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: 8px;

    &::-webkit-slider-thumb {
      width: 30px;
      height: 30px;
      border-width: 3px;
    }

    &::-moz-range-thumb {
      width: 30px;
      height: 30px;
      border-width: 3px;
    }
  }
`

const VolumeDisplay = styled.div`
  text-align: center;
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.25rem;
`

const PriceSection = styled.div`
  margin-top: 1.5rem;
  border: 3px solid ${({ theme }) => theme.colors.textDark};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 1rem;
  text-align: center;
`

const PriceTotalLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: #888;
  margin-bottom: 0.15rem;
`

const PriceTotal = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
`

const AddToBasketButton = styled.button`
  width: 100%;
  padding: 0.85rem 1rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`

const Note = styled.p`
  font-size: 0.65rem;
  color: #999;
  text-align: center;
  margin-top: 0.75rem;
  margin-bottom: 0;
`

const Toast = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%) translateY(${({ $visible }) => ($visible ? '0' : '20px')});
  background: ${({ theme }) => theme.colors.success};
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: ${({ theme }) => theme.zIndex.modal};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.3s, transform 0.3s;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`

const FINISH_LABEL: Record<Finish, string> = {
  natural: 'Ubehandlet',
  primed: 'Grunnet',
  painted: 'Grunnet og malt',
}

const ROOF_LABEL: Record<Roof, string> = {
  panel: 'Panel',
  felt: 'Takpapp',
}

export default function AnimalHousePriceCalculator(props: AnimalHousePricingProps) {
  const {
    type, basePrice, width: wR, depth: dR, height: hR,
    volumeCostFactor, finishPrices, roofPrices,
    showPole, pole, polePricePerCm = 0, onConfigChange,
  } = props
  const { addItem } = useBasketContext()

  const [width, setWidth] = useState(wR.min)
  const [depth, setDepth] = useState(dR.min)
  const [height, setHeight] = useState(hR.min)
  const [finish, setFinish] = useState<Finish>('natural')
  const [roof, setRoof] = useState<Roof>('panel')
  const [poleHeight, setPoleHeight] = useState(pole?.min ?? 0)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    onConfigChange({
      width, depth, height, roof, finish, entrance: showPole ? 'hole' : 'door',
      poleHeight: showPole ? poleHeight : undefined,
    })
  }, [width, depth, height, roof, finish, poleHeight, showPole, onConfigChange])

  const baseVolume = wR.min * dR.min * hR.min
  const volumeCm3 = width * depth * height
  const additional = Math.max(0, volumeCm3 - baseVolume)
  const volumeCost = basePrice + additional * volumeCostFactor
  const finishCost = finish === 'primed' ? finishPrices.primed : finish === 'painted' ? finishPrices.painted : 0
  const roofCost = roof === 'felt' ? roofPrices.felt : 0
  const poleCost = showPole && pole ? (poleHeight - pole.min) * polePricePerCm : 0
  const totalPrice = Math.round(volumeCost + finishCost + roofCost + poleCost)

  const formatPrice = (price: number) => price.toLocaleString('nb-NO') + ',-'

  const handleAddToBasket = () => {
    addItem({
      type,
      dimensions: { width, height, depth },
      finish: FINISH_LABEL[finish],
      roof: ROOF_LABEL[roof],
      ...(showPole ? { size: `Stolpehøyde ${poleHeight} cm` } : {}),
      delivery: 'Nei',
      price: formatPrice(totalPrice),
    })
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  return (
    <Container>
      <SectionTitle>Innvendig mål</SectionTitle>
      <SliderGroup>
        <SliderLabel><span>Bredde</span><SliderValue>{width} cm</SliderValue></SliderLabel>
        <StyledSlider type="range" min={wR.min} max={wR.max} step={1} value={width}
          onChange={(e) => setWidth(parseInt(e.target.value, 10))} />
      </SliderGroup>
      <SliderGroup>
        <SliderLabel><span>Dybde</span><SliderValue>{depth} cm</SliderValue></SliderLabel>
        <StyledSlider type="range" min={dR.min} max={dR.max} step={1} value={depth}
          onChange={(e) => setDepth(parseInt(e.target.value, 10))} />
      </SliderGroup>
      <SliderGroup>
        <SliderLabel><span>Høyde</span><SliderValue>{height} cm</SliderValue></SliderLabel>
        <StyledSlider type="range" min={hR.min} max={hR.max} step={1} value={height}
          onChange={(e) => setHeight(parseInt(e.target.value, 10))} />
      </SliderGroup>
      <VolumeDisplay>Volum: {(volumeCm3 / 1000000).toFixed(3)} m³</VolumeDisplay>

      {showPole && pole && (
        <>
          <SectionTitle>Stolpehøyde</SectionTitle>
          <SliderGroup>
            <SliderLabel><span>Høyde til gulv</span><SliderValue>{poleHeight} cm</SliderValue></SliderLabel>
            <StyledSlider type="range" min={pole.min} max={pole.max} step={1} value={poleHeight}
              onChange={(e) => setPoleHeight(parseInt(e.target.value, 10))} />
          </SliderGroup>
        </>
      )}

      <SectionTitle>Overflatebehandling</SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={finish === 'natural'} onClick={() => setFinish('natural')}>Ubehandlet</ButtonGroupBtn>
        <ButtonGroupBtn $active={finish === 'primed'} onClick={() => setFinish('primed')}>Grunnet</ButtonGroupBtn>
        <ButtonGroupBtn $active={finish === 'painted'} onClick={() => setFinish('painted')}>Grunnet og malt</ButtonGroupBtn>
      </ButtonGroup>

      <SectionTitle>Taktype</SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={roof === 'panel'} onClick={() => setRoof('panel')}>Panel</ButtonGroupBtn>
        <ButtonGroupBtn $active={roof === 'felt'} onClick={() => setRoof('felt')}>Takpapp</ButtonGroupBtn>
      </ButtonGroup>

      <PriceSection>
        <PriceTotalLabel>Estimert pris</PriceTotalLabel>
        <PriceTotal>{formatPrice(totalPrice)}</PriceTotal>
      </PriceSection>

      <AddToBasketButton onClick={handleAddToBasket}>
        <Icon name="faPaperPlane" />
        Legg til i forespørsel
      </AddToBasketButton>

      <Note>* Dette er et estimat. Kontakt oss for eksakt tilbud.</Note>

      <Toast $visible={showToast}>
        <Icon name="faCheck" />
        Lagt til i forespørselen!
      </Toast>
    </Container>
  )
}
