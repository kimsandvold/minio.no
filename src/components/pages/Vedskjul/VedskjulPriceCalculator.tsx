import { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { useBasketContext } from '../../../context/BasketContext'
import SignDesignerModal from '../SignDesigner/SignDesignerModal'

interface VedskjulPriceCalculatorProps {
  basePrice: number
  onConfigChange?: (config: {
    width: number
    height: number
    depth: number
    sectionCount: number
    finish: string
    roof: string
    roofShape: string
    roofDegree: number
    roofSlopeDirection: string
    hasDoor: boolean
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

const SignDetails = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  border: 1px solid #e8e8e8;
`

const SignSizeRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`

const SignSizeField = styled.div`
  flex: 1;
`

const SignNote = styled.div`
  font-size: 0.68rem;
  color: #e65100;
  background: #fff3e0;
  padding: 0.4rem 0.6rem;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  border: 1px solid #ffcc80;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`

const DesignerLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: 1px dashed #aaa;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  padding: 0.4rem 0.65rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textDark};
  cursor: pointer;
  margin-top: 0.5rem;
  transition: all ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: ${({ theme }) => theme.colors.textDark};
    background: #f5f5f5;
  }
`

// ── Section presets ─────────────────────────────────────────────────

const SECTION_PRESETS: Record<number, { width: number; depth: number; height: number }> = {
  1: { width: 300, depth: 150, height: 200 },
  2: { width: 300, depth: 150, height: 200 },
}

// ── Component ──────────────────────────────────────────────────────

export default function VedskjulPriceCalculator({ basePrice, onConfigChange }: VedskjulPriceCalculatorProps) {
  const { addItem } = useBasketContext()

  // Form state
  const [sectionCount, setSectionCount] = useState(1)
  const [width, setWidth] = useState(SECTION_PRESETS[1].width)
  const [height, setHeight] = useState(SECTION_PRESETS[1].height)
  const [depth, setDepth] = useState(SECTION_PRESETS[1].depth)
  const [finish, setFinish] = useState('0')
  const [roofType, setRoofType] = useState('0')
  const [roofShape, setRoofShape] = useState('flat')
  const [roofDegree, setRoofDegree] = useState(15)
  const [roofSlopeDirection, setRoofSlopeDirection] = useState('back')
  const [hasDoor, setHasDoor] = useState(false)
  const [construction, setConstruction] = useState('whitewood')
  const [quality, setQuality] = useState('0')
  const [deliveryChecked, setDeliveryChecked] = useState(false)
  const [installationChecked, setInstallationChecked] = useState(false)
  const [lightingChecked, setLightingChecked] = useState(false)
  const [signChecked, setSignChecked] = useState(false)
  const [signWidth, setSignWidth] = useState(30)
  const [signHeight, setSignHeight] = useState(15)
  const [showDesigner, setShowDesigner] = useState(false)
  const [signDesignId, setSignDesignId] = useState<string | null>(null)
  const [distance, setDistance] = useState(0)
  const [location, setLocation] = useState('')
  const [locationStatus, setLocationStatus] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // When section dropdown changes, update all dimensions from preset
  const handleSectionCountChange = useCallback((count: number) => {
    setSectionCount(count)
    const preset = SECTION_PRESETS[count]
    setWidth(preset.width)
    setHeight(preset.height)
    setDepth(preset.depth)
  }, [])

  // When width changes manually
  const handleWidthChange = useCallback((w: number) => {
    setWidth(w)
  }, [])

  // Notify parent of config changes
  useEffect(() => {
    onConfigChange?.({ width, height, depth, sectionCount, finish, roof: roofType, roofShape, roofDegree, roofSlopeDirection, hasDoor })
  }, [width, height, depth, sectionCount, finish, roofType, roofShape, roofDegree, roofSlopeDirection, hasDoor, onConfigChange])

  // Price calculation – per-cm cost increase beyond base dimensions
  const BASE_WIDTH = 200
  const BASE_DEPTH = 100
  const BASE_HEIGHT = 200
  const WIDTH_PER_CM = 3000 / BASE_WIDTH
  const DEPTH_PER_CM = 3000 / BASE_DEPTH
  const HEIGHT_PER_CM = 3000 / BASE_HEIGHT
  const extraWidthCost = Math.max(0, width - BASE_WIDTH) * WIDTH_PER_CM
  const extraDepthCost = Math.max(0, depth - BASE_DEPTH) * DEPTH_PER_CM
  const extraHeightCost = Math.max(0, height - BASE_HEIGHT) * HEIGHT_PER_CM
  const volumeCm3 = width * depth * height
  const volumeCost = basePrice + extraWidthCost + extraDepthCost + extraHeightCost

  const finishCost = parseInt(finish, 10)
  const roofCost = parseInt(roofType, 10)
  const qualityCost = quality === 'volume' ? volumeCm3 * 0.0015 : 0
  const deliveryCost = deliveryChecked ? distance * 15 * 2 : 0
  const installationCost = installationChecked ? 8000 : 0
  const doorCost = (sectionCount === 2 && hasDoor) ? 2500 : 0
  const lightingCost = lightingChecked ? 5000 : 0

  const sectionMultiplier = sectionCount === 2 ? 1.2 : 1
  const subtotal = (volumeCost * sectionMultiplier) + finishCost + roofCost + qualityCost + deliveryCost + installationCost + doorCost + lightingCost
  const constructionMultiplier = construction === 'impregnated' ? 1.2 : 1
  const priceExclVat = Math.round(subtotal * constructionMultiplier)
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

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      geocodeLocation(value)
    }, 1000)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleAddToBasket = () => {
    addItem({
      type: 'Vedskjul',
      dimensions: { width, height, depth },
      mounting: constructionLabel(construction),
      finish: finishLabel(finish),
      roof: `${roofLabel(roofType)}, ${roofShapeLabel(roofShape)}, ${roofDegree}%${roofShape === 'flat' ? ` (${roofSlopeDirection === 'front' ? 'fall mot front' : 'fall mot bak'})` : ''}`,
      quality: qualityLabel(quality),
      delivery: deliveryChecked ? `${distance} km` : 'Nei',
      installation: installationChecked ? 'Ja' : 'Nei',
      lighting: lightingChecked ? 'Ja (2 lyskilder med skumringsrelé)' : 'Nei',
      size: sectionCount === 1 ? '1 seksjon (vedskjul)' : '2 seksjoner (vedskjul + redskapsbod)',
      complexity: sectionCount === 2 ? `Redskapsbod${hasDoor ? ' med dør' : ' uten dør'}` : undefined,
      price: formatPrice(totalPrice),
      signRequested: signChecked,
      signWidthCm: signChecked ? signWidth : undefined,
      signHeightCm: signChecked ? signHeight : undefined,
      signDesignId: signChecked && signDesignId ? signDesignId : undefined,
    })

    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <CalculatorContainer>
      {/* Section count */}
      <SectionTitle>
        Antall seksjoner
        <TooltipWrapper>
          <Icon name="faInfoCircle" />
          <TooltipContent>
            Velg hvor mange seksjoner vedskjulet skal ha. Målene justeres automatisk.
          </TooltipContent>
        </TooltipWrapper>
      </SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={sectionCount === 1} onClick={() => handleSectionCountChange(1)}>1 seksjon</ButtonGroupBtn>
        <ButtonGroupBtn $active={sectionCount === 2} onClick={() => handleSectionCountChange(2)}>2 seksjoner</ButtonGroupBtn>
      </ButtonGroup>

      {/* Door option for redskapsbod */}
      {sectionCount === 2 && (
        <CheckboxBox $checked={hasDoor}>
          <HiddenCheckbox
            type="checkbox"
            checked={hasDoor}
            onChange={(e) => setHasDoor(e.target.checked)}
          />
          <CheckMark $checked={hasDoor}>
            {hasDoor && <Icon name="faCheck" />}
          </CheckMark>
          Dør på redskapsbod (+2 500,-)
        </CheckboxBox>
      )}

      {/* Dimensions */}
      <SectionTitle>
        Innvendig mål
        <TooltipWrapper>
          <Icon name="faInfoCircle" />
          <TooltipContent>
            Målene er forhåndsinnstilt basert på antall seksjoner, men kan justeres.
          </TooltipContent>
        </TooltipWrapper>
      </SectionTitle>
      <SliderGroup>
        <SliderLabel>
          <span>Bredde</span>
          <SliderValue>{width} cm</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={200}
          max={400}
          step={5}
          value={width}
          onChange={(e) => handleWidthChange(parseInt(e.target.value, 10))}
        />
      </SliderGroup>
      <SliderGroup>
        <SliderLabel>
          <span>Høyde</span>
          <SliderValue>{height} cm</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={150}
          max={250}
          step={5}
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
          min={100}
          max={300}
          step={5}
          value={depth}
          onChange={(e) => setDepth(parseInt(e.target.value, 10))}
        />
      </SliderGroup>

      {/* Construction material */}
      <SectionTitle>
        Konstruksjon
        <TooltipWrapper>
          <Icon name="faInfoCircle" />
          <TooltipContent>
            Impregnert tre gir bedre holdbarhet mot råte og fukt uten ekstra behandling.
          </TooltipContent>
        </TooltipWrapper>
      </SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={construction === 'whitewood'} onClick={() => setConstruction('whitewood')}>Hvittre</ButtonGroupBtn>
        <ButtonGroupBtn $active={construction === 'impregnated'} onClick={() => setConstruction('impregnated')}>Impregnert (+20%)</ButtonGroupBtn>
      </ButtonGroup>

      {/* Surface finish */}
      <SectionTitle>Overflatebehandling</SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={finish === '0'} onClick={() => setFinish('0')}>Ubehandlet</ButtonGroupBtn>
        <ButtonGroupBtn $active={finish === '2000'} onClick={() => setFinish('2000')}>Grunnet</ButtonGroupBtn>
        <ButtonGroupBtn $active={finish === '4500'} onClick={() => setFinish('4500')}>Grunnet og malt</ButtonGroupBtn>
      </ButtonGroup>

      {/* Roof shape */}
      <SectionTitle>
        Takform
        <TooltipWrapper>
          <Icon name="faInfoCircle" />
          <TooltipContent>
            Valmtak har skråning på alle sider. Flatt tak er helt plant.
          </TooltipContent>
        </TooltipWrapper>
      </SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={roofShape === 'hip'} onClick={() => setRoofShape('hip')}>Valmtak</ButtonGroupBtn>
        <ButtonGroupBtn $active={roofShape === 'flat'} onClick={() => setRoofShape('flat')}>Flatt tak</ButtonGroupBtn>
      </ButtonGroup>

      {/* Roof degree */}
      <SliderGroup>
        <SliderLabel>
          <span>Takvinkel</span>
          <SliderValue>{roofDegree}%</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={0}
          max={45}
          step={1}
          value={roofDegree}
          onChange={(e) => setRoofDegree(parseInt(e.target.value, 10))}
        />
      </SliderGroup>

      {/* Slope direction (flat roof only) */}
      {roofShape === 'flat' && (
        <>
          <SectionTitle>Takfall retning</SectionTitle>
          <ButtonGroup>
            <ButtonGroupBtn $active={roofSlopeDirection === 'back'} onClick={() => setRoofSlopeDirection('back')}>Mot baksiden</ButtonGroupBtn>
            <ButtonGroupBtn $active={roofSlopeDirection === 'front'} onClick={() => setRoofSlopeDirection('front')}>Mot fronten</ButtonGroupBtn>
          </ButtonGroup>
        </>
      )}

      {/* Roof type */}
      <SectionTitle>Taktype</SectionTitle>
      <ButtonGroup>
        <ButtonGroupBtn $active={roofType === '0'} onClick={() => setRoofType('0')}>Panel</ButtonGroupBtn>
        <ButtonGroupBtn $active={roofType === '1200'} onClick={() => setRoofType('1200')}>Takpapp</ButtonGroupBtn>
        <ButtonGroupBtn $active={roofType === '2000'} onClick={() => setRoofType('2000')}>Impregnert</ButtonGroupBtn>
      </ButtonGroup>

      {/* Quality */}
      <SectionTitle>
        Kvalitet
        <TooltipWrapper>
          <Icon name="faInfoCircle" />
          <TooltipContent>
            Forsterket utførelse bruker tykkere materialer for ekstra holdbarhet.
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
        Montering (+8 000,-)
      </CheckboxBox>

      <CheckboxBox $checked={lightingChecked}>
        <HiddenCheckbox
          type="checkbox"
          checked={lightingChecked}
          onChange={(e) => setLightingChecked(e.target.checked)}
        />
        <CheckMark $checked={lightingChecked}>
          {lightingChecked && <Icon name="faCheck" />}
        </CheckMark>
        Belysning med skumringsrelé (+5 000,-)
      </CheckboxBox>

      <CheckboxBox $checked={signChecked}>
        <HiddenCheckbox
          type="checkbox"
          checked={signChecked}
          onChange={(e) => setSignChecked(e.target.checked)}
        />
        <CheckMark $checked={signChecked}>
          {signChecked && <Icon name="faCheck" />}
        </CheckMark>
        Skilt (husnummer, adresse etc.)
      </CheckboxBox>

      {signChecked && (
        <SignDetails>
          <SignSizeRow>
            <SignSizeField>
              <InputLabel>Bredde (cm)</InputLabel>
              <StyledInput
                type="number"
                min={5}
                max={200}
                value={signWidth}
                onChange={(e) => setSignWidth(Math.max(5, parseInt(e.target.value, 10) || 5))}
              />
            </SignSizeField>
            <SignSizeField>
              <InputLabel>Høyde (cm)</InputLabel>
              <StyledInput
                type="number"
                min={5}
                max={200}
                value={signHeight}
                onChange={(e) => setSignHeight(Math.max(5, parseInt(e.target.value, 10) || 5))}
              />
            </SignSizeField>
          </SignSizeRow>
          <SignNote>
            <Icon name="faInfoCircle" />
            Pris for skilt kommer i tillegg til prisen over.
          </SignNote>
          <DesignerLink type="button" onClick={() => setShowDesigner(true)}>
            <Icon name="faPencilRuler" /> {signDesignId ? 'Endre skiltdesign' : 'Design skiltet i skiltdesigneren'}
          </DesignerLink>
          {signDesignId && (
            <SignNote style={{ color: '#4caf50' }}>
              <Icon name="faCheck" />
              Skiltdesign er koblet til bestillingen.{' '}
              <a href={`/design/${signDesignId}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1da1f2' }}>Vis design</a>
            </SignNote>
          )}
        </SignDetails>
      )}

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

      <SignDesignerModal isOpen={showDesigner} onClose={() => setShowDesigner(false)} loadDesignId={signDesignId} onDesignSaved={setSignDesignId} />
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
    case '2000':
      return 'Grunnet'
    case '4500':
      return 'Grunnet og malt'
    default:
      return 'Ubehandlet'
  }
}

function roofLabel(value: string): string {
  switch (value) {
    case '1200':
      return 'Takpapp'
    case '2000':
      return 'Impregnert tak'
    default:
      return 'Panel tak'
  }
}

function constructionLabel(value: string): string {
  switch (value) {
    case 'impregnated':
      return 'Impregnert'
    default:
      return 'Hvittre'
  }
}

function roofShapeLabel(value: string): string {
  switch (value) {
    case 'flat':
      return 'Flatt tak'
    default:
      return 'Valmtak'
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
