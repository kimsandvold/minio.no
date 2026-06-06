import { useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import LevelQuiz from './LevelQuiz'
import type { UserLevel } from '../../../types/product'

type FilterLevel = UserLevel | 'all'

const levels: { key: FilterLevel; label: string; icon?: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'beginner', label: 'Nybegynner', icon: 'faSeedling' },
  { key: 'intermediate', label: 'Middels', icon: 'faStar' },
  { key: 'advanced', label: 'Avansert', icon: 'faRocket' },
]

const levelColors: Record<string, { bg: string; text: string }> = {
  all: { bg: '#fff', text: '#1a1a1a' },
  beginner: { bg: '#16A34A', text: '#fff' },
  intermediate: { bg: '#EA580C', text: '#fff' },
  advanced: { bg: '#DC2626', text: '#fff' },
}

const Wrapper = styled.div`
  background: rgba(20, 20, 20, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  max-width: 780px;
  margin: -2rem auto 3rem;
  position: relative;
  z-index: 2;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin: -1.5rem 1rem 2rem;
    padding: 1rem;
    gap: 0.75rem;
    flex-direction: column;
  }
`

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
  }
`

interface TabProps {
  $active: boolean
  $color: { bg: string; text: string }
}

const Tab = styled.button<TabProps>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 1px solid ${({ $active, $color }) => ($active ? $color.bg : 'rgba(255,255,255,0.2)')};
  border-radius: 50px;
  background: ${({ $active, $color }) => ($active ? $color.bg : 'transparent')};
  color: ${({ $active, $color }) => ($active ? $color.text : 'rgba(255,255,255,0.7)')};
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;

  &:hover {
    background: ${({ $active, $color }) => ($active ? $color.bg : 'rgba(255,255,255,0.1)')};
    color: ${({ $active, $color }) => ($active ? $color.text : '#fff')};
  }

  svg {
    font-size: 0.85rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex: 1;
    justify-content: center;
    font-size: 0.78rem;
    padding: 0.5rem 0.6rem;
  }
`

const QuizLink = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-family: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: color 0.2s;
  white-space: nowrap;

  &:hover {
    color: #fff;
  }

  svg {
    font-size: 0.65rem;
    transition: transform 0.2s;
  }

  &:hover svg {
    transform: translateX(3px);
  }
`

interface Props {
  value: FilterLevel
  onChange: (level: FilterLevel) => void
}

export default function LevelSelector({ value, onChange }: Props) {
  const [quizOpen, setQuizOpen] = useState(false)

  return (
    <>
      <Wrapper>
        <Tabs>
          {levels.map((lvl) => (
            <Tab
              key={lvl.key}
              $active={value === lvl.key}
              $color={levelColors[lvl.key]}
              onClick={() => onChange(lvl.key)}
              aria-pressed={value === lvl.key}
            >
              <Icon name={lvl.icon} />
              {lvl.label}
            </Tab>
          ))}
        </Tabs>
        <QuizLink onClick={() => setQuizOpen(true)}>
          Usikker? Ta en kjapp test <Icon name="faArrowRight" />
        </QuizLink>
      </Wrapper>
      {quizOpen && (
        <LevelQuiz
          onComplete={(level) => {
            onChange(level)
            setQuizOpen(false)
          }}
          onClose={() => setQuizOpen(false)}
        />
      )}
    </>
  )
}
