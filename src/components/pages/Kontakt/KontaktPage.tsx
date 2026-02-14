import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import AnimatedBlock from '../../shared/AnimatedBlock'
import { useSEO } from '../../../hooks/useSEO'
import ContactForm from '../../sections/Contact/ContactForm'
import ShareButtons from '../../shared/ShareButtons'
import Icon from '../../shared/Icon'

const Hero = styled.section`
  min-height: 30vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 25vh;
    padding: 5rem 1.5rem 2rem;
  }
`

const HeroContent = styled.div`
  max-width: 800px;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.8rem;
    }
  }

  p {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
  }
`

const Content = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 4rem 2rem 5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1rem 3rem;
  }
`

const Container = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
`

const Intro = styled.p`
  font-size: 1.05rem;
  line-height: 1.8;
  color: #444;
  margin-bottom: 2.5rem;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 4rem;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
`

const FormSection = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.25rem;
  }

  & > p {
    font-size: 0.9rem;
    color: #888;
    margin: 0 0 0.5rem;
  }

  form {
    margin-top: 1.5rem;
    margin-bottom: 0;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem;
  }
`

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const InfoCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 1.25rem;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem;
  }
`

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin-bottom: 1.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const InfoIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.lightBg};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.accent};
  font-size: 0.85rem;
`

const InfoText = styled.div`
  span {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #999;
    margin-bottom: 0.15rem;
  }

  p {
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0;
    line-height: 1.5;
  }

  a {
    color: ${({ theme }) => theme.colors.textDark};
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const SocialLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const SocialLink = styled.a<{ $platform: 'facebook' | 'instagram' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: transform 0.2s, box-shadow 0.2s;
  color: #fff;

  background: ${({ $platform }) =>
    $platform === 'facebook' ? '#3b5998' : '#e4405f'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ $platform }) =>
      $platform === 'facebook' ? 'rgba(59, 89, 152, 0.35)' : 'rgba(228, 64, 95, 0.35)'};
  }

  svg {
    font-size: 1rem;
  }
`

const ShareCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  text-align: center;

  p {
    font-size: 0.9rem;
    color: #666;
    margin: 0 0 1rem;
    line-height: 1.5;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem;
  }
`

const FaqSection = styled.div`
  margin-top: 4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-top: 2.5rem;
  }
`

const FaqHeader = styled.div`
  margin-bottom: 2rem;

  h2 {
    font-size: 1.8rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.95rem;
    color: #888;
    margin: 0;
  }
`

const FaqList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const FaqItem = styled.div`
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`

const FaqQuestion = styled.button<{ $open: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2rem;
  background: none;
  border: none;
  cursor: pointer;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
    border-radius: 10px;
  }
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textDark};
  line-height: 1.4;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  svg {
    flex-shrink: 0;
    margin-left: 1rem;
    font-size: 0.75rem;
    color: ${({ $open, theme }) => $open ? theme.colors.accent : '#aaa'};
    transition: color 0.2s;
  }
`

const FaqAnswer = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
  transition: grid-template-rows 0.3s ease;

  & > div {
    overflow: hidden;
  }

  p {
    font-size: 0.92rem;
    line-height: 1.7;
    color: #555;
    margin: 0;
    padding: 0 2rem 1.5rem;
  }
`

const faqData = [
  {
    q: 'Hvor lang er leveringstiden?',
    a: 'Leveringstiden varierer avhengig av produkt og ordremengde, men normalt leverer vi innen 2–4 uker etter bekreftet bestilling.',
  },
  {
    q: 'Leverer dere utenfor Lillehammer-området?',
    a: 'Vi leverer inntil 200 km fra Lillehammer. For lengre avstander kan vi avtale frakt via transportør – ta kontakt for et tilbud.',
  },
  {
    q: 'Kan jeg velge farge og finish selv?',
    a: 'Absolutt! Du kan velge mellom ubehandlet, grunnet eller ferdig malt/beiset i ønsket farge. Vi tilpasser etter dine preferanser.',
  },
  {
    q: 'Hvordan fungerer bestillingsprosessen?',
    a: 'Send oss en melding med dine ønsker og mål. Vi gir deg et tilbud, og etter godkjenning betaler du 50 % forskudd før produksjonen starter. Resterende 50 % betales ved ferdigstilling.',
  },
  {
    q: 'Tilbyr dere montering?',
    a: 'Ja, vi tilbyr montering som tilleggstjeneste innenfor vårt leveringsområde. Pris avhenger av produkt og kompleksitet.',
  },
  {
    q: 'Hva om produktet ikke passer?',
    a: 'Siden alle produkter er skreddersydde, jobber vi tett med deg gjennom hele prosessen for å sikre at resultatet blir riktig. Vi sender alltid detaljerte mål og illustrasjoner før produksjon.',
  },
]

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <FaqList>
      {faqData.map((item, i) => (
        <FaqItem key={i}>
          <FaqQuestion $open={openIndex === i} onClick={() => toggle(i)}>
            {item.q}
            <Icon name={openIndex === i ? 'faMinus' : 'faPlus'} />
          </FaqQuestion>
          <FaqAnswer $open={openIndex === i}>
            <div><p>{item.a}</p></div>
          </FaqAnswer>
        </FaqItem>
      ))}
    </FaqList>
  )
}

export default function KontaktPage() {
  const [searchParams] = useSearchParams()

  useSEO({
    title: 'Ta kontakt – Minio',
    description: 'Kontakt Minio for skreddersydde treløsninger. Send oss en melding, så tar vi kontakt innen kort tid. Basert i Lillehammer med levering inntil 200 km.',
  })

  useEffect(() => {
    const subject = searchParams.get('subject')
    if (subject) {
      setTimeout(() => {
        const subjectField = document.getElementById('contactSubject') as HTMLInputElement | null
        if (subjectField) subjectField.value = subject
      }, 300)
    }
  }, [searchParams])

  return (
    <>
      <Navbar />
      <PageTransition>
        <main>
          <Hero>
            <HeroContent>
              <h1>Ta kontakt</h1>
              <p>Vi hjelper deg gjerne med ditt neste prosjekt. Send oss en melding, så tar vi kontakt innen kort tid.</p>
            </HeroContent>
          </Hero>
          <Content>
            <Container>
              <AnimatedBlock>
                <Intro>Enten du har en konkret idé eller bare lurer på hva som er mulig – send oss en melding. Vi svarer vanligvis innen 24 timer, og alle henvendelser er helt uforpliktende.</Intro>
              </AnimatedBlock>
              <Grid>
                <AnimatedBlock delay={100}>
                  <FormSection>
                    <h2>Send oss en melding</h2>
                    <p>Felter merket med * er obligatoriske</p>
                    <ContactForm />
                  </FormSection>
                </AnimatedBlock>

                <AnimatedBlock delay={200}>
                  <Sidebar>
                    <InfoCard>
                      <h3>Kontaktinformasjon</h3>
                      <InfoItem>
                        <InfoIcon><Icon name="faHandPointer" /></InfoIcon>
                        <InfoText>
                          <span>Lokasjon</span>
                          <p>Lillehammer, Norge</p>
                        </InfoText>
                      </InfoItem>
                      <InfoItem>
                        <InfoIcon><Icon name="faTruck" /></InfoIcon>
                        <InfoText>
                          <span>Leveringsområde</span>
                          <p>Inntil 200 km fra Lillehammer</p>
                        </InfoText>
                      </InfoItem>
                      <InfoItem>
                        <InfoIcon><Icon name="faEnvelope" /></InfoIcon>
                        <InfoText>
                          <span>E-post</span>
                          <p>Bruk kontaktskjemaet på denne siden</p>
                        </InfoText>
                      </InfoItem>
                    </InfoCard>

                    <InfoCard>
                      <h3>Finn oss på sosiale medier</h3>
                      <SocialLinks>
                        <SocialLink
                          href="https://www.facebook.com/profile.php?id=61576010648640&locale=nb_NO"
                          target="_blank"
                          rel="noopener noreferrer"
                          $platform="facebook"
                          aria-label="Kontakt oss på Facebook (åpnes i nytt vindu)"
                        >
                          <Icon name="faFacebookF" /> Facebook
                        </SocialLink>
                        <SocialLink
                          href="https://www.instagram.com/minio2624"
                          target="_blank"
                          rel="noopener noreferrer"
                          $platform="instagram"
                          aria-label="Kontakt oss på Instagram (åpnes i nytt vindu)"
                        >
                          <Icon name="faInstagram" /> Instagram
                        </SocialLink>
                      </SocialLinks>
                    </InfoCard>

                    <ShareCard>
                      <p>Liker du det du ser? Anbefal oss til venner og familie!</p>
                      <ShareButtons variant="section" context="contact" />
                    </ShareCard>
                  </Sidebar>
                </AnimatedBlock>
              </Grid>
              <AnimatedBlock>
                <FaqSection>
                  <FaqHeader>
                    <h2>Vanlige spørsmål</h2>
                    <p>Finner du ikke svaret du leter etter? Send oss en melding!</p>
                  </FaqHeader>
                  <FaqAccordion />
                </FaqSection>
              </AnimatedBlock>
            </Container>
          </Content>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
