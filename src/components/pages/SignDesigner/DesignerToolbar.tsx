import { useState } from 'react'
import styled from 'styled-components'
import type { ToolMode, DesignerAction } from '../../../types/design'
import { designerSymbols } from '../../../data/designerSymbols'
import Icon from '../../shared/Icon'

const Toolbar = styled.div`
  width: 52px;
  background: #1a1a1a;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0;
  gap: 2px;
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    flex-direction: row;
    justify-content: center;
    border-right: none;
    border-top: 1px solid #333;
    padding: 0.4rem 0.5rem;
    order: 3;
  }
`

const ToolButton = styled.button<{ $active?: boolean }>`
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#1da1f2' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : '#aaa')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    background: ${({ $active }) => ($active ? '#1da1f2' : '#333')};
    color: #fff;
  }
`

const Divider = styled.div`
  width: 28px;
  height: 1px;
  background: #333;
  margin: 4px 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 1px;
    height: 28px;
    margin: 0 4px;
  }
`

const SymbolPicker = styled.div`
  position: absolute;
  left: 52px;
  top: 0;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 0.5rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  z-index: 100;
  min-width: 140px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    left: auto;
    bottom: 52px;
    top: auto;
  }
`

const SymbolOption = styled.button<{ $active?: boolean }>`
  padding: 6px 8px;
  border: 1px solid ${({ $active }) => ($active ? '#1da1f2' : '#444')};
  border-radius: 6px;
  background: ${({ $active }) => ($active ? '#1da1f233' : 'transparent')};
  color: #ddd;
  cursor: pointer;
  font-size: 0.7rem;
  white-space: nowrap;

  &:hover {
    border-color: #1da1f2;
  }
`

const tools: { mode: ToolMode; icon: string; label: string }[] = [
  { mode: 'select', icon: 'faMousePointer', label: 'Velg (V)' },
  { mode: 'text', icon: 'faFont', label: 'Tekst (T)' },
  { mode: 'rect', icon: 'faSquare', label: 'Rektangel (R)' },
  { mode: 'circle', icon: 'faCircle', label: 'Sirkel (C)' },
  { mode: 'line', icon: 'faMinus', label: 'Linje (L)' },
  { mode: 'symbol', icon: 'faStar', label: 'Symbol (S)' },
]

interface Props {
  activeTool: ToolMode
  dispatch: React.Dispatch<DesignerAction>
  activeSymbolId: string
  onSymbolChange: (id: string) => void
}

export default function DesignerToolbar({ activeTool, dispatch, activeSymbolId, onSymbolChange }: Props) {
  const [showSymbols, setShowSymbols] = useState(false)

  return (
    <Toolbar>
      {tools.map(t => (
        <div key={t.mode} style={{ position: 'relative' }}>
          <ToolButton
            $active={activeTool === t.mode}
            title={t.label}
            onClick={() => {
              dispatch({ type: 'SET_TOOL', tool: t.mode })
              if (t.mode === 'symbol') setShowSymbols(s => !s)
              else setShowSymbols(false)
            }}
          >
            <Icon name={t.icon} />
          </ToolButton>
          {t.mode === 'symbol' && showSymbols && activeTool === 'symbol' && (
            <SymbolPicker>
              {designerSymbols.map(s => (
                <SymbolOption
                  key={s.id}
                  $active={activeSymbolId === s.id}
                  onClick={() => { onSymbolChange(s.id); setShowSymbols(false) }}
                >
                  {s.name}
                </SymbolOption>
              ))}
            </SymbolPicker>
          )}
        </div>
      ))}
      <Divider />
      <ToolButton title="Angre (Ctrl+Z)" onClick={() => dispatch({ type: 'UNDO' })}>
        <Icon name="faUndo" />
      </ToolButton>
      <ToolButton title="Gjenta (Ctrl+Y)" onClick={() => dispatch({ type: 'REDO' })}>
        <Icon name="faRedo" />
      </ToolButton>
    </Toolbar>
  )
}
