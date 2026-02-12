import type { ProcessStepData } from '../types/product'

export const processSteps: ProcessStepData[] = [
  {
    icon: 'faComments',
    number: 1,
    title: '1. Samtale og diskusjon',
    description: 'Alt starter med en god dialog. Vi diskuterer dine ønsker, behov og ideer. Hvordan skal produktet se ut? Hvilke mål passer best? Hva er formålet? Dette steget sikrer at vi er på samme bølgelengde før vi går videre.',
  },
  {
    icon: 'faCube',
    number: 2,
    title: '2. 3D-modellering og visualisering',
    description: 'For større eller mer komplekse prosjekter lager vi en 3D-modell av produktet. Dette gir deg en klar visualisering av sluttproduktet før vi starter produksjonen, og vi kan enkelt gjøre justeringer underveis.',
  },
  {
    icon: 'faPalette',
    number: 3,
    title: '3. Valg av materiale og finish',
    description: 'Du velger hvilken tresorter og overflatebehandling som passer best for deg. Ønsker du ubehandlet tre, grunnet, beiset eller ferdig malt? Vi hjelper deg med å finne den løsningen som gir best resultat og holdbarhet.',
  },
  {
    icon: 'faHammer',
    number: 4,
    title: '4. Produksjon',
    description: 'Når alle detaljer er på plass, starter vi produksjonen i verkstedet. Hvert produkt lages med omhu og presisjon, håndlaget etter dine spesifikasjoner. Vi holder deg oppdatert underveis.',
  },
  {
    icon: 'faTruck',
    number: 5,
    title: '5. Levering, montering og logistikk',
    description: 'Når produktet er ferdig, avtaler vi levering. Avhengig av prosjektets størrelse og kompleksitet kan vi også tilby montering og installasjon på stedet. Vi sørger for at alt kommer trygt frem og settes opp som det skal.',
  },
]
