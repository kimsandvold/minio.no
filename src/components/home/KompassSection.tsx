import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Icon from '../shared/Icon'
import { PROSJEKTTYPER } from '../pages/Prosjekthjelp/prosjektKompass'
import { Eyebrow, Ingress, Reveal, Seksjon, Tittel, Wrap } from '../editorial'

/**
 * Snarvei inn i prosjektkompasset på /prosjekthjelp. Hver type lander rett på
 * størrelsessteget (?type=…), så første trykk her er første trykk der.
 *
 * Eksempeltallene under er regnet av terrasse-templatet (5 × 4 m, standard
 * oppsett, priser juli 2026). Oppdater dem hvis priser.ts endres vesentlig.
 */
const EKSEMPEL = {
  tittel: 'Familieterrasse · 5 × 4 m',
  rader: [
    { etikett: 'Materialer', verdi: '≈ 14 000 kr' },
    { etikett: 'Tidsbruk', verdi: '1–2 helger' },
    { etikett: 'Søknad', verdi: 'Trolig søknadsfri', ok: true },
  ],
}

export default function KompassSection() {
  return (
    <Seksjon id="prisanslag">
      <Wrap>
        <Grid>
          <Reveal>
            <Eyebrow>Prosjekthjelp · gratis</Eyebrow>
            <Tittel>Hva koster drømmeprosjektet ditt?</Tittel>
            <Ingress>
              Velg prosjekt og størrelse, så får du anslag på materialkostnad, tidsbruk og
              søknadsplikt med en gang. Ingen konto, ingen selgere.
            </Ingress>
            <Typer>
              {PROSJEKTTYPER.filter((t) => t.id !== 'annet').map((t) => (
                <Link key={t.id} to={`/prosjekthjelp?type=${t.id}`}>{t.navn}</Link>
              ))}
            </Typer>
          </Reveal>

          <Reveal forsinkelse={120}>
            <Kort to="/prosjekthjelp?type=terrasse" aria-label="Se prisanslag for terrasse">
              <KortTopp>
                <span>Eksempel</span>
                <Prikker aria-hidden="true"><i /><i /><i /><i /></Prikker>
              </KortTopp>
              <h3>{EKSEMPEL.tittel}</h3>
              <Rader>
                {EKSEMPEL.rader.map((r) => (
                  <li key={r.etikett} className={r.ok ? 'ok' : undefined}>
                    <span>{r.etikett}</span>
                    <strong>{r.ok && <Icon name="faCheck" />} {r.verdi}</strong>
                  </li>
                ))}
              </Rader>
              <Bunn>
                Regn ut ditt eget <Icon name="faArrowRight" />
              </Bunn>
            </Kort>
          </Reveal>
        </Grid>
      </Wrap>
    </Seksjon>
  )
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: clamp(2.5rem, 6vw, 6rem);
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const Typer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 2rem;

  a {
    padding: 0.6rem 1.1rem;
    border-radius: 999px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 500;
    color: ${({ theme }) => theme.colors.ink};
    background: ${({ theme }) => theme.colors.surface};
    text-decoration: none;
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
    transition: box-shadow ${({ theme }) => theme.transitions.default}, color ${({ theme }) => theme.transitions.default};

    &:hover {
      color: ${({ theme }) => theme.colors.accent};
      box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.accent};
    }
  }
`

const Kort = styled(Link)`
  display: block;
  padding: 1.75rem;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.surface};
  color: inherit;
  text-decoration: none;
  box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.border}, 0 30px 60px rgba(28, 26, 24, 0.08);
  transform: rotate(-1.2deg);
  transition: transform ${({ theme }) => theme.transitions.soft};

  &:hover {
    transform: rotate(0deg) translateY(-4px);
  }

  h3 {
    margin: 1.25rem 0 1.25rem;
    font-size: 1.5rem;
    letter-spacing: -0.03em;
  }

  @media (prefers-reduced-motion: reduce) {
    transform: none;

    &:hover {
      transform: none;
    }
  }
`

const KortTopp = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    color: ${({ theme }) => theme.colors.accentInk};
    background: ${({ theme }) => theme.colors.accentSoft};
  }
`

const Prikker = styled.div`
  display: flex;
  gap: 4px;

  i {
    width: 22px;
    height: 4px;
    border-radius: 4px;
    background: ${({ theme }) => theme.colors.accent};
  }
`

const Rader = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.5rem;

  li {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    padding: 0.9rem 1rem;
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.sunken};

    span {
      font-size: ${({ theme }) => theme.fontSizes.sm};
      color: ${({ theme }) => theme.colors.inkMuted};
    }

    strong {
      font-weight: 600;
      text-align: right;
    }
  }

  li:first-child strong {
    font-size: 1.35rem;
    letter-spacing: -0.02em;
  }

  li.ok {
    background: ${({ theme }) => theme.colors.successSoft};

    strong,
    svg {
      color: ${({ theme }) => theme.colors.success};
    }
  }
`

const Bunn = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.4rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};

  svg {
    font-size: 0.8em;
  }
`
