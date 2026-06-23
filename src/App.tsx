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
import Hero from './components/sections/Hero/Hero'
import Portfolio from './components/sections/Portfolio/Portfolio'
import TerrassePromo from './components/sections/TerrassePromo/TerrassePromo'
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

const DIYGuiderPage = lazy(() => import('./components/pages/DIYGuider/DIYGuiderPage'))
const PlanleggingPage = lazy(() => import('./components/pages/DIYGuider/articles/PlanleggingPage'))
const HagebenkPage = lazy(() => import('./components/pages/DIYGuider/prosjekter/HagebenkPage'))
const PidestallUtendorsPage = lazy(() => import('./components/pages/DIYGuider/prosjekter/PidestallUtendorsPage'))
const DesignTegningPage = lazy(() => import('./components/pages/DIYGuider/articles/DesignTegningPage'))
const KonstruksjonStyrkePage = lazy(() => import('./components/pages/DIYGuider/articles/KonstruksjonStyrkePage'))
const TrevirkePage = lazy(() => import('./components/pages/DIYGuider/articles/TrevirkePage'))
const VerktoyPage = lazy(() => import('./components/pages/DIYGuider/articles/VerktoyPage'))
const LimFestemidlerPage = lazy(() => import('./components/pages/DIYGuider/articles/LimFestemidlerPage'))
const SikkerhetPage = lazy(() => import('./components/pages/DIYGuider/articles/SikkerhetPage'))
const MalingMerkingPage = lazy(() => import('./components/pages/DIYGuider/articles/MalingMerkingPage'))
const SagingSammenfoyningPage = lazy(() => import('./components/pages/DIYGuider/articles/SagingSammenfoyningPage'))
const SlipingPage = lazy(() => import('./components/pages/DIYGuider/articles/SlipingPage'))
const OverflatebehandlingPage = lazy(() => import('./components/pages/DIYGuider/articles/OverflatebehandlingPage'))
const VedlikeholdPage = lazy(() => import('./components/pages/DIYGuider/articles/VedlikeholdPage'))
const VarmepumpehusPage = lazy(() => import('./components/pages/Varmepumpehus/VarmepumpehusPage'))
const SoppelboderPage = lazy(() => import('./components/pages/Soppelboder/SoppelboderPage'))
const VedskjulPage = lazy(() => import('./components/pages/Vedskjul/VedskjulPage'))
const PostkasseStativPage = lazy(() => import('./components/pages/Postkassestativ/PostkasseStativPage'))
const PlantekassePage = lazy(() => import('./components/pages/Plantekasse/PlantekassePage'))
const PidestallKrakkPage = lazy(() => import('./components/pages/PidestallKrakk/PidestallKrakkPage'))
const LeveggerPage = lazy(() => import('./components/pages/Levegger/LeveggerPage'))
const TerrassePlanleggerPage = lazy(() => import('./components/pages/Terrasseplanlegger/TerrassePlanleggerPage'))
const PergolaPlanleggerPage = lazy(() => import('./components/pages/Pergolaplanlegger/PergolaPlanleggerPage'))
const PlanleggerePage = lazy(() => import('./components/pages/Planleggere/PlanleggerePage'))

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
        <TerrassePromo />
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
                <Route path="/produkter/levegger" element={<Suspense fallback={<PageLoadingFallback />}><LeveggerPage /></Suspense>} />
                <Route path="/produkter/:slug" element={<ProduktDetailPage />} />
                <Route path="/planleggere" element={<Suspense fallback={<PageLoadingFallback />}><PlanleggerePage /></Suspense>} />
                <Route path="/planleggere/terrasse" element={<Suspense fallback={<PageLoadingFallback />}><TerrassePlanleggerPage /></Suspense>} />
                <Route path="/planleggere/pergola" element={<Suspense fallback={<PageLoadingFallback />}><PergolaPlanleggerPage /></Suspense>} />
                {/* Gamle adresser – behold lenker som folk allerede har */}
                <Route path="/terrasseplanlegger" element={<Navigate to="/planleggere/terrasse" replace />} />
                <Route path="/pergolaplanlegger" element={<Navigate to="/planleggere/pergola" replace />} />
                <Route path="/skilt-og-gravering" element={<SkiltOgGraveringPage />} />
                <Route path="/byggeguider" element={<Suspense fallback={<PageLoadingFallback />}><DIYGuiderPage /></Suspense>} />
                <Route path="/byggeguider/planlegging" element={<Suspense fallback={<PageLoadingFallback />}><PlanleggingPage /></Suspense>} />
                <Route path="/byggeguider/prosjekter/hagebenk" element={<Suspense fallback={<PageLoadingFallback />}><HagebenkPage /></Suspense>} />
                <Route path="/byggeguider/prosjekter/pidestall-utendors" element={<Suspense fallback={<PageLoadingFallback />}><PidestallUtendorsPage /></Suspense>} />
                <Route path="/byggeguider/design-og-tegning" element={<Suspense fallback={<PageLoadingFallback />}><DesignTegningPage /></Suspense>} />
                <Route path="/byggeguider/konstruksjon-og-styrke" element={<Suspense fallback={<PageLoadingFallback />}><KonstruksjonStyrkePage /></Suspense>} />
                <Route path="/byggeguider/trevirke" element={<Suspense fallback={<PageLoadingFallback />}><TrevirkePage /></Suspense>} />
                <Route path="/byggeguider/verktoy" element={<Suspense fallback={<PageLoadingFallback />}><VerktoyPage /></Suspense>} />
                <Route path="/byggeguider/lim-og-festemidler" element={<Suspense fallback={<PageLoadingFallback />}><LimFestemidlerPage /></Suspense>} />
                <Route path="/byggeguider/sikkerhet" element={<Suspense fallback={<PageLoadingFallback />}><SikkerhetPage /></Suspense>} />
                <Route path="/byggeguider/maling-og-merking" element={<Suspense fallback={<PageLoadingFallback />}><MalingMerkingPage /></Suspense>} />
                <Route path="/byggeguider/saging-og-sammenfoyning" element={<Suspense fallback={<PageLoadingFallback />}><SagingSammenfoyningPage /></Suspense>} />
                <Route path="/byggeguider/sliping" element={<Suspense fallback={<PageLoadingFallback />}><SlipingPage /></Suspense>} />
                <Route path="/byggeguider/overflatebehandling" element={<Suspense fallback={<PageLoadingFallback />}><OverflatebehandlingPage /></Suspense>} />
                <Route path="/byggeguider/vedlikehold" element={<Suspense fallback={<PageLoadingFallback />}><VedlikeholdPage /></Suspense>} />
                <Route path="/diy-guider" element={<Navigate to="/byggeguider" replace />} />
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
