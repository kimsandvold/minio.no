import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import theme from './styles/theme'
import GlobalStyles from './styles/GlobalStyles'
import { ModalProvider } from './context/ModalContext'
import { AuthProvider } from './context/AuthContext'
import { BasketProvider } from './context/BasketContext'

import { useCookieConsent } from './hooks/useCookieConsent'
import { useHashNavigation } from './hooks/useHashNavigation'
import { useSEO } from './hooks/useSEO'
import SkipLink from './components/shared/SkipLink'
import LoadingOverlay from './components/shared/LoadingOverlay'
import Navbar from './components/layout/Navbar'
import Hero from './components/sections/Hero/Hero'
import Portfolio from './components/sections/Portfolio/Portfolio'
import ProsessPage from './components/pages/Prosess/ProsessPage'
import KontaktPage from './components/pages/Kontakt/KontaktPage'
import Footer from './components/layout/Footer'
import ProductModal from './components/shared/ProductModal/ProductModal'
import NewsletterModal from './components/shared/NewsletterModal/NewsletterModal'
import ProdukterPage from './components/pages/Produkter/ProdukterPage'
import ProduktDetailPage from './components/pages/Produkter/ProduktDetailPage'
import UnderholdningPage from './components/pages/Underholdning/UnderholdningPage'
import HandlekurvPage from './components/pages/Handlekurv/HandlekurvPage'
import SkiltOgGraveringPage from './components/pages/SkiltOgGravering/SkiltOgGraveringPage'
import MineBestillingerPage from './components/pages/MineBestillinger/MineBestillingerPage'
import MineDesignPage from './components/pages/MineDesign/MineDesignPage'
import AdminBestillingerPage from './components/pages/Admin/AdminBestillingerPage'
import DesignViewPage from './components/pages/DesignView/DesignViewPage'
import NotFoundPage from './components/pages/NotFound/NotFoundPage'

const VarmepumpehusPage = lazy(() => import('./components/pages/Varmepumpehus/VarmepumpehusPage'))
const SoppelboderPage = lazy(() => import('./components/pages/Soppelboder/SoppelboderPage'))
const VedskjulPage = lazy(() => import('./components/pages/Vedskjul/VedskjulPage'))
const PostkasseStativPage = lazy(() => import('./components/pages/Postkassestativ/PostkasseStativPage'))

function HomePage() {
  const { hasConsented, acceptCookies } = useCookieConsent()
  useHashNavigation()
  useSEO({
    title: 'Minio – Skreddersydd i tre, etter dine mål',
    description: 'Minio lager utendørs treprodukter tilpasset dine mål – varmepumpehus, søppelboder, postkassestativer, levegger og mer. Håndlaget i Lillehammer.',
  })

  return (
    <>
      <LoadingOverlay hasConsented={hasConsented} onAccept={acceptCookies} />
      <SkipLink />
      <Navbar />
      <main id="main-content">
        <Hero />
        <Portfolio />
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
                <Route path="/produkter/varmepumpehus" element={<Suspense fallback={null}><VarmepumpehusPage /></Suspense>} />
                <Route path="/produkter/soppelboder" element={<Suspense fallback={null}><SoppelboderPage /></Suspense>} />
                <Route path="/produkter/vedskjul" element={<Suspense fallback={null}><VedskjulPage /></Suspense>} />
                <Route path="/produkter/postkassestativer" element={<Suspense fallback={null}><PostkasseStativPage /></Suspense>} />
                <Route path="/produkter/:slug" element={<ProduktDetailPage />} />
                <Route path="/skilt-og-gravering" element={<SkiltOgGraveringPage />} />
                <Route path="/underholdning" element={<UnderholdningPage />} />
                <Route path="/handlekurv" element={<HandlekurvPage />} />
                <Route path="/mine-design" element={<MineDesignPage />} />
                <Route path="/mine-bestillinger" element={<MineBestillingerPage />} />
                <Route path="/admin/bestillinger" element={<AdminBestillingerPage />} />
                <Route path="/design/:designId" element={<DesignViewPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ModalProvider>
          </BasketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
