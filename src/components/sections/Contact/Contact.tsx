import styled from 'styled-components'
import Section from '../../layout/Section'
import Container from '../../layout/Container'
import ContactForm from './ContactForm'
import ShareButtons from '../../shared/ShareButtons'
import Icon from '../../shared/Icon'

const SocialButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
`

const SocialButton = styled.a<{ $platform: 'facebook' | 'instagram' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 8px;
  color: #fff;
  text-decoration: none;
  transition: background-color 0.3s ease;

  ${({ $platform }) =>
    $platform === 'facebook'
      ? `background-color: #3b5998; &:hover { background-color: #2d4373; }`
      : `background-color: #e4405f; &:hover { background-color: #c1354d; }`}
`

const ShareSection = styled.div`
  text-align: center;
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;

  p {
    font-size: 0.95rem;
    color: #666;
    margin-bottom: 1rem;
  }
`

export default function Contact() {
  return (
    <Section id="kontakt">
      <Container>
        <h2>Ta kontakt</h2>
        <p>Fyll ut skjemaet nedenfor, eller finn Minio på sosiale medier for en uforpliktende samtale om dine ønsker og behov.</p>
        <ContactForm />
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          Eller kontakt oss direkte via sosiale medier:
        </p>
        <SocialButtons>
          <SocialButton
            href="https://www.facebook.com/profile.php?id=61576010648640&locale=nb_NO"
            target="_blank"
            rel="noopener noreferrer"
            $platform="facebook"
            aria-label="Kontakt oss på Facebook (åpnes i nytt vindu)"
          >
            <Icon name="faFacebookF" /> Facebook
          </SocialButton>
          <SocialButton
            href="https://www.instagram.com/minio2624"
            target="_blank"
            rel="noopener noreferrer"
            $platform="instagram"
            aria-label="Kontakt oss på Instagram (åpnes i nytt vindu)"
          >
            <Icon name="faInstagram" /> Instagram
          </SocialButton>
        </SocialButtons>
        <ShareSection>
          <p>Liker du det du ser? Anbefal oss til venner og familie!</p>
          <ShareButtons variant="section" context="contact" />
        </ShareSection>
      </Container>
    </Section>
  )
}
