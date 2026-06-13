import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import {
  findTopic,
  guideHref,
  guidePhases,
  guideTopics,
} from '../../../data/byggeguider'

const ACCENT = '#9c6b3f'
const SITE_URL = 'https://minio.no'

export interface ArticleSection {
  id: string
  heading: string
  content: ReactNode
}

interface GuideArticleLayoutProps {
  slug: string
  lead: string
  readingTime: string
  /** Optional content shown before the first numbered section. */
  intro?: ReactNode
  sections: ArticleSection[]
}

/* ---------- Header ---------- */
const Header = styled.header`
  background: linear-gradient(180deg, #fff 0%, ${({ theme }) => theme.colors.lightBg} 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 7rem 2rem 2.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 6rem 1.25rem 2rem;
  }
`

const Container = styled.div`
  max-width: 940px;
  margin: 0 auto;
`

const Breadcrumb = styled.nav`
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 1.25rem;

  a {
    color: ${ACCENT};
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }

  span {
    margin: 0 0.5rem;
    color: #bbb;
  }
`

const PhaseBadge = styled.span`
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${ACCENT};
  margin-bottom: 0.85rem;
`

const Title = styled.h1`
  font-size: 2.6rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.9rem;
  }
`

const Lead = styled.p`
  font-size: 1.25rem;
  line-height: 1.6;
  color: #4a4a4a;
  max-width: 70ch;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.08rem;
  }
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 1.25rem;
  font-size: 0.88rem;
  color: #777;

  svg {
    color: ${ACCENT};
  }
`

/* ---------- Body layout ---------- */
const Body = styled.section`
  padding: 2.5rem 2rem 4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1.25rem 3rem;
  }
`

const Grid = styled.div`
  max-width: 940px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 3rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`

const Toc = styled.aside`
  position: sticky;
  top: 100px;

  .label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 0.85rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    border-left: 2px solid rgba(0, 0, 0, 0.08);
  }

  li a {
    display: block;
    padding: 0.4rem 0 0.4rem 1rem;
    margin-left: -2px;
    border-left: 2px solid transparent;
    font-size: 0.9rem;
    line-height: 1.35;
    color: #777;
    text-decoration: none;
    transition: color 0.2s ease, border-color 0.2s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.textDark};
    }
  }

  li a.active {
    color: ${ACCENT};
    border-left-color: ${ACCENT};
    font-weight: 600;
  }

  @media (max-width: 900px) {
    position: static;
    top: auto;
    padding: 1rem 1.1rem;
    background: ${({ theme }) => theme.colors.lightBg};
    border-radius: 12px;

    ul {
      border-left: none;
    }
    li a {
      padding-left: 0;
      border-left: none;
    }
    li a.active {
      border-left: none;
    }
  }
`

const Article = styled.article`
  min-width: 0;
`

const Section = styled.section`
  scroll-margin-top: 90px;

  & + & {
    margin-top: 2.5rem;
  }

  > h2 {
    font-size: 1.55rem;
    font-weight: 700;
    line-height: 1.2;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 1rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.35rem;
    }
  }
`

/* ---------- All guides chooser ---------- */
const AllGuides = styled.nav`
  margin-top: 3.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  .label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 1.1rem;
  }
`

const GuideList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.5rem;
`

const rowStyles = `
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  text-decoration: none;
  min-width: 0;
`

const RowNum = styled.span`
  flex-shrink: 0;
  min-width: 1.9rem;
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: center;
`

const RowText = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.25;

  .name {
    font-size: 0.92rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status {
    font-size: 0.72rem;
    color: #aaa;
  }
`

const RowLink = styled(Link)`
  ${rowStyles}
  color: ${({ theme }) => theme.colors.textDark};
  transition: background 0.2s ease;

  ${RowNum} {
    color: rgba(156, 107, 63, 0.55);
    transition: color 0.2s ease;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.lightBg};
  }

  &:hover ${RowNum} {
    color: ${ACCENT};
  }
`

const RowCurrent = styled.span`
  ${rowStyles}
  background: rgba(156, 107, 63, 0.08);
  border: 1px solid rgba(156, 107, 63, 0.25);

  ${RowNum} {
    color: ${ACCENT};
  }

  .name {
    color: ${ACCENT};
  }

  .status {
    color: ${ACCENT};
    font-weight: 600;
  }
`

const RowSoon = styled.span`
  ${rowStyles}
  cursor: default;

  ${RowNum} {
    color: #c2bbb2;
  }

  .name {
    color: #aaa;
  }
`

/* ---------- CTA ---------- */
const Cta = styled.div`
  margin-top: 2.5rem;
  padding: 2rem;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.darkBg};
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;

  h3 {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  p {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 1.25rem;
    line-height: 1.55;
  }
`

const CtaButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.7rem 1.4rem;
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: none;
    transition: transform 0.2s ease, background 0.2s ease;
  }

  .primary {
    background: ${ACCENT};
    color: #fff;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .secondary {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
`

/* ---------- Exported body primitives (used by article content) ---------- */
export const P = styled.p`
  font-size: 1.08rem;
  line-height: 1.75;
  color: #3f3f3f;
  margin-bottom: 1.1rem;

  a {
    color: ${ACCENT};
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: rgba(156, 107, 63, 0.35);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
    transition: text-decoration-color 0.2s ease, color 0.2s ease;
  }

  a:hover {
    text-decoration-color: ${ACCENT};
  }
`

export const H3 = styled.h3`
  font-size: 1.18rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textDark};
  margin: 1.75rem 0 0.75rem;
`

export const Ul = styled.ul`
  margin: 0 0 1.2rem;
  padding-left: 1.3rem;

  li {
    font-size: 1.06rem;
    line-height: 1.7;
    color: #3f3f3f;
    margin-bottom: 0.5rem;

    &::marker {
      color: ${ACCENT};
    }
  }
`

export const Ol = styled.ol`
  margin: 0 0 1.2rem;
  padding-left: 1.4rem;

  li {
    font-size: 1.06rem;
    line-height: 1.7;
    color: #3f3f3f;
    margin-bottom: 0.6rem;

    &::marker {
      color: ${ACCENT};
      font-weight: 700;
    }
  }
`

export const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 1.4rem;
  font-size: 0.98rem;

  caption {
    text-align: left;
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 0.5rem;
  }

  th,
  td {
    text-align: left;
    padding: 0.65rem 0.85rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  th {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    background: ${({ theme }) => theme.colors.lightBg};
  }

  td {
    color: #444;
  }
`

const CalloutBox = styled.div<{ $variant: 'tip' | 'warn' }>`
  display: flex;
  gap: 0.85rem;
  padding: 1.1rem 1.25rem;
  margin: 0 0 1.4rem;
  border-radius: 12px;
  border: 1px solid
    ${({ $variant }) => ($variant === 'warn' ? 'rgba(196, 120, 40, 0.3)' : 'rgba(156, 107, 63, 0.25)')};
  background: ${({ $variant }) =>
    $variant === 'warn' ? 'rgba(232, 156, 60, 0.08)' : 'rgba(156, 107, 63, 0.06)'};

  > svg {
    flex-shrink: 0;
    margin-top: 0.15rem;
    font-size: 1.1rem;
    color: ${({ $variant }) => ($variant === 'warn' ? '#c47828' : ACCENT)};
  }

  .body {
    strong {
      display: block;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.textDark};
      margin-bottom: 0.2rem;
    }

    p {
      font-size: 1rem;
      line-height: 1.6;
      color: #444;
      margin: 0;
    }

    a {
      color: ${ACCENT};
      font-weight: 600;
      text-decoration: underline;
      text-decoration-color: rgba(156, 107, 63, 0.35);
      text-decoration-thickness: 1px;
      text-underline-offset: 0.18em;
      transition: text-decoration-color 0.2s ease, color 0.2s ease;
    }

    a:hover {
      text-decoration-color: ${ACCENT};
    }
  }
`

export function Callout({
  variant = 'tip',
  title,
  children,
}: {
  variant?: 'tip' | 'warn'
  title?: string
  children: ReactNode
}) {
  return (
    <CalloutBox $variant={variant}>
      <Icon name={variant === 'warn' ? 'faExclamationTriangle' : 'faLightbulb'} />
      <div className="body">
        {title && <strong>{title}</strong>}
        <p>{children}</p>
      </div>
    </CalloutBox>
  )
}

/* ---------- Layout ---------- */
export default function GuideArticleLayout({
  slug,
  lead,
  readingTime,
  intro,
  sections,
}: GuideArticleLayoutProps) {
  const topic = findTopic(slug)
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-25% 0px -65% 0px' }
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  const phase = topic ? guidePhases.find((p) => p.key === topic.phaseKey) : undefined
  const articleUrl = topic ? `${SITE_URL}/byggeguider/${topic.slug}` : SITE_URL
  const minutes = parseInt(readingTime, 10)

  useSEO({
    title: topic ? `${topic.title} – Byggeguider | Minio` : 'Byggeguider | Minio',
    description: lead,
    ogImage: '/images/diy_header.png',
    jsonLd: topic
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Hjem', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Byggeguider', item: `${SITE_URL}/byggeguider` },
              { '@type': 'ListItem', position: 3, name: topic.title, item: articleUrl },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: topic.title,
            description: lead,
            inLanguage: 'nb-NO',
            url: articleUrl,
            mainEntityOfPage: articleUrl,
            ...(Number.isFinite(minutes) ? { timeRequired: `PT${minutes}M` } : {}),
            author: { '@type': 'Organization', name: 'Minio', url: SITE_URL },
            publisher: {
              '@type': 'Organization',
              name: 'Minio',
              logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/images/branding/logo_dark.svg`,
              },
            },
          },
        ]
      : undefined,
  })

  if (!topic) return null

  const handleTocClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <main>
          <Header>
            <Container>
              <Breadcrumb aria-label="Brødsmulesti">
                <Link to="/byggeguider">Byggeguider</Link>
                <span>›</span>
                {topic.title}
              </Breadcrumb>
              {phase && <PhaseBadge>{topic.number}. {phase.label}</PhaseBadge>}
              <Title>{topic.title}</Title>
              <Lead>{lead}</Lead>
              <Meta>
                <Icon name="faClock" />
                {readingTime} lesing
              </Meta>
            </Container>
          </Header>

          <Body>
            <Grid>
              <Toc>
                <div className="label">På denne siden</div>
                <ul>
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={activeId === s.id ? 'active' : undefined}
                        onClick={(e) => handleTocClick(e, s.id)}
                      >
                        {s.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </Toc>

              <Article>
                {intro}
                {sections.map((s) => (
                  <Section key={s.id} id={s.id}>
                    <h2>{s.heading}</h2>
                    {s.content}
                  </Section>
                ))}

                <AllGuides aria-label="Alle byggeguider">
                  <div className="label">Alle byggeguider</div>
                  <GuideList>
                    {guideTopics.map((t) => {
                      if (t.slug === topic.slug) {
                        return (
                          <RowCurrent key={t.slug} aria-current="page">
                            <RowNum>{String(t.number).padStart(2, '0')}</RowNum>
                            <RowText>
                              <span className="name">{t.title}</span>
                              <span className="status">Du leser nå</span>
                            </RowText>
                          </RowCurrent>
                        )
                      }
                      if (t.available) {
                        return (
                          <RowLink key={t.slug} to={guideHref(t)}>
                            <RowNum>{String(t.number).padStart(2, '0')}</RowNum>
                            <RowText>
                              <span className="name">{t.title}</span>
                            </RowText>
                          </RowLink>
                        )
                      }
                      return (
                        <RowSoon key={t.slug}>
                          <RowNum>{String(t.number).padStart(2, '0')}</RowNum>
                          <RowText>
                            <span className="name">{t.title}</span>
                            <span className="status">Kommer snart</span>
                          </RowText>
                        </RowSoon>
                      )
                    })}
                  </GuideList>
                </AllGuides>

                <Cta>
                  <h3>Klar til å bygge?</h3>
                  <p>Bla videre i byggeguidene, eller ta kontakt om du vil ha hjelp på veien.</p>
                  <CtaButtons>
                    <Link className="primary" to="/byggeguider">
                      Tilbake til byggeguider
                    </Link>
                    <Link className="secondary" to="/kontakt">
                      Ta kontakt
                    </Link>
                  </CtaButtons>
                </Cta>
              </Article>
            </Grid>
          </Body>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
