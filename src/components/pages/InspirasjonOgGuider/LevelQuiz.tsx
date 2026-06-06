import { useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { quizQuestions } from '../../../data/quizQuestions'
import type { UserLevel } from '../../../types/product'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`

const Modal = styled.div`
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  padding: 2rem;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
  position: relative;
`

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 1rem;
  padding: 0.25rem;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }
`

const Progress = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.5rem;
`

const Dot = styled.div<{ $done: boolean; $current: boolean }>`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: ${({ $done, $current }) =>
    $done ? '#1a1a1a' : $current ? '#666' : '#e0e0e0'};
  transition: background 0.3s;
`

const QuestionText = styled.h3`
  font-size: 1.15rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  margin: 0 0 1.25rem;
  line-height: 1.4;
`

interface OptionProps {
  $selected: boolean
  $color: string
}

const OptionCard = styled.button<OptionProps>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  margin-bottom: 0.6rem;
  background: ${({ $selected }) => ($selected ? '#f0f0f0' : '#fff')};
  border: 2px solid ${({ $selected, $color }) => ($selected ? $color : 'rgba(0,0,0,0.08)')};
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textDark};
  line-height: 1.4;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ $color }) => $color};
    background: #fafafa;
  }

  &:last-child {
    margin-bottom: 0;
  }
`

const Radio = styled.span<{ $selected: boolean; $color: string }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${({ $selected, $color }) => ($selected ? $color : '#ccc')};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  &::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ $selected, $color }) => ($selected ? $color : 'transparent')};
    transition: all 0.2s;
  }
`

const NavRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
`

const BackBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  color: #888;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }
`

const NextBtn = styled.button<{ $disabled: boolean; $color: string }>`
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: ${({ $disabled, $color }) => ($disabled ? '#ccc' : $color)};
  color: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  transition: opacity 0.2s;

  &:hover {
    opacity: ${({ $disabled }) => ($disabled ? 1 : 0.9)};
  }
`

const ResultWrap = styled.div`
  text-align: center;
`

const ResultBadge = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  background: ${({ $color }) => $color};
  color: #fff;
  font-weight: 600;
  font-size: 1.05rem;
  margin: 0.5rem 0 0.75rem;

  svg {
    font-size: 1rem;
  }
`

const ResultIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
`

const ResultDesc = styled.p`
  font-size: 0.9rem;
  line-height: 1.6;
  color: #555;
  margin: 0 0 1.5rem;
`

const UseBtn = styled.button<{ $color: string }>`
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  color: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`

const OrLink = styled.button`
  display: block;
  margin: 0.75rem auto 0;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.8rem;
  color: #999;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;

  &:hover {
    color: #555;
  }
`

const levelConfig: Record<UserLevel, { color: string; icon: string; label: string; desc: string }> = {
  beginner: {
    color: '#16A34A',
    icon: 'faSeedling',
    label: 'Nybegynner',
    desc: 'Du har lite eller ingen erfaring med trearbeid. Perfekt – vi starter helt fra bunnen med enkle prosjekter og grunnleggende verktøykunnskap.',
  },
  intermediate: {
    color: '#EA580C',
    icon: 'faStar',
    label: 'Middels',
    desc: 'Du har bygget litt før og kjenner til grunnleggende verktøy. Vi gir deg prosjekter og teknikker som tar deg videre.',
  },
  advanced: {
    color: '#DC2626',
    icon: 'faRocket',
    label: 'Avansert',
    desc: 'Du er erfaren og har god kontroll på verktøy og teknikker. Her får du krevende prosjekter og profesjonelle tips.',
  },
}

function determineLevel(answers: UserLevel[]): UserLevel {
  const counts = { beginner: 0, intermediate: 0, advanced: 0 }
  answers.forEach((a) => counts[a]++)
  if (counts.advanced >= 2) return 'advanced'
  if (counts.intermediate >= 2) return 'intermediate'
  return 'beginner'
}

interface Props {
  onComplete: (level: UserLevel) => void
  onClose: () => void
}

export default function LevelQuiz({ onComplete, onClose }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<UserLevel[]>([])
  const [selected, setSelected] = useState<UserLevel | null>(null)
  const [result, setResult] = useState<UserLevel | null>(null)

  const total = quizQuestions.length
  const isResult = result !== null

  const handleSelect = (val: UserLevel) => {
    setSelected(val)
  }

  const handleNext = () => {
    if (!selected) return
    const newAnswers = [...answers, selected]
    if (step < total - 1) {
      setAnswers(newAnswers)
      setStep((s) => s + 1)
      setSelected(null)
    } else {
      const level = determineLevel(newAnswers)
      setResult(level)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1)
      setSelected(answers[step - 1])
      setAnswers((a) => a.slice(0, -1))
    }
  }

  const closeQuiz = () => {
    if (result) {
      localStorage.setItem('diyLevel', result)
      onComplete(result)
    }
  }

  if (isResult) {
    const cfg = levelConfig[result]
    return (
      <Overlay onClick={onClose}>
        <Modal onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={onClose}>
            <Icon name="faTimes" />
          </CloseButton>
          <ResultWrap>
            <ResultIcon>
              <Icon name={cfg.icon} />
            </ResultIcon>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>Din anbefalte startnivå</p>
            <ResultBadge $color={cfg.color}>
              <Icon name={cfg.icon} /> {cfg.label}
            </ResultBadge>
            <ResultDesc>{cfg.desc}</ResultDesc>
            <UseBtn $color={cfg.color} onClick={closeQuiz}>
              Bruk dette nivået
            </UseBtn>
            <OrLink onClick={onClose}>Velg nivå selv</OrLink>
          </ResultWrap>
        </Modal>
      </Overlay>
    )
  }

  const question = quizQuestions[step]

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <Icon name="faTimes" />
        </CloseButton>

        <Progress>
          {Array.from({ length: total }, (_, i) => (
            <Dot key={i} $done={i < step} $current={i === step} />
          ))}
        </Progress>

        <QuestionText>{question.question}</QuestionText>

        {question.options.map((opt) => (
          <OptionCard
            key={opt.value}
            $selected={selected === opt.value}
            $color={levelConfig[opt.value].color}
            onClick={() => handleSelect(opt.value)}
          >
            <Radio $selected={selected === opt.value} $color={levelConfig[opt.value].color} />
            {opt.label}
          </OptionCard>
        ))}

        <NavRow>
          <BackBtn onClick={handleBack} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
            <Icon name="faArrowLeft" /> Tilbake
          </BackBtn>
          <NextBtn
            $disabled={!selected}
            $color={levelConfig[answers.length > 0 ? answers[answers.length - 1] : 'beginner'].color}
            onClick={handleNext}
          >
            {step < total - 1 ? 'Neste' : 'Se mitt nivå'} <Icon name="faArrowRight" />
          </NextBtn>
        </NavRow>
      </Modal>
    </Overlay>
  )
}
