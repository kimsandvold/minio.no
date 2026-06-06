import { useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import type { FaqItem } from '../../../types/product'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const Item = styled.div<{ $open: boolean }>`
  background: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  overflow: hidden;
  border: 1px solid ${({ $open, theme }) => ($open ? theme.colors.accent : 'rgba(0,0,0,0.06)')};
  transition: border-color 0.2s;
`

const Question = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  line-height: 1.4;
  transition: color 0.2s;

  svg {
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.accent};
    flex-shrink: 0;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.hover};
  }
`

const Chevron = styled.span<{ $open: boolean }>`
  margin-left: auto;
  flex-shrink: 0;
  color: #aaa;
  transition: transform 0.2s;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`

const Answer = styled.div<{ $open: boolean }>`
  max-height: ${({ $open }) => ($open ? '500px' : '0')};
  overflow: hidden;
  transition: max-height 0.35s ease;
`

const AnswerInner = styled.div`
  padding: 0 1.25rem 1.25rem;
  font-size: 0.9rem;
  line-height: 1.7;
  color: #555;
`

interface Props {
  items: FaqItem[]
}

export default function FaqSection({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <Wrapper>
      {items.map((item, i) => (
        <Item key={i} $open={openIndex === i}>
          <Question onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            <Icon name={item.icon} />
            {item.question}
            <Chevron $open={openIndex === i}>
              <Icon name="faChevronDown" />
            </Chevron>
          </Question>
          <Answer $open={openIndex === i}>
            <AnswerInner>{item.answer}</AnswerInner>
          </Answer>
        </Item>
      ))}
    </Wrapper>
  )
}
