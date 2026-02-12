import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { promoPulse } from '../../styles/animations'

const Banner = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
  padding: 0.9rem 1.5rem;
  background: rgba(29, 161, 242, 0.25);
  border: 1px solid rgba(29, 161, 242, 0.5);
  border-radius: 50px;
  color: white;
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  animation: ${promoPulse} 3s ease-in-out infinite;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &:hover {
    background: rgba(29, 161, 242, 0.35);
    border-color: rgba(29, 161, 242, 0.7);
    transform: translateY(-2px);
  }

  strong {
    color: #1da1f2;
  }

  @media (max-width: 600px) {
    font-size: 0.85rem;
    padding: 0.75rem 1.25rem;
  }
`

const Arrow = styled.span`
  opacity: 0.6;
  transition: transform 0.2s;
  ${Banner}:hover & {
    transform: translateX(3px);
    opacity: 1;
  }
`

export default function GamePromoBanner() {
  return (
    <Banner to="/underholdning">
      <span style={{ fontSize: '1.3rem' }}>🎮</span>
      <span>Spill et spill og få <strong>10% rabattkode</strong> på varmepumpehus!</span>
      <Arrow>→</Arrow>
    </Banner>
  )
}
