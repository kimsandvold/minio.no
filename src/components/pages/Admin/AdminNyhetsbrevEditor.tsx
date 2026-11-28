import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import produkter from '../../../data/products.json'
import { getAlleKontakter } from '../../../services/kontaktService'
import { getNyhetsbrev, lagreNyhetsbrev, slettNyhetsbrev } from '../../../services/nyhetsbrevService'
import {
  blokkIkon,
  blokkNavn,
  nyBlokk,
  nyId,
  type Blokk,
  type BlokkType,
  type Kort,
  type Nyhetsbrev,
  type Tema,
} from '../../../types/nyhetsbrev'
import { absoluttUrl, brevHtml, brevTekst, dokumentHtml } from '../../../utils/nyhetsbrevHtml'
import { bp, t } from './adminTokens'

/**
 * Editoren for ett nyhetsbrev.
 *
 * Venstre: blokkene i rekkefølge, der den valgte folder seg ut til et skjema.
 * Høyre: brevet slik mottakeren ser det – samme HTML som kopieres. Klikk på
 * en blokk i forhåndsvisningen velger den til venstre.
 *
 * Ingen «Lagre»-knapp. Alt lagres av seg selv et øyeblikk etter siste
 * endring, og statusen står øverst. Et utkast man glemmer å lagre er det
 * vanligste tapet i slike verktøy.
 *
 * Sending: «Kopier e-post» legger brevet på utklippstavla som formatert
 * tekst (HTML + ren tekst). Lim det inn i en ny e-post i Mail, sett emnet,
 * og lim mottakerne inn i Blindkopi – aldri Til, så ikke alle ser hverandres
 * adresser.
 */

const AKSENTER = ['#a8512c', '#3f7d52', '#1f4e79', '#1c1a18', '#8a6318']
const BAKGRUNNER = ['#f4efe8', '#f3f4f6', '#ffffff', '#eef2ec', '#1c1a18']
const TYPER: BlokkType[] = ['hero', 'overskrift', 'tekst', 'bilde', 'knapp', 'kort', 'kortpar', 'sitat', 'skille', 'avstand']

/** Bilder fra nettstedet, til bildevelgeren. */
const BILDER: string[] = Array.from(
  new Set([
    ...(produkter as { images?: { src: string }[] }[]).flatMap((p) => (p.images ?? []).map((i) => i.src)),
    '/images/featured/minio_gravering_3.webp',
    '/images/featured/gravering-deling.webp',
    '/images/featured/gravering-deling-generell.webp',
    '/images/featured/minio_curringb_engrave_1.webp',
    '/images/featured/minio_table_3.webp',
    '/images/featured/designer-preview.webp',
    '/images/byggeguider/hagebenk.webp',
    '/images/byggeguider/fuglehus.webp',
    '/images/byggeguider/pidestall.webp',
    '/images/planleggere/terrasse-inspirasjon.webp',
    '/images/planleggere/pergola-inspirasjon.webp',
    '/images/planleggere/carport-foto.webp',
    '/images/planleggere/utekjokken-foto.webp',
    '/images/hero/forside_1.webp',
    '/images/hero/forside_3.webp',
    '/images/hero/forside_4.webp',
    '/images/hero/forside_5.webp',
    '/images/hero/forside_6.webp',
    '/images/hero/forside_7.webp',
    '/images/hero/carport-elbil-forside.webp',
    '/images/hero/utekjokken-hage-forside.webp',
  ]),
)

type Lagring = 'lagret' | 'lagrer' | 'feil'
type Panel = 'innhold' | 'utseende'

function sammendrag(b: Blokk): string {
  switch (b.type) {
    case 'hero':
      return b.tittel
    case 'overskrift':
    case 'tekst':
    case 'sitat':
      return b.tekst.replace(/[*[\]]/g, '').slice(0, 60)
    case 'bilde':
      return b.alt || b.url.split('/').pop() || 'Uten bilde'
    case 'knapp':
      return b.tekst
    case 'kort':
      return b.tittel
    case 'kortpar':
      return `${b.venstre.tittel} · ${b.hoyre.tittel}`
    case 'avstand':
      return `${b.hoyde} px`
    default:
      return ''
  }
}

/** Kopierer HTML som formatert tekst, så Mail limer det inn som et ferdig brev. */
async function kopierFormatert(html: string, tekst: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([tekst], { type: 'text/plain' }),
        }),
      ])
      return true
    }
  } catch {
    /* Faller tilbake til markering under. */
  }
  // Eldre nettlesere: legg brevet i et usynlig element, marker det og kopier –
  // akkurat det som skjer når man markerer og trykker ⌘C selv.
  const boks = document.createElement('div')
  boks.style.cssText = 'position:fixed;left:-9999px;top:0;'
  boks.innerHTML = html
  document.body.appendChild(boks)
  const utvalg = window.getSelection()
  const omrade = document.createRange()
  omrade.selectNodeContents(boks)
  utvalg?.removeAllRanges()
  utvalg?.addRange(omrade)
  const ok = document.execCommand('copy')
  utvalg?.removeAllRanges()
  boks.remove()
  return ok
}

export default function AdminNyhetsbrevEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [brev, settBrev] = useState<Nyhetsbrev | null>(null)
  const [fant, settFant] = useState(true)
  const [valgt, settValgt] = useState<string | null>(null)
  const [panel, settPanel] = useState<Panel>('innhold')
  const [visning, settVisning] = useState<'desktop' | 'mobil'>('desktop')
  const [lagring, settLagring] = useState<Lagring>('lagret')
  const [melding, settMelding] = useState<string | null>(null)
  const [mottakere, settMottakere] = useState<string[] | null>(null)
  const [leggTilApen, settLeggTilApen] = useState(false)
  const [dra, settDra] = useState<{ fra: number; over: number } | null>(null)
  const [hoyde, settHoyde] = useState(900)
  const ramme = useRef<HTMLIFrameElement>(null)
  const forsteLast = useRef(true)

  useEffect(() => {
    if (!id) return
    getNyhetsbrev(id)
      .then((b) => (b ? settBrev(b) : settFant(false)))
      .catch(() => settFant(false))
  }, [id])

  useEffect(() => {
    getAlleKontakter()
      .then((k) => settMottakere([...new Set(k.filter((x) => x.nyhetsbrev && x.epost).map((x) => x.epost))]))
      .catch(() => settMottakere([]))
  }, [])

  // Autolagring: et øyeblikk etter siste endring.
  useEffect(() => {
    if (!brev || !id) return
    if (forsteLast.current) {
      forsteLast.current = false
      return
    }
    const tid = setTimeout(() => {
      lagreNyhetsbrev(id, brev)
        .then(() => settLagring('lagret'))
        .catch(() => settLagring('feil'))
    }, 700)
    return () => clearTimeout(tid)
  }, [brev, id])

  // Klikk og høyde fra forhåndsvisningen.
  useEffect(() => {
    const motta = (e: MessageEvent) => {
      if (e.source !== ramme.current?.contentWindow) return
      const d = e.data as { nyhetsbrevBlokk?: string | null; nyhetsbrevHoyde?: number }
      if ('nyhetsbrevBlokk' in d && d.nyhetsbrevBlokk) {
        settValgt(d.nyhetsbrevBlokk)
        settPanel('innhold')
        document.getElementById(`blokk-${d.nyhetsbrevBlokk}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
      if (typeof d.nyhetsbrevHoyde === 'number') settHoyde(d.nyhetsbrevHoyde)
    }
    window.addEventListener('message', motta)
    return () => window.removeEventListener('message', motta)
  }, [])

  const forhandsvisning = useMemo(() => {
    if (!brev) return ''
    return dokumentHtml(brev, { forhandsvisning: true, valgt }).replace(
      '</body>',
      `<script>
        function m(){parent.postMessage({nyhetsbrevHoyde:document.documentElement.scrollHeight},'*')}
        window.addEventListener('load',m);new ResizeObserver(m).observe(document.body);
      </script></body>`,
    )
  }, [brev, valgt])

  const vis = useCallback((tekst: string) => {
    settMelding(tekst)
    setTimeout(() => settMelding((m) => (m === tekst ? null : m)), 3200)
  }, [])

  if (!fant) {
    return (
      <Tom>
        <p>Fant ikke dette nyhetsbrevet.</p>
        <Link to="/admin/kontakter/nyhetsbrev">Tilbake til nyhetsbrevene</Link>
      </Tom>
    )
  }
  if (!brev) {
    return (
      <Tom>
        <Icon name="faSpinner" spin />
      </Tom>
    )
  }

  const endre = (del: Partial<Nyhetsbrev>) => {
    settLagring('lagrer')
    settBrev((b) => (b ? { ...b, ...del } : b))
  }
  const endreTema = (del: Partial<Tema>) => endre({ tema: { ...brev.tema, ...del } })
  const endreBlokk = (bid: string, del: Partial<Blokk>) =>
    endre({ blokker: brev.blokker.map((b) => (b.id === bid ? ({ ...b, ...del } as Blokk) : b)) })

  const leggTil = (type: BlokkType) => {
    const ny = nyBlokk(type)
    const etter = valgt ? brev.blokker.findIndex((b) => b.id === valgt) : -1
    const blokker = [...brev.blokker]
    blokker.splice(etter >= 0 ? etter + 1 : blokker.length, 0, ny)
    endre({ blokker })
    settValgt(ny.id)
    settLeggTilApen(false)
  }

  const flytt = (fra: number, til: number) => {
    if (til < 0 || til >= brev.blokker.length || fra === til) return
    const blokker = [...brev.blokker]
    const [b] = blokker.splice(fra, 1)
    blokker.splice(til, 0, b)
    endre({ blokker })
  }

  const dupliser = (i: number) => {
    const kopi = { ...structuredClone(brev.blokker[i]), id: nyId() }
    const blokker = [...brev.blokker]
    blokker.splice(i + 1, 0, kopi)
    endre({ blokker })
    settValgt(kopi.id)
  }

  const fjern = (bid: string) => {
    endre({ blokker: brev.blokker.filter((b) => b.id !== bid) })
    if (valgt === bid) settValgt(null)
  }

  const kopierBrev = async () => {
    const ok = await kopierFormatert(brevHtml(brev), brevTekst(brev))
    vis(ok ? 'Brevet er kopiert. Lim det inn i en ny e-post i Mail (⌘V).' : 'Kunne ikke kopiere. Prøv i Safari eller Chrome.')
  }

  const kopierMottakere = async () => {
    if (!mottakere?.length) return vis('Ingen i kontaktlista har sagt ja til nyhetsbrev ennå.')
    await navigator.clipboard.writeText(mottakere.join(', '))
    vis(`${mottakere.length} adresser kopiert. Lim dem inn i Blindkopi (Bcc), ikke Til.`)
  }

  const kopierEmne = async () => {
    await navigator.clipboard.writeText(brev.emne)
    vis('Emnet er kopiert.')
  }

  const lastNed = () => {
    const blob = new Blob([dokumentHtml(brev)], { type: 'text/html' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${(brev.tittel || 'nyhetsbrev').toLowerCase().replace(/[^a-z0-9æøå]+/g, '-')}.html`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const slett = async () => {
    if (!id || !window.confirm(`Slette «${brev.tittel || 'dette brevet'}»? Det kan ikke angres.`)) return
    await slettNyhetsbrev(id)
    navigate('/admin/kontakter/nyhetsbrev')
  }

  return (
    <Skall>
      <Topp>
        <Tilbake to="/admin/kontakter/nyhetsbrev" aria-label="Tilbake til nyhetsbrevene">
          <Icon name="faArrowLeft" />
        </Tilbake>
        <Tittelfelt
          value={brev.tittel}
          onChange={(e) => endre({ tittel: e.target.value })}
          placeholder="Navn på utkastet"
          aria-label="Navn på utkastet"
        />
        <Status $feil={lagring === 'feil'}>
          {lagring === 'lagrer' ? 'Lagrer …' : lagring === 'feil' ? 'Ikke lagret' : 'Lagret'}
        </Status>
        <Toppknapper>
          <Diskret type="button" onClick={lastNed} title="Last ned som .html">
            <Icon name="faDownload" />
          </Diskret>
          <Diskret type="button" onClick={slett} title="Slett utkastet">
            <Icon name="faTrash" />
          </Diskret>
        </Toppknapper>
      </Topp>

      <Sendelinje>
        <Steg>
          <em>1</em>
          <Hovedknapp type="button" onClick={kopierBrev}>
            <Icon name="faCopy" /> Kopier e-post
          </Hovedknapp>
        </Steg>
        <Steg>
          <em>2</em>
          <Sideknapp type="button" onClick={kopierEmne} disabled={!brev.emne}>
            Kopier emne
          </Sideknapp>
        </Steg>
        <Steg>
          <em>3</em>
          <Sideknapp type="button" onClick={kopierMottakere} disabled={mottakere === null}>
            <Icon name="faUsers" /> Kopier mottakere {mottakere ? `(${mottakere.length})` : ''}
          </Sideknapp>
        </Steg>
        <Hint>Lim inn i en ny e-post i Mail. Mottakerne går i Blindkopi.</Hint>
      </Sendelinje>

      {melding && <Melding role="status">{melding}</Melding>}

      <Arbeidsflate>
        <Sidepanel>
          <Faner role="tablist">
            <Fane role="tab" aria-selected={panel === 'innhold'} $aktiv={panel === 'innhold'} onClick={() => settPanel('innhold')}>
              Innhold
            </Fane>
            <Fane role="tab" aria-selected={panel === 'utseende'} $aktiv={panel === 'utseende'} onClick={() => settPanel('utseende')}>
              Utseende
            </Fane>
          </Faner>

          {panel === 'innhold' ? (
            <>
              <Felt>
                <span>Emne</span>
                <input value={brev.emne} onChange={(e) => endre({ emne: e.target.value })} placeholder="Det mottakeren ser i innboksen" />
                <small>{brev.emne.length} tegn{brev.emne.length > 60 ? ' – kortere enn 60 vises helt på mobil' : ''}</small>
              </Felt>

              <Blokkliste>
                {brev.blokker.map((b, i) => (
                  <Blokkrad
                    key={b.id}
                    id={`blokk-${b.id}`}
                    $valgt={valgt === b.id}
                    $over={dra !== null && dra.over === i && dra.fra !== i}
                    onDragOver={(e) => {
                      if (!dra) return
                      e.preventDefault()
                      if (dra.over !== i) settDra({ ...dra, over: i })
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (dra) flytt(dra.fra, i)
                      settDra(null)
                    }}
                  >
                    <Blokkhode>
                      <Handtak
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move'
                          settDra({ fra: i, over: i })
                        }}
                        onDragEnd={() => settDra(null)}
                        aria-label="Dra for å flytte"
                      >
                        <Icon name="faGripVertical" />
                      </Handtak>
                      <Blokkvalg type="button" onClick={() => settValgt(valgt === b.id ? null : b.id)} aria-expanded={valgt === b.id}>
                        <Blokkikon>
                          <Icon name={blokkIkon[b.type]} />
                        </Blokkikon>
                        <span>
                          <strong>{blokkNavn[b.type]}</strong>
                          <small>{sammendrag(b)}</small>
                        </span>
                      </Blokkvalg>
                      <Radverktoy>
                        <button type="button" onClick={() => flytt(i, i - 1)} disabled={i === 0} aria-label="Flytt opp">
                          <Icon name="faArrowUp" />
                        </button>
                        <button type="button" onClick={() => flytt(i, i + 1)} disabled={i === brev.blokker.length - 1} aria-label="Flytt ned">
                          <Icon name="faArrowDown" />
                        </button>
                        <button type="button" onClick={() => dupliser(i)} aria-label="Dupliser">
                          <Icon name="faClone" />
                        </button>
                        <button type="button" onClick={() => fjern(b.id)} aria-label="Fjern">
                          <Icon name="faTrash" />
                        </button>
                      </Radverktoy>
                    </Blokkhode>
                    {valgt === b.id && (
                      <Skjema>
                        <BlokkSkjema blokk={b} endre={(del) => endreBlokk(b.id, del)} />
                      </Skjema>
                    )}
                  </Blokkrad>
                ))}
              </Blokkliste>

              {leggTilApen ? (
                <Leggtilgrid>
                  {TYPER.map((ty) => (
                    <button key={ty} type="button" onClick={() => leggTil(ty)}>
                      <Icon name={blokkIkon[ty]} />
                      <span>{blokkNavn[ty]}</span>
                    </button>
                  ))}
                </Leggtilgrid>
              ) : (
                <Leggtil type="button" onClick={() => settLeggTilApen(true)}>
                  <Icon name="faPlus" /> Legg til blokk{valgt ? ' under valgt' : ''}
                </Leggtil>
              )}
            </>
          ) : (
            <>
              <Felt>
                <span>Aksentfarge</span>
                <Farger>
                  {AKSENTER.map((f) => (
                    <Farge key={f} type="button" $farge={f} $valgt={brev.tema.aksent === f} onClick={() => endreTema({ aksent: f })} aria-label={f} />
                  ))}
                  <Fargevelger type="color" value={brev.tema.aksent} onChange={(e) => endreTema({ aksent: e.target.value })} aria-label="Egen farge" />
                </Farger>
              </Felt>
              <Felt>
                <span>Bakgrunn</span>
                <Farger>
                  {BAKGRUNNER.map((f) => (
                    <Farge key={f} type="button" $farge={f} $valgt={brev.tema.bakgrunn === f} onClick={() => endreTema({ bakgrunn: f })} aria-label={f} />
                  ))}
                </Farger>
              </Felt>
              <Felt>
                <span>Overskrifter</span>
                <Segment>
                  <button type="button" data-aktiv={brev.tema.overskriftFont === 'serif'} onClick={() => endreTema({ overskriftFont: 'serif' })} style={{ fontFamily: 'Georgia, serif' }}>
                    Serif
                  </button>
                  <button type="button" data-aktiv={brev.tema.overskriftFont === 'sans'} onClick={() => endreTema({ overskriftFont: 'sans' })}>
                    Sans
                  </button>
                </Segment>
              </Felt>
              <Bryter>
                <input type="checkbox" checked={brev.tema.visLogo} onChange={(e) => endreTema({ visLogo: e.target.checked })} />
                <span>Vis logo øverst</span>
              </Bryter>
              <Felt>
                <span>Bunntekst</span>
                <textarea rows={4} value={brev.bunntekst} onChange={(e) => endre({ bunntekst: e.target.value })} />
                <small>Si hvorfor de får brevet, og hvordan de melder seg av. Det er påkrevd.</small>
              </Felt>
            </>
          )}
        </Sidepanel>

        <Lerret>
          <Lerretstopp>
            <Segment>
              <button type="button" data-aktiv={visning === 'desktop'} onClick={() => settVisning('desktop')}>
                <Icon name="faDesktop" /> Skjerm
              </button>
              <button type="button" data-aktiv={visning === 'mobil'} onClick={() => settVisning('mobil')}>
                <Icon name="faMobileAlt" /> Mobil
              </button>
            </Segment>
          </Lerretstopp>
          <Innboks $mobil={visning === 'mobil'}>
            <Innbokshode>
              <strong>Minio</strong>
              <span>{brev.emne || 'Uten emne'}</span>
            </Innbokshode>
            <iframe
              ref={ramme}
              title="Forhåndsvisning"
              srcDoc={forhandsvisning}
              sandbox="allow-scripts"
              style={{ height: hoyde }}
            />
          </Innboks>
        </Lerret>
      </Arbeidsflate>
    </Skall>
  )
}

/* ---------- Skjema per blokk ---------- */

function BlokkSkjema({ blokk: b, endre }: { blokk: Blokk; endre: (del: Partial<Blokk>) => void }) {
  switch (b.type) {
    case 'hero':
      return (
        <>
          <Bildefelt verdi={b.bilde} endre={(bilde) => endre({ bilde })} />
          <Tekstfelt navn="Tittel" verdi={b.tittel} endre={(tittel) => endre({ tittel })} />
          <Tekstfelt navn="Ingress" verdi={b.tekst} endre={(tekst) => endre({ tekst })} flere />
          <Rad2>
            <Tekstfelt navn="Knappetekst" verdi={b.knappTekst} endre={(knappTekst) => endre({ knappTekst })} />
            <Tekstfelt navn="Lenke" verdi={b.knappUrl} endre={(knappUrl) => endre({ knappUrl })} />
          </Rad2>
        </>
      )
    case 'overskrift':
      return (
        <>
          <Tekstfelt navn="Tekst" verdi={b.tekst} endre={(tekst) => endre({ tekst })} />
          <Segment>
            <button type="button" data-aktiv={b.storrelse === 'stor'} onClick={() => endre({ storrelse: 'stor' })}>
              Stor
            </button>
            <button type="button" data-aktiv={b.storrelse === 'liten'} onClick={() => endre({ storrelse: 'liten' })}>
              Liten etikett
            </button>
          </Segment>
        </>
      )
    case 'tekst':
      return (
        <>
          <Tekstfelt navn="Tekst" verdi={b.tekst} endre={(tekst) => endre({ tekst })} flere rader={7} />
          <Hjelp>Blank linje gir nytt avsnitt. **fet**, *kursiv*, [lenketekst](https://…)</Hjelp>
        </>
      )
    case 'bilde':
      return (
        <>
          <Bildefelt verdi={b.url} endre={(url) => endre({ url })} />
          <Tekstfelt navn="Beskrivelse (alt-tekst)" verdi={b.alt} endre={(alt) => endre({ alt })} />
          <Rad2>
            <Tekstfelt navn="Lenke (valgfri)" verdi={b.lenke} endre={(lenke) => endre({ lenke })} />
            <Tekstfelt navn="Bildetekst (valgfri)" verdi={b.bildetekst} endre={(bildetekst) => endre({ bildetekst })} />
          </Rad2>
        </>
      )
    case 'knapp':
      return (
        <>
          <Rad2>
            <Tekstfelt navn="Tekst" verdi={b.tekst} endre={(tekst) => endre({ tekst })} />
            <Tekstfelt navn="Lenke" verdi={b.url} endre={(url) => endre({ url })} />
          </Rad2>
          <Segment>
            <button type="button" data-aktiv={b.stil === 'fylt'} onClick={() => endre({ stil: 'fylt' })}>
              Fylt
            </button>
            <button type="button" data-aktiv={b.stil === 'omriss'} onClick={() => endre({ stil: 'omriss' })}>
              Omriss
            </button>
          </Segment>
        </>
      )
    case 'kort':
      return <KortSkjema kort={b} endre={(del) => endre(del)} />
    case 'kortpar':
      return (
        <>
          <Undertittel>Venstre</Undertittel>
          <KortSkjema kort={b.venstre} endre={(del) => endre({ venstre: { ...b.venstre, ...del } })} />
          <Undertittel>Høyre</Undertittel>
          <KortSkjema kort={b.hoyre} endre={(del) => endre({ hoyre: { ...b.hoyre, ...del } })} />
        </>
      )
    case 'sitat':
      return (
        <>
          <Tekstfelt navn="Sitat" verdi={b.tekst} endre={(tekst) => endre({ tekst })} flere />
          <Tekstfelt navn="Hvem (valgfri)" verdi={b.kilde} endre={(kilde) => endre({ kilde })} />
        </>
      )
    case 'avstand':
      return (
        <Felt>
          <span>Høyde: {b.hoyde} px</span>
          <input type="range" min={8} max={80} step={4} value={b.hoyde} onChange={(e) => endre({ hoyde: Number(e.target.value) })} />
        </Felt>
      )
    case 'skille':
      return <Hjelp>En tynn linje som skiller to deler av brevet.</Hjelp>
  }
}

function KortSkjema({ kort, endre }: { kort: Kort; endre: (del: Partial<Kort>) => void }) {
  return (
    <>
      <Bildefelt verdi={kort.bilde} endre={(bilde) => endre({ bilde })} />
      <Tekstfelt navn="Tittel" verdi={kort.tittel} endre={(tittel) => endre({ tittel })} />
      <Tekstfelt navn="Tekst" verdi={kort.tekst} endre={(tekst) => endre({ tekst })} flere rader={2} />
      <Rad2>
        <Tekstfelt navn="Lenketekst" verdi={kort.lenkeTekst} endre={(lenkeTekst) => endre({ lenkeTekst })} />
        <Tekstfelt navn="Lenke" verdi={kort.url} endre={(url) => endre({ url })} />
      </Rad2>
    </>
  )
}

function Tekstfelt({
  navn,
  verdi,
  endre,
  flere,
  rader = 3,
}: {
  navn: string
  verdi: string
  endre: (v: string) => void
  flere?: boolean
  rader?: number
}) {
  return (
    <Felt>
      <span>{navn}</span>
      {flere ? (
        <textarea rows={rader} value={verdi} onChange={(e) => endre(e.target.value)} />
      ) : (
        <input value={verdi} onChange={(e) => endre(e.target.value)} />
      )}
    </Felt>
  )
}

function Bildefelt({ verdi, endre }: { verdi: string; endre: (v: string) => void }) {
  const [apen, settApen] = useState(false)
  return (
    <Felt>
      <span>Bilde</span>
      <Bilderad>
        <Miniatyr $bilde={verdi ? absoluttUrl(verdi) : ''} />
        <input value={verdi} onChange={(e) => endre(e.target.value)} placeholder="/images/… eller https://…" />
        <Sideknapp type="button" onClick={() => settApen((a) => !a)}>
          {apen ? 'Lukk' : 'Velg'}
        </Sideknapp>
      </Bilderad>
      {apen && (
        <Bildegrid>
          {BILDER.map((src) => (
            <button
              key={src}
              type="button"
              data-valgt={src === verdi}
              onClick={() => {
                endre(src)
                settApen(false)
              }}
              style={{ backgroundImage: `url(${src})` }}
              aria-label={src}
            />
          ))}
        </Bildegrid>
      )}
      <small>Bilder fra nettstedet fungerer best. Egne bilder må ligge på en offentlig adresse.</small>
    </Felt>
  )
}

/* ---------- Stiler ---------- */

const Skall = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`

const Tom = styled.div`
  display: grid;
  place-items: center;
  gap: 0.6rem;
  min-height: 40vh;
  color: ${t.dempet};

  a {
    color: ${t.aksent};
  }
`

const Topp = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
`

const Tilbake = styled(Link)`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 1px solid ${t.kant};
  border-radius: 10px;
  background: ${t.flate};
  color: ${t.blekk};
  font-size: 0.85rem;

  &:hover {
    border-color: ${t.svak};
  }
`

const Tittelfelt = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.35rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: ${t.blekk};

  &:hover {
    border-color: ${t.kant};
  }
  &:focus {
    outline: none;
    border-color: ${t.aksent};
    background: ${t.flate};
  }
`

const Status = styled.span<{ $feil: boolean }>`
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ $feil }) => ($feil ? t.fare : t.svak)};
`

const Toppknapper = styled.div`
  display: flex;
  gap: 0.3rem;
`

const Diskret = styled.button`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid ${t.kant};
  border-radius: 10px;
  background: ${t.flate};
  color: ${t.dempet};
  font-size: 0.82rem;
  cursor: pointer;

  &:hover {
    color: ${t.blekk};
    border-color: ${t.svak};
  }
`

const Sendelinje = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  background: ${t.flate};
`

const Steg = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;

  em {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${t.senket};
    border: 1px solid ${t.kant};
    font-style: normal;
    font-size: 0.7rem;
    font-weight: 700;
    color: ${t.dempet};
  }
`

const knappBase = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 36px;
  padding: 0 0.95rem;
  border-radius: 999px;
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;

  svg { font-size: 0.78rem; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`

const Hovedknapp = styled.button`
  ${knappBase}
  border: none;
  background: ${t.blekk};
  color: #fff;

  &:hover:not(:disabled) {
    background: #000;
  }
`

const Sideknapp = styled.button`
  ${knappBase}
  border: 1px solid ${t.kant};
  background: ${t.flate};
  color: ${t.blekk};

  &:hover:not(:disabled) {
    border-color: ${t.svak};
  }
`

const Hint = styled.span`
  margin-left: auto;
  font-size: 0.78rem;
  color: ${t.dempet};

  @media (max-width: ${bp.mobil}) {
    margin-left: 0;
    flex-basis: 100%;
  }
`

const Melding = styled.div`
  position: fixed;
  left: 50%;
  bottom: calc(1.4rem + env(safe-area-inset-bottom, 0px));
  z-index: 60;
  transform: translateX(-50%);
  max-width: calc(100vw - 2rem);
  padding: 0.7rem 1.1rem;
  border-radius: 12px;
  background: ${t.blekk};
  color: #fff;
  font-size: 0.86rem;
  font-weight: 500;
  box-shadow: 0 12px 30px -10px rgba(17, 24, 39, 0.5);
`

const Arbeidsflate = styled.div`
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const Sidepanel = styled.div`
  position: sticky;
  top: 76px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-height: calc(100dvh - 96px);
  overflow-y: auto;
  padding: 0.9rem;
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  background: ${t.flate};

  @media (max-width: 1100px) {
    position: static;
    max-height: none;
  }
`

const Faner = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 3px;
  border-radius: 10px;
  background: ${t.senket};
  border: 1px solid ${t.kantSvak};
`

const Fane = styled.button<{ $aktiv: boolean }>`
  padding: 0.45rem;
  border: none;
  border-radius: 8px;
  background: ${({ $aktiv }) => ($aktiv ? t.flate : 'transparent')};
  box-shadow: ${({ $aktiv }) => ($aktiv ? '0 1px 2px rgba(17,24,39,.08)' : 'none')};
  color: ${({ $aktiv }) => ($aktiv ? t.blekk : t.dempet)};
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
`

const Felt = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  > span {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${t.svak};
  }
  input:not([type='range']):not([type='color']):not([type='checkbox']),
  textarea {
    width: 100%;
    padding: 0.55rem 0.65rem;
    border: 1px solid ${t.kant};
    border-radius: 9px;
    background: ${t.flate};
    font-family: inherit;
    font-size: 0.88rem;
    line-height: 1.45;
    color: ${t.blekk};
    resize: vertical;
    box-sizing: border-box;
  }
  input:focus,
  textarea:focus {
    outline: none;
    border-color: ${t.aksent};
    box-shadow: 0 0 0 3px ${t.aksentSvak};
  }
  small {
    font-size: 0.74rem;
    line-height: 1.4;
    color: ${t.dempet};
  }
`

const Rad2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
`

const Hjelp = styled.p`
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.45;
  color: ${t.dempet};
`

const Undertittel = styled.p`
  margin: 0.3rem 0 -0.2rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${t.blekk};
`

const Blokkliste = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`

const Blokkrad = styled.div<{ $valgt: boolean; $over: boolean }>`
  border: 1px solid ${({ $valgt }) => ($valgt ? t.aksent : t.kant)};
  border-radius: 11px;
  background: ${({ $valgt }) => ($valgt ? t.flate : t.senket)};
  box-shadow: ${({ $over, $valgt }) =>
    $over ? `0 -3px 0 0 ${t.aksent}` : $valgt ? `0 0 0 3px ${t.aksentSvak}` : 'none'};
  transition: box-shadow 0.12s, border-color 0.12s;
`

const Blokkhode = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.3rem 0.35rem 0.3rem 0.2rem;

  &:hover > div:last-child {
    opacity: 1;
  }
`

const Handtak = styled.span`
  display: grid;
  place-items: center;
  width: 22px;
  height: 32px;
  color: ${t.svak};
  font-size: 0.75rem;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`

const Blokkvalg = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
  min-width: 0;
  padding: 0.25rem 0.2rem;
  border: none;
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  > span {
    min-width: 0;
  }
  strong {
    display: block;
    font-size: 0.85rem;
    color: ${t.blekk};
  }
  small {
    display: block;
    font-size: 0.75rem;
    color: ${t.dempet};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const Blokkikon = styled.span`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: ${t.flate};
  border: 1px solid ${t.kant};
  color: ${t.dempet};
  font-size: 0.75rem;
`

const Radverktoy = styled.div`
  display: flex;
  opacity: 0.55;
  transition: opacity 0.12s;

  button {
    display: grid;
    place-items: center;
    width: 26px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: none;
    color: ${t.dempet};
    font-size: 0.7rem;
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    background: ${t.kantSvak};
    color: ${t.blekk};
  }
  button:disabled {
    opacity: 0.3;
    cursor: default;
  }

  @media (hover: none) {
    opacity: 1;
  }
`

const Skjema = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.4rem 0.8rem 0.9rem;
  border-top: 1px solid ${t.kantSvak};
`

const Leggtil = styled.button`
  ${knappBase}
  width: 100%;
  min-height: 42px;
  border: 1.5px dashed ${t.kant};
  border-radius: 11px;
  background: none;
  color: ${t.dempet};

  &:hover {
    border-color: ${t.aksent};
    color: ${t.aksent};
  }
`

const Leggtilgrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.4rem;

  button {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.6rem 0.7rem;
    border: 1px solid ${t.kant};
    border-radius: 10px;
    background: ${t.flate};
    font-family: inherit;
    font-size: 0.83rem;
    font-weight: 600;
    color: ${t.blekk};
    cursor: pointer;
  }
  button:hover {
    border-color: ${t.aksent};
    color: ${t.aksent};
  }
  svg {
    width: 14px;
    font-size: 0.78rem;
    color: ${t.svak};
  }
`

const Farger = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`

const Farge = styled.button<{ $farge: string; $valgt: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid rgba(17, 24, 39, 0.12);
  background: ${({ $farge }) => $farge};
  box-shadow: ${({ $valgt }) => ($valgt ? `0 0 0 2px #fff, 0 0 0 4px ${t.blekk}` : 'none')};
  cursor: pointer;
`

const Fargevelger = styled.input`
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
`

const Segment = styled.div`
  display: inline-flex;
  padding: 3px;
  border-radius: 10px;
  background: ${t.senket};
  border: 1px solid ${t.kantSvak};
  align-self: flex-start;

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.38rem 0.8rem;
    border: none;
    border-radius: 7px;
    background: none;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    color: ${t.dempet};
    cursor: pointer;
  }
  button[data-aktiv='true'] {
    background: ${t.flate};
    color: ${t.blekk};
    box-shadow: 0 1px 2px rgba(17, 24, 39, 0.08);
  }
  svg {
    font-size: 0.75rem;
  }
`

const Bryter = styled.label`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: ${t.blekk};
  cursor: pointer;

  input {
    width: 16px;
    height: 16px;
    accent-color: ${t.aksent};
  }
`

const Bilderad = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`

const Miniatyr = styled.span<{ $bilde: string }>`
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid ${t.kant};
  background: ${({ $bilde }) => ($bilde ? `url(${$bilde}) center / cover` : t.senket)};
`

const Bildegrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
  max-height: 230px;
  overflow-y: auto;
  padding: 0.35rem;
  border: 1px solid ${t.kant};
  border-radius: 10px;
  background: ${t.senket};

  button {
    aspect-ratio: 1;
    border: 2px solid transparent;
    border-radius: 7px;
    background-size: cover;
    background-position: center;
    cursor: pointer;
  }
  button:hover {
    border-color: ${t.svak};
  }
  button[data-valgt='true'] {
    border-color: ${t.aksent};
  }
`

const Lerret = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
  padding: 1rem;
  border-radius: ${t.radius};
  background: repeating-linear-gradient(45deg, #eceef1 0 10px, #e9ebef 10px 20px);
  border: 1px solid ${t.kant};

  @media (max-width: ${bp.smal}) {
    padding: 0.5rem;
  }
`

const Lerretstopp = styled.div`
  display: flex;
  justify-content: center;
`

const Innboks = styled.div<{ $mobil: boolean }>`
  width: 100%;
  max-width: ${({ $mobil }) => ($mobil ? '390px' : '720px')};
  border-radius: ${({ $mobil }) => ($mobil ? '28px' : '12px')};
  overflow: hidden;
  background: #fff;
  box-shadow: 0 20px 50px -24px rgba(17, 24, 39, 0.35), 0 0 0 1px rgba(17, 24, 39, 0.06);
  transition: max-width 0.25s ease, border-radius 0.25s ease;

  iframe {
    display: block;
    width: 100%;
    border: 0;
  }
`

const Innbokshode = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid ${t.kantSvak};

  strong {
    font-size: 0.82rem;
    color: ${t.blekk};
  }
  span {
    font-size: 0.9rem;
    font-weight: 600;
    color: ${t.blekk};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`
