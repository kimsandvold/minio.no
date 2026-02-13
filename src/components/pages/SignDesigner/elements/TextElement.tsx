import type { TextDesignElement } from '../../../../types/design'

interface Props {
  element: TextDesignElement
  isSelected: boolean
}

export default function TextElement({ element, isSelected }: Props) {
  const anchorX =
    element.textAnchor === 'middle'
      ? element.x + element.width / 2
      : element.textAnchor === 'end'
        ? element.x + element.width
        : element.x

  return (
    <text
      x={anchorX}
      y={element.y + element.fontSize}
      fill={element.fill}
      stroke={isSelected ? '#1da1f2' : element.stroke}
      strokeWidth={isSelected ? 0.3 : element.strokeWidth}
      opacity={element.opacity}
      fontFamily={element.fontFamily}
      fontSize={element.fontSize}
      fontWeight={element.fontWeight}
      textAnchor={element.textAnchor}
      letterSpacing={element.letterSpacing}
      transform={element.rotation ? `rotate(${element.rotation} ${element.x + element.width / 2} ${element.y + element.height / 2})` : undefined}
      style={{ cursor: 'move', userSelect: 'none' }}
    >
      {element.text}
    </text>
  )
}
