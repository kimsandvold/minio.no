import type { ReactNode } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import GoogleLoginButton from './GoogleLoginButton'
import Icon from './Icon'

/**
 * Port foran alt som skal faktureres.
 *
 * Skal det sendes en faktura, må vi vite hvem kunden er. Innlogging med Google
 * gir oss en verifisert e-postadresse og en konto å knytte bestillingen til –
 * uten den har vi bare et skjema hvem som helst kan fylle ut med hva som helst.
 *
 * Har kunden ikke Google, er veien kontaktskjemaet. Det er et bevisst valg:
 * da tar vi dialogen manuelt i stedet for å ta imot en bestilling vi ikke kan
 * fakturere.
 *
 * Uforpliktende henvendelser (prosjektidé, kontakt, tilbudsforespørsel) skal
 * IKKE ligge bak denne porten – der er terskelen hele poenget.
 */
export default function KreverInnlogging({
  hva,
  emne,
  children,
}: {
  /** Hva som bestilles, i bestemt form: «byggeplanen», «graveringen». */
  hva: string
  /** Forhåndsutfylt emne i kontaktskjemaet for dem uten Google. */
  emne: string
  children: ReactNode
}) {
  const { isAuthenticated, loading } = useAuthContext()

  if (loading) {
    return (
      <Venter role="status">
        <Icon name="faSpinner" spin /> Sjekker innlogging …
      </Venter>
    )
  }

  if (isAuthenticated) return <>{children}</>

  return (
    <Port>
      <IkonRing><Icon name="faLock" /></IkonRing>
      <h3>Logg inn for å bestille</h3>
      <p>
        {hva.charAt(0).toUpperCase() + hva.slice(1)} faktureres, og da må vi vite hvem
        du er. Logg inn med Google, så får du bestillingen din samlet på kontoen –
        og vi får en verifisert e-postadresse å sende fakturaen til.
      </p>
      <GoogleLoginButton />
      <Alternativ>
        Har du ikke Google-konto? Da tar vi det på e-post i stedet –{' '}
        <Link to={`/kontakt?subject=${encodeURIComponent(emne)}`}>send oss en melding</Link>,
        så ordner vi bestillingen manuelt.
      </Alternativ>
    </Port>
  )
}

const Venter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 2rem 0;
  justify-content: center;
  color: ${({ theme }) => theme.colors.inkMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const Port = styled.div`
  text-align: center;
  padding: 1.75rem 1.25rem 1.5rem;

  h3 {
    margin: 0 0 0.5rem;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: 650;
  }

  p {
    margin: 0 auto 1.4rem;
    max-width: 34ch;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const IkonRing = styled.div`
  width: 46px;
  height: 46px;
  margin: 0 auto 0.9rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
`

const Alternativ = styled.p`
  && {
    margin-top: 1.2rem;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
    text-decoration: underline;
  }
`
