import { useRef, useEffect, useState } from 'react'
import type { TextDesignElement } from '../../../../types/design'

function measureTextWidth(text: string, font: string): number {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = font
  return ctx.measureText(text).width
}

interface Props {
  element: TextDesignElement
  isSelected: boolean
  isEditing: boolean
  onTextCommit: (text: string) => void
}

export default function TextElement({ element, isEditing, onTextCommit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [liveWidth, setLiveWidth] = useState(element.width)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Reset live width when element width changes externally
  useEffect(() => { setLiveWidth(element.width) }, [element.width])

  const fontString = `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`

  const handleInput = (value: string) => {
    const measured = measureTextWidth(value, fontString) + element.fontSize * 0.5
    setLiveWidth(Math.max(measured, 20))
  }

  const anchorX =
    element.textAnchor === 'middle'
      ? element.x + element.width / 2
      : element.textAnchor === 'end'
        ? element.x + element.width
        : element.x

  const transform = element.rotation
    ? `rotate(${element.rotation} ${element.x + element.width / 2} ${element.y + element.height / 2})`
    : undefined

  if (isEditing) {
    const textAlign =
      element.textAnchor === 'middle' ? 'center'
        : element.textAnchor === 'end' ? 'right'
          : 'left'

    return (
      <foreignObject
        x={element.x}
        y={element.y}
        width={Math.max(liveWidth, 20)}
        height={element.height + element.fontSize * 0.4}
        transform={transform}
      >
        <input
          ref={inputRef}
          defaultValue={element.text}
          onBlur={e => onTextCommit(e.currentTarget.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onTextCommit(e.currentTarget.value)
            }
            e.stopPropagation()
          }}
          onInput={e => handleInput(e.currentTarget.value)}
          onMouseDown={e => e.stopPropagation()}
          style={{
            width: '100%',
            height: '100%',
            padding: 0,
            margin: 0,
            border: '1px solid #1da1f2',
            outline: 'none',
            background: 'rgba(255,255,255,0.9)',
            fontFamily: element.fontFamily,
            fontSize: `${element.fontSize}px`,
            fontWeight: element.fontWeight,
            letterSpacing: `${element.letterSpacing}px`,
            textAlign,
            color: element.fill,
            boxSizing: 'border-box',
          }}
        />
      </foreignObject>
    )
  }

  return (
    <text
      x={anchorX}
      y={element.y + element.fontSize}
      fill={element.fill}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      opacity={element.opacity}
      fontFamily={element.fontFamily}
      fontSize={element.fontSize}
      fontWeight={element.fontWeight}
      textAnchor={element.textAnchor}
      letterSpacing={element.letterSpacing}
      transform={transform}
      style={{ cursor: 'move', userSelect: 'none' }}
    >
      {element.text}
    </text>
  )
}
