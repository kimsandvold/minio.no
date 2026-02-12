import type { ServiceData } from '../types/product'

export const services: ServiceData[] = [
  {
    icon: 'faTree',
    title: 'Produkter i tre',
    description: 'Skreddersydde treløsninger for hjemmet ditt. Vi lager alt fra varmepumpehus og robotklippergarasjer til levegger, vedhyller, hyller, bord og andre vakre treprodukter – både til inne- og utebruk. Alle produkter bygges etter dine mål og tilpasses hjemmets stil, slik at de blir både funksjonelle og estetisk tiltalende.',
    serviceName: 'Utendørs produkter i tre',
  },
  {
    icon: 'faBurn',
    title: 'Skilt, gravering og laserskjæring',
    description: 'Vi laserskjærer og graverer nummerskilt, adresseskilt, velkomstskilt og dekorative utendørselementer i tre – perfekt tilpasset våre produkter. Gi postkassestativet et personlig adresseskilt, merk varmepumpehuset med husnummer, eller skap et unikt hytteskilt. Alt lages etter dine ønsker med presis laserteknikk.',
    serviceName: 'Skilt og gravering',
    externalLink: {
      href: '/skilt-og-gravering',
      label: 'Se utvalget',
      icon: 'faPalette',
    },
  },
]
