import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Section from '../../layout/Section'
import Container from '../../layout/Container'
import Icon from '../../shared/Icon'
import SignDesignerModal from '../../pages/SignDesigner/SignDesignerModal'

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: 8px;
  }
`

const Content = styled.div`
  display: grid;
  grid-template-columns: 2fr 3fr;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const ImageWrap = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  overflow: hidden;
  padding: 1.5rem 1.5rem 0 0;

  img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 8px 0 0 0;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0;
    order: 1;

    img {
      border-radius: 0;
    }
  }
`

const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 2.5rem;
  gap: 0.75rem;

  h3 {
    font-size: 1.65rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0;
    line-height: 1.25;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem 1.75rem;
    order: 2;
    h3 { font-size: 1.3rem; }
  }
`


const Description = styled.p`
  font-size: 0.95rem;
  line-height: 1.7;
  color: #555;
  margin: 0;
`

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #444;

  svg {
    color: ${({ theme }) => theme.colors.accent};
    margin-top: 0.2rem;
    flex-shrink: 0;
  }
`

const ButtonRow = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 1.25rem 2.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    padding: 1rem 1.75rem 1.25rem;
    align-items: stretch;
    text-align: center;
  }
`

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 2rem;
  font-size: 0.9rem;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: 0;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #333;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

const SecondaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 2rem;
  font-size: 0.9rem;
  background: transparent;
  color: ${({ theme }) => theme.colors.textDark};
  border: 2px solid ${({ theme }) => theme.colors.textDark};
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.textDark};
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;

  h2 {
    font-size: 1.3rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.15rem;
    }
  }
`

export default function DesignerHighlight() {
  const [showDesigner, setShowDesigner] = useState(false)

  return (
    <>
      <Section id="designer" variant="light">
        <Container>
          <SectionHeader>
            <h2>Skilt og gravering</h2>
          </SectionHeader>
          <Card>
            <Content>
              <Info>
                <h3>Design ditt eget skilt</h3>
                <Description>
                  Ønsker du husskilt, hytteskilt, adresseskilt eller gravering på et produkt? Med vår interaktive skiltdesigner kan du lage din egen idé eller et ferdig design – rett i nettleseren. Prisen avhenger av størrelse, kompleksitet og materialvalg.
                </Description>
                <FeatureList>
                  <FeatureItem>
                    <Icon name="faPencilRuler" /> Tekst, former og over 100 symboler
                  </FeatureItem>
                  <FeatureItem>
                    <Icon name="faFont" /> Flere skrifttyper og størrelser
                  </FeatureItem>
                  <FeatureItem>
                    <Icon name="faFloppyDisk" /> Lagre og del designet ditt med oss
                  </FeatureItem>
                  <FeatureItem>
                    <Icon name="faFileExport" /> Eksporter som SVG – klart for laserskjæring
                  </FeatureItem>
                </FeatureList>
              </Info>
              <ImageWrap>
                <img
                  src="/images/featured/designer-preview.png"
                  alt="Skiltdesigner – design ditt eget skilt med tekst, former og symboler"
                  loading="lazy"
                />
              </ImageWrap>
            </Content>
            <ButtonRow>
              <PrimaryButton onClick={() => setShowDesigner(true)}>
                Åpne skiltdesigner <Icon name="faArrowRight" />
              </PrimaryButton>
              <SecondaryLink to="/kontakt">
                Send forespørsel
              </SecondaryLink>
            </ButtonRow>
          </Card>
        </Container>
      </Section>
      <SignDesignerModal isOpen={showDesigner} onClose={() => setShowDesigner(false)} />
    </>
  )
}
