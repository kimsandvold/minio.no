import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { useAuthContext } from '../../../context/AuthContext'
import { TEMPLATES, KOMMER_SNART, getTemplate } from '../../../designer/registry'
import { FARGER } from '../../../designer/materials'
import { alleprisposter, settPris } from '../../../designer/priser'
import { byggesoknadPdf, byggesoknadUtskrift, planPdf, planUtskrift, type PlanArgs, type SoknadArgs } from '../../../designer/pdf'
import {
  opprettProsjekt, oppdaterProsjekt, getBrukerProsjekter, getProsjekt, slettProsjekt, markerKjopt, MaksDesignError,
} from '../../../services/designerService'
import { startVippsBetaling, sjekkVippsStatus, vippsBelopFor } from '../../../services/vippsService'
import type { DesignerProsjekt, Vare, Kjopt } from '../../../types/designerProsjekt'
import { MAKS_DESIGN_PER_TYPE, VARER_FOR_KJOP, entitlements } from '../../../types/designerProsjekt'
import type { DesignConfig } from '../../../designer/types'
import DesignerViewport, { type ViewApi, type PartInfo, type ViewPreset } from './DesignerViewport'
import Tegning2DView from './Tegning2DView'
import ForesporselModal from './ForesporselModal'
import type { ForesporselType } from '../../../types/foresporsel'

const formatKr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

// Kamera-navigasjon uten mus: hastigheter per animasjonsramme mens en knapp holdes.
const ORBIT_STEP = 0.028 // rad/ramme (~1,6°) – rotasjon
const ZOOM_IN = 0.985 // faktor/ramme – zoom inn
const ZOOM_OUT = 1.015 // faktor/ramme – zoom ut

const VIEW_PRESETS: Array<{ id: ViewPreset; navn: string; ikon: string }> = [
  { id: 'iso', navn: 'Isometrisk', ikon: 'faCube' },
  { id: 'front', navn: 'Forfra', ikon: 'faArrowUp' },
  { id: 'back', navn: 'Bakfra', ikon: 'faArrowDown' },
  { id: 'left', navn: 'Venstre', ikon: 'faArrowLeft' },
  { id: 'right', navn: 'Høyre', ikon: 'faArrowRight' },
  { id: 'top', navn: 'Ovenfra', ikon: 'faChevronUp' },
  { id: 'bottom', navn: 'Nedenfra', ikon: 'faChevronDown' },
]

// Knapp som gjentar handlingen mykt mens den holdes inne (trykk-og-hold),
// og gjør ett steg ved kort trykk/tastetrykk. Peker-events dekker mus + berøring.
function HoldBtn({ action, title, icon, className }: { action: () => void; title: string; icon: string; className?: string }) {
  const raf = useRef(0)
  const stop = () => { if (raf.current) { cancelAnimationFrame(raf.current); raf.current = 0 } }
  const start = () => { stop(); const step = () => { action(); raf.current = requestAnimationFrame(step) }; step() }
  useEffect(() => stop, [])
  return (
    <NavBtn
      className={className}
      title={title}
      aria-label={title}
      onPointerDown={(e) => { e.preventDefault(); start() }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); action() } }}
    >
      <Icon name={icon} />
    </NavBtn>
  )
}

// Midlertidig: opplåsing med 6-sifret kode i påvente av betalingsintegrasjon.
// Koden sendes til kunden etter betaling. Demokode inntil videre: 198000.
const DEMO_CODE = '198000'

/** Slår sammen leveransene fra et kjøp inn i eksisterende entitlements. */
const grantKjopt = (base: Kjopt | undefined, vare: Vare | 'bundle'): Kjopt => {
  const next: Kjopt = { ...base }
  for (const flag of VARER_FOR_KJOP[vare]) next[flag] = true
  return next
}

// Prislogikk for «Be om å få det laget».
const MATERIAL_PAASLAG = 1.3 // håndtering/margin på materialestimatet
const BYGGE_TIMEPRIS = 800 // kr/time for håndverk
// Standard-kassa (80×40×40): 3 t å bygge ferdig, 2 t å kappe + pakke.
// Timene skaleres opp/ned med størrelse ut fra materialmengden.
const STD_BYGGE_TIMER = 3
const STD_KAPP_TIMER = 2

// Skaler arbeidstid rundt standard-timene ut fra materialforhold (klemt til ±).
function skalertTimer(stdTimer: number, estimatKr: number, refEstimat: number, min: number, maks: number): number {
  const forhold = refEstimat > 0 ? estimatKr / refEstimat : 1
  const t = Math.min(maks, Math.max(min, stdTimer * forhold))
  return Math.round(t * 2) / 2 // nærmeste halvtime
}

// 6-sifret kode-inntasting (én boks per siffer, som 2FA).
function CodeModal({ error, belop, onSubmit, onVipps, onClose }: { error: boolean; belop: number; onSubmit: (code: string) => void; onVipps: () => void; onClose: () => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const set = (i: number, ch: string) => {
    const c = ch.replace(/\D/g, '').slice(-1)
    const nd = [...digits]
    nd[i] = c
    setDigits(nd)
    if (c && i < 5) refs.current[i + 1]?.focus()
    if (nd.every((x) => x)) onSubmit(nd.join(''))
  }
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }
  const onPaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!t) return
    e.preventDefault()
    const nd = ['', '', '', '', '', '']
    for (let i = 0; i < t.length; i++) nd[i] = t[i]
    setDigits(nd)
    if (t.length === 6) onSubmit(t)
    else refs.current[t.length]?.focus()
  }

  return (
    <CodeOverlay onClick={onClose}>
      <CodeBox onClick={(e) => e.stopPropagation()}>
        <CodeClose onClick={onClose} aria-label="Lukk"><Icon name="faXmark" /></CodeClose>
        <CodeIcon><Icon name="faLock" /></CodeIcon>
        <h3>Lås opp byggeplan</h3>
        <p>Skriv inn den 6-sifrede koden du fikk på e-post etter betaling.</p>
        <CodeDigits $err={error} onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el }}
              value={d}
              inputMode="numeric"
              maxLength={1}
              autoFocus={i === 0}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
            />
          ))}
        </CodeDigits>
        {error && <CodeErr>Ugyldig kode. Sjekk e-posten din.</CodeErr>}
        <CodeDivider><span>ikke betalt ennå?</span></CodeDivider>
        <VippsBtn onClick={onVipps}>Betal med Vipps – kr {belop.toLocaleString('nb-NO')}</VippsBtn>
        <CodeHint>Koden sendes på e-post når betalingen er registrert.</CodeHint>
      </CodeBox>
    </CodeOverlay>
  )
}

interface SectionProps {
  id: string
  title: string
  open: boolean
  onToggle: (id: string) => void
  children: ReactNode
}

function Section({ id, title, open, onToggle, children }: SectionProps) {
  return (
    <SectionWrap>
      <SectionHead onClick={() => onToggle(id)} aria-expanded={open}>
        <span>{title}</span>
        <Chevron $open={open}><Icon name="faChevronDown" /></Chevron>
      </SectionHead>
      <SectionBody $open={open}>
        <div>{children}</div>
      </SectionBody>
    </SectionWrap>
  )
}

// Enkle SVG-ikoner for plantekasseformene (matcher gammel konfigurator).
function ShapeIcon({ shape }: { shape: string }) {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round' as const }
  switch (shape) {
    case 'square':
      return <svg viewBox="0 0 26 22" aria-hidden><rect x="7" y="3" width="12" height="12" {...stroke} /></svg>
    case 'rect':
      return <svg viewBox="0 0 26 22" aria-hidden><rect x="3" y="5" width="20" height="9" {...stroke} /></svg>
    case 'outside-corner':
      return (
        <svg viewBox="0 0 26 22" aria-hidden style={{ transform: 'rotate(135deg)' }}>
          <path d="M4 4 H22 V10 H10 V18 H4 Z" {...stroke} />
        </svg>
      )
    case 'inside-corner':
      return (
        <svg viewBox="0 0 26 22" aria-hidden style={{ transform: 'rotate(135deg)' }}>
          <path d="M4 4 H14 V12 H22 V18 H4 Z" {...stroke} />
        </svg>
      )
    default:
      return null
  }
}

export default function DesignerPage() {
  const navigate = useNavigate()
  const { produktId } = useParams<{ produktId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated, loading: authLoading, login, firebaseUser } = useAuthContext()
  const uid = firebaseUser?.uid
  useScrollLock(true)

  const template = produktId ? getTemplate(produktId) : undefined

  useSEO({
    title: template
      ? `${template.navn} – tegn i 3D & få materialliste | Minio`
      : '3D-design – tegn uteprosjektet selv | Minio',
    description: template
      ? `${template.beskrivelse} Tilpass mål og materialer i 3D, se prisestimat live og last ned komplett materialliste og byggeplan (PDF).`.slice(0, 300)
      : 'Design uteprosjektet ditt i 3D – gratis. Tegn terrasse, pergola, carport, utekjøkken, plantekasse eller varmepumpekasse, tilpass mål og materialer, og få materialliste, prisestimat og byggeplan (PDF).',
    keywords: template
      ? `${template.navn.toLowerCase()} 3d, tegne ${template.navn.toLowerCase()}, ${template.navn.toLowerCase()} materialliste, bygge ${template.navn.toLowerCase()}, ${template.navn.toLowerCase()} byggeplan, design selv`
      : '3d design, terrasse, pergola, carport, utekjøkken, plantekasse, materialliste, byggeplan, tegne selv',
    ogImage: template?.bilde,
    ogImageAlt: template ? `${template.navn} tegnet i Minios 3D-designer` : 'Minios 3D-designverktøy',
    jsonLd: template
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            '@id': `https://minio.no/designverktoy/${template.id}#app`,
            name: `${template.navn} – 3D-designer`,
            url: `https://minio.no/designverktoy/${template.id}`,
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Web',
            inLanguage: 'nb-NO',
            description: template.beskrivelse,
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'NOK' },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Hjem', item: 'https://minio.no/' },
              { '@type': 'ListItem', position: 2, name: '3D-design', item: 'https://minio.no/designverktoy' },
              { '@type': 'ListItem', position: 3, name: template.navn, item: `https://minio.no/designverktoy/${template.id}` },
            ],
          },
        ]
      : undefined,
  })

  const [config, setConfig] = useState<DesignConfig>(() => (template ? { ...template.defaultConfig } : {}))
  // Alltid komplett config: ved direkte-navigasjon kan `config` mangle nøkler i
  // rendringen før reset-effekten kjører. Fletter inn defaults så beregn/3D
  // aldri leser undefined-felter.
  const cfg = useMemo(() => (template ? { ...template.defaultConfig, ...config } : config), [template, config])

  // Nullstill mål synkront når produktet byttes – FØR 3D-en rendrer – slik at
  // viewporten aldri ser forrige modells config (som blør inn via cfg-fletten
  // og gir feil innramming/zoom på den nye modellen). Reset-effekten under
  // håndterer resten av UI-staten.
  const prevTemplateIdRef = useRef(template?.id)
  if (template && template.id !== prevTemplateIdRef.current) {
    prevTemplateIdRef.current = template.id
    setConfig({ ...template.defaultConfig })
  }
  const [dragLabel, setDragLabel] = useState<string | null>(null)
  const [shadows, setShadows] = useState(true)
  const [viewMode, setViewMode] = useState<'assembled' | 'explode' | 'parts' | 'tegning'>('assembled')
  const [explodeAmt, setExplodeAmt] = useState(1) // manuell splittgrad (0–1.5)
  const [showcase, setShowcase] = useState(false) // «vis frem»-animasjon
  const [showHandles, setShowHandles] = useState(true)
  const [lightIntensity, setLightIntensity] = useState(1)
  const [sunAzimuth, setSunAzimuth] = useState(40)
  const [sunElevation, setSunElevation] = useState(55)
  const [fog, setFog] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [woodTexture, setWoodTexture] = useState(true)
  // Skjul kledning/tak/gulv for å se konstruksjonen (stenderverk, bjelkelag, sperrer).
  const [hideKledning, setHideKledning] = useState(false)
  const [hideTak, setHideTak] = useState(false)
  const [hideGulv, setHideGulv] = useState(false)
  // «Kledning» skjuler alt utvendig skall: bordkledning ('kledning') og
  // carportens vegg-/akrylpaneler ('vegg').
  const hiddenParts = [hideKledning ? 'kledning,vegg' : '', hideTak ? 'tak' : '', hideGulv ? 'gulv' : ''].filter(Boolean).join(',')
  const [paintMode, setPaintMode] = useState(false)
  const [configOpen, setConfigOpen] = useState(true)
  // Visning-innstillingene er sekundære – slått sammen/skjult som standard så
  // de kommersielle valgene (byggeplan/byggesøknad) får plass øverst i raden.
  const [viewSettingsOpen, setViewSettingsOpen] = useState(false)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, { treslag: string; farge: string }>>({})
  // Penselen har egen tilstand (uavhengig av modellens standardmateriale).
  const [brush, setBrush] = useState<Record<string, string>>({ treslag: 'impregnert', farge: 'ubehandlet' })
  const explode = viewMode === 'explode' ? explodeAmt : 0
  // 3D-scenen (og dens overlegg) vises kun i montert/splitt – ikke i 2D-modusene.
  const is3D = viewMode === 'assembled' || viewMode === 'explode'
  // Plantekasse er helt gratis: materialliste, 2D-plan, nedlasting og utskrift
  // er alltid åpne. For alle andre produkter styres opplåsingen av kode/betaling.
  const gratis = !!template?.gratis
  // Kode-basert opplåsing (demo/tilgangskode) gjelder hele økten og gir tilgang
  // til alle leveranser. Betalt/kjøpt tilgang leses per leveranse fra designet.
  const [codeUnlockAll, setCodeUnlockAll] = useState(false)
  const [codeErr, setCodeErr] = useState(false)
  // Id-en til den første seksjonen som rendres (rekkefølge: form → preset → mål).
  const forsteSeksjon = template?.former ? 'form' : template?.presets?.length ? 'preset' : 'mal'
  const [openSection, setOpenSection] = useState<string>(forsteSeksjon)
  const toggleSection = (id: string) => setOpenSection((cur) => (cur === id ? '' : id))
  const [showCode, setShowCode] = useState(false)
  const [unlockedModal, setUnlockedModal] = useState(false)
  const [prisVersjon, setPrisVersjon] = useState(0)
  const viewApi = useRef<ViewApi | null>(null)
  const pendingRef = useRef<(() => void) | null>(null)

  // Lagrede design (Firestore) for gjeldende produkt.
  const [savedList, setSavedList] = useState<DesignerProsjekt[]>([])
  const [currentDesignId, setCurrentDesignId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [showMine, setShowMine] = useState(false)
  const [foresporsel, setForesporsel] = useState<ForesporselType | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const currentDesign = savedList.find((d) => d.id === currentDesignId) ?? null
  const dirty =
    !currentDesign ||
    JSON.stringify(config) !== JSON.stringify(currentDesign.config) ||
    JSON.stringify(overrides) !== JSON.stringify(currentDesign.overrides ?? {})

  // Tilgang pr. leveranse (entitlements): gratis produkt, kode-opplåsing hele
  // økten, eller kjøpt tilgang lagret på designet (bakoverkompatibelt med `betalt`).
  const kjoptTilgang = currentDesign ? entitlements(currentDesign) : {}
  const har = (vare: Vare): boolean => gratis || codeUnlockAll || kjoptTilgang[vare] === true
  // «unlocked» = byggeplan-nivået (mål, kappliste, plan-PDF). Beholdt navn for
  // å unngå churn i visningen; søknad/CNC sjekkes eksplisitt med `har()`.
  const unlocked = har('plan')

  // Kjør handlingen hvis leveransen er låst opp, ellers be om koden/betaling
  // først og husk handlingen til etter opplåsing.
  const gate = (vare: Vare, action: () => void) => {
    if (har(vare)) action()
    else { pendingRef.current = action; setShowCode(true) }
  }

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2200) }

  // prisVersjon tvinger ny beregning når en pris endres (leses fra global prisliste).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bom = useMemo(() => (template ? template.beregn(cfg) : null), [template, cfg, prisVersjon])

  const tegning = useMemo(() => (template?.tegning2D ? template.tegning2D(cfg) : null), [template, cfg])

  const endrePris = (id: string, verdi: number) => {
    settPris(id, verdi)
    setPrisVersjon((v) => v + 1)
  }

  // Nullstill designet når produktet (URL-en) endres.
  useEffect(() => {
    if (!template) return
    setConfig({ ...template.defaultConfig })
    setCodeUnlockAll(false)
    setCodeErr(false)
    setShowCode(false)
    setViewMode('assembled')
    setOverrides({})
    setPaintMode(false)
    setShowcase(false)
    setCurrentDesignId(null)
    setBrush({ treslag: String(template.defaultConfig.treslag), farge: String(template.defaultConfig.farge) })
    setOpenSection(template.former ? 'form' : template.presets?.length ? 'preset' : 'mal')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produktId])

  // Fjern markering når modellen bygges om (mål/materialer endres).
  useEffect(() => { setSelectedPart(null) }, [config, overrides, woodTexture])

  const paintPart = (pid: string) =>
    setOverrides((o) => ({ ...o, [pid]: { treslag: brush.treslag, farge: brush.farge } }))

  const chooseProduct = (id: string) => navigate(`/designverktoy/${id}`)

  const planArgs = (): PlanArgs | null => {
    if (!template || !bom) return null
    return {
      template,
      config,
      bom,
      designNavn: currentDesign?.navn,
      montering: template.montering?.(cfg) ?? [],
      deler: template.kappliste?.(cfg) ?? [],
      raad: (() => {
        const r = template.raad?.(cfg) ?? []
        const b = template.byggeregler?.(cfg)
        return b ? [...r, `Byggeregler – ${b.tittel}: ${b.punkter.join(' ')}`] : r
      })(),
      images: {
        assembled: viewApi.current?.snapshot(0, 'iso') ?? '',
        exploded: viewApi.current?.snapshot(1, 'iso') ?? '',
      },
      // Byggeplanen bruker det lette arbeidsrisset. Det komplette søknadssettet
      // (plan + fasader + snitt) lastes ned via egen «byggesøknad-hefte»-knapp.
      tegning: template.tegning2D?.(cfg),
    }
  }

  const runExport = async (mode: 'pdf' | 'print') => {
    const a = planArgs()
    if (!a) return
    try {
      if (mode === 'pdf') { flash('Lager byggeplan …'); await planPdf(a) }
      else planUtskrift(a)
    } catch (e) {
      console.error('Byggeplan-eksport feilet:', e)
      flash('Kunne ikke lage PDF – prøv igjen, eller bruk Chrome hvis du er i Safari.')
    }
  }

  const exportPlan = (mode: 'pdf' | 'print') => gate('plan', () => void runExport(mode))

  const soknadArgs = (): SoknadArgs | null => {
    if (!template?.soknadTegning) return null
    return {
      template,
      config,
      tegning: template.soknadTegning(cfg),
      byggeregler: template.byggeregler?.(cfg),
      arealM2: bom?.arealM2,
      designNavn: currentDesign?.navn,
      images: { assembled: viewApi.current?.snapshot(0, 'iso') ?? '' },
    }
  }

  const exportSoknad = (mode: 'pdf' | 'print') =>
    gate('soknad', async () => {
      const s = soknadArgs()
      if (!s) return
      try {
        if (mode === 'pdf') { flash('Lager byggesøknad-hefte …'); await byggesoknadPdf(s) }
        else byggesoknadUtskrift(s)
      } catch (e) {
        console.error('Byggesøknad-eksport feilet:', e)
        flash('Kunne ikke lage hefte – prøv igjen, eller bruk Chrome hvis du er i Safari.')
      }
    })

  // Manuell kamera-navigasjon stopper «vis frem» før den kjører kommandoen.
  const nav = (fn: () => void) => { setShowcase(false); fn() }

  const verifyCode = (v: string) => {
    const designMatch = currentDesign && v === currentDesign.tilgangskode
    if (v === DEMO_CODE || designMatch) {
      setCodeErr(false)
      setShowCode(false)
      if (v === DEMO_CODE) {
        // Demokode = full opplåsing av alle leveranser for økten (test).
        setCodeUnlockAll(true)
      } else if (designMatch && currentDesign) {
        // Ekte design-kode = byggeplanen er betalt (plan + søknad). Persister.
        markerKjopt(currentDesign.id, 'plan').catch(() => {})
        setSavedList((prev) =>
          prev.map((d) =>
            d.id === currentDesign.id ? { ...d, betalt: true, kjopt: grantKjopt(d.kjopt, 'plan') } : d,
          ),
        )
      }
      // Ikke kjør nedlastingen automatisk: den er asynkron (html2canvas) og
      // mister «user activation», så nettleseren blokkerer nedlastingen. Vis i
      // stedet en bekreftelses-modal med en eksplisitt nedlastingsknapp.
      setUnlockedModal(true)
    } else {
      setCodeErr(true)
    }
  }

  // Kjør den ventende eksporten fra en fersk knappetrykk-gest (modalen).
  const runPending = () => {
    const action = pendingRef.current
    pendingRef.current = null
    setUnlockedModal(false)
    action?.()
  }
  const closeUnlocked = () => { pendingRef.current = null; setUnlockedModal(false) }

  // Last brukerens lagrede design for gjeldende produkt.
  useEffect(() => {
    if (!uid || !produktId) { setSavedList([]); return }
    setListLoading(true)
    getBrukerProsjekter(uid, produktId)
      .then(setSavedList)
      .catch(() => {})
      .finally(() => setListLoading(false))
  }, [uid, produktId])

  const beginNaming = () => {
    if (!template) return
    setNameInput(currentDesign?.navn ?? `${template.navn} ${savedList.length + 1}`)
    setEditingName(true)
  }

  const handleSave = async () => {
    if (!uid || !template || busy) return
    if (currentDesignId) {
      setBusy(true)
      try {
        await oppdaterProsjekt(currentDesignId, { config, overrides })
        setSavedList((prev) => prev.map((d) => (d.id === currentDesignId ? { ...d, config, overrides } : d)))
        flash('Lagret')
      } catch { flash('Kunne ikke lagre') } finally { setBusy(false) }
    } else {
      beginNaming()
    }
  }

  // Inline navngiving (ved tittelen): oppretter nytt eller gir nytt navn.
  const commitName = async () => {
    setEditingName(false)
    const navn = nameInput.trim()
    if (!navn || !uid || !template || busy) return
    if (currentDesignId) {
      if (navn === currentDesign?.navn) return
      setBusy(true)
      try {
        await oppdaterProsjekt(currentDesignId, { navn })
        setSavedList((prev) => prev.map((d) => (d.id === currentDesignId ? { ...d, navn } : d)))
        flash('Navn oppdatert')
      } catch { flash('Kunne ikke endre navn') } finally { setBusy(false) }
    } else {
      setBusy(true)
      try {
        const p = await opprettProsjekt({ userId: uid, templateId: template.id, navn, config, overrides })
        setSavedList((prev) => [p, ...prev])
        setCurrentDesignId(p.id)
        flash('Design lagret')
      } catch (e) {
        flash(e instanceof MaksDesignError ? e.message : 'Kunne ikke lagre')
      } finally { setBusy(false) }
    }
  }

  const openDesign = (p: DesignerProsjekt) => {
    if (!template) return
    setConfig({ ...template.defaultConfig, ...p.config } as DesignConfig)
    setOverrides(p.overrides ?? {})
    setCurrentDesignId(p.id)
    // Tilgang leses fra designets egne entitlements via `har()`; nullstill kun
    // øktens kode-opplåsing så et nytt design ikke arver forrige opplåsing.
    setCodeUnlockAll(false)
    setViewMode('assembled')
    setPaintMode(false)
    setShowcase(false)
    setShowMine(false)
    flash(`Åpnet «${p.navn}»`)
  }

  // Retur fra Vipps: ?vipps=<prosjektId>. Sjekk status, lås opp ved betalt.
  const vippsHandled = useRef(false)
  useEffect(() => {
    const prosjektId = searchParams.get('vipps')
    if (!prosjektId || !uid || vippsHandled.current) return
    vippsHandled.current = true
    flash('Sjekker betaling …')
    ;(async () => {
      const res = await sjekkVippsStatus(prosjektId)
      if (res.betalt) {
        // Hent det oppdaterte designet (Cloud Function har satt riktig `kjopt`).
        const p = await getProsjekt(prosjektId)
        if (p) {
          openDesign(p)
          setSavedList((prev) =>
            prev.some((d) => d.id === p.id) ? prev.map((d) => (d.id === p.id ? p : d)) : [p, ...prev],
          )
        }
        const navn: Record<Vare, string> = {
          plan: 'byggeplanen', soknad: 'søknadsheftet', cnc: 'maskinfilene',
        }
        flash(`Betaling fullført – ${navn[res.vare ?? 'plan']} er låst opp!`)
      } else {
        flash('Betalingen ble ikke fullført.')
      }
      // Fjern ?vipps fra URL-en slik at reload ikke sjekker på nytt.
      searchParams.delete('vipps')
      setSearchParams(searchParams, { replace: true })
    })()
  }, [searchParams, uid, setSearchParams])

  const startRename = (id: string, navn: string) => {
    setRenameId(id)
    setRenameName(navn)
  }

  const doRename = async () => {
    if (!renameId || busy) return
    const navn = renameName.trim()
    if (!navn) return
    setBusy(true)
    try {
      await oppdaterProsjekt(renameId, { navn })
      setSavedList((prev) => prev.map((d) => (d.id === renameId ? { ...d, navn } : d)))
      setRenameId(null)
      flash('Navn oppdatert')
    } catch { flash('Kunne ikke endre navn') } finally { setBusy(false) }
  }

  const removeDesign = async (id: string) => {
    if (busy) return
    setBusy(true)
    try {
      await slettProsjekt(id)
      setSavedList((prev) => prev.filter((d) => d.id !== id))
      if (currentDesignId === id) setCurrentDesignId(null)
    } catch { flash('Kunne ikke slette') } finally { setBusy(false) }
  }

  const nyttDesign = () => {
    if (!template) return
    setConfig({ ...template.defaultConfig })
    setOverrides({})
    setCurrentDesignId(null)
    setCodeUnlockAll(false)
    setViewMode('assembled')
    setShowMine(false)
  }

  const startVipps = async (vare: Vare | 'bundle' = 'plan') => {
    if (!currentDesign) { flash('Lagre designet først'); return }
    flash('Starter Vipps-betaling …')
    const res = await startVippsBetaling(currentDesign, vare)
    if (res.ok && res.redirectUrl) {
      window.location.href = res.redirectUrl
      return
    }
    flash(res.message)
  }

  // Alle deler (uavhengig av opplåsing) – til 2D-delevisningen; mål skjules når låst.
  const alleDeler = useMemo(() => (template?.kappliste ? template.kappliste(cfg) : []), [template, cfg])
  // Bokstav-merke (A, B, C …) per unik del – kobler 3D, delevisning og PDF.
  const merker = useMemo(() => {
    const m = new Map<string, string>()
    alleDeler.forEach((d, i) => m.set(`${d.navn}|${d.profil}|${d.lengdeCm}`, String.fromCharCode(65 + i)))
    return m
  }, [alleDeler])
  const [hoveredPart, setHoveredPart] = useState<PartInfo | null>(null)
  const [selectedPart, setSelectedPart] = useState<PartInfo | null>(null)
  const merkeFor = (p: PartInfo | null) => (p ? merker.get(`${p.navn}|${p.profil}|${p.lengdeCm}`) : undefined)
  const hoveredMerke = merkeFor(hoveredPart)
  const selectedMerke = merkeFor(selectedPart)

  const patch = (p: Partial<DesignConfig>) => setConfig((c) => ({ ...c, ...p }) as DesignConfig)

  // Prislogikk for forespørsel/oppsummering (materialestimat + skalert arbeidstid).
  const estimatKr = bom?.estimatKr ?? 0
  const refEstimat = template ? template.beregn(template.defaultConfig).estimatKr : 0
  const materialPris = Math.round(estimatKr * MATERIAL_PAASLAG)
  // Templatet kan angi konkret montering/arbeidstid (bom.arbeidstimer); ellers
  // skaleres standard-timene ut fra materialmengden.
  const byggeTimer = bom?.arbeidstimer ?? skalertTimer(STD_BYGGE_TIMER, estimatKr, refEstimat, 2, 5)
  const arbeidPris = Math.round(byggeTimer * BYGGE_TIMEPRIS)
  const kappPris = Math.round(skalertTimer(STD_KAPP_TIMER, estimatKr, refEstimat, 1.5, 3.5) * BYGGE_TIMEPRIS)
  const prisFerdig = materialPris + arbeidPris
  const prisPakke = materialPris + kappPris

  // Tilbyr templatet denne leveransen? Utelatt liste = alle tilbys.
  const kanLeveranse = (id: 'ferdig' | 'materialpakke' | 'plan') =>
    !template?.leveranser || template.leveranser.includes(id)

  // Areal + mål til oppsummeringskortet. Templatet rapporterer brukervendte
  // verdier via BOM; `bounds` (kamera-geometri) er kun fallback.
  const dims = template ? template.bounds(cfg) : { x: 0, y: 0, z: 0 }
  const arealTekst = `${(bom?.arealM2 ?? dims.x * dims.z).toFixed(1).replace('.', ',')} m²`
  const maalTekst = bom?.maal ?? `${Math.round(dims.x * 100)} × ${Math.round(dims.z * 100)} × ${Math.round(dims.y * 100)} cm`

  // Innlogging kreves for å bruke designverktøyet.
  if (authLoading) {
    return <AuthGate><AuthCard><Icon name="faSpinner" spin /></AuthCard></AuthGate>
  }
  if (!isAuthenticated) {
    return (
      <AuthGate>
        <AuthClose onClick={() => navigate('/designverktoy')} aria-label="Lukk"><Icon name="faXmark" /></AuthClose>
        <AuthCard>
          <img src="/images/branding/logo_icon_white.webp" alt="Minio" />
          <h2>Logg inn for å designe</h2>
          <p>Designverktøyet er gratis å bruke – logg inn så lagrer vi designet ditt og du kan bestille byggeplan.</p>
          <AuthBtn onClick={() => login()}>
            <Icon name="faGoogle" /> Logg inn med Google
          </AuthBtn>
        </AuthCard>
      </AuthGate>
    )
  }

  // Ugyldig / manglende produkt-id: send til landingssiden (med standard header).
  if (!template) return <Navigate to="/designverktoy" replace />

  return (
    <Shell>
      <TopBar>
        <AllBtn onClick={() => navigate('/designverktoy')} title="Alle produkter">
          <Icon name="faBars" /> <span>Alle</span>
        </AllBtn>
        <Switcher>
          {TEMPLATES.map((t) => (
            <Pill
              key={t.id}
              $active={t.id === template.id}
              onClick={() => t.id !== template.id && chooseProduct(t.id)}
            >
              {t.navn}
            </Pill>
          ))}
          {KOMMER_SNART.map((k) => (
            <Pill key={k.id} as="div" $soon title={`${k.navn} – kommer snart`}>
              {k.navn} <Soon>snart</Soon>
            </Pill>
          ))}
        </Switcher>
        <CloseBtn onClick={() => navigate('/designverktoy')} aria-label="Lukk designverktøy">
          <Icon name="faXmark" />
        </CloseBtn>
      </TopBar>

      <Body>
        {bom && (
          <SummaryRail>
            <RailHead>
              <RailHeadTop>
                <SumTitle>Ditt design</SumTitle>
                <FileBarBtn onClick={() => setShowMine(true)} title="Mine design">
                  <Icon name="faFolderOpen" />
                </FileBarBtn>
              </RailHeadTop>
              <RailNameRow>
                {editingName ? (
                  <NameEdit
                    autoFocus
                    maxLength={40}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={commitName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitName()
                      if (e.key === 'Escape') setEditingName(false)
                    }}
                  />
                ) : (
                  <FileNameBtn onClick={beginNaming} title="Klikk for å gi nytt navn">
                    {currentDesign ? currentDesign.navn : 'Uten navn'}
                  </FileNameBtn>
                )}
                <SaveState
                  onClick={handleSave}
                  $dirty={dirty || busy}
                  title={busy ? 'Lagrer…' : dirty ? 'Lagre' : 'Alt lagret'}
                  aria-label="Lagre"
                >
                  <Icon name={busy ? 'faSpinner' : dirty ? 'faSave' : 'faCheckCircle'} spin={busy} />
                </SaveState>
              </RailNameRow>
            </RailHead>

            <RailScroll>
              <FactRow>
                <Fact><em>Areal</em><b>{arealTekst}</b></Fact>
                <Fact><em>Mål</em><b>{maalTekst}</b></Fact>
              </FactRow>

              <MatCost>
                <span>Veiledende materialkostnad</span>
                <b>{formatKr(bom.estimatKr)}</b>
              </MatCost>

              <OptTitle>Hva vil du gjøre?</OptTitle>
              <OptList>
                <OptRow
                  $disabled={!kanLeveranse('ferdig')}
                  disabled={!kanLeveranse('ferdig')}
                  onClick={() => kanLeveranse('ferdig') && setForesporsel('ferdig')}
                >
                  <OptIco><Icon name="faHammer" /></OptIco>
                  <OptText><b>Forespør om bygging</b><em>Vi bygger og leverer</em></OptText>
                  {kanLeveranse('ferdig')
                    ? (<><OptPrice><span>fra</span>{formatKr(prisFerdig)}</OptPrice><OptArrow><Icon name="faChevronRight" /></OptArrow></>)
                    : (<OptNa>Ikke tilgjengelig</OptNa>)}
                </OptRow>
                <OptRow
                  $disabled={!kanLeveranse('materialpakke')}
                  disabled={!kanLeveranse('materialpakke')}
                  onClick={() => kanLeveranse('materialpakke') && setForesporsel('materialpakke')}
                >
                  <OptIco><Icon name="faBoxOpen" /></OptIco>
                  <OptText><b>Forespør materialpakke</b><em>Vi kapper, du bygger selv</em></OptText>
                  {kanLeveranse('materialpakke')
                    ? (<><OptPrice><span>fra</span>{formatKr(prisPakke)}</OptPrice><OptArrow><Icon name="faChevronRight" /></OptArrow></>)
                    : (<OptNa>Ikke tilgjengelig</OptNa>)}
                </OptRow>
                {gratis ? (
                  <OptRow $highlight onClick={() => exportPlan('pdf')}>
                    <OptBadge>Gratis</OptBadge>
                    <OptIco $highlight><Icon name="faFilePdf" /></OptIco>
                    <OptText><b>Byggeplan (PDF)</b><em>Materialliste + tegninger</em></OptText>
                    <OptPrice>Gratis</OptPrice>
                    <OptArrow><Icon name="faChevronRight" /></OptArrow>
                  </OptRow>
                ) : (
                  <OptRow $highlight onClick={() => setShowCode(true)}>
                    <OptBadge>Kjøp</OptBadge>
                    <OptIco $highlight><Icon name="faFilePdf" /></OptIco>
                    <OptText><b>Byggeplan (PDF)</b><em>Materialliste + tegninger</em></OptText>
                    <OptPrice>{formatKr(template.fraPris)}</OptPrice>
                    <OptArrow><Icon name="faChevronRight" /></OptArrow>
                  </OptRow>
                )}
                {template.soknadTegning && (
                  <OptRow onClick={() => exportSoknad('pdf')}>
                    {!har('soknad') && !gratis && <OptBadge>Tillegg</OptBadge>}
                    <OptIco><Icon name="faClipboardList" /></OptIco>
                    <OptText><b>Byggesøknad-hefte (PDF)</b><em>Plan, fasader &amp; snitt + byggeregler</em></OptText>
                    <OptPrice>{gratis || har('soknad') ? 'Låst opp' : formatKr(vippsBelopFor(template.id, 'soknad'))}</OptPrice>
                    <OptArrow><Icon name="faChevronRight" /></OptArrow>
                  </OptRow>
                )}
              </OptList>

              <SumFoot><Icon name="faWandMagicSparkles" /> Design selv – helt gratis</SumFoot>
            </RailScroll>

            <RailFooter>
              <RailExportBtn onClick={() => exportPlan('pdf')} title="Last ned byggeplan som PDF">
                <Icon name={unlocked || gratis ? 'faFilePdf' : 'faLock'} />
                Last ned byggeplan
                <RailExportPrice>{gratis ? 'Gratis' : unlocked ? 'PDF' : formatKr(template.fraPris)}</RailExportPrice>
              </RailExportBtn>
            </RailFooter>
          </SummaryRail>
        )}

        <Stage>
          <DesignerViewport
            template={template}
            config={cfg}
            onConfigChange={patch}
            onDragLabel={setDragLabel}
            shadows={shadows}
            explode={explode}
            showHandles={showHandles}
            lightIntensity={lightIntensity}
            sunAzimuth={sunAzimuth}
            sunElevation={sunElevation}
            fog={fog}
            showGrid={showGrid}
            woodTexture={woodTexture}
            hiddenParts={hiddenParts}
            overrides={overrides}
            paintMode={paintMode}
            onPaint={paintPart}
            onHoverPart={setHoveredPart}
            onSelectPart={setSelectedPart}
            apiRef={viewApi}
            showcase={showcase}
            onInteract={() => setShowcase(false)}
          />

          {is3D && (
            <ViewSettings onPointerLeave={() => setViewSettingsOpen(false)}>
              <NavBtn
                $active={viewSettingsOpen}
                title="Visning"
                aria-label="Visningsinnstillinger"
                aria-expanded={viewSettingsOpen}
                onClick={() => setViewSettingsOpen((o) => !o)}
              >
                <Icon name="faGears" />
              </NavBtn>
              {viewSettingsOpen && (
                <ViewSettingsMenu>
                  <Toggle $on={showHandles} onClick={() => setShowHandles((s) => !s)}>
                    <span>Dra-håndtak<em>Pilene for å endre mål.</em></span>
                    <Track $on={showHandles}><Knob $on={showHandles} /></Track>
                  </Toggle>
                  <Toggle $on={shadows} onClick={() => setShadows((s) => !s)}>
                    <span>Skygge<em>Kontaktskygge under modellen.</em></span>
                    <Track $on={shadows}><Knob $on={shadows} /></Track>
                  </Toggle>
                  <Toggle $on={fog} onClick={() => setFog((s) => !s)}>
                    <span>Dis / tåke<em>Mykner bakgrunnen.</em></span>
                    <Track $on={fog}><Knob $on={fog} /></Track>
                  </Toggle>
                  <Toggle $on={showGrid} onClick={() => setShowGrid((s) => !s)}>
                    <span>Gulvrutenett<em>Diskré rutenett i bakken.</em></span>
                    <Track $on={showGrid}><Knob $on={showGrid} /></Track>
                  </Toggle>
                  <Toggle $on={woodTexture} onClick={() => setWoodTexture((s) => !s)}>
                    <span>Realistisk treverk<em>Viser trestruktur/årer.</em></span>
                    <Track $on={woodTexture}><Knob $on={woodTexture} /></Track>
                  </Toggle>
                  <Slider>
                    <SliderTop><span>Lysstyrke</span><b>{Math.round(lightIntensity * 100)} %</b></SliderTop>
                    <input type="range" min={0.4} max={1.8} step={0.05} value={lightIntensity}
                      onChange={(e) => setLightIntensity(Number(e.target.value))} />
                  </Slider>
                  <Slider>
                    <SliderTop><span>Sol – retning</span><b>{sunAzimuth}°</b></SliderTop>
                    <input type="range" min={0} max={360} step={5} value={sunAzimuth}
                      onChange={(e) => setSunAzimuth(Number(e.target.value))} />
                  </Slider>
                  <Slider>
                    <SliderTop><span>Sol – høyde</span><b>{sunElevation}°</b></SliderTop>
                    <input type="range" min={8} max={85} step={1} value={sunElevation}
                      onChange={(e) => setSunElevation(Number(e.target.value))} />
                  </Slider>
                </ViewSettingsMenu>
              )}
            </ViewSettings>
          )}

          <ModeBarWrap>
            <ModeBar>
              {([
                ['assembled', 'Montert'],
                ['explode', 'Splittvisning'],
              ] as ['assembled' | 'explode', string][]).map(([m, label]) => (
                <ModeBtn key={m} $active={viewMode === m} onClick={() => setViewMode(m)} title={label}>
                  {label}
                </ModeBtn>
              ))}
              {(() => {
                const vg = template.alternativer?.find((a) => a.key === 'visning')
                if (!vg || !is3D) return null
                return (
                  <>
                    <ModeDivider />
                    {vg.choices.map((ch) => (
                      <ModeBtn key={ch.id} $active={cfg[vg.key] === ch.id} onClick={() => patch({ [vg.key]: ch.id })} title={ch.label}>
                        {ch.label}
                      </ModeBtn>
                    ))}
                  </>
                )
              })()}
            </ModeBar>
            {is3D && (
              <ModeBar title="Vis eller skjul lag for å se konstruksjonen">
                <ModeBtn $active={!hideKledning} onClick={() => setHideKledning((s) => !s)} title="Vis/skjul kledning">
                  <Icon name={hideKledning ? 'faEyeSlash' : 'faEye'} /> Kledning
                </ModeBtn>
                <ModeBtn $active={!hideTak} onClick={() => setHideTak((s) => !s)} title="Vis/skjul tak">
                  <Icon name={hideTak ? 'faEyeSlash' : 'faEye'} /> Tak
                </ModeBtn>
                <ModeBtn $active={!hideGulv} onClick={() => setHideGulv((s) => !s)} title="Vis/skjul gulv">
                  <Icon name={hideGulv ? 'faEyeSlash' : 'faEye'} /> Gulv
                </ModeBtn>
              </ModeBar>
            )}
            <ModeBar>
              <ModeBtn $active={viewMode === 'parts'} onClick={() => setViewMode('parts')} title="Delevisning">
                Delevisning
              </ModeBtn>
              {template.tegning2D && (
                <ModeBtn $active={viewMode === 'tegning'} onClick={() => setViewMode('tegning')} title="2D-arbeidstegning">
                  2D-tegning
                </ModeBtn>
              )}
            </ModeBar>
          </ModeBarWrap>

          {viewMode === 'explode' && (
            <SplitSlider>
              <Icon name="faUpDownLeftRight" />
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.01}
                value={explodeAmt}
                onChange={(e) => setExplodeAmt(Number(e.target.value))}
                aria-label="Splittavstand"
              />
              <span>{Math.round((explodeAmt / 1.5) * 100)}%</span>
            </SplitSlider>
          )}

          {viewMode === 'parts' && (() => {
            const maxCm = Math.max(...alleDeler.map((x) => x.lengdeCm), 1)
            const pxPerCm = Math.min(7, 720 / maxCm)
            const profilHoyde = (p: string) => {
              const nums = (p.match(/\d+/g) ?? ['48']).map(Number)
              return Math.max(...nums) / 10 // mm → cm (største profilmål)
            }
            return (
              <PartsView>
                <PartsHead>
                  <h3><Icon name="faRulerCombined" /> Delevisning – kappliste (målestokk 1:{Math.round(100 / pxPerCm)})</h3>
                  {!unlocked && <PartsLock onClick={() => setShowCode(true)}><Icon name="faLock" /> Lås opp mål</PartsLock>}
                </PartsHead>
                <PartsList>
                  {alleDeler.map((d, i) => {
                    const nums = (d.profil.match(/\d+/g) ?? ['48', '48']).map(Number)
                    const tykkelse = Math.min(...nums)
                    const bredde = Math.max(...nums)
                    const hPx = Math.max(6, profilHoyde(d.profil) * pxPerCm)
                    const miter = d.navn.toLowerCase().includes('topplist')
                    return (
                      <PartRow key={i}>
                        <PartMeta>
                          <PartMerke>{String.fromCharCode(65 + i)}</PartMerke>
                          <strong>{d.navn}</strong>
                          {miter && <PartTag>45° gjæret</PartTag>}
                          <PartQty>{unlocked ? `× ${d.antall}` : <PartBlur>× ••</PartBlur>}</PartQty>
                        </PartMeta>
                        <PartDrawing>
                          <PartBar
                            style={{
                              width: `${d.lengdeCm * pxPerCm}px`,
                              height: `${hPx}px`,
                              clipPath: miter ? `polygon(0 0, 100% 0, calc(100% - ${hPx}px) 100%, ${hPx}px 100%)` : undefined,
                            }}
                          />
                          <PartLen>{unlocked ? `${d.lengdeCm} cm` : <PartBlur>••• cm</PartBlur>}</PartLen>
                        </PartDrawing>
                        <PartDims>
                          <span><b>Lengde</b> {unlocked ? `${d.lengdeCm} cm` : <PartBlur>••• cm</PartBlur>}</span>
                          <span><b>Bredde</b> {unlocked ? `${bredde} mm` : <PartBlur>••• mm</PartBlur>}</span>
                          <span><b>Tykkelse</b> {unlocked ? `${tykkelse} mm` : <PartBlur>••• mm</PartBlur>}</span>
                        </PartDims>
                      </PartRow>
                    )
                  })}
                </PartsList>
                <PartsExport>
                  <PartsExportBtn onClick={() => exportPlan('pdf')}>
                    <Icon name={unlocked ? 'faDownload' : 'faLock'} /> Last ned PDF
                  </PartsExportBtn>
                  <PartsExportBtn onClick={() => exportPlan('print')}>
                    <Icon name={unlocked ? 'faPrint' : 'faLock'} /> Skriv ut
                  </PartsExportBtn>
                </PartsExport>
              </PartsView>
            )
          })()}

          {viewMode === 'tegning' && tegning && (
            <Tegning2DView
              tegning={tegning}
              unlocked={unlocked}
              produktNavn={template.navn}
              designNavn={currentDesign?.navn}
              onExportPdf={() => exportPlan('pdf')}
              onExportPrint={() => exportPlan('print')}
            />
          )}

          {dragLabel && is3D && (
            <DragChip><Icon name="faUpDownLeftRight" /> {dragLabel}</DragChip>
          )}

          {!dragLabel && hoveredPart && !selectedPart && !paintMode && is3D && (
            <PartChip>
              {hoveredMerke && <b>{hoveredMerke}</b>}
              <span>{hoveredPart.navn}{hoveredPart.profil ? ` (${hoveredPart.profil})` : ''}</span>
              <em>{unlocked ? (hoveredPart.lengdeCm > 0 ? `${hoveredPart.lengdeCm} cm` : hoveredPart.profil) : 'mål låst'}</em>
            </PartChip>
          )}

          {selectedPart && is3D && (
            <SelectCard>
              {selectedMerke && <b>{selectedMerke}</b>}
              <div>
                <strong>{selectedPart.navn}{selectedPart.profil ? ` (${selectedPart.profil})` : ''}</strong>
                <em>{unlocked ? (selectedPart.lengdeCm > 0 ? `${selectedPart.lengdeCm} cm` : selectedPart.profil) : 'Mål låst – lås opp byggeplan'}</em>
              </div>
              <SelClose onClick={() => viewApi.current?.deselect()} aria-label="Lukk"><Icon name="faXmark" /></SelClose>
            </SelectCard>
          )}

          {/* Penselpalett – vises over verktøylinja når man maler */}
          {paintMode && is3D && (
            <BrushBar>
              <BrushTitle><Icon name="faPalette" /> Klikk på en del for å male</BrushTitle>
              {template.materialer.map((m) => (
                <BrushGroup key={m.key}>
                  <label>{m.label}</label>
                  {m.asSwatches ? (
                    <BrushSwatches>
                      {m.choices.map((c) => {
                        const swatch = c.swatch ?? `#${c.hex.toString(16).padStart(6, '0')}`
                        return (
                          <BrushSwatch
                            key={c.id}
                            $active={brush[m.key] === c.id}
                            $transparent={swatch === 'transparent'}
                            style={swatch === 'transparent' ? undefined : { background: swatch }}
                            onClick={() => setBrush((bb) => ({ ...bb, [m.key]: c.id }))}
                            title={c.label}
                          />
                        )
                      })}
                    </BrushSwatches>
                  ) : (
                    <BrushSelect value={String(brush[m.key])} onChange={(e) => setBrush((bb) => ({ ...bb, [m.key]: e.target.value }))}>
                      {m.choices.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </BrushSelect>
                  )}
                </BrushGroup>
              ))}
            </BrushBar>
          )}

          {/* Kamera-navigasjon uten mus: roter, zoom og bytt synsvinkel med knapper */}
          {is3D && (
            <NavRail onPointerLeave={() => setViewMenuOpen(false)}>
              <NavRelative>
                <NavBtn
                  $active={viewMenuOpen}
                  title="Bytt synsvinkel"
                  aria-label="Bytt synsvinkel"
                  aria-expanded={viewMenuOpen}
                  onClick={() => setViewMenuOpen((o) => !o)}
                >
                  <Icon name="faCube" />
                </NavBtn>
                {viewMenuOpen && (
                  <ViewMenu>
                    {VIEW_PRESETS.map((v) => (
                      <ViewMenuItem
                        key={v.id}
                        onClick={() => { nav(() => viewApi.current?.setView(v.id)); setViewMenuOpen(false) }}
                      >
                        <Icon name={v.ikon} /> {v.navn}
                      </ViewMenuItem>
                    ))}
                  </ViewMenu>
                )}
              </NavRelative>

              <NavGroup>
                <HoldBtn action={() => nav(() => viewApi.current?.orbit(0, -ORBIT_STEP))} title="Vipp opp" icon="faChevronUp" />
                <NavPadMid>
                  <HoldBtn action={() => nav(() => viewApi.current?.orbit(ORBIT_STEP, 0))} title="Roter venstre" icon="faArrowLeft" />
                  <NavBtn onClick={() => nav(() => viewApi.current?.setView('iso'))} title="Nullstill vinkel" aria-label="Nullstill vinkel"><Icon name="faHome" /></NavBtn>
                  <HoldBtn action={() => nav(() => viewApi.current?.orbit(-ORBIT_STEP, 0))} title="Roter høyre" icon="faArrowRight" />
                </NavPadMid>
                <HoldBtn action={() => nav(() => viewApi.current?.orbit(0, ORBIT_STEP))} title="Vipp ned" icon="faChevronDown" />
              </NavGroup>

              <NavGroup>
                <HoldBtn action={() => nav(() => viewApi.current?.zoom(ZOOM_IN))} title="Zoom inn" icon="faPlus" />
                <HoldBtn action={() => nav(() => viewApi.current?.zoom(ZOOM_OUT))} title="Zoom ut" icon="faMinus" />
              </NavGroup>
            </NavRail>
          )}

          {/* Samlet verktøylinje under modellen */}
          {is3D && (
            <Toolbar>
              <ToolBtn $active={paintMode} onClick={() => setPaintMode((s) => !s)} title="Mal materiale på deler">
                <Icon name={paintMode ? 'faCheck' : 'faPalette'} /> {paintMode ? 'Ferdig' : 'Mal'}
              </ToolBtn>
              <ToolDivider />
              <ToolIcon $active={showcase} onClick={() => setShowcase((v) => !v)} title={showcase ? 'Stopp visning' : 'Vis frem (roter)'}><Icon name={showcase ? 'faPause' : 'faPlay'} /></ToolIcon>
              <ToolDivider />
              <ToolBtn $primary onClick={() => exportPlan('pdf')} title="Last ned byggeplan som PDF">
                <Icon name={unlocked ? 'faDownload' : 'faLock'} /> PDF
              </ToolBtn>
              <ToolIcon onClick={() => exportPlan('print')} title="Skriv ut byggeplan"><Icon name="faPrint" /></ToolIcon>
            </Toolbar>
          )}

          <PanelToggle
            onClick={() => setConfigOpen((o) => !o)}
            title={configOpen ? 'Skjul innstillinger' : 'Vis innstillinger'}
            aria-label={configOpen ? 'Skjul innstillinger' : 'Vis innstillinger'}
          >
            <Icon name={configOpen ? 'faChevronRight' : 'faChevronLeft'} />
            <ToggleLabel>{configOpen ? 'Skjul valg' : 'Vis valg'}</ToggleLabel>
          </PanelToggle>
        </Stage>

        <Panel $open={configOpen}>
          <PanelScroll $open={configOpen}>
            {template.former && (
              <Section id="form" title="Form" open={openSection === 'form'} onToggle={toggleSection}>
                <ShapeGrid>
                  {template.former.choices.map((s) => (
                    <ShapeBtn
                      key={s.id}
                      $active={cfg[template.former!.key] === s.id}
                      onClick={() => patch({ [template.former!.key]: s.id })}
                    >
                      <ShapeIcon shape={s.ikon ?? s.id} />
                      <span>{s.label}</span>
                    </ShapeBtn>
                  ))}
                </ShapeGrid>
              </Section>
            )}

            {template.presets && template.presets.length > 0 && (
              <Section id="preset" title="Ferdige oppsett" open={openSection === 'preset'} onToggle={toggleSection}>
                <PresetGrid>
                  {template.presets.map((pr) => {
                    const aktiv = Object.entries(pr.config).every(([k, v]) => cfg[k] === v)
                    return (
                      <PresetBtn key={pr.id} $active={aktiv} onClick={() => patch(pr.config)}>
                        <strong>{pr.navn}</strong>
                        {pr.beskrivelse && <span>{pr.beskrivelse}</span>}
                      </PresetBtn>
                    )
                  })}
                </PresetGrid>
              </Section>
            )}

            <Section id="mal" title="Mål og konstruksjon" open={openSection === 'mal'} onToggle={toggleSection}>
              {template.dimensjoner
                .filter((d) => !d.visibleWhen || d.visibleWhen(cfg))
                .map((d) => {
                  const val = Number(cfg[d.key])
                  return (
                    <Slider key={d.key}>
                      <SliderTop>
                        <span>{d.label}</span>
                        <b>{val} {d.unit ?? 'cm'}</b>
                      </SliderTop>
                      <input
                        type="range"
                        min={d.min}
                        max={d.max}
                        step={d.step}
                        value={val}
                        onChange={(e) => patch({ [d.key]: Number(e.target.value) })}
                      />
                      {d.markers && d.markers.length > 0 && (
                        <MarkerRow>
                          {d.markers.map((mk) => (
                            <MarkerChip key={mk} type="button" $active={val === mk} onClick={() => patch({ [d.key]: mk })}>
                              {mk}{d.unit ?? 'cm'}
                            </MarkerChip>
                          ))}
                        </MarkerRow>
                      )}
                    </Slider>
                  )
                })}
              {template.alternativer && template.alternativer.length > 0 &&
                template.alternativer
                  .filter((a) => a.key !== 'visning')
                  .filter((a) => !a.visibleWhen || a.visibleWhen(cfg))
                  .map((a) => (
                    <SubGroup key={a.key}>
                      <SubLabel>{a.label}</SubLabel>
                      <SegRow>
                        {a.choices.map((c) => (
                          <SegBtn key={c.id} $active={cfg[a.key] === c.id} onClick={() => patch({ [a.key]: c.id, ...(c.patch ?? {}) })}>
                            {c.label}
                          </SegBtn>
                        ))}
                      </SegRow>
                    </SubGroup>
                  ))}
              {template.valg && template.valg.length > 0 &&
                template.valg.map((t) => (
                  <Toggle key={t.key} $on={Boolean(cfg[t.key])} onClick={() => patch({ [t.key]: !cfg[t.key] })}>
                    <span>
                      {t.label}
                      {t.note && <em>{t.note}</em>}
                    </span>
                    <Track $on={Boolean(cfg[t.key])}><Knob $on={Boolean(cfg[t.key])} /></Track>
                  </Toggle>
                ))}
            </Section>

            <Section id="materialer" title="Materialer" open={openSection === 'materialer'} onToggle={toggleSection}>
              {template.materialer.map((m) => (
                <SubGroup key={m.key}>
                  <SubLabel>{m.label}</SubLabel>
                  {m.asSwatches ? (
                    <>
                      <Swatches>
                        {m.choices.map((c) => {
                          const active = cfg[m.key] === c.id
                          const swatch = c.swatch ?? `#${c.hex.toString(16).padStart(6, '0')}`
                          return (
                            <SwatchBtn
                              key={c.id}
                              $active={active}
                              $transparent={swatch === 'transparent'}
                              style={swatch === 'transparent' ? undefined : { background: swatch }}
                              onClick={() => patch({ [m.key]: c.id })}
                              title={c.label}
                              aria-label={c.label}
                            >
                              {active && <Icon name="faCheck" />}
                            </SwatchBtn>
                          )
                        })}
                      </Swatches>
                      {cfg[m.key] && <SwatchName>{FARGER[String(cfg[m.key])]?.label ?? ''}</SwatchName>}
                    </>
                  ) : (
                    <Choices>
                      {m.choices.map((c) => (
                        <ChoiceBtn key={c.id} $active={cfg[m.key] === c.id} onClick={() => patch({ [m.key]: c.id })}>
                          <span>{c.label}</span>
                          {c.note && <em>{c.note}</em>}
                        </ChoiceBtn>
                      ))}
                    </Choices>
                  )}
                </SubGroup>
              ))}
            </Section>

            {template.byggeregler && (() => {
              const b = template.byggeregler(cfg)
              return (
                <Section id="byggeregler" title="Byggeregler" open={openSection === 'byggeregler'} onToggle={toggleSection}>
                  <ByggStatus $ok={b.sokfri}>
                    <Icon name={b.sokfri ? 'faCheckCircle' : 'faExclamationTriangle'} /> {b.tittel}
                  </ByggStatus>
                  <ByggList>
                    {b.punkter.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ByggList>
                  {template.soknadTegning && (
                    <SoknadNote>
                      Trenger du å søke? Last ned <b>byggesøknad-heftet</b> (plan, fasader &amp; snitt + situasjonsplan-veiledning) under «Hva vil du gjøre?» øverst. Veiledende – du er selv ansvarlig søker.
                    </SoknadNote>
                  )}
                </Section>
              )
            })()}

            <Section id="priser" title="Priser" open={openSection === 'priser'} onToggle={toggleSection}>
              <PriceNote>Veiledende ca-priser (impregnert). Juster hvis butikken din har andre priser – alle mål og kostnader oppdateres.</PriceNote>
              {alleprisposter().map((p) => (
                <PriceRow key={p.id}>
                  <span>{p.navn}</span>
                  <PriceInput
                    type="number"
                    min={0}
                    step={0.5}
                    defaultValue={p.pris}
                    onChange={(e) => endrePris(p.id, Number(e.target.value))}
                  />
                  <em>kr/{p.enhet}</em>
                </PriceRow>
              ))}
            </Section>
          </PanelScroll>
        </Panel>
      </Body>

      {showCode && (
        <CodeModal
          error={codeErr}
          belop={template.fraPris}
          onSubmit={verifyCode}
          onVipps={startVipps}
          onClose={() => { setShowCode(false); setCodeErr(false); pendingRef.current = null }}
        />
      )}

      {unlockedModal && (
        <SmallOverlay onClick={closeUnlocked}>
          <SmallBox onClick={(e) => e.stopPropagation()}>
            <SmallClose onClick={closeUnlocked} aria-label="Lukk"><Icon name="faXmark" /></SmallClose>
            <UnlockBadge><Icon name="faCheckCircle" /></UnlockBadge>
            <h3>Låst opp!</h3>
            <p>Byggeplanen din er klar. Materialliste, mål, kappliste og nedlasting er nå åpne for dette designet.</p>
            {pendingRef.current ? (
              <SoknadBtn onClick={runPending}><Icon name="faDownload" /> Last ned nå</SoknadBtn>
            ) : (
              <SoknadBtn onClick={() => { setUnlockedModal(false); void runExport('pdf') }}>
                <Icon name="faDownload" /> Last ned byggeplan (PDF)
              </SoknadBtn>
            )}
            <SoknadNote>PDF-en genereres i nettleseren og lastes ned automatisk – det kan ta noen sekunder.</SoknadNote>
          </SmallBox>
        </SmallOverlay>
      )}

      {renameId && (
        <SmallOverlay onClick={() => setRenameId(null)}>
          <SmallBox onClick={(e) => e.stopPropagation()}>
            <SmallClose onClick={() => setRenameId(null)} aria-label="Lukk"><Icon name="faXmark" /></SmallClose>
            <h3>Gi nytt navn</h3>
            <p>Endre navnet på designet ditt.</p>
            <NameInput
              value={renameName}
              autoFocus
              maxLength={40}
              placeholder="Navn på design"
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doRename() }}
            />
            <SmallActions>
              <GhostBtn onClick={() => setRenameId(null)}>Avbryt</GhostBtn>
              <PrimaryBtn onClick={doRename} disabled={busy}>{busy ? <Icon name="faSpinner" spin /> : 'Lagre navn'}</PrimaryBtn>
            </SmallActions>
          </SmallBox>
        </SmallOverlay>
      )}

      {showMine && (
        <SmallOverlay onClick={() => setShowMine(false)}>
          <MineBox onClick={(e) => e.stopPropagation()}>
            <SmallClose onClick={() => setShowMine(false)} aria-label="Lukk"><Icon name="faXmark" /></SmallClose>
            <h3>Mine {template.navn.toLowerCase()}-design</h3>
            <p>{savedList.length} av {MAKS_DESIGN_PER_TYPE} lagret</p>
            <MineList>
              {listLoading && <Empty><Icon name="faSpinner" spin /> Laster …</Empty>}
              {!listLoading && savedList.length === 0 && <Empty>Ingen lagrede design ennå.</Empty>}
              {!listLoading && savedList.map((d) => (
                <MineRow key={d.id} $active={d.id === currentDesignId}>
                  <button className="open" onClick={() => openDesign(d)}>
                    <strong>{d.navn}</strong>
                    <span>{d.betalt ? 'Byggeplan låst opp' : 'Design – ikke betalt'}</span>
                  </button>
                  {d.betalt && <PaidBadge>Betalt</PaidBadge>}
                  <button className="ren" onClick={() => startRename(d.id, d.navn)} title="Gi nytt navn"><Icon name="faPencilRuler" /></button>
                  <button className="del" onClick={() => removeDesign(d.id)} title="Slett"><Icon name="faTrash" /></button>
                </MineRow>
              ))}
            </MineList>
            <SmallActions>
              <PrimaryBtn onClick={nyttDesign}><Icon name="faPlus" /> Nytt design</PrimaryBtn>
            </SmallActions>
          </MineBox>
        </SmallOverlay>
      )}

      {foresporsel && bom && (
        <ForesporselModal
          type={foresporsel}
          produktId={template.id}
          produktNavn={template.navn}
          designNavn={currentDesign?.navn ?? template.navn}
          sammendrag={bom.sammendrag}
          maal={maalTekst}
          arealTekst={arealTekst}
          estimatKr={bom.estimatKr}
          prisEstimatKr={foresporsel === 'ferdig' ? prisFerdig : prisPakke}
          userId={uid ?? ''}
          userEmail={firebaseUser?.email ?? ''}
          onClose={() => setForesporsel(null)}
        />
      )}

      {toast && <Toast>{toast}</Toast>}
    </Shell>
  )
}

/* ---------- styling: mørkt skall, lys scene ---------- */

const RailHeadTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
`

const FileBarBtn = styled.button`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #4a4842;
  font-size: 0.9rem;
  cursor: pointer;
  &:hover { background: rgba(0, 0, 0, 0.06); }
`

const RailNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`

const NameEdit = styled.input`
  flex: 1;
  min-width: 0;
  height: 38px;
  border: 1px solid #7bc39c;
  border-radius: 8px;
  background: #fff;
  color: #26251f;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0 0.6rem;
  outline: none;
`

const FileNameBtn = styled.button`
  flex: 1;
  min-width: 0;
  height: 38px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  color: #26251f;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  padding: 0 0.6rem;
  border-radius: 8px;
  &:hover { border-color: #7bc39c; }
`

const SaveState = styled.button<{ $dirty: boolean }>`
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ $dirty }) => ($dirty ? 'transparent' : 'rgba(0,0,0,0.12)')};
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: ${({ $dirty }) => ($dirty ? 'pointer' : 'default')};
  background: ${({ $dirty }) => ($dirty ? '#1c1e22' : 'transparent')};
  color: ${({ $dirty }) => ($dirty ? '#fff' : '#5a8f5a')};
  &:hover { ${({ $dirty }) => ($dirty ? 'background:#000;' : '')} }
`

const SmallOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2200;
  background: rgba(10, 11, 14, 0.6);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 1.5rem;
`

const SmallBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 1.75rem;
  background: #1b1e24;
  color: #e9e7e1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);

  h3 { margin: 0 0 0.4rem; font-size: 1.1rem; font-weight: 700; color: #fff; }
  p { margin: 0 0 1.1rem; font-size: 0.85rem; color: #a8a49b; line-height: 1.5; }
`

const MineBox = styled(SmallBox)`
  max-width: 440px;
`

const SmallClose = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 8px;
  color: #cfccc4;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
`

const NameInput = styled.input`
  width: 100%;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #fff;
  font-size: 0.95rem;
  outline: none;
  &:focus { border-color: #7bc39c; }
`


const SmallActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.25rem;
`

const GhostBtn = styled.button`
  padding: 0.6rem 1rem;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: none;
  color: #d6d3cb;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.06); }
`

const PrimaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1.1rem;
  border-radius: 9px;
  border: none;
  background: #f4f2ec;
  color: #16181d;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  &:hover { background: #fff; }
  &:disabled { opacity: 0.6; cursor: default; }
`

const MineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 46vh;
  overflow-y: auto;
`

const Empty = styled.div`
  padding: 1.5rem;
  text-align: center;
  font-size: 0.88rem;
  color: #8b877e;
`

const MineRow = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 10px;
  border: 1px solid ${({ $active }) => ($active ? '#7bc39c' : 'rgba(255,255,255,0.1)')};
  background: rgba(255, 255, 255, 0.03);
  padding: 0.2rem 0.5rem 0.2rem 0.2rem;

  .open {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
    background: none;
    border: none;
    color: #e9e7e1;
    text-align: left;
    cursor: pointer;
    padding: 0.6rem 0.7rem;
    border-radius: 8px;
    &:hover { background: rgba(255, 255, 255, 0.05); }
    strong { font-size: 0.92rem; }
    span { font-size: 0.75rem; color: #8b877e; }
  }
  .ren, .del {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: none;
    background: none;
    color: #8b877e;
    border-radius: 8px;
    cursor: pointer;
  }
  .ren:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }
  .del:hover { color: #e0928a; background: rgba(255, 255, 255, 0.05); }
`

const PaidBadge = styled.span`
  flex-shrink: 0;
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #7bc39c;
  background: rgba(123, 195, 156, 0.14);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
`

const Toast = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2300;
  background: #1c1e22;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 0.7rem 1.2rem;
  border-radius: 999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
`

const CodeDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 1.25rem 0 0.9rem;
  color: #6f6b63;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  &::before, &::after { content: ''; flex: 1; height: 1px; background: rgba(255, 255, 255, 0.1); }
`

const VippsBtn = styled.button`
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 11px;
  background: #ff5b24;
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #ff6f3d; }
`

const CodeHint = styled.p`
  margin: 0.7rem 0 0 !important;
  font-size: 0.74rem;
  color: #8b877e !important;
`

const AuthGate = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(90, 120, 90, 0.16), transparent 55%),
    #16181d;
  color: #e9e7e1;
`

const AuthClose = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 10px;
  color: #cfccc4;
  font-size: 1.1rem;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
`

const AuthCard = styled.div`
  width: 100%;
  max-width: 380px;
  text-align: center;

  img { height: 56px; margin-bottom: 1.5rem; }
  h2 { margin: 0 0 0.6rem; font-size: 1.5rem; font-weight: 800; }
  p { margin: 0 0 1.75rem; font-size: 0.95rem; color: #a8a49b; line-height: 1.6; }
  svg { font-size: 1.4rem; color: #7bc39c; }
`

const AuthBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.5rem;
  border: none;
  border-radius: 12px;
  background: #f4f2ec;
  color: #16181d;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #fff; }
  svg { font-size: 1rem; color: #16181d; }
`

const Shell = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  background: #16181d;
  color: #e9e7e1;
  font-family: ${({ theme }) => theme.fonts?.body ?? 'system-ui, sans-serif'};
`

const TopBar = styled.header`
  height: 56px;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(20, 22, 27, 0.9);
`

const AllBtn = styled.button`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #b9b6ae;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #fff; background: rgba(255,255,255,0.06); }

  @media (max-width: 640px) { span { display: none; } }
`

const Switcher = styled.nav`
  display: flex;
  align-items: stretch;
  justify-self: start;
  height: 34px;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`

const Pill = styled.button<{ $active?: boolean; $soon?: boolean }>`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0 0.85rem;
  border: none;
  border-radius: 0;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: ${({ $active, $soon }) => ($active || $soon ? 'default' : 'pointer')};
  background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.13)' : 'transparent')};
  color: ${({ $active, $soon }) => ($active ? '#fff' : $soon ? '#6f6b63' : '#c8c5bd')};
  transition: background 0.15s, color 0.15s;

  & + & { border-left: 1px solid rgba(255, 255, 255, 0.1); }
  &:hover { ${({ $active, $soon }) => (!$active && !$soon ? 'background: rgba(255,255,255,0.06); color: #fff;' : '')} }
`

const Soon = styled.span`
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6f6b63;
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 999px;
  padding: 0.05rem 0.35rem;
`

const CloseBtn = styled.button`
  justify-self: end;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.05);
  border: none;
  border-radius: 8px;
  color: #cfccc4;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  &:hover { background: rgba(255,255,255,0.12); color: #fff; }
`

const Body = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 820px) {
    flex-direction: column;
    overflow: visible;
  }
`

const Stage = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  background:
    radial-gradient(120% 120% at 50% 20%, #f7f5ef 0%, #e9e5db 55%, #d9d4c7 100%);

  @media (max-width: 820px) {
    order: 1;
    min-height: 44vh;
  }
`

const Toolbar = styled.div`
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.45rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.14);
`

// Vertikal glass-navigasjonsstripe på høyre kant: bytt vinkel, roter og zoom
// med knapper – for berøring og andre enheter uten mus/dra.
const NavRail = styled.div`
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.28rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.14);
  z-index: 5;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    right: 10px;
    bottom: 10px;
  }
`

const NavRelative = styled.div`
  position: relative;
  display: flex;
`

const NavGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding-top: 0.28rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);

  &:first-of-type { padding-top: 0; border-top: none; }
`

const NavPadMid = styled.div`
  display: flex;
  align-items: center;
  gap: 0.1rem;
`

const NavBtn = styled.button<{ $active?: boolean }>`
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#1c1e22' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : '#33322e')};
  font-size: 0.8rem;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, color 0.15s;

  &:hover { ${({ $active }) => (!$active ? 'background: rgba(0,0,0,0.06);' : '')} }
  &:active { background: ${({ $active }) => ($active ? '#000' : 'rgba(0,0,0,0.12)')}; }
`

const ViewMenu = styled.div`
  position: absolute;
  right: calc(100% + 10px);
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.3rem;
  min-width: 150px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
`

const ViewMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.65rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #33322e;
  font-size: 0.86rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;

  svg { width: 15px; color: #7a776e; }
  &:hover { background: rgba(0, 0, 0, 0.06); }
`

const ToolIcon = styled.button<{ $active?: boolean }>`
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#1c1e22' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : '#33322e')};
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  &:hover { ${({ $active }) => (!$active ? 'background: rgba(0,0,0,0.06);' : '')} }
`

const ToolBtn = styled.button<{ $active?: boolean; $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  height: 36px;
  padding: 0 0.9rem;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  background: ${({ $active, $primary }) => ($primary ? '#1c1e22' : $active ? '#1c1e22' : 'transparent')};
  color: ${({ $active, $primary }) => ($primary || $active ? '#fff' : '#33322e')};
  &:hover { ${({ $primary, $active }) => ($primary ? 'background:#000;' : $active ? '' : 'background: rgba(0,0,0,0.06);')} }
`

const ToolDivider = styled.span`
  width: 1px;
  height: 22px;
  background: rgba(0, 0, 0, 0.12);
  margin: 0 0.2rem;
`

const CodeOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2200;
  background: rgba(10, 11, 14, 0.62);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 1.5rem;
`

const CodeBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 2rem 1.75rem 1.75rem;
  background: #1b1e24;
  color: #e9e7e1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  text-align: center;

  h3 { margin: 0 0 0.4rem; font-size: 1.15rem; font-weight: 700; color: #fff; }
  p { margin: 0 0 1.25rem; font-size: 0.85rem; color: #a8a49b; line-height: 1.5; }
`

const CodeClose = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 8px;
  color: #cfccc4;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
`

const CodeIcon = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  color: #7bc39c;
  font-size: 1.2rem;
`

const CodeDigits = styled.div<{ $err: boolean }>`
  display: flex;
  justify-content: center;
  gap: 0.5rem;

  input {
    width: 44px;
    height: 54px;
    text-align: center;
    font-size: 1.4rem;
    font-weight: 700;
    color: #fff;
    background: rgba(255, 255, 255, 0.04);
    border: 1.5px solid ${({ $err }) => ($err ? '#c96a5f' : 'rgba(255,255,255,0.16)')};
    border-radius: 10px;
    outline: none;
    transition: border-color 0.15s;
    &:focus { border-color: #7bc39c; background: rgba(255,255,255,0.07); }
  }

  @media (max-width: 400px) { input { width: 38px; height: 48px; } }
`

const ModeBarWrap = styled.div`
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  gap: 10px;
`

const ModeBar = styled.div`
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 3px;
  gap: 2px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 999px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
`

const ModeDivider = styled.div`
  width: 1px;
  align-self: stretch;
  margin: 8px 2px;
  background: rgba(0, 0, 0, 0.12);
`

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
`

const PresetBtn = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.22rem;
  padding: 0.72rem 0.85rem;
  border-radius: 12px;
  border: 1px solid ${(p) => (p.$active ? 'rgba(90,150,255,0.9)' : 'rgba(255,255,255,0.09)')};
  background: ${(p) =>
    p.$active
      ? 'linear-gradient(180deg, rgba(58,110,220,0.28), rgba(58,110,220,0.14))'
      : 'rgba(255,255,255,0.045)'};
  box-shadow: ${(p) => (p.$active ? '0 3px 14px rgba(47,110,230,0.28)' : 'none')};
  cursor: pointer;
  text-align: left;
  transition: transform 0.12s ease, border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  strong {
    font-size: 0.84rem;
    font-weight: 600;
    line-height: 1.15;
    color: ${(p) => (p.$active ? '#dbe8ff' : 'rgba(255,255,255,0.92)')};
  }
  span {
    font-size: 0.72rem;
    line-height: 1.25;
    color: ${(p) => (p.$active ? 'rgba(200,220,255,0.78)' : 'rgba(255,255,255,0.5)')};
  }
  &::after {
    content: ${(p) => (p.$active ? "'✓'" : "''")};
    position: absolute;
    top: 8px;
    right: 10px;
    font-size: 11px;
    font-weight: 800;
    color: #7db0ff;
  }
  &:hover {
    border-color: rgba(120,170,255,0.7);
    background: ${(p) =>
      p.$active
        ? 'linear-gradient(180deg, rgba(58,110,220,0.32), rgba(58,110,220,0.18))'
        : 'rgba(255,255,255,0.08)'};
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
`

const SplitSlider = styled.div`
  position: absolute;
  top: 66px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  color: #2b2d31;
  svg { font-size: 13px; opacity: 0.7; }
  input[type='range'] { width: 190px; accent-color: #2f7bf6; cursor: pointer; }
  span { font-size: 12px; font-variant-numeric: tabular-nums; min-width: 34px; text-align: right; opacity: 0.75; }
`

const ModeBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 0.8rem;
  border: none;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#1c1e22' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : '#4a4842')};
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  &:hover { ${({ $active }) => (!$active ? 'background: rgba(0,0,0,0.06);' : '')} }
`

const BrushBar = styled.div`
  position: absolute;
  bottom: 74px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: calc(100% - 2rem);
  flex-wrap: wrap;
  justify-content: center;
  background: rgba(28, 30, 34, 0.94);
  color: #fff;
  padding: 0.55rem 1rem;
  border-radius: 12px;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
`

const BrushTitle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  svg { color: #7bc39c; }
`

const BrushGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  label { font-size: 0.72rem; color: #a8a49b; text-transform: uppercase; letter-spacing: 0.04em; }
`

const BrushSwatches = styled.div`
  display: inline-flex;
  gap: 0.35rem;
`

const BrushSwatch = styled.button<{ $active: boolean; $transparent: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,0.25)')};
  box-shadow: ${({ $active }) => ($active ? '0 0 0 2px #7bc39c' : 'none')};
  ${({ $transparent }) =>
    $transparent && 'background: repeating-conic-gradient(#cfccc4 0% 25%, #8b877e 0% 50%) 50% / 8px 8px;'}
  transition: transform 0.1s;
  &:hover { transform: scale(1.12); }
`

const BrushSelect = styled.select`
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: #26292f;
  color: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  outline: none;
`


/* ---- 2D delevisning ---- */

const PartsView = styled.div`
  position: absolute;
  inset: 0;
  background: #f4f2ec;
  overflow-y: auto;
  padding: 4.5rem 2rem 2rem;
`

const PartsHead = styled.div`
  max-width: 900px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 { margin: 0; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; font-weight: 700; color: #26251f; }
  h3 svg { color: #6f6b63; }
`

const PartsLock = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: none;
  background: #1c1e22;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #33322e; }
`

const PartsList = styled.div`
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
`

const PartsExport = styled.div`
  max-width: 860px;
  margin: 1.5rem auto 0;
  display: flex;
  gap: 0.6rem;
`

const PartsExportBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.7rem 1.2rem;
  border: none;
  border-radius: 10px;
  background: #1c1e22;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #33322e; }
`

const PartRow = styled.div`
  border-bottom: 1px dashed #d8d3c8;
  padding-bottom: 1rem;
`

const PartMeta = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.5rem;
  strong { font-size: 0.9rem; color: #26251f; }
  em { font-style: normal; font-size: 0.8rem; color: #6f6b63; }
`

const PartTag = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  color: #7a5a2e;
  background: #f0e4cf;
  border: 1px solid #e0cca6;
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
`

const PartQty = styled.span`
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 700;
  color: #26251f;
`

const PartDrawing = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
`

const PartBar = styled.div`
  background: linear-gradient(180deg, #c69a63, #a9834f);
  border: 1px solid #8a6a3f;
  border-radius: 2px;
  flex-shrink: 0;
`

const PartLen = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: #26251f;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`

const PartBlur = styled.span`
  filter: blur(5px);
  letter-spacing: 3px;
  color: #8b877e;
`

const PartDims = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  margin-top: 0.6rem;
  font-size: 0.82rem;
  color: #4a4842;
  font-variant-numeric: tabular-nums;

  b { font-weight: 600; color: #8a857a; margin-right: 0.3rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; }
`

const DragChip = styled.div`
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #1c1e22;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
  pointer-events: none;
`

const PartChip = styled.div`
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(28, 30, 34, 0.94);
  color: #fff;
  font-size: 0.82rem;
  padding: 0.4rem 0.5rem 0.4rem 0.4rem;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(6px);
  pointer-events: none;

  b { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: #f4f2ec; color: #16181d; font-size: 0.75rem; }
  span { font-weight: 700; }
  em { font-style: normal; color: #a8a49b; }
`

const SelectCard = styled.div`
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #16181d;
  color: #fff;
  padding: 0.45rem 0.5rem 0.45rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.3);

  b { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #2f6d4f; color: #fff; font-size: 0.8rem; }
  div { display: flex; flex-direction: column; line-height: 1.25; }
  strong { font-size: 0.85rem; }
  em { font-style: normal; font-size: 0.76rem; color: #a8a49b; }
`

const SelClose = styled.button`
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.08);
  color: #cfccc4;
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.18); color: #fff; }
`

const PartMerke = styled.span`
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1c1e22;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
`

const Panel = styled.aside<{ $open: boolean }>`
  width: ${({ $open }) => ($open ? '372px' : '38px')};
  flex-shrink: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #1b1e24;
  border-left: 1px solid rgba(255,255,255,0.07);
  overflow: hidden;
  transition: width 0.28s ease;

  @media (max-width: 820px) {
    order: 3;
    width: 100%;
    max-height: 46vh;
    border-left: none;
    border-top: 1px solid rgba(255,255,255,0.07);
  }
`

const PanelToggle = styled.button`
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 30px;
  padding: 0.85rem 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-right: none;
  border-radius: 9px 0 0 9px;
  background: #1b1e24;
  color: #cfccc4;
  font-size: 0.78rem;
  cursor: pointer;
  box-shadow: -3px 0 12px rgba(0, 0, 0, 0.18);
  transition: color 0.15s, background 0.15s;
  &:hover { background: #23262d; color: #fff; }

  @media (max-width: 820px) { display: none; }
`

const ToggleLabel = styled.span`
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #a8a49b;
`

const PanelScroll = styled.div<{ $open: boolean }>`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.75rem;
  width: 372px;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
  transition: opacity 0.18s ease;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }

  @media (max-width: 820px) { width: 100%; }
`

/* ---- accordion (kort) ---- */

const SectionWrap = styled.section`
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.025);
  overflow: hidden;
  & + & { margin-top: 0.6rem; }
`

const SectionHead = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: none;
  cursor: pointer;
  color: #f0eee8;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: background 0.15s;
  &:hover { background: rgba(255, 255, 255, 0.07); }
`

const Chevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  font-size: 0.75rem;
  color: #8b877e;
  transition: transform 0.2s ease;
  transform: rotate(${({ $open }) => ($open ? '180deg' : '0deg')});
`

const SectionBody = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
  transition: grid-template-rows 0.25s ease;
  border-top: ${({ $open }) => ($open ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent')};

  & > div {
    overflow: ${({ $open }) => ($open ? 'visible' : 'hidden')};
    padding: ${({ $open }) => ($open ? '1rem' : '0 1rem')};
    transition: padding 0.25s ease;
  }
`

const ShapeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
`

const ShapeBtn = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 0.5rem;
  border-radius: 11px;
  cursor: pointer;
  border: 1px solid ${({ $active }) => ($active ? '#e9e7e1' : 'rgba(255,255,255,0.1)')};
  background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.03)')};
  color: ${({ $active }) => ($active ? '#fff' : '#c8c5bd')};
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  &:hover { border-color: #e9e7e1; }

  svg { width: 30px; height: 26px; color: ${({ $active }) => ($active ? '#f4f2ec' : '#a8a49b')}; }
  span { font-size: 0.78rem; font-weight: 600; text-align: center; line-height: 1.2; }
`

const SubGroup = styled.div`
  & + & { margin-top: 1.15rem; }
`

const PriceNote = styled.p`
  margin: 0 0 0.9rem;
  font-size: 0.78rem;
  line-height: 1.5;
  color: #918d84;
`

const ByggStatus = styled.div<{ $ok: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  border-radius: 10px;
  font-weight: 650;
  font-size: 0.9rem;
  margin-bottom: 0.7rem;
  color: ${(p) => (p.$ok ? '#1f7a43' : '#9a6b12')};
  background: ${(p) => (p.$ok ? 'rgba(46,160,90,0.14)' : 'rgba(220,150,30,0.16)')};
  border: 1px solid ${(p) => (p.$ok ? 'rgba(46,160,90,0.5)' : 'rgba(220,150,30,0.55)')};
`

const ByggList = styled.ul`
  margin: 0;
  padding-left: 1.05rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  li {
    font-size: 0.8rem;
    line-height: 1.45;
    color: #6b6f76;
  }
`

const UnlockBadge = styled.div`
  font-size: 2.4rem;
  color: #52704f;
  margin-bottom: 0.4rem;
`

const SoknadBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 1rem;
  padding: 0.7rem 1.1rem;
  border: none;
  border-radius: 10px;
  background: #52704f;
  color: #fff;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #3f5a3d; }
`

const SoknadNote = styled.p`
  margin: 0.6rem 0 0;
  font-size: 0.72rem;
  line-height: 1.5;
  color: #8a877e;
`

const PriceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0;
  font-size: 0.85rem;
  color: #d6d3cb;

  span { flex: 1; min-width: 0; }
  em { font-style: normal; font-size: 0.75rem; color: #8b877e; width: 3.2rem; }
`

const PriceInput = styled.input`
  width: 4.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 0.85rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
  outline: none;
  &:focus { border-color: #e9e7e1; }
`

const SubLabel = styled.div`
  margin: 0 0 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #b9b6ae;
`

const SegRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`

const SegBtn = styled.button<{ $active: boolean }>`
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  border: 1px solid ${({ $active }) => ($active ? '#e9e7e1' : 'rgba(255,255,255,0.12)')};
  background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.03)')};
  color: ${({ $active }) => ($active ? '#fff' : '#c8c5bd')};
  transition: border-color 0.15s, background 0.15s;
  &:hover { border-color: #e9e7e1; }
`

const Slider = styled.div`
  margin-bottom: 1.05rem;

  input[type='range'] {
    width: 100%;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 4px;
    background: var(--ui-rail, rgba(255,255,255,0.12));
    outline: none;
    cursor: pointer;
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--ui-thumb, #e9e7e1);
    border: 3px solid var(--ui-thumb-border, #1b1e24);
    box-shadow: 0 0 0 1px var(--ui-thumb, #e9e7e1);
    cursor: grab;
  }
  input[type='range']::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--ui-thumb, #e9e7e1);
    border: 3px solid var(--ui-thumb-border, #1b1e24);
    cursor: grab;
  }
`

const SliderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--ui-subtext, #d6d3cb);
  b { color: var(--ui-strong, #fff); font-variant-numeric: tabular-nums; }
`

const MarkerRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.5rem;
`

const MarkerChip = styled.button<{ $active: boolean }>`
  padding: 0.2rem 0.5rem;
  font-size: 0.74rem;
  line-height: 1;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--ui-thumb, #e9e7e1)' : 'rgba(255,255,255,0.14)')};
  background: ${({ $active }) => ($active ? 'var(--ui-thumb, #e9e7e1)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--ui-thumb-border, #1b1e24)' : 'var(--ui-subtext, #d6d3cb)')};
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  transition: border-color 0.15s ease;
  &:hover { border-color: var(--ui-thumb, #e9e7e1); }
`

const Choices = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ChoiceBtn = styled.button<{ $active: boolean }>`
  text-align: left;
  padding: 0.7rem 0.85rem;
  border-radius: 10px;
  border: 1px solid ${({ $active }) => ($active ? '#e9e7e1' : 'rgba(255,255,255,0.1)')};
  background: ${({ $active }) => ($active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.03)')};
  color: #e9e7e1;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  span { font-size: 0.9rem; font-weight: 600; }
  em { font-style: normal; font-size: 0.76rem; color: #918d84; line-height: 1.35; }
  &:hover { border-color: #e9e7e1; }
`

const Swatches = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`

const SwatchBtn = styled.button<{ $active: boolean; $transparent: boolean }>`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 0.7rem;
  border: 2px solid ${({ $active }) => ($active ? '#fff' : 'rgba(255,255,255,0.25)')};
  box-shadow: ${({ $active }) => ($active ? '0 0 0 2px #e9e7e1' : 'none')};
  transition: transform 0.12s, box-shadow 0.15s;
  ${({ $transparent }) =>
    $transparent &&
    `background: repeating-conic-gradient(#cfccc4 0% 25%, #8b877e 0% 50%) 50% / 12px 12px;`}
  &:hover { transform: scale(1.08); }
  svg { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6)); }
`

const SwatchName = styled.div`
  margin-top: 0.6rem;
  font-size: 0.82rem;
  color: #b9b6ae;
`

const Toggle = styled.button<{ $on: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ui-text, #e9e7e1);
  text-align: left;

  span { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.9rem; font-weight: 600; }
  em { font-style: normal; font-size: 0.76rem; color: var(--ui-muted, #918d84); }
`

const Track = styled.span<{ $on: boolean }>`
  flex-shrink: 0;
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: ${({ $on }) => ($on ? 'var(--ui-track-on, #e9e7e1)' : 'var(--ui-track-off, rgba(255,255,255,0.14))')};
  position: relative;
  transition: background 0.18s;
`

const Knob = styled.span<{ $on: boolean }>`
  position: absolute;
  top: 3px;
  left: ${({ $on }) => ($on ? '21px' : '3px')};
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  transition: left 0.18s;
`

const CodeErr = styled.p`
  margin: 0.5rem 0 0;
  font-size: 0.76rem;
  color: #e0928a;
`

/* ---- oppsummering (venstre sidepanel, lyst – kun skillelinje) ---- */

const SummaryRail = styled.aside`
  width: 316px;
  flex-shrink: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f4f1ea;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  color: #26251f;

  @media (max-width: 820px) {
    order: 2;
    width: 100%;
    max-height: 42vh;
    border-right: none;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
`

const RailHead = styled.div`
  flex-shrink: 0;
  padding: 0.9rem 1rem 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
`

const RailScroll = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.85rem 0;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.16); border-radius: 4px; }
`

const RailFooter = styled.div`
  flex-shrink: 0;
  padding: 0.7rem 1rem 0.85rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background: #f4f1ea;
`

const RailExportBtn = styled.button`
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1rem;
  border: none;
  border-radius: 12px;
  background: #52704f;
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #3f5a3d; }
`

const RailExportPrice = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  opacity: 0.85;
  &::before { content: '·'; margin: 0 0.4rem; opacity: 0.6; }
`

const SumTitle = styled.div`
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #918d84;
`

const FactRow = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 0.75rem;
`

const Fact = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  em { font-style: normal; font-size: 0.68rem; color: #918d84; }
  b { font-size: 0.9rem; font-weight: 700; color: #26251f; font-variant-numeric: tabular-nums; }
`

const MatCost = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin: 0 1rem 0.85rem;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
  span { font-size: 0.76rem; font-weight: 600; color: #6b6860; }
  b { flex-shrink: 0; white-space: nowrap; font-size: 1.15rem; font-weight: 800; color: #26251f; font-variant-numeric: tabular-nums; }
`

const OptTitle = styled.div`
  padding: 0.85rem 1rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: #6b6860;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
`

const OptList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0 0.75rem;
`

const OptRow = styled.button<{ $disabled?: boolean; $highlight?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.55rem;
  border: ${({ $highlight }) => ($highlight ? '1.5px solid #5a8f5a' : '1px solid rgba(0, 0, 0, 0.1)')};
  border-radius: 10px;
  background: ${({ $highlight }) => ($highlight ? '#f1faf1' : '#fff')};
  box-shadow: ${({ $highlight }) => ($highlight ? '0 2px 10px rgba(90, 143, 90, 0.18)' : 'none')};
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  &:hover {
    ${({ $disabled, $highlight }) =>
      $disabled ? '' : $highlight ? 'background: #eaf6ea; border-color: #4a7f4a;' : 'border-color: #7bc39c; background: #f6fbf7;'}
  }
  &:active { ${({ $disabled }) => ($disabled ? '' : 'transform: translateY(1px);')} }
`

const OptBadge = styled.span`
  position: absolute;
  top: -8px;
  right: 10px;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: #5a8f5a;
  color: #fff;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

const OptNa = styled.span`
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 700;
  color: #918d84;
  white-space: nowrap;
`

const OptIco = styled.span<{ $highlight?: boolean }>`
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: ${({ $highlight }) => ($highlight ? '#5a8f5a' : '#eef0e9')};
  color: ${({ $highlight }) => ($highlight ? '#fff' : '#33322e')};
  font-size: 0.9rem;
`

const OptText = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  b { font-size: 0.86rem; font-weight: 700; color: #26251f; }
  em { font-style: normal; font-size: 0.72rem; color: #918d84; }
`

const OptPrice = styled.span`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  white-space: nowrap;
  font-size: 0.88rem;
  font-weight: 700;
  color: #26251f;
  font-variant-numeric: tabular-nums;
  span { font-size: 0.64rem; font-weight: 600; color: #918d84; }
`

const OptArrow = styled.span`
  flex-shrink: 0;
  color: #b7b3aa;
  font-size: 0.75rem;
`

const SumFoot = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.9rem 1rem 0.4rem;
  font-size: 0.76rem;
  font-weight: 600;
  color: #6b6860;
  svg { color: #5a8f5a; }
`

/* Innstillinger nederst i venstre rail – lys tematisering av delte kontroller. */
const ViewSettings = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 6;
  padding: 0.28rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.14);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    bottom: 10px;
    left: 10px;
  }
`

const ViewSettingsMenu = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  width: 250px;
  max-height: 68vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.7rem 0.85rem;
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  --ui-text: #33322e;
  --ui-muted: #8a877e;
  --ui-track-on: #33322e;
  --ui-track-off: rgba(0, 0, 0, 0.18);
  --ui-rail: rgba(0, 0, 0, 0.14);
  --ui-thumb: #33322e;
  --ui-thumb-border: #f4f1ea;
  --ui-subtext: #5a584f;
  --ui-strong: #26251f;
`
