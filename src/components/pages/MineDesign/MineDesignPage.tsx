import { useState, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { useAuthContext } from '../../../context/AuthContext'
import { getUserDesigns, deleteDesign } from '../../../services/designService'
import { useSEO } from '../../../hooks/useSEO'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import GoogleLoginButton from '../../shared/GoogleLoginButton'
import SignDesignerModal from '../SignDesigner/SignDesignerModal'
import type { SavedDesign } from '../../../types/design'

const Hero = styled.section`
  min-height: 20vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 15vh;
    padding: 5rem 1.5rem 2rem;
  }
`

const HeroContent = styled.div`
  max-width: 800px;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.8rem;
    }
  }

  p {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
  }
`

const Content = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 3rem 2rem 5rem;
  min-height: 50vh;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem 1rem 3rem;
  }
`

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const LoginGate = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  text-align: center;
`

const LockIcon = styled.div`
  font-size: 2.5rem;
  color: #999;
`

const LoginMessage = styled.p`
  font-size: 1.1rem;
  color: #555;
  max-width: 400px;
  line-height: 1.6;
`

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  font-size: 1.1rem;
`

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  font-size: 1.1rem;
`

const DesignCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const SvgPreview = styled.div`
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 8px;
  border: 1px solid #eee;
  background: #fafafa;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
`

const DesignInfo = styled.div`
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 0.4rem;
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const DesignMeta = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: #888;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
`

const DesignActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
`

const NewDesignBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.body};
  cursor: pointer;
  background: ${({ theme }) => theme.colors.darkBg};
  color: ${({ theme }) => theme.colors.textLight};
  transition: background 0.2s ease;
  align-self: center;

  &:hover { background: #333; }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const DesignCount = styled.span`
  font-size: 0.85rem;
  color: #999;
  text-align: center;
`

const ActionBtn = styled.button<{ $variant?: 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  font-size: 0.85rem;
  font-family: ${({ theme }) => theme.fonts.body};
  cursor: pointer;
  transition: background 0.2s ease;
  text-decoration: none;

  ${({ $variant, theme }) =>
    $variant === 'danger'
      ? `
    background: #fef2f2;
    color: ${theme.colors.error};
    &:hover { background: #fee2e2; }
  `
      : `
    background: ${theme.colors.darkBg};
    color: ${theme.colors.textLight};
    &:hover { background: #333; }
  `}
`

function formatDate(timestamp: { toDate?: () => Date } | undefined) {
  if (!timestamp?.toDate) return ''
  return timestamp.toDate().toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function MineDesignPage() {
  const { isAuthenticated, firebaseUser, loading: authLoading } = useAuthContext()
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [editingDesign, setEditingDesign] = useState<SavedDesign | null>(null)
  const [designerOpen, setDesignerOpen] = useState(false)

  useSEO({
    title: 'Mine design – Minio',
    description: 'Se og rediger dine lagrede skiltdesign hos Minio.',
    noindex: true,
  })

  const fetchDesigns = useCallback(async () => {
    if (!firebaseUser) return
    setLoading(true)
    try {
      const result = await getUserDesigns(firebaseUser.uid)
      setDesigns(result)
    } finally {
      setLoading(false)
    }
  }, [firebaseUser])

  useEffect(() => {
    if (!firebaseUser) {
      setLoading(false)
      return
    }
    fetchDesigns()
  }, [firebaseUser, fetchDesigns])

  const handleDelete = async (design: SavedDesign) => {
    if (!confirm(`Slett "${design.name}"?`)) return
    await deleteDesign(design.id)
    setDesigns(prev => prev.filter(d => d.id !== design.id))
  }

  const handleOpenNew = () => {
    setEditingDesign(null)
    setDesignerOpen(true)
  }

  const handleEdit = (design: SavedDesign) => {
    setEditingDesign(design)
    setDesignerOpen(true)
  }

  const handleCloseDesigner = () => {
    setDesignerOpen(false)
    setEditingDesign(null)
    fetchDesigns()
  }

  const atMax = designs.length >= 10

  return (
    <>
      <Navbar />
      <PageTransition>
      <main>
        <Hero>
          <HeroContent>
            <h1>Mine design</h1>
            <p>Oversikt over dine lagrede skiltdesign.</p>
          </HeroContent>
        </Hero>
        <Content>
          <Container>
            {authLoading || loading ? (
              <LoadingState>
                <Icon name="faSpinner" spin /> Laster...
              </LoadingState>
            ) : !isAuthenticated ? (
              <LoginGate>
                <LockIcon><Icon name="faLock" /></LockIcon>
                <LoginMessage>Du må logge inn for å se dine design.</LoginMessage>
                <GoogleLoginButton />
              </LoginGate>
            ) : (
              <>
                <NewDesignBtn onClick={handleOpenNew} disabled={atMax}>
                  <Icon name="faPlus" /> Nytt design
                </NewDesignBtn>
                {atMax && <DesignCount>Du har nådd maks 10 design. Slett et for å lage nytt.</DesignCount>}
                {!atMax && <DesignCount>{designs.length} av 10 design</DesignCount>}
                {designs.length === 0 ? (
                  <EmptyState>Du har ingen lagrede design ennå.</EmptyState>
                ) : (
                  designs.map(design => (
                    <DesignCard key={design.id}>
                      {design.svgSnapshot && (
                        <SvgPreview>
                          <img
                            src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(design.svgSnapshot)))}`}
                            alt={design.name}
                          />
                        </SvgPreview>
                      )}
                      <DesignInfo>
                        <h3>{design.name}</h3>
                        <DesignMeta>
                          <span>
                            <Icon name="faRulerCombined" />
                            {design.design.canvasWidth} x {design.design.canvasHeight} mm
                          </span>
                          <span>
                            <Icon name="faLayerGroup" />
                            {design.design.elements.length} element{design.design.elements.length !== 1 ? 'er' : ''}
                          </span>
                          {design.updatedAt && (
                            <span>
                              <Icon name="faClock" />
                              {formatDate(design.updatedAt)}
                            </span>
                          )}
                        </DesignMeta>
                      </DesignInfo>
                      <DesignActions>
                        <ActionBtn as="a" href={`/design/${design.id}`} target="_blank" rel="noopener noreferrer">
                          <Icon name="faExternalLinkAlt" /> Vis
                        </ActionBtn>
                        <ActionBtn onClick={() => handleEdit(design)}>
                          <Icon name="faPencilAlt" /> Rediger
                        </ActionBtn>
                        <ActionBtn $variant="danger" onClick={() => handleDelete(design)}>
                          <Icon name="faTrash" /> Slett
                        </ActionBtn>
                      </DesignActions>
                    </DesignCard>
                  ))
                )}
              </>
            )}
          </Container>
        </Content>
      </main>
      </PageTransition>
      <Footer />
      <SignDesignerModal
        isOpen={designerOpen}
        onClose={handleCloseDesigner}
        initialDesign={editingDesign ?? undefined}
      />
    </>
  )
}
