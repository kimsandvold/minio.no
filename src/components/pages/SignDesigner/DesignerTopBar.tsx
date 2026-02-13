import { useState, useEffect } from 'react'
import styled from 'styled-components'
import type { DesignerAction, SignDesign } from '../../../types/design'
import Icon from '../../shared/Icon'
import GoogleLoginButton from '../../shared/GoogleLoginButton'

const TopBar = styled.div`
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0.5rem;
    gap: 0.5rem;
  }
`

const NameInput = styled.input`
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ddd;
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
  outline: none;
  min-width: 150px;

  &:focus { border-color: #1da1f2; }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-width: 100px;
    flex: 1;
  }
`

const SizeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #aaa;
  font-size: 0.8rem;
`

const SizeInput = styled.input`
  width: 55px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ddd;
  padding: 0.3rem 0.4rem;
  font-size: 0.8rem;
  text-align: center;
  outline: none;

  &:focus { border-color: #1da1f2; }
`

const Spacer = styled.div`
  flex: 1;
`

const SaveIndicator = styled.span`
  font-size: 0.75rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
`

const Button = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  border: 1px solid ${({ $primary }) => ($primary ? '#1da1f2' : '#444')};
  background: ${({ $primary }) => ($primary ? '#1da1f2' : '#333')};
  color: ${({ $primary }) => ($primary ? '#fff' : '#ddd')};
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ $primary }) => ($primary ? '#1890d0' : '#444')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const TransparentToggle = styled.button<{ $active: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid ${({ $active }) => $active ? '#1da1f2' : '#444'};
  cursor: pointer;
  background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 10px 10px;
  flex-shrink: 0;
`

const ColorInput = styled.input`
  width: 28px;
  height: 28px;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 2px;
  cursor: pointer;
  background: #2a2a2a;
`

const SaveWrapper = styled.div`
  position: relative;
`

const LoginPopover = styled.div`
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  padding: 1.25rem;
  z-index: 10;
  min-width: 240px;
  text-align: center;

  p {
    margin: 0 0 1rem;
    font-size: 0.9rem;
    color: #333;
  }
`

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #333;
  color: #ddd;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: #444;
  }
`

interface Props {
  designName: string
  onNameChange: (name: string) => void
  design: SignDesign
  dispatch: React.Dispatch<DesignerAction>
  onSave: () => void
  onLoad: () => void
  onExport: () => void
  canSave: boolean
  onClose?: () => void
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error'
  saveError?: string
}

export default function DesignerTopBar({
  designName, onNameChange, design, dispatch,
  onSave, onLoad, onExport, canSave, onClose, saveStatus = 'idle', saveError,
}: Props) {
  const [widthStr, setWidthStr] = useState(String(design.canvasWidth))
  const [heightStr, setHeightStr] = useState(String(design.canvasHeight))
  const [showLoginHint, setShowLoginHint] = useState(false)

  // Dismiss login popover when user logs in
  useEffect(() => {
    if (canSave) setShowLoginHint(false)
  }, [canSave])

  const applySize = () => {
    const w = parseInt(widthStr) || design.canvasWidth
    const h = parseInt(heightStr) || design.canvasHeight
    dispatch({ type: 'SET_CANVAS_SIZE', width: Math.max(50, w), height: Math.max(50, h) })
  }

  return (
    <TopBar>
      {onClose && (
        <CloseButton onClick={onClose} title="Lukk designer">
          <Icon name="faXmark" />
        </CloseButton>
      )}
      <NameInput
        value={designName}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Mitt skilt..."
      />

      <SizeGroup>
        <SizeInput
          value={widthStr}
          onChange={e => setWidthStr(e.target.value)}
          onBlur={applySize}
          onKeyDown={e => e.key === 'Enter' && applySize()}
        />
        <span>x</span>
        <SizeInput
          value={heightStr}
          onChange={e => setHeightStr(e.target.value)}
          onBlur={applySize}
          onKeyDown={e => e.key === 'Enter' && applySize()}
        />
        <span>mm</span>
      </SizeGroup>

      <SizeGroup>
        <span>Bakgrunn:</span>
        <TransparentToggle
          $active={design.backgroundColor === 'transparent'}
          onClick={() => dispatch({ type: 'SET_BACKGROUND_COLOR', color: 'transparent' })}
          title="Gjennomsiktig"
        />
        <ColorInput
          type="color"
          value={design.backgroundColor === 'transparent' ? '#ffffff' : design.backgroundColor}
          onChange={e => dispatch({ type: 'SET_BACKGROUND_COLOR', color: e.target.value })}
        />
      </SizeGroup>

      {saveStatus === 'saving' && (
        <SaveIndicator><Icon name="faSpinner" spin /> Lagrer...</SaveIndicator>
      )}
      {saveStatus === 'saved' && (
        <SaveIndicator style={{ color: '#4ade80' }}><Icon name="faCheck" /> Lagret</SaveIndicator>
      )}
      {saveStatus === 'error' && (
        <SaveIndicator style={{ color: '#f87171' }} title={saveError}>
          <Icon name="faExclamationTriangle" /> Feil: {saveError || 'Ukjent feil'}
        </SaveIndicator>
      )}

      <Spacer />

      <SaveWrapper>
        <Button
          onClick={canSave ? onSave : () => setShowLoginHint(v => !v)}
          disabled={canSave && saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? <Icon name="faSpinner" spin /> : <Icon name="faSave" />}
          Lagre
        </Button>
        {showLoginHint && !canSave && (
          <LoginPopover>
            <p>Logg inn for å lagre designet ditt</p>
            <GoogleLoginButton />
          </LoginPopover>
        )}
      </SaveWrapper>
      <Button
        onClick={canSave ? onLoad : () => setShowLoginHint(v => !v)}
      >
        <Icon name="faFolderOpen" /> Last inn
      </Button>
      <Button $primary onClick={onExport}>
        <Icon name="faDownload" /> Eksporter SVG
      </Button>
    </TopBar>
  )
}
