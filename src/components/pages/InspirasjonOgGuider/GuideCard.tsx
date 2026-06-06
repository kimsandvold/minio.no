import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import type { GuideItem } from '../../../types/product'

const difficultyConfig: Record<string, { bg: string; label: string }> = {
  beginner: { bg: '#16A34A', label: 'Nybegynner' },
  intermediate: { bg: '#EA580C', label: 'Middels' },
  advanced: { bg: '#DC2626', label: 'Avansert' },
}

const Card = styled(Link)`
  display: block;
  background: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
`

const CardHeader = styled.div`
  background: ${({ theme }) => theme.colors.darkBg};
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;

  svg {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.textLight};
    opacity: 0.8;
  }

  h3 {
    color: ${({ theme }) => theme.colors.textLight};
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.4;
    margin: 0;
  }
`

const CardBody = styled.div`
  padding: 1.25rem;
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`

const Category = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.accent};
`

const ReadTime = styled.span`
  font-size: 0.75rem;
  color: #999;
`

const Excerpt = styled.p`
  font-size: 0.9rem;
  line-height: 1.6;
  color: #555;
  margin: 0 0 1rem;
`

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const ReadMore = styled.span`
  font-weight: 600;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.accent};
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

  svg {
    font-size: 0.7rem;
  }
`

const Badge = styled.span<{ $bg: string }>`
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #fff;
  background: ${({ $bg }) => $bg};
  padding: 0.2rem 0.55rem;
  border-radius: 50px;
  white-space: nowrap;
`

interface Props {
  guide: GuideItem
}

export default function GuideCard({ guide }: Props) {
  const diff = difficultyConfig[guide.difficulty] || difficultyConfig.beginner

  return (
    <Card to={`/inspirasjon-og-guider/${guide.slug}`}>
      <CardHeader>
        <Icon name={guide.icon} />
        <h3>{guide.title}</h3>
      </CardHeader>
      <CardBody>
        <Meta>
          <Category>{guide.category}</Category>
          <ReadTime>{guide.readTime}</ReadTime>
        </Meta>
        <Excerpt>{guide.excerpt}</Excerpt>
        <BottomRow>
          <ReadMore>
            Les guiden <Icon name="faArrowRight" />
          </ReadMore>
          <Badge $bg={diff.bg}>{diff.label}</Badge>
        </BottomRow>
      </CardBody>
    </Card>
  )
}
