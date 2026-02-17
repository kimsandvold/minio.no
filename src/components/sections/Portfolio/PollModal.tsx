import { useState } from 'react'
import styled from 'styled-components'
import Modal from '../../shared/Modal/Modal'
import GoogleLoginButton from '../../shared/GoogleLoginButton'
import Button from '../../shared/Button'
import { useAuthContext } from '../../../context/AuthContext'
import { usePoll } from '../../../hooks/usePoll'


const Wrapper = styled.div`
  padding: 2.5rem 2rem;
  text-align: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1.25rem;
  }
`

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
  margin: 0 0 0.5rem;
`

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: #666;
  margin: 0 0 2rem;
  line-height: 1.6;
`

const LoginPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;

  p {
    font-size: 0.9rem;
    color: #888;
    margin: 0;
  }
`

const OptionsList = styled.div`
  text-align: left;
  max-width: 360px;
  margin: 0 auto 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`

const OptionLabel = styled.label<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 2px solid ${({ $selected }) => ($selected ? '#333' : '#e2e8f0')};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  color: #333;
  background: ${({ $selected }) => ($selected ? '#f7f8fa' : '#fff')};

  &:hover {
    border-color: #999;
  }

  input {
    accent-color: #333;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`

const OtherInput = styled.input`
  width: 100%;
  max-width: 360px;
  margin: 0 auto 1.5rem;
  display: block;
  padding: 0.7rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #333;
  }
`

const ErrorMsg = styled.p`
  color: #e53e3e;
  font-size: 0.85rem;
  margin: 0.5rem 0 0;
`

const ThankYou = styled.div`
  padding: 1rem 0;

  svg {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
    line-height: 1.6;
  }
`

const ResultsSection = styled.div`
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const ResultRow = styled.div`
  position: relative;
`

const ResultLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
  color: #333;
  font-weight: 500;
`

const BarTrack = styled.div`
  width: 100%;
  height: 28px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
`

const BarFill = styled.div<{ $pct: number; $highlight: boolean }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ $highlight }) => ($highlight ? '#333' : '#a0aec0')};
  border-radius: 6px;
  transition: width 0.5s ease;
  min-width: ${({ $pct }) => ($pct > 0 ? '4px' : '0')};
`

const TotalVotes = styled.p`
  text-align: center;
  font-size: 0.85rem;
  color: #999;
  margin: 1rem 0 0;
`

const OtherVotesList = styled.div`
  margin-top: 1rem;
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;

  h4 {
    font-size: 0.9rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 0.5rem;
  }

  ul {
    list-style: disc;
    padding-left: 1.25rem;
    margin: 0;
  }

  li {
    font-size: 0.85rem;
    color: #666;
    line-height: 1.6;
  }
`

const ToggleLink = styled.button`
  display: inline-block;
  margin-top: 1.25rem;
  background: none;
  border: none;
  color: #666;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;

  &:hover {
    color: #333;
  }
`

interface PollModalProps {
  pollId: string
  isOpen: boolean
  onClose: () => void
}

export default function PollModal({ pollId, isOpen, onClose }: PollModalProps) {
  const { isAuthenticated, isAdmin } = useAuthContext()
  const { pollData, hasVoted, userVote, loading, submitting, error, submitVote } =
    usePoll(pollId)
  const [selected, setSelected] = useState('')
  const [otherText, setOtherText] = useState('')
  const [showResults, setShowResults] = useState(false)

  const handleSubmit = async () => {
    if (!selected) return
    if (selected === 'Annet' && !otherText.trim()) return
    await submitVote(selected, selected === 'Annet' ? otherText.trim() : undefined)
  }

  const totalVotes = pollData
    ? Object.values(pollData.votes).reduce((a, b) => a + b, 0)
    : 0

  const renderContent = () => {
    if (loading) {
      return (
        <Wrapper>
          <Title>Laster...</Title>
        </Wrapper>
      )
    }

    // Admin results toggle
    if (isAdmin && showResults && pollData) {
      return (
        <Wrapper>
          <Title>Avstemningsresultater</Title>
          <Subtitle>{pollData.question}</Subtitle>
          <ResultsSection>
            {pollData.options.map((opt) => {
              const count = pollData.votes[opt] || 0
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              return (
                <ResultRow key={opt}>
                  <ResultLabel>
                    <span>{opt}</span>
                    <span>{count} ({pct}%)</span>
                  </ResultLabel>
                  <BarTrack>
                    <BarFill
                      $pct={pct}
                      $highlight={userVote?.option === opt}
                    />
                  </BarTrack>
                </ResultRow>
              )
            })}
          </ResultsSection>
          <TotalVotes>{totalVotes} stemme{totalVotes !== 1 ? 'r' : ''} totalt</TotalVotes>
          {pollData.otherVotes && pollData.otherVotes.length > 0 && (
            <OtherVotesList>
              <h4>«Annet»-forslag:</h4>
              <ul>
                {pollData.otherVotes.map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
            </OtherVotesList>
          )}
          <ToggleLink onClick={() => setShowResults(false)}>
            &larr; Tilbake til avstemning
          </ToggleLink>
        </Wrapper>
      )
    }

    // Not logged in
    if (!isAuthenticated) {
      return (
        <Wrapper>
          <Title>Hva vil du at vi lager?</Title>
          <Subtitle>Logg inn for å stemme på ditt favorittprodukt</Subtitle>
          <LoginPrompt>
            <p>Du må logge inn for å stemme</p>
            <GoogleLoginButton />
          </LoginPrompt>
        </Wrapper>
      )
    }

    // Already voted (non-admin)
    if (hasVoted) {
      return (
        <Wrapper>
          <ThankYou>
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2" />
              <path d="M20 33l8 8 16-16" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>Takk for din stemme!</h3>
            <p>
              Du stemte på <strong>{userVote?.option}</strong>
              {userVote?.otherText && <> — «{userVote.otherText}»</>}.
              Vi tar med ønskene dine i planleggingen!
            </p>
          </ThankYou>
        </Wrapper>
      )
    }

    // Voting form
    return (
      <Wrapper>
        <Title>Hva vil du at vi lager?</Title>
        <Subtitle>
          {pollData?.question || 'Stem på produktene du ønsker å se i nettbutikken'}
        </Subtitle>
        <OptionsList>
          {(pollData?.options ?? []).map((opt) => (
            <OptionLabel key={opt} $selected={selected === opt}>
              <input
                type="radio"
                name="poll-option"
                value={opt}
                checked={selected === opt}
                onChange={() => setSelected(opt)}
              />
              {opt}
            </OptionLabel>
          ))}
        </OptionsList>
        {selected === 'Annet' && (
          <OtherInput
            type="text"
            placeholder="Hva ønsker du deg?"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            maxLength={100}
          />
        )}
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!selected || submitting || (selected === 'Annet' && !otherText.trim())}
        >
          {submitting ? 'Sender...' : 'Send inn stemme'}
        </Button>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        {isAdmin && (
          <ToggleLink onClick={() => setShowResults(true)}>
            Se resultater
          </ToggleLink>
        )}
      </Wrapper>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="500px">
      {renderContent()}
    </Modal>
  )
}
