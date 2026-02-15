import { useRef, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import type { DesignerState, DesignerAction, DesignElement, Point } from '../../../types/design'
import { useCanvasInteraction } from './hooks/useCanvasInteraction'
import { useElementDrag } from './hooks/useElementDrag'
import { useElementResize } from './hooks/useElementResize'
import RectElement from './elements/RectElement'
import CircleElement from './elements/CircleElement'
import LineElement from './elements/LineElement'
import TextElement from './elements/TextElement'
import SymbolElement from './elements/SymbolElement'
import SelectionHandles from './elements/SelectionHandles'

const CanvasWrapper = styled.div`
  flex: 1;
  background: #2a2a2a;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  touch-action: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 200px;
  }
`

interface Props {
  state: DesignerState
  dispatch: React.Dispatch<DesignerAction>
  selectedElement: DesignElement | null
  generateId: () => string
  svgRef: React.RefObject<SVGSVGElement | null>
  activeSymbolId: string
}

export default function DesignerCanvas({ state, dispatch, selectedElement, generateId, svgRef, activeSymbolId }: Props) {
  const { design, tool, zoom, panOffset } = state
  const wrapperRef = useRef<HTMLDivElement>(null)
  const drawStartRef = useRef<Point | null>(null)
  const drawPreviewRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null)

  const { screenToSvg, invalidateCTM } = useCanvasInteraction(svgRef)
  const { startDrag, snapGuides } = useElementDrag(dispatch, design.elements, screenToSvg, design.canvasWidth, design.canvasHeight)
  const { startResize } = useElementResize(dispatch, design.elements, screenToSvg)

  // Invalidate CTM on zoom/pan changes
  useEffect(() => { invalidateCTM() }, [zoom, panOffset, invalidateCTM])

  // Auto-fit zoom: scale canvas to fill available wrapper area
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const padding = isMobile ? 16 : 40

    const computeFitZoom = () => {
      const availW = wrapper.clientWidth - padding
      const availH = wrapper.clientHeight - padding
      if (availW <= 0 || availH <= 0) return
      const fitZoom = Math.min(availW / design.canvasWidth, availH / design.canvasHeight)
      dispatch({ type: 'SET_ZOOM', zoom: fitZoom })
      dispatch({ type: 'SET_PAN_OFFSET', offset: { x: 0, y: 0 } })
    }

    computeFitZoom()

    const observer = new ResizeObserver(computeFitZoom)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [design.canvasWidth, design.canvasHeight, dispatch])

  // Pinch-to-zoom via touch events on the wrapper
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const getTouchDist = (e: TouchEvent) => {
      const [a, b] = [e.touches[0], e.touches[1]]
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchRef.current = { startDist: getTouchDist(e), startZoom: zoom }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault()
        const dist = getTouchDist(e)
        const scale = dist / pinchRef.current.startDist
        dispatch({ type: 'SET_ZOOM', zoom: Math.max(0.1, Math.min(5, pinchRef.current.startZoom * scale)) })
      }
    }

    const onTouchEnd = () => {
      pinchRef.current = null
    }

    wrapper.addEventListener('touchstart', onTouchStart, { passive: true })
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false })
    wrapper.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      wrapper.removeEventListener('touchstart', onTouchStart)
      wrapper.removeEventListener('touchmove', onTouchMove)
      wrapper.removeEventListener('touchend', onTouchEnd)
    }
  }, [zoom, dispatch])

  const commitTextEdit = useCallback((elementId: string, text: string) => {
    if (text.trim()) {
      const el = design.elements.find(e => e.id === elementId)
      if (el && el.type === 'text') {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        ctx.font = `${el.fontWeight} ${el.fontSize}px ${el.fontFamily}`
        const measured = ctx.measureText(text).width + el.fontSize * 0.5
        dispatch({
          type: 'UPDATE_ELEMENT',
          id: elementId,
          changes: { text, width: Math.max(measured, 20) },
        })
      } else {
        dispatch({ type: 'UPDATE_ELEMENT', id: elementId, changes: { text } })
      }
    }
  }, [dispatch, design.elements])

  // Flush any active text edit by reading the DOM input value
  const flushActiveTextEdit = useCallback(() => {
    if (!editingTextId) return
    const input = svgRef.current?.querySelector('foreignObject input') as HTMLInputElement | null
    if (input) {
      commitTextEdit(editingTextId, input.value)
    }
    setEditingTextId(null)
  }, [editingTextId, commitTextEdit, svgRef])

  const handleTextCommit = useCallback((elementId: string, text: string) => {
    commitTextEdit(elementId, text)
    setEditingTextId(null)
  }, [commitTextEdit])

  // Clear editing if the edited element is deselected or deleted
  useEffect(() => {
    if (editingTextId && editingTextId !== state.selectedElementId) {
      flushActiveTextEdit()
    }
  }, [state.selectedElementId, editingTextId, flushActiveTextEdit])

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    const svgPt = screenToSvg(e.clientX, e.clientY)

    if (tool === 'select') {
      flushActiveTextEdit()
      dispatch({ type: 'SELECT_ELEMENT', id: null })
      return
    }

    if (tool === 'text') {
      const id = generateId()
      dispatch({
        type: 'ADD_ELEMENT',
        element: {
          id, type: 'text', x: svgPt.x, y: svgPt.y,
          width: 120, height: 40, rotation: 0,
          fill: '#000000', stroke: 'none', strokeWidth: 0, opacity: 1,
          text: 'Tekst', fontSize: 32, fontFamily: 'Inter',
          fontWeight: 400, textAnchor: 'start', letterSpacing: 0,
        },
      })
      // Auto-start editing the newly placed text
      setEditingTextId(id)
      return
    }

    if (tool === 'symbol') {
      const id = generateId()
      dispatch({
        type: 'ADD_ELEMENT',
        element: {
          id, type: 'symbol', x: svgPt.x - 50, y: svgPt.y - 50,
          width: 100, height: 100, rotation: 0,
          fill: 'none', stroke: '#000000', strokeWidth: 2, opacity: 1,
          symbolId: activeSymbolId,
        },
      })
      return
    }

    // rect, circle, line — start drawing
    drawStartRef.current = svgPt
  }, [tool, dispatch, generateId, screenToSvg, activeSymbolId, flushActiveTextEdit])

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawStartRef.current) return
    const svgPt = screenToSvg(e.clientX, e.clientY)
    const start = drawStartRef.current
    drawPreviewRef.current = {
      x: Math.min(start.x, svgPt.x),
      y: Math.min(start.y, svgPt.y),
      width: Math.abs(svgPt.x - start.x),
      height: Math.abs(svgPt.y - start.y),
    }
    // Force re-render is handled by state updates; for preview we use a direct DOM approach
    const preview = svgRef.current?.querySelector('[data-draw-preview]') as SVGElement | null
    if (preview && drawPreviewRef.current) {
      const p = drawPreviewRef.current
      if (tool === 'line') {
        preview.setAttribute('x1', String(start.x))
        preview.setAttribute('y1', String(start.y))
        preview.setAttribute('x2', String(svgPt.x))
        preview.setAttribute('y2', String(svgPt.y))
      } else {
        preview.setAttribute('x', String(p.x))
        preview.setAttribute('y', String(p.y))
        preview.setAttribute('width', String(p.width))
        preview.setAttribute('height', String(p.height))
        if (tool === 'circle') {
          preview.setAttribute('cx', String(p.x + p.width / 2))
          preview.setAttribute('cy', String(p.y + p.height / 2))
          preview.setAttribute('rx', String(p.width / 2))
          preview.setAttribute('ry', String(p.height / 2))
        }
      }
      preview.style.display = ''
    }
  }, [screenToSvg, tool, svgRef])

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawStartRef.current) return
    const svgPt = screenToSvg(e.clientX, e.clientY)
    const start = drawStartRef.current
    drawStartRef.current = null

    const preview = svgRef.current?.querySelector('[data-draw-preview]') as SVGElement | null
    if (preview) preview.style.display = 'none'

    const minSize = 3
    const id = generateId()

    if (tool === 'rect') {
      const x = Math.min(start.x, svgPt.x)
      const y = Math.min(start.y, svgPt.y)
      const w = Math.abs(svgPt.x - start.x)
      const h = Math.abs(svgPt.y - start.y)
      if (w < minSize && h < minSize) return
      dispatch({
        type: 'ADD_ELEMENT',
        element: {
          id, type: 'rect', x, y, width: w, height: h, rotation: 0,
          fill: '#000000', stroke: 'none', strokeWidth: 0, opacity: 1, rx: 0, ry: 0,
        },
      })
    } else if (tool === 'circle') {
      const x = Math.min(start.x, svgPt.x)
      const y = Math.min(start.y, svgPt.y)
      const w = Math.abs(svgPt.x - start.x)
      const h = Math.abs(svgPt.y - start.y)
      if (w < minSize && h < minSize) return
      dispatch({
        type: 'ADD_ELEMENT',
        element: {
          id, type: 'circle', x, y, width: w, height: h, rotation: 0,
          fill: '#000000', stroke: 'none', strokeWidth: 0, opacity: 1,
        },
      })
    } else if (tool === 'line') {
      const dx = svgPt.x - start.x
      const dy = svgPt.y - start.y
      if (Math.sqrt(dx * dx + dy * dy) < minSize) return
      dispatch({
        type: 'ADD_ELEMENT',
        element: {
          id, type: 'line',
          x: start.x, y: start.y, x2: svgPt.x, y2: svgPt.y,
          width: Math.abs(dx), height: Math.abs(dy), rotation: 0,
          fill: 'none', stroke: '#000000', strokeWidth: 1, opacity: 1,
        },
      })
    }
  }, [tool, dispatch, generateId, screenToSvg, svgRef])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      dispatch({ type: 'SET_ZOOM', zoom: zoom * delta })
    }
  }, [dispatch, zoom])

  const handleResizeStart = useCallback((corner: string, startPoint: Point) => {
    if (!selectedElement) return
    startResize(selectedElement.id, corner, startPoint)
  }, [selectedElement, startResize])

  const renderElement = (el: DesignElement) => {
    const isSelected = el.id === state.selectedElementId

    switch (el.type) {
      case 'rect':
        return <RectElement key={el.id} element={el} isSelected={isSelected} />
      case 'circle':
        return <CircleElement key={el.id} element={el} isSelected={isSelected} />
      case 'line':
        return <LineElement key={el.id} element={el} isSelected={isSelected} />
      case 'text':
        return (
          <TextElement
            key={el.id}
            element={el}
            isSelected={isSelected}
            isEditing={editingTextId === el.id}
            onTextCommit={text => handleTextCommit(el.id, text)}
          />
        )
      case 'symbol':
        return <SymbolElement key={el.id} element={el} isSelected={isSelected} />
    }
  }

  // Separate pointer handler on each element group
  const handleGroupPointerDown = (el: DesignElement) => (e: React.PointerEvent) => {
    e.stopPropagation()
    if (tool === 'select') {
      // If clicking a different element, commit and exit text editing
      if (editingTextId && editingTextId !== el.id) {
        flushActiveTextEdit()
      }
      dispatch({ type: 'SELECT_ELEMENT', id: el.id })
      // Don't start drag if we're editing this text element
      if (editingTextId !== el.id) {
        startDrag(el.id, e)
      }
    }
  }

  const handleGroupDoubleClick = (el: DesignElement) => (e: React.MouseEvent) => {
    e.stopPropagation()
    if (tool === 'select' && el.type === 'text') {
      setEditingTextId(el.id)
    }
  }

  return (
    <CanvasWrapper ref={wrapperRef} onWheel={handleWheel}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${design.canvasWidth} ${design.canvasHeight}`}
        width={design.canvasWidth * zoom}
        height={design.canvasHeight * zoom}
        style={{
          background: design.backgroundColor === 'transparent'
            ? 'repeating-conic-gradient(#e0e0e0 0% 25%, #fff 0% 50%) 0 0 / 20px 20px'
            : design.backgroundColor,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          cursor: tool === 'select' || tool === 'template' ? 'default' : 'crosshair',
        }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
      >
        {/* Draw preview shapes */}
        {tool === 'rect' && (
          <rect data-draw-preview data-ui-only x={0} y={0} width={0} height={0} fill="none" stroke="#1da1f2" strokeWidth={1.5} strokeDasharray="4 3" style={{ display: 'none' }} />
        )}
        {tool === 'circle' && (
          <ellipse data-draw-preview data-ui-only cx={0} cy={0} rx={0} ry={0} fill="none" stroke="#1da1f2" strokeWidth={1.5} strokeDasharray="4 3" style={{ display: 'none' }} />
        )}
        {tool === 'line' && (
          <line data-draw-preview data-ui-only x1={0} y1={0} x2={0} y2={0} stroke="#1da1f2" strokeWidth={1.5} strokeDasharray="4 3" style={{ display: 'none' }} />
        )}

        {design.elements.map(el => (
          <g key={el.id} onPointerDown={handleGroupPointerDown(el)} onDoubleClick={handleGroupDoubleClick(el)}>
            {renderElement(el)}
          </g>
        ))}

        {selectedElement && (
          <g data-ui-only>
            <SelectionHandles element={selectedElement} onResizeStart={handleResizeStart} />
          </g>
        )}

        {/* Snap guide lines */}
        {snapGuides.vertical && (
          <line
            data-ui-only
            x1={design.canvasWidth / 2} y1={0}
            x2={design.canvasWidth / 2} y2={design.canvasHeight}
            stroke="#ff4081" strokeWidth={0.8} strokeDasharray="6 3"
            pointerEvents="none"
          />
        )}
        {snapGuides.horizontal && (
          <line
            data-ui-only
            x1={0} y1={design.canvasHeight / 2}
            x2={design.canvasWidth} y2={design.canvasHeight / 2}
            stroke="#ff4081" strokeWidth={0.8} strokeDasharray="6 3"
            pointerEvents="none"
          />
        )}
      </svg>
    </CanvasWrapper>
  )
}
