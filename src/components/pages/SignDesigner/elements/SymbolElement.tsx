import { designerSymbols } from '../../../../data/designerSymbols'
import type { SymbolDesignElement } from '../../../../types/design'

interface Props {
  element: SymbolDesignElement
  isSelected: boolean
}

export default function SymbolElement({ element, isSelected }: Props) {
  const symbol = designerSymbols.find(s => s.id === element.symbolId)
  if (!symbol) return null

  return (
    <g
      transform={`translate(${element.x}, ${element.y})${element.rotation ? ` rotate(${element.rotation} ${element.width / 2} ${element.height / 2})` : ''}`}
      style={{ cursor: 'move' }}
    >
      <svg
        viewBox={symbol.viewBox}
        width={element.width}
        height={element.height}
        overflow="visible"
      >
        <path
          d={symbol.path}
          fill={element.fill}
          stroke={isSelected ? '#1da1f2' : element.stroke}
          strokeWidth={element.strokeWidth}
          opacity={element.opacity}
        />
      </svg>
    </g>
  )
}
