import { useState } from 'react'
import styled from 'styled-components'
import type { PollDoc } from '../../../services/pollAdminService'
import Icon from '../../shared/Icon'

const Form = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 12px rgba(60, 42, 28, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`

const FormTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #242019;
  margin: 0;
`

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #2e2a26;
`

const Input = styled.input`
  padding: 0.65rem 0.85rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #2e2a26;
  }
`

const OptionRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  padding: 0.4rem;
  font-size: 0.85rem;
  border-radius: 8px;

  &:hover {
    background: rgba(229, 62, 62, 0.1);
  }
`

const AddOptionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: 2px dashed #d6ccbe;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  color: #6b6157;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #7a6f61;
    color: #2e2a26;
  }
`

const DateRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
`

const Btn = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.65rem 1.5rem;
  border: 2px solid ${({ $variant }) => ($variant === 'primary' ? '#1c1a18' : '#d6ccbe')};
  background: ${({ $variant }) => ($variant === 'primary' ? '#1c1a18' : '#fff')};
  color: ${({ $variant }) => ($variant === 'primary' ? '#fff' : '#6b6157')};
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

interface AdminPollFormProps {
  poll?: PollDoc
  onSubmit: (data: {
    question: string
    options: string[]
    startDate: Date
    endDate: Date
  }) => Promise<void>
  onCancel: () => void
}

export default function AdminPollForm({ poll, onSubmit, onCancel }: AdminPollFormProps) {
  const [question, setQuestion] = useState(poll?.question ?? '')
  const [options, setOptions] = useState<string[]>(
    poll?.options ?? ['', '', ''],
  )
  const [startDate, setStartDate] = useState(
    poll?.startDate ? toDateString(poll.startDate.toDate()) : toDateString(new Date()),
  )
  const [endDate, setEndDate] = useState(
    poll?.endDate ? toDateString(poll.endDate.toDate()) : '',
  )
  const [saving, setSaving] = useState(false)

  const validOptions = options.filter((o) => o.trim())
  const canSubmit =
    question.trim() && validOptions.length >= 2 && startDate && endDate && !saving

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      await onSubmit({
        question: question.trim(),
        options: [...validOptions, 'Annet'],
        startDate: new Date(startDate),
        endDate: new Date(endDate + 'T23:59:59'),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form>
      <FormTitle>{poll ? 'Rediger avstemning' : 'Opprett ny avstemning'}</FormTitle>

      <Label>
        Sporsmal
        <Input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="F.eks. Hva vil du at vi lager neste?"
        />
      </Label>

      <Label>
        Alternativer (minst 2, «Annet» legges til automatisk)
      </Label>
      {options.map((opt, i) => (
        <OptionRow key={i}>
          <Input
            style={{ flex: 1 }}
            type="text"
            value={opt}
            onChange={(e) => {
              const next = [...options]
              next[i] = e.target.value
              setOptions(next)
            }}
            placeholder={`Alternativ ${i + 1}`}
          />
          {options.length > 2 && (
            <RemoveBtn onClick={() => setOptions(options.filter((_, j) => j !== i))}>
              <Icon name="faTrash" />
            </RemoveBtn>
          )}
        </OptionRow>
      ))}
      <AddOptionBtn onClick={() => setOptions([...options, ''])}>
        <Icon name="faPlus" /> Legg til alternativ
      </AddOptionBtn>

      <DateRow>
        <Label>
          Startdato
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Label>
        <Label>
          Sluttdato
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Label>
      </DateRow>

      <Actions>
        <Btn $variant="secondary" onClick={onCancel} disabled={saving}>
          Avbryt
        </Btn>
        <Btn $variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {saving ? 'Lagrer...' : poll ? 'Oppdater' : 'Opprett'}
        </Btn>
      </Actions>
    </Form>
  )
}
