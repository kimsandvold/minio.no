import { useMemo, useState, type MutableRefObject } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../../shared/Icon'
import {
  type PergolaConfig,
  type Montering,
  type Pergolaside,
  type Stolpedim,
  type Bjelkedimensjon,
  MONTERING_INFO,
  TAK_INFO,
  SKJERM_INFO,
  SIDE_INFO,
  BJELKE_INFO,
  STOLPE_INFO,
  MÅLEFELT,
  ALLE_MONTERING,
  ALLE_TAKTYPER,
  ALLE_SKJERMTYPER,
  ALLE_SIDER,
  ALLE_STOLPEDIM,
  ALLE_BJELKEDIM,
  PERGOLA_PRESETS,
  byggPresetConfig,
  beregn,
  formatKr,
} from './pergolaModel'
import { lastNedMaterialliste } from './pergolaPdf'

interface Props {
  config: PergolaConfig
  onChange: (config: PergolaConfig) => void
  snapshotRef?: MutableRefObject<(() => string | null) | null>
}

// ── Styled ───────────────────────────────────────────────────────────────────

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

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
`

const FormBtn = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 0.6rem 0.4rem 0.5rem;
  font-size: 0.66rem;
  line-height: 1.15;
  text-align: center;
  border: 1px solid ${({ $active }) => ($active ? '#666' : '#d8d8d8')};
  background: ${({ $active }) => ($active ? '#fafafa' : '#fff')};
  color: ${({ $active, theme }) => ($active ? theme.colors.textDark : '#666')};
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: #fafafa;
  }

  svg {
    stroke: currentColor;
    fill: none;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
    width: 34px;
    height: 26px;
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

const SideGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  margin-top: 0.6rem;
`

const SideBtn = styled.button<{ $active: boolean }>`
  padding: 0.45rem 0.3rem;
  font-size: 0.7rem;
  border: 1px solid ${({ $active }) => ($active ? '#333' : '#e0e0e0')};
  background: ${({ $active }) => ($active ? '#333' : '#fff')};
  color: ${({ $active }) => ($active ? '#fff' : '#666')};
  border-radius: 6px;
  cursor: pointer;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};

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

// Resultat
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

const CtaButton = styled(Link)`
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
  text-decoration: none;
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

const Note = styled.p`
  font-size: 0.65rem;
  color: #999;
  text-align: center;
  margin: 0.75rem 0 0;
`

// ── Monterings-ikoner (pergola-fasade i strek) ───────────────────────────────

function MonteringIcon({ montering }: { montering: Montering }) {
  if (montering === 'frittstående') {
    return (
      <svg viewBox="0 0 36 28" aria-hidden>
        {/* spær over dragen */}
        <path d="M8 4v4M13 4v4M18 4v4M23 4v4M28 4v4" />
        {/* drager */}
        <path d="M4 8h28" />
        {/* to stolper */}
        <path d="M7 8v17M29 8v17" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 36 28" aria-hidden>
      {/* husvegg (dobbel strek) */}
      <path d="M3 3v22M5.5 3v22" />
      {/* spær over dragen */}
      <path d="M12 4v4M17 4v4M22 4v4M27 4v4M31 4v4" />
      {/* drager fra vegg */}
      <path d="M5.5 8h26.5" />
      {/* ytre stolpe */}
      <path d="M30 8v17" />
    </svg>
  )
}

export default function PergolaCalculator({ config, onChange, snapshotRef }: Props) {
  const [advanced, setAdvanced] = useState(false)

  const r = beregn(config)
  const set = (patch: Partial<PergolaConfig>) => onChange({ ...config, ...patch })

  const presets = useMemo(() => PERGOLA_PRESETS.map((p) => ({ p, cfg: byggPresetConfig(p) })), [])
  const aktivPreset = presets.find(({ cfg }) => JSON.stringify(cfg) === JSON.stringify(config))?.p.id

  const harLekter = config.taktype === 'lekter' || config.taktype === 'spjeld'

  const handleStolpeDim = (dim: Stolpedim) => set({ stolpeDim: dim, prisStolpePrLm: STOLPE_INFO[dim].standardpris })
  const handleBjelkeDim = (dim: Bjelkedimensjon) =>
    set({ bjelkeDim: dim, prisDragerPrLm: BJELKE_INFO[dim].standardpris, prisSpærPrLm: Math.round(BJELKE_INFO[dim].standardpris * 0.85) })

  const toggleSide = (side: Pergolaside) =>
    set({
      skjermSider: config.skjermSider.includes(side)
        ? config.skjermSider.filter((s) => s !== side)
        : [...config.skjermSider, side],
    })

  return (
    <Container>
      {/* Kom raskt i gang – montering først, deretter ferdige startpunkter */}
      <SectionTitle>
        <Icon name="faRocket" /> Kom raskt i gang
      </SectionTitle>
      <FormGrid>
        {ALLE_MONTERING.map((m) => (
          <FormBtn key={m} $active={config.montering === m} onClick={() => set({ montering: m })}>
            <MonteringIcon montering={m} />
            {MONTERING_INFO[m].navn}
          </FormBtn>
        ))}
      </FormGrid>
      <PresetGrid>
        {presets.map(({ p, cfg }) => (
          <PresetBtn key={p.id} $active={aktivPreset === p.id} onClick={() => onChange(cfg)}>
            <span className="navn">{p.navn}</span>
            <span className="desc">{p.beskrivelse}</span>
          </PresetBtn>
        ))}
      </PresetGrid>

      {/* Mål */}
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
            onChange={(e) => set({ [key]: parseFloat(e.target.value) } as Partial<PergolaConfig>)}
          />
        </SliderGroup>
      ))}

      {/* Tak */}
      <SectionTitle>
        <Icon name="faSquare" /> Tak / solskjerm
      </SectionTitle>
      <ButtonGroup>
        {ALLE_TAKTYPER.map((type) => (
          <ButtonGroupBtn key={type} $active={config.taktype === type} onClick={() => set({ taktype: type })}>
            {TAK_INFO[type].navn}
          </ButtonGroupBtn>
        ))}
      </ButtonGroup>
      {harLekter && (
        <SliderGroup style={{ marginTop: '0.75rem' }}>
          <SliderLabel>
            <span>
              Avstand mellom lekter<Hjelp>tettere = mer skygge</Hjelp>
            </span>
            <SliderValue>{(config.lektAvstand * 100).toFixed(0)} cm</SliderValue>
          </SliderLabel>
          <StyledSlider
            type="range"
            min={0.05}
            max={0.4}
            step={0.01}
            value={config.lektAvstand}
            onChange={(e) => set({ lektAvstand: parseFloat(e.target.value) })}
          />
        </SliderGroup>
      )}

      {/* Sideskjerm */}
      <SectionTitle>
        <Icon name="faSeedling" /> Sideskjerm / spalér
      </SectionTitle>
      <ButtonGroup>
        {ALLE_SKJERMTYPER.map((type) => (
          <ButtonGroupBtn key={type} $active={config.skjermtype === type} onClick={() => set({ skjermtype: type })}>
            {SKJERM_INFO[type].navn}
          </ButtonGroupBtn>
        ))}
      </ButtonGroup>
      {config.skjermtype !== 'ingen' && (
        <SideGrid>
          {ALLE_SIDER.map((side) => (
            <SideBtn key={side} $active={config.skjermSider.includes(side)} onClick={() => toggleSide(side)}>
              {SIDE_INFO[side]}
            </SideBtn>
          ))}
        </SideGrid>
      )}

      {/* Avansert: materialer og priser */}
      <Collapsible>
        <CollapsibleHead $open={advanced} onClick={() => setAdvanced((v) => !v)}>
          <Icon name="faTools" /> Materialer og priser
          <Icon name="faChevronDown" />
        </CollapsibleHead>
        {advanced && (
          <CollapsibleBody>
            <SectionTitle>Stolpedimensjon</SectionTitle>
            <ButtonGroup>
              {ALLE_STOLPEDIM.map((dim) => (
                <ButtonGroupBtn key={dim} $active={config.stolpeDim === dim} onClick={() => handleStolpeDim(dim)}>
                  {dim.replace('x', '×')}
                </ButtonGroupBtn>
              ))}
            </ButtonGroup>

            <SectionTitle>Drager / spær</SectionTitle>
            <ButtonGroup>
              {ALLE_BJELKEDIM.map((dim) => (
                <ButtonGroupBtn key={dim} $active={config.bjelkeDim === dim} onClick={() => handleBjelkeDim(dim)}>
                  {dim.replace('x', '×')}
                </ButtonGroupBtn>
              ))}
            </ButtonGroup>

            <SectionTitle>Konfigurasjon</SectionTitle>
            <NumRow label="Stolpeavstand" enhet="m" value={config.stolpeAvstand} step={0.1} min={1} max={4} decimals={1} onChange={(v) => set({ stolpeAvstand: v })} />
            <NumRow label="Spæravstand" enhet="cm" value={Math.round(config.spærAvstand * 100)} step={5} min={30} max={120} onChange={(v) => set({ spærAvstand: v / 100 })} />
            <NumRow label="Skruer per kryss" enhet="stk" value={config.skruerPerKryss} step={1} min={1} max={8} onChange={(v) => set({ skruerPerKryss: v })} />
            <NumRow label="Kapp og svinn" enhet="%" value={config.svinnProsent} step={1} min={0} max={25} onChange={(v) => set({ svinnProsent: v })} />

            <SectionTitle>Priser</SectionTitle>
            <NumRow label="Stolper" enhet="kr/lm" value={config.prisStolpePrLm} step={1} min={0} max={999} onChange={(v) => set({ prisStolpePrLm: v })} />
            <NumRow label="Dragere" enhet="kr/lm" value={config.prisDragerPrLm} step={1} min={0} max={999} onChange={(v) => set({ prisDragerPrLm: v })} />
            <NumRow label="Spær" enhet="kr/lm" value={config.prisSpærPrLm} step={1} min={0} max={999} onChange={(v) => set({ prisSpærPrLm: v })} />
            <NumRow label="Lekter / spiler" enhet="kr/lm" value={config.prisLektPrLm} step={1} min={0} max={999} onChange={(v) => set({ prisLektPrLm: v })} />
            <NumRow label="Tak / panel" enhet="kr/m²" value={config.prisTakplatePerM2} step={10} min={0} max={2000} onChange={(v) => set({ prisTakplatePerM2: v })} />
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
          <div className="label">Overdekket areal</div>
          <div className="value">{r.arealFormattert}</div>
        </div>
      </ArealCard>

      <ResultGrid>
        <StatCard>
          <StatTop>
            <Icon name="faTree" /> Stolper
          </StatTop>
          <StatVal>{r.stolpeAntall} stk</StatVal>
          <StatSub>{r.stolpeFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop>
            <Icon name="faHammer" /> Dragere
          </StatTop>
          <StatVal>{r.dragerLøpemeter.toFixed(0)} lm</StatVal>
          <StatSub>{r.dragerFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop>
            <Icon name="faTree" /> Spær
          </StatTop>
          <StatVal>{r.spærAntall} stk</StatVal>
          <StatSub>{r.spærFormattert}</StatSub>
        </StatCard>
        {r.takFormattert && (
          <StatCard>
            <StatTop>
              <Icon name="faSquare" /> {TAK_INFO[config.taktype].navn}
            </StatTop>
            <StatVal>{r.lektAntall != null ? `${r.lektAntall} lekter` : `${(r.takAreal ?? 0).toFixed(1)} m²`}</StatVal>
            <StatSub>{r.takFormattert}</StatSub>
          </StatCard>
        )}
        {r.skjermFormattert && (
          <StatCard>
            <StatTop>
              <Icon name="faSeedling" /> {SKJERM_INFO[config.skjermtype].navn}
            </StatTop>
            <StatVal>{config.skjermSider.length} sider</StatVal>
            <StatSub>{r.skjermFormattert}</StatSub>
          </StatCard>
        )}
        <StatCard>
          <StatTop>
            <Icon name="faTools" /> Skruer / beslag
          </StatTop>
          <StatVal>{r.skrueAntall}</StatVal>
          <StatSub>{r.stolpeskoAntall} stolpesko</StatSub>
        </StatCard>
      </ResultGrid>

      <CostBox>
        <CostRow>
          <span>Stolper</span>
          <span>{formatKr(r.stolpeKostnad)}</span>
        </CostRow>
        <CostRow>
          <span>Dragere</span>
          <span>{formatKr(r.dragerKostnad)}</span>
        </CostRow>
        <CostRow>
          <span>Spær</span>
          <span>{formatKr(r.spærKostnad)}</span>
        </CostRow>
        {r.takKostnad != null && (
          <CostRow>
            <span>Tak / solskjerm</span>
            <span>{formatKr(r.takKostnad)}</span>
          </CostRow>
        )}
        {r.skjermKostnad != null && (
          <CostRow>
            <span>Sideskjerm</span>
            <span>{formatKr(r.skjermKostnad)}</span>
          </CostRow>
        )}
        <CostRow>
          <span>Stolpesko</span>
          <span>{formatKr(r.stolpeskoKostnad)}</span>
        </CostRow>
        <CostRow>
          <span>Skruer / beslag</span>
          <span>{formatKr(r.skrueKostnad)}</span>
        </CostRow>
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

      <DownloadButton onClick={() => lastNedMaterialliste(config, r, snapshotRef?.current?.() ?? undefined)}>
        <Icon name="faDownload" /> Last ned materialliste (PDF)
      </DownloadButton>

      <CtaButton to="/kontakt">
        <Icon name="faPaperPlane" /> Be om tilbud på bygging
      </CtaButton>

      <Note>* Veiledende estimat på materialer. Ta med materiallisten i butikken. Kontakt oss for et konkret tilbud.</Note>
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
