import { useRef, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { modalSlideIn } from '../../../styles/animations'
import { useModal } from '../../../hooks/useModal'

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: ${({ theme }) => theme.zIndex.modal};
  backdrop-filter: blur(4px);
  overflow-y: auto;
  padding: 2rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1rem;
  }
`

const Content = styled.div<{ $maxWidth?: string; $dark?: boolean }>`
  background: ${({ $dark }) => ($dark ? '#1a1a1a' : '#fff')};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  max-width: ${({ $maxWidth }) => $maxWidth || '800px'};
  width: 100%;
  max-height: 90vh;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: ${modalSlideIn} 0.3s ease;
  display: flex;
  flex-direction: column;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: ${({ theme }) => theme.borderRadius.large};
    max-height: 85vh;
  }
`

const CloseButton = styled.button<{ $dark?: boolean }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  font-size: 2rem;
  color: ${({ $dark }) => ($dark ? 'rgba(255, 255, 255, 0.7)' : '#666')};
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  padding: 0;
  z-index: 10;

  &:hover {
    background: ${({ $dark }) => ($dark ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0')};
    color: ${({ $dark }) => ($dark ? '#fff' : '#1a1a1a')};
    transform: rotate(90deg);
  }
`

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
  dark?: boolean
}

export default function Modal({ isOpen, onClose, children, maxWidth, dark }: ModalProps) {
  const { handleBackdropClick } = useModal(isOpen, onClose)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <Backdrop onClick={handleBackdropClick}>
      <Content ref={contentRef} $maxWidth={maxWidth} $dark={dark} tabIndex={-1}>
        <CloseButton onClick={onClose} aria-label="Lukk" $dark={dark}>
          &times;
        </CloseButton>
        {children}
      </Content>
    </Backdrop>,
    document.body
  )
}
