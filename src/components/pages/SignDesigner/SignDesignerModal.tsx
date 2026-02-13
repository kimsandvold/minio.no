import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { useDesignerState } from './hooks/useDesignerState'
import { useSvgExport } from './hooks/useSvgExport'
import { useAuthContext } from '../../../context/AuthContext'
import { createDesign, updateDesign, getUserDesigns } from '../../../services/designService'
import type { SavedDesign } from '../../../types/design'
import DesignerCanvas from './DesignerCanvas'
import DesignerToolbar from './DesignerToolbar'
import DesignerProperties from './DesignerProperties'
import DesignerTopBar from './DesignerTopBar'
import LoadDesignModal from './LoadDesignModal'
import GoogleLoginButton from '../../shared/GoogleLoginButton'
import Icon from '../../shared/Icon'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  background: #111;
`

const LoginOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
`

const LoginCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 2.5rem 2.5rem 2rem;
  max-width: 380px;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
`

const LoginCardIcon = styled.div`
  font-size: 1.8rem;
  color: #666;
`

const LoginCardTitle = styled.h2`
  color: #202020;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
`

const LoginCardText = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
`

const LoginCardClose = styled.button`
  margin-top: 0.5rem;
  background: none;
  border: none;
  color: #999;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;

  &:hover { color: #333; }
`

const EditorLayout = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`

const MAX_DESIGNS = 10

interface Props {
  isOpen: boolean
  onClose: () => void
  initialDesign?: SavedDesign
}

export default function SignDesignerModal({ isOpen, onClose, initialDesign }: Props) {
  const { state, dispatch, selectedElement, generateId } = useDesignerState()
  const { user, isAuthenticated } = useAuthContext()
  const svgRef = useRef<SVGSVGElement>(null)
  const { getSvgString, exportSvg } = useSvgExport(svgRef)

  const [designName, setDesignName] = useState('Mitt skilt')
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null)
  const [showLoad, setShowLoad] = useState(false)
  const [activeSymbolId, setActiveSymbolId] = useState('tree')
  const [designCount, setDesignCount] = useState(0)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')

  // Refs so the auto-save timer callback always reads fresh values
  const latestRef = useRef({
    designName,
    currentDesignId,
    design: state.design,
    user,
  })
  latestRef.current = { designName, currentDesignId, design: state.design, user }

  const lastSavedSnapshot = useRef<string | null>(null)
  const lastSavedName = useRef<string>('Mitt skilt')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSaving = useRef(false)

  const clearAutoSave = () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current)
      autoSaveTimer.current = null
    }
  }

  // Init state when modal opens
  useEffect(() => {
    if (!isOpen) return
    clearAutoSave()
    if (initialDesign) {
      dispatch({ type: 'LOAD_DESIGN', design: initialDesign.design })
      setDesignName(initialDesign.name)
      setCurrentDesignId(initialDesign.id)
      lastSavedSnapshot.current = JSON.stringify(initialDesign.design)
      lastSavedName.current = initialDesign.name
    } else {
      dispatch({ type: 'LOAD_DESIGN', design: { canvasWidth: 700, canvasHeight: 500, elements: [], backgroundColor: 'transparent' } })
      setDesignName('Mitt skilt')
      setCurrentDesignId(null)
      lastSavedSnapshot.current = null
      lastSavedName.current = 'Mitt skilt'
    }
    setSaveStatus('idle')
  }, [isOpen, initialDesign, dispatch])

  // Fetch design count for max limit check
  useEffect(() => {
    if (!isOpen || !user) return
    getUserDesigns(user.sub).then(designs => setDesignCount(designs.length))
  }, [isOpen, user])

  const atMaxDesigns = !currentDesignId && designCount >= MAX_DESIGNS

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  // Single auto-save effect: watches design + name, uses refs for fresh values
  useEffect(() => {
    if (!isOpen) return

    const designJson = JSON.stringify(state.design)
    const designChanged = lastSavedSnapshot.current !== null && designJson !== lastSavedSnapshot.current
    const nameChanged = lastSavedName.current !== designName && lastSavedSnapshot.current !== null

    if (!designChanged && !nameChanged) return

    clearAutoSave()
    autoSaveTimer.current = setTimeout(async () => {
      const { currentDesignId: id, user: u, designName: name, design } = latestRef.current
      if (!id || !u || isSaving.current) return

      isSaving.current = true
      setSaveStatus('saving')
      try {
        const svgSnapshot = getSvgString()
        await updateDesign(id, { name, design, svgSnapshot })
        lastSavedSnapshot.current = JSON.stringify(design)
        lastSavedName.current = name
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(s => s === 'saved' ? 'idle' : s), 2000)
      } catch (err) {
        console.error('Auto-save failed:', err)
        setSaveError(err instanceof Error ? err.message : String(err))
        setSaveStatus('error')
      } finally {
        isSaving.current = false
      }
    }, 2000)

    return clearAutoSave
  }, [state.design, designName, isOpen, getSvgString])

  // Manual save (Lagre button / Cmd+S)
  const handleSave = useCallback(async () => {
    if (!user || isSaving.current) return
    clearAutoSave()
    isSaving.current = true
    setSaveStatus('saving')

    try {
      const svgSnapshot = getSvgString()

      if (currentDesignId) {
        await updateDesign(currentDesignId, {
          name: designName,
          design: state.design,
          svgSnapshot,
        })
      } else {
        const designs = await getUserDesigns(user.sub)
        if (designs.length >= MAX_DESIGNS) {
          alert(`Du kan lagre maks ${MAX_DESIGNS} design. Slett et eksisterende design først.`)
          setSaveStatus('idle')
          isSaving.current = false
          return
        }
        const id = await createDesign({
          userId: user.sub,
          name: designName,
          design: state.design,
          svgSnapshot,
        })
        setCurrentDesignId(id)
        setDesignCount(prev => prev + 1)
      }

      lastSavedSnapshot.current = JSON.stringify(state.design)
      lastSavedName.current = designName
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(s => s === 'saved' ? 'idle' : s), 2000)
    } catch (err) {
      console.error('Save failed:', err)
      setSaveError(err instanceof Error ? err.message : String(err))
      setSaveStatus('error')
    } finally {
      isSaving.current = false
    }
  }, [user, state.design, currentDesignId, designName, getSvgString])

  const handleLoadDesign = useCallback((saved: SavedDesign) => {
    dispatch({ type: 'LOAD_DESIGN', design: saved.design })
    setDesignName(saved.name)
    setCurrentDesignId(saved.id)
    lastSavedSnapshot.current = JSON.stringify(saved.design)
    lastSavedName.current = saved.name
  }, [dispatch])

  const handleExport = useCallback(() => {
    exportSvg(state.design, designName)
  }, [exportSvg, state.design, designName])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === 'z') { e.preventDefault(); dispatch({ type: 'UNDO' }) }
      else if (ctrl && e.key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }) }
      else if (ctrl && e.key === 'd') { e.preventDefault(); if (state.selectedElementId) dispatch({ type: 'DUPLICATE_ELEMENT', id: state.selectedElementId }) }
      else if (ctrl && e.key === 's') { e.preventDefault(); if (isAuthenticated) handleSave() }
      else if (ctrl && e.key === 'e') { e.preventDefault(); handleExport() }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selectedElementId) dispatch({ type: 'DELETE_ELEMENT', id: state.selectedElementId })
      }
      else if (!ctrl) {
        switch (e.key.toLowerCase()) {
          case 'v': dispatch({ type: 'SET_TOOL', tool: 'select' }); break
          case 't': dispatch({ type: 'SET_TOOL', tool: 'text' }); break
          case 'r': dispatch({ type: 'SET_TOOL', tool: 'rect' }); break
          case 'c': dispatch({ type: 'SET_TOOL', tool: 'circle' }); break
          case 'l': dispatch({ type: 'SET_TOOL', tool: 'line' }); break
          case 's': dispatch({ type: 'SET_TOOL', tool: 'symbol' }); break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose, dispatch, state.selectedElementId, isAuthenticated, handleExport, handleSave])

  if (!isOpen) return null

  return createPortal(
    <Overlay>
      {!isAuthenticated && (
        <LoginOverlay>
          <LoginCard>
            <LoginCardIcon>
              <Icon name="faPencilRuler" />
            </LoginCardIcon>
            <LoginCardTitle>Logg inn for å bruke designeren</LoginCardTitle>
            <LoginCardText>
              Du må logge inn med Google for å lage, lagre og eksportere dine skiltdesign.
            </LoginCardText>
            <GoogleLoginButton />
            <LoginCardClose onClick={onClose}>Lukk</LoginCardClose>
          </LoginCard>
        </LoginOverlay>
      )}
      <DesignerTopBar
        designName={designName}
        onNameChange={setDesignName}
        design={state.design}
        dispatch={dispatch}
        onSave={handleSave}
        onLoad={() => setShowLoad(true)}
        onExport={handleExport}
        canSave={isAuthenticated && !atMaxDesigns}
        onClose={onClose}
        saveStatus={saveStatus}
        saveError={saveError}
      />
      <EditorLayout>
        <DesignerToolbar
          activeTool={state.tool}
          dispatch={dispatch}
          activeSymbolId={activeSymbolId}
          onSymbolChange={setActiveSymbolId}
        />
        <DesignerCanvas
          state={state}
          dispatch={dispatch}
          selectedElement={selectedElement}
          generateId={generateId}
          svgRef={svgRef}
          activeSymbolId={activeSymbolId}
        />
        <DesignerProperties
          element={selectedElement}
          dispatch={dispatch}
        />
      </EditorLayout>

      {user && (
        <LoadDesignModal
          isOpen={showLoad}
          onClose={() => setShowLoad(false)}
          userId={user.sub}
          onLoadDesign={handleLoadDesign}
        />
      )}
    </Overlay>,
    document.body,
  )
}
