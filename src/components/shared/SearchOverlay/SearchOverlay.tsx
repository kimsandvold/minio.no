import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import Icon from '../Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { searchAll, groupOrder, type SearchItem } from '../../../data/searchIndex'

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: ${({ theme }) => theme.zIndex.modal};
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 12vh 1rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 4vh 0.75rem 1rem;
  }
`

const Panel = styled.div`
  width: 100%;
  max-width: 640px;
  background: rgba(28, 28, 28, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
`

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
`

const Input = styled.input`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 1.05rem;
  font-family: ${({ theme }) => theme.fonts.body};

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`

const CloseHint = styled.kbd`
  font-family: ${({ theme }) => theme.fonts.body};
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 0.15rem 0.4rem;
  white-space: nowrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const Results = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0.5rem 0;
  overflow-y: auto;
`

const GroupLabel = styled.li`
  padding: 0.6rem 1.25rem 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
`

const Result = styled.li<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.65rem 1.25rem;
  cursor: pointer;
  background: ${({ $active }) => ($active ? 'rgba(255, 255, 255, 0.1)' : 'transparent')};
  transition: background 0.12s ease;
`

const Thumb = styled.div`
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`

const ResultText = styled.div`
  min-width: 0;
  flex: 1;
`

const ResultTitle = styled.div`
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 0.95rem;
  font-weight: 500;
`

const ResultDesc = styled.div`
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const EmptyState = styled.div`
  padding: 2rem 1.25rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
`

interface SearchOverlayProps {
  onClose: () => void
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useScrollLock(true)

  const results = useMemo(() => searchAll(query), [query])

  // Group results while keeping a flat list for keyboard navigation.
  const grouped = useMemo(() => {
    return groupOrder
      .map((group) => ({ group, items: results.filter((r) => r.group === group) }))
      .filter((g) => g.items.length > 0)
  }, [results])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  const go = useCallback((item: SearchItem) => {
    navigate(item.href)
    onClose()
  }, [navigate, onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault()
      go(results[activeIndex])
    }
  }

  return (
    <Backdrop onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Søk">
        <SearchRow>
          <Icon name="faSearch" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Søk etter produkter, guider og planleggere…"
            aria-label="Søk på minio.no"
            autoComplete="off"
          />
          <CloseHint>Esc</CloseHint>
        </SearchRow>

        {query.trim() === '' ? (
          <EmptyState>Begynn å skrive for å søke på hele nettstedet.</EmptyState>
        ) : results.length === 0 ? (
          <EmptyState>Ingen treff for «{query.trim()}».</EmptyState>
        ) : (
          <Results>
            {grouped.map(({ group, items }) => (
              <li key={group}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  <GroupLabel>{group}</GroupLabel>
                  {items.map((item) => {
                    const flatIndex = results.indexOf(item)
                    return (
                      <Result
                        key={item.id}
                        $active={flatIndex === activeIndex}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        onClick={() => go(item)}
                      >
                        <Thumb>
                          {item.image ? (
                            <img src={item.image} alt="" loading="lazy" />
                          ) : (
                            <Icon name={item.icon} />
                          )}
                        </Thumb>
                        <ResultText>
                          <ResultTitle>{item.title}</ResultTitle>
                          <ResultDesc>{item.description}</ResultDesc>
                        </ResultText>
                      </Result>
                    )
                  })}
                </ul>
              </li>
            ))}
          </Results>
        )}
      </Panel>
    </Backdrop>
  )
}
