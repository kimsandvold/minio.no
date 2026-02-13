import type { CircleDesignElement } from '../../../../types/design'

interface Props {
  element: CircleDesignElement
  isSelected: boolean
}

export default function CircleElement({ element, isSelected }: Props) {
  const cx = element.x + element.width / 2
  const cy = element.y + element.height / 2
  const rx = element.width / 2
  const ry = element.height / 2

  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={element.fill}
      stroke={isSelected ? '#1da1f2' : element.stroke}
      strokeWidth={element.strokeWidth}
      opacity={element.opacity}
      transform={element.rotation ? `rotate(${element.rotation} ${cx} ${cy})` : undefined}
      style={{ cursor: 'move' }}
    />
  )
}
