import { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { useBasketContext } from '../../../context/BasketContext'

interface PlantekasseConfig {
  width: number
  height: number
  depth: number
  construction: string
  finish: string
}

interface PlantekassePriceCalculatorProps {
  basePrice: number
  config?: PlantekasseConfig
  onConfigChange?: (config: PlantekasseConfig) => void
}

const VAT_PERCENTAGE = 0
const LILLEHAMMER_LAT = 61.1153
const LILLEHAMMER_LON = 10.4662
const MIN_VOLUME = 30 * 30 * 30
const VOLUME_COEFFICIENT = 0.022
const REGULAR_MULTIPLIER = 10 / 7

const CalculatorContainer = styled.div`
  padding: 0;
`

const SectionTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  margin: 1.25rem 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  &:first-child {
    margin-top: 0;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
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
`

const CheckboxBox = styled.label<{ $checked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border: 2px solid ${({ $checked, theme }) => ($checked ? theme.colors.textDark : '#e0e0e0')};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textDark};
  transition: border-color ${({ theme }) => theme.transitions.default};
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const HiddenCheckbox = styled.input`
  display: none;
`

const CheckMark = styled.span<{ $checked: boolean }>`
  width: 18px;
  height: 18px;
  border: 2px solid ${({ $checked, theme }) => ($checked ? theme.colors.textDark : '#ccc')};
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $checked, theme }) => ($checked ? theme.colors.textDark : '#fff')};
  color: #fff;
  font-size: 0.6rem;
  transition: all ${({ theme }) => theme.transitions.default};
`

const DeliveryDetails = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  border: 1px solid #e8e8e8;
`

const InputGroup = styled.div`
  margin-bottom: 0.6rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const InputLabel = styled.label`
  display: block;
  font-size: 0.72rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 0.25rem;
`

const InputWrapper = styled.div`
  position: relative;
`

const SearchIcon = styled.span`
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 0.75rem;
  pointer-events: none;
`

const StyledInput = styled.input<{ $hasIcon?: boolean }>`
  width: 100%;
  padding: 0.45rem 0.6rem;
  padding-left: ${({ $hasIcon }) => ($hasIcon ? '1.8rem' : '0.6rem')};
  border: 2px solid #e0e0e0;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.textDark};
  transition: border-color ${({ theme }) => theme.transitions.default};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.textDark};
  }
`

const InputNote = styled.div`
  font-size: 0.65rem;
  color: #999;
  margin-top: 0.2rem;
`

const StatusMessage = styled.div<{ $type?: 'success' | 'error' | 'warning' | 'info' }>`
  font-size: 0.7rem;
  margin-top: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: ${({ $type }) => {
    switch ($type) {
      case 'success':
        return '#4caf50'
      case 'error':
        return '#f44336'
      case 'warning':
        return '#ff9800'
      default:
        return '#888'
    }
  }};
`

const WarningBox = styled.div`
  margin-top: 0.4rem;
  padding: 0.4rem 0.6rem;
  background: #fff3e0;
  border: 1px solid #ffcc80;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.7rem;
  color: #e65100;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`

const PriceSection = styled.div`
  margin-top: 1.5rem;
  border: 3px solid ${({ theme }) => theme.colors.textDark};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 1rem;
  text-align: center;
`

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 0.3rem;
`

const RegularPriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #999;
  text-decoration: line-through;
  margin-bottom: 0.3rem;
`

const CampaignBadge = styled.span`
  display: inline-block;
  background: #c83030;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
`

const PriceTotal = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
`

const QuantityRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  border: 2px solid #e0e0e0;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  overflow: hidden;
`

const QuantityBtn = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background ${({ theme }) => theme.transitions.default};

  &:hover:not(:disabled) {
    background: #f5f5f5;
  }

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
  }
`

const QuantityValue = styled.div`
  min-width: 36px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textDark};
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
  padding: 0 0.5rem;
  line-height: 36px;
`

const PriceTotalLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: #888;
  margin-bottom: 0.15rem;
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
  transition: transform ${({ theme }) => theme.transitions.default},
    box-shadow ${({ theme }) => theme.transitions.default};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`

const Note = styled.p`
  font-size: 0.65rem;
  color: #999;
  text-align: center;
  margin-top: 0.75rem;
  margin-bottom: 0;
`

const TooltipWrapper = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: help;
  color: #aaa;
  font-size: 0.75rem;

  &:hover > div {
    opacity: 1;
    visibility: visible;
  }
`

const TooltipContent = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  padding: 0.5rem 0.65rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.68rem;
  font-weight: 400;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 10;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: ${({ theme }) => theme.colors.textDark};
  }
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

export default function PlantekassePriceCalculator({
  basePrice,
  config,
  onConfigChange,
}: PlantekassePriceCalculatorProps) {
  const { addItem } = useBasketContext()

  const [width, setWidth] = useState(60)
  const [depth, setDepth] = useState(40)
  const [height, setHeight] = useState(40)
  const [construction, setConstruction] = useState('whitewood')
  const [finish, setFinish] = useState('0')
  const [quantity, setQuantity] = useState(1)
  const [deliveryChecked, setDeliveryChecked] = useState(false)
  const [distance, setDistance] = useState(0)
  const [location, setLocation] = useState('')
  const [locationStatus, setLocationStatus] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncingFromParent = useRef(false)

  useEffect(() => {
    if (!config) return
    syncingFromParent.current = true
    setWidth((prev) => (prev !== config.width ? config.width : prev))
    setHeight((prev) => (prev !== config.height ? config.height : prev))
    setDepth((prev) => (prev !== config.depth ? config.depth : prev))
    setConstruction((prev) => (prev !== config.construction ? config.construction : prev))
    setFinish((prev) => (prev !== config.finish ? config.finish : prev))
    queueMicrotask(() => {
      syncingFromParent.current = false
    })
  }, [config])

  useEffect(() => {
    if (syncingFromParent.current) return
    onConfigChange?.({ width, height, depth, construction, finish })
  }, [width, height, depth, construction, finish, onConfigChange])

  const volumeCm3 = width * depth * height
  const additionalVolume = Math.max(0, volumeCm3 - MIN_VOLUME)
  const volumeCost = basePrice + additionalVolume * VOLUME_COEFFICIENT
  const finishCost = parseInt(finish, 10)
  const deliveryCost = deliveryChecked ? distance * 15 * 2 : 0

  const subtotal = volumeCost + finishCost + deliveryCost
  const constructionMultiplier = construction === 'impregnated' ? 1.2 : 1
  const priceExclVat = Math.round(subtotal * constructionMultiplier)
  const regularPriceExclVat = Math.round(priceExclVat * REGULAR_MULTIPLIER)
  const vatAmount = Math.round(priceExclVat * (VAT_PERCENTAGE / 100))
  const totalPrice = priceExclVat + vatAmount

  const formatPrice = (price: number) => price.toLocaleString('nb-NO') + ',-'

  const geocodeLocation = useCallback(async (query: string) => {
    if (!query.trim()) {
      setLocationStatus(null)
      return
    }

    setIsSearching(true)
    setLocationStatus({ type: 'info', message: 'Søker...' })

    try {
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},Norway&format=json&limit=1`
      const geoRes = await fetch(geoUrl)
      const geoData = await geoRes.json()

      if (!geoData || geoData.length === 0) {
        setLocationStatus({ type: 'error', message: 'Fant ikke stedet. Prøv et annet søkeord.' })
        setIsSearching(false)
        return
      }

      const toLat = parseFloat(geoData[0].lat)
      const toLon = parseFloat(geoData[0].lon)

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${LILLEHAMMER_LON},${LILLEHAMMER_LAT};${toLon},${toLat}?overview=false`
        const osrmRes = await fetch(osrmUrl)
        const osrmData = await osrmRes.json()

        if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
          const distKm = Math.round(osrmData.routes[0].distance / 1000)
          setDistance(distKm)
          setLocationStatus({
            type: 'success',
            message: `Fant ${geoData[0].display_name.split(',')[0]} — ${distKm} km fra Lillehammer`,
          })
        } else {
          const straightLine = haversineDistance(LILLEHAMMER_LAT, LILLEHAMMER_LON, toLat, toLon)
          const estimated = Math.round(straightLine * 1.3)
          setDistance(estimated)
          setLocationStatus({
            type: 'warning',
            message: `Estimert avstand (luftlinje × 1.3): ${estimated} km`,
          })
        }
      } catch {
        const straightLine = haversineDistance(LILLEHAMMER_LAT, LILLEHAMMER_LON, toLat, toLon)
        const estimated = Math.round(straightLine * 1.3)
        setDistance(estimated)
        setLocationStatus({
          type: 'warning',
          message: `Estimert avstand (luftlinje × 1.3): ${estimated} km`,
        })
      }
    } catch {
      setLocationStatus({ type: 'error', message: 'Fant ikke stedet. Prøv et annet søkeord.' })
    }

    setIsSearching(false)
  }, [])

  const handleLocationChange = (value: string) => {
    setLocation(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => geocodeLocation(value), 1000)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleConstructionChange = (next: string) => {
    setConstruction(next)
    if (next === 'impregnated' && (finish === '800' || finish === '1500')) setFinish('0')
    if (next === 'whitewood' && finish === '1200') setFinish('0')
  }

  const handleAddToBasket = () => {
    addItem(
      {
        type: 'Plantekasse',
        dimensions: { width, height, depth },
        mounting: constructionLabel(construction),
        finish: finishLabel(finish),
        delivery: deliveryChecked ? `${distance} km` : 'Nei',
        price: formatPrice(totalPrice),
      },
      quantity,
    )
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <CalculatorContainer>
      <SectionTitle>
        Innvendige mål
        <TooltipWrapper>
          <Icon name="faInfoCircle" />
          <TooltipContent>Innvendig plass for jord og planter. Yttermål blir noe større.</TooltipContent>
        </TooltipWrapper>
      </SectionTitle>
      <SliderGroup>
        <SliderLabel>
          <span>Bredde</span>
          <SliderValue>{width} cm</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={30}
          max={200}
          step={5}
          value={width}
          onChange={(e) => setWidth(parseInt(e.target.value, 10))}
        />
      </SliderGroup>
      <SliderGroup>
        <SliderLabel>
          <span>Dybde</span>
          <SliderValue>{depth} cm</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={30}
          max={200}
          step={5}
          value={depth}
          onChange={(e) => setDepth(parseInt(e.target.value, 10))}
        />
      </SliderGroup>
      <SliderGroup>
        <SliderLabel>
          <span>Høyde</span>
          <SliderValue>{height} cm</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={30}
          max={80}
          step={5}
          value={height}
          onChange={(e) => setHeight(parseInt(e.target.value, 10))}
        />
      </SliderGroup>

      <SectionTitle>
        Treverk
        <TooltipWrapper>
          <Icon name="faInfoCircle" />
          <TooltipContent>Impregnert tre tåler jord, fukt og frost vesentlig bedre.</TooltipContent>
        </TooltipWrapper>
      </SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={construction === 'whitewood'} onClick={() => handleConstructionChange('whitewood')}>
          Trehvitt
        </ButtonGroupBtn>
        <ButtonGroupBtn $active={construction === 'impregnated'} onClick={() => handleConstructionChange('impregnated')}>
          Impregnert (+20%)
        </ButtonGroupBtn>
      </ButtonGroup>

      <SectionTitle>Overflatebehandling</SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={finish === '0'} onClick={() => setFinish('0')}>
          Ubehandlet
        </ButtonGroupBtn>
        {construction === 'whitewood' && (
          <>
            <ButtonGroupBtn $active={finish === '800'} onClick={() => setFinish('800')}>
              Grunnet
            </ButtonGroupBtn>
            <ButtonGroupBtn $active={finish === '1500'} onClick={() => setFinish('1500')}>
              Grunnet og malt
            </ButtonGroupBtn>
          </>
        )}
        {construction === 'impregnated' && (
          <ButtonGroupBtn $active={finish === '1200'} onClick={() => setFinish('1200')}>
            Beiset (+1 200,-)
          </ButtonGroupBtn>
        )}
      </ButtonGroup>

      <SectionTitle>Tilleggstjenester</SectionTitle>
      <CheckboxBox $checked={deliveryChecked}>
        <HiddenCheckbox
          type="checkbox"
          checked={deliveryChecked}
          onChange={(e) => setDeliveryChecked(e.target.checked)}
        />
        <CheckMark $checked={deliveryChecked}>{deliveryChecked && <Icon name="faCheck" />}</CheckMark>
        Levering
      </CheckboxBox>

      {deliveryChecked && (
        <DeliveryDetails>
          <InputGroup>
            <InputLabel>Sted / postnummer</InputLabel>
            <InputWrapper>
              <SearchIcon>
                {isSearching ? <Icon name="faSpinner" spin /> : <Icon name="faSearch" />}
              </SearchIcon>
              <StyledInput
                $hasIcon
                type="text"
                placeholder="Søk etter sted..."
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
              />
            </InputWrapper>
            {locationStatus && (
              <StatusMessage $type={locationStatus.type}>
                {locationStatus.type === 'success' && <Icon name="faCheck" />}
                {locationStatus.type === 'error' && <Icon name="faTimesCircle" />}
                {locationStatus.type === 'warning' && <Icon name="faExclamationTriangle" />}
                {locationStatus.type === 'info' && <Icon name="faSpinner" spin />}
                {locationStatus.message}
              </StatusMessage>
            )}
          </InputGroup>

          <InputGroup>
            <InputLabel>Avstand fra Lillehammer (km)</InputLabel>
            <StyledInput
              type="number"
              min={0}
              max={200}
              value={distance}
              onChange={(e) => setDistance(Math.max(0, parseInt(e.target.value, 10) || 0))}
            />
            <InputNote>15 kr per km &times; 2 (tur/retur) &bull; Maks 200 km</InputNote>
          </InputGroup>

          {distance > 200 && (
            <WarningBox>
              <Icon name="faExclamationTriangle" />
              Avstanden overstiger 200 km. Kontakt oss for leveringspris.
            </WarningBox>
          )}
        </DeliveryDetails>
      )}

      <SectionTitle>Antall</SectionTitle>
      <QuantityRow>
        <QuantityControls>
          <QuantityBtn
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Reduser antall"
          >
            <Icon name="faMinus" />
          </QuantityBtn>
          <QuantityValue>{quantity}</QuantityValue>
          <QuantityBtn
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Øk antall"
          >
            <Icon name="faPlus" />
          </QuantityBtn>
        </QuantityControls>
      </QuantityRow>

      <PriceSection>
        <CampaignBadge>Kampanje – 30%</CampaignBadge>
        <RegularPriceRow>
          <span>Ordinær pris per stk</span>
          <span>{formatPrice(regularPriceExclVat)}</span>
        </RegularPriceRow>
        <PriceRow>
          <span>Pris eks. mva per stk</span>
          <span>{formatPrice(priceExclVat)}</span>
        </PriceRow>
        <PriceRow>
          <span>MVA ({VAT_PERCENTAGE}%)</span>
          <span>{formatPrice(vatAmount)}</span>
        </PriceRow>
        {quantity > 1 && (
          <PriceRow>
            <span>Antall</span>
            <span>× {quantity}</span>
          </PriceRow>
        )}
        <PriceTotalLabel>Estimert pris inkl. mva</PriceTotalLabel>
        <PriceTotal>{formatPrice(totalPrice * quantity)}</PriceTotal>
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
    </CalculatorContainer>
  )
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function constructionLabel(value: string): string {
  return value === 'impregnated' ? 'Impregnert tre' : 'Trehvitt'
}

function finishLabel(value: string): string {
  switch (value) {
    case '800':
      return 'Grunnet'
    case '1500':
      return 'Grunnet og malt'
    case '1200':
      return 'Beiset'
    default:
      return 'Ubehandlet'
  }
}
