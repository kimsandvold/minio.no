import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import theme from './styles/theme'
import GlobalStyles from './styles/GlobalStyles'
import { ModalProvider } from './context/ModalContext'
import { AuthProvider } from './context/AuthContext'
import { BasketProvider } from './context/BasketContext'

import { useHashNavigation } from './hooks/useHashNavigation'
import { useSEO } from './hooks/useSEO'
import { allProducts } from './data/products'
import SkipLink from './components/shared/SkipLink'
import Navbar from './components/layout/Navbar'
import HomeHero from './components/home/HomeHero'
import VeierSection from './components/home/VeierSection'
import ProdukterSection from './components/home/ProdukterSection'
import DesignerSection from './components/home/DesignerSection'
import KompassSection from './components/home/KompassSection'
import GuiderSection from './components/home/GuiderSection'
import GraveringSection from './components/home/GraveringSection'
import SpillSection from './components/home/SpillSection'
import { gjeldendeSesong, sesongInnhold } from './data/sesong'
import { company } from './data/company'
import LeveringSection from './components/home/LeveringSection'
import Footer from './components/layout/Footer'
import ProductModal from './components/shared/ProductModal/ProductModal'
import NewsletterModal from './components/shared/NewsletterModal/NewsletterModal'
import NotFoundPage from './components/pages/NotFound/NotFoundPage'
import PageLoadingFallback from './components/shared/PageLoadingFallback'
import ContactBadge from './components/shared/ContactBadge'
import { LAZY_ROUTES } from './routes'

// Admin er bare for innlogget admin – holdes helt utenfor den offentlige bunten.
const AdminLayout = lazy(() => import('./components/pages/Admin/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./components/pages/Admin/AdminDashboardPage'))
const AdminBestillingerPage = lazy(() => import('./components/pages/Admin/AdminBestillingerPage'))
const AdminForesporslerPage = lazy(() => import('./components/pages/Admin/AdminForesporslerPage'))
const AdminProsjektIdeerPage = lazy(() => import('./components/pages/Admin/AdminProsjektIdeerPage'))
const AdminGraveringerPage = lazy(() => import('./components/pages/Admin/AdminGraveringerPage'))
const AdminPollsPage = lazy(() => import('./components/pages/Admin/AdminPollsPage'))

/**
 * Forsidens seksjoner. Sesongen bestemmer rekkefølgen, aldri hvilke som finnes
 * – se src/data/sesong.ts.
 */
const FORSIDESEKSJONER = {
  veier: VeierSection,
  gravering: GraveringSection,
  produkter: ProdukterSection,
  designer: DesignerSection,
  kompass: KompassSection,
  guider: GuiderSection,
  spill: SpillSection,
  levering: LeveringSection,
} as const

function HomePage() {
  const { forsideRekkefolge } = sesongInnhold[gjeldendeSesong()]

  useHashNavigation()
  useSEO({
    title: 'Minio – Hageprodukter i tre, skreddersydd etter dine mål',
    description: 'Hage- og utendørsprodukter i tre, skreddersydd etter dine mål. Plantekasser, varmepumpehus, søppelboder, postkassestativer og mer. Håndlaget i Lillehammer.',
    ogImage: '/images/hero/carport-elbil-forside.webp',
    ogImageAlt: 'Skreddersydd carport i tre med elbil parkert under',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': 'https://minio.no/#business',
        name: 'Minio',
        url: 'https://minio.no/',
        logo: 'https://minio.no/images/branding/logo_dark.svg',
        image: 'https://minio.no/images/hero/carport-elbil-forside.webp',
        description:
          'Hage- og utendørsprodukter i tre, skreddersydd etter dine mål. Plantekasser, varmepumpehus, søppelboder, postkassestativer og mer. Håndlaget i Lillehammer.',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Lillehammer',
          addressRegion: 'Innlandet',
          addressCountry: 'NO',
        },
        areaServed: {
          '@type': 'GeoCircle',
          geoMidpoint: {
            '@type': 'GeoCoordinates',
            latitude: 61.1153,
            longitude: 10.4663,
          },
          geoRadius: 200000,
        },
        sameAs: [
          'https://www.facebook.com/profile.php?id=61576010648640',
          'https://www.instagram.com/minio2624',
        ],
        // Hvem som står bak, og hva verkstedet faktisk kan. `knowsAbout` er den
        // direkte måten å erklære temaautoritet på, og en navngitt innehaver
        // knytter guidene til en person i stedet for bare et foretaksnavn.
        founder: {
          '@type': 'Person',
          name: company.founder,
          jobTitle: company.founderTitle,
          url: 'https://minio.no/handlaget-i-tre',
        },
        knowsAbout: company.knowsAbout,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://minio.no/#website',
        url: 'https://minio.no/',
        name: 'Minio',
        inLanguage: 'nb-NO',
        publisher: { '@id': 'https://minio.no/#business' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': 'https://minio.no/#products',
        name: 'Hage- og utendørsprodukter fra Minio',
        itemListElement: allProducts
          .filter(p => p.showOnFrontPage)
          .map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `https://minio.no/produkter/${p.slug}`,
            name: p.title,
          })),
      },
    ],
  })

  return (
    <>
      <SkipLink />
      <Navbar />
      <main id="main-content">
        <HomeHero />
        {forsideRekkefolge.map((navn) => {
          const Seksjon = FORSIDESEKSJONER[navn]
          return <Seksjon key={navn} />
        })}
      </main>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <AuthProvider>
          <BasketProvider>
            <ModalProvider>
              <Routes>
                <Route path="/" element={<HomePage />} />
                {LAZY_ROUTES.map(({ path, Page }) => (
                  <Route key={path} path={path} element={<Suspense fallback={<PageLoadingFallback />}><Page /></Suspense>} />
                ))}
                {/* Gamle adresser – behold lenker som folk allerede har */}
                <Route path="/terrasseplanlegger" element={<Navigate to="/planleggere/terrasse" replace />} />
                <Route path="/pergolaplanlegger" element={<Navigate to="/planleggere/pergola" replace />} />
                <Route path="/carportplanlegger" element={<Navigate to="/planleggere/carport" replace />} />
                {/* Gammel URL – beholdes som omdirigering så innkommende lenker og indekserte treff ikke dør. */}
                <Route path="/skilt-og-gravering" element={<Navigate to="/gravering" replace />} />
                <Route path="/diy-guider" element={<Navigate to="/byggeguider" replace />} />
                <Route path="/admin" element={<Suspense fallback={null}><AdminLayout /></Suspense>}>
                  <Route index element={<Suspense fallback={null}><AdminDashboardPage /></Suspense>} />
                  <Route path="bestillinger" element={<Suspense fallback={null}><AdminBestillingerPage /></Suspense>} />
                  <Route path="foresporsler" element={<Suspense fallback={null}><AdminForesporslerPage /></Suspense>} />
                  <Route path="graveringer" element={<Suspense fallback={null}><AdminGraveringerPage /></Suspense>} />
                  <Route path="prosjektideer" element={<Suspense fallback={null}><AdminProsjektIdeerPage /></Suspense>} />
                  <Route path="avstemninger" element={<Suspense fallback={null}><AdminPollsPage /></Suspense>} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <ContactBadge />
            </ModalProvider>
          </BasketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
