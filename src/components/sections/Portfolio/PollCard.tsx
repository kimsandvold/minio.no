import { useState } from 'react'
import styled from 'styled-components'
import PollModal from './PollModal'

const Card = styled.div`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
`

const Illustration = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
`

const CardBody = styled.div`
  padding: 1.25rem 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;

  h3 {
    font-size: 1.05rem;
    font-weight: 600;
    color: #222;
    margin: 0 0 0.4rem;
    line-height: 1.3;
  }
`

const Description = styled.p`
  font-size: 0.85rem;
  line-height: 1.6;
  color: #666;
  margin: 0 0 auto;
  padding-bottom: 1rem;
`

const VoteButton = styled.button`
  display: block;
  width: calc(100% - 3rem);
  text-align: center;
  padding: 0.75rem 1.5rem;
  margin: 0 1.5rem 1.5rem;
  background: ${({ theme }) => theme.colors.darkBg};
  color: ${({ theme }) => theme.colors.textLight};
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #333;
    transform: translateY(-2px);
  }
`

interface PollCardProps {
  pollId: string
}

export default function PollCard({ pollId }: PollCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Card onClick={() => setIsOpen(true)}>
        <Illustration>
          <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
            <rect x="10" y="60" width="18" height="30" rx="3" fill="#a0aec0" />
            <rect x="35" y="40" width="18" height="50" rx="3" fill="#718096" />
            <rect x="60" y="20" width="18" height="70" rx="3" fill="#4a5568" />
            <rect x="85" y="50" width="18" height="40" rx="3" fill="#a0aec0" />
            <text x="96" y="18" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#4a5568">?</text>
          </svg>
        </Illustration>
        <CardBody>
          <h3>Hva vil du at vi lager?</h3>
          <Description>Stem på produktene du ønsker å se i nettbutikken</Description>
        </CardBody>
        <VoteButton>Stem nå &rarr;</VoteButton>
      </Card>
      <PollModal pollId={pollId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
