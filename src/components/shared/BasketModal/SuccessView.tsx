import styled from 'styled-components'
import Icon from '../Icon'

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`

const Message = styled.div`
  text-align: center;
  padding: 2rem;
`

const SuccessIcon = styled.div`
  font-size: 4rem;
  color: #4caf50;
  margin-bottom: 1rem;
`

const Title = styled.h4`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.textDark};
`

const Text = styled.p`
  color: #666;
  line-height: 1.6;
  margin-bottom: 0.5rem;
`

const Footer = styled.div`
  padding: 1.5rem;
  border-top: 2px solid #e0e0e0;
  flex-shrink: 0;
`

const CloseBtn = styled.button`
  width: 100%;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover { background: #333; }
`

interface SuccessViewProps {
  onClose: () => void
}

export default function SuccessView({ onClose }: SuccessViewProps) {
  return (
    <>
      <Body>
        <Message>
          <SuccessIcon>
            <Icon name="faCheckCircle" />
          </SuccessIcon>
          <Title>Forespørselen er sendt!</Title>
          <Text>Vi har mottatt din forespørsel og vil kontakte deg snart.</Text>
          <Text>Du vil motta en bekreftelse på e-post.</Text>
        </Message>
      </Body>
      <Footer>
        <CloseBtn onClick={onClose}>Lukk</CloseBtn>
      </Footer>
    </>
  )
}
