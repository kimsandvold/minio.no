import type { Timestamp } from 'firebase/firestore'

export type ToolMode = 'select' | 'template' | 'text' | 'rect' | 'circle' | 'line' | 'symbol'

export interface Point {
  x: number
  y: number
}

interface BaseElement {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
}

export interface RectDesignElement extends BaseElement {
  type: 'rect'
  rx: number
  ry: number
}

export interface CircleDesignElement extends BaseElement {
  type: 'circle'
}

export interface LineDesignElement extends BaseElement {
  type: 'line'
  x2: number
  y2: number
}

export interface TextDesignElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  textAnchor: 'start' | 'middle' | 'end'
  letterSpacing: number
}

export interface SymbolDesignElement extends BaseElement {
  type: 'symbol'
  symbolId: string
}

export type DesignElement =
  | RectDesignElement
  | CircleDesignElement
  | LineDesignElement
  | TextDesignElement
  | SymbolDesignElement

export interface SignDesign {
  canvasWidth: number
  canvasHeight: number
  elements: DesignElement[]
  backgroundColor: string
}

export interface SavedDesign {
  id: string
  userId: string
  name: string
  design: SignDesign
  svgSnapshot: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface DesignerState {
  design: SignDesign
  selectedElementId: string | null
  tool: ToolMode
  undoStack: SignDesign[]
  redoStack: SignDesign[]
  isPanning: boolean
  zoom: number
  panOffset: Point
}

export type DesignerAction =
  | { type: 'ADD_ELEMENT'; element: DesignElement }
  | { type: 'UPDATE_ELEMENT'; id: string; changes: Partial<DesignElement> }
  | { type: 'DELETE_ELEMENT'; id: string }
  | { type: 'DUPLICATE_ELEMENT'; id: string }
  | { type: 'SELECT_ELEMENT'; id: string | null }
  | { type: 'SET_TOOL'; tool: ToolMode }
  | { type: 'SET_CANVAS_SIZE'; width: number; height: number }
  | { type: 'SET_BACKGROUND_COLOR'; color: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_DESIGN'; design: SignDesign }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_PAN_OFFSET'; offset: Point }
  | { type: 'MOVE_ELEMENT_ORDER'; id: string; direction: 'up' | 'down' }
