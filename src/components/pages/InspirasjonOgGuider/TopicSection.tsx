import { Link } from 'react-router-dom'
import styled from 'styled-components'
import AnimatedBlock from '../../shared/AnimatedBlock'
import Icon from '../../shared/Icon'
import type { InspirationTopic } from '../../../types/product'

interface ColorMap {
  [key: string]: { bg: string; accent: string }
}

const topicColors: ColorMap = {
  forarbeid: { bg: '#E3F0FF', accent: '#2563EB' },
  verktoy: { bg: '#E6F7E6', accent: '#16A34A' },
  'valg-av-treverk': { bg: '#FFF0E0', accent: '#A0522D' },
  'beis-og-maling': { bg: '#F3E8FF', accent: '#9333EA' },
  vedlikehold: { bg: '#E0F7FA', accent: '#0891B2' },
  default: { bg: '#FFF4E6', accent: '#EA580C' },
}

const Card = styled(Link)<{ $accent: string }>`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  overflow: hidden;
  text-decoration: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-top: 4px solid ${({ $accent }) => $accent};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`

const IconWrap = styled.div<{ $bg: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: ${({ $bg }) => $bg};
  font-size: 1.15rem;
  flex-shrink: 0;
`

const CardBody = styled.div`
  padding: 1.25rem 1.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  flex: 1;
`

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
`

const Title = styled.h3`
  font-size: 1.05rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  margin: 0;
`

const Excerpt = styled.p`
  font-size: 0.85rem;
  line-height: 1.6;
  color: #555;
  margin: 0;
  flex: 1;
`

const FooterLink = styled.div<{ $accent: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.85rem 1.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $accent }) => $accent};
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.4px;

  svg {
    font-size: 0.65rem;
    transition: transform 0.2s;
  }

  ${Card}:hover & svg {
    transform: translateX(3px);
  }
`

interface Props {
  topic: InspirationTopic
  index: number
}

export default function TopicSection({ topic, index }: Props) {
  const color = topicColors[topic.slug] || topicColors.default

  return (
    <AnimatedBlock delay={index * 60}>
      <Card to={`/inspirasjon-og-guider/${topic.slug}`} $accent={color.accent}>
        <CardBody>
          <HeaderRow>
            <IconWrap $bg={color.bg}>
              <Icon name={topic.icon} />
            </IconWrap>
            <Title>{topic.title}</Title>
          </HeaderRow>
          <Excerpt>{topic.excerpt}</Excerpt>
        </CardBody>
        <FooterLink $accent={color.accent}>
          Åpne modul <Icon name="faArrowRight" />
        </FooterLink>
      </Card>
    </AnimatedBlock>
  )
}
