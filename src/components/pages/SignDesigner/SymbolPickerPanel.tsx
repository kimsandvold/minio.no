import { useState } from 'react'
import styled from 'styled-components'
import { designerSymbols, symbolCategories } from '../../../data/designerSymbols'

const Panel = styled.div`
  width: 220px;
  background: #1a1a1a;
  border-right: 1px solid #333;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    max-height: 45vh;
    border-right: none;
    border-bottom: 1px solid #333;
  }
`

const CategoryTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  padding: 0.5rem;
  border-bottom: 1px solid #333;
`

const CategoryTab = styled.button<{ $active: boolean }>`
  padding: 3px 7px;
  border: 1px solid ${({ $active }) => ($active ? '#1da1f2' : '#444')};
  border-radius: 4px;
  background: ${({ $active }) => ($active ? '#1da1f233' : 'transparent')};
  color: ${({ $active }) => ($active ? '#1da1f2' : '#aaa')};
  cursor: pointer;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;

  &:hover {
    border-color: #1da1f2;
    color: #ddd;
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
`

const Cell = styled.button<{ $active: boolean }>`
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
            <svg viewBox={s.viewBox} fill="none" stroke="#ddd" strokeWidth="2">
              <path d={s.path} />
            </svg>
          </Cell>
        ))}
      </Grid>
    </Panel>
  )
}
