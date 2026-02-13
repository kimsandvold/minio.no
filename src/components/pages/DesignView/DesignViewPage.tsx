import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { getDesignById } from '../../../services/designService'
import { useSEO } from '../../../hooks/useSEO'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import type { SavedDesign } from '../../../types/design'

const Hero = styled.section`
  min-height: 15vh;
  background: ${({ theme }) => theme.colors.darkBg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 10vh;
    padding: 5rem 1.5rem 1.5rem;
  }
`

const HeroContent = styled.div`
  max-width: 800px;

  h1 {
    font-size: 2rem;
    margin-bottom: 0.3rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.5rem;
    }
  }

  p {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.6);
  }
`

const Content = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  min-height: 50vh;
  padding: 3rem 2rem;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1rem;
  }
`

const Card = styled.div`
  max-width: 900px;
  width: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
`

const SvgWrapper = styled.div`
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-conic-gradient(#f0f0f0 0% 25%, #fff 0% 50%) 0 0 / 20px 20px;
  min-height: 300px;

  img {
    max-width: 100%;
    height: auto;
    max-height: 70vh;
  }
`

const InfoBar = styled.div`
  padding: 1rem 2rem;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1rem;
  }
`

const DesignName = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: #202020;
  margin: 0;
`

const DesignMeta = styled.span`
  font-size: 0.85rem;
  color: #888;
`

const Message = styled.div`
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  padding: 4rem 2rem;
`

export default function DesignViewPage() {
  const { designId } = useParams<{ designId: string }>()
  const [design, setDesign] = useState<SavedDesign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useSEO({
    title: design ? `${design.name} — Minio Design` : 'Design — Minio',
    description: 'Se skiltdesign laget med Minio skiltdesigneren.',
  })

  useEffect(() => {
    if (!designId) return
    setLoading(true)
    getDesignById(designId)
      .then(result => {
        setDesign(result)
        if (!result) setError(true)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [designId])

  const svgDataUrl = design?.svgSnapshot
    ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(design.svgSnapshot)))}`
    : null

  const dimensions = design
    ? `${design.design.canvasWidth} × ${design.design.canvasHeight} px`
    : ''

  return (
    <>
      <Navbar />
      <Hero>
        <HeroContent>
          <h1>Skiltdesign</h1>
          <p>Forhåndsvisning av design</p>
        </HeroContent>
      </Hero>
      <Content>
        {loading && <Message>Laster design...</Message>}
        {error && <Message>Designet ble ikke funnet.</Message>}
        {design && svgDataUrl && (
          <Card>
            <SvgWrapper>
              <img src={svgDataUrl} alt={design.name} />
            </SvgWrapper>
            <InfoBar>
              <DesignName>{design.name}</DesignName>
              <DesignMeta>{dimensions}</DesignMeta>
            </InfoBar>
          </Card>
        )}
      </Content>
      <Footer />
    </>
  )
}
