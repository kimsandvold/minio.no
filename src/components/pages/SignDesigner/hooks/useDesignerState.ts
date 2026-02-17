import { useReducer, useCallback } from 'react'
import type { DesignerState, DesignerAction, SignDesign, DesignElement } from '../../../../types/design'

const MAX_UNDO = 50

const initialDesign: SignDesign = {
  canvasWidth: 1440,
  canvasHeight: 900,
  elements: [],
  backgroundColor: 'transparent',
}

const initialState: DesignerState = {
  design: initialDesign,
  selectedElementId: null,
  tool: 'select',
  undoStack: [],
  redoStack: [],
  isPanning: false,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
}

function pushUndo(state: DesignerState): { undoStack: SignDesign[]; redoStack: SignDesign[] } {
  const undoStack = [...state.undoStack, structuredClone(state.design)].slice(-MAX_UNDO)
  return { undoStack, redoStack: [] }
}

function designerReducer(state: DesignerState, action: DesignerAction): DesignerState {
  switch (action.type) {
    case 'ADD_ELEMENT': {
      const history = pushUndo(state)
      return {
        ...state,
        ...history,
        design: {
          ...state.design,
          elements: [...state.design.elements, action.element],
        },
        selectedElementId: action.element.id,
        tool: 'select',
      }
    }

    case 'UPDATE_ELEMENT': {
      const history = pushUndo(state)
      return {
        ...state,
        ...history,
        design: {
          ...state.design,
          elements: state.design.elements.map(el =>
            el.id === action.id ? { ...el, ...action.changes } as DesignElement : el,
          ),
        },
      }
    }

    case 'DELETE_ELEMENT': {
      const history = pushUndo(state)
      return {
        ...state,
        ...history,
        design: {
          ...state.design,
          elements: state.design.elements.filter(el => el.id !== action.id),
        },
        selectedElementId: state.selectedElementId === action.id ? null : state.selectedElementId,
      }
    }

    case 'DUPLICATE_ELEMENT': {
      const el = state.design.elements.find(e => e.id === action.id)
      if (!el) return state
      const history = pushUndo(state)
      const newEl: DesignElement = {
        ...structuredClone(el),
        id: crypto.randomUUID(),
        x: el.x + 10,
        y: el.y + 10,
      }
      return {
        ...state,
        ...history,
        design: {
          ...state.design,
          elements: [...state.design.elements, newEl],
        },
        selectedElementId: newEl.id,
      }
    }

    case 'SELECT_ELEMENT':
      return { ...state, selectedElementId: action.id }

    case 'SET_TOOL':
      return { ...state, tool: action.tool, selectedElementId: null }

    case 'SET_CANVAS_SIZE': {
      const history = pushUndo(state)
      return {
        ...state,
        ...history,
        design: { ...state.design, canvasWidth: action.width, canvasHeight: action.height },
      }
    }

    case 'SET_BACKGROUND_COLOR': {
      const history = pushUndo(state)
      return {
        ...state,
        ...history,
        design: { ...state.design, backgroundColor: action.color },
      }
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state
      const prev = state.undoStack[state.undoStack.length - 1]
      return {
        ...state,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, structuredClone(state.design)].slice(-MAX_UNDO),
        design: prev,
        selectedElementId: null,
      }
    }

    case 'REDO': {
      if (state.redoStack.length === 0) return state
      const next = state.redoStack[state.redoStack.length - 1]
      return {
        ...state,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, structuredClone(state.design)].slice(-MAX_UNDO),
        design: next,
        selectedElementId: null,
      }
    }

    case 'LOAD_DESIGN':
      return {
        ...initialState,
        design: action.design,
        zoom: state.zoom,
        panOffset: state.panOffset,
      }

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.zoom)) }

    case 'SET_PAN_OFFSET':
      return { ...state, panOffset: action.offset }

    case 'MOVE_ELEMENT_ORDER': {
      const idx = state.design.elements.findIndex(e => e.id === action.id)
      if (idx === -1) return state
      const newIdx = action.direction === 'up' ? idx + 1 : idx - 1
      if (newIdx < 0 || newIdx >= state.design.elements.length) return state
      const history = pushUndo(state)
      const els = [...state.design.elements]
      ;[els[idx], els[newIdx]] = [els[newIdx], els[idx]]
      return {
        ...state,
        ...history,
        design: { ...state.design, elements: els },
      }
    }

    default:
      return state
  }
}

export function useDesignerState() {
  const [state, dispatch] = useReducer(designerReducer, initialState)

  const selectedElement = state.selectedElementId
    ? state.design.elements.find(el => el.id === state.selectedElementId) ?? null
    : null

  const canUndo = state.undoStack.length > 0
  const canRedo = state.redoStack.length > 0

  const generateId = useCallback(() => crypto.randomUUID(), [])

  return { state, dispatch, selectedElement, canUndo, canRedo, generateId }
}
