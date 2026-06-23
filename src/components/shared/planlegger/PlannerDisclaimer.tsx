import styled from 'styled-components'
import Icon from '../Icon'

const Wrap = styled.aside`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 0 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 1rem 2rem;
  }
`

const Box = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.25rem 1.5rem;
  border: 1px solid #e0ddd3;
  border-left: 4px solid ${({ theme }) => theme.colors.accent};
  border-radius: 8px;
  background: #faf9f5;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1rem 1.1rem;
    gap: 0.75rem;
  }
`

const IconWrap = styled.div`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.accent};
  font-size: 1.25rem;
  line-height: 1.4;
`

const Text = styled.div`
  font-size: 0.85rem;
  line-height: 1.6;
  color: #555;

  strong {
    color: ${({ theme }) => theme.colors.textDark};
  }

  p {
    margin: 0 0 0.6rem;
  }

  p:last-child {
    margin-bottom: 0;
  }
`

/**
 * Felles ansvarsfraskrivelse for alle planleggerne. Gjør det tydelig at verktøyet
 * kun er ment for design og materialoversikt, og at byggherren selv er ansvarlig
 * for at konstruksjonen er i samsvar med norsk regelverk.
 */
export default function PlannerDisclaimer() {
  return (
    <Wrap aria-label="Ansvar og byggeregler">
      <Box>
        <IconWrap aria-hidden="true">
          <Icon name="faInfoCircle" />
        </IconWrap>
        <Text>
          <p>
            <strong>Planleggeren er et verktøy for design og materialoversikt</strong> til
            planleggingsformål. Den gir et veiledende estimat og erstatter ikke prosjektering,
            statiske beregninger eller byggesøknad.
          </p>
          <p>
            Du er selv ansvarlig for at konstruksjonen bygges i samsvar med gjeldende norsk regelverk –
            blant annet plan- og bygningsloven, byggteknisk forskrift (TEK17) og lokale bestemmelser,
            inkludert eventuell søknadsplikt, krav til avstand til nabogrense og brannsikkerhet.
            Sjekk med kommunen din ved tvil.
          </p>
          <p>
            Minio har ikke ansvar for selve byggingen eller for bruken av materiallisten og estimatene.
          </p>
        </Text>
      </Box>
    </Wrap>
  )
}
