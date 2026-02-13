import { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { useBasketContext } from '../../../context/BasketContext'

interface PriceCalculatorProps {
  basePrice: number
  onDimensionsChange: (dims: {
    width: number
    height: number
    depth: number
    angle: number
    mounting: 'wall' | 'freestanding'
    finish: string
    roof: string
  }) => void
}

const VAT_PERCENTAGE = 0
const LILLEHAMMER_LAT = 61.1153
const LILLEHAMMER_LON = 10.4662

// ── Styled components ──────────────────────────────────────────────

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
  background: ${({ $active }) => $active ? '#333' : '#fff'};
  color: ${({ $active }) => $active ? '#fff' : '#555'};
  cursor: pointer;
  transition: all 0.15s;
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  white-space: nowrap;

  &:not(:last-child) {
    border-right: 1px solid #e0e0e0;
  }

  &:hover {
    background: ${({ $active }) => $active ? '#333' : '#f5f5f5'};
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

const VolumeDisplay = styled.div`
  text-align: center;
  font-size: 0.75rem;
  color: #888;
  margin-top: 0.25rem;
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
      case 'info':
        return '#888'
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

const PriceTotal = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
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

// ── Component ──────────────────────────────────────────────────────

export default function PriceCalculator({ basePrice, onDimensionsChange }: PriceCalculatorProps) {
  const { addItem } = useBasketContext()

  // Form state
  const [mounting, setMounting] = useState<'wall' | 'freestanding'>('wall')
  const [angle, setAngle] = useState(22)
  const [width, setWidth] = useState(70)
  const [height, setHeight] = useState(50)
  const [depth, setDepth] = useState(40)
  const [finish, setFinish] = useState('0')
  const [roofType, setRoofType] = useState('0')
  const [quality, setQuality] = useState('0')
  const [deliveryChecked, setDeliveryChecked] = useState(false)
  const [installationChecked, setInstallationChecked] = useState(false)
  const [distance, setDistance] = useState(0)
  const [location, setLocation] = useState('')
  const [locationStatus, setLocationStatus] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Notify parent of dimension/option changes
  useEffect(() => {
    onDimensionsChange({
      width,
      height,
      depth,
      angle,
      mounting,
      finish,
      roof: roofType,
    })
  }, [width, height, depth, angle, mounting, finish, roofType, onDimensionsChange])

  // Price calculation
  const baseVolume = 70 * 50 * 40
  const volumeCm3 = width * depth * height
  const additionalVolume = Math.max(0, volumeCm3 - baseVolume)
  let volumeCost = basePrice + additionalVolume * 0.0065
  if (mounting === 'freestanding') volumeCost *= 1.25
  const finishCost = parseInt(finish, 10)
  const roofCost = parseInt(roofType, 10)
  const qualityCost = quality === 'volume' ? volumeCm3 * 0.0022 : 0
  const deliveryCost = deliveryChecked ? distance * 15 * 2 : 0
  const installationCost = installationChecked ? 1000 : 0

  const priceExclVat = Math.round(
    volumeCost + finishCost + roofCost + qualityCost + deliveryCost + installationCost,
  )
  const vatAmount = Math.round(priceExclVat * (VAT_PERCENTAGE / 100))
  const totalPrice = priceExclVat + vatAmount

  const formatPrice = (price: number) => price.toLocaleString('nb-NO') + ',-'

  // Geocoding with debounce
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

      // Try driving distance with OSRM
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
          // Fallback to straight-line distance
          const straightLine = haversineDistance(
            LILLEHAMMER_LAT,
            LILLEHAMMER_LON,
            toLat,
            toLon,
          )
          const estimated = Math.round(straightLine * 1.3)
          setDistance(estimated)
          setLocationStatus({
            type: 'warning',
            message: `Estimert avstand (luftlinje × 1.3): ${estimated} km`,
          })
        }
      } catch {
        // Fallback to straight-line distance
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

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      geocodeLocation(value)
    }, 1000)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleAddToBasket = () => {
    addItem({
      type: 'Varmepumpehus',
      dimensions: { width, height, depth },
      mounting,
      angle: String(angle),
      finish: finishLabel(finish),
      roof: roofLabel(roofType),
      quality: qualityLabel(quality),
      delivery: deliveryChecked ? `${distance} km` : 'Nei',
      installation: installationChecked ? 'Ja' : 'Nei',
      price: formatPrice(totalPrice),
    })

    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <CalculatorContainer>
      {/* Mounting type */}
      <SectionTitle>
        Monteringstype
        <TooltipWrapper>
          <Icon name="faInfoCircle" />
          <TooltipContent>
            Vegghengt festes mot vegg. Frittstående har 4 vegger og koster 25% mer.
          </TooltipContent>
        </TooltipWrapper>
      </SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={mounting === 'wall'} onClick={() => setMounting('wall')}>Vegghengt</ButtonGroupBtn>
        <ButtonGroupBtn $active={mounting === 'freestanding'} onClick={() => setMounting('freestanding')}>Frittstående (+25%)</ButtonGroupBtn>
      </ButtonGroup>

      {/* Roof angle */}
      <SectionTitle>Takvinkel</SectionTitle>
      <SliderGroup>
        <SliderLabel>
          <span>Vinkel</span>
          <SliderValue>{angle}°</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={0}
          max={45}
          step={1}
          value={angle}
          onChange={(e) => setAngle(parseInt(e.target.value, 10))}
        />
      </SliderGroup>

      {/* Dimensions */}
      <SectionTitle>Innvendig mål</SectionTitle>
      <SliderGroup>
        <SliderLabel>
          <span>Bredde</span>
          <SliderValue>{width} cm</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={70}
          max={200}
          step={1}
          value={width}
          onChange={(e) => setWidth(parseInt(e.target.value, 10))}
        />
      </SliderGroup>
      <SliderGroup>
        <SliderLabel>
          <span>Høyde</span>
          <SliderValue>{height} cm</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={50}
          max={200}
          step={1}
          value={height}
          onChange={(e) => setHeight(parseInt(e.target.value, 10))}
        />
      </SliderGroup>
      <SliderGroup>
        <SliderLabel>
          <span>Dybde</span>
          <SliderValue>{depth} cm</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={40}
          max={150}
          step={1}
          value={depth}
          onChange={(e) => setDepth(parseInt(e.target.value, 10))}
        />
      </SliderGroup>
      <VolumeDisplay>
        Volum: {(volumeCm3 / 1000000).toFixed(3)} m³
      </VolumeDisplay>

      {/* Surface finish */}
      <SectionTitle>Overflatebehandling</SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={finish === '0'} onClick={() => setFinish('0')}>Ubehandlet</ButtonGroupBtn>
        <ButtonGroupBtn $active={finish === '800'} onClick={() => setFinish('800')}>Grunnet</ButtonGroupBtn>
        <ButtonGroupBtn $active={finish === '1500'} onClick={() => setFinish('1500')}>Grunnet og malt</ButtonGroupBtn>
      </ButtonGroup>

      {/* Roof type */}
      <SectionTitle>Taktype</SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={roofType === '0'} onClick={() => setRoofType('0')}>Panel</ButtonGroupBtn>
        <ButtonGroupBtn $active={roofType === '300'} onClick={() => setRoofType('300')}>Takpapp</ButtonGroupBtn>
        <ButtonGroupBtn $active={roofType === '500'} onClick={() => setRoofType('500')}>Impregnert</ButtonGroupBtn>
      </ButtonGroup>

      {/* Quality */}
      <SectionTitle>
        Kvalitet
        <TooltipWrapper>
          <Icon name="faInfoCircle" />
          <TooltipContent>
            Forsterket utførelse bruker tykkere materialer. Pris avhenger av størrelse.
          </TooltipContent>
        </TooltipWrapper>
      </SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={quality === '0'} onClick={() => setQuality('0')}>Standard</ButtonGroupBtn>
        <ButtonGroupBtn $active={quality === 'volume'} onClick={() => setQuality('volume')}>Forsterket</ButtonGroupBtn>
      </ButtonGroup>

      {/* Additional services */}
      <SectionTitle>Tilleggstjenester</SectionTitle>

      <CheckboxBox $checked={deliveryChecked}>
        <HiddenCheckbox
          type="checkbox"
          checked={deliveryChecked}
          onChange={(e) => setDeliveryChecked(e.target.checked)}
        />
        <CheckMark $checked={deliveryChecked}>
          {deliveryChecked && <Icon name="faCheck" />}
        </CheckMark>
        Levering
      </CheckboxBox>

      {deliveryChecked && (
        <DeliveryDetails>
          <InputGroup>
            <InputLabel>Sted / postnummer</InputLabel>
            <InputWrapper>
              <SearchIcon>
                {isSearching ? (
                  <Icon name="faSpinner" spin />
                ) : (
                  <Icon name="faSearch" />
                )}
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

      <CheckboxBox $checked={installationChecked}>
        <HiddenCheckbox
          type="checkbox"
          checked={installationChecked}
          onChange={(e) => setInstallationChecked(e.target.checked)}
        />
        <CheckMark $checked={installationChecked}>
          {installationChecked && <Icon name="faCheck" />}
        </CheckMark>
        Montering (+1000,-)
      </CheckboxBox>

      {/* Price display */}
      <PriceSection>
        <PriceRow>
          <span>Pris eks. mva</span>
          <span>{formatPrice(priceExclVat)}</span>
        </PriceRow>
        <PriceRow>
          <span>MVA ({VAT_PERCENTAGE}%)</span>
          <span>{formatPrice(vatAmount)}</span>
        </PriceRow>
        <PriceTotalLabel>Estimert pris inkl. mva</PriceTotalLabel>
        <PriceTotal>{formatPrice(totalPrice)}</PriceTotal>
      </PriceSection>

      {/* Add to basket */}
      <AddToBasketButton onClick={handleAddToBasket}>
        <Icon name="faPaperPlane" />
        Legg til i forespørsel
      </AddToBasketButton>

      <Note>* Dette er et estimat. Kontakt oss for eksakt tilbud.</Note>

      {/* Toast notification */}
      <Toast $visible={showToast}>
        <Icon name="faCheck" />
        Lagt til i forespørselen!
      </Toast>
    </CalculatorContainer>
  )
}

// ── Helper functions ───────────────────────────────────────────────

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
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

function finishLabel(value: string): string {
  switch (value) {
    case '800':
      return 'Grunnet'
    case '1500':
      return 'Grunnet og malt'
    default:
      return 'Ubehandlet'
  }
}

function roofLabel(value: string): string {
  switch (value) {
    case '300':
      return 'Takpapp'
    case '500':
      return 'Impregnert tak'
    default:
      return 'Panel tak'
  }
}

function qualityLabel(value: string): string {
  switch (value) {
    case 'volume':
      return 'Forsterket utførelse'
    default:
      return 'Standard utførelse'
  }
}
