import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import Hero from './components/sections/Hero/Hero'
import Portfolio from './components/sections/Portfolio/Portfolio'
import DesignerHighlight from './components/sections/DesignerHighlight/DesignerHighlight'
import ProsessPage from './components/pages/Prosess/ProsessPage'
import KontaktPage from './components/pages/Kontakt/KontaktPage'
import Footer from './components/layout/Footer'
import ProductModal from './components/shared/ProductModal/ProductModal'
import NewsletterModal from './components/shared/NewsletterModal/NewsletterModal'
import ProdukterPage from './components/pages/Produkter/ProdukterPage'
import ProduktDetailPage from './components/pages/Produkter/ProduktDetailPage'
import UnderholdningPage from './components/pages/Underholdning/UnderholdningPage'
import LeahNoellePage from './components/pages/LeahNoelle/LeahNoellePage'
import HandlekurvPage from './components/pages/Handlekurv/HandlekurvPage'
import SkiltOgGraveringPage from './components/pages/SkiltOgGravering/SkiltOgGraveringPage'
import MineBestillingerPage from './components/pages/MineBestillinger/MineBestillingerPage'
import MineDesignPage from './components/pages/MineDesign/MineDesignPage'
import AdminBestillingerPage from './components/pages/Admin/AdminBestillingerPage'
import AdminPollsPage from './components/pages/Admin/AdminPollsPage'
import DesignViewPage from './components/pages/DesignView/DesignViewPage'
import NotFoundPage from './components/pages/NotFound/NotFoundPage'
import PageLoadingFallback from './components/shared/PageLoadingFallback'
import ContactBadge from './components/shared/ContactBadge'

const VarmepumpehusPage = lazy(() => import('./components/pages/Varmepumpehus/VarmepumpehusPage'))
const SoppelboderPage = lazy(() => import('./components/pages/Soppelboder/SoppelboderPage'))
const VedskjulPage = lazy(() => import('./components/pages/Vedskjul/VedskjulPage'))
const PostkasseStativPage = lazy(() => import('./components/pages/Postkassestativ/PostkasseStativPage'))
const PlantekassePage = lazy(() => import('./components/pages/Plantekasse/PlantekassePage'))
const PidestallKrakkPage = lazy(() => import('./components/pages/PidestallKrakk/PidestallKrakkPage'))


function HomePage() {
  useHashNavigation()
  useSEO({
    title: 'Minio – Hageprodukter i tre, skreddersydd etter dine mål',
    description: 'Hage- og utendørsprodukter i tre, skreddersydd etter dine mål. Plantekasser, varmepumpehus, søppelboder, postkassestativer og mer. Håndlaget i Lillehammer.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        '@id': 'https://minio.no/#business',
        name: 'Minio',
        url: 'https://minio.no/',
        logo: 'https://minio.no/images/branding/logo_dark.svg',
        image: 'https://minio.no/images/hero/forside_8.webp',
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
        <Hero />
        <Portfolio />
        <DesignerHighlight />
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
                <Route path="/slik-jobber-vi" element={<ProsessPage />} />
                <Route path="/kontakt" element={<KontaktPage />} />
                <Route path="/produkter" element={<ProdukterPage />} />
                <Route path="/produkter/varmepumpehus" element={<Suspense fallback={<PageLoadingFallback />}><VarmepumpehusPage /></Suspense>} />
                <Route path="/produkter/soppelboder" element={<Suspense fallback={<PageLoadingFallback />}><SoppelboderPage /></Suspense>} />
                <Route path="/produkter/vedskjul" element={<Suspense fallback={<PageLoadingFallback />}><VedskjulPage /></Suspense>} />
                <Route path="/produkter/postkassestativer" element={<Suspense fallback={<PageLoadingFallback />}><PostkasseStativPage /></Suspense>} />
                <Route path="/produkter/plantekasser" element={<Suspense fallback={<PageLoadingFallback />}><PlantekassePage /></Suspense>} />
                <Route path="/produkter/pidestall-krakk" element={<Suspense fallback={<PageLoadingFallback />}><PidestallKrakkPage /></Suspense>} />
                <Route path="/produkter/:slug" element={<ProduktDetailPage />} />
                <Route path="/skilt-og-gravering" element={<SkiltOgGraveringPage />} />
                <Route path="/underholdning" element={<UnderholdningPage />} />
                <Route path="/spill-av-leah-noelle" element={<LeahNoellePage />} />
                <Route path="/handlekurv" element={<HandlekurvPage />} />

                <Route path="/mine-design" element={<MineDesignPage />} />
                <Route path="/mine-bestillinger" element={<MineBestillingerPage />} />
                <Route path="/admin/bestillinger" element={<AdminBestillingerPage />} />
                <Route path="/admin/avstemninger" element={<AdminPollsPage />} />
                <Route path="/design/:designId" element={<DesignViewPage />} />
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
