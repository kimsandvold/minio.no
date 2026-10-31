import { useMemo, useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { SNOLAST_KOMMUNER } from '../../../designer/snolast-data'
import { ANNEN_KOMMUNE, GRUNN_VALG, frostForConfig, frostsoneForConfig, grunnForConfig, lesByggested, snolastForConfig, type Byggested } from '../../../designer/byggested'
import { FROSTSONER, type Frostsone, type Grunn } from '../../../designer/fundament'
import type { DesignConfig } from '../../../designer/types'

/**
 * «Byggested»: kommune + høyde over havet (+ manuell snølast under
 * «Avansert»), frostsone (avledet fra kommune, kan overstyres) og
 * grunnforhold. Felles for alle produkter – skriver c.kommune / c.moh / c.sk /
 * c.frostsone / c.grunn, som templatene leser via `snolastForConfig()`,
 * `frostForConfig()` og `grunnForConfig()`.
 */

const fmt1 = (v: number) => v.toFixed(1).replace('.', ',')
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')

const STATUS: Record<string, { tekst: string; tone: 'ok' | 'adv' | 'noy' }> = {
  manuell: { tekst: 'Oppgitt av deg', tone: 'noy' },
  tabell: { tekst: 'Fra tabell', tone: 'ok' },
  'tabell-konservativ-hoyde': { tekst: 'Forenklet høyde', tone: 'adv' },
  reserve: { tekst: 'Standardverdi', tone: 'adv' },
}

interface Props {
  config: DesignConfig
  onChange: (b: Byggested) => void
  disabled?: boolean
}

export default function ByggestedPanel({ config, onChange, disabled }: Props) {
  const b = lesByggested(config)
  const sno = useMemo(() => snolastForConfig(config), [config])
  const sone = useMemo(() => frostsoneForConfig(config), [config])
  const grunn = grunnForConfig(config)
  const frostDekt = useMemo(() => frostForConfig(config, { snofri: false }), [config])
  const frostFri = useMemo(() => frostForConfig(config, { snofri: true }), [config])
  const [frostInfo, setFrostInfo] = useState(false)
  const autoSone = frostsoneForConfig({ ...config, frostsone: '' })
  const [sok, setSok] = useState('')
  const [apen, setApen] = useState(false)
  const [info, setInfo] = useState(false)
  const [avansert, setAvansert] = useState(b.sk !== undefined)
  const [visMerknader, setVisMerknader] = useState(false)
  const boksRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!apen) return
    const ned = (e: PointerEvent) => { if (!boksRef.current?.contains(e.target as Node)) setApen(false) }
    document.addEventListener('pointerdown', ned)
    return () => document.removeEventListener('pointerdown', ned)
  }, [apen])

  const treff = useMemo(() => {
    const q = norm(sok.trim())
    const alle = [...SNOLAST_KOMMUNER].sort((x, y) => x.kommune.localeCompare(y.kommune, 'nb'))
    return q ? alle.filter((k) => norm(k.kommune).includes(q)) : alle
  }, [sok])

  const kommuneTekst = b.kommune === ANNEN_KOMMUNE ? 'Annen kommune / vet ikke' : b.kommune ?? ''
  const velg = (k: string | undefined) => {
    onChange({ ...b, kommune: k })
    setSok('')
    setApen(false)
  }
  const status = STATUS[sno.status] ?? STATUS.reserve
  const stedTekst = [b.kommune === ANNEN_KOMMUNE ? 'Annen kommune' : b.kommune, b.moh !== undefined ? `${b.moh} moh` : ''].filter(Boolean).join(', ')

  return (
    <Wrap>
      <Rad>
        <Felt ref={boksRef} style={{ flex: 1.6 }}>
          <Lbl htmlFor="byggested-kommune">Kommune</Lbl>
          <Combo $open={apen}>
            <Icon name="faLocationDot" />
            <input
              id="byggested-kommune"
              role="combobox"
              aria-expanded={apen}
              aria-controls="byggested-liste"
              autoComplete="off"
              disabled={disabled}
              placeholder={kommuneTekst || 'Søk kommune …'}
              value={apen ? sok : kommuneTekst}
              onFocus={() => { setApen(true); setSok('') }}
              onChange={(e) => { setSok(e.target.value); setApen(true) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && treff[0]) velg(treff[0].kommune)
                if (e.key === 'Escape') setApen(false)
              }}
            />
            {b.kommune && !apen && (
              <Nullstill type="button" onClick={() => velg(undefined)} aria-label="Fjern kommune"><Icon name="faXmark" /></Nullstill>
            )}
          </Combo>
          {apen && (
            <Liste id="byggested-liste" role="listbox">
              {treff.slice(0, 40).map((k) => (
                <li key={k.kommune} role="option" aria-selected={b.kommune === k.kommune}>
                  <button type="button" onClick={() => velg(k.kommune)}>
                    <span>{k.kommune}</span>
                    <em>{fmt1(k.sk0)} kN/m²</em>
                  </button>
                </li>
              ))}
              <li role="option" aria-selected={b.kommune === ANNEN_KOMMUNE}>
                <button type="button" onClick={() => velg(ANNEN_KOMMUNE)}>
                  <span>Annen kommune / vet ikke</span>
                  <em>konservativ</em>
                </button>
              </li>
            </Liste>
          )}
        </Felt>
        <Felt style={{ flex: 1 }}>
          <Lbl htmlFor="byggested-moh">Høyde over havet</Lbl>
          <Tall>
            <input
              id="byggested-moh"
              type="number"
              inputMode="numeric"
              min={0}
              max={2500}
              step={10}
              disabled={disabled}
              placeholder="f.eks. 150"
              value={b.moh ?? ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : Math.max(0, Math.min(2500, Math.round(Number(e.target.value))))
                onChange({ ...b, moh: Number.isFinite(v) ? v : undefined })
              }}
            />
            <span>moh</span>
          </Tall>
        </Felt>
      </Rad>

      <Resultat $tone={status.tone}>
        <ResTopp>
          <Icon name="faSnowflake" />
          <span>Snølast på mark</span>
          <b>{fmt1(sno.sk)} kN/m²</b>
          <InfoBtn type="button" onClick={() => setInfo((v) => !v)} aria-expanded={info} aria-label="Hvorfor betyr dette noe?" title="Hvorfor betyr dette noe?">
            <Icon name="faCircleInfo" />
          </InfoBtn>
        </ResTopp>
        <ResSub>
          <Chip $tone={status.tone}>{status.tekst}</Chip>
          {stedTekst && <span>{stedTekst}</span>}
        </ResSub>
        {info && (
          <Forklaring>
            Snølasten avgjør hvor kraftige sperrer, dragere og stolper må være. Den varierer mye i Norge – fra 1,5 kN/m² ved kysten til over 6 kN/m² i innlandet og på fjellet – og øker med høyden over havet. Velg kommunen og høyden der du skal bygge, så dimensjoneres konstruksjonen og byggeplanen for akkurat ditt sted.
          </Forklaring>
        )}
        {sno.merknader.length > 0 && (
          <>
            <MerkBtn type="button" onClick={() => setVisMerknader((v) => !v)} aria-expanded={visMerknader}>
              <Icon name={visMerknader ? 'faChevronUp' : 'faChevronDown'} /> Forutsetninger ({sno.merknader.length})
            </MerkBtn>
            {visMerknader && <Merknader>{sno.merknader.map((m, i) => <li key={i}>{m}</li>)}</Merknader>}
          </>
        )}
      </Resultat>

      <Rad>
        <Felt style={{ flex: 1 }}>
          <Lbl htmlFor="byggested-frost">Klima (frost)</Lbl>
          <Velg
            id="byggested-frost"
            disabled={disabled}
            value={b.frostsone ?? ''}
            onChange={(e) => onChange({ ...b, frostsone: (e.target.value || undefined) as Frostsone | undefined })}
          >
            <option value="">Auto – {FROSTSONER[autoSone.sone].navn.split(' (')[0].toLowerCase()}</option>
            {(Object.keys(FROSTSONER) as Frostsone[]).map((k) => (
              <option key={k} value={k}>{FROSTSONER[k].navn}</option>
            ))}
          </Velg>
        </Felt>
        <Felt style={{ flex: 1 }}>
          <Lbl htmlFor="byggested-grunn">Grunnforhold</Lbl>
          <Velg
            id="byggested-grunn"
            disabled={disabled}
            value={b.grunn ?? 'ukjent'}
            onChange={(e) => onChange({ ...b, grunn: e.target.value === 'ukjent' ? undefined : (e.target.value as Grunn) })}
          >
            {GRUNN_VALG.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
            {b.grunn && !GRUNN_VALG.some((g) => g.id === b.grunn) && <option value={b.grunn}>{b.grunn}</option>}
          </Velg>
        </Felt>
      </Rad>

      <Resultat $tone={sone.kilde === 'standard' || grunn === 'ukjent' ? 'adv' : 'ok'}>
        <ResTopp>
          <Icon name="faLayerGroup" />
          <span>Frostfri fundamentdybde</span>
          <b>{frostDekt.telefarlig ? `${fmt1(frostDekt.anbefaltDybdeM)}–${fmt1(frostFri.anbefaltDybdeM)} m` : `${fmt1(frostDekt.anbefaltDybdeM)} m`}</b>
          <InfoBtn type="button" onClick={() => setFrostInfo((v) => !v)} aria-expanded={frostInfo} aria-label="Om frostdybde" title="Om frostdybde">
            <Icon name="faCircleInfo" />
          </InfoBtn>
        </ResTopp>
        <ResSub>
          <Chip $tone={sone.kilde === 'standard' ? 'adv' : sone.kilde === 'manuell' ? 'noy' : 'ok'}>{sone.kilde === 'manuell' ? 'Valgt' : sone.kilde === 'kommune' ? 'Fra kommune' : 'Standard'}</Chip>
          <span>{frostDekt.telefarlig ? 'snødekt – måkt/under tak' : 'ikke telefarlig grunn'}</span>
        </ResSub>
        {frostInfo && (
          <Forklaring>
            {frostDekt.telefarlig
              ? `På telefarlig grunn må fundamentene ned under frostdybden, ellers løfter telen dem. Med naturlig snødekke holder ${fmt1(frostDekt.anbefaltDybdeM)} m; der snøen måkes bort eller under tak/høye dekker trengs ${fmt1(frostFri.anbefaltDybdeM)} m. `
              : 'Drenert grus/sand og fjell gir ikke telehiv, så fundamentene trenger ikke ned til frostdybden – men massene må være telefrie hele veien ned. '}
            Alternativ: grunnere fundament frostsikret med markisolasjon (XPS) etter Byggforsk 521.111, eller utskifting til drenert pukk. Frostsonen er forenklet – sjekk frostmengden (F10) for kommunen din.
          </Forklaring>
        )}
      </Resultat>

      <Avansert>
        <AvansertBtn type="button" onClick={() => setAvansert((v) => !v)} aria-expanded={avansert}>
          <Icon name={avansert ? 'faChevronUp' : 'faChevronDown'} /> Avansert – oppgi snølast selv
        </AvansertBtn>
        {avansert && (
          <AvansertBody>
            <p>Har du snølasten fra kommunen (sk, kN/m²)? Den overstyrer tabellverdien.</p>
            <Tall>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={15}
                step={0.1}
                disabled={disabled}
                aria-label="Snølast på mark, kN/m²"
                placeholder="f.eks. 4,5"
                value={b.sk ?? ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(',', '.')
                  const v = raw === '' ? undefined : Math.round(Math.max(0, Math.min(15, Number(raw))) * 10) / 10
                  onChange({ ...b, sk: v && v > 0 ? v : undefined })
                }}
              />
              <span>kN/m²</span>
              {b.sk !== undefined && (
                <Nullstill type="button" onClick={() => onChange({ ...b, sk: undefined })} aria-label="Fjern manuell snølast"><Icon name="faXmark" /></Nullstill>
              )}
            </Tall>
          </AvansertBody>
        )}
      </Avansert>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`
const Rad = styled.div`
  display: flex;
  gap: 0.6rem;
  @media (max-width: 360px) { flex-direction: column; }
`
const Felt = styled.div`
  position: relative;
  min-width: 0;
`
const Lbl = styled.label`
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #a8afb9;
`
const inputCss = `
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 0.88rem;
  outline: none;
  padding: 0.55rem 0;
  &::placeholder { color: #7c848e; }
`
const Combo = styled.div<{ $open: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0 0.6rem;
  border-radius: 9px;
  border: 1px solid ${({ $open }) => ($open ? '#e7eaef' : 'rgba(255,255,255,0.14)')};
  background: rgba(255, 255, 255, 0.04);
  color: #979fa9;
  font-size: 0.8rem;
  input { ${inputCss} }
`
const Tall = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0 0.6rem;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  &:focus-within { border-color: #e7eaef; }
  input { ${inputCss} font-variant-numeric: tabular-nums; -moz-appearance: textfield; }
  input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  span { font-size: 0.75rem; color: #838b95; }
`
const Nullstill = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  padding: 0.25rem;
  border: none;
  background: none;
  color: #838b95;
  cursor: pointer;
  &:hover { color: #fff; }
`
const Liste = styled.ul`
  position: absolute;
  z-index: 30;
  left: 0;
  min-width: 250px;
  top: calc(100% + 4px);
  max-height: 240px;
  overflow-y: auto;
  margin: 0;
  padding: 0.3rem;
  list-style: none;
  border-radius: 10px;
  background: #212429;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45);
  button {
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    border: none;
    border-radius: 7px;
    background: none;
    color: #e7eaef;
    font-size: 0.84rem;
    cursor: pointer;
    text-align: left;
    &:hover { background: rgba(255, 255, 255, 0.08); }
  }
  li[aria-selected='true'] button { background: rgba(91, 99, 196, 0.22); }
  em { font-style: normal; font-size: 0.74rem; color: #838b95; font-variant-numeric: tabular-nums; }
`
const tone = (t: 'ok' | 'adv' | 'noy') => (t === 'ok' ? '#6fc28f' : t === 'adv' ? '#e0a845' : '#b9bff0')
const Resultat = styled.div<{ $tone: 'ok' | 'adv' | 'noy' }>`
  padding: 0.75rem 0.85rem;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-left: 3px solid ${({ $tone }) => tone($tone)};
`
const ResTopp = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #d9dde3;
  font-size: 0.85rem;
  svg { color: #b9bff0; }
  b { margin-left: auto; color: #fff; font-size: 1.05rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
`
const InfoBtn = styled.button`
  display: inline-flex;
  padding: 0.15rem;
  border: none;
  background: none;
  color: #838b95;
  cursor: pointer;
  &:hover, &[aria-expanded='true'] { color: #fff; }
`
const ResSub = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.45rem;
  font-size: 0.76rem;
  color: #a8afb9;
`
const Chip = styled.span<{ $tone: 'ok' | 'adv' | 'noy' }>`
  white-space: nowrap;
  flex-shrink: 0;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ $tone }) => tone($tone)};
  background: rgba(255, 255, 255, 0.06);
`
const Forklaring = styled.p`
  margin: 0.6rem 0 0;
  font-size: 0.78rem;
  line-height: 1.5;
  color: #c1c8d1;
`
const MerkBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.55rem;
  padding: 0;
  border: none;
  background: none;
  color: #9aa2ac;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { color: #fff; }
`
const Merknader = styled.ul`
  margin: 0.45rem 0 0;
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  li { font-size: 0.74rem; line-height: 1.45; color: #a8afb9; }
`
const Avansert = styled.div``
const Velg = styled.select`
  width: 100%;
  min-width: 0;
  padding: 0.55rem 0.5rem;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 0.84rem;
  outline: none;
  &:focus { border-color: #e7eaef; }
  option { background: #212429; color: #e7eaef; }
`
const AvansertBtn = styled(MerkBtn)`
  margin-top: 0;
`
const AvansertBody = styled.div`
  margin-top: 0.55rem;
  p { margin: 0 0 0.5rem; font-size: 0.75rem; line-height: 1.45; color: #9aa2ac; }
`
