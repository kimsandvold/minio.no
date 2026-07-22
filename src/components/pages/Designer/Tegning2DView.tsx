import styled from 'styled-components'
import Icon from '../../shared/Icon'
import type { Maal2D, Riss2D, Tegning2D } from '../../../designer/types'

/**
 * Målsatt 2D-arbeidstegning i arkitekt-/tegningsark-stil: hvitt ark med ramme,
 * riss i felles målestokk, målelinjer, målestokk-linjal og tittelfelt.
 * Rissene bygges av templatets `tegning2D()` (samme parametre som 3D-modellen).
 */

const MARGIN = 66 // cm luft rundt geometrien (plass til målelinjer + roterte tekster)
const FIT_W = 300 // maks tegneflate-bredde i px (ved felles målestokk)
const FIT_H = 300
const STROKE_PX = 1.7
const THIN_PX = 0.9
const FONT_PX = 11.5

interface Props {
  tegning: Tegning2D
  unlocked: boolean
  produktNavn: string
  designNavn?: string
  onExportPdf: () => void
  onExportPrint: () => void
}

// Én målelinje (horisontal/vertikal). Plasseres automatisk utenfor geometrien.
function MaalLinje({ m, riss, scale }: { m: Maal2D; riss: Riss2D; scale: number }) {
  const off = m.offset ?? 22
  const font = FONT_PX / scale
  const tick = font * 0.55
  const gap = (THIN_PX * 2) / scale
  const w = THIN_PX / scale
  const horisontal = Math.abs(m.y1 - m.y2) < 0.001
  const label = m.label
  const C = '#2f4b63'
  const CE = '#9db2c4'

  if (horisontal) {
    const below = m.y1 >= riss.hoyde / 2
    const y = m.y1 + (below ? off : -off)
    const midX = (m.x1 + m.x2) / 2
    return (
      <g>
        <line x1={m.x1} y1={m.y1 + (below ? gap : -gap)} x2={m.x1} y2={y} stroke={CE} strokeWidth={w} />
        <line x1={m.x2} y1={m.y2 + (below ? gap : -gap)} x2={m.x2} y2={y} stroke={CE} strokeWidth={w} />
        <line x1={m.x1} y1={y} x2={m.x2} y2={y} stroke={C} strokeWidth={w} />
        <line x1={m.x1} y1={y - tick} x2={m.x1 + tick} y2={y + tick} stroke={C} strokeWidth={w} />
        <line x1={m.x2} y1={y - tick} x2={m.x2 + tick} y2={y + tick} stroke={C} strokeWidth={w} />
        <text x={midX} y={y + (below ? font : -font * 0.5)} fontSize={font} textAnchor="middle" fill={C} fontWeight={700}>{label}</text>
      </g>
    )
  }

  const right = m.x1 >= riss.bredde / 2
  const x = m.x1 + (right ? off : -off)
  const midY = (m.y1 + m.y2) / 2
  const tx = x + (right ? font : -font * 0.5)
  return (
    <g>
      <line x1={m.x1 + (right ? gap : -gap)} y1={m.y1} x2={x} y2={m.y1} stroke={CE} strokeWidth={w} />
      <line x1={m.x2 + (right ? gap : -gap)} y1={m.y2} x2={x} y2={m.y2} stroke={CE} strokeWidth={w} />
      <line x1={x} y1={m.y1} x2={x} y2={m.y2} stroke={C} strokeWidth={w} />
      <line x1={x - tick} y1={m.y1} x2={x + tick} y2={m.y1 + tick} stroke={C} strokeWidth={w} />
      <line x1={x - tick} y1={m.y2} x2={x + tick} y2={m.y2 + tick} stroke={C} strokeWidth={w} />
      <text x={tx} y={midY} fontSize={font} textAnchor="middle" transform={`rotate(-90 ${tx} ${midY})`} fill={C} fontWeight={700}>{label}</text>
    </g>
  )
}

function RissBlokk({ riss, scale }: { riss: Riss2D; scale: number }) {
  const totalW = riss.bredde + 2 * MARGIN
  const totalH = riss.hoyde + 2 * MARGIN
  const sw = STROKE_PX / scale
  const tw = THIN_PX / scale
  const font = FONT_PX / scale

  return (
    <Blokk>
      <svg width={totalW * scale} height={totalH * scale} viewBox={`0 0 ${totalW} ${totalH}`} style={{ maxWidth: '100%', overflow: 'visible' }}>
        <g transform={`translate(${MARGIN}, ${MARGIN})`}>
          {riss.former.map((f, i) => {
            const stroke = f.tynn ? tw : sw
            const dash = f.dashed ? `${sw * 3} ${sw * 2}` : undefined
            if (f.type === 'rect') {
              return <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} fill="none" stroke="#161616" strokeWidth={stroke} strokeDasharray={dash} strokeLinejoin="miter" />
            }
            const pts = (f.points ?? []).map((p) => p.join(',')).join(' ')
            return <polyline key={i} points={pts} fill="none" stroke={f.tynn ? '#5c5c5c' : '#161616'} strokeWidth={stroke} strokeDasharray={dash} strokeLinejoin="miter" strokeLinecap="square" />
          })}
          <g>
            {riss.maal.map((m, i) => (
              <MaalLinje key={i} m={m} riss={riss} scale={scale} />
            ))}
          </g>
          {riss.tekster?.map((t, i) => (
            <text key={i} x={t.x} y={t.y} fontSize={font} textAnchor="middle" fill="#2f4b63" fontStyle="italic">{t.tekst}</text>
          ))}
        </g>
      </svg>
      <BlokkNavn>{riss.navn}</BlokkNavn>
    </Blokk>
  )
}

// Grafisk målestokk-linjal (0–100 cm) i gjeldende felles målestokk.
function Malestokk({ scale }: { scale: number }) {
  const seg = 50 // cm pr. segment
  const n = 2
  const px = (cm: number) => cm * scale
  const pad = 10
  return (
    <ScaleWrap>
      <svg width={px(seg * n) + pad * 2} height={22}>
        {Array.from({ length: n }).map((_, i) => (
          <rect key={i} x={pad + px(seg * i)} y={4} width={px(seg)} height={7} fill={i % 2 ? '#161616' : '#fff'} stroke="#161616" strokeWidth={0.8} />
        ))}
        {Array.from({ length: n + 1 }).map((_, i) => (
          <text key={i} x={pad + px(seg * i)} y={20} fontSize={8} textAnchor={i === 0 ? 'start' : i === n ? 'end' : 'middle'} fill="#161616">{seg * i}</text>
        ))}
      </svg>
      <span>cm</span>
    </ScaleWrap>
  )
}

export default function Tegning2DView({ tegning, unlocked, produktNavn, designNavn, onExportPdf, onExportPrint }: Props) {
  // Felles målestokk for alle riss (som på et ekte tegningsark).
  const scale = Math.min(
    ...tegning.riss.map((r) => Math.min(FIT_W / (r.bredde + 2 * MARGIN), FIT_H / (r.hoyde + 2 * MARGIN))),
  )

  return (
    <Wrap>
      <Bar>
        <span><Icon name="faRulerCombined" /> Arbeidstegning</span>
        <BarActions>
          <BarBtn onClick={onExportPdf}><Icon name={unlocked ? 'faDownload' : 'faLock'} /> PDF</BarBtn>
          <BarBtn onClick={onExportPrint}><Icon name={unlocked ? 'faPrint' : 'faLock'} /> Skriv ut</BarBtn>
        </BarActions>
      </Bar>

      <SheetScroll>
        <Sheet>
          <Frame>
            <Views>
              {tegning.riss.map((r) => (
                <RissBlokk key={r.id} riss={r} scale={scale} />
              ))}
            </Views>

            <TitleBlock>
              <Brand>
                <img src="/images/branding/logo_navbar.webp" alt="Minio" />
                <em>arbeidstegning</em>
              </Brand>
              <Rows>
                <Row><b>Prosjekt</b><span>{produktNavn}</span></Row>
                <Row><b>Tegning</b><span>{designNavn || 'Uten navn'}</span></Row>
                <Row><b>Enhet</b><span>cm</span></Row>
                <Row><b>Riss</b><span>{tegning.riss.length} stk</span></Row>
              </Rows>
              <ScaleCell>
                <b>Målestokk</b>
                <Malestokk scale={scale} />
              </ScaleCell>
            </TitleBlock>
          </Frame>
        </Sheet>
      </SheetScroll>
    </Wrap>
  )
}

const Wrap = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #6b6f76;
`

const Bar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 1rem;
  background: rgba(20, 22, 26, 0.55);
  color: #fff;
  span { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; }
`

const BarActions = styled.div`
  display: flex;
  gap: 0.5rem;
`

const BarBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.16); }
`

const SheetScroll = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1.5rem;
`

/* A4-landskap (297 × 210 mm) – arket beholder proporsjonene på skjerm og print. */
const Sheet = styled.div`
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100%;
  max-width: 720px;
  aspect-ratio: 210 / 297;
  padding: 10px;
  background: #fdfcf9;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
`

const Frame = styled.div`
  box-sizing: border-box;
  height: 100%;
  border: 2px solid #161616;
  padding: 1.2rem 1.2rem 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const Views = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  gap: 0.6rem;
  padding-bottom: 1rem;
  overflow: hidden;
`

const Blokk = styled.figure`
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`

const BlokkNavn = styled.figcaption`
  padding-top: 0.35rem;
  border-top: 1.5px solid #161616;
  min-width: 120px;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #161616;
`

const TitleBlock = styled.div`
  display: flex;
  align-items: stretch;
  border-top: 2px solid #161616;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
`

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.7rem 1rem;
  border-right: 1px solid #161616;
  img { height: 20px; width: auto; object-fit: contain; }
  em { font-style: normal; font-size: 0.62rem; letter-spacing: 0.14em; text-transform: uppercase; color: #6b6860; }
`

const Rows = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
`

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.4rem 0.7rem;
  border-right: 1px solid rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  b { font-size: 0.56rem; letter-spacing: 0.1em; text-transform: uppercase; color: #8a877e; font-weight: 700; }
  span { font-size: 0.82rem; font-weight: 700; color: #161616; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`

const ScaleCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.5rem 0.9rem;
  border-left: 1px solid #161616;
  b { font-size: 0.56rem; letter-spacing: 0.1em; text-transform: uppercase; color: #8a877e; font-weight: 700; }
`

const ScaleWrap = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.35rem;
  span { font-size: 0.62rem; color: #6b6860; }
`
