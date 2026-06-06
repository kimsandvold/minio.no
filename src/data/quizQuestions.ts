import type { QuizQuestion } from '../types/product'

export const quizQuestions: QuizQuestion[] = [
  {
    question: 'Har du bygget noe i tre før?',
    options: [
      { label: 'Nei, aldri', value: 'beginner' },
      { label: 'Ja, et par enkle prosjekter', value: 'intermediate' },
      { label: 'Ja, flere ganger', value: 'advanced' },
    ],
  },
  {
    question: 'Hvilket verktøy har du tilgang til?',
    options: [
      { label: 'Bare håndverktøy (sag, hammer, målebånd)', value: 'beginner' },
      { label: 'Drill og stikksag', value: 'intermediate' },
      { label: 'Kappsag, drill, oversag og mer', value: 'advanced' },
    ],
  },
  {
    question: 'Hvor trygg er du på saging og måling?',
    options: [
      { label: 'Usikker – måler flere ganger', value: 'beginner' },
      { label: 'Ganske trygg – dobbeltsjekker', value: 'intermediate' },
      { label: 'Veldig trygg – kapper presist første gang', value: 'advanced' },
    ],
  },
]
