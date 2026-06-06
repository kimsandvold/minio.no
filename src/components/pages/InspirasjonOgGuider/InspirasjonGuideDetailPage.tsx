import { useParams, Link } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { inspirationGuides } from '../../../data/inspirationGuides'
import { inspirationTopics } from '../../../data/inspirationTopics'
import { allProducts } from '../../../data/products'
import NotFoundPage from '../NotFound/NotFoundPage'

const difficultyConfig: Record<string, { bg: string; label: string }> = {
  beginner: { bg: '#16A34A', label: 'Nybegynner' },
  intermediate: { bg: '#EA580C', label: 'Middels' },
  advanced: { bg: '#DC2626', label: 'Avansert' },
}

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
  background: linear-gradient(135deg, #fff 0, ${({ theme }) => theme.colors.lightBg} 100%);
  padding: 3rem 2rem 4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1rem 3rem;
  }
`

const Container = styled.div`
  max-width: ${({ theme }) => theme.spacing.containerMax};
  margin: 0 auto;
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: ${({ theme }) => theme.colors.accent};
  font-weight: 600;
  font-size: 0.85rem;
  text-decoration: none;
  margin-bottom: 2rem;

  &:hover {
    color: ${({ theme }) => theme.colors.hover};
  }
`

const GuideMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`

const MetaChip = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(0,0,0,0.04);
  padding: 0.3rem 0.7rem;
  border-radius: 50px;
`

const Category = styled(MetaChip)`
  color: ${({ theme }) => theme.colors.accent};
`

const DifficultyBadge = styled.span<{ $bg: string }>`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #fff;
  background: ${({ $bg }) => $bg};
  padding: 0.3rem 0.7rem;
  border-radius: 50px;
`

const ReadTime = styled.span`
  font-size: 0.8rem;
  color: #999;

  svg {
    margin-right: 0.3rem;
  }
`

const Section = styled.div`
  background: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
`

const SectionHeading = styled.h2`
  font-size: 1.35rem;
  color: ${({ theme }) => theme.colors.textDark};
  margin: 0 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.15rem;
  }
`

const SectionBody = styled.p`
  font-size: 1rem;
  line-height: 1.8;
  color: #444;
  margin: 0;
`

const ProductCta = styled.div`
  background: ${({ theme }) => theme.colors.darkBg};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: 2rem;
  text-align: center;
  margin-top: 2rem;

  h3 {
    color: ${({ theme }) => theme.colors.textLight};
    font-size: 1.3rem;
    margin: 0 0 0.5rem;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.95rem;
    margin: 0 0 1.25rem;
  }
`

const CtaButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1.5rem;
  background: #fff;
  color: ${({ theme }) => theme.colors.textDark};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  transition: all 0.2s;

  &:hover {
    background: #eee;
    transform: translateY(-2px);
  }
`

const OtherGuides = styled.div`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
`

const OtherGuidesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`

const OtherGuideCard = styled(Link)`
  background: #fff;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 1.25rem;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  h4 {
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.3rem;
  }

  span {
    font-size: 0.8rem;
    color: #999;
  }
`

export default function InspirasjonGuideDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const guide = inspirationGuides.find((g) => g.slug === slug)
  const topic = inspirationTopics.find((t) => t.slug === slug)

  if (!guide && !topic) {
    return <NotFoundPage />
  }

  const item = guide || topic!
  const product = guide ? allProducts.find((p) => p.slug === guide.productSlug) : undefined
  const otherGuides = inspirationGuides.filter((g) => g.slug !== slug)
  const otherTopics = inspirationTopics.filter((t) => t.slug !== slug)

  useSEO({
    title: `${item.title} – Minio`,
    description: item.excerpt,
  })

  const diff = guide ? difficultyConfig[guide.difficulty] || difficultyConfig.beginner : null

  return (
    <>
      <Navbar />
      <PageTransition>
        <main>
          <Hero>
            <HeroContent>
              <h1>{item.title}</h1>
              <p>{item.excerpt}</p>
            </HeroContent>
          </Hero>
          <Content>
            <Container>
              <BackLink to="/inspirasjon-og-guider">
                <Icon name="faArrowLeft" />                 Tilbake til skolen
              </BackLink>

              {guide && (
                <GuideMeta>
                  <Category>{guide.category}</Category>
                  {diff && <DifficultyBadge $bg={diff.bg}>{diff.label}</DifficultyBadge>}
                  <ReadTime>
                    <Icon name="faClock" /> {guide.readTime} lesetid
                  </ReadTime>
                </GuideMeta>
              )}

              {item.sections.map((section, i) => (
                <Section key={i}>
                  <SectionHeading>
                    <Icon name="faChevronRight" />
                    {section.heading}
                  </SectionHeading>
                  <SectionBody>{section.body}</SectionBody>
                </Section>
              ))}

              {product && (
                <ProductCta>
                  <h3>Vil du heller få det skreddersydd?</h3>
                  <p>
                    {product.title} – fra {product.basePrice ? `kr ${product.basePrice.toLocaleString('nb-NO')},-` : product.price}
                  </p>
                  <CtaButton href={`/produkter/${product.slug}`}>
                    <Icon name="faArrowRight" /> Se produktet
                  </CtaButton>
                </ProductCta>
              )}

              <OtherGuides>
                <SectionHeading>{guide ? 'Andre prosjekter' : 'Andre moduler'}</SectionHeading>
                <OtherGuidesGrid>
                  {otherGuides.map((g) => (
                    <OtherGuideCard key={g.slug} to={`/inspirasjon-og-guider/${g.slug}`}>
                      <h4>{g.title}</h4>
                      <span>{g.readTime} lesetid</span>
                    </OtherGuideCard>
                  ))}
                  {otherTopics.map((t) => (
                    <OtherGuideCard key={t.slug} to={`/inspirasjon-og-guider/${t.slug}`}>
                      <h4>{t.title}</h4>
                      <span>Fagområde</span>
                    </OtherGuideCard>
                  ))}
                </OtherGuidesGrid>
              </OtherGuides>
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
