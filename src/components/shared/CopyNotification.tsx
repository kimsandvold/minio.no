import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { slideUp } from '../../styles/animations'

const Notification = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  padding: 1rem 2rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: ${({ theme }) => theme.zIndex.modal};
  animation: ${slideUp} 0.3s ease;
  font-weight: 500;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.3s ease, transform 0.3s ease;
`

interface Props {
  message: string
  onDone: () => void
}

export default function CopyNotification({ message, onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onDone])

  return <Notification $visible={visible}>{message}</Notification>
}
