import { useState } from 'react'
import styled from 'styled-components'
import { designerSymbols, symbolCategories } from '../../../data/designerSymbols'

const Panel = styled.div`
  width: 220px;
  background: #1c1a18;
  border-right: 1px solid #2e2a26;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    max-height: 35vh;
    border-right: none;
    border-bottom: 1px solid #2e2a26;
  }
`

const CategoryTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  padding: 0.5rem;
  border-bottom: 1px solid #2e2a26;
`

const CategoryTab = styled.button<{ $active: boolean }>`
  padding: 3px 7px;
  border: 1px solid ${({ $active }) => ($active ? '#a8512c' : '#4a433c')};
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#a8512c33' : 'transparent')};
  color: ${({ $active }) => ($active ? '#a8512c' : '#b3a797')};
  cursor: pointer;
  font-size: 0.6rem;
  letter-spacing: -0.005em;
  white-space: nowrap;

  &:hover {
    border-color: #a8512c;
    color: #ddd4c7;
  }
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
  padding: 0.5rem;
  flex: 1;
  overflow-y: auto;
  align-content: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(6, 1fr);
  }
`

const Cell = styled.button<{ $active: boolean }>`
  aspect-ratio: 1;
  border: 1px solid ${({ $active }) => ($active ? '#a8512c' : '#2e2a26')};
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#a8512c20' : '#2e2a26')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: #a8512c;
    background: #2e2a26;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`

interface Props {
  activeSymbolId: string
  onSymbolChange: (id: string) => void
}

export default function SymbolPickerPanel({ activeSymbolId, onSymbolChange }: Props) {
  const [category, setCategory] = useState<string>(symbolCategories[0])
  const filtered = designerSymbols.filter(s => s.category === category)

  return (
    <Panel>
      <CategoryTabs>
        {symbolCategories.map(cat => (
          <CategoryTab
            key={cat}
            $active={category === cat}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </CategoryTab>
        ))}
      </CategoryTabs>
      <Grid>
        {filtered.map(s => (
          <Cell
            key={s.id}
            $active={activeSymbolId === s.id}
            title={s.name}
            onClick={() => onSymbolChange(s.id)}
          >
            <svg viewBox={s.viewBox} fill="none" stroke="#ddd4c7" strokeWidth="2">
              <path d={s.path} />
            </svg>
          </Cell>
        ))}
      </Grid>
    </Panel>
  )
}
