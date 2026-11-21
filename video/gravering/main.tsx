/**
 * Graveringsvideo (YouTube Shorts, 1080 × 1920), tegnet med den samme
 * forhåndsvisningen som konfiguratoren bruker. Ingen opptak trengs: produktene
 * er de ekte tegningene, og laseren «brenner» motivet fram linje for linje.
 *
 * Tidsstyrt som vignett.html: render.mjs kaller window.setTime(t) per bilde.
 * Åpne /video/gravering.html i dev-serveren for å se den spilles av.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import GraveringPreview from '../../src/components/pages/Gravering/GraveringPreview'
import { loadDesignerFont } from '../../src/data/designerFonts'
import { SHORTS, pris, type ProduktKlipp } from './manus'
import logoSvg from '../../public/images/branding/logo_navbar.svg?raw'

const params = new URLSearchParams(location.search)
const manus = SHORTS[params.get('short') ?? 'jul'] ?? SHORTS.jul

const W = 1080
const H = 1920
/** Mørk, varm julekveld – farger fra src/styles/theme.ts. */
const C = {
  ink: '#faf7f2',
  muted: '#b3a797',
  accent: '#e0895f',
  accentDyp: '#a8512c',
  snow: '#fff',
  mork: '#1c1a18',
}

// --- Tidslinje (sekunder) ------------------------------------------------
const KLIPP = 5.4
// Første klipp starter «før» videoen, så produktet står der fra første bilde.
const KLIPP_START = [-0.4, 0.1 + KLIPP, 0.1 + KLIPP * 2]
const OVERSIKT = 0.1 + KLIPP * 3 // 16.3
const CTA = OVERSIKT + 4.4 // 20.7
const DURATION = CTA + 4.8 // 25.5

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const prog = (t: number, start: number, dur: number) => clamp((t - start) / dur)
const easeOut = (x: number) => 1 - Math.pow(1 - x, 4)
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/** Inn med fade og litt bevegelse, ut på samme måte. */
function inn(t: number, start: number, dur = 0.6, dy = 30): CSSProperties {
  const p = easeOut(prog(t, start, dur))
  return { opacity: p, transform: `translateY(${(1 - p) * dy}px)` }
}

// --- Måling ---------------------------------------------------------------
/**
 * Hvor på tegningen motivet ligger, som andel av viewBox. Laseren skal bare
 * sveipe over motivet, ikke over hele fjøla.
 */
interface Maal {
  aspekt: number
  motiv: { x0: number; x1: number; y0: number; y1: number }
}

function maal(svg: SVGSVGElement): Maal | null {
  const vb = svg.viewBox.baseVal
  const g = svg.querySelector<SVGGElement>('g[opacity="0.85"]')
  if (!vb || !vb.width || !g) return null
  const m = g.getBBox()
  const kropp = svg.querySelector<SVGGElement>('svg > g > g')?.getBBox()
  const b = kropp
    ? (() => {
        const x = Math.max(m.x, kropp.x)
        const y = Math.max(m.y, kropp.y)
        return { x, y, width: Math.min(m.x + m.width, kropp.x + kropp.width) - x, height: Math.min(m.y + m.height, kropp.y + kropp.height) - y }
      })()
    : m
  return {
    aspekt: vb.width / vb.height,
    motiv: {
      x0: clamp((b.x - vb.x) / vb.width),
      x1: clamp((b.x + b.width - vb.x) / vb.width),
      y0: clamp((b.y - vb.y) / vb.height),
      y1: clamp((b.y + b.height - vb.y) / vb.height),
    },
  }
}

/** Størrelsen tegningen får innenfor en boks, med samme logikk som SVG «meet». */
function passInn(aspekt: number, bw: number, bh: number, zoom = 1) {
  const w = aspekt > bw / bh ? bw : bh * aspekt
  return { w: w * zoom, h: (w / aspekt) * zoom }
}

// --- Produkt med laser ------------------------------------------------------
const tomt = (k: ProduktKlipp): ProduktKlipp['valg'] => ({ ...k.valg, linjer: ['', '', ''], symbol: null })

function Produkt({
  klipp,
  bw,
  bh,
  laser,
  t,
  maalt,
  onMaal,
}: {
  klipp: ProduktKlipp
  bw: number
  bh: number
  /** 0 = ikke startet, 1 = ferdig gravert. Utelatt = vis ferdig produkt. */
  laser?: number
  t: number
  maalt: Maal | null
  onMaal: (m: Maal) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Mål motivet hver gang skriften kan ha endret seg; billig, og bare til
  // målingen faktisk endrer noe.
  useLayoutEffect(() => {
    const svg = ref.current?.querySelector('svg')
    if (!svg) return
    const m = maal(svg)
    if (m && JSON.stringify(m) !== JSON.stringify(maalt)) onMaal(m)
  })

  const { w, h } = passInn(maalt?.aspekt ?? 1, bw, bh, klipp.zoom)
  const p = laser ?? 1
  const m = maalt?.motiv ?? { x0: 0, x1: 1, y0: 0, y1: 1 }
  // getBBox tar ikke med strekbredden, så start og stopp litt utenfor.
  const y0 = m.y0 - 0.03
  const y1 = m.y1 + 0.03
  const y = (y0 + (y1 - y0) * p) * h
  const aktiv = laser !== undefined && p > 0 && p < 1

  // Laserhodet går fram og tilbake over motivet mens det flytter seg nedover,
  // slik en rastergravering faktisk gjør.
  const fase = (t * 1.7) % 2
  const pendel = fase < 1 ? fase : 2 - fase
  const lx = (m.x0 + (m.x1 - m.x0) * easeInOut(pendel)) * w

  const fyll: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' }

  return (
    <div className="prod" style={{ position: 'relative', width: w, height: h }}>
      {laser !== undefined && <GraveringPreview valg={tomt(klipp)} dekorativ className="fyll" />}
      <div
        ref={ref}
        style={{
          ...(laser !== undefined ? fyll : { width: '100%', height: '100%' }),
          clipPath: laser === undefined || p >= 1 ? undefined : `inset(0 0 ${h - y}px 0)`,
        }}
      >
        <GraveringPreview valg={klipp.valg} dekorativ utenSkygge={laser !== undefined} />
      </div>
      {aktiv && (
        <>
          {/* Varmen i det som nettopp er brent */}
          <div
            style={{
              position: 'absolute',
              left: m.x0 * w - 10,
              width: (m.x1 - m.x0) * w + 20,
              top: y - 26,
              height: 26,
              background: 'linear-gradient(to bottom, rgba(255,120,40,0), rgba(255,120,40,0.28))',
              mixBlendMode: 'multiply',
            }}
          />
          {/* Skannelinja */}
          <div
            style={{
              position: 'absolute',
              left: m.x0 * w - 20,
              width: (m.x1 - m.x0) * w + 40,
              top: y - 1.5,
              height: 3,
              background: 'linear-gradient(to right, rgba(255,140,60,0), rgba(255,140,60,0.75) 20%, rgba(255,140,60,0.75) 80%, rgba(255,140,60,0))',
            }}
          />
          {/* Laserpunktet */}
          <div
            style={{
              position: 'absolute',
              left: lx - 34,
              top: y - 34,
              width: 68,
              height: 68,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, #fff 0%, #fff 12%, rgba(255,190,110,0.95) 22%, rgba(255,110,30,0.45) 45%, rgba(255,110,30,0) 70%)',
            }}
          />
        </>
      )}
    </div>
  )
}
// --- Bakgrunn ------------------------------------------------------------------
/** Deterministisk «tilfeldig» tall, så hvert bilde rendres likt hver gang. */
const tilf = (i: number, n: number) => {
  const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453
  return x - Math.floor(x)
}

const FNUGG = Array.from({ length: 70 }, (_, i) => ({
  x: tilf(i, 1) * W,
  y: tilf(i, 2) * H,
  s: 3 + tilf(i, 3) * 7,
  v: 35 + tilf(i, 4) * 80,
  sving: 10 + tilf(i, 5) * 30,
  f: tilf(i, 6) * 6,
  o: 0.25 + tilf(i, 7) * 0.5,
}))

// Uskarpe julelys i bakgrunnen
const LYS = Array.from({ length: 16 }, (_, i) => ({
  x: tilf(i, 11) * W,
  y: tilf(i, 12) * H,
  s: 70 + tilf(i, 13) * 150,
  farge: ['255,170,90', '255,205,130', '224,137,95'][i % 3],
  o: 0.07 + tilf(i, 14) * 0.13,
  v: 6 + tilf(i, 15) * 14,
  f: tilf(i, 16) * 6,
}))

function Bakgrunn({ t }: { t: number }) {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 95% 60% at 50% 50%, #3b2f26 0%, #221c17 45%, #110f0d 100%)',
        }}
      />
      {LYS.map((l, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: l.x - l.s / 2 + Math.sin(t * 0.3 + l.f) * 20,
            top: ((l.y - t * l.v + H * 2) % (H + 300)) - 150,
            width: l.s,
            height: l.s,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${l.farge},${l.o}) 0%, rgba(${l.farge},${l.o * 0.6}) 45%, rgba(${l.farge},0) 70%)`,
            opacity: 0.75 + 0.25 * Math.sin(t * 1.3 + l.f),
          }}
        />
      ))}
      {/* Lyset fra lampa over arbeidsbenken */}
      <div
        style={{
          position: 'absolute',
          left: W / 2 - 700,
          top: 380,
          width: 1400,
          height: 1150,
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,214,160,0.22) 0%, rgba(255,190,130,0.08) 45%, rgba(255,190,130,0) 70%)',
        }}
      />
      {FNUGG.map((f, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: f.x + Math.sin(t * 0.8 + f.f) * f.sving,
            top: ((f.y + t * f.v) % (H + 40)) - 20,
            width: f.s,
            height: f.s,
            borderRadius: '50%',
            background: C.snow,
            opacity: f.o,
            boxShadow: `0 0 ${f.s * 1.5}px rgba(255,255,255,${f.o * 0.6})`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 70% at 50% 50%, transparent 55%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </>
  )
}

/** Myk skygge og lys på «bordet» under produktet. */
function Gulv({ bredde }: { bredde: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: -40,
        width: bredde,
        height: 120,
        transform: 'translateX(-50%)',
        background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)',
      }}
    />
  )
}

// --- Tekst ---------------------------------------------------------------------
const mono: CSSProperties = { fontFamily: '"Geist Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.22em' }

/** Linjeskift med \n, og *ord* i aksentfargen. */
function Linjer({ tekst }: { tekst: string }) {
  return (
    <>
      {tekst.split('\n').map((l, i) => (
        <div key={i}>
          {l.split(/(\*[^*]+\*)/).map((del, j) =>
            del.startsWith('*') ? (
              <span key={j} style={{ color: C.accent, fontStyle: 'italic', fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, fontSize: '1.12em' }}>
                {del.slice(1, -1)}
              </span>
            ) : (
              del
            ),
          )}
        </div>
      ))}
    </>
  )
}

function Pille({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '16px 36px',
        borderRadius: 999,
        background: C.accent,
        color: C.mork,
        fontWeight: 650,
        fontSize: 42,
        letterSpacing: '-0.01em',
        boxShadow: '0 10px 40px rgba(224,137,95,0.35)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** Den ekte logoen fra nettsiden, farget for mørk bakgrunn. */
const LOGO = logoSvg
  .replace(/#C4C4C4/gi, C.ink)
  .replace(/width="545" height="148"/, 'width="100%" height="100%"')

function Logo({ height, style }: { height: number; style?: CSSProperties }) {
  return <div style={{ height, width: (height * 545) / 148, ...style }} dangerouslySetInnerHTML={{ __html: LOGO }} />
}

// --- Scenen -----------------------------------------------------------------------
function Scene({ t }: { t: number }) {
  const [maalt, settMaalt] = useState<Record<string, Maal>>({})
  const lagre = (k: string) => (m: Maal) => settMaalt((f) => ({ ...f, [k]: m }))

  const iKlipp = t < OVERSIKT + 0.4
  const tittelUt = 1 - easeInOut(prog(t, OVERSIKT - 0.5, 0.5))
  const logoTopp = (1 - easeInOut(prog(t, CTA - 0.4, 0.4))) 

  // Shorts-appen dekker de nederste ~350 px og en stripe til høyre; alt viktig
  // ligger over det.
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: '"Geist", sans-serif', color: C.ink }}>
      <Bakgrunn t={t} />

      {/* Logoen står øverst hele veien, til avslutningen tar over */}
      <div style={{ position: 'absolute', top: 96, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: logoTopp }}>
        <Logo height={58} />
      </div>

      {/* Krok – står over produktene */}
      <div style={{ position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', opacity: tittelUt }}>
        <div style={{ ...mono, fontSize: 28, color: C.accent, ...inn(t, -0.5, 0.5, 14) }}>{manus.krok.eyebrow}</div>
        <div style={{ fontSize: 104, fontWeight: 650, lineHeight: 1.02, letterSpacing: '-0.035em', marginTop: 22, ...inn(t, -0.7, 0.7) }}>
          <Linjer tekst={manus.krok.tittel} />
        </div>
      </div>

      {manus.produkter.map((k, i) => {
        const s = KLIPP_START[i]
        const tl = t - s
        const inne = easeOut(prog(tl, 0, 0.6))
        const ute = easeInOut(prog(tl, KLIPP - 0.45, 0.45))
        const synlig = iKlipp && tl > -0.1 && tl < KLIPP
        const laser = prog(tl, 0.7, 2.8)
        // Sakte zoom mens laseren jobber, som et kamera som lener seg inn
        const kamera = 1 + 0.05 * easeInOut(prog(tl, 0.4, 4.6))
        return (
          <div key={i} style={{ position: 'absolute', inset: 0, opacity: synlig ? inne * (1 - ute) : 0 }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 560,
                height: 820,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translateX(${(1 - inne) * 160 - ute * 160}px) scale(${(0.94 + 0.06 * inne) * kamera})`,
              }}
            >
              <div style={{ position: 'relative' }}>
                <Gulv bredde={900} />
                <Produkt klipp={k} bw={960} bh={800} laser={laser} t={t} maalt={maalt[`p${i}`] ?? null} onMaal={lagre(`p${i}`)} />
              </div>
            </div>
            <div style={{ position: 'absolute', top: 1410, left: 0, right: 0, textAlign: 'center' }}>
              <div style={{ ...mono, fontSize: 24, color: C.muted, ...inn(t, s + 0.4, 0.5, 10) }}>
                {String(i + 1).padStart(2, '0')} / {String(manus.produkter.length).padStart(2, '0')}
              </div>
              <div style={{ fontSize: 76, fontWeight: 650, letterSpacing: '-0.03em', marginTop: 10, ...inn(t, s + 0.5, 0.6) }}>{k.navn}</div>
              <div style={{ fontSize: 38, color: C.muted, marginTop: 8, ...inn(t, s + 0.7, 0.6) }}>{k.detalj}</div>
              <div style={{ marginTop: 30, ...inn(t, s + 3.3, 0.5, 16) }}>
                <Pille>{pris(k)}</Pille>
              </div>
            </div>
          </div>
        )
      })}

      {/* Oversikt: alle tre ferdig gravert */}
      <div style={{ position: 'absolute', inset: 0, opacity: t >= OVERSIKT - 0.2 ? 1 - easeInOut(prog(t, CTA - 0.45, 0.45)) : 0 }}>
        <div style={{ position: 'absolute', top: 230, left: 70, right: 70, textAlign: 'center' }}>
          <div style={{ fontSize: 96, fontWeight: 650, letterSpacing: '-0.035em', ...inn(t, OVERSIKT, 0.6) }}>
            <Linjer tekst={manus.oversikt.tittel} />
          </div>
          <div style={{ fontSize: 42, lineHeight: 1.35, color: C.muted, marginTop: 24, ...inn(t, OVERSIKT + 0.25, 0.6) }}>
            {manus.oversikt.tekst}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 700, left: 0, right: 0, display: 'flex', justifyContent: 'center', ...inn(t, OVERSIKT + 0.4, 0.7, 50) }}>
          <div style={{ overflow: 'hidden', width: 1000, display: 'flex', justifyContent: 'center' }}>
            <Produkt klipp={manus.produkter[1]} bw={1000} bh={220} t={t} maalt={maalt.o1 ?? null} onMaal={lagre('o1')} />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 960, left: 50, right: 50, height: 560, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          <div style={{ position: 'relative', ...inn(t, OVERSIKT + 0.6, 0.7, 50) }}>
            <Gulv bredde={600} />
            <Produkt klipp={manus.produkter[0]} bw={620} bh={560} t={t} maalt={maalt.o0 ?? null} onMaal={lagre('o0')} />
          </div>
          <div style={{ position: 'relative', ...inn(t, OVERSIKT + 0.8, 0.7, 50) }}>
            <Gulv bredde={260} />
            <Produkt klipp={manus.produkter[2]} bw={240} bh={580} t={t} maalt={maalt.o2 ?? null} onMaal={lagre('o2')} />
          </div>
        </div>
      </div>

      {/* Avslutning */}
      <div style={{ position: 'absolute', inset: 0, opacity: t >= CTA - 0.1 ? 1 : 0 }}>
        <div style={{ position: 'absolute', top: 300, left: 0, right: 0, display: 'flex', justifyContent: 'center', ...inn(t, CTA, 0.8, 20) }}>
          <Logo height={110} />
        </div>
        <div style={{ position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 76, fontWeight: 500, letterSpacing: '-0.02em', ...inn(t, CTA + 0.3, 0.6) }}>{manus.avslutning.frist}</div>
          <div style={{ fontSize: 168, fontWeight: 700, letterSpacing: '-0.045em', color: C.accent, lineHeight: 1.02, ...inn(t, CTA + 0.5, 0.7) }}>
            {manus.avslutning.fristUthevet}
          </div>
          <div style={{ fontSize: 44, color: C.muted, marginTop: 10, ...inn(t, CTA + 0.7, 0.6) }}>{manus.avslutning.under}</div>
          {manus.avslutning.kampanje && (
            <div style={{ marginTop: 56, ...inn(t, CTA + 1.0, 0.6, 16) }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '14px 32px',
                  borderRadius: 999,
                  border: `2px solid ${C.accent}`,
                  color: C.accent,
                  fontSize: 36,
                  fontWeight: 550,
                }}
              >
                {manus.avslutning.kampanje}
              </span>
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', top: 1270, left: 0, right: 0, textAlign: 'center', ...inn(t, CTA + 1.4, 0.7) }}>
          <div style={{ ...mono, fontSize: 28, color: C.muted, marginBottom: 22 }}>Lag din på</div>
          <Pille style={{ background: C.ink, color: C.mork, fontSize: 60, padding: '24px 56px', fontFamily: '"Geist Mono", monospace', fontWeight: 500, boxShadow: '0 16px 60px rgba(255,220,180,0.25)' }}>
            {manus.avslutning.url}
          </Pille>
        </div>
      </div>
    </div>
  )
}

// --- Oppstart -----------------------------------------------------------------------
// Cormorant brukes også til de uthevede ordene i overskriftene.
const FONTER = [...new Set(['Cormorant Garamond', ...manus.produkter.map((k) => k.valg.font)])]
loadDesignerFont(...FONTER)

const root = createRoot(document.getElementById('root')!)
const vis = (t: number) => flushSync(() => root.render(<Scene t={t} />))

declare global {
  interface Window {
    DURATION: number
    setTime: (t: number) => void
    ready: Promise<boolean>
  }
}

window.DURATION = DURATION
window.setTime = vis
vis(0)

window.ready = (async () => {
  await Promise.all(['Geist', 'Geist Mono', ...FONTER].map((f) => document.fonts.load(`100px "${f}"`).catch(() => null)))
  await document.fonts.ready
  // La forhåndsvisningene måle teksten på nytt og motivet bli målt.
  for (let i = 0; i < 6; i++) {
    await new Promise((r) => setTimeout(r, 80))
    vis(i % 2 ? 0 : 20)
  }
  vis(0)
  return true
})()

if (!params.has('render')) {
  window.ready.then(() => {
    const t0 = performance.now()
    const loop = () => {
      vis(((performance.now() - t0) / 1000) % (DURATION + 1))
      requestAnimationFrame(loop)
    }
    loop()
  })
}
