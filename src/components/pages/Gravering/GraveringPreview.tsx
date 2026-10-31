import { useEffect, useId, useMemo } from 'react'
import { designerSymbols } from '../../../data/designerSymbols'
import { loadDesignerFont } from '../../../data/designerFonts'
import { produkt, type Valg } from '../../../data/gravering'
import { aarer, borsting, graveringGeometri, motivFelt, narv, type Primitiv } from './graveringGeometri'
import { byggMotiv } from './graveringMotiv'
import { useTekstmaal } from './useTekstmaal'

interface Props {
  valg: Valg
  /** Dekorativ bruk (malkort, seksjonsbilder) – da trenger den ingen tilgjengelig tittel. */
  dekorativ?: boolean
  /**
   * Slår av slagskyggen. I små miniatyrer (produktfaner, malkort) gjør
   * skyggen bare konturen grumsete – der er det formen som skal leses.
   */
  utenSkygge?: boolean
  /**
   * Tegner referanselinja: emnets ytterkant, saftrillen og graveringsfeltet,
   * samme geometri som det røde laget i produksjonsfila. Gir kunden – og
   * verkstedet – et mål på hvor stort motivet faktisk blir.
   */
  visOmriss?: boolean
  className?: string
}

/**
 * Noen symboler er tegnet med streker (sol, snøfnugg) og har ingen flate å
 * fylle. De tegnes med strek i tillegg til fyll, ellers blir de usynlige.
 * Bredden er i symbolets eget 100 × 100-rutenett.
 */
const SYMBOL_STREK = 4

/**
 * Gravering er brent tre, ikke trykksverte: kanten av motivet slipper så vidt
 * litt av underlaget gjennom. Litt gjennomsiktighet treffer virkeligheten
 * bedre enn ren, flat farge.
 */
const GRAVERT_DEKNING = 0.85

function Silhuett({ primitiver }: { primitiver: Primitiv[] }) {
  return (
    <>
      {primitiver.map((p, i) => {
        if (p.form === 'circle') return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} />
        if (p.form === 'path') return <path key={i} d={p.d} />
        return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} />
      })}
    </>
  )
}

/**
 * Produktet slik det blir seende ut. Alt tegnes som SVG i millimeter: silhuett,
 * prosedural overflate klippet til formen, og graveringen på toppen.
 *
 * Teksten måles med canvas i stedet for å gjettes, slik at lange navn krymper
 * presist i stedet for å renne ut over kanten. Se `useTekstmaal`.
 */
export default function GraveringPreview({ valg, dekorativ, visOmriss, utenSkygge, className }: Props) {
  const id = useId().replace(/:/g, '')
  const p = produkt(valg.produkt)
  const variant = p.varianter.find((v) => v.id === valg.variant) ?? p.varianter[0]
  const flate = p.flater.find((f) => f.id === valg.flate) ?? p.flater[0]
  const maalTekst = useTekstmaal(valg.font)

  // Graveringsskriftene er Google-fonter som ikke lastes globalt. Hent bare
  // skriften som vises – ikke alle ~30 designer-fontene.
  useEffect(() => {
    loadDesignerFont(valg.font)
  }, [valg.font])

  const geo = useMemo(
    () => graveringGeometri(p.form, variant.bredde, variant.hoyde),
    [p.form, variant.bredde, variant.hoyde],
  )

  // Overflaten skal ligge fast per form og størrelse, ikke per tastetrykk.
  const overflate = useMemo(() => {
    const seed = geo.bredde * 31 + geo.hoyde
    // Pulverlakk er glatt: ingen striper, bare lysfallet på sylinderen.
    if (flate.tekstur === 'lakk') return { streker: [], tynn: true }
    if (flate.tekstur === 'stal') return { streker: borsting(geo.bredde, geo.hoyde, seed), tynn: true }
    if (flate.tekstur === 'skinn') return { streker: narv(geo.bredde, geo.hoyde, seed), tynn: true }
    return { streker: aarer(geo.bredde, geo.hoyde, seed), tynn: false }
  }, [flate.tekstur, geo.bredde, geo.hoyde])

  const synlige = valg.linjer.slice(0, p.maksLinjer).map((l) => l.trim())
  const symbol = valg.symbol ? designerSymbols.find((s) => s.id === valg.symbol) : undefined

  // Kjevla tegnes i det utbrettede sylinderplanet; andre produkter i flaten.
  const motivfelt = motivFelt(geo, valg.oppsett)

  // Innholdet i linjene er det som betyr noe for memoiseringen, ikke at
  // `synlige` er en ny array ved hver render.
  const linjenokkel = synlige.join('\u0000')
  const synligBand = geo.wrap?.diameter
  /**
   * Lufta rundt emnet. Fast 14 mm var mye på en 73 mm flaske – da ble
   * produktet lite i en miniatyr. Nå følger den emnets smaleste mål.
   */
  const luft = Math.max(5, Math.min(geo.bredde, geo.hoyde) * 0.09)
  const skygge = {
    ned: Math.max(1.1, geo.bredde * 0.012),
    mykhet: Math.max(1.4, geo.bredde * 0.016),
  }

  const motiv = useMemo(
    () =>
      byggMotiv({
        felt: motivfelt,
        linjer: synlige,
        symbolPath: symbol?.path ?? null,
        oppsett: valg.oppsett,
        juster: valg.juster,
        loddrett: valg.loddrett,
        synlig: synligBand,
        maal: maalTekst,
      }),
    // synlige er en ny array hver render; innholdet er det som betyr noe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      motivfelt,
      linjenokkel,
      symbol?.path,
      valg.oppsett,
      valg.juster,
      valg.loddrett,
      synligBand,
      maalTekst,
    ],
  )

  const tekstlinjer = synlige.filter(Boolean)
  const tittel = tekstlinjer.length
    ? `Forhåndsvisning av ${p.navn.toLowerCase()} gravert med «${tekstlinjer.join(', ')}»`
    : `Forhåndsvisning av ${p.navn.toLowerCase()} uten gravering`

  return (
    <svg
      className={className}
      viewBox={`${-luft} ${-luft} ${geo.bredde + luft * 2} ${geo.hoyde + luft * 2}`}
      role={dekorativ ? 'presentation' : 'img'}
      aria-label={dekorativ ? undefined : tittel}
      aria-hidden={dekorativ || undefined}
    >
      <defs>
        <clipPath id={`klipp-${id}`}>
          <Silhuett primitiver={geo.primitiver} />
        </clipPath>
        {geo.sylinder ? (
          // Sylindre skyggelegges på tvers av aksen: mørkt i kantene, lyst på
          // midten. Kjevla ligger, så gradienten går loddrett der.
          <linearGradient
            id={`lys-${id}`}
            x1="0"
            y1="0"
            x2={geo.liggende ? '0' : '1'}
            y2={geo.liggende ? '1' : '0'}
          >
            <stop offset="0%" stopColor="#000" stopOpacity="0.38" />
            <stop offset="22%" stopColor="#000" stopOpacity="0.1" />
            <stop offset="40%" stopColor="#fff" stopOpacity="0.26" />
            <stop offset="62%" stopColor="#fff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.34" />
          </linearGradient>
        ) : (
          <linearGradient id={`lys-${id}`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.14" />
          </linearGradient>
        )}
        {/* Skyggen må følge emnets størrelse: viewBox-en er millimeter, så en
            fast 6 mm forskyvning er diskret på en 350 mm fjøl, men en grøt på
            en 73 mm flaske. Derfor regnes den ut av bredden. */}
        <filter id={`skygge-${id}`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy={skygge.ned}
            stdDeviation={skygge.mykhet}
            floodColor="#2e2a26"
            floodOpacity="0.2"
          />
        </filter>
      </defs>

      <g filter={utenSkygge ? undefined : `url(#skygge-${id})`}>
        <g fill={flate.farge}>
          <Silhuett primitiver={geo.primitiver} />
        </g>

        <g clipPath={`url(#klipp-${id})`}>
          {overflate.streker.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={flate.areFarge}
              strokeWidth={overflate.tynn ? 0.5 : i % 7 === 0 ? 1.6 : 0.7}
              strokeOpacity={overflate.tynn ? 0.35 : i % 7 === 0 ? 0.5 : 0.28}
              strokeLinecap="round"
            />
          ))}
          <rect x={-20} y={-20} width={geo.bredde + 40} height={geo.hoyde + 40} fill={`url(#lys-${id})`} />
        </g>

        {geo.rille && (
          // Innfelt detalj: en mørk strek med et lyst høylys under, så den
          // leser som en fordypning og ikke som en påtegnet ramme. Høyde 0
          // betyr en rett strek (stålringen på flaska) – en rect med høyde 0
          // tegnes ikke i SVG, så den må være en line.
          <g clipPath={`url(#klipp-${id})`} fill="none">
            {geo.rille.h === 0 ? (
              <>
                {/* Blankt stål: en lys kjerne med en mørk hårstrek under. */}
                <line
                  x1={geo.rille.x}
                  y1={geo.rille.y}
                  x2={geo.rille.x + geo.rille.w}
                  y2={geo.rille.y}
                  stroke="#d7d4cd"
                  strokeWidth={geo.rille.bredde}
                />
                <line
                  x1={geo.rille.x}
                  y1={geo.rille.y + geo.rille.bredde * 0.55}
                  x2={geo.rille.x + geo.rille.w}
                  y2={geo.rille.y + geo.rille.bredde * 0.55}
                  stroke={flate.areFarge}
                  strokeWidth={geo.rille.bredde * 0.45}
                  strokeOpacity="0.8"
                />

              </>
            ) : (
              <>
                <rect
                  x={geo.rille.x}
                  y={geo.rille.y}
                  width={geo.rille.w}
                  height={geo.rille.h}
                  rx={geo.rille.r}
                  stroke={flate.areFarge}
                  strokeWidth={geo.rille.bredde}
                  strokeOpacity="0.65"
                />
                <rect
                  x={geo.rille.x}
                  y={geo.rille.y + geo.rille.bredde * 0.5}
                  width={geo.rille.w}
                  height={geo.rille.h}
                  rx={geo.rille.r}
                  stroke="#fff"
                  strokeWidth={geo.rille.bredde * 0.35}
                  strokeOpacity="0.3"
                />
              </>
            )}
          </g>
        )}

        {geo.detaljer.length > 0 && (
          // Stropp og klaff hører til produktet, ikke graveringen – de tegnes
          // over kroppen, men under motivet.
          <g clipPath={`url(#klipp-${id})`}>
            {geo.detaljer.map((d, i) =>
              d.rolle === 'stropp' ? (
                <g key={i}>
                  <rect
                    x={d.x}
                    y={d.y}
                    width={d.w}
                    height={d.h}
                    rx={d.r}
                    fill={flate.stroppFarge ?? flate.areFarge}
                  />
                  {/* Bretten i båndet: en tynn, mørkere strek på langs. */}
                  <rect
                    x={d.x + d.w * 0.42}
                    y={d.y + d.h * 0.06}
                    width={d.w * 0.1}
                    height={d.h * 0.88}
                    fill="#000"
                    fillOpacity="0.07"
                  />
                  {/* Kanten mot kroppen, så båndet leser som noe som ligger oppå. */}
                  <rect
                    x={d.x}
                    y={d.y}
                    width={d.w}
                    height={d.h}
                    rx={d.r}
                    fill="none"
                    stroke="#000"
                    strokeOpacity="0.08"
                    strokeWidth={d.w * 0.06}
                  />
                </g>
              ) : (
                <g key={i}>
                  <rect x={d.x} y={d.y} width={d.w} height={d.h} rx={d.r} fill="#fff" fillOpacity="0.3" />
                  <rect
                    x={d.x}
                    y={d.y}
                    width={d.w}
                    height={d.h}
                    rx={d.r}
                    fill="none"
                    stroke="#fff"
                    strokeOpacity="0.55"
                    strokeWidth={d.w * 0.02}
                  />
                </g>
              ),
            )}
          </g>
        )}

        {motiv.length > 0 && (
          // Klippet må ligge på en EGEN gruppe uten transform: en clip-path
          // tolkes i elementets eget koordinatsystem, så en transform her ville
          // flyttet silhuetten vi klipper mot, ikke bare innholdet.
          <g clipPath={`url(#klipp-${id})`} fill={flate.brentFarge} opacity={GRAVERT_DEKNING}>
            {motiv.map((el, i) => {
              let innhold: React.ReactNode
              // Punktet elementet krummes om: midten for symboler, grunnlinja
              // for tekst.
              let feste = 0

              if (el.slag === 'tekst') {
                // Nettleseren legger sperring også etter siste tegn. Flytt
                // teksten en halv sperring tilbake, ellers står den skjevt.
                const x = el.anker === 'middle' ? el.x + el.sperring / 2 : el.anker === 'end' ? el.x + el.sperring : el.x
                feste = el.y
                innhold = (
                  <text
                    x={x}
                    y={el.y}
                    textAnchor={el.anker}
                    fontFamily={`"${valg.font}", Georgia, serif`}
                    fontSize={el.px}
                    style={el.sperring ? { letterSpacing: `${el.sperring}px` } : undefined}
                  >
                    {el.tekst}
                  </text>
                )
              } else if (el.slag === 'strek') {
                feste = el.y1
                innhold = (
                  <line
                    x1={el.x1}
                    y1={el.y1}
                    x2={el.x2}
                    y2={el.y2}
                    stroke={flate.brentFarge}
                    strokeWidth={el.bredde}
                    strokeLinecap="round"
                  />
                )
              } else if (el.slag === 'ring') {
                feste = el.cy
                innhold = (
                  <circle cx={el.cx} cy={el.cy} r={el.r} fill="none" stroke={flate.brentFarge} strokeWidth={el.bredde} />
                )
              } else {
                feste = el.y + el.storrelse / 2
                innhold = (
                  <g transform={`translate(${el.x}, ${el.y}) scale(${el.storrelse / 100})`}>
                    <path
                      d={el.path}
                      stroke={flate.brentFarge}
                      strokeWidth={SYMBOL_STREK}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )
              }

              if (!geo.wrap) return <g key={i}>{innhold}</g>

              // Kjevla: utbrettet legges tilbake på sylinderen. Motivet
              // trykkes sammen og blekner mot kantene, slik det gjør på et
              // rundt emne, og det som havner på baksiden tegnes ikke.
              const R = geo.wrap.diameter / 2
              const vinkel = (feste - geo.wrap.omkrets / 2) / R
              if (Math.abs(vinkel) > Math.PI / 2.1) return null
              const k = Math.cos(vinkel)
              return (
                <g
                  key={i}
                  transform={`translate(${geo.wrap.x}, ${R + R * Math.sin(vinkel)}) scale(1, ${k.toFixed(4)}) translate(0, ${-feste})`}
                  opacity={(0.35 + 0.65 * k).toFixed(3)}
                >
                  {innhold}
                </g>
              )
            })}
          </g>
        )}

        {visOmriss && (
          // Samme linje som ligger rødt i SVG-en, tegnet oppå produktet.
          <g fill="none" stroke="#d2453b" strokeWidth={0.6} strokeOpacity="0.9">
            <Silhuett primitiver={geo.primitiver} />
            {geo.rille && (
              <rect
                x={geo.rille.x}
                y={geo.rille.y}
                width={geo.rille.w}
                height={geo.rille.h}
                rx={geo.rille.r}
              />
            )}
            <rect
              x={motivfelt.x + (geo.wrap?.x ?? 0)}
              y={geo.wrap ? (geo.wrap.diameter - geo.wrap.omkrets) / 2 + motivfelt.y : motivfelt.y}
              width={motivfelt.w}
              height={motivfelt.h}
              strokeDasharray="4 3"
              strokeOpacity="0.55"
            />
          </g>
        )}

        {geo.syhull.map((h, i) => (
          <circle key={i} cx={h.cx} cy={h.cy} r={h.r} fill={flate.areFarge} fillOpacity="0.75" />
        ))}

        {geo.hull && (
          <circle
            cx={geo.hull.cx}
            cy={geo.hull.cy}
            r={geo.hull.r}
            fill="#efe9e0"
            stroke={flate.areFarge}
            strokeWidth="1.2"
          />
        )}
      </g>
    </svg>
  )
}
