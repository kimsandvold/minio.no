import { useState, useEffect } from 'react'
import styled from 'styled-components'
import type { DesignerAction, SignDesign } from '../../../types/design'
import { devicePresets, findPresetByDimensions } from '../../../data/devicePresets'
import Icon from '../../shared/Icon'
import GoogleLoginButton from '../../shared/GoogleLoginButton'

const TopBar = styled.div`
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  padding: 0.5rem 1rem 0.5rem 10px;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0.4rem 0.5rem;
    gap: 0.4rem;
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
    display: none;
  }
`

const SizeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #aaa;
  font-size: 0.8rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
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

const FormatButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid ${({ $active }) => $active ? '#1da1f2' : '#444'};
  background: ${({ $active }) => $active ? 'rgba(29, 161, 242, 0.15)' : 'transparent'};
  color: ${({ $active }) => $active ? '#1da1f2' : '#999'};
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    border-color: #1da1f2;
    color: #1da1f2;
  }
`

const SizeBadge = styled.span`
  color: #888;
  font-size: 0.75rem;
  white-space: nowrap;
`

const BgGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #aaa;
  font-size: 0.8rem;
`

const BgLabel = styled.span`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
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

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0.4rem 0.5rem;
  }
`

const ButtonLabel = styled.span`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
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
  const [selectedPresetId, setSelectedPresetId] = useState(() => {
    const match = findPresetByDimensions(design.canvasWidth, design.canvasHeight)
    return match ? match.id : 'custom'
  })
  const [customWidth, setCustomWidth] = useState(String(design.canvasWidth))
  const [customHeight, setCustomHeight] = useState(String(design.canvasHeight))
  const [showLoginHint, setShowLoginHint] = useState(false)

  // Sync preset selection when canvas dimensions change externally (undo, load, template)
  useEffect(() => {
    const match = findPresetByDimensions(design.canvasWidth, design.canvasHeight)
    setSelectedPresetId(match ? match.id : 'custom')
    setCustomWidth(String(design.canvasWidth))
    setCustomHeight(String(design.canvasHeight))
  }, [design.canvasWidth, design.canvasHeight])

  // Dismiss login popover when user logs in
  useEffect(() => {
    if (canSave) setShowLoginHint(false)
  }, [canSave])

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId)
    if (presetId === 'custom') return
    const preset = devicePresets.find(p => p.id === presetId)
    if (preset) {
      dispatch({ type: 'SET_CANVAS_SIZE', width: preset.width, height: preset.height })
    }
  }

  const applyCustomSize = () => {
    const w = parseInt(customWidth) || design.canvasWidth
    const h = parseInt(customHeight) || design.canvasHeight
    dispatch({ type: 'SET_CANVAS_SIZE', width: Math.max(50, w), height: Math.max(50, h) })
  }

  return (
    <TopBar>
      {onClose && (
        <CloseButton onClick={onClose} title="Lukk designer">
          <Icon name="faTimes" />
        </CloseButton>
      )}
      <NameInput
        value={designName}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Mitt skilt..."
      />

      <SizeGroup>
        {devicePresets.map(p => (
          <FormatButton
            key={p.id}
            $active={selectedPresetId === p.id}
            onClick={() => handlePresetChange(p.id)}
            title={p.label}
          >
            <Icon name={p.icon} className={p.rotate ? 'fa-rotate-90' : undefined} />
          </FormatButton>
        ))}
        <FormatButton
          $active={selectedPresetId === 'custom'}
          onClick={() => handlePresetChange('custom')}
          title="Egendefinert"
        >
          <Icon name="faRulerCombined" />
        </FormatButton>
        {selectedPresetId !== 'custom' ? (
          <SizeBadge>{design.canvasWidth} × {design.canvasHeight}</SizeBadge>
        ) : (
          <>
            <SizeInput
              value={customWidth}
              onChange={e => setCustomWidth(e.target.value)}
              onBlur={applyCustomSize}
              onKeyDown={e => e.key === 'Enter' && applyCustomSize()}
            />
            <span>×</span>
            <SizeInput
              value={customHeight}
              onChange={e => setCustomHeight(e.target.value)}
              onBlur={applyCustomSize}
              onKeyDown={e => e.key === 'Enter' && applyCustomSize()}
            />
          </>
        )}
      </SizeGroup>

      <BgGroup>
        <BgLabel>Bakgrunn:</BgLabel>
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
      </BgGroup>

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
          <ButtonLabel>Lagre</ButtonLabel>
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
        <Icon name="faFolderOpen" /> <ButtonLabel>Last inn</ButtonLabel>
      </Button>
      <Button $primary onClick={onExport}>
        <Icon name="faDownload" /> <ButtonLabel>Eksporter SVG</ButtonLabel>
      </Button>
    </TopBar>
  )
}
