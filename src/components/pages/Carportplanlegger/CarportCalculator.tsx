import { useMemo, useState, type MutableRefObject } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../../shared/Icon'
import {
  type CarportConfig,
  type Taktekke,
  type Veggtype,
  type Carportside,
  type Stolpedim,
  type Bjelkedimensjon,
  MONTERING_INFO,
  TAK_INFO,
  TAKTEKKE_INFO,
  VEGG_INFO,
  SIDE_INFO,
  STOLPE_INFO,
  BJELKE_INFO,
  MÅLEFELT,
  ALLE_MONTERING,
  ALLE_TAKTYPER,
  ALLE_TAKTEKKE,
  ALLE_VEGGTYPER,
  ALLE_SIDER,
  ALLE_STOLPEDIM,
  ALLE_BJELKEDIM,
  CARPORT_PRESETS,
  byggPresetConfig,
  beregn,
  byggeregler,
  dimensjonering,
  formatKr,
} from './carportModel'
import { lastNedMaterialliste } from './carportPdf'

interface Props {
  config: CarportConfig
  onChange: (config: CarportConfig) => void
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

// ── Byggeregler-kort (blåkopi-stil, «surprise») ───────────────────────────────

const RegCard = styled.div<{ $ok: boolean }>`
  margin-top: 0.75rem;
  border: 1.5px solid ${({ $ok, theme }) => ($ok ? theme.colors.success : '#e0a516')};
  border-radius: 12px;
  overflow: hidden;
  background: ${({ $ok }) => ($ok ? 'rgba(76,175,80,0.05)' : 'rgba(224,165,22,0.06)')};
`

const RegHead = styled.div<{ $ok: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 0.85rem;
  background: ${({ $ok, theme }) => ($ok ? theme.colors.success : '#e0a516')};
  color: #fff;
  font-weight: 700;
  font-size: 0.82rem;

  .status {
    margin-left: auto;
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: rgba(255, 255, 255, 0.2);
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
  }
`

const RegBody = styled.div`
  padding: 0.7rem 0.85rem;

  .metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
    margin-bottom: 0.6rem;
  }
  .metric {
    border: 1px dashed #cfcfcf;
    border-radius: 8px;
    padding: 0.4rem 0.5rem;
    text-align: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .metric .k {
    font-size: 0.55rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #999;
  }
  .metric .v {
    font-size: 0.85rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
  }
  ul {
    margin: 0;
    padding-left: 1rem;
  }
  li {
    font-size: 0.68rem;
    color: #555;
    line-height: 1.5;
    margin-bottom: 0.2rem;
  }
`

const DimNote = styled.div<{ $ok: boolean }>`
  margin-top: 0.6rem;
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  font-size: 0.7rem;
  line-height: 1.45;
  color: ${({ $ok }) => ($ok ? '#2e7d32' : '#b8860b')};
  background: ${({ $ok }) => ($ok ? 'rgba(76,175,80,0.08)' : 'rgba(224,165,22,0.1)')};
  border-radius: 8px;
  padding: 0.55rem 0.65rem;

  svg {
    flex-shrink: 0;
    margin-top: 1px;
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

export default function CarportCalculator({ config, onChange, snapshotRef }: Props) {
  const [advanced, setAdvanced] = useState(false)

  const r = beregn(config)
  const reg = byggeregler(config)
  const dim = dimensjonering(config)
  const set = (patch: Partial<CarportConfig>) => onChange({ ...config, ...patch })

  const presets = useMemo(() => CARPORT_PRESETS.map((p) => ({ p, cfg: byggPresetConfig(p) })), [])
  const aktivPreset = presets.find(({ cfg }) => JSON.stringify(cfg) === JSON.stringify(config))?.p.id

  const handleStolpeDim = (dim: Stolpedim) => set({ stolpeDim: dim, prisStolpePrLm: STOLPE_INFO[dim].standardpris })
  const handleBjelkeDim = (dim: Bjelkedimensjon) =>
    set({ bjelkeDim: dim, prisDragerPrLm: BJELKE_INFO[dim].standardpris, prisSpærPrLm: Math.round(BJELKE_INFO[dim].standardpris * 0.85) })
  const handleTaktekke = (t: Taktekke) => set({ taktekke: t, prisTaktekkePerM2: TAKTEKKE_INFO[t].standardpris })

  const toggleSide = (side: Carportside) =>
    set({
      veggSider: config.veggSider.includes(side)
        ? config.veggSider.filter((s) => s !== side)
        : [...config.veggSider, side],
    })

  return (
    <Container>
      <SectionTitle>
        <Icon name="faRocket" /> Kom raskt i gang
      </SectionTitle>
      <ButtonGroup>
        {ALLE_MONTERING.map((m) => (
          <ButtonGroupBtn key={m} $active={config.montering === m} onClick={() => set({ montering: m })}>
            {MONTERING_INFO[m].navn}
          </ButtonGroupBtn>
        ))}
      </ButtonGroup>
      <PresetGrid style={{ marginTop: '0.5rem' }}>
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
            onChange={(e) => set({ [key]: parseFloat(e.target.value) } as Partial<CarportConfig>)}
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
              Takvinkel<Hjelp>brattere = mindre snølast</Hjelp>
            </span>
            <SliderValue>{config.takvinkel}°</SliderValue>
          </SliderLabel>
          <StyledSlider
            type="range"
            min={3}
            max={35}
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
        <Icon name="faSquare" /> Vegger / akrylvindu
      </SectionTitle>
      <ButtonGroup>
        {ALLE_VEGGTYPER.map((t: Veggtype) => (
          <ButtonGroupBtn key={t} $active={config.veggtype === t} onClick={() => set({ veggtype: t })}>
            {VEGG_INFO[t].navn}
          </ButtonGroupBtn>
        ))}
      </ButtonGroup>
      {config.veggtype !== 'ingen' && (
        <SideGrid>
          {ALLE_SIDER.map((side) => (
            <SideBtn key={side} $active={config.veggSider.includes(side)} onClick={() => toggleSide(side)}>
              {SIDE_INFO[side]}
            </SideBtn>
          ))}
        </SideGrid>
      )}

      {/* Snølast + byggeregler – «surprise» blåkopikort */}
      <SectionTitle>
        <Icon name="faClipboardList" /> Byggeregler & snølast
      </SectionTitle>
      <SliderGroup>
        <SliderLabel>
          <span>
            Snølast på mark<Hjelp>lokal verdi, sjekk kommunen</Hjelp>
          </span>
          <SliderValue>{config.snølast.toFixed(1)} kN/m²</SliderValue>
        </SliderLabel>
        <StyledSlider
          type="range"
          min={1.5}
          max={9}
          step={0.5}
          value={config.snølast}
          onChange={(e) => set({ snølast: parseFloat(e.target.value) })}
        />
      </SliderGroup>

      <RegCard $ok={reg.søknadsfri}>
        <RegHead $ok={reg.søknadsfri}>
          <Icon name={reg.søknadsfri ? 'faCheckCircle' : 'faExclamationTriangle'} />
          {reg.søknadsfri ? 'Trolig søknadsfri' : 'Søknad kreves'}
          <span className="status">{config.montering === 'frittstående' ? 'Frittstående' : 'Tilbygg'}</span>
        </RegHead>
        <RegBody>
          <div className="metrics">
            <div className="metric">
              <div className="k">Areal</div>
              <div className="v">{reg.areal.toFixed(1)} m²</div>
            </div>
            <div className="metric">
              <div className="k">Gesims</div>
              <div className="v">{reg.gesimshøyde.toFixed(1)} m</div>
            </div>
            <div className="metric">
              <div className="k">Møne</div>
              <div className="v">{reg.mønehøyde.toFixed(1)} m</div>
            </div>
          </div>
          <ul>
            {reg.merknader.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <DimNote $ok={dim.ok}>
            <Icon name={dim.ok ? 'faCheckCircle' : 'faExclamationTriangle'} />
            <span>{dim.melding}</span>
          </DimNote>
        </RegBody>
      </RegCard>

      {/* Avansert */}
      <Collapsible>
        <CollapsibleHead $open={advanced} onClick={() => setAdvanced((v) => !v)}>
          <Icon name="faTools" /> Materialer og priser
          <Icon name="faChevronDown" />
        </CollapsibleHead>
        {advanced && (
          <CollapsibleBody>
            <SectionTitle>Stolpedimensjon</SectionTitle>
            <ButtonGroup>
              {ALLE_STOLPEDIM.map((d) => (
                <ButtonGroupBtn key={d} $active={config.stolpeDim === d} onClick={() => handleStolpeDim(d)}>
                  {d.replace('x', '×')}
                </ButtonGroupBtn>
              ))}
            </ButtonGroup>
            <SectionTitle>Drager / spær / tverrbjelke</SectionTitle>
            <ButtonGroup>
              {ALLE_BJELKEDIM.map((d) => (
                <ButtonGroupBtn key={d} $active={config.bjelkeDim === d} onClick={() => handleBjelkeDim(d)}>
                  {d.replace('x', '×')}
                </ButtonGroupBtn>
              ))}
            </ButtonGroup>

            <SectionTitle>Konfigurasjon</SectionTitle>
            <NumRow label="Takutstikk" enhet="cm" value={Math.round(config.takutstikk * 100)} step={5} min={0} max={80} onChange={(v) => set({ takutstikk: v / 100 })} />
            <NumRow label="Stolpeavstand" enhet="m" value={config.stolpeAvstand} step={0.1} min={1.5} max={4} decimals={1} onChange={(v) => set({ stolpeAvstand: v })} />
            <NumRow label="Spæravstand" enhet="cm" value={Math.round(config.spærAvstand * 100)} step={5} min={30} max={120} onChange={(v) => set({ spærAvstand: v / 100 })} />
            <NumRow label="Skruer per kryss" enhet="stk" value={config.skruerPerKryss} step={1} min={1} max={8} onChange={(v) => set({ skruerPerKryss: v })} />
            <NumRow label="Kapp og svinn" enhet="%" value={config.svinnProsent} step={1} min={0} max={25} onChange={(v) => set({ svinnProsent: v })} />

            <SectionTitle>Priser</SectionTitle>
            <NumRow label="Stolper" enhet="kr/lm" value={config.prisStolpePrLm} step={1} min={0} max={999} onChange={(v) => set({ prisStolpePrLm: v })} />
            <NumRow label="Dragere/bjelker" enhet="kr/lm" value={config.prisDragerPrLm} step={1} min={0} max={999} onChange={(v) => set({ prisDragerPrLm: v })} />
            <NumRow label="Spær" enhet="kr/lm" value={config.prisSpærPrLm} step={1} min={0} max={999} onChange={(v) => set({ prisSpærPrLm: v })} />
            <NumRow label="Taktekke" enhet="kr/m²" value={config.prisTaktekkePerM2} step={10} min={0} max={2000} onChange={(v) => set({ prisTaktekkePerM2: v })} />
            <NumRow label="Sutak" enhet="kr/m²" value={config.prisSutakPerM2} step={5} min={0} max={999} onChange={(v) => set({ prisSutakPerM2: v })} />
            <NumRow label="Takrenne" enhet="kr/lm" value={config.prisTakrennePrLm} step={1} min={0} max={999} onChange={(v) => set({ prisTakrennePrLm: v })} />
            <NumRow label="Nedløp" enhet="kr/stk" value={config.prisNedløp} step={10} min={0} max={2000} onChange={(v) => set({ prisNedløp: v })} />
            <NumRow label="Akrylplate" enhet="kr/m²" value={config.prisAkrylPerM2} step={10} min={0} max={3000} onChange={(v) => set({ prisAkrylPerM2: v })} />
            <NumRow label="Veggpanel" enhet="kr/m²" value={config.prisVeggpanelPerM2} step={10} min={0} max={2000} onChange={(v) => set({ prisVeggpanelPerM2: v })} />
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
          <StatTop><Icon name="faTree" /> Stolper</StatTop>
          <StatVal>{r.stolpeAntall} stk</StatVal>
          <StatSub>{r.stolpeFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faHammer" /> Dragere</StatTop>
          <StatVal>{r.dragerLøpemeter.toFixed(0)} lm</StatVal>
          <StatSub>{r.dragerFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faTree" /> Spær</StatTop>
          <StatVal>{r.spærAntall} stk</StatVal>
          <StatSub>{r.spærFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faHammer" /> Tverrbjelker</StatTop>
          <StatVal>{r.tverrbjelkeAntall} stk</StatVal>
          <StatSub>{r.tverrbjelkeFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faTools" /> Knebånd</StatTop>
          <StatVal>{r.knebåndAntall} stk</StatVal>
          <StatSub>avstiving for stivhet</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faSquare" /> {TAKTEKKE_INFO[config.taktekke].navn}</StatTop>
          <StatVal>{r.takAreal.toFixed(1)} m²</StatVal>
          <StatSub>{r.taktekkeFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop><Icon name="faTruck" /> Avvanning</StatTop>
          <StatVal>{r.takrenneLøpemeter.toFixed(0)} lm</StatVal>
          <StatSub>{r.avvanningFormattert}</StatSub>
        </StatCard>
        {r.veggFormattert && (
          <StatCard>
            <StatTop><Icon name="faSquare" /> Vegger</StatTop>
            <StatVal>{config.veggSider.length} sider</StatVal>
            <StatSub>{r.veggFormattert}</StatSub>
          </StatCard>
        )}
      </ResultGrid>

      <CostBox>
        <CostRow><span>Stolper</span><span>{formatKr(r.stolpeKostnad)}</span></CostRow>
        <CostRow><span>Dragere</span><span>{formatKr(r.dragerKostnad)}</span></CostRow>
        <CostRow><span>Spær</span><span>{formatKr(r.spærKostnad)}</span></CostRow>
        <CostRow><span>Tverrbjelker</span><span>{formatKr(r.tverrbjelkeKostnad)}</span></CostRow>
        <CostRow><span>Knebånd</span><span>{formatKr(r.knebåndKostnad)}</span></CostRow>
        <CostRow><span>Taktekke</span><span>{formatKr(r.taktekkeKostnad)}</span></CostRow>
        {r.sutakKostnad != null && <CostRow><span>Sutak</span><span>{formatKr(r.sutakKostnad)}</span></CostRow>}
        <CostRow><span>Renne, nedløp, vindski</span><span>{formatKr(r.avvanningKostnad)}</span></CostRow>
        {r.veggKostnad != null && <CostRow><span>Vegger / akryl</span><span>{formatKr(r.veggKostnad)}</span></CostRow>}
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

      <DownloadButton onClick={() => lastNedMaterialliste(config, r, reg, snapshotRef?.current?.() ?? undefined)}>
        <Icon name="faDownload" /> Last ned materialliste (PDF)
      </DownloadButton>

      <CtaButton to="/kontakt">
        <Icon name="faPaperPlane" /> Be om tilbud på bygging
      </CtaButton>

      <Note>* Veiledende estimat og forenklet dimensjonering. Få alltid statisk beregning ved store spenn/snølaster. Kontakt oss for et konkret tilbud.</Note>
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
