import { useId, type Dispatch, type SetStateAction } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { bp, t } from './adminTokens'
import {
  operatorLabel,
  nyRegel,
  type Filterfelt,
  type Operator,
  type Regel,
  type Snarvei,
} from './filterRegler'

/**
 * Grensesnittet til regelfilteret. Typene og selve filtreringa ligger i
 * `filterRegler.ts` ved siden av – samme deling som adminTokens/adminUi, og
 * den som gjør at sidene kan importere `passererFilter` uten å dra inn en
 * React-komponent.
 */

/** Operatorene som ikke har noe å sammenligne med – verdifeltet skjules. */
const UTEN_VERDI: Operator[] = ['er-tom', 'er-ikke-tom']

export default function AdminFilter({
  felter,
  regler,
  settRegler,
  snarveier = [],
  treff,
  totalt,
}: {
  felter: Filterfelt[]
  regler: Regel[]
  /**
   * Settes med funksjonell oppdatering internt, så to raske klikk på
   * snarveisbrikkene ikke kan lese samme `regler` og overskrive hverandre.
   */
  settRegler: Dispatch<SetStateAction<Regel[]>>
  snarveier?: Snarvei[]
  treff: number
  totalt: number
}) {
  const gruppeId = useId()

  const endre = (id: string, endring: Partial<Regel>) =>
    settRegler((f) => f.map((r) => (r.id === id ? { ...r, ...endring } : r)))

  const leggTil = (regel?: Omit<Regel, 'id'>) =>
    settRegler((f) => [
      ...f,
      regel
        ? nyRegel(regel.felt, regel.operator, regel.verdi)
        : nyRegel(felter[0]?.nokkel ?? '', 'inneholder', ''),
    ])

  return (
    <Boks>
      <Topp>
        <Tittel>
          <Icon name="faFilter" /> Filter
        </Tittel>
        <Treff>
          <strong>{treff}</strong> av {totalt}
        </Treff>
      </Topp>

      {snarveier.length > 0 && (
        <Snarveier aria-label="Vanlige filtre">
          {snarveier.map((s) => (
            <Brikke key={s.navn} type="button" onClick={() => leggTil(s.regel)}>
              <Icon name="faPlus" /> {s.navn}
            </Brikke>
          ))}
        </Snarveier>
      )}

      {regler.length > 0 && (
        <Regler>
          {regler.map((r, i) => (
            <Rad key={r.id}>
              <Binding aria-hidden="true">{i === 0 ? 'Der' : 'og'}</Binding>

              <select
                aria-label="Felt"
                value={r.felt}
                onChange={(e) => endre(r.id, { felt: e.target.value })}
              >
                {felter.map((f) => (
                  <option key={f.nokkel} value={f.nokkel}>
                    {f.navn}
                  </option>
                ))}
              </select>

              <select
                aria-label="Operator"
                value={r.operator}
                onChange={(e) => endre(r.id, { operator: e.target.value as Operator })}
              >
                {(Object.keys(operatorLabel) as Operator[]).map((o) => (
                  <option key={o} value={o}>
                    {operatorLabel[o]}
                  </option>
                ))}
              </select>

              {UTEN_VERDI.includes(r.operator) ? (
                <Plassholder aria-hidden="true" />
              ) : (
                <input
                  type="text"
                  aria-label="Verdi"
                  placeholder="@gmail.com"
                  value={r.verdi}
                  onChange={(e) => endre(r.id, { verdi: e.target.value })}
                />
              )}

              <Fjern
                type="button"
                aria-label={`Fjern regel ${i + 1}`}
                onClick={() => settRegler((f) => f.filter((x) => x.id !== r.id))}
              >
                <Icon name="faXmark" />
              </Fjern>
            </Rad>
          ))}
        </Regler>
      )}

      <Bunn>
        <LeggTil type="button" onClick={() => leggTil()} aria-describedby={gruppeId}>
          <Icon name="faPlus" /> Legg til regel
        </LeggTil>
        {regler.length > 0 && (
          <Nullstill type="button" onClick={() => settRegler([])}>
            Nullstill
          </Nullstill>
        )}
        <Hjelp id={gruppeId}>Alle regler må stemme.</Hjelp>
      </Bunn>
    </Boks>
  )
}

const Boks = styled.div`
  padding: 0.9rem 1rem;
  margin-bottom: 1rem;
  background: ${t.flate};
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
`

const Topp = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.7rem;
`

const Tittel = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${t.svak};

  svg {
    font-size: 0.75rem;
  }
`

const Treff = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: ${t.dempet};
  font-variant-numeric: tabular-nums;

  strong {
    color: ${t.blekk};
  }
`

const Snarveier = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.7rem;
`

const Brikke = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border: 1px dashed ${t.kant};
  border-radius: ${t.radiusRund};
  background: ${t.flate};
  color: ${t.dempet};
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    font-size: 0.6rem;
    color: ${t.svak};
  }
  &:hover {
    border-style: solid;
    border-color: ${t.aksent};
    color: ${t.aksent};
  }
`

const Regler = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.7rem;
`

const Rad = styled.div`
  display: grid;
  grid-template-columns: 2.1rem minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1.4fr) 2rem;
  align-items: center;
  gap: 0.4rem;

  select,
  input {
    min-width: 0;
    padding: 0.42rem 0.55rem;
    border: 1px solid ${t.kant};
    border-radius: ${t.radiusLiten};
    background: ${t.flate};
    color: ${t.blekk};
    font-family: inherit;
    font-size: 0.84rem;
  }
  select {
    cursor: pointer;
  }

  /*
   * På mobil er det ikke plass til fem kolonner. Bindingsordet og
   * fjern-knappen deler linje med feltvelgeren, og operator + verdi legger
   * seg under i full bredde.
   */
  @media (max-width: ${bp.mobil}) {
    grid-template-columns: 2.1rem minmax(0, 1fr) 2rem;
    gap: 0.35rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px dashed ${t.kantSvak};

    select,
    input {
      min-height: 40px;
    }
    > select:nth-of-type(2),
    > input {
      grid-column: 2 / 4;
    }
    /*
     * Kryssene må plasseres eksplisitt. Automatisk plassering la dem etter
     * verdifeltet, altså på en egen linje nederst til venstre – der så de ut
     * som en knapp for hele filteret i stedet for for sin egen regel.
     */
    > button {
      grid-column: 3;
      grid-row: 1;
    }
    &:last-child {
      border-bottom: none;
    }
  }
`

const Binding = styled.span`
  font-size: 0.76rem;
  font-weight: 700;
  color: ${t.svak};
  text-align: right;
`

/** Holder rutenettet i ro når «er tom» skjuler verdifeltet. */
const Plassholder = styled.span``

const Fjern = styled.button`
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: ${t.radiusLiten};
  background: none;
  color: ${t.svak};
  font-size: 0.8rem;
  cursor: pointer;

  &:hover {
    background: ${t.fareSvak};
    color: ${t.fare};
  }
`

const Bunn = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
`

const LeggTil = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid ${t.kant};
  border-radius: ${t.radiusRund};
  background: ${t.flate};
  color: ${t.blekk};
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    font-size: 0.68rem;
  }
  &:hover {
    border-color: ${t.svak};
  }
`

const Nullstill = styled.button`
  border: none;
  background: none;
  padding: 0.4rem 0;
  color: ${t.dempet};
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
`

const Hjelp = styled.span`
  margin-left: auto;
  font-size: 0.76rem;
  color: ${t.svak};

  @media (max-width: ${bp.mobil}) {
    margin-left: 0;
  }
`
