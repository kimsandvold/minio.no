import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from './Icon'

const Banner = styled.div`
  max-width: 1200px;
  margin: 3rem auto 0;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.darkBg};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  color: ${({ theme }) => theme.colors.textLight};
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 1rem;
    text-align: center;
  }
`

const BannerIcon = styled.div`
  font-size: 2rem;
  opacity: 0.8;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

const BannerText = styled.div`
  h3 {
    font-size: 1.15rem;
    margin: 0 0 0.35rem;
    font-weight: 600;
  }

  p {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    line-height: 1.5;
  }
`

const BannerLink = styled(Link)`
  display: inline-block;
  padding: 0.75rem 1.25rem;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  border: 0;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`

interface CrossSellBannerProps {
  icon: string
  heading: string
  description: string
  linkTo: string
  linkText: string
}

export default function CrossSellBanner({ icon, heading, description, linkTo, linkText }: CrossSellBannerProps) {
  return (
    <Banner>
      <BannerIcon>
        <Icon name={icon} />
      </BannerIcon>
      <BannerText>
        <h3>{heading}</h3>
        <p>{description}</p>
      </BannerText>
      <BannerLink to={linkTo}>{linkText}</BannerLink>
    </Banner>
  )
}
