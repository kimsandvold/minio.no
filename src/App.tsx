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
const TrykkimpregnertRoyalPage = lazy(() => import('./components/pages/DIYGuider/articles/TrykkimpregnertRoyalPage'))
const KebonyLerkFuruGranPage = lazy(() => import('./components/pages/DIYGuider/articles/KebonyLerkFuruGranPage'))
const TerrassebordGuidePage = lazy(() => import('./components/pages/DIYGuider/articles/TerrassebordGuidePage'))
const KonstruksjonsvirkeC24Page = lazy(() => import('./components/pages/DIYGuider/articles/KonstruksjonsvirkeC24Page'))
const HvorforSprekkerTreetPage = lazy(() => import('./components/pages/DIYGuider/articles/HvorforSprekkerTreetPage'))
const TrelastDimensjonerPage = lazy(() => import('./components/pages/DIYGuider/articles/TrelastDimensjonerPage'))
const RiktigSkruePage = lazy(() => import('./components/pages/DIYGuider/articles/RiktigSkruePage'))
const SyrefastVsGalvanisertPage = lazy(() => import('./components/pages/DIYGuider/articles/SyrefastVsGalvanisertPage'))
const BeslagOversiktPage = lazy(() => import('./components/pages/DIYGuider/articles/BeslagOversiktPage'))
const JusterbarStolpeskoPage = lazy(() => import('./components/pages/DIYGuider/articles/JusterbarStolpeskoPage'))
const SkjultTerrassefestePage = lazy(() => import('./components/pages/DIYGuider/articles/SkjultTerrassefestePage'))
const HvorMangeSkruerPage = lazy(() => import('./components/pages/DIYGuider/articles/HvorMangeSkruerPage'))
const SirkelsagDykksagStikksagPage = lazy(() => import('./components/pages/DIYGuider/articles/SirkelsagDykksagStikksagPage'))
const RetteFineKuttPage = lazy(() => import('./components/pages/DIYGuider/articles/RetteFineKuttPage'))
const VaterLaserOppmalingPage = lazy(() => import('./components/pages/DIYGuider/articles/VaterLaserOppmalingPage'))
const ForboringOgSenkningPage = lazy(() => import('./components/pages/DIYGuider/articles/ForboringOgSenkningPage'))
const TresammenfoyningerPage = lazy(() => import('./components/pages/DIYGuider/articles/TresammenfoyningerPage'))
const VerktoylisteNybegynnerPage = lazy(() => import('./components/pages/DIYGuider/articles/VerktoylisteNybegynnerPage'))
const TelehivPage = lazy(() => import('./components/pages/DIYGuider/articles/TelehivPage'))
const FundamenttyperPage = lazy(() => import('./components/pages/DIYGuider/articles/FundamenttyperPage'))
const StopePunktfundamentPage = lazy(() => import('./components/pages/DIYGuider/articles/StopePunktfundamentPage'))
const FrostfriDybdePage = lazy(() => import('./components/pages/DIYGuider/articles/FrostfriDybdePage'))
const SpennvidderBjelkerPage = lazy(() => import('./components/pages/DIYGuider/articles/SpennvidderBjelkerPage'))
const StolpeavstandPage = lazy(() => import('./components/pages/DIYGuider/articles/StolpeavstandPage'))
const BeisOljeMalingPage = lazy(() => import('./components/pages/DIYGuider/articles/BeisOljeMalingPage'))
const BeiseNyTerrassePage = lazy(() => import('./components/pages/DIYGuider/articles/BeiseNyTerrassePage'))
const VedlikeholdTerrassePage = lazy(() => import('./components/pages/DIYGuider/articles/VedlikeholdTerrassePage'))
const GranetTrePage = lazy(() => import('./components/pages/DIYGuider/articles/GranetTrePage'))
const MuggAlgerGronskePage = lazy(() => import('./components/pages/DIYGuider/articles/MuggAlgerGronskePage'))
const VinterklargjoringPage = lazy(() => import('./components/pages/DIYGuider/articles/VinterklargjoringPage'))
const SoknadspliktTerrassePage = lazy(() => import('./components/pages/DIYGuider/articles/SoknadspliktTerrassePage'))
const CarportUtenSoknadPage = lazy(() => import('./components/pages/DIYGuider/articles/CarportUtenSoknadPage'))
const BodUtenSoknadPage = lazy(() => import('./components/pages/DIYGuider/articles/BodUtenSoknadPage'))
const AvstandTilNabogrensePage = lazy(() => import('./components/pages/DIYGuider/articles/AvstandTilNabogrensePage'))
const LeveggGjerdeReglerPage = lazy(() => import('./components/pages/DIYGuider/articles/LeveggGjerdeReglerPage'))
const Tek17ForPrivatpersonerPage = lazy(() => import('./components/pages/DIYGuider/articles/Tek17ForPrivatpersonerPage'))
const ByggeTerrassePage = lazy(() => import('./components/pages/DIYGuider/articles/ByggeTerrassePage'))
const ByggePergolaPage = lazy(() => import('./components/pages/DIYGuider/articles/ByggePergolaPage'))
const ByggeCarportPage = lazy(() => import('./components/pages/DIYGuider/articles/ByggeCarportPage'))
const ByggeLeveggPage = lazy(() => import('./components/pages/DIYGuider/articles/ByggeLeveggPage'))
const ByggePlattingPage = lazy(() => import('./components/pages/DIYGuider/articles/ByggePlattingPage'))
const ByggeUtebodPage = lazy(() => import('./components/pages/DIYGuider/articles/ByggeUtebodPage'))
const ByggeUtetrappPage = lazy(() => import('./components/pages/DIYGuider/articles/ByggeUtetrappPage'))
const ByggeRekkverkPage = lazy(() => import('./components/pages/DIYGuider/articles/ByggeRekkverkPage'))
const MaterialberegningTerrassePage = lazy(() => import('./components/pages/DIYGuider/articles/MaterialberegningTerrassePage'))
const LeseByggetegningPage = lazy(() => import('./components/pages/DIYGuider/articles/LeseByggetegningPage'))
const HvaKosterTerrassePage = lazy(() => import('./components/pages/DIYGuider/articles/HvaKosterTerrassePage'))
const SjekklisteForDuStarterPage = lazy(() => import('./components/pages/DIYGuider/articles/SjekklisteForDuStarterPage'))
const VanligsteByggefeilPage = lazy(() => import('./components/pages/DIYGuider/articles/VanligsteByggefeilPage'))
const OrdlisteTrearbeidPage = lazy(() => import('./components/pages/DIYGuider/articles/OrdlisteTrearbeidPage'))
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
const CarportPlanleggerPage = lazy(() => import('./components/pages/Carportplanlegger/CarportPlanleggerPage'))
const UtekjokkenPlanleggerPage = lazy(() => import('./components/pages/Utekjokkenplanlegger/UtekjokkenPlanleggerPage'))
const PlanleggerePage = lazy(() => import('./components/pages/Planleggere/PlanleggerePage'))
const HandlagetITrePage = lazy(() => import('./components/pages/HandlagetITre/HandlagetITrePage'))
const ByggehjelpPage = lazy(() => import('./components/pages/Byggehjelp/ByggehjelpPage'))
const HundehusPage = lazy(() => import('./components/pages/Hundehus/HundehusPage'))
const KattehusPage = lazy(() => import('./components/pages/Kattehus/KattehusPage'))

function HomePage() {
  useHashNavigation()
  useSEO({
    title: 'Minio – Hageprodukter i tre, skreddersydd etter dine mål',
    description: 'Hage- og utendørsprodukter i tre, skreddersydd etter dine mål. Plantekasser, varmepumpehus, søppelboder, postkassestativer og mer. Håndlaget i Lillehammer.',
    ogImage: '/images/hero/forside_8.webp',
    ogImageAlt: 'Hage- og utendørsprodukter i tre fra Minio',
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
                <Route path="/handlaget-i-tre" element={<Suspense fallback={<PageLoadingFallback />}><HandlagetITrePage /></Suspense>} />
                <Route path="/byggehjelp" element={<Suspense fallback={<PageLoadingFallback />}><ByggehjelpPage /></Suspense>} />
                <Route path="/produkter/varmepumpehus" element={<Suspense fallback={<PageLoadingFallback />}><VarmepumpehusPage /></Suspense>} />
                <Route path="/produkter/soppelboder" element={<Suspense fallback={<PageLoadingFallback />}><SoppelboderPage /></Suspense>} />
                <Route path="/produkter/vedskjul" element={<Suspense fallback={<PageLoadingFallback />}><VedskjulPage /></Suspense>} />
                <Route path="/produkter/postkassestativer" element={<Suspense fallback={<PageLoadingFallback />}><PostkasseStativPage /></Suspense>} />
                <Route path="/produkter/plantekasser" element={<Suspense fallback={<PageLoadingFallback />}><PlantekassePage /></Suspense>} />
                <Route path="/produkter/pidestall-krakk" element={<Suspense fallback={<PageLoadingFallback />}><PidestallKrakkPage /></Suspense>} />
                <Route path="/produkter/levegger" element={<Suspense fallback={<PageLoadingFallback />}><LeveggerPage /></Suspense>} />
                <Route path="/produkter/hundehus" element={<Suspense fallback={<PageLoadingFallback />}><HundehusPage /></Suspense>} />
                <Route path="/produkter/kattehus" element={<Suspense fallback={<PageLoadingFallback />}><KattehusPage /></Suspense>} />
                <Route path="/produkter/:slug" element={<ProduktDetailPage />} />
                <Route path="/planleggere" element={<Suspense fallback={<PageLoadingFallback />}><PlanleggerePage /></Suspense>} />
                <Route path="/planleggere/terrasse" element={<Suspense fallback={<PageLoadingFallback />}><TerrassePlanleggerPage /></Suspense>} />
                <Route path="/planleggere/pergola" element={<Suspense fallback={<PageLoadingFallback />}><PergolaPlanleggerPage /></Suspense>} />
                <Route path="/planleggere/carport" element={<Suspense fallback={<PageLoadingFallback />}><CarportPlanleggerPage /></Suspense>} />
                <Route path="/planleggere/utekjokken" element={<Suspense fallback={<PageLoadingFallback />}><UtekjokkenPlanleggerPage /></Suspense>} />
                {/* Gamle adresser – behold lenker som folk allerede har */}
                <Route path="/terrasseplanlegger" element={<Navigate to="/planleggere/terrasse" replace />} />
                <Route path="/pergolaplanlegger" element={<Navigate to="/planleggere/pergola" replace />} />
                <Route path="/carportplanlegger" element={<Navigate to="/planleggere/carport" replace />} />
                <Route path="/skilt-og-gravering" element={<SkiltOgGraveringPage />} />
                <Route path="/byggeguider" element={<Suspense fallback={<PageLoadingFallback />}><DIYGuiderPage /></Suspense>} />
                <Route path="/byggeguider/planlegging" element={<Suspense fallback={<PageLoadingFallback />}><PlanleggingPage /></Suspense>} />
                <Route path="/byggeguider/prosjekter/hagebenk" element={<Suspense fallback={<PageLoadingFallback />}><HagebenkPage /></Suspense>} />
                <Route path="/byggeguider/prosjekter/pidestall-utendors" element={<Suspense fallback={<PageLoadingFallback />}><PidestallUtendorsPage /></Suspense>} />
                <Route path="/byggeguider/design-og-tegning" element={<Suspense fallback={<PageLoadingFallback />}><DesignTegningPage /></Suspense>} />
                <Route path="/byggeguider/konstruksjon-og-styrke" element={<Suspense fallback={<PageLoadingFallback />}><KonstruksjonStyrkePage /></Suspense>} />
                <Route path="/byggeguider/trevirke" element={<Suspense fallback={<PageLoadingFallback />}><TrevirkePage /></Suspense>} />
                <Route path="/byggeguider/trykkimpregnert-vs-royalimpregnert" element={<Suspense fallback={<PageLoadingFallback />}><TrykkimpregnertRoyalPage /></Suspense>} />
                <Route path="/byggeguider/kebony-lerk-furu-gran" element={<Suspense fallback={<PageLoadingFallback />}><KebonyLerkFuruGranPage /></Suspense>} />
                <Route path="/byggeguider/terrassebord-guide" element={<Suspense fallback={<PageLoadingFallback />}><TerrassebordGuidePage /></Suspense>} />
                <Route path="/byggeguider/konstruksjonsvirke-c24" element={<Suspense fallback={<PageLoadingFallback />}><KonstruksjonsvirkeC24Page /></Suspense>} />
                <Route path="/byggeguider/hvorfor-sprekker-treet" element={<Suspense fallback={<PageLoadingFallback />}><HvorforSprekkerTreetPage /></Suspense>} />
                <Route path="/byggeguider/trelast-dimensjoner" element={<Suspense fallback={<PageLoadingFallback />}><TrelastDimensjonerPage /></Suspense>} />
                <Route path="/byggeguider/riktig-skrue" element={<Suspense fallback={<PageLoadingFallback />}><RiktigSkruePage /></Suspense>} />
                <Route path="/byggeguider/syrefast-vs-galvanisert" element={<Suspense fallback={<PageLoadingFallback />}><SyrefastVsGalvanisertPage /></Suspense>} />
                <Route path="/byggeguider/beslag-oversikt" element={<Suspense fallback={<PageLoadingFallback />}><BeslagOversiktPage /></Suspense>} />
                <Route path="/byggeguider/justerbar-stolpesko" element={<Suspense fallback={<PageLoadingFallback />}><JusterbarStolpeskoPage /></Suspense>} />
                <Route path="/byggeguider/skjult-terrassefeste" element={<Suspense fallback={<PageLoadingFallback />}><SkjultTerrassefestePage /></Suspense>} />
                <Route path="/byggeguider/hvor-mange-skruer" element={<Suspense fallback={<PageLoadingFallback />}><HvorMangeSkruerPage /></Suspense>} />
                <Route path="/byggeguider/sirkelsag-dykksag-stikksag" element={<Suspense fallback={<PageLoadingFallback />}><SirkelsagDykksagStikksagPage /></Suspense>} />
                <Route path="/byggeguider/rette-fine-kutt" element={<Suspense fallback={<PageLoadingFallback />}><RetteFineKuttPage /></Suspense>} />
                <Route path="/byggeguider/vater-laser-oppmaling" element={<Suspense fallback={<PageLoadingFallback />}><VaterLaserOppmalingPage /></Suspense>} />
                <Route path="/byggeguider/forboring-og-senkning" element={<Suspense fallback={<PageLoadingFallback />}><ForboringOgSenkningPage /></Suspense>} />
                <Route path="/byggeguider/tresammenfoyninger" element={<Suspense fallback={<PageLoadingFallback />}><TresammenfoyningerPage /></Suspense>} />
                <Route path="/byggeguider/verktoyliste-nybegynner" element={<Suspense fallback={<PageLoadingFallback />}><VerktoylisteNybegynnerPage /></Suspense>} />
                <Route path="/byggeguider/telehiv" element={<Suspense fallback={<PageLoadingFallback />}><TelehivPage /></Suspense>} />
                <Route path="/byggeguider/fundamenttyper" element={<Suspense fallback={<PageLoadingFallback />}><FundamenttyperPage /></Suspense>} />
                <Route path="/byggeguider/stope-punktfundament" element={<Suspense fallback={<PageLoadingFallback />}><StopePunktfundamentPage /></Suspense>} />
                <Route path="/byggeguider/frostfri-dybde" element={<Suspense fallback={<PageLoadingFallback />}><FrostfriDybdePage /></Suspense>} />
                <Route path="/byggeguider/spennvidder-bjelker" element={<Suspense fallback={<PageLoadingFallback />}><SpennvidderBjelkerPage /></Suspense>} />
                <Route path="/byggeguider/stolpeavstand" element={<Suspense fallback={<PageLoadingFallback />}><StolpeavstandPage /></Suspense>} />
                <Route path="/byggeguider/beis-olje-maling" element={<Suspense fallback={<PageLoadingFallback />}><BeisOljeMalingPage /></Suspense>} />
                <Route path="/byggeguider/beise-ny-terrasse" element={<Suspense fallback={<PageLoadingFallback />}><BeiseNyTerrassePage /></Suspense>} />
                <Route path="/byggeguider/vedlikehold-terrasse" element={<Suspense fallback={<PageLoadingFallback />}><VedlikeholdTerrassePage /></Suspense>} />
                <Route path="/byggeguider/granet-tre" element={<Suspense fallback={<PageLoadingFallback />}><GranetTrePage /></Suspense>} />
                <Route path="/byggeguider/mugg-alger-gronske" element={<Suspense fallback={<PageLoadingFallback />}><MuggAlgerGronskePage /></Suspense>} />
                <Route path="/byggeguider/vinterklargjoring" element={<Suspense fallback={<PageLoadingFallback />}><VinterklargjoringPage /></Suspense>} />
                <Route path="/byggeguider/soknadsplikt-terrasse" element={<Suspense fallback={<PageLoadingFallback />}><SoknadspliktTerrassePage /></Suspense>} />
                <Route path="/byggeguider/carport-uten-soknad" element={<Suspense fallback={<PageLoadingFallback />}><CarportUtenSoknadPage /></Suspense>} />
                <Route path="/byggeguider/bod-uten-soknad" element={<Suspense fallback={<PageLoadingFallback />}><BodUtenSoknadPage /></Suspense>} />
                <Route path="/byggeguider/avstand-til-nabogrense" element={<Suspense fallback={<PageLoadingFallback />}><AvstandTilNabogrensePage /></Suspense>} />
                <Route path="/byggeguider/levegg-gjerde-regler" element={<Suspense fallback={<PageLoadingFallback />}><LeveggGjerdeReglerPage /></Suspense>} />
                <Route path="/byggeguider/tek17-for-privatpersoner" element={<Suspense fallback={<PageLoadingFallback />}><Tek17ForPrivatpersonerPage /></Suspense>} />
                <Route path="/byggeguider/bygge-terrasse" element={<Suspense fallback={<PageLoadingFallback />}><ByggeTerrassePage /></Suspense>} />
                <Route path="/byggeguider/bygge-pergola" element={<Suspense fallback={<PageLoadingFallback />}><ByggePergolaPage /></Suspense>} />
                <Route path="/byggeguider/bygge-carport" element={<Suspense fallback={<PageLoadingFallback />}><ByggeCarportPage /></Suspense>} />
                <Route path="/byggeguider/bygge-levegg" element={<Suspense fallback={<PageLoadingFallback />}><ByggeLeveggPage /></Suspense>} />
                <Route path="/byggeguider/bygge-platting" element={<Suspense fallback={<PageLoadingFallback />}><ByggePlattingPage /></Suspense>} />
                <Route path="/byggeguider/bygge-utebod" element={<Suspense fallback={<PageLoadingFallback />}><ByggeUtebodPage /></Suspense>} />
                <Route path="/byggeguider/bygge-utetrapp" element={<Suspense fallback={<PageLoadingFallback />}><ByggeUtetrappPage /></Suspense>} />
                <Route path="/byggeguider/bygge-rekkverk" element={<Suspense fallback={<PageLoadingFallback />}><ByggeRekkverkPage /></Suspense>} />
                <Route path="/byggeguider/materialberegning-terrasse" element={<Suspense fallback={<PageLoadingFallback />}><MaterialberegningTerrassePage /></Suspense>} />
                <Route path="/byggeguider/lese-byggetegning" element={<Suspense fallback={<PageLoadingFallback />}><LeseByggetegningPage /></Suspense>} />
                <Route path="/byggeguider/hva-koster-terrasse" element={<Suspense fallback={<PageLoadingFallback />}><HvaKosterTerrassePage /></Suspense>} />
                <Route path="/byggeguider/sjekkliste-for-du-starter" element={<Suspense fallback={<PageLoadingFallback />}><SjekklisteForDuStarterPage /></Suspense>} />
                <Route path="/byggeguider/vanligste-byggefeil" element={<Suspense fallback={<PageLoadingFallback />}><VanligsteByggefeilPage /></Suspense>} />
                <Route path="/byggeguider/ordliste-trearbeid" element={<Suspense fallback={<PageLoadingFallback />}><OrdlisteTrearbeidPage /></Suspense>} />
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
