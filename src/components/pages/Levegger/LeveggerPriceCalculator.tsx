import { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { useBasketContext } from '../../../context/BasketContext'
import type { LeveggConfig, LeveggOrientation, LeveggType } from './ThreeVisualizer'

interface Props {
  basePrice: number
  onConfigChange?: (config: LeveggConfig) => void
}

const PRICE_PER_CM_WIDTH = 15
const PRICE_PER_CM_HEIGHT = 12
const CORNER_SHARED_DISCOUNT = 0.075
const MIN_WIDTH = 30
const MAX_WIDTH_RETT = 250
const MAX_WIDTH_HJORNNE = 250
const MIN_HEIGHT = 150
const MAX_HEIGHT = 220
const MAX_SLOTS = 3
const DELIVERY_PRICE_PER_KM = 15
const LILLEHAMMER_LAT = 61.1153
const LILLEHAMMER_LON = 10.4662

function quantityDiscount(qty: number): number {
  if (qty >= 3) return 0.08
  if (qty === 2) return 0.05
  return 0
}

const DISCOUNT_BY_COUNT: Record<number, number> = {
  1: 0,
  2: 0.05,
  3: 0.08,
}

const CalculatorContainer = styled.div`
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

const SlotIntro = styled.p`
  font-size: 0.72rem;
  color: #666;
  line-height: 1.45;
  margin: 0 0 0.6rem;
`

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
  margin-bottom: 0.5rem;
`

const SlotBox = styled.button<{ $active: boolean; $focused: boolean }>`
  position: relative;
  min-height: 86px;
  padding: 0.55rem 0.4rem 0.5rem;
  border: 2px ${({ $active }) => ($active ? 'solid' : 'dashed')}
    ${({ $focused, $active, theme }) =>
      $focused ? theme.colors.textDark : $active ? '#bdbdbd' : '#d8d8d8'};
  background: ${({ $focused, $active, theme }) =>
    $focused ? theme.colors.textDark : $active ? '#fff' : '#fafafa'};
  color: ${({ $focused, $active }) =>
    $focused ? '#fff' : $active ? '#222' : '#9a9a9a'};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  text-align: center;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.textDark};
    transform: translateY(-1px);
  }
`

const SlotNumber = styled.span`
  font-weight: 700;
  font-size: 1rem;
  line-height: 1;
`

const SlotType = styled.span`
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.9;
`

const SlotDims = styled.span`
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  opacity: 0.9;
`

const SlotPrice = styled.span`
  font-size: 0.62rem;
  font-weight: 600;
  opacity: 0.95;
`

const SlotPlaceholder = styled.span`
  font-size: 0.6rem;
  font-weight: 500;
  color: inherit;
  opacity: 0.7;
`

const SlotDiscount = styled.span<{ $focused: boolean; $active: boolean }>`
  position: absolute;
  top: 4px;
  right: 5px;
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.05rem 0.3rem;
  border-radius: 999px;
  color: ${({ $focused, $active }) =>
    $focused ? '#fff' : $active ? '#fff' : '#666'};
  background: ${({ $focused, $active }) =>
    $focused ? '#2e7d32' : $active ? '#43a047' : '#e0e0e0'};
`

const FocusBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f4f4f4;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.75rem;
  color: #444;
  margin: 0.25rem 0 0.75rem;

  strong {
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const TypeToggle = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
`

const TypeButton = styled.button<{ $active: boolean }>`
  padding: 0.6rem 0.5rem;
  border: 2px solid ${({ $active, theme }) => ($active ? theme.colors.textDark : '#e0e0e0')};
  background: ${({ $active, theme }) => ($active ? theme.colors.textDark : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#222')};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.textDark};
  }
`

const TypeHint = styled.span`
  font-size: 0.6rem;
  font-weight: 500;
  opacity: 0.75;
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
    border-radius: 4px;

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
  gap: 0.4rem;
`

const SlotPriceLabel = styled.span`
  flex: 1;
  text-align: left;
`

const SlotPriceAmount = styled.span`
  white-space: nowrap;
`

const RemoveSlotButton = styled.button`
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: #999;
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover {
    background: #fde2e1;
    color: #c0392b;
  }

  &:disabled {
    visibility: hidden;
    pointer-events: none;
  }
`

const DiscountRow = styled(PriceRow)`
  color: #2e7d32;
  font-weight: 600;
`

const PriceTotalLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
  color: #888;
  margin-bottom: 0.15rem;
`

const PriceTotal = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
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

function panelPrice(width: number, height: number, basePrice: number): number {
  const widthExtra = Math.max(0, width - MIN_WIDTH) * PRICE_PER_CM_WIDTH
  const heightExtra = Math.max(0, height - MIN_HEIGHT) * PRICE_PER_CM_HEIGHT
  return basePrice + widthExtra + heightExtra
}

function unitPriceFor(slot: LeveggConfig, basePrice: number): number {
  const panelA = panelPrice(slot.width, slot.height, basePrice)
  if (slot.type === 'rett') return Math.round(panelA)
  const panelB = panelPrice(slot.widthB, slot.height, basePrice)
  return Math.round((panelA + panelB) * (1 - CORNER_SHARED_DISCOUNT))
}

function clampWidth(width: number, type: LeveggType): number {
  const max = type === 'hjornne' ? MAX_WIDTH_HJORNNE : MAX_WIDTH_RETT
  return Math.max(MIN_WIDTH, Math.min(max, width))
}

const DEFAULT_SLOT: LeveggConfig = {
  type: 'rett',
  orientation: 'vertikal',
  width: 120,
  widthB: 120,
  height: 180,
}

export default function LeveggerPriceCalculator({ basePrice, onConfigChange }: Props) {
  const { addItem } = useBasketContext()

  const [slots, setSlots] = useState<LeveggConfig[]>(() =>
    Array.from({ length: MAX_SLOTS }, () => ({ ...DEFAULT_SLOT })),
  )
  const [count, setCount] = useState(1)
  const [focused, setFocused] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [deliveryChecked, setDeliveryChecked] = useState(false)
  const [distance, setDistance] = useState(0)
  const [location, setLocation] = useState('')
  const [locationStatus, setLocationStatus] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  } | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    onConfigChange?.(slots[focused])
  }, [slots, focused, onConfigChange])

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

  const updateFocusedSlot = (patch: Partial<LeveggConfig>) => {
    setSlots((prev) =>
      prev.map((s, i) => {
        if (i !== focused) return s
        const next = { ...s, ...patch }
        next.width = clampWidth(next.width, next.type)
        next.widthB = clampWidth(next.widthB, next.type)
        return next
      }),
    )
  }

  const handleRemoveSlot = (index: number) => {
    if (count <= 1) return
    setSlots((prev) => {
      const next = [...prev]
      next.splice(index, 1)
      next.push({ ...DEFAULT_SLOT })
      return next
    })
    setCount((c) => Math.max(1, c - 1))
    setFocused((f) => {
      if (f === index) return Math.max(0, Math.min(index, count - 2))
      if (f > index) return f - 1
      return f
    })
  }

  const handleSlotClick = (index: number) => {
    const isActive = index < count
    const isFocused = index === focused
    if (isActive && isFocused && count > 1) {
      handleRemoveSlot(index)
      return
    }
    setFocused(index)
    if (index + 1 > count) setCount(index + 1)
  }

  const activeSlots = slots.slice(0, count)
  const unitPrices = activeSlots.map((s) => unitPriceFor(s, basePrice))
  const grossTotal = unitPrices.reduce((a, b) => a + b, 0)
  const discountPct = quantityDiscount(count)
  const discountAmount = Math.round(grossTotal * discountPct)
  const productsTotal = grossTotal - discountAmount
  const deliveryCost = deliveryChecked ? distance * DELIVERY_PRICE_PER_KM * 2 : 0
  const totalPrice = productsTotal + deliveryCost

  const formatPrice = (price: number) => price.toLocaleString('nb-NO') + ',-'

  const focusedSlot = slots[focused]
  const focusedMaxWidth = focusedSlot.type === 'hjornne' ? MAX_WIDTH_HJORNNE : MAX_WIDTH_RETT
  const typeLabel = (t: LeveggType) => (t === 'hjornne' ? 'Hjørne' : 'Rett')
  const orientationLabel = (o: LeveggOrientation) =>
    o === 'horisontal' ? 'Liggende' : 'Stående'
  const dimsLabel = (slot: LeveggConfig) =>
    slot.type === 'hjornne'
      ? `${slot.width}+${slot.widthB}×${slot.height}`
      : `${slot.width}×${slot.height}`

  const handleAddToBasket = () => {
    const first = activeSlots[0]
    const deliveryLabel = deliveryChecked
      ? `${distance} km fra Lillehammer (${formatPrice(deliveryCost)})`
      : 'Avtales separat'
    const singleDims =
      first.type === 'hjornne'
        ? { width: first.width, height: first.height, depth: first.widthB }
        : { width: first.width, height: first.height, depth: 0 }
    const item: Omit<import('../../../types/product').BasketItem, 'id' | 'quantity'> = {
      type:
        count > 1
          ? `Levegg – sett (${count} stk)`
          : first.type === 'hjornne'
            ? `Levegg (Hjørne – ${first.width}+${first.widthB}×${first.height} cm)`
            : `Levegg (Rett – ${first.width}×${first.height} cm)`,
      dimensions: singleDims,
      finish: 'Trykkimpregnert tre',
      orientation: `${orientationLabel(first.orientation)} spiler`,
      delivery: deliveryLabel,
      price: formatPrice(totalPrice),
    }
    if (discountPct > 0) {
      item.discount = `Mengderabatt ${Math.round(discountPct * 100)}% (${count} stk) – sparer ${formatPrice(discountAmount)}`
    }
    if (count > 1) {
      item.setLabel = 'Levegger i settet'
      item.slotDimensions = activeSlots.map((slot) => ({
        width: slot.width,
        height: slot.height,
        depth: 0,
        widthB: slot.type === 'hjornne' ? slot.widthB : undefined,
        type: typeLabel(slot.type),
        orientation: `${orientationLabel(slot.orientation)} spiler`,
        unitPrice: formatPrice(unitPriceFor(slot, basePrice)),
      }))
      item.lockQuantity = true
    }
    addItem(item, 1)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <CalculatorContainer>
      <SectionTitle>Velg antall &amp; konfigurer hver levegg</SectionTitle>
      <SlotIntro>
        Klikk på en boks for å velge hvor mange du vil ha – og for å redigere type
        og mål på den enkelte leveggen. Hver kan ha sitt eget oppsett.
      </SlotIntro>
      <SlotGrid>
        {slots.map((slot, i) => {
          const active = i < count
          const isFocused = i === focused
          const discount = DISCOUNT_BY_COUNT[i + 1]
          const slotPrice = active ? unitPriceFor(slot, basePrice) : null
          return (
            <SlotBox
              key={i}
              type="button"
              $active={active}
              $focused={isFocused}
              onClick={() => handleSlotClick(i)}
              aria-label={`Levegg ${i + 1}${active ? ` – ${typeLabel(slot.type)} ${dimsLabel(slot)} cm` : ' (ikke valgt)'}`}
            >
              {discount > 0 && (
                <SlotDiscount $focused={isFocused} $active={active}>
                  −{Math.round(discount * 100)}%
                </SlotDiscount>
              )}
              <SlotNumber>#{i + 1}</SlotNumber>
              {active && slotPrice !== null ? (
                <>
                  <SlotType>
                    {typeLabel(slot.type)} · {orientationLabel(slot.orientation)}
                  </SlotType>
                  <SlotDims>{dimsLabel(slot)} cm</SlotDims>
                  <SlotPrice>{formatPrice(slotPrice)}</SlotPrice>
                </>
              ) : (
                <SlotPlaceholder>Legg til</SlotPlaceholder>
              )}
            </SlotBox>
          )
        })}
      </SlotGrid>
      <FocusBadge>
        <span>
          Redigerer <strong>levegg #{focused + 1}</strong>
          {count > 1 && <> av {count}</>}
        </span>
        {count > 1 && focused < count - 1 && (
          <button
            type="button"
            onClick={() => setFocused(focused + 1)}
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              color: '#1976d2',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            Neste &rarr;
          </button>
        )}
      </FocusBadge>

      <SectionTitle>Type for levegg #{focused + 1}</SectionTitle>
      <TypeToggle>
        <TypeButton
          type="button"
          $active={focusedSlot.type === 'rett'}
          onClick={() => updateFocusedSlot({ type: 'rett' })}
        >
          Rett
          <TypeHint>Ett panel</TypeHint>
        </TypeButton>
        <TypeButton
          type="button"
          $active={focusedSlot.type === 'hjornne'}
          onClick={() => updateFocusedSlot({ type: 'hjornne' })}
        >
          Hjørne
          <TypeHint>To panel i 90°</TypeHint>
        </TypeButton>
      </TypeToggle>

      <SectionTitle>Spilretning</SectionTitle>
      <TypeToggle>
        <TypeButton
          type="button"
          $active={focusedSlot.orientation === 'vertikal'}
          onClick={() => updateFocusedSlot({ orientation: 'vertikal' })}
        >
          Stående
          <TypeHint>Vertikale spiler</TypeHint>
        </TypeButton>
        <TypeButton
          type="button"
          $active={focusedSlot.orientation === 'horisontal'}
          onClick={() => updateFocusedSlot({ orientation: 'horisontal' })}
        >
          Liggende
          <TypeHint>Horisontale spiler</TypeHint>
        </TypeButton>
      </TypeToggle>

      <SectionTitle>Mål for levegg #{focused + 1}</SectionTitle>
      <SliderGroup>
        <SliderLabel>
          <span>{focusedSlot.type === 'hjornne' ? 'Bredde side A' : 'Bredde'}</span>
          <SliderValue>{focusedSlot.width} cm</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={MIN_WIDTH}
          max={focusedMaxWidth}
          step={10}
          value={focusedSlot.width}
          onChange={(e) => updateFocusedSlot({ width: parseInt(e.target.value, 10) })}
        />
      </SliderGroup>
      {focusedSlot.type === 'hjornne' && (
        <SliderGroup>
          <SliderLabel>
            <span>Bredde side B</span>
            <SliderValue>{focusedSlot.widthB} cm</SliderValue>
          </SliderLabel>
          <StyledSlider
            type="range"
            min={MIN_WIDTH}
            max={focusedMaxWidth}
            step={10}
            value={focusedSlot.widthB}
            onChange={(e) => updateFocusedSlot({ widthB: parseInt(e.target.value, 10) })}
          />
        </SliderGroup>
      )}
      <SliderGroup>
        <SliderLabel>
          <span>Høyde</span>
          <SliderValue>{focusedSlot.height} cm</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={MIN_HEIGHT}
          max={MAX_HEIGHT}
          step={10}
          value={focusedSlot.height}
          onChange={(e) => updateFocusedSlot({ height: parseInt(e.target.value, 10) })}
        />
      </SliderGroup>

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

      <PriceSection>
        {activeSlots.map((slot, i) => (
          <PriceRow key={i}>
            <SlotPriceLabel>
              #{i + 1} {typeLabel(slot.type)} ({dimsLabel(slot)})
            </SlotPriceLabel>
            <SlotPriceAmount>{formatPrice(unitPriceFor(slot, basePrice))}</SlotPriceAmount>
            <RemoveSlotButton
              type="button"
              onClick={() => handleRemoveSlot(i)}
              disabled={count <= 1}
              aria-label={`Fjern levegg ${i + 1}`}
              title="Fjern denne leveggen"
            >
              <Icon name="faTimes" />
            </RemoveSlotButton>
          </PriceRow>
        ))}
        {count > 1 && (
          <PriceRow>
            <span>Sum {count} stk</span>
            <span>{formatPrice(grossTotal)}</span>
          </PriceRow>
        )}
        {discountPct > 0 && (
          <DiscountRow>
            <span>Mengderabatt ({Math.round(discountPct * 100)}%)</span>
            <span>−{formatPrice(discountAmount)}</span>
          </DiscountRow>
        )}
        {deliveryChecked && deliveryCost > 0 && (
          <PriceRow>
            <SlotPriceLabel>Levering ({distance} km × 2)</SlotPriceLabel>
            <SlotPriceAmount>{formatPrice(deliveryCost)}</SlotPriceAmount>
          </PriceRow>
        )}
        <PriceTotalLabel>Estimert totalpris</PriceTotalLabel>
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
