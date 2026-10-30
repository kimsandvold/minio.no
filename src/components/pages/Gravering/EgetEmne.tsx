import { useState } from 'react'
import styled from 'styled-components'
import { trackEvent } from '../../../utils/analytics'
import Icon from '../../shared/Icon'

// Samme Formspree-skjema som kontakt og graveringsforespørslene bruker.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwpwragr'

/**
 * «Ditt eget emne» – for alt konfiguratoren ikke dekker: en kniv fra farfar,
 * en flaske, et brett, en serie kundegaver i egen form.
 *
 * Laseren skiller i praksis bare mellom to slags emner: flate, som ligger
 * stille under hodet, og sylindriske, som må rulle på en roterende akse. Derfor
 * er det første spørsmålet – det avgjør om vi kan gravere tingen i det hele
 * tatt, og hva det koster.
 */

type Emneform = 'flatt' | 'sylindrisk'

const EMNEFORMER: Array<{ id: Emneform; navn: string; tekst: string; ikon: string }> = [
  {
    id: 'flatt',
    navn: 'Flatt emne',
    tekst: 'Fjøler, brett, skilt, lærbiter, kasser, lokk – alt som ligger plant under laseren.',
    ikon: 'faSquare',
  },
  {
    id: 'sylindrisk',
    navn: 'Sylindrisk emne',
    tekst: 'Termoser, flasker, krus, knivskaft, stolper – emnet roterer mens laseren står stille.',
    ikon: 'faCircle',
  },
]

export default function EgetEmne() {
  const [form, settForm] = useState<Emneform>('flatt')
  const [materiale, settMateriale] = useState('')
  const [maal, settMaal] = useState('')
  const [antall, settAntall] = useState('1')
  const [design, settDesign] = useState('')
  const [navn, settNavn] = useState('')
  const [epost, settEpost] = useState('')
  const [telefon, settTelefon] = useState('')
  const [status, settStatus] = useState<'idle' | 'sender' | 'ok' | 'feil'>('idle')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sender') return
    settStatus('sender')

    const fd = new FormData()
    fd.append('_subject', `Gravering på eget emne – ${navn}`)
    fd.append('name', navn)
    fd.append('email', epost)
    fd.append('phone', telefon)
    fd.append('subject', 'Gravering på eget emne')
    fd.append(
      'Emne',
      [
        `Form: ${form === 'flatt' ? 'Flatt emne' : 'Sylindrisk emne'}`,
        `Materiale: ${materiale || '(ikke oppgitt)'}`,
        `Mål: ${maal || '(ikke oppgitt)'}`,
        `Antall: ${antall || '1'}`,
      ].join('\n'),
    )
    fd.append('message', design.trim() || '(ingen beskrivelse)')

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' },
      })
      if (res.ok) {
        settStatus('ok')
        trackEvent('gravering_eget_emne', 'gravering')
      } else {
        settStatus('feil')
      }
    } catch {
      settStatus('feil')
    }
  }

  if (status === 'ok') {
    return (
      <Kvittering role="status">
        <Icon name="faCheckCircle" />
        <div>
          <h3>Takk – vi har fått emnet ditt</h3>
          <p>
            Vi ser på om det lar seg gravere og hva det koster, og svarer på <strong>{epost}</strong>. Har du
            en skisse, logo eller et bilde av tingen, send det gjerne som svar på e-posten.
          </p>
        </div>
      </Kvittering>
    )
  }

  return (
    <Skjema onSubmit={send}>
      <Formvalg role="radiogroup" aria-label="Hva slags emne er det?">
        {EMNEFORMER.map((f) => (
          <Formkort
            key={f.id}
            type="button"
            role="radio"
            aria-checked={form === f.id}
            $valgt={form === f.id}
            onClick={() => settForm(f.id)}
          >
            <Icon name={f.ikon} />
            <strong>{f.navn}</strong>
            <small>{f.tekst}</small>
          </Formkort>
        ))}
      </Formvalg>

      <Rad>
        <Felt>
          <label htmlFor="emne-materiale">Materiale</label>
          <input
            id="emne-materiale"
            value={materiale}
            onChange={(e) => settMateriale(e.target.value)}
            placeholder="Tre, stål, glass, skinn …"
          />
        </Felt>
        <Felt>
          <label htmlFor="emne-maal">Mål</label>
          <input
            id="emne-maal"
            value={maal}
            onChange={(e) => settMaal(e.target.value)}
            placeholder="F.eks. 30 × 20 cm, eller Ø 8 × 25 cm"
          />
        </Felt>
        <Felt $smal>
          <label htmlFor="emne-antall">Antall</label>
          <input
            id="emne-antall"
            type="number"
            min="1"
            value={antall}
            onChange={(e) => settAntall(e.target.value)}
          />
        </Felt>
      </Rad>

      <Felt>
        <label htmlFor="emne-design">Hva skal graveres?</label>
        <textarea
          id="emne-design"
          rows={4}
          value={design}
          onChange={(e) => settDesign(e.target.value)}
          placeholder="Beskriv designet: tekst, logo, motiv, hvor på tingen det skal stå. Har du en fil (SVG, PDF, PNG) nevner du det her, så ber vi om den."
        />
      </Felt>

      <Rad>
        <Felt>
          <label htmlFor="emne-navn">Navn</label>
          <input id="emne-navn" required value={navn} onChange={(e) => settNavn(e.target.value)} />
        </Felt>
        <Felt>
          <label htmlFor="emne-epost">E-post</label>
          <input
            id="emne-epost"
            type="email"
            required
            value={epost}
            onChange={(e) => settEpost(e.target.value)}
          />
        </Felt>
        <Felt>
          <label htmlFor="emne-telefon">Telefon</label>
          <input id="emne-telefon" type="tel" value={telefon} onChange={(e) => settTelefon(e.target.value)} />
        </Felt>
      </Rad>

      <Bunn>
        <Send type="submit" disabled={status === 'sender'}>
          {status === 'sender' ? (
            <>
              <Icon name="faSpinner" spin /> Sender …
            </>
          ) : (
            <>
              <Icon name="faPaperPlane" /> Send inn emnet
            </>
          )}
        </Send>
        <Note>
          Uforpliktende. Vi sier fra om materialet lar seg gravere – enkelte plasttyper og belegg skal
          ikke i laseren – og hva det koster før vi gjør noe. Faktura, med frakt, sendes først når emnet
          er gravert og på vei tilbake til deg.
        </Note>
      </Bunn>

      {status === 'feil' && (
        <Feil role="alert">
          Noe gikk galt. Prøv igjen, eller send en e-post til <a href="mailto:post@minio.no">post@minio.no</a>.
        </Feil>
      )}
    </Skjema>
  )
}

const Skjema = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.75rem;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.paper};
`

const Formvalg = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

const Formkort = styled.button<{ $valgt: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1rem 1.1rem;
  text-align: left;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accent : theme.colors.border)};
  border-radius: 14px;
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.surface)};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};

  svg {
    color: ${({ theme }) => theme.colors.accent};
  }

  strong {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  small {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Rad = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`

const Felt = styled.div<{ $smal?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  ${({ $smal }) => $smal && 'max-width: 10rem;'}

  label {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  input,
  textarea {
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.surface};
    font: inherit;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.ink};
    resize: vertical;

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.accent};
      outline-offset: 1px;
    }
  }
`

const Bunn = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
`

const Send = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.5rem;
  border: none;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`

const Note = styled.p`
  flex: 1 1 18rem;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Feil = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.accent};
`

const Kvittering = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.75rem;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};

  svg {
    flex: none;
    font-size: 1.5rem;
  }

  h3 {
    margin: 0 0 0.4rem;
    font-size: 1.2rem;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.65;
  }
`
