import { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../../shared/Icon'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import {
  type TerrasseConfig,
  type TerrasseForm,
  type Bjelkedimensjon,
  type Trapp,
  FORM_INFO,
  GJERDE_INFO,
  SIDE_INFO,
  BJELKE_INFO,
  DEFAULT_CONFIG,
  MÅLEFELT,
  ALLE_FORMER,
  ALLE_GJERDETYPER,
  ALLE_SIDER,
  ALLE_BJELKEDIM,
  beregn,
  formatKr,
  nyTrapp,
} from './terrasseModel'
import { lastNedMaterialliste } from './terrassePdf'

interface Props {
  config: TerrasseConfig
  onChange: (config: TerrasseConfig) => void
}

interface LagretProsjekt {
  id: string
  navn: string
  dato: string
  config: TerrasseConfig
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

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.5rem;
`

const FormBtn = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 0.5rem 0.2rem 0.4rem;
  font-size: 0.6rem;
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
  gap: 0.35rem;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: #fafafa;
  }

  svg {
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    width: 30px;
    height: 24px;
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

const TrappCard = styled.div`
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.6rem;
  background: #fafafa;
`

const TrappHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
`

const DeleteBtn = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.error};
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.2rem 0.35rem;
`

const AddBtn = styled.button`
  width: 100%;
  padding: 0.6rem;
  border: 1px dashed #bbb;
  background: #fff;
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.textDark};
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;

  &:hover {
    background: #fafafa;
  }
`

const EmptyNote = styled.p`
  font-size: 0.72rem;
  color: #999;
  margin: 0 0 0.6rem;
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

const TextInput = styled.input`
  flex: 1;
  padding: 0.45rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.78rem;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.textDark};
  }
`

const SmallBtn = styled.button`
  padding: 0.45rem 0.7rem;
  border: 1px solid ${({ theme }) => theme.colors.textDark};
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const ProjectItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
  font-size: 0.78rem;

  &:last-child {
    border-bottom: none;
  }

  .meta {
    flex: 1;
    min-width: 0;
  }
  .navn {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
  }
  .dato {
    font-size: 0.62rem;
    color: #aaa;
  }
`

const LinkBtn = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.textDark};
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 600;
  text-decoration: underline;
  padding: 0.2rem;
`

// ── Form-ikoner ──────────────────────────────────────────────────────────────

function FormIcon({ form }: { form: TerrasseForm }) {
  switch (form) {
    case 'rektangel':
      return (
        <svg viewBox="0 0 30 24" aria-hidden>
          <rect x="3" y="6" width="24" height="12" rx="1" />
        </svg>
      )
    case 'lForm':
      return (
        <svg viewBox="0 0 30 24" aria-hidden>
          <path d="M4 4 L16 4 L16 13 L26 13 L26 20 L4 20 Z" />
        </svg>
      )
    case 'uForm':
      return (
        <svg viewBox="0 0 30 24" aria-hidden>
          <path d="M4 4 L10 4 L10 14 L20 14 L20 4 L26 4 L26 20 L4 20 Z" />
        </svg>
      )
  }
}

export default function TerrasseCalculator({ config, onChange }: Props) {
  const [advanced, setAdvanced] = useState(false)
  const [prosjektÅpen, setProsjektÅpen] = useState(true)
  const [navn, setNavn] = useState('')
  const [prosjekter, setProsjekter] = useLocalStorage<LagretProsjekt[]>('terrasse-prosjekter', [])

  const r = beregn(config)
  const set = (patch: Partial<TerrasseConfig>) => onChange({ ...config, ...patch })

  const handleForm = (form: TerrasseForm) => set({ form })

  const handleBjelkeDim = (dim: Bjelkedimensjon) =>
    set({ bjelkeDimensjon: dim, prisBjelkePrLm: BJELKE_INFO[dim].standardpris })

  const updateTrapp = (id: string, patch: Partial<Trapp>) =>
    set({ trapper: config.trapper.map((t) => (t.id === id ? { ...t, ...patch } : t)) })

  const leggTilTrapp = () => set({ trapper: [...config.trapper, nyTrapp()] })
  const fjernTrapp = (id: string) => set({ trapper: config.trapper.filter((t) => t.id !== id) })

  const lagre = () => {
    const trimmed = navn.trim()
    if (!trimmed) return
    const prosjekt: LagretProsjekt = {
      id: `${trimmed}-${prosjekter.length}-${config.form}`,
      navn: trimmed,
      dato: new Date().toLocaleDateString('nb-NO'),
      config,
    }
    setProsjekter([prosjekt, ...prosjekter.filter((p) => p.navn !== trimmed)])
    setNavn('')
  }

  const lastInn = (p: LagretProsjekt) => onChange({ ...DEFAULT_CONFIG, ...p.config })
  const slett = (id: string) => setProsjekter(prosjekter.filter((p) => p.id !== id))

  return (
    <Container>
      {/* Form */}
      <SectionTitle>
        <Icon name="faRulerCombined" /> Velg form
      </SectionTitle>
      <FormGrid>
        {ALLE_FORMER.map((form) => (
          <FormBtn key={form} $active={config.form === form} onClick={() => handleForm(form)}>
            <FormIcon form={form} />
            {FORM_INFO[form].navn}
          </FormBtn>
        ))}
      </FormGrid>

      {/* Mål */}
      <SectionTitle>Mål</SectionTitle>
      {MÅLEFELT[config.form].map(([key, label, min, max, step, hjelp]) => (
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
            onChange={(e) => set({ [key]: parseFloat(e.target.value) } as Partial<TerrasseConfig>)}
          />
        </SliderGroup>
      ))}

      {/* Gjerde */}
      <SectionTitle>
        <Icon name="faSquare" /> Gjerde / rekkverk
      </SectionTitle>
      <ButtonGroup>
        {ALLE_GJERDETYPER.map((type) => (
          <ButtonGroupBtn key={type} $active={config.gjerdeType === type} onClick={() => set({ gjerdeType: type })}>
            {GJERDE_INFO[type].navn}
          </ButtonGroupBtn>
        ))}
      </ButtonGroup>
      {config.gjerdeType !== 'ingen' && (
        <div style={{ marginTop: '0.75rem' }}>
          <SliderGroup>
            <SliderLabel>
              <span>Høyde</span>
              <SliderValue>{config.gjerdeHøyde.toFixed(1)} m</SliderValue>
            </SliderLabel>
            <StyledSlider
              type="range"
              min={0.3}
              max={2.0}
              step={0.1}
              value={config.gjerdeHøyde}
              onChange={(e) => set({ gjerdeHøyde: parseFloat(e.target.value) })}
            />
          </SliderGroup>
          <ButtonGroup>
            <ButtonGroupBtn $active={config.gjerdePåAlleSider} onClick={() => set({ gjerdePåAlleSider: true })}>
              Alle sider
            </ButtonGroupBtn>
            <ButtonGroupBtn $active={!config.gjerdePåAlleSider} onClick={() => set({ gjerdePåAlleSider: false })}>
              Halve omkretsen
            </ButtonGroupBtn>
          </ButtonGroup>
        </div>
      )}

      {/* Trapp */}
      <SectionTitle>
        <Icon name="faChartBar" /> Trapp / utgang
      </SectionTitle>
      {config.trapper.length === 0 && (
        <EmptyNote>Ingen trapper. Legg til en og velg hvilken kant den skal stå på.</EmptyNote>
      )}
      {config.trapper.map((t, i) => (
        <TrappCard key={t.id}>
          <TrappHead>
            <strong style={{ fontSize: '0.78rem' }}>Trapp {i + 1}</strong>
            <DeleteBtn onClick={() => fjernTrapp(t.id)} aria-label="Fjern trapp">
              <Icon name="faTrash" />
            </DeleteBtn>
          </TrappHead>
          <ButtonGroup>
            {ALLE_SIDER.map((side) => (
              <ButtonGroupBtn key={side} $active={t.side === side} onClick={() => updateTrapp(t.id, { side })}>
                {SIDE_INFO[side]}
              </ButtonGroupBtn>
            ))}
          </ButtonGroup>
          <SliderGroup style={{ marginTop: '0.6rem' }}>
            <SliderLabel>
              <span>Plassering langs kanten</span>
              <SliderValue>{t.posisjon < 0.34 ? 'Mot start' : t.posisjon < 0.67 ? 'Midt' : 'Mot slutt'}</SliderValue>
            </SliderLabel>
            <StyledSlider
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={t.posisjon}
              onChange={(e) => updateTrapp(t.id, { posisjon: parseFloat(e.target.value) })}
            />
          </SliderGroup>
          <Row>
            <span>Bredde</span>
            <Stepper>
              <StepBtn onClick={() => updateTrapp(t.id, { bredde: Math.max(0.5, +(t.bredde - 0.1).toFixed(1)) })}>
                <Icon name="faMinus" />
              </StepBtn>
              <StepVal>{t.bredde.toFixed(1)} m</StepVal>
              <StepBtn onClick={() => updateTrapp(t.id, { bredde: Math.min(4, +(t.bredde + 0.1).toFixed(1)) })}>
                <Icon name="faPlus" />
              </StepBtn>
            </Stepper>
          </Row>
          <Row>
            <span>Antall trinn</span>
            <Stepper>
              <StepBtn onClick={() => updateTrapp(t.id, { antallTrinn: Math.max(1, t.antallTrinn - 1) })}>
                <Icon name="faMinus" />
              </StepBtn>
              <StepVal>{t.antallTrinn}</StepVal>
              <StepBtn onClick={() => updateTrapp(t.id, { antallTrinn: Math.min(20, t.antallTrinn + 1) })}>
                <Icon name="faPlus" />
              </StepBtn>
            </Stepper>
          </Row>
        </TrappCard>
      ))}
      <AddBtn onClick={leggTilTrapp}>
        <Icon name="faPlus" /> Legg til trapp
      </AddBtn>

      {/* Avansert: materialer og priser */}
      <Collapsible>
        <CollapsibleHead $open={advanced} onClick={() => setAdvanced((v) => !v)}>
          <Icon name="faTools" /> Materialer og priser
          <Icon name="faChevronDown" />
        </CollapsibleHead>
        {advanced && (
          <CollapsibleBody>
            <SectionTitle>Bjelkedimensjon</SectionTitle>
            <ButtonGroup>
              {ALLE_BJELKEDIM.map((dim) => (
                <ButtonGroupBtn key={dim} $active={config.bjelkeDimensjon === dim} onClick={() => handleBjelkeDim(dim)}>
                  {dim.replace('x', '×')}
                </ButtonGroupBtn>
              ))}
            </ButtonGroup>

            <SectionTitle>Konfigurasjon</SectionTitle>
            <NumRow label="Bordbredde" enhet="mm" value={config.bordbredde} step={1} min={60} max={198} onChange={(v) => set({ bordbredde: v })} />
            <NumRow label="Bordavstand" enhet="mm" value={config.bordavstand} step={1} min={2} max={20} onChange={(v) => set({ bordavstand: v })} />
            <NumRow label="Bjelkeavstand" enhet="mm" value={config.bjelkeavstand} step={100} min={300} max={1200} onChange={(v) => set({ bjelkeavstand: v })} />
            <NumRow label="Skruer per kryss" enhet="stk" value={config.skruerPerKryss} step={1} min={1} max={4} onChange={(v) => set({ skruerPerKryss: v })} />

            <SectionTitle>Priser</SectionTitle>
            <NumRow label="Terrassebord" enhet="kr/lm" value={config.prisBordPrLm} step={1} min={0} max={999} onChange={(v) => set({ prisBordPrLm: v })} />
            <NumRow label="Bjelker" enhet="kr/lm" value={config.prisBjelkePrLm} step={1} min={0} max={999} onChange={(v) => set({ prisBjelkePrLm: v })} />
            <NumRow label="Skruer" enhet="kr/stk" value={config.prisSkrue} step={1} min={0} max={99} onChange={(v) => set({ prisSkrue: v })} />
            <NumRow label="Gjerdebord" enhet="kr/stk" value={config.prisGjerdeBord} step={1} min={0} max={999} onChange={(v) => set({ prisGjerdeBord: v })} />
            <NumRow label="Lekt" enhet="kr/lm" value={config.prisLekt} step={1} min={0} max={999} onChange={(v) => set({ prisLekt: v })} />
            <NumRow label="Stolper" enhet="kr/stk" value={config.prisStolpe} step={1} min={0} max={999} onChange={(v) => set({ prisStolpe: v })} />
          </CollapsibleBody>
        )}
      </Collapsible>

      {/* Mine prosjekter */}
      <Collapsible>
        <CollapsibleHead $open={prosjektÅpen} onClick={() => setProsjektÅpen((v) => !v)}>
          <Icon name="faFolderOpen" /> Mine prosjekter {prosjekter.length > 0 && `(${prosjekter.length})`}
          <Icon name="faChevronDown" />
        </CollapsibleHead>
        {prosjektÅpen && (
          <CollapsibleBody>
            <Row style={{ marginBottom: '0.75rem' }}>
              <TextInput
                type="text"
                placeholder="F.eks. Terrasse sørvest"
                value={navn}
                onChange={(e) => setNavn(e.target.value)}
              />
              <SmallBtn onClick={lagre} disabled={!navn.trim()}>
                <Icon name="faSave" /> Lagre
              </SmallBtn>
            </Row>
            {prosjekter.length === 0 ? (
              <EmptyNote>Lagre terrasseprosjektene dine, så finner du dem igjen her – også neste gang.</EmptyNote>
            ) : (
              prosjekter.map((p) => (
                <ProjectItem key={p.id}>
                  <div className="meta">
                    <div className="navn">{p.navn}</div>
                    <div className="dato">
                      {FORM_INFO[p.config.form].navn} · {p.dato}
                    </div>
                  </div>
                  <LinkBtn onClick={() => lastInn(p)}>Åpne</LinkBtn>
                  <DeleteBtn onClick={() => slett(p.id)} aria-label="Slett prosjekt">
                    <Icon name="faTrash" />
                  </DeleteBtn>
                </ProjectItem>
              ))
            )}
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
          <div className="label">Totalt areal</div>
          <div className="value">{r.arealFormattert}</div>
        </div>
      </ArealCard>

      <ResultGrid>
        <StatCard>
          <StatTop>
            <Icon name="faTree" /> Terrassebord
          </StatTop>
          <StatVal>{r.bordLøpemeter.toFixed(0)} lm</StatVal>
          <StatSub>{r.bordFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop>
            <Icon name="faHammer" /> Bjelker
          </StatTop>
          <StatVal>{r.bjelkeAntall} stk</StatVal>
          <StatSub>{r.bjelkeFormattert}</StatSub>
        </StatCard>
        <StatCard>
          <StatTop>
            <Icon name="faTools" /> Skruer
          </StatTop>
          <StatVal>{r.skrueAntall}</StatVal>
          <StatSub>{r.skrueFormattert}</StatSub>
        </StatCard>
        {config.gjerdeType !== 'ingen' && (
          <StatCard>
            <StatTop>
              <Icon name="faSquare" /> {GJERDE_INFO[config.gjerdeType].navn}
            </StatTop>
            <StatVal>{r.gjerdeBordAntall ?? 0} bord</StatVal>
            <StatSub>{r.gjerdeStolper ?? 0} stolper</StatSub>
          </StatCard>
        )}
        {r.trappFormattert && (
          <StatCard>
            <StatTop>
              <Icon name="faChartBar" /> Trapp
            </StatTop>
            <StatVal>{r.trappTrinnAntall ?? 0} trinn</StatVal>
            <StatSub>{r.trappFormattert}</StatSub>
          </StatCard>
        )}
      </ResultGrid>

      <CostBox>
        <CostRow>
          <span>Terrassebord</span>
          <span>{formatKr(r.bordKostnad)}</span>
        </CostRow>
        <CostRow>
          <span>Bjelkelag</span>
          <span>{formatKr(r.bjelkeKostnad)}</span>
        </CostRow>
        <CostRow>
          <span>Skruer</span>
          <span>{formatKr(r.skrueKostnad)}</span>
        </CostRow>
        {r.gjerdeKostnad != null && (
          <CostRow>
            <span>Gjerde</span>
            <span>{formatKr(r.gjerdeKostnad)}</span>
          </CostRow>
        )}
        {r.trappKostnad != null && (
          <CostRow>
            <span>Trapp</span>
            <span>{formatKr(r.trappKostnad)}</span>
          </CostRow>
        )}
        <CostTotal>
          <span>Estimert materialkostnad</span>
          <span>{formatKr(r.totalKostnad)}</span>
        </CostTotal>
      </CostBox>

      <DownloadButton onClick={() => lastNedMaterialliste(config, r)}>
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
  onChange,
}: {
  label: string
  enhet: string
  value: number
  step: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  return (
    <Row>
      <span>{label}</span>
      <Stepper>
        <StepBtn onClick={() => onChange(clamp(value - step))} disabled={value <= min}>
          <Icon name="faMinus" />
        </StepBtn>
        <StepVal>
          {value} {enhet}
        </StepVal>
        <StepBtn onClick={() => onChange(clamp(value + step))} disabled={value >= max}>
          <Icon name="faPlus" />
        </StepBtn>
      </Stepper>
    </Row>
  )
}
