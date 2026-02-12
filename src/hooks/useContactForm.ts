import { useState, useCallback } from 'react'

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

  const setField = useCallback((field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }))
  }, [])

  const prefillSubject = useCallback((subject: string) => {
    setFormState(prev => ({ ...prev, subject }))
  }, [])

  const submit = useCallback(async () => {
    setStatus('submitting')

    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('email', formState.email)
    formData.append('phone', formState.phone)
    formData.append('subject', formState.subject)
    formData.append('message', formState.message)

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      })

      if (response.ok) {
        setStatus('success')
        setFormState({ name: '', email: '', phone: '', subject: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }, [formState])

  const reset = useCallback(() => {
    setStatus('idle')
  }, [])

  return { formState, setField, prefillSubject, submit, status, reset }
}
