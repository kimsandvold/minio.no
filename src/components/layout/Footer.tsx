import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../shared/Icon'
import { company } from '../../data/company'

const StyledFooter = styled.footer`
  background-color: #1a1a1a;
  color: ${({ theme }) => theme.colors.textLight};
  padding: 2rem 1rem;
  text-align: center;
`

const FooterContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`

const FooterAbout = styled.div`
  text-align: left;

  h3 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: ${({ theme }) => theme.colors.textLight};
    font-weight: 600;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.3rem;
      margin-bottom: 1rem;
    }
  }

  p {
    font-size: 0.95rem;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.85);
    margin-bottom: 1rem;
    text-align: left;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 0.9rem;
    }

    &:last-child { margin-bottom: 0; }
  }
`

const FooterRight = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: flex-start;
  text-align: left;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 1.5rem;
  }
`

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;

  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textLight};
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 0.95rem;
    }
  }
`

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  p {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.75);
  }

  a {
    color: rgba(255, 255, 255, 0.75);
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover { color: ${({ theme }) => theme.colors.accent}; }
  }
`

const Socials = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  a {
    color: ${({ theme }) => theme.colors.textLight};
    font-size: 1.3rem;
    transition: color 0.3s ease;
    text-decoration: none;

    &:hover { color: ${({ theme }) => theme.colors.accent}; }

    &:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.8);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }
`

const FooterNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;

  a {
    color: rgba(255, 255, 255, 0.75);
    text-decoration: none;
    font-size: 0.9rem;
    transition: all 0.3s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.accent};
      transform: translateY(-2px);
    }

    &:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.8);
      outline-offset: 2px;
      border-radius: 4px;
    }
  }
`

const FooterLink = styled(Link)`
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    transform: translateY(-2px);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 2px;
    border-radius: 4px;
  }
`

const NewsletterSection = styled.div`
  iframe {
    display: block;
    margin-left: auto;
    margin-right: auto;
    max-width: 100%;
    transform: translateX(-35px);
  }
`

const Copyright = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 3rem auto 0;
  padding: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  text-align: center;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;

  p {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin: 2rem auto 0;
    padding: 1.5rem 2rem;
  }
`

export default function Footer() {
  return (
    <StyledFooter>
      <FooterContainer>
        <FooterAbout>
          <h3>Håndlaget i Lillehammer</h3>
          <p>Bak Minio står jeg, Kim Sandvold – genuint opptatt av produktutvikling, godt håndverk og det å skape noe med hendene. Fra verkstedet mitt i Lillehammer lager jeg utendørs treprodukter som er bygget for å vare: varmepumpehus, søppelboder, postkassestativer, levegger, plantekasser og mer.</p>
          <p>Til daglig jobber jeg som programvareutvikler, og den erfaringen tar jeg med meg inn i verkstedet: jeg designer og modellerer alt i 3D før det bygges. Derfor har jeg laget et gratis 3D-designverktøy her på siden, der du selv kan tegne prosjektet ditt, tilpasse mål, treslag og farge, og få en komplett byggeplan med materialliste og arbeidstegning – enten du vil bygge det selv eller la meg bygge det for deg.</p>
          <p>Hvert produkt lages på bestilling, tilpasset dine mål og ditt uterom. Det som driver meg er å ta en idé og gjøre den til virkelighet – og jeg gir meg ikke før du er fornøyd. Jeg velger riktig materiale og bygger med den omtanken som masseproduksjon aldri kan tilby. Ingen to prosjekter er like – og det er nettopp det som gjør det verdt å gjøre ordentlig.</p>
          <p>Jeg tror på kort vei mellom deg og den som bygger produktet ditt. Når du handler hos Minio, snakker du direkte med meg. Du får ærlige råd, tydelig kommunikasjon og et resultat du kan stole på.</p>
          <p>Har du et prosjekt i tankene? Ta kontakt – jeg hører gjerne fra deg.</p>
          <p><em>– Kim Sandvold</em></p>
        </FooterAbout>

        <FooterRight>
          <FooterSection>
            <h4>Kontakt</h4>
            <ContactInfo>
              <p>{company.legalName}</p>
              <p>Org.nr {company.orgNr}</p>
              <Socials>
                <a href="https://www.facebook.com/profile.php?id=61576010648640&locale=nb_NO" target="_blank" rel="noopener noreferrer" aria-label="Facebook (åpnes i nytt vindu)">
                  <Icon name="faFacebookF" />
                </a>
                <a href="https://www.instagram.com/minio2624" target="_blank" rel="noopener noreferrer" aria-label="Instagram (åpnes i nytt vindu)">
                  <Icon name="faInstagram" />
                </a>
              </Socials>
            </ContactInfo>
          </FooterSection>

          <FooterSection>
            <h4>Hurtiglenker</h4>
            <FooterNav>
              <FooterLink to="/">Hjem</FooterLink>
              <FooterLink to="/produkter">Produkter</FooterLink>
              <FooterLink to="/handlaget-i-tre">Håndlaget i tre</FooterLink>
              <FooterLink to="/byggehjelp">Byggehjelp</FooterLink>
              <FooterLink to="/3d-design">3D-design</FooterLink>
              <FooterLink to="/slik-jobber-vi">Slik jobber vi</FooterLink>
              <FooterLink to="/kontakt">Kontakt</FooterLink>
              <FooterLink to="/underholdning">Underholdning</FooterLink>
              <FooterLink to="/spill-av-leah-noelle">Spill av Leah Noelle</FooterLink>
              <FooterLink to="/salgsbetingelser">Salgsbetingelser</FooterLink>
              <FooterLink to="/personvern">Personvern</FooterLink>
            </FooterNav>
          </FooterSection>

          <NewsletterSection>
            <FooterSection>
              <h4>Nyhetsbrev</h4>
              <iframe
                width="540"
                height="305"
                src="https://3ce65bdb.sibforms.com/serve/MUIFABFDn-iEhyhEuoYqBibtROhyIT-jsLBOjKqgjhfMkKIWipaEI2AUGRJG_J31U3dBa8NyCdHuCvIWwCExG5DgEVrwlUN9Njuc9z5_LM9Ier-DxrQWegEUJOTr8lkE0mU6OcYiseh9RkMHFTBNvZM4CjJni4ger5vwm5664ivkyeG7K6aT3dapJTMeWhHzc9cP3Uot3bATGW54Qg=="
                frameBorder="0"
                scrolling="auto"
                allowFullScreen
                title="Nyhetsbrev"
              />
            </FooterSection>
          </NewsletterSection>
        </FooterRight>
      </FooterContainer>

      <Copyright>
        <p>&copy; {new Date().getFullYear()} Minio. Alle rettigheter reservert.</p>
      </Copyright>
    </StyledFooter>
  )
}
