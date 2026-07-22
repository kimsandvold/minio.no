import { useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { opprettForesporsel } from '../../../services/foresporselService'
import type { ForesporselType } from '../../../types/foresporsel'
import { foresporselTypeLabel } from '../../../types/foresporsel'

const formatKr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

interface Props {
  type: ForesporselType
  produktId: string
  produktNavn: string
  designNavn: string
  sammendrag: string
  maal: string
  arealTekst: string
  estimatKr: number
  prisEstimatKr: number
  userId: string
  userEmail: string
  onClose: () => void
}

const TITLER: Record<ForesporselType, { tittel: string; ingress: string; ikon: string }> = {
  ferdig: {
    tittel: 'Forespør om bygging',
    ingress: 'Vi bygger designet ditt og leverer det ferdig. Skriv gjerne litt om ønsker, tidsrom eller sted – så tar vi kontakt med et uforpliktende tilbud.',
    ikon: 'faHammer',
  },
  materialpakke: {
    tittel: 'Forespør materialpakke',
    ingress: 'Vi kapper trelasten etter kapplista så du kan bygge selv. Skriv gjerne litt om ønsker eller spørsmål – så tar vi kontakt med et uforpliktende tilbud.',
    ikon: 'faBoxOpen',
  },
}

export default function ForesporselModal(props: Props) {
  const t = TITLER[props.type]
  const [melding, setMelding] = useState('')
  const [status, setStatus] = useState<'idle' | 'sender' | 'ok' | 'feil'>('idle')

  const send = async () => {
    if (status === 'sender') return
    setStatus('sender')
    try {
      await opprettForesporsel({
        userId: props.userId,
        userEmail: props.userEmail,
        type: props.type,
        produktId: props.produktId,
        produktNavn: props.produktNavn,
        designNavn: props.designNavn,
        sammendrag: props.sammendrag,
        maal: props.maal,
        arealM2: props.arealTekst ? parseFloat(props.arealTekst.replace(',', '.')) || null : null,
        estimatKr: props.estimatKr,
        prisEstimatKr: props.prisEstimatKr,
        melding: melding.trim(),
      })
      setStatus('ok')
    } catch {
      setStatus('feil')
    }
  }

  return (
    <Overlay onClick={props.onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <Close onClick={props.onClose} aria-label="Lukk"><Icon name="faXmark" /></Close>

        {status === 'ok' ? (
          <Sent>
            <SentIcon><Icon name="faCircleCheck" /></SentIcon>
            <h3>Forespørsel sendt</h3>
            <p>Takk! Vi har fått «{props.designNavn}» med alle mål og materialer, og tar kontakt på <strong>{props.userEmail}</strong> med et uforpliktende tilbud.</p>
            <Primary onClick={props.onClose}>Lukk</Primary>
          </Sent>
        ) : (
          <>
            <IconTop><Icon name={t.ikon} /></IconTop>
            <h3>{t.tittel}</h3>
            <p className="ingress">{t.ingress}</p>

            <Card>
              <CardHead>
                <span>{props.produktNavn}</span>
                <b>{props.designNavn}</b>
              </CardHead>
              <Rows>
                <Row><em>Type</em><span>{foresporselTypeLabel[props.type]}</span></Row>
                <Row><em>Mål</em><span>{props.maal}</span></Row>
                <Row><em>Areal</em><span>{props.arealTekst}</span></Row>
                <Row><em>Materialkostnad</em><span>{formatKr(props.estimatKr)}</span></Row>
                <Row><em>Prisestimat</em><span>fra {formatKr(props.prisEstimatKr)}</span></Row>
              </Rows>
              <Spec>{props.sammendrag}</Spec>
            </Card>

            <Label htmlFor="melding">Din melding <span>(valgfritt)</span></Label>
            <Textarea
              id="melding"
              value={melding}
              onChange={(e) => setMelding(e.target.value)}
              rows={4}
              placeholder="F.eks. ønsket tidsrom, leveringssted, spørsmål om materialer …"
            />

            {status === 'feil' && <Feil><Icon name="faTriangleExclamation" /> Kunne ikke sende. Prøv igjen.</Feil>}

            <Primary onClick={send} disabled={status === 'sender'}>
              {status === 'sender' ? (<><Icon name="faSpinner" spin /> Sender …</>) : (<><Icon name="faPaperPlane" /> Send forespørsel</>)}
            </Primary>
            <Hint>Vi lagrer designet ditt og svarer på e-post. Uforpliktende.</Hint>
          </>
        )}
      </Box>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2300;
  background: rgba(10, 11, 14, 0.62);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 1.5rem;
`

const Box = styled.div`
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.9rem 1.75rem 1.6rem;
  background: #1b1e24;
  color: #e9e7e1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);

  h3 { margin: 0 0 0.4rem; font-size: 1.2rem; font-weight: 700; color: #fff; }
  .ingress { margin: 0 0 1.1rem; font-size: 0.85rem; color: #a8a49b; line-height: 1.55; }
`

const Close = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 8px;
  color: #cfccc4;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
`

const IconTop = styled.div`
  width: 46px;
  height: 46px;
  margin-bottom: 0.85rem;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(123, 195, 156, 0.14);
  color: #7bc39c;
  font-size: 1.1rem;
`

const Card = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.85rem 0.95rem;
  margin-bottom: 1.1rem;
  background: rgba(255, 255, 255, 0.03);
`

const CardHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding-bottom: 0.6rem;
  margin-bottom: 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  span { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.05em; color: #918d84; }
  b { font-size: 1rem; font-weight: 700; color: #fff; }
`

const Rows = styled.div`
  display: grid;
  gap: 0.3rem;
`

const Row = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  em { font-style: normal; font-size: 0.78rem; color: #918d84; }
  span { font-size: 0.85rem; font-weight: 600; color: #e9e7e1; font-variant-numeric: tabular-nums; }
`

const Spec = styled.div`
  margin-top: 0.7rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.74rem;
  color: #918d84;
  line-height: 1.45;
`

const Label = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #e9e7e1;
  span { font-weight: 400; color: #918d84; }
`

const Textarea = styled.textarea`
  width: 100%;
  resize: vertical;
  padding: 0.7rem 0.8rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 0.9rem;
  font-family: inherit;
  line-height: 1.5;
  outline: none;
  &:focus { border-color: #7bc39c; background: rgba(255, 255, 255, 0.06); }
  &::placeholder { color: #6b6860; }
`

const Feil = styled.p`
  margin: 0.7rem 0 0;
  font-size: 0.8rem;
  color: #e0928a;
  display: flex;
  align-items: center;
  gap: 0.4rem;
`

const Primary = styled.button`
  width: 100%;
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.9rem;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  color: #16181d;
  background: #f4f2ec;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #fff; }
  &:disabled { opacity: 0.7; cursor: default; }
`

const Hint = styled.p`
  margin: 0.7rem 0 0;
  font-size: 0.74rem;
  color: #6b6860;
  text-align: center;
`

const Sent = styled.div`
  text-align: center;
  padding: 0.5rem 0;
  p { font-size: 0.88rem; color: #a8a49b; line-height: 1.6; margin: 0 0 1.2rem; }
  strong { color: #e9e7e1; }
`

const SentIcon = styled.div`
  width: 56px;
  height: 56px;
  margin: 0.5rem auto 1rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(123, 195, 156, 0.16);
  color: #7bc39c;
  font-size: 1.6rem;
`
