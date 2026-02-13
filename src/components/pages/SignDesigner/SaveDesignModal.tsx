import { useState } from 'react'
import styled from 'styled-components'
import Modal from '../../shared/Modal/Modal'
import Icon from '../../shared/Icon'

const Content = styled.div`
  padding: 2rem;
  color: #ddd;
`

const Title = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
`

const Input = styled.input`
  width: 100%;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #ddd;
  padding: 0.6rem 0.8rem;
  font-size: 0.95rem;
  outline: none;
  margin-bottom: 1rem;

  &:focus { border-color: #1da1f2; }
`

const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`

const Button = styled.button<{ $primary?: boolean }>`
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  border: 1px solid ${({ $primary }) => ($primary ? '#1da1f2' : '#444')};
  background: ${({ $primary }) => ($primary ? '#1da1f2' : '#333')};
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  initialName: string
}

export default function SaveDesignModal({ isOpen, onClose, onSave, initialName }: Props) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave(name.trim())
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="420px" dark>
      <Content>
        <Title>Lagre design</Title>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Navn pa designet..."
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <ButtonRow>
          <Button onClick={onClose}>Avbryt</Button>
          <Button $primary onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? <Icon name="faSpinner" spin /> : <Icon name="faSave" />}
            {saving ? 'Lagrer...' : 'Lagre'}
          </Button>
        </ButtonRow>
      </Content>
    </Modal>
  )
}
