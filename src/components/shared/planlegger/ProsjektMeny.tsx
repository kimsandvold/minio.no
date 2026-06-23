import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import Icon from '../Icon'
import type { ProsjektStyring } from './useProsjekter'

// ── Meny over 3D-modellen (øverst til venstre) ───────────────────────────────

const Wrap = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 4;
`

const Pill = styled.button<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 210px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  border: none;
  border-radius: 999px;
  padding: 0.4rem 0.7rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);

  .navn {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  svg:first-child {
    color: #888;
  }
  .caret {
    font-size: 0.58rem;
    color: #999;
    transition: transform 0.2s;
    transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
  }

  @media (max-width: 768px) {
    max-width: 150px;
  }
`

// Liten ulagret-indikator inne i pillen (SketchUp-stil: status uten egen knapp).
const Dot = styled.span<{ $tone: 'ok' | 'warn' | 'idle' }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $tone, theme }) =>
    $tone === 'ok' ? theme.colors.success : $tone === 'warn' ? '#e0a516' : '#bbb'};
`

const MenuPortal = styled.div`
  position: fixed;
  z-index: 10010; /* over fullskjerm-overlayet (10000), under dialoger (10001 vises aldri samtidig) */
`

const Dropdown = styled.div`
  width: 264px;
  max-width: 82vw;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 10px;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.18);
  overflow: hidden;
`

const DropHead = styled.div`
  padding: 0.55rem 0.8rem;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #999;
  font-weight: 700;
  border-bottom: 1px solid #f1f1f1;
`

const StatusHead = styled.div<{ $tone: 'ok' | 'warn' | 'idle' }>`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0.6rem 0.8rem;
  font-size: 0.72rem;
  font-weight: 600;
  border-bottom: 1px solid #f1f1f1;
  color: ${({ $tone, theme }) =>
    $tone === 'ok' ? theme.colors.success : $tone === 'warn' ? '#b8860b' : '#888'};
`

const List = styled.div`
  max-height: 220px;
  overflow-y: auto;
`

const Item = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem;
  border: none;
  background: ${({ $active }) => ($active ? '#f5f5f5' : '#fff')};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: #f5f5f5;
  }

  .meta {
    min-width: 0;
  }
  .n {
    display: block;
    font-size: 0.76rem;
    font-weight: 600;
    color: #222;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .d {
    display: block;
    font-size: 0.61rem;
    color: #aaa;
  }
  svg {
    color: ${({ theme }) => theme.colors.success};
    flex-shrink: 0;
  }
`

const Empty = styled.div`
  padding: 0.85rem 0.8rem;
  font-size: 0.7rem;
  color: #aaa;
`

const Sep = styled.div`
  height: 1px;
  background: #f1f1f1;
`

const Action = styled.button<{ $danger?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.6rem 0.8rem;
  border: none;
  background: #fff;
  cursor: pointer;
  font-size: 0.76rem;
  font-weight: 500;
  text-align: left;
  color: ${({ $danger, theme }) => ($danger ? theme.colors.error : '#333')};

  svg {
    width: 14px;
    color: ${({ $danger, theme }) => ($danger ? theme.colors.error : '#888')};
  }
  &:hover {
    background: #f6f6f6;
  }
`

// ── Dialoger ─────────────────────────────────────────────────────────────────

const DlgBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`

const DlgCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 1.4rem;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`

const DlgTitle = styled.h3`
  margin: 0 0 0.6rem;
  font-size: 1rem;
  color: #1a1a1a;
`

const DlgText = styled.p`
  margin: 0 0 1.1rem;
  font-size: 0.82rem;
  color: #555;
  line-height: 1.5;
`

const DlgInput = styled.input`
  width: 100%;
  padding: 0.6rem 0.7rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.1rem;

  &:focus {
    outline: none;
    border-color: #1a1a1a;
  }
`

const DlgActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
`

const DlgBtn = styled.button<{ $variant: 'primary' | 'ghost' | 'danger' }>`
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  ${({ $variant, theme }) =>
    $variant === 'primary'
      ? `background:${theme.colors.textDark};color:#fff;`
      : $variant === 'danger'
        ? `background:${theme.colors.error};color:#fff;`
        : `background:#fff;color:#555;border-color:#ddd;`}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

function NavnDialog({
  tittel,
  bekreft,
  initial,
  placeholder,
  onSave,
  onCancel,
}: {
  tittel: string
  bekreft: string
  initial: string
  placeholder: string
  onSave: (navn: string) => void
  onCancel: () => void
}) {
  const [navn, setNavn] = useState(initial)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])
  const submit = () => {
    if (navn.trim()) onSave(navn.trim())
  }
  return createPortal(
    <DlgBackdrop onClick={onCancel}>
      <DlgCard onClick={(e) => e.stopPropagation()}>
        <DlgTitle>{tittel}</DlgTitle>
        <DlgInput
          ref={inputRef}
          value={navn}
          placeholder={placeholder}
          onChange={(e) => setNavn(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <DlgActions>
          <DlgBtn $variant="ghost" onClick={onCancel}>
            Avbryt
          </DlgBtn>
          <DlgBtn $variant="primary" onClick={submit} disabled={!navn.trim()}>
            {bekreft}
          </DlgBtn>
        </DlgActions>
      </DlgCard>
    </DlgBackdrop>,
    document.body,
  )
}

function ConfirmDialog({
  tittel,
  melding,
  bekreft,
  fare,
  onConfirm,
  onCancel,
}: {
  tittel: string
  melding: string
  bekreft: string
  fare?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return createPortal(
    <DlgBackdrop onClick={onCancel}>
      <DlgCard onClick={(e) => e.stopPropagation()}>
        <DlgTitle>{tittel}</DlgTitle>
        <DlgText>{melding}</DlgText>
        <DlgActions>
          <DlgBtn $variant="ghost" onClick={onCancel}>
            Avbryt
          </DlgBtn>
          <DlgBtn $variant={fare ? 'danger' : 'primary'} onClick={onConfirm}>
            {bekreft}
          </DlgBtn>
        </DlgActions>
      </DlgCard>
    </DlgBackdrop>,
    document.body,
  )
}

// ── Hovedkomponent ───────────────────────────────────────────────────────────

type Dialog =
  | { kind: 'navn'; tittel: string; bekreft: string; initial: string; onSave: (navn: string) => void }
  | { kind: 'bekreft'; tittel: string; melding: string; bekreft: string; fare?: boolean; onConfirm: () => void }
  | null

interface Props<T> {
  prosjekt: ProsjektStyring<T>
  /** Kort beskrivelse av et lagret prosjekt (f.eks. form/montering) til listen. */
  beskriv: (config: T) => string
  /** Plassholdertekst i navne-dialogen, f.eks. «F.eks. Pergola sørvest». */
  navnPlaceholder?: string
}

export default function ProsjektMeny<T>({ prosjekt, beskriv, navnPlaceholder = 'F.eks. Mitt prosjekt' }: Props<T>) {
  const { prosjekter, aktivId, aktivNavn, dirty, nytt, åpne, lagre, lagreSom, giNyttNavn, slett } = prosjekt
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Åpne/lukk menyen og forankre den under pillen (rendres via portal, så den
  // ikke klippes av 3D-visningens overflow på mobil).
  const toggleOpen = () => {
    setOpen((o) => {
      const next = !o
      if (next && pillRef.current) {
        const r = pillRef.current.getBoundingClientRect()
        setMenuPos({ top: r.bottom + 6, left: r.left })
      }
      return next
    })
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  const tone: 'ok' | 'warn' | 'idle' = aktivId && !dirty ? 'ok' : dirty ? 'warn' : 'idle'

  const handleLagre = () => {
    setOpen(false)
    if (aktivId) {
      lagre()
    } else {
      setDialog({
        kind: 'navn',
        tittel: 'Lagre prosjekt',
        bekreft: 'Lagre',
        initial: '',
        onSave: (navn) => {
          lagreSom(navn)
          setDialog(null)
        },
      })
    }
  }

  const handleLagreSom = () => {
    setOpen(false)
    setDialog({
      kind: 'navn',
      tittel: 'Lagre som nytt prosjekt',
      bekreft: 'Lagre',
      initial: aktivNavn ? `${aktivNavn} (kopi)` : '',
      onSave: (navn) => {
        lagreSom(navn)
        setDialog(null)
      },
    })
  }

  // Kjør en handling, men spør først hvis det finnes ulagrede endringer å miste.
  const medForkastVakt = (handling: () => void) => {
    setOpen(false)
    if (dirty) {
      setDialog({
        kind: 'bekreft',
        tittel: 'Ulagrede endringer',
        melding: 'Du har endringer som ikke er lagret. Vil du forkaste dem og fortsette?',
        bekreft: 'Forkast endringer',
        fare: true,
        onConfirm: () => {
          handling()
          setDialog(null)
        },
      })
    } else {
      handling()
    }
  }

  const handleRename = () => {
    setOpen(false)
    setDialog({
      kind: 'navn',
      tittel: 'Gi nytt navn',
      bekreft: 'Lagre navn',
      initial: aktivNavn ?? '',
      onSave: (navn) => {
        giNyttNavn(navn)
        setDialog(null)
      },
    })
  }

  const handleSlett = () => {
    setOpen(false)
    if (!aktivId) return
    setDialog({
      kind: 'bekreft',
      tittel: 'Slett prosjekt',
      melding: `Er du sikker på at du vil slette «${aktivNavn}»? Dette kan ikke angres.`,
      bekreft: 'Slett',
      fare: true,
      onConfirm: () => {
        slett(aktivId)
        setDialog(null)
      },
    })
  }

  const statusTekst = tone === 'ok' ? 'Alt lagret' : aktivId ? 'Ulagrede endringer' : 'Ikke lagret ennå'

  return (
    <Wrap ref={wrapRef}>
      <Pill ref={pillRef} $open={open} onClick={toggleOpen} aria-haspopup="menu" aria-expanded={open}>
        <Icon name="faFolderOpen" />
        <span className="navn">{aktivNavn ?? 'Nytt prosjekt'}</span>
        {dirty && <Dot $tone={tone} title={statusTekst} />}
        <Icon name="faChevronDown" className="caret" />
      </Pill>

      {open &&
        menuPos &&
        createPortal(
          <MenuPortal ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
            <Dropdown role="menu">
              <StatusHead $tone={tone}>
                <Dot $tone={tone} />
                {statusTekst}
              </StatusHead>
              <Action onClick={handleLagre}>
                <Icon name="faSave" /> {aktivId ? 'Lagre' : 'Lagre prosjekt'}
              </Action>
              {aktivId && (
                <Action onClick={handleLagreSom}>
                  <Icon name="faClone" /> Lagre som…
                </Action>
              )}
              <Sep />
              <DropHead>Mine prosjekter</DropHead>
              <List>
                {prosjekter.length === 0 ? (
                  <Empty>Ingen lagrede prosjekter ennå.</Empty>
                ) : (
                  prosjekter.map((p) => (
                    <Item key={p.id} $active={p.id === aktivId} onClick={() => medForkastVakt(() => åpne(p.id))}>
                      <div className="meta">
                        <span className="n">{p.navn}</span>
                        <span className="d">
                          {beskriv(p.config)} · {p.dato}
                        </span>
                      </div>
                      {p.id === aktivId && <Icon name="faCheck" />}
                    </Item>
                  ))
                )}
              </List>
              <Sep />
              <Action onClick={() => medForkastVakt(nytt)}>
                <Icon name="faPlus" /> Nytt prosjekt
              </Action>
              {aktivId && (
                <Action onClick={handleRename}>
                  <Icon name="faPencilRuler" /> Gi nytt navn
                </Action>
              )}
              {aktivId && (
                <Action $danger onClick={handleSlett}>
                  <Icon name="faTrash" /> Slett prosjekt
                </Action>
              )}
            </Dropdown>
          </MenuPortal>,
          document.body,
        )}

      {dialog?.kind === 'navn' && (
        <NavnDialog
          tittel={dialog.tittel}
          bekreft={dialog.bekreft}
          initial={dialog.initial}
          placeholder={navnPlaceholder}
          onSave={dialog.onSave}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'bekreft' && (
        <ConfirmDialog
          tittel={dialog.tittel}
          melding={dialog.melding}
          bekreft={dialog.bekreft}
          fare={dialog.fare}
          onConfirm={dialog.onConfirm}
          onCancel={() => setDialog(null)}
        />
      )}
    </Wrap>
  )
}
