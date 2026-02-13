import type { DesignElement, Point } from '../../../../types/design'

interface Props {
  element: DesignElement
  onResizeStart: (corner: string, startPoint: Point) => void
}

const HANDLE_SIZE = 3

export default function SelectionHandles({ element, onResizeStart }: Props) {
  if (element.type === 'line') {
    return (
      <g>
        <circle cx={element.x} cy={element.y} r={HANDLE_SIZE} fill="#1da1f2" stroke="#fff" strokeWidth={0.5} style={{ cursor: 'nw-resize' }}
          onMouseDown={e => { e.stopPropagation(); onResizeStart('line-start', { x: e.clientX, y: e.clientY }) }} />
        <circle cx={element.x2} cy={element.y2} r={HANDLE_SIZE} fill="#1da1f2" stroke="#fff" strokeWidth={0.5} style={{ cursor: 'se-resize' }}
          onMouseDown={e => { e.stopPropagation(); onResizeStart('line-end', { x: e.clientX, y: e.clientY }) }} />
      </g>
    )
  }

  const { x, y, width, height } = element
  const corners = [
    { id: 'nw', cx: x, cy: y, cursor: 'nw-resize' },
    { id: 'ne', cx: x + width, cy: y, cursor: 'ne-resize' },
    { id: 'sw', cx: x, cy: y + height, cursor: 'sw-resize' },
    { id: 'se', cx: x + width, cy: y + height, cursor: 'se-resize' },
  ]

  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        fill="none" stroke="#1da1f2" strokeWidth={0.5}
        strokeDasharray="2 2" pointerEvents="none"
      />
      {corners.map(c => (
        <rect
          key={c.id}
          x={c.cx - HANDLE_SIZE / 2}
          y={c.cy - HANDLE_SIZE / 2}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
          fill="#fff"
          stroke="#1da1f2"
          strokeWidth={0.5}
          style={{ cursor: c.cursor }}
          onMouseDown={e => { e.stopPropagation(); onResizeStart(c.id, { x: e.clientX, y: e.clientY }) }}
        />
      ))}
    </g>
  )
}
