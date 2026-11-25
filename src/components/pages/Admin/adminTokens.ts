/**
 * Designtokens for admin-panelet.
 *
 * Fargene lå tidligere som rå hex-verdier spredt over tolv filer – samme
 * grå i fire nyanser, to ulike kantfarger, og i ett tilfelle en ugyldig
 * verdi (`#2e2a2622e`) som ingen oppdaget fordi den bare så litt mørk ut.
 * Her er de ett sted, med navn som sier hva de gjør i stedet for hvordan de
 * ser ut.
 *
 * Admin er bevisst kjøligere og mer nøytral enn resten av nettstedet. Den
 * varme bøkepaletten hører til butikken; her skal øyet lese status og tall,
 * ikke stemning.
 */
export const t = {
  /** Flater. Admin er lys og luftig – ikke et mørkt kontrollrom. */
  bunn: '#f3f4f6',
  flate: '#ffffff',
  senket: '#f9fafb',
  skall: '#ffffff',
  skallHev: '#f3f4f6',

  /** Tekst. */
  blekk: '#111827',
  dempet: '#6b7280',
  svak: '#9ca3af',
  paaMork: '#111827',
  paaMorkDempet: '#6b7280',

  /** Kanter og skiller. */
  kant: '#e5e7eb',
  kantSvak: '#f1f2f4',
  kantMork: '#e5e7eb',

  /**
   * Statusfarger. Bare disse tre – en admin med fem statusfarger blir et
   * lyskryss, og da slutter man å se forskjell på hva som haster.
   */
  ny: '#2f6f46',
  nySvak: 'rgba(47, 111, 70, 0.1)',
  venter: '#8a6318',
  venterSvak: 'rgba(138, 99, 24, 0.12)',
  fare: '#9c3621',
  fareSvak: 'rgba(156, 54, 33, 0.1)',

  /** Handling. Samme aksent som nettstedet, så det er tydelig samme hus. */
  aksent: '#a8512c',
  aksentSvak: 'rgba(168, 81, 44, 0.09)',

  /** Form. */
  radius: '12px',
  radiusLiten: '10px',
  radiusRund: '999px',
  skygge: '0 1px 2px rgba(17, 24, 39, 0.04)',
  skyggeHev: '0 4px 16px -8px rgba(17, 24, 39, 0.18)',

  /** Bredder. */
  sidemeny: '248px',
  innholdMaks: '1180px',
} as const

/**
 * Brytpunkter. `mobil` er der sidemenyen forsvinner og bunnlinja overtar;
 * `smal` er der kort må stables.
 */
export const bp = {
  mobil: '900px',
  smal: '640px',
} as const

/** Høyden på bunnavigasjonen, inkludert trygg sone på telefoner med hakk. */
export const BUNNHOYDE = 'calc(58px + env(safe-area-inset-bottom, 0px))'
