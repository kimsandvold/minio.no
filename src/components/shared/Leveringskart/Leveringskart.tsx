import { lazy, Suspense, useId, useState } from 'react'
import styled from 'styled-components'
import Icon from '../Icon'
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver'
import {
  beregnKjoreavstand,
  LEVERING_KR_PER_KM,
  LEVERING_MAKS_KM,
  LEVERING_RADIUS_LUFTLINJE_KM,
  type AvstandResultat,
} from '../../../utils/leveringsavstand'

/**
 * Leaflet er tungt og trengs bare når kartet faktisk er i sikte. Chunken
 * lastes først når seksjonen ruller inn i skjermbildet, så forsiden og
 * prerenderingen slipper både biblioteket og kartflisene.
 */
const LeveringskartMap = lazy(() => import('./LeveringskartMap'))

const Wrapper = styled.section`
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 2.5rem;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }
`

const Text = styled.div`
  h2 {
    margin: 0 0 1rem;
  }

  > p {
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: ${({ theme }) => theme.fontSizes.md};
    max-width: 46ch;
    margin: 0 0 1.75rem;
  }
`

const Form = styled.form`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
  margin-bottom: 0.5rem;
  width: 100%;
`

const Input = styled.input`
  flex: 1 1 14rem;
  min-width: 0;
  padding: 0.8rem 1rem;
  font-family: inherit;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  transition: border-color ${({ theme }) => theme.transitions.default};

  &::placeholder {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Submit = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.4rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  background: ${({ theme }) => theme.colors.accent};
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.default};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:disabled {
    opacity: 0.55;
    cursor: progress;
  }
`

const Svar = styled.p<{ $type: AvstandResultat['type'] }>`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.6;
  margin: 0;

  ${({ $type, theme }) => {
    if ($type === 'error') {
      return `background: ${theme.colors.errorSoft}; color: ${theme.colors.error};`
    }
    if ($type === 'warning') {
      return `background: ${theme.colors.warningSoft}; color: ${theme.colors.warning};`
    }
    return `background: ${theme.colors.successSoft}; color: ${theme.colors.success};`
  }}

  svg {
    margin-top: 0.15rem;
    flex-shrink: 0;
  }
`

const Fotnote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.inkSubtle};
  margin: 1rem 0 0;
  max-width: 46ch;
`

const KartPlassholder = styled.div`
  height: 420px;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.sunken};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.inkSubtle};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: 320px;
  }
`

function fraktEstimat(km: number): string {
  return `${(km * LEVERING_KR_PER_KM).toLocaleString('nb-NO')} kr`
}

export default function Leveringskart() {
  const [ref, synlig] = useIntersectionObserver({ threshold: 0 })
  const [sted, setSted] = useState('')
  const [laster, setLaster] = useState(false)
  const [svar, setSvar] = useState<AvstandResultat | null>(null)
  const inputId = useId()
  // Siste vellykkede treff. Må være state, ikke ref – kartet skal tegne
  // markøren på nytt når det kommer et nytt treff.
  const [treff, setTreff] = useState<{ lat: number; lon: number; navn: string; innenfor: boolean } | undefined>()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!sted.trim() || laster) return
    setLaster(true)
    const res = await beregnKjoreavstand(sted)
    setSvar(res)
    if (res?.lat != null && res.lon != null) {
      setTreff({
        lat: res.lat,
        lon: res.lon,
        navn: res.navn ?? sted,
        innenfor: res.distanceKm <= LEVERING_MAKS_KM,
      })
    }
    setLaster(false)
  }

  const innenfor = svar ? svar.distanceKm > 0 && svar.distanceKm <= LEVERING_MAKS_KM : false

  return (
    <Wrapper ref={ref} aria-labelledby={`${inputId}-tittel`}>
      <Text>
        <h2 id={`${inputId}-tittel`}>Leverer dere til meg?</h2>
        <p>
          Ferdige produkter kjøres ut fra Lillehammer. Vi leverer innenfor{' '}
          {LEVERING_MAKS_KM} km kjørevei — skriv inn stedet ditt, så regner vi ut avstanden
          og hva frakten koster.
        </p>

        <Form onSubmit={submit}>
          <Label htmlFor={inputId}>Sted eller adresse</Label>
          <Input
            id={inputId}
            type="text"
            value={sted}
            onChange={(e) => setSted(e.target.value)}
            placeholder="F.eks. Hamar, eller Storgata 1 Gjøvik"
            autoComplete="address-level2"
            enterKeyHint="search"
          />
          <Submit type="submit" disabled={laster}>
            <Icon name={laster ? 'faSpinner' : 'faSearch'} /> {laster ? 'Regner ut…' : 'Sjekk'}
          </Submit>
        </Form>

        {/* Svaret må annonseres – ellers får skjermlesere aldri vite resultatet. */}
        <div role="status" aria-live="polite">
          {svar && (
            <Svar $type={innenfor ? svar.type : svar.type === 'error' ? 'error' : 'warning'}>
              <Icon
                name={
                  svar.type === 'error'
                    ? 'faExclamationTriangle'
                    : innenfor
                      ? 'faCheckCircle'
                      : 'faInfoCircle'
                }
              />
              <span>
                {svar.message}
                {svar.distanceKm > 0 && (
                  <>
                    {'. '}
                    {innenfor
                      ? `Vi leverer hit — frakt ca. ${fraktEstimat(svar.distanceKm)} tur/retur.`
                      : `Det er utenfor ${LEVERING_MAKS_KM} km, men ta kontakt så gir vi deg et eget tilbud.`}
                  </>
                )}
              </span>
            </Svar>
          )}
        </div>

        <Fotnote>
          Sirkelen viser omtrent {LEVERING_RADIUS_LUFTLINJE_KM} km i luftlinje, som tilsvarer{' '}
          {LEVERING_MAKS_KM} km kjørevei. Søket regner ut den faktiske kjøreruta.
          Frakt er {LEVERING_KR_PER_KM} kr per km tur/retur og er et estimat.
        </Fotnote>
      </Text>

      {synlig ? (
        <Suspense fallback={<KartPlassholder>Laster kart…</KartPlassholder>}>
          <LeveringskartMap treff={treff} />
        </Suspense>
      ) : (
        <KartPlassholder>Kart over leveringsområdet</KartPlassholder>
      )}
    </Wrapper>
  )
}
