import styled from 'styled-components'
import Modal from '../Modal/Modal'
import ShareButtons from '../ShareButtons'
import { useModalContext } from '../../../context/ModalContext'

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2rem 2rem 1rem;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
  &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colors.accent}; border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: ${({ theme }) => theme.colors.accentHover}; }

  h3 {
    font-size: 2rem;
    margin-bottom: 0;
    color: ${({ theme }) => theme.colors.textDark};
  }

  h4 {
    font-size: 1.3rem;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: ${({ theme }) => theme.colors.accent};
  }

  p { margin-bottom: 1rem; line-height: 1.7; }

  ul {
    margin-bottom: 1.5rem;
    padding-left: 1.5rem;
    li { margin-bottom: 0.5rem; line-height: 1.6; }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem 1.5rem 1rem;
    h3 { font-size: 1.5rem; }
  }
`

const ModalFooter = styled.div`
  flex-shrink: 0;
  padding: 1.5rem 2rem;
  background: #fff;
  border-top: 2px solid #e0e0e0;
  border-radius: 0 0 16px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.25rem 1.5rem;
    flex-direction: column;
    align-items: stretch;
  }
`

const Price = styled.div`
  font-size: 2rem;
  font-weight: 500;
  color: #2c2c2c;
  letter-spacing: -0.02em;
  margin: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    text-align: center;
    font-size: 1.6rem;
  }
`

const RegularPrice = styled.div`
  margin-top: 0.15rem;
  font-size: 0.8rem;
  font-weight: 400;
  color: #888;
  text-decoration: line-through;
`

const ContactButton = styled.button`
  padding: 0.9rem 1.5rem;
  background-color: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background-color: #333;
    transform: translateY(-2px);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
  }
`

function navigateToContact(productName: string) {
  window.location.href = `/kontakt?subject=${encodeURIComponent(`Jeg er interessert i et tilbud på ${productName}`)}`
}

export default function ProductModal() {
  const { productModal, closeProductModal } = useModalContext()

  if (!productModal) return null

  const handleContact = () => {
    closeProductModal()
    navigateToContact(productModal.title)
  }

  return (
    <Modal isOpen={!!productModal} onClose={closeProductModal}>
      <ModalBody>
        <div dangerouslySetInnerHTML={{ __html: productModal.detailsHtml }} />
        <ShareButtons variant="small" context="product" />
      </ModalBody>
      <ModalFooter>
        <div>
          <Price>{productModal.price}</Price>
          {productModal.regularPrice && <RegularPrice>{productModal.regularPrice}</RegularPrice>}
        </div>
        <ContactButton onClick={handleContact}>Ta kontakt</ContactButton>
      </ModalFooter>
    </Modal>
  )
}
