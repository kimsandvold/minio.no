import { useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import type { PlanArgs } from '../../../designer/pdf'
import { usePlanSider } from './usePlanSider'

/**
 * 2D-tegningene – nøyaktig de samme tegningsarkene som i byggeplanen
 * (plan, oppriss, snitt og detaljer i ekte målestokk, med tegningshode).
 * Før kjøp er alle måltall skjult; geometrien vises.
 */

interface Props {
  lagArgs: () => PlanArgs | null
  nokkel: string
  unlocked: boolean
  onExportPdf: () => void
  onExportPrint: () => void
}

export default function Tegning2DView({ lagArgs, nokkel, unlocked, onExportPdf, onExportPrint }: Props) {
  const { sider, laster, feil } = usePlanSider(lagArgs, nokkel, !unlocked, true, (s) => s.type === 'ark')
  const [valgt, setValgt] = useState(0)
  const [zoom, setZoom] = useState(1)
  const side = sider[Math.min(valgt, Math.max(0, sider.length - 1))]

  return (
    <Wrap>
      <Bar>
        <Tabs role="tablist" aria-label="Tegningsark">
          {sider.map((s, i) => {
            const [nr, ...rest] = s.navn.split(' ')
            return (
              <Tab key={s.url} role="tab" aria-selected={i === valgt} $aktiv={i === valgt} onClick={() => { setValgt(i); setZoom(1) }} title={s.navn}>
                <b>{nr}</b><span>{rest.join(' ')}</span>
              </Tab>
            )
          })}
          {laster && !sider.length && <TabSkel>Tegner …</TabSkel>}
        </Tabs>
        <BarActions>
          <BarBtn onClick={() => setZoom((z) => (z >= 2 ? 1 : z + 0.5))} title="Zoom" aria-label="Zoom"><Icon name={zoom >= 2 ? 'faMinus' : 'faPlus'} /></BarBtn>
          <BarBtn onClick={onExportPdf}><Icon name={unlocked ? 'faDownload' : 'faLock'} /> PDF</BarBtn>
          <BarBtn onClick={onExportPrint} className="print"><Icon name={unlocked ? 'faPrint' : 'faLock'} /> Skriv ut</BarBtn>
        </BarActions>
      </Bar>

      <SheetScroll>
        {feil && <Melding>Kunne ikke tegne arkene.</Melding>}
        {!side && !feil && <Melding><Icon name="faSpinner" spin /> Tegner arkene …</Melding>}
        {side && (
          <Sheet style={{ width: `${zoom * 100}%`, maxWidth: zoom === 1 ? 1100 : 'none' }}>
            <img src={side.url} alt={side.navn} />
            {laster && <Oppdaterer><Icon name="faSpinner" spin /></Oppdaterer>}
          </Sheet>
        )}
      </SheetScroll>
      {!unlocked && side && (
        <LaastNote>
          <Icon name="faLock" /> Måltallene vises i den kjøpte byggeplanen
        </LaastNote>
      )}
    </Wrap>
  )
}

const Wrap = styled.div`
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  background: #6b6f76;
`
const Bar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 3.6rem 0.8rem 0.55rem;
  background: rgba(20, 22, 26, 0.6);
  color: #fff;
  @media (max-width: 820px) { padding-top: 3.2rem; flex-wrap: wrap; }
`
const Tabs = styled.div`
  display: flex;
  gap: 0.35rem;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`
const Tab = styled.button<{ $aktiv: boolean }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  max-width: 230px;
  padding: 0.42rem 0.7rem;
  border-radius: 8px;
  border: 1px solid ${({ $aktiv }) => ($aktiv ? '#fff' : 'rgba(255,255,255,0.18)')};
  background: ${({ $aktiv }) => ($aktiv ? '#fff' : 'rgba(255,255,255,0.06)')};
  color: ${({ $aktiv }) => ($aktiv ? '#15171b' : '#e7eaef')};
  cursor: pointer;
  font-size: 0.78rem;
  b { font-weight: 800; white-space: nowrap; }
  span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`
const TabSkel = styled.span`
  font-size: 0.8rem;
  color: #c1c8d1;
`
const BarActions = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
  @media (max-width: 820px) { .print { display: none; } }
`
const BarBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.75rem;
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
  padding: 1rem;
`
/* A4 liggende (297 × 210 mm). */
const Sheet = styled.div`
  position: relative;
  flex-shrink: 0;
  aspect-ratio: 297 / 210;
  background: #fff;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  img { width: 100%; height: 100%; display: block; }
`
const Oppdaterer = styled.div`
  position: absolute;
  right: 10px;
  top: 10px;
  color: #6b6f76;
`
const Melding = styled.p`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  font-size: 0.9rem;
`
const LaastNote = styled.div`
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: rgba(16, 18, 22, 0.85);
  color: #fff;
  font-size: 0.78rem;
  white-space: nowrap;
`
