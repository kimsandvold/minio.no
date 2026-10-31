import { matchRoutes } from 'react-router-dom'
import { lazyPage, type LazyPage } from './lib/lazyPage'

/**
 * Alle sider som lastes som egne JS-biter (code splitting), med ruta de hører til.
 *
 * App.tsx lager <Route>-ene fra denne lista, og main.tsx bruker den til å laste
 * bitene for gjeldende URL FØR React tar over den prerendrede HTML-en
 * (`preloadRoute`). Da byttes den statiske siden direkte mot den ekte siden, uten
 * å blinke innom «Laster…»-fallbacken.
 *
 * Ny lazy side? Legg den til her – ikke som egen import i App.tsx.
 */
export const LAZY_ROUTES: Array<{ path: string; Page: LazyPage }> = [
  { path: '/handlaget-i-tre', Page: lazyPage(() => import('./components/pages/HandlagetITre/HandlagetITrePage')) },
  { path: '/tjenester', Page: lazyPage(() => import('./components/pages/Tjenester/TjenesterPage')) },
  { path: '/byggehjelp', Page: lazyPage(() => import('./components/pages/Byggehjelp/ByggehjelpPage')) },
  { path: '/prosjekthjelp', Page: lazyPage(() => import('./components/pages/Prosjekthjelp/ProsjekthjelpPage')) },
  { path: '/3d-design', Page: lazyPage(() => import('./components/pages/TreDDesign/TreDDesignPage')) },
  { path: '/designverktoy', Page: lazyPage(() => import('./components/pages/Designer/DesignerLandingPage')) },
  { path: '/designverktoy/:produktId', Page: lazyPage(() => import('./components/pages/Designer/DesignerPage')) },
  { path: '/produkter/varmepumpehus', Page: lazyPage(() => import('./components/pages/Varmepumpehus/VarmepumpehusPage')) },
  { path: '/produkter/soppelboder', Page: lazyPage(() => import('./components/pages/Soppelboder/SoppelboderPage')) },
  { path: '/produkter/vedskjul', Page: lazyPage(() => import('./components/pages/Vedskjul/VedskjulPage')) },
  { path: '/produkter/postkassestativer', Page: lazyPage(() => import('./components/pages/Postkassestativ/PostkasseStativPage')) },
  { path: '/produkter/plantekasser', Page: lazyPage(() => import('./components/pages/Plantekasse/PlantekassePage')) },
  { path: '/produkter/pidestall-krakk', Page: lazyPage(() => import('./components/pages/PidestallKrakk/PidestallKrakkPage')) },
  { path: '/produkter/levegger', Page: lazyPage(() => import('./components/pages/Levegger/LeveggerPage')) },
  { path: '/produkter/hundehus', Page: lazyPage(() => import('./components/pages/Hundehus/HundehusPage')) },
  { path: '/produkter/kattehus', Page: lazyPage(() => import('./components/pages/Kattehus/KattehusPage')) },
  { path: '/planleggere', Page: lazyPage(() => import('./components/pages/Planleggere/PlanleggerePage')) },
  { path: '/planleggere/terrasse', Page: lazyPage(() => import('./components/pages/Terrasseplanlegger/TerrassePlanleggerPage')) },
  { path: '/planleggere/pergola', Page: lazyPage(() => import('./components/pages/Pergolaplanlegger/PergolaPlanleggerPage')) },
  { path: '/planleggere/carport', Page: lazyPage(() => import('./components/pages/Carportplanlegger/CarportPlanleggerPage')) },
  { path: '/planleggere/utekjokken', Page: lazyPage(() => import('./components/pages/Utekjokkenplanlegger/UtekjokkenPlanleggerPage')) },
  { path: '/gravering', Page: lazyPage(() => import('./components/pages/Gravering/GraveringPage')) },
  { path: '/byggeguider', Page: lazyPage(() => import('./components/pages/DIYGuider/DIYGuiderPage')) },
  { path: '/byggeguider/planlegging', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/PlanleggingPage')) },
  { path: '/byggeguider/prosjekter/hagebenk', Page: lazyPage(() => import('./components/pages/DIYGuider/prosjekter/HagebenkPage')) },
  { path: '/byggeguider/prosjekter/pidestall-utendors', Page: lazyPage(() => import('./components/pages/DIYGuider/prosjekter/PidestallUtendorsPage')) },
  { path: '/byggeguider/prosjekter/fuglehus', Page: lazyPage(() => import('./components/pages/DIYGuider/prosjekter/FuglehusPage')) },
  { path: '/byggeguider/design-og-tegning', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/DesignTegningPage')) },
  { path: '/byggeguider/konstruksjon-og-styrke', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/KonstruksjonStyrkePage')) },
  { path: '/byggeguider/trevirke', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/TrevirkePage')) },
  { path: '/byggeguider/trykkimpregnert-vs-royalimpregnert', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/TrykkimpregnertRoyalPage')) },
  { path: '/byggeguider/kebony-lerk-furu-gran', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/KebonyLerkFuruGranPage')) },
  { path: '/byggeguider/terrassebord-guide', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/TerrassebordGuidePage')) },
  { path: '/byggeguider/konstruksjonsvirke-c24', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/KonstruksjonsvirkeC24Page')) },
  { path: '/byggeguider/hvorfor-sprekker-treet', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/HvorforSprekkerTreetPage')) },
  { path: '/byggeguider/trelast-dimensjoner', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/TrelastDimensjonerPage')) },
  { path: '/byggeguider/riktig-skrue', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/RiktigSkruePage')) },
  { path: '/byggeguider/syrefast-vs-galvanisert', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/SyrefastVsGalvanisertPage')) },
  { path: '/byggeguider/beslag-oversikt', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/BeslagOversiktPage')) },
  { path: '/byggeguider/justerbar-stolpesko', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/JusterbarStolpeskoPage')) },
  { path: '/byggeguider/skjult-terrassefeste', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/SkjultTerrassefestePage')) },
  { path: '/byggeguider/hvor-mange-skruer', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/HvorMangeSkruerPage')) },
  { path: '/byggeguider/sirkelsag-dykksag-stikksag', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/SirkelsagDykksagStikksagPage')) },
  { path: '/byggeguider/rette-fine-kutt', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/RetteFineKuttPage')) },
  { path: '/byggeguider/vater-laser-oppmaling', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/VaterLaserOppmalingPage')) },
  { path: '/byggeguider/forboring-og-senkning', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/ForboringOgSenkningPage')) },
  { path: '/byggeguider/tresammenfoyninger', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/TresammenfoyningerPage')) },
  { path: '/byggeguider/verktoyliste-nybegynner', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/VerktoylisteNybegynnerPage')) },
  { path: '/byggeguider/telehiv', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/TelehivPage')) },
  { path: '/byggeguider/fundamenttyper', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/FundamenttyperPage')) },
  { path: '/byggeguider/stope-punktfundament', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/StopePunktfundamentPage')) },
  { path: '/byggeguider/frostfri-dybde', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/FrostfriDybdePage')) },
  { path: '/byggeguider/spennvidder-bjelker', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/SpennvidderBjelkerPage')) },
  { path: '/byggeguider/stolpeavstand', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/StolpeavstandPage')) },
  { path: '/byggeguider/beis-olje-maling', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/BeisOljeMalingPage')) },
  { path: '/byggeguider/beise-ny-terrasse', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/BeiseNyTerrassePage')) },
  { path: '/byggeguider/vedlikehold-terrasse', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/VedlikeholdTerrassePage')) },
  { path: '/byggeguider/granet-tre', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/GranetTrePage')) },
  { path: '/byggeguider/mugg-alger-gronske', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/MuggAlgerGronskePage')) },
  { path: '/byggeguider/vinterklargjoring', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/VinterklargjoringPage')) },
  { path: '/byggeguider/soknadsplikt-terrasse', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/SoknadspliktTerrassePage')) },
  { path: '/byggeguider/carport-uten-soknad', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/CarportUtenSoknadPage')) },
  { path: '/byggeguider/bod-uten-soknad', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/BodUtenSoknadPage')) },
  { path: '/byggeguider/avstand-til-nabogrense', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/AvstandTilNabogrensePage')) },
  { path: '/byggeguider/levegg-gjerde-regler', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/LeveggGjerdeReglerPage')) },
  { path: '/byggeguider/tek17-for-privatpersoner', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/Tek17ForPrivatpersonerPage')) },
  { path: '/byggeguider/bygge-terrasse', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/ByggeTerrassePage')) },
  { path: '/byggeguider/bygge-pergola', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/ByggePergolaPage')) },
  { path: '/byggeguider/bygge-carport', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/ByggeCarportPage')) },
  { path: '/byggeguider/bygge-levegg', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/ByggeLeveggPage')) },
  { path: '/byggeguider/bygge-platting', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/ByggePlattingPage')) },
  { path: '/byggeguider/bygge-utebod', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/ByggeUtebodPage')) },
  { path: '/byggeguider/bygge-utetrapp', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/ByggeUtetrappPage')) },
  { path: '/byggeguider/bygge-rekkverk', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/ByggeRekkverkPage')) },
  { path: '/byggeguider/materialberegning-terrasse', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/MaterialberegningTerrassePage')) },
  { path: '/byggeguider/lese-byggetegning', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/LeseByggetegningPage')) },
  { path: '/byggeguider/hva-koster-terrasse', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/HvaKosterTerrassePage')) },
  { path: '/byggeguider/sjekkliste-for-du-starter', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/SjekklisteForDuStarterPage')) },
  { path: '/byggeguider/vanligste-byggefeil', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/VanligsteByggefeilPage')) },
  { path: '/byggeguider/ordliste-trearbeid', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/OrdlisteTrearbeidPage')) },
  { path: '/byggeguider/verktoy', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/VerktoyPage')) },
  { path: '/byggeguider/lim-og-festemidler', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/LimFestemidlerPage')) },
  { path: '/byggeguider/sikkerhet', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/SikkerhetPage')) },
  { path: '/byggeguider/maling-og-merking', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/MalingMerkingPage')) },
  { path: '/byggeguider/saging-og-sammenfoyning', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/SagingSammenfoyningPage')) },
  { path: '/byggeguider/sliping', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/SlipingPage')) },
  { path: '/byggeguider/overflatebehandling', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/OverflatebehandlingPage')) },
  { path: '/byggeguider/vedlikehold', Page: lazyPage(() => import('./components/pages/DIYGuider/articles/VedlikeholdPage')) },
  { path: '/salgsbetingelser', Page: lazyPage(() => import('./components/pages/Legal/SalgsbetingelserPage')) },
  { path: '/personvern', Page: lazyPage(() => import('./components/pages/Legal/PersonvernPage')) },
  { path: '/slik-jobber-vi', Page: lazyPage(() => import('./components/pages/Prosess/ProsessPage')) },
  { path: '/kontakt', Page: lazyPage(() => import('./components/pages/Kontakt/KontaktPage')) },
  { path: '/produkter', Page: lazyPage(() => import('./components/pages/Produkter/ProdukterPage')) },
  { path: '/produkter/:slug', Page: lazyPage(() => import('./components/pages/Produkter/ProduktDetailPage')) },
  { path: '/underholdning', Page: lazyPage(() => import('./components/pages/Underholdning/UnderholdningPage')) },
  { path: '/spill-av-leah-noelle', Page: lazyPage(() => import('./components/pages/LeahNoelle/LeahNoellePage')) },
  { path: '/handlekurv', Page: lazyPage(() => import('./components/pages/Handlekurv/HandlekurvPage')) },
  { path: '/mine-design', Page: lazyPage(() => import('./components/pages/MineDesign/MineDesignPage')) },
  { path: '/mine-bestillinger', Page: lazyPage(() => import('./components/pages/MineBestillinger/MineBestillingerPage')) },
  { path: '/design/:designId', Page: lazyPage(() => import('./components/pages/DesignView/DesignViewPage')) },
]
/**
 * Last JS-biten for siden på `pathname` (om den er lazy). Løses alltid – også
 * ved feil – så oppstarten aldri blir hengende; da faller React tilbake til
 * vanlig lazy-lasting med Suspense.
 */
export function preloadRoute(pathname: string): Promise<void> {
  const treff = matchRoutes(LAZY_ROUTES, pathname)
  const rute = treff?.[treff.length - 1]?.route
  if (!rute) return Promise.resolve()
  return rute.Page.preload().then(
    () => undefined,
    () => undefined,
  )
}
