import { useCallback, useState } from 'react'
import styled from 'styled-components'
import type { DesignElement, DesignerAction, ToolMode } from '../../../types/design'
import { designerFonts } from '../../../data/designerFonts'
import { designerSymbols, symbolCategories } from '../../../data/designerSymbols'
import Icon from '../../shared/Icon'

const Panel = styled.div<{ $visible: boolean }>`
  width: 260px;
  background: #1a1a1a;
  border-left: 1px solid #333;
  overflow-y: auto;
  padding: 1rem;
  flex-shrink: 0;
  color: #ddd;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    border-left: none;
    border-top: 1px solid #333;
    max-height: ${({ $visible }) => ($visible ? '50vh' : '0')};
    padding: ${({ $visible }) => ($visible ? '1rem' : '0 1rem')};
    overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease;
    order: 2;
  }
`

const SectionTitle = styled.h4`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #888;
  margin: 1rem 0 0.5rem;
  &:first-child { margin-top: 0; }
`

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`

const Label = styled.label`
  font-size: 0.8rem;
  color: #aaa;
  min-width: 50px;
`

const Input = styled.input`
  flex: 1;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ddd;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  outline: none;

  &:focus { border-color: #1da1f2; }
  &[type="color"] {
    width: 32px;
    height: 28px;
    padding: 2px;
    cursor: pointer;
  }
`

const Select = styled.select`
  flex: 1;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ddd;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  outline: none;

  &:focus { border-color: #1da1f2; }
`

const ActionButton = styled.button`
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ddd;
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;

  &:hover { background: #444; }
`

const DeleteButton = styled(ActionButton)`
  background: #4a1a1a;
  border-color: #6a2a2a;
  &:hover { background: #6a2a2a; }
`

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  font-size: 0.85rem;
  padding: 2rem 1rem;
`

const CategoryTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 0.5rem;
`

const CategoryTab = styled.button<{ $active: boolean }>`
  padding: 3px 8px;
  border: 1px solid ${({ $active }) => ($active ? '#1da1f2' : '#444')};
  border-radius: 4px;
  background: ${({ $active }) => ($active ? '#1da1f233' : 'transparent')};
  color: ${({ $active }) => ($active ? '#1da1f2' : '#aaa')};
  cursor: pointer;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    border-color: #1da1f2;
    color: #ddd;
  }
`

const SymbolGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
`

const SymbolCell = styled.button<{ $active: boolean }>`
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid ${({ $active }) => ($active ? '#1da1f2' : '#333')};
  border-radius: 4px;
  background: ${({ $active }) => ($active ? '#1da1f220' : '#2a2a2a')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: #1da1f2;
    background: #333;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`

interface Props {
  element: DesignElement | null
  dispatch: React.Dispatch<DesignerAction>
  activeTool: ToolMode
  activeSymbolId: string
  onSymbolChange: (id: string) => void
}

export default function DesignerProperties({ element, dispatch, activeTool, activeSymbolId, onSymbolChange }: Props) {
  const [symbolCategory, setSymbolCategory] = useState<string>(symbolCategories[0])

  const update = useCallback(
    (changes: Partial<DesignElement>) => {
      if (!element) return
      dispatch({ type: 'UPDATE_ELEMENT', id: element.id, changes })
    },
    [element, dispatch],
  )

  const filteredSymbols = designerSymbols.filter(s => s.category === symbolCategory)

  if (!element) {
    return (
      <Panel $visible={false}>
        <EmptyState>Velg et element for a redigere egenskaper</EmptyState>
      </Panel>
    )
  }

  return (
    <Panel $visible={true}>
      <SectionTitle>Posisjon og storrelse</SectionTitle>
      <Row>
        <Label>X</Label>
        <Input type="number" value={Math.round(element.x)} onChange={e => update({ x: Number(e.target.value) })} />
        <Label>Y</Label>
        <Input type="number" value={Math.round(element.y)} onChange={e => update({ y: Number(e.target.value) })} />
      </Row>
      {element.type !== 'line' && (
        <Row>
          <Label>B</Label>
          <Input type="number" value={Math.round(element.width)} min={1} onChange={e => update({ width: Number(e.target.value) })} />
          <Label>H</Label>
          <Input type="number" value={Math.round(element.height)} min={1} onChange={e => update({ height: Number(e.target.value) })} />
        </Row>
      )}
      {element.type === 'line' && (
        <Row>
          <Label>X2</Label>
          <Input type="number" value={Math.round(element.x2)} onChange={e => update({ x2: Number(e.target.value) })} />
          <Label>Y2</Label>
          <Input type="number" value={Math.round(element.y2)} onChange={e => update({ y2: Number(e.target.value) })} />
        </Row>
      )}
      <Row>
        <Label>Rot.</Label>
        <Input type="number" value={element.rotation} min={0} max={360} onChange={e => update({ rotation: Number(e.target.value) })} />
      </Row>

      <SectionTitle>Utseende</SectionTitle>
      <Row>
        <Label>Fyll</Label>
        <Input type="color" value={element.fill === 'none' ? '#ffffff' : element.fill} onChange={e => update({ fill: e.target.value })} />
        <ActionButton onClick={() => update({ fill: element.fill === 'none' ? '#000000' : 'none' })}>
          {element.fill === 'none' ? 'Pa' : 'Av'}
        </ActionButton>
      </Row>
      <Row>
        <Label>Strek</Label>
        <Input type="color" value={element.stroke === 'none' ? '#000000' : element.stroke} onChange={e => update({ stroke: e.target.value })} />
        <ActionButton onClick={() => update({ stroke: element.stroke === 'none' ? '#000000' : 'none' })}>
          {element.stroke === 'none' ? 'Pa' : 'Av'}
        </ActionButton>
      </Row>
      <Row>
        <Label>Tykkelse</Label>
        <Input type="number" value={element.strokeWidth} min={0} max={20} step={0.5} onChange={e => update({ strokeWidth: Number(e.target.value) })} />
      </Row>
      <Row>
        <Label>Gj.sikt</Label>
        <Input type="range" min={0} max={1} step={0.05} value={element.opacity} onChange={e => update({ opacity: Number(e.target.value) })} />
      </Row>

      {element.type === 'rect' && (
        <>
          <SectionTitle>Hjorneradius</SectionTitle>
          <Row>
            <Label>RX</Label>
            <Input type="number" value={element.rx} min={0} onChange={e => update({ rx: Number(e.target.value), ry: Number(e.target.value) })} />
          </Row>
        </>
      )}

      {element.type === 'text' && (
        <>
          <SectionTitle>Tekst</SectionTitle>
          <Row>
            <Input type="text" value={element.text} onChange={e => update({ text: e.target.value })} style={{ flex: 1 }} />
          </Row>
          <Row>
            <Label>Font</Label>
            <Select value={element.fontFamily} onChange={e => update({ fontFamily: e.target.value })}>
              {designerFonts.map(f => (
                <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>{f.label}</option>
              ))}
            </Select>
          </Row>
          <Row>
            <Label>Str.</Label>
            <Input type="number" value={element.fontSize} min={4} max={200} onChange={e => update({ fontSize: Number(e.target.value) })} />
          </Row>
          <Row>
            <Label>Vekt</Label>
            <Select value={element.fontWeight} onChange={e => update({ fontWeight: Number(e.target.value) })}>
              <option value={300}>Lett</option>
              <option value={400}>Normal</option>
              <option value={600}>Halvfet</option>
              <option value={700}>Fet</option>
              <option value={900}>Ekstra fet</option>
            </Select>
          </Row>
          <Row>
            <Label>Justert</Label>
            <Select value={element.textAnchor} onChange={e => update({ textAnchor: e.target.value as 'start' | 'middle' | 'end' })}>
              <option value="start">Venstre</option>
              <option value="middle">Midtstilt</option>
              <option value="end">Hoyre</option>
            </Select>
          </Row>
          <Row>
            <Label>Mellomrom</Label>
            <Input type="number" value={element.letterSpacing} step={0.5} onChange={e => update({ letterSpacing: Number(e.target.value) })} />
          </Row>
        </>
      )}

      {element.type === 'symbol' && (
        <>
          <SectionTitle>Bytt symbol</SectionTitle>
          <CategoryTabs>
            {symbolCategories.map(cat => (
              <CategoryTab
                key={cat}
                $active={symbolCategory === cat}
                onClick={() => setSymbolCategory(cat)}
              >
                {cat}
              </CategoryTab>
            ))}
          </CategoryTabs>
          <SymbolGrid>
            {filteredSymbols.map(s => (
              <SymbolCell
                key={s.id}
                $active={element.symbolId === s.id}
                title={s.name}
                onClick={() => update({ symbolId: s.id })}
              >
                <svg viewBox={s.viewBox} fill="none" stroke="#ddd" strokeWidth="2">
                  <path d={s.path} />
                </svg>
              </SymbolCell>
            ))}
          </SymbolGrid>
        </>
      )}

      <SectionTitle>Handlinger</SectionTitle>
      <Row>
        <ActionButton onClick={() => dispatch({ type: 'DUPLICATE_ELEMENT', id: element.id })}>
          <Icon name="faCopy" /> Dupliser
        </ActionButton>
        <ActionButton onClick={() => dispatch({ type: 'MOVE_ELEMENT_ORDER', id: element.id, direction: 'up' })}>
          <Icon name="faArrowUp" /> Frem
        </ActionButton>
        <ActionButton onClick={() => dispatch({ type: 'MOVE_ELEMENT_ORDER', id: element.id, direction: 'down' })}>
          <Icon name="faArrowDown" /> Bak
        </ActionButton>
      </Row>
      <Row>
        <DeleteButton onClick={() => dispatch({ type: 'DELETE_ELEMENT', id: element.id })}>
          <Icon name="faTrash" /> Slett
        </DeleteButton>
      </Row>
    </Panel>
  )
}
