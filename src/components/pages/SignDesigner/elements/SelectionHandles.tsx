import type { DesignElement, Point } from '../../../../types/design'

interface Props {
  element: DesignElement
  onResizeStart: (corner: string, startPoint: Point) => void
}

const HANDLE_SIZE = 10
const HIT_AREA_SIZE = 24

export default function SelectionHandles({ element, onResizeStart }: Props) {
  if (element.type === 'line') {
    return (
      <g>
        {/* Invisible hit area for line start */}
        <circle cx={element.x} cy={element.y} r={HIT_AREA_SIZE / 2} fill="transparent" style={{ cursor: 'nw-resize' }}
          onPointerDown={e => { e.stopPropagation(); onResizeStart('line-start', { x: e.clientX, y: e.clientY }) }} />
        <circle cx={element.x} cy={element.y} r={HANDLE_SIZE / 2} fill="#1da1f2" stroke="#fff" strokeWidth={0.5} pointerEvents="none" />
        {/* Invisible hit area for line end */}
        <circle cx={element.x2} cy={element.y2} r={HIT_AREA_SIZE / 2} fill="transparent" style={{ cursor: 'se-resize' }}
          onPointerDown={e => { e.stopPropagation(); onResizeStart('line-end', { x: e.clientX, y: e.clientY }) }} />
        <circle cx={element.x2} cy={element.y2} r={HANDLE_SIZE / 2} fill="#1da1f2" stroke="#fff" strokeWidth={0.5} pointerEvents="none" />
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
        fill="none" stroke="#1da1f2" strokeWidth={1.5}
        strokeDasharray="4 3" pointerEvents="none"
      />
      {corners.map(c => (
        <g key={c.id}>
          {/* Invisible hit area for easier touch targeting */}
          <rect
            x={c.cx - HIT_AREA_SIZE / 2}
            y={c.cy - HIT_AREA_SIZE / 2}
            width={HIT_AREA_SIZE}
            height={HIT_AREA_SIZE}
            fill="transparent"
            style={{ cursor: c.cursor }}
            onPointerDown={e => { e.stopPropagation(); onResizeStart(c.id, { x: e.clientX, y: e.clientY }) }}
          />
          {/* Visible handle */}
          <rect
            x={c.cx - HANDLE_SIZE / 2}
            y={c.cy - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="#fff"
            stroke="#1da1f2"
            strokeWidth={1}
            pointerEvents="none"
          />
        </g>
      ))}
    </g>
  )
}
