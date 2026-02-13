import type { RectDesignElement } from '../../../../types/design'

interface Props {
  element: RectDesignElement
  isSelected: boolean
}

export default function RectElement({ element, isSelected }: Props) {
  return (
    <rect
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rx={element.rx}
      ry={element.ry}
      fill={element.fill}
      stroke={isSelected ? '#1da1f2' : element.stroke}
      strokeWidth={element.strokeWidth}
      opacity={element.opacity}
      transform={element.rotation ? `rotate(${element.rotation} ${element.x + element.width / 2} ${element.y + element.height / 2})` : undefined}
      style={{ cursor: 'move' }}
    />
  )
}
