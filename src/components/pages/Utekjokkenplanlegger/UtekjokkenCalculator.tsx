import { useMemo, useState, type MutableRefObject } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../../shared/Icon'
import {
  type UtekjokkenConfig,
  type Taktekke,
  type Benkeplate,
  type Stolpedim,
  type Bjelkedimensjon,
  TAK_INFO,
  TAKTEKKE_INFO,
  BENKEPLATE_INFO,
  MÅLEFELT,
  ALLE_TAKTYPER,
  ALLE_TAKTEKKE,
  ALLE_BENKEPLATE,
  ALLE_STOLPEDIM,
  ALLE_BJELKEDIM,
  UTEKJOKKEN_PRESETS,
  byggPresetConfig,
  beregn,
  formatKr,
} from './utekjokkenModel'
import { lastNedMaterialliste } from './utekjokkenPdf'
import { useBasketContext } from '../../../context/BasketContext'

interface Props {
  config: UtekjokkenConfig
  onChange: (config: UtekjokkenConfig) => void
  snapshotRef?: MutableRefObject<(() => string | null) | null>
}

const Container = styled.div`
  padding: 0;
`

const SectionTitle = styled.h3`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  margin: 1.5rem 0 0.6rem 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  &:first-child {
    margin-top: 0;
  }
`

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
`

const PresetBtn = styled.button<{ $active: boolean }>`
  text-align: left;
  border: 1px solid ${({ $active }) => ($active ? '#666' : '#e0e0e0')};
  background: ${({ $active }) => ($active ? '#fafafa' : '#fff')};
  border-radius: 8px;
  padding: 0.55rem 0.6rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;

  .navn {
    font-size: 0.74rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
  }
  .desc {
    font-size: 0.6rem;
    color: #999;
    line-height: 1.25;
  }
  &:hover {
    background: #fafafa;
  }
  &:last-child:nth-child(odd) {
    grid-column: 1 / -1;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  flex-wrap: wrap;
`

const ButtonGroupBtn = styled.button<{ $active: boolean }>`
  flex: 1 1 auto;
  padding: 0.45rem 0.4rem;
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

const ToggleGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
`

const ToggleBtn = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.6rem;
  font-size: 0.74rem;
  border: 1px solid ${({ $active }) => ($active ? '#333' : '#e0e0e0')};
  background: ${({ $active }) => ($active ? '#333' : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#666')};
  border-radius: 8px;
  cursor: pointer;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  transition: all 0.15s;

  svg {
    font-size: 0.8rem;
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
  align-items: baseline;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 0.25rem;
`

const Hjelp = styled.span`
  font-size: 0.62rem;
  color: #999;
  font-weight: 400;
  margin-left: 0.35rem;
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

const Collapsible = styled.div`
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-top: 0.75rem;
  overflow: hidden;
`

const CollapsibleHead = styled.button<{ $open: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem;
  background: ${({ $open }) => ($open ? '#fafafa' : '#fff')};
  border: none;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};

  svg:last-child {
    margin-left: auto;
    color: #aaa;
    transition: transform 0.2s;
    transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  }
`

const CollapsibleBody = styled.div`
  padding: 0.85rem;
  border-top: 1px solid #eee;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.textDark};
  &:last-child {
    margin-bottom: 0;
  }
`

const Stepper = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
`

const StepBtn = styled.button`
  width: 30px;
  height: 30px;
  border: none;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: #f5f5f5;
  }
  &:disabled {
    color: #ccc;
    cursor: not-allowed;
  }
`

const StepVal = styled.div`
  min-width: 56px;
  text-align: center;
  font-weight: 600;
  font-size: 0.78rem;
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
  padding: 0 0.4rem;
  line-height: 30px;
`

const ResultGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.75rem;
`

const StatCard = styled.div`
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 0.65rem 0.7rem;
  background: #fff;
`

const StatTop = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.62rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.25rem;
  svg {
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const StatVal = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
`

const StatSub = styled.div`
  font-size: 0.6rem;
  color: #aaa;
  margin-top: 0.1rem;
`

const ArealCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  background: #fff;
  margin-top: 0.75rem;

  .icon {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: ${({ theme }) => theme.colors.textDark};
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .label {
    font-size: 0.68rem;
    color: #888;
  }
  .value {
    font-size: 1.3rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    line-height: 1.1;
  }
`

const CostBox = styled.div`
  margin-top: 1rem;
  border: 3px solid ${({ theme }) => theme.colors.textDark};
  border-radius: 8px;
  padding: 0.9rem 1rem;
`

const CostRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #444;
  margin-bottom: 0.35rem;
`

const CostTotal = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 0.5rem;
  padding-top: 0.6rem;
  border-top: 1px solid #e0e0e0;

  span:first-child {
    font-size: 0.85rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
  }
  span:last-child {
    font-size: 1.3rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const CostNote = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.62rem;
  color: #999;
  line-height: 1.4;
`

const AddToBasketButton = styled.button`
  width: 100%;
  padding: 0.85rem 1rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`

const DownloadButton = styled.button`
  width: 100%;
  padding: 0.8rem 1rem;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  border: 2px solid ${({ theme }) => theme.colors.textDark};
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.6rem;
  transition: background 0.2s;
  &:hover {
    background: #f3f3f3;
  }
`

const CtaButton = styled(Link)`
  width: 100%;
  padding: 0.8rem 1rem;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  border: 2px solid ${({ theme }) => theme.colors.textDark};
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.6rem;
  text-decoration: none;
  transition: background 0.2s;
  &:hover {
    background: #f3f3f3;
  }
`

const Note = styled.p`
  font-size: 0.65rem;
  color: #999;
  text-align: center;
  margin: 0.75rem 0 0;
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

export default function UtekjokkenCalculator({ config, onChange, snapshotRef }: Props) {
  const [advanced, setAdvanced] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const { addItem } = useBasketContext()

  const r = beregn(config)
  const set = (patch: Partial<UtekjokkenConfig>) => onChange({ ...config, ...patch })

  const presets = useMemo(() => UTEKJOKKEN_PRESETS.map((p) => ({ p, cfg: byggPresetConfig(p) })), [])
  const aktivPreset = presets.find(({ cfg }) => JSON.stringify(cfg) === JSON.stringify(config))?.p.id

  const handleTaktekke = (t: Taktekke) => set({ taktekke: t, prisTaktekkePerM2: TAKTEKKE_INFO[t].standardpris })
  const handleBenkeplate = (b: Benkeplate) => set({ benkeplate: b, prisBenkeplatePrLm: BENKEPLATE_INFO[b].standardpris })

  const handleAddToBasket = () => {
    const tilvalg = [
      config.harVask ? 'vask' : null,
      config.harSkap ? 'underskap' : null,
      config.harBenk ? 'sittebenk' : null,
      config.harBakvegg ? 'bakvegg (spiler)' : null,
      config.harSidevegger ? 'sidevegger (spiler)' : null,
      config.hyller > 0 ? `${config.hyller} hyller` : null,
    ].filter(Boolean).join(', ')
    addItem({
      type: 'Utekjøkken (materialpakke)',
      dimensions: {
        width: Math.round(config.bredde * 100),
        height: Math.round((config.plattformHøyde + config.høyde) * 100),
        depth: Math.round(config.dybde * 100),
      },
      roof: `${TAK_INFO[config.taktype].navn} · ${TAKTEKKE_INFO[config.taktekke].navn}`,
      size: r.arealFormattert,
      quality: `Benkeplate: ${BENKEPLATE_INFO[config.benkeplate].navn}`,
      complexity: tilvalg || 'Bare benk',
      finish: 'Ubehandlet (materialpakke)',
      delivery: 'Hentes / avtales',
      price: formatKr(r.totalKostnad),
    })
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2000)
  }

  return (
    <Container>
      <SectionTitle>
        <Icon name="faRocket" /> Kom raskt i gang
      </SectionTitle>
      <PresetGrid>
        {presets.map(({ p, cfg }) => (
          <PresetBtn key={p.id} $active={aktivPreset === p.id} onClick={() => onChange(cfg)}>
            <span className="navn">{p.navn}</span>
            <span className="desc">{p.beskrivelse}</span>
          </PresetBtn>
        ))}
      </PresetGrid>

      <SectionTitle>Mål</SectionTitle>
      {MÅLEFELT.map(([key, label, min, max, step, hjelp]) => (
        <SliderGroup key={key}>
          <SliderLabel>
            <span>
              {label}
              {hjelp && <Hjelp>{hjelp}</Hjelp>}
            </span>
            <SliderValue>{(config[key] as number).toFixed(1)} m</SliderValue>
          </SliderLabel>
          <StyledSlider
            type="range"
            min={min}
            max={max}
            step={step}
            value={config[key] as number}
            onChange={(e) => set({ [key]: parseFloat(e.target.value) } as Partial<UtekjokkenConfig>)}
          />
        </SliderGroup>
      ))}

      <SectionTitle>
        <Icon name="faSquare" /> Tak
      </SectionTitle>
      <ButtonGroup>
        {ALLE_TAKTYPER.map((t) => (
          <ButtonGroupBtn key={t} $active={config.taktype === t} onClick={() => set({ taktype: t })}>
            {TAK_INFO[t].navn}
          </ButtonGroupBtn>
        ))}
      </ButtonGroup>
      {config.taktype !== 'flatt' && (
        <SliderGroup style={{ marginTop: '0.75rem' }}>
          <SliderLabel>
            <span>
              Takvinkel<Hjelp>leder vann bakover</Hjelp>
            </span>
            <SliderValue>{config.takvinkel}°</SliderValue>
          </SliderLabel>
          <StyledSlider
            type="range"
            min={3}
            max={20}
            step={1}
            value={config.takvinkel}
            onChange={(e) => set({ takvinkel: parseFloat(e.target.value) })}
          />
        </SliderGroup>
      )}
      <div style={{ marginTop: '0.6rem' }}>
        <ButtonGroup>
          {ALLE_TAKTEKKE.map((t) => (
            <ButtonGroupBtn key={t} $active={config.taktekke === t} onClick={() => handleTaktekke(t)}>
              {TAKTEKKE_INFO[t].navn}
            </ButtonGroupBtn>
          ))}
        </ButtonGroup>
      </div>

      <SectionTitle>
        <Icon name="faTools" /> Innredning
      </SectionTitle>
      <ToggleGrid>
        <ToggleBtn $active={config.harVask} onClick={() => set({ harVask: !config.harVask })}>
          <Icon name={config.harVask ? 'faCheckCircle' : 'faCircle'} /> Vask og kran
        </ToggleBtn>
        <ToggleBtn $active={config.harSkap} onClick={() => set({ harSkap: !config.harSkap })}>
          <Icon name={config.harSkap ? 'faCheckCircle' : 'faCircle'} /> Underskap
        </ToggleBtn>
        <ToggleBtn $active={config.harBenk} onClick={() => set({ harBenk: !config.harBenk })}>
          <Icon name={config.harBenk ? 'faCheckCircle' : 'faCircle'} /> Sittebenk
        </ToggleBtn>
        <ToggleBtn $active={config.harBakvegg} onClick={() => set({ harBakvegg: !config.harBakvegg })}>
          <Icon name={config.harBakvegg ? 'faCheckCircle' : 'faCircle'} /> Bakvegg (spiler)
        </ToggleBtn>
        <ToggleBtn $active={config.harSidevegger} onClick={() => set({ harSidevegger: !config.harSidevegger })}>
          <Icon name={config.harSidevegger ? 'faCheckCircle' : 'faCircle'} /> Sidevegger
        </ToggleBtn>
      </ToggleGrid>

      <SectionTitle>
        <Icon name="faSquare" /> Benkeplate
      </SectionTitle>
      <ButtonGroup>
        {ALLE_BENKEPLATE.map((b) => (
          <ButtonGroupBtn key={b} $active={config.benkeplate === b} onClick={() => handleBenkeplate(b)}>
            {BENKEPLATE_INFO[b].navn}
          </ButtonGroupBtn>
        ))}
      </ButtonGroup>

      {/* Avansert */}
      <Collapsible>
        <CollapsibleHead $open={advanced} onClick={() => setAdvanced((v) => !v)}>
          <Icon name="faTools" /> Mål, materialer og priser
          <Icon name="faChevronDown" />
        </CollapsibleHead>
        {advanced && (
          <CollapsibleBody>
            <SectionTitle>Stolpedimensjon</SectionTitle>
            <ButtonGroup>
              {ALLE_STOLPEDIM.map((d: Stolpedim) => (
                <ButtonGroupBtn key={d} $active={config.stolpeDim === d} onClick={() => set({ stolpeDim: d })}>
                  {d.replace('x', '×')}
                </ButtonGroupBtn>
              ))}
            </ButtonGroup>
            <SectionTitle>Drager / spær</SectionTitle>
            <ButtonGroup>
              {ALLE_BJELKEDIM.map((d: Bjelkedimensjon) => (
                <ButtonGroupBtn key={d} $active={config.bjelkeDim === d} onClick={() => set({ bjelkeDim: d })}>
                  {d.replace('x', '×')}
                </ButtonGroupBtn>
              ))}
            </ButtonGroup>

            <SectionTitle>Konfigurasjon</SectionTitle>
            <NumRow label="Plattformhøyde" enhet="cm" value={Math.round(config.plattformHøyde * 100)} step={5} min={5} max={60} onChange={(v) => set({ plattformHøyde: v / 100 })} />
            <NumRow label="Benkehøyde" enhet="cm" value={Math.round(config.benkehøyde * 100)} step={1} min={75} max={100} onChange={(v) => set({ benkehøyde: v / 100 })} />
            <NumRow label="Benkedybde" enhet="cm" value={Math.round(config.benkedybde * 100)} step={5} min={45} max={75} onChange={(v) => set({ benkedybde: v / 100 })} />
            <NumRow label="Hyller under benk" enhet="stk" value={config.hyller} step={1} min={0} max={3} onChange={(v) => set({ hyller: v })} />
            <NumRow label="Takutstikk" enhet="cm" value={Math.round(config.takutstikk * 100)} step={5} min={0} max={60} onChange={(v) => set({ takutstikk: v / 100 })} />
            <NumRow label="Spæravstand" enhet="cm" value={Math.round(config.spærAvstand * 100)} step={5} min={30} max={120} onChange={(v) => set({ spærAvstand: v / 100 })} />
            <NumRow label="Skruer per kryss" enhet="stk" value={config.skruerPerKryss} step={1} min={1} max={8} onChange={(v) => set({ skruerPerKryss: v })} />
            <NumRow label="Kapp og svinn" enhet="%" value={config.svinnProsent} step={1} min={0} max={25} onChange={(v) => set({ svinnProsent: v })} />

            <SectionTitle>Priser</SectionTitle>
            <NumRow label="Stolper" enhet="kr/lm" value={config.prisStolpePrLm} step={1} min={0} max={999} onChange={(v) => set({ prisStolpePrLm: v })} />
            <NumRow label="Dragere/bjelker" enhet="kr/lm" value={config.prisDragerPrLm} step={1} min={0} max={999} onChange={(v) => set({ prisDragerPrLm: v })} />
            <NumRow label="Spær" enhet="kr/lm" value={config.prisSpærPrLm} step={1} min={0} max={999} onChange={(v) => set({ prisSpærPrLm: v })} />
            <NumRow label="Taktekke" enhet="kr/m²" value={config.prisTaktekkePerM2} step={10} min={0} max={2000} onChange={(v) => set({ prisTaktekkePerM2: v })} />
            <NumRow label="Platting (dekke)" enhet="kr/m²" value={config.prisDekkePerM2} step={10} min={0} max={2000} onChange={(v) => set({ prisDekkePerM2: v })} />
            <NumRow label="Benkeplate" enhet="kr/lm" value={config.prisBenkeplatePrLm} step={10} min={0} max={3000} onChange={(v) => set({ prisBenkeplatePrLm: v })} />
            <NumRow label="Vask + kran" enhet="kr" value={config.prisVask} step={50} min={0} max={20000} onChange={(v) => set({ prisVask: v })} />
            <NumRow label="Underskap" enhet="kr" value={config.prisSkap} step={50} min={0} max={20000} onChange={(v) => set({ prisSkap: v })} />
            <NumRow label="Sittebenk" enhet="kr/lm" value={config.prisBenkPrLm} step={10} min={0} max={3000} onChange={(v) => set({ prisBenkPrLm: v })} />
            <NumRow label="Panel / bakvegg" enhet="kr/m²" value={config.prisPanelPerM2} step={10} min={0} max={2000} onChange={(v) => set({ prisPanelPerM2: v })} />
            <NumRow label="Stolpesko" enhet="kr/stk" value={config.prisStolpesko} step={1} min={0} max={999} onChange={(v) => set({ prisStolpesko: v })} />
            <NumRow label="Skruer" enhet="kr/stk" value={config.prisSkrue} step={1} min={0} max={99} onChange={(v) => set({ prisSkrue: v })} />
          </CollapsibleBody>
        )}
      </Collapsible>

      {/* Resultat */}
      <SectionTitle style={{ marginTop: '1.75rem' }}>Beregning</SectionTitle>
      <ArealCard>
        <div className="icon">
          <Icon name="faCube" />
        </div>
        <div>
          <div className="label">Grunnflate</div>
          <div className="value">{r.arealFormattert}</div>
        </div>
      </ArealCard>

      <ResultGrid>
        <StatCard>
          <StatTop><Icon name="faTree" /> Stolper</StatTop>
          <StatVal>{r.stolpeAntall} stk</StatVal>
          <StatSub>{r.stolpeFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faTree" /> Spær</StatTop>
          <StatVal>{r.spærAntall} stk</StatVal>
          <StatSub>{r.spærFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faSquare" /> {TAKTEKKE_INFO[config.taktekke].navn}</StatTop>
          <StatVal>{r.takAreal.toFixed(1)} m²</StatVal>
          <StatSub>{r.taktekkeFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faRulerCombined" /> Platting</StatTop>
          <StatVal>{r.plattformAreal.toFixed(1)} m²</StatVal>
          <StatSub>{r.plattformFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faHammer" /> Benkeplate</StatTop>
          <StatVal>{r.benkeLengde.toFixed(1)} lm</StatVal>
          <StatSub>{r.benkeplateFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faTools" /> Innredning</StatTop>
          <StatVal>
            {[config.harVask && 'Vask', r.skapAntall > 0 && 'Skap', r.benkLengde > 0 && 'Benk'].filter(Boolean).join(' · ') || '—'}
          </StatVal>
          <StatSub>{config.hyller > 0 ? `${config.hyller} hyller` : 'Åpen under benk'}</StatSub>
        </StatCard>
      </ResultGrid>

      <CostBox>
        <CostRow><span>Stolper</span><span>{formatKr(r.stolpeKostnad)}</span></CostRow>
        <CostRow><span>Dragere / sidebjelker</span><span>{formatKr(r.dragerKostnad)}</span></CostRow>
        <CostRow><span>Spær</span><span>{formatKr(r.spærKostnad)}</span></CostRow>
        <CostRow><span>Knebånd</span><span>{formatKr(r.knebåndKostnad)}</span></CostRow>
        <CostRow><span>Taktekke</span><span>{formatKr(r.taktekkeKostnad)}</span></CostRow>
        <CostRow><span>Platting (dekke + bjelkelag)</span><span>{formatKr(r.plattformKostnad)}</span></CostRow>
        <CostRow><span>Benkeplate</span><span>{formatKr(r.benkeplateKostnad)}</span></CostRow>
        {r.vaskKostnad > 0 && <CostRow><span>Vask + kran</span><span>{formatKr(r.vaskKostnad)}</span></CostRow>}
        {r.skapKostnad > 0 && <CostRow><span>Underskap</span><span>{formatKr(r.skapKostnad)}</span></CostRow>}
        {r.benkKostnad > 0 && <CostRow><span>Sittebenk</span><span>{formatKr(r.benkKostnad)}</span></CostRow>}
        {r.bakveggKostnad > 0 && <CostRow><span>Bakvegg (spiler)</span><span>{formatKr(r.bakveggKostnad)}</span></CostRow>}
        {r.sideveggKostnad > 0 && <CostRow><span>Sidevegger (spiler)</span><span>{formatKr(r.sideveggKostnad)}</span></CostRow>}
        {r.hyllerKostnad > 0 && <CostRow><span>Hyller</span><span>{formatKr(r.hyllerKostnad)}</span></CostRow>}
        <CostRow><span>Stolpesko</span><span>{formatKr(r.stolpeskoKostnad)}</span></CostRow>
        <CostRow><span>Skruer / beslag</span><span>{formatKr(r.skrueKostnad)}</span></CostRow>
        <CostTotal>
          <span>Estimert materialkostnad</span>
          <span>{formatKr(r.totalKostnad)}</span>
        </CostTotal>
        {r.svinnProsent > 0 && (
          <CostNote>
            Løpemeter og pris inkluderer {r.svinnProsent} % kapp og svinn (≈ {formatKr(r.svinnKostnad)}).
          </CostNote>
        )}
      </CostBox>

      <AddToBasketButton onClick={handleAddToBasket}>
        <Icon name="faShoppingCart" /> Legg til i forespørsel
      </AddToBasketButton>

      <DownloadButton onClick={() => lastNedMaterialliste(config, r, snapshotRef?.current?.() ?? undefined)}>
        <Icon name="faDownload" /> Last ned materialliste (PDF)
      </DownloadButton>

      <CtaButton to="/kontakt">
        <Icon name="faPaperPlane" /> Be om tilbud på bygging
      </CtaButton>

      <Note>* Veiledende estimat på materialer. Vask, kran og avløp er en fast post – endelig pris avhenger av valgt utstyr. Legg til i forespørselen for å be om tilbud på en ferdig materialpakke.</Note>

      <Toast $visible={showToast}>
        <Icon name="faCheck" /> Lagt til i forespørselen!
      </Toast>
    </Container>
  )
}

function NumRow({
  label,
  enhet,
  value,
  step,
  min,
  max,
  decimals = 0,
  onChange,
}: {
  label: string
  enhet: string
  value: number
  step: number
  min: number
  max: number
  decimals?: number
  onChange: (v: number) => void
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, +v.toFixed(2)))
  return (
    <Row>
      <span>{label}</span>
      <Stepper>
        <StepBtn onClick={() => onChange(clamp(value - step))} disabled={value <= min}>
          <Icon name="faMinus" />
        </StepBtn>
        <StepVal>
          {value.toFixed(decimals)} {enhet}
        </StepVal>
        <StepBtn onClick={() => onChange(clamp(value + step))} disabled={value >= max}>
          <Icon name="faPlus" />
        </StepBtn>
      </Stepper>
    </Row>
  )
}
