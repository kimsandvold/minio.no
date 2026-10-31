import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import Icon from '../../shared/Icon'
import type { PlanArgs } from '../../../designer/pdf'
import { usePlanSider } from './usePlanSider'

/**
 * Forhåndsvisning av byggeplanen – de ekte sidene (samme komposisjon som
 * PDF-en). Før kjøp vises forside og prosjektinfo åpent; resten er uskarpt
 * og alle tall/mål er skjult, så kunden ser omfanget uten å få planen gratis.
 */

interface Props {
  lagArgs: () => PlanArgs | null
  nokkel: string
  laast: boolean
  pris: string
  onKjop: () => void
  onLastNed: () => void
  onClose: () => void
}

const APNE = 2 // forside + prosjektinfo er synlige før kjøp

export default function ByggeplanForhandsvisning({ lagArgs, nokkel, laast, pris, onKjop, onLastNed, onClose }: Props) {
  const { sider, laster, feil } = usePlanSider(lagArgs, nokkel, laast, true)
  const [valgt, setValgt] = useState(0)
  const side = sider[Math.min(valgt, sider.length - 1)]
  const skjult = (i: number) => laast && i >= APNE

  useEffect(() => {
    const tast = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setValgt((v) => Math.min(sider.length - 1, v + 1))
      if (e.key === 'ArrowLeft') setValgt((v) => Math.max(0, v - 1))
    }
    window.addEventListener('keydown', tast)
    return () => window.removeEventListener('keydown', tast)
  }, [onClose, sider.length])

  const antallArk = sider.filter((s) => s.type === 'ark').length

  return (
    <Overlay onClick={onClose} role="dialog" aria-modal="true" aria-label="Forhåndsvisning av byggeplanen">
      <Box onClick={(e) => e.stopPropagation()}>
        <Head>
          <div>
            <h3>Byggeplanen din</h3>
            <p>{sider.length ? `${sider.length} sider · ${antallArk} tegningsark · materialliste, kappliste og montering` : 'Lager forhåndsvisning …'}</p>
          </div>
          <HeadActions>
            {laast ? (
              <Primary onClick={onKjop}><Icon name="faLock" /> Kjøp byggeplan · {pris}</Primary>
            ) : (
              <Primary onClick={onLastNed}><Icon name="faDownload" /> Last ned PDF</Primary>
            )}
            <Close onClick={onClose} aria-label="Lukk"><Icon name="faXmark" /></Close>
          </HeadActions>
        </Head>

        <Main>
          <Thumbs>
            {laster && !sider.length && Array.from({ length: 8 }).map((_, i) => <ThumbSkel key={i} />)}
            {sider.map((s, i) => (
              <Thumb key={s.url} $aktiv={i === valgt} $liggende={s.liggende} onClick={() => setValgt(i)} aria-label={`Side ${i + 1}: ${s.navn}`}>
                <img src={s.url} alt="" style={skjult(i) ? { filter: 'blur(2px)' } : undefined} />
                <span>{i + 1}</span>
                {skjult(i) && <ThumbLock><Icon name="faLock" /></ThumbLock>}
              </Thumb>
            ))}
          </Thumbs>
          <Viewer>
            {feil && <Melding>Kunne ikke lage forhåndsvisningen. Prøv igjen.</Melding>}
            {!side && !feil && <Spinner><Icon name="faSpinner" spin /> Tegner sidene …</Spinner>}
            {side && (
              <Page $liggende={side.liggende}>
                <img src={side.url} alt={side.navn} style={skjult(valgt) ? { filter: `blur(${side.type === 'ark' ? 2.2 : 3.2}px)` } : undefined} />
                {skjult(valgt) && (
                  <LockCard>
                    <Icon name="faLock" />
                    <b>{side.navn}</b>
                    <span>Mål, mengder og lengder låses opp når du kjøper byggeplanen.</span>
                    <Primary onClick={onKjop}>Kjøp byggeplan · {pris}</Primary>
                  </LockCard>
                )}
              </Page>
            )}
            {side && (
              <PageNav>
                <button type="button" onClick={() => setValgt((v) => Math.max(0, v - 1))} disabled={valgt === 0} aria-label="Forrige side"><Icon name="faArrowLeft" /></button>
                <span>{valgt + 1} / {sider.length} · {side.navn}</span>
                <button type="button" onClick={() => setValgt((v) => Math.min(sider.length - 1, v + 1))} disabled={valgt >= sider.length - 1} aria-label="Neste side"><Icon name="faArrowRight" /></button>
              </PageNav>
            )}
          </Viewer>
        </Main>
      </Box>
    </Overlay>
  )
}

const inn = keyframes`from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; }`
const puls = keyframes`0%, 100% { opacity: 0.45; } 50% { opacity: 0.8; }`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2vh 2vw;
  background: rgba(10, 12, 16, 0.72);
  backdrop-filter: blur(4px);
`
const Box = styled.div`
  width: min(1180px, 100%);
  height: min(860px, 100%);
  display: flex;
  flex-direction: column;
  background: #15171b;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
  animation: ${inn} 0.22s ease;
  color: #eaedf1;
`
const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  h3 { margin: 0; font-size: 1.05rem; }
  p { margin: 0.15rem 0 0; font-size: 0.8rem; color: #979fa9; }
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
  }
`
const HeadActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  @media (max-width: 640px) { justify-content: space-between; }
`
const Primary = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 10px;
  background: #5b63c4;
  color: #fff;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #4b53b0; }
`
const Close = styled.button`
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: transparent;
  color: #c1c8d1;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
`
const Main = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  @media (max-width: 760px) { flex-direction: column-reverse; }
`
const Thumbs = styled.div`
  width: 168px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  @media (max-width: 760px) {
    width: auto;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    border-right: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding: 0.6rem;
  }
`
const Thumb = styled.button<{ $aktiv: boolean; $liggende: boolean }>`
  position: relative;
  flex-shrink: 0;
  padding: 0;
  border: 2px solid ${({ $aktiv }) => ($aktiv ? '#7880dc' : 'transparent')};
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  overflow: hidden;
  aspect-ratio: ${({ $liggende }) => ($liggende ? '297 / 210' : '210 / 297')};
  width: ${({ $liggende }) => ($liggende ? '100%' : '72%')};
  align-self: center;
  img { width: 100%; height: 100%; display: block; object-fit: contain; }
  span {
    position: absolute;
    left: 4px;
    bottom: 4px;
    padding: 0 0.3rem;
    border-radius: 4px;
    background: rgba(16, 18, 22, 0.75);
    color: #fff;
    font-size: 0.62rem;
    font-weight: 700;
  }
  @media (max-width: 760px) {
    width: auto;
    height: 84px;
  }
`
const ThumbSkel = styled.div`
  flex-shrink: 0;
  height: 150px;
  border-radius: 6px;
  background: #2a2e35;
  animation: ${puls} 1.2s ease-in-out infinite;
  @media (max-width: 760px) { width: 60px; height: 84px; }
`
const ThumbLock = styled.i`
  position: absolute;
  right: 4px;
  top: 4px;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(16, 18, 22, 0.75);
  color: #fff;
  font-size: 0.55rem;
`
const Viewer = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  padding: 1rem;
  background: #6b6f76;
`
const Page = styled.div<{ $liggende: boolean }>`
  position: relative;
  max-width: 100%;
  max-height: calc(100% - 3rem);
  aspect-ratio: ${({ $liggende }) => ($liggende ? '297 / 210' : '210 / 297')};
  height: ${({ $liggende }) => ($liggende ? 'auto' : '100%')};
  width: ${({ $liggende }) => ($liggende ? '100%' : 'auto')};
  background: #fff;
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  img { width: 100%; height: 100%; display: block; object-fit: contain; }
`
const LockCard = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(320px, 86%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.1rem 1.2rem;
  border-radius: 14px;
  background: rgba(21, 23, 27, 0.92);
  color: #fff;
  text-align: center;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  svg { font-size: 1.2rem; color: #b9bff0; }
  b { font-size: 0.95rem; }
  span { font-size: 0.8rem; color: #c1c8d1; line-height: 1.45; }
`
const PageNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: #fff;
  font-size: 0.8rem;
  span { min-width: 0; max-width: 60vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  button {
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
    cursor: pointer;
    &:disabled { opacity: 0.35; cursor: default; }
  }
`
const Spinner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  font-size: 0.9rem;
`
const Melding = styled.p`
  color: #fff;
`
