import styled from 'styled-components'
import Modal from '../Modal/Modal'
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

  iframe {
    border-radius: 8px;
    display: block;
    max-width: 100%;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem;
    h3 { font-size: 1.4rem; }
    iframe { width: 100%; height: 350px; }
  }
`

export default function NewsletterModal() {
  const { newsletterOpen, closeNewsletter } = useModalContext()

  return (
    <Modal isOpen={newsletterOpen} onClose={closeNewsletter} maxWidth="600px" dark>
      <Body>
        <h3>Nyhetsbrev</h3>
        <p>Hold deg oppdatert med nyheter, tilbud og inspirasjon fra Minio.</p>
        <iframe
          width="540"
          height="305"
          src="https://3ce65bdb.sibforms.com/serve/MUIFABFDn-iEhyhEuoYqBibtROhyIT-jsLBOjKqgjhfMkKIWipaEI2AUGRJG_J31U3dBa8NyCdHuCvIWwCExG5DgEVrwlUN9Njuc9z5_LM9Ier-DxrQWegEUJOTr8lkE0mU6OcYiseh9RkMHFTBNvZM4CjJni4ger5vwm5664ivkyeG7K6aT3dapJTMeWhHzc9cP3Uot3bATGW54Qg=="
          frameBorder="0"
          scrolling="auto"
          allowFullScreen
          title="Nyhetsbrev"
          style={{ display: 'block', maxWidth: '100%' }}
        />
      </Body>
    </Modal>
  )
}
