import styled from 'styled-components'
import { doorSignTemplates } from '../../../data/doorSignTemplates'

const Panel = styled.div`
  width: 220px;
  background: #1a1a1a;
  border-right: 1px solid #333;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    max-height: 45vh;
    border-right: none;
    border-bottom: 1px solid #333;
  }
`

const PanelTitle = styled.div`
  padding: 0.75rem 0.75rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #888;
  border-bottom: 1px solid #333;
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0.5rem;
  flex: 1;
  overflow-y: auto;
`

const Card = styled.button`
  display: flex;
  flex-direction: column;
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s, background 0.15s;
  text-align: left;

  &:hover {
    border-color: #1da1f2;
    background: #333;
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
  }
`

const Preview = styled.div`
  width: 100%;
  aspect-ratio: 5 / 2;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;

  svg {
    width: 100%;
    height: 100%;
  }
`

const CardInfo = styled.div`
  padding: 6px 8px;
`

const CardName = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #eee;
  margin-bottom: 2px;
`

const CardDesc = styled.div`
  font-size: 0.6rem;
  color: #888;
  line-height: 1.3;
`

/* Inline SVG previews for each template */

function KlassiskPreview() {
  return (
    <svg viewBox="0 0 500 200">
      <line x1={40} y1={55} x2={460} y2={55} stroke="#1a1a1a" strokeWidth={2} />
      <text x={250} y={110} textAnchor="middle" fontSize={34} fontWeight={600} fontFamily="Inter, sans-serif" fill="#1a1a1a">Ola Nilsens veg 23</text>
      <line x1={40} y1={145} x2={460} y2={145} stroke="#1a1a1a" strokeWidth={2} />
    </svg>
  )
}

function ModernePreview() {
  return (
    <svg viewBox="0 0 500 150">
      <text x={40} y={52} textAnchor="start" fontSize={22} fontWeight={300} fontFamily="Inter, sans-serif" fill="#1a1a1a" letterSpacing={3}>Ola Nilsens veg</text>
      <text x={460} y={68} textAnchor="end" fontSize={58} fontWeight={700} fontFamily="Inter, sans-serif" fill="#1a1a1a">23</text>
      <line x1={40} y1={110} x2={460} y2={110} stroke="#1a1a1a" strokeWidth={1} />
    </svg>
  )
}

function InnrammetPreview() {
  return (
    <svg viewBox="0 0 500 200">
      <rect x={20} y={20} width={460} height={160} rx={12} ry={12} fill="none" stroke="#1a1a1a" strokeWidth={3} />
      <text x={250} y={110} textAnchor="middle" fontSize={34} fontWeight={600} fontFamily="Inter, sans-serif" fill="#1a1a1a">Ola Nilsens veg 23</text>
    </svg>
  )
}

function StorNummerPreview() {
  return (
    <svg viewBox="0 0 400 280">
      <text x={200} y={110} textAnchor="middle" fontSize={86} fontWeight={700} fontFamily="Inter, sans-serif" fill="#1a1a1a">23</text>
      <line x1={100} y1={150} x2={300} y2={150} stroke="#1a1a1a" strokeWidth={2} />
      <text x={200} y={195} textAnchor="middle" fontSize={24} fontWeight={400} fontFamily="Inter, sans-serif" fill="#1a1a1a" letterSpacing={3}>Ola Nilsens veg</text>
    </svg>
  )
}

function TodeltPreview() {
  return (
    <svg viewBox="0 0 500 200">
      <text x={120} y={120} textAnchor="middle" fontSize={68} fontWeight={700} fontFamily="Inter, sans-serif" fill="#1a1a1a">23</text>
      <line x1={240} y1={30} x2={240} y2={170} stroke="#1a1a1a" strokeWidth={2} />
      <text x={265} y={95} textAnchor="start" fontSize={26} fontWeight={600} fontFamily="Inter, sans-serif" fill="#1a1a1a">Ola Nilsens</text>
      <text x={265} y={125} textAnchor="start" fontSize={20} fontWeight={300} fontFamily="Inter, sans-serif" fill="#1a1a1a" letterSpacing={2}>veg</text>
    </svg>
  )
}

const previews: Record<string, () => JSX.Element> = {
  'klassisk': KlassiskPreview,
  'moderne': ModernePreview,
  'innrammet': InnrammetPreview,
  'stor-nummer': StorNummerPreview,
  'todelt': TodeltPreview,
}

interface Props {
  onApplyTemplate: (templateId: string) => void
}

export default function TemplatePickerPanel({ onApplyTemplate }: Props) {
  return (
    <Panel>
      <PanelTitle>Velg mal</PanelTitle>
      <List>
        {doorSignTemplates.map(t => {
          const PreviewComponent = previews[t.id]
          return (
            <Card key={t.id} onClick={() => onApplyTemplate(t.id)}>
              <Preview>
                {PreviewComponent && <PreviewComponent />}
              </Preview>
              <CardInfo>
                <CardName>{t.name}</CardName>
                <CardDesc>{t.description}</CardDesc>
              </CardInfo>
            </Card>
          )
        })}
      </List>
    </Panel>
  )
}
