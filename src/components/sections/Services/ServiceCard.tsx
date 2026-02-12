import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../../shared/Icon'
import type { ServiceData } from '../../../types/product'

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  &:last-child { border-bottom: none; }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem 0;
  }
`

const ServiceIcon = styled.div`
  font-size: 2.5rem;
  color: #4a4a4a;
  margin-bottom: 1rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 3rem;
  }
`

const Title = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 0.75rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.3rem;
  }
`

const Description = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: #555;
  margin-bottom: 1.5rem;
  flex-grow: 1;

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    line-height: 1.7;
  }
`

const Buttons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
`

const ContactButton = styled.button`
  padding: 0.9rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  transition: all 0.3s ease;

  &:hover {
    background-color: #333;
    transform: translateY(-2px);
  }
`

const linkButtonStyles = `
  padding: 0.75rem 1.25rem;
  background-color: transparent;
  border: 2px solid;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
`

const LinkButton = styled.a`
  ${linkButtonStyles}
  color: ${({ theme }) => theme.colors.textDark};
  border-color: ${({ theme }) => theme.colors.textDark};

  &:hover {
    background-color: ${({ theme }) => theme.colors.textDark};
    color: #fff;
    transform: translateY(-2px);
  }
`

const RouterLinkButton = styled(Link)`
  ${linkButtonStyles}
  color: ${({ theme }) => theme.colors.textDark};
  border-color: ${({ theme }) => theme.colors.textDark};

  &:hover {
    background-color: ${({ theme }) => theme.colors.textDark};
    color: #fff;
    transform: translateY(-2px);
  }
`

function navigateToContact(subject: string) {
  window.location.href = `/kontakt?subject=${encodeURIComponent(subject)}`
}

interface ServiceCardProps {
  service: ServiceData
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card>
      <ServiceIcon>
        <Icon name={service.icon} />
      </ServiceIcon>
      <Title>{service.title}</Title>
      <Description>{service.description}</Description>
      <Buttons>
        {service.externalLink && (
          service.externalLink.href.startsWith('/') ? (
            <RouterLinkButton to={service.externalLink.href}>
              <Icon name={service.externalLink.icon} /> {service.externalLink.label}
            </RouterLinkButton>
          ) : (
            <LinkButton href={service.externalLink.href}>
              <Icon name={service.externalLink.icon} /> {service.externalLink.label}
            </LinkButton>
          )
        )}
        <ContactButton onClick={() => navigateToContact(`Jeg er interessert i tjenesten: ${service.serviceName}`)}>
          Ta kontakt
        </ContactButton>
      </Buttons>
    </Card>
  )
}
