import { useState, useEffect } from 'react'
import styled from 'styled-components'
import Modal from '../../shared/Modal/Modal'
import Icon from '../../shared/Icon'
import type { SavedDesign } from '../../../types/design'
import { getUserDesigns, deleteDesign } from '../../../services/designService'

const Content = styled.div`
  padding: 2rem;
  color: #ddd;
`

const Title = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
`

const DesignList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
`

const DesignCard = styled.div`
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover { border-color: #1da1f2; }
`

const DesignInfo = styled.div`
  flex: 1;
`

const DesignName = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
`

const DesignMeta = styled.div`
  font-size: 0.75rem;
  color: #888;
`

const DeleteBtn = styled.button`
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 0.3rem;
  font-size: 0.9rem;

  &:hover { color: #f44336; }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 0.9rem;
`

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
  onLoadDesign: (design: SavedDesign) => void
}

export default function LoadDesignModal({ isOpen, onClose, userId, onLoadDesign }: Props) {
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !userId) return
    setLoading(true)
    getUserDesigns(userId)
      .then(setDesigns)
      .finally(() => setLoading(false))
  }, [isOpen, userId])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteDesign(id)
    setDesigns(d => d.filter(dd => dd.id !== id))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="500px" dark>
      <Content>
        <Title>Last inn design</Title>
        {loading ? (
          <EmptyState><Icon name="faSpinner" spin /> Laster...</EmptyState>
        ) : designs.length === 0 ? (
          <EmptyState>Ingen lagrede design funnet.</EmptyState>
        ) : (
          <DesignList>
            {designs.map(d => (
              <DesignCard key={d.id} onClick={() => { onLoadDesign(d); onClose() }}>
                <DesignInfo>
                  <DesignName>{d.name}</DesignName>
                  <DesignMeta>
                    {d.design.canvasWidth} x {d.design.canvasHeight} mm
                    {' — '}
                    {d.design.elements.length} elementer
                  </DesignMeta>
                </DesignInfo>
                <DeleteBtn onClick={(e) => handleDelete(e, d.id)} title="Slett design">
                  <Icon name="faTrash" />
                </DeleteBtn>
              </DesignCard>
            ))}
          </DesignList>
        )}
      </Content>
    </Modal>
  )
}
