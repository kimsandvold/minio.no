import { useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { statikkOppsummering, type Beregningsgrunnlag, type BeregningKontroll } from '../../../designer/plan-typer'

/**
 * «Statikk»: utnyttelsesgrad per bærende del fra templatets
 * `beregningsgrunnlag()` – grønn < 85 %, gul 85–100 %, rød > 100 %.
 * Viser den styrende kontrollen per komponent; klikk for alle kontroller.
 */

const farge = (u: number) => (u > 1 ? '#e8756b' : u > 0.85 ? '#e0a845' : '#6fc28f')
const pst = (u: number) => `${Math.round(u * 100)} %`

export default function StatikkPanel({ grunnlag }: { grunnlag: Beregningsgrunnlag }) {
  const [alle, setAlle] = useState(false)
  const grupper = new Map<string, BeregningKontroll[]>()
  for (const k of grunnlag.kontroller) {
    const key = `${k.pos ?? ''}|${k.komponent}`
    const g = grupper.get(key) ?? []
    g.push(k)
    grupper.set(key, g)
  }
  const sum = statikkOppsummering(grunnlag)
  const sno = grunnlag.laster.find((l) => /snø/i.test(l.navn))
  return (
    <Wrap>
      {sum && (
        <Topp $u={sum.maks}>
          <Icon name={sum.feil ? 'faTriangleExclamation' : 'faCircleCheck'} />
          <div>
            <b>{sum.feil ? `${sum.feil} kontroll${sum.feil > 1 ? 'er' : ''} over 100 %` : 'Alle kontroller OK'}</b>
            <span>Høyeste utnyttelse {pst(sum.maks)}{sno ? ` · ${sno.navn.toLowerCase()} ${sno.verdi.toFixed(2).replace('.', ',')} ${sno.enhet}` : ''}</span>
          </div>
        </Topp>
      )}
      <Liste>
        {[...grupper.values()].map((g) => {
          const styrende = [...g].sort((a, b) => b.utnyttelse - a.utnyttelse)
          const vis = alle ? styrende : styrende.slice(0, 1)
          return vis.map((k, i) => (
            <Rad key={`${k.komponent}-${k.kontroll}-${i}`} title={[k.krav, k.detalj, k.kommentar].filter(Boolean).join(' · ')}>
              <RadTopp>
                <span>
                  {k.pos && <Pos>{k.pos}</Pos>}
                  {i === 0 ? k.komponent : ''} <em>{k.tverrsnitt}{k.kvalitet ? ` ${k.kvalitet}` : ''}</em>
                </span>
                <b style={{ color: farge(k.utnyttelse) }}>{pst(k.utnyttelse)}</b>
              </RadTopp>
              <Bar><i style={{ width: `${Math.min(100, k.utnyttelse * 100)}%`, background: farge(k.utnyttelse) }} /></Bar>
              <Under>{k.kontroll}{k.spennMm ? ` · spenn ${(k.spennMm / 1000).toFixed(2).replace('.', ',')} m` : ''}{k.ccMm ? ` · c/c ${k.ccMm}` : ''}</Under>
            </Rad>
          ))
        })}
      </Liste>
      <Lenke type="button" onClick={() => setAlle((v) => !v)}>
        <Icon name={alle ? 'faChevronUp' : 'faChevronDown'} /> {alle ? 'Vis bare styrende kontroll' : `Vis alle ${grunnlag.kontroller.length} kontroller`}
      </Lenke>
      <Note>Forenklet kontroll etter Eurokode 5 (NS-EN 1995-1-1) for gjeldende mål og byggested. Full utregning følger byggeplanen.</Note>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`
const Topp = styled.div<{ $u: number }>`
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  padding: 0.65rem 0.8rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border-left: 3px solid ${({ $u }) => farge($u)};
  svg { margin-top: 0.15rem; color: ${({ $u }) => farge($u)}; }
  b { display: block; font-size: 0.86rem; color: #fff; }
  span { font-size: 0.75rem; color: #a8afb9; }
`
const Liste = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`
const Rad = styled.div``
const RadTopp = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #e7eaef;
  span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  em { font-style: normal; color: #838b95; font-size: 0.74rem; }
  b { font-variant-numeric: tabular-nums; font-size: 0.8rem; }
`
const Pos = styled.i`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15rem;
  height: 1.15rem;
  margin-right: 0.35rem;
  border-radius: 50%;
  border: 1px solid #7880dc;
  color: #b9bff0;
  font-style: normal;
  font-size: 0.62rem;
  font-weight: 700;
`
const Bar = styled.div`
  margin-top: 0.3rem;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  i { display: block; height: 100%; border-radius: 999px; transition: width 0.3s ease; }
`
const Under = styled.div`
  margin-top: 0.2rem;
  font-size: 0.7rem;
  color: #838b95;
`
const Lenke = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
  border: none;
  background: none;
  color: #9aa2ac;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { color: #fff; }
`
const Note = styled.p`
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.45;
  color: #7c848e;
`
