import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../shared/Icon'
import { company } from '../../data/company'

const StyledFooter = styled.footer`
  background-color: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};
  padding: 4.5rem 1rem 0;
  text-align: center;
  /* Hårfin varm topplinje skiller footeren fra seksjonen over uten hard kant. */
  border-top: 1px solid rgba(224, 137, 95, 0.18);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 3rem 1rem 0;
  }
`

const FooterContainer = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 0.75fr 0.85fr 0.75fr 1.15fr;
  gap: 3rem 2.25rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  align-items: start;

  @media (max-width: 1240px) {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 2.5rem 2rem;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

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



const SisteKolonne = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
    letter-spacing: -0.005em;

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
    transition: color ${({ theme }) => theme.transitions.default};

    &:hover { color: ${({ theme }) => theme.colors.accentLight}; }
  }
`

const Socials = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  a {
    color: ${({ theme }) => theme.colors.textLight};
    font-size: 1.3rem;
    transition: color ${({ theme }) => theme.transitions.default};
    text-decoration: none;

    &:hover { color: ${({ theme }) => theme.colors.accentLight}; }

  }
`

/* Bevisst <div>, ikke <nav>: hver gruppe er merket av sin <h4>, og flere
   navnløse nav-landemerker gjør landemerkelista ubrukelig. */
const FooterNav = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;

  a {
    color: rgba(255, 255, 255, 0.75);
    text-decoration: none;
    font-size: 0.9rem;
    transition: color ${({ theme }) => theme.transitions.default};

    &:hover {
      color: ${({ theme }) => theme.colors.accentLight};
    }

  }
`

const FooterLink = styled(Link)`
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color ${({ theme }) => theme.transitions.default};

  &:hover {
    color: ${({ theme }) => theme.colors.accentLight};
  }

`

const NewsletterSection = styled.div`
  width: 100%;

  /* Skjema-iframen har egen innebygd marg; negativ venstremarg i stedet for
     transform, slik at den ikke stikker utenfor på små skjermer. */
  iframe {
    display: block;
    width: 100%;
    max-width: 100%;
    margin-left: -35px;
    border: 0;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    iframe { margin-left: -20px; }
  }
`

const Bunnlenker = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.5rem;

  a {
    color: rgba(255, 255, 255, 0.6);
    text-decoration: none;
    font-size: 0.85rem;
    transition: color ${({ theme }) => theme.transitions.default};

    &:hover {
      color: ${({ theme }) => theme.colors.accentLight};
    }
  }
`

const Copyright = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 4rem auto 0;
  padding: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  text-align: center;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
    <StyledFooter data-surface="dark">
      <FooterContainer>
        <FooterAbout>
          <h3>Skreddersydde treprodukter – designet i 3D</h3>
          <p>Minio er en norsk plattform for uteprosjekter i tre. Design carport, terrasse, pergola og mer i 3D – eller bestill mindre produkter som plantekasser, varmepumpehus og søppelboder, laget på bestilling.</p>
          <p>Tilpass mål, treslag og farge i det gratis 3D-verktøyet, og få en komplett byggeplan med materialliste og arbeidstegninger. Bygg selv – eller få hjelp til å finne en snekker.</p>
          <p>Kort vei fra idé til ferdig resultat – og tett oppfølging hele veien.</p>
        </FooterAbout>


        <FooterSection>
          <h4>Bygg selv</h4>
          <FooterNav>
            <FooterLink to="/designverktoy">Designverktøy i 3D</FooterLink>
            <FooterLink to="/planleggere">Planleggere</FooterLink>
            <FooterLink to="/byggeguider">Byggeguider</FooterLink>
            <FooterLink to="/produkter">Produkter</FooterLink>
          </FooterNav>
        </FooterSection>

        <FooterSection>
          <h4>Vi hjelper deg</h4>
          <FooterNav>
            <FooterLink to="/tjenester">Alle tjenester</FooterLink>
            <FooterLink to="/prosjekthjelp">Prosjekthjelp – fortell om idéen din</FooterLink>
            <FooterLink to="/3d-design">3D-design</FooterLink>
            <FooterLink to="/byggehjelp">Byggehjelp</FooterLink>
            <FooterLink to="/skilt-og-gravering">Skilt og gravering</FooterLink>
          </FooterNav>
        </FooterSection>

        <FooterSection>
          <h4>Om Minio</h4>
          <FooterNav>
            <FooterLink to="/handlaget-i-tre">Håndlaget i tre</FooterLink>
            <FooterLink to="/slik-jobber-vi">Slik jobber vi</FooterLink>
            <FooterLink to="/kontakt">Kontakt</FooterLink>
          </FooterNav>
        </FooterSection>

        <SisteKolonne>
          <FooterSection>
          <h4>Kontakt</h4>
          <ContactInfo>
            <p>Minio</p>
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
        </SisteKolonne>

      </FooterContainer>

      <Copyright>
        <Bunnlenker aria-label="Juridisk og øvrig">
          <Link to="/salgsbetingelser">Salgsbetingelser</Link>
          <Link to="/personvern">Personvern</Link>
          <Link to="/underholdning">Underholdning</Link>
          <Link to="/spill-av-leah-noelle">Spill av Leah Noelle</Link>
        </Bunnlenker>
        <p>&copy; {new Date().getFullYear()} Minio. Alle rettigheter reservert.</p>
      </Copyright>
    </StyledFooter>
  )
}
