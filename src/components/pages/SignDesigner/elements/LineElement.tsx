import type { LineDesignElement } from '../../../../types/design'

interface Props {
  element: LineDesignElement
  isSelected: boolean
}

export default function LineElement({ element, isSelected }: Props) {
  return (
    <g>
      {/* Invisible wider hit area for easier clicking */}
      <line
        x1={element.x}
        y1={element.y}
        x2={element.x2}
        y2={element.y2}
        stroke="transparent"
        strokeWidth={12}
        style={{ cursor: 'move' }}
      />
      <line
        x1={element.x}
        y1={element.y}
        x2={element.x2}
        y2={element.y2}
        stroke={isSelected ? '#1da1f2' : element.stroke}
        strokeWidth={Math.max(element.strokeWidth, 1)}
        opacity={element.opacity}
        strokeLinecap="round"
        style={{ cursor: 'move', pointerEvents: 'none' }}
      />
    </g>
  )
}
