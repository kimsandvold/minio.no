import type { ReactNode } from 'react'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import AnimatedBlock from '../../shared/AnimatedBlock'

const Hero = styled.section`
  min-height: 24vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 20vh;
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

const Article = styled.article`
  max-width: 820px;
  margin: 0 auto;
  color: #333;
  font-size: 1rem;
  line-height: 1.75;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 2.5rem 0 0.75rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.3rem;
    }
  }

  h3 {
    font-size: 1.15rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 1.5rem 0 0.5rem;
  }

  p {
    margin: 0 0 1rem;
  }

  ul,
  ol {
    margin: 0 0 1rem;
    padding-left: 1.4rem;
  }

  li {
    margin-bottom: 0.4rem;
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
    text-decoration: underline;
  }

  strong {
    color: ${({ theme }) => theme.colors.textDark};
  }

  address {
    font-style: normal;
    line-height: 1.7;
  }

  .updated {
    font-size: 0.9rem;
    color: #777;
    margin-bottom: 2rem;
  }
`

interface LegalLayoutProps {
  title: string
  intro?: string
  updated?: string
  children: ReactNode
}

export default function LegalLayout({ title, intro, updated, children }: LegalLayoutProps) {
  return (
    <>
      <Navbar />
      <PageTransition>
        <main>
          <Hero>
            <HeroContent>
              <h1>{title}</h1>
              {intro && <p>{intro}</p>}
            </HeroContent>
          </Hero>
          <Content>
            <AnimatedBlock>
              <Article>
                {updated && <p className="updated">Sist oppdatert: {updated}</p>}
                {children}
              </Article>
            </AnimatedBlock>
          </Content>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
