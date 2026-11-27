import styled from 'styled-components'
import Modal from '../Modal/Modal'
import NewsletterForm from '../NewsletterForm/NewsletterForm'
import { useModalContext } from '../../../context/ModalContext'

const Body = styled.div`
  padding: 2rem;
  text-align: left;

  h3 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.colors.textLight};
  }

  p {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.75);
    margin-bottom: 1.5rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem;
    h3 { font-size: 1.4rem; }
  }
`

export default function NewsletterModal() {
  const { newsletterOpen, closeNewsletter } = useModalContext()

  return (
    <Modal isOpen={newsletterOpen} onClose={closeNewsletter} maxWidth="600px" dark>
      <Body>
        <h3>Nyhetsbrev</h3>
        <p>Hold deg oppdatert med nyheter, tilbud og inspirasjon fra Minio.</p>
        <NewsletterForm mork />
      </Body>
    </Modal>
  )
}
