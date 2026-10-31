/**
 * Riktig kjønn på produktnavnene i UI-tekster («din egen carport», men
 * «ditt eget varmepumpehus»). Intetkjønnsord må stå her.
 */
const INTETKJONN = new Set(['varmepumpehus', 'vedskjul', 'utekjokken', 'postkassestativ', 'postkassestativer'])

export function erIntetkjonn(produktId: string): boolean {
  return INTETKJONN.has(produktId)
}

/** «din egen carport» / «ditt eget vedskjul». */
export function dinEgen(produktId: string, navn: string): string {
  return `${erIntetkjonn(produktId) ? 'ditt eget' : 'din egen'} ${navn.toLowerCase()}`
}

/** «en carport» / «et vedskjul». */
export function enEt(produktId: string, navn: string): string {
  return `${erIntetkjonn(produktId) ? 'et' : 'en'} ${navn.toLowerCase()}`
}
