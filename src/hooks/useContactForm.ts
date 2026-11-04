import { useState, useCallback, useRef } from 'react'
import { lagreHenvendelse } from '../services/henvendelseService'

interface FormState {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwpwragr'

export function useContactForm() {
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  // Knappen deaktiveres først ved neste render – et raskt dobbeltklikk rakk å
  // sende to e-poster. Ref-en stopper det andre kallet med en gang.
  const sender = useRef(false)

  const setField = useCallback((field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }))
  }, [])

  const prefillSubject = useCallback((subject: string) => {
    setFormState(prev => ({ ...prev, subject }))
  }, [])

  const submit = useCallback(async () => {
    if (sender.current) return
    sender.current = true
    setStatus('submitting')

    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('email', formState.email)
    formData.append('phone', formState.phone)
    // `_subject` er Formspree sin emnelinje; `subject` alene blir bare et felt.
    formData.append('_subject', `Minio-skjema: ${formState.subject || 'Henvendelse'} – ${formState.name}`)
    formData.append('subject', formState.subject)
    formData.append('message', formState.message)

    /*
     * Lagring og e-post går PARALLELT og uavhengig av hverandre. Før gikk
     * kontaktskjemaet bare til Formspree, og da fantes henvendelsen ingen
     * steder hvis e-posten druknet. Nå ligger den også under /admin.
     * Innsendingen regnes som vellykket når minst én av dem gikk gjennom –
     * en blokkert Firestore skal ikke hindre kunden i å få kontakt.
     */
    const lagring = lagreHenvendelse({
      kilde: 'kontakt',
      emne: formState.subject || 'Henvendelse',
      navn: formState.name,
      epost: formState.email,
      mobil: formState.phone,
      melding: formState.message,
    })

    const epost = fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    }).then((r) => r.ok, () => false)

    try {
      const [lagret, sendt] = await Promise.all([lagring, epost])
      if (lagret || sendt) {
        setStatus('success')
        setFormState({ name: '', email: '', phone: '', subject: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      sender.current = false
    }
  }, [formState])

  const reset = useCallback(() => {
    setStatus('idle')
  }, [])

  return { formState, setField, prefillSubject, submit, status, reset }
}
