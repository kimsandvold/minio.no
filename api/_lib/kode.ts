/**
 * Tilgangskoder – genereres KUN på serveren.
 *
 * Tidligere ble koden utledet på klienten av templateId + userId + designId.
 * Alle tre er kjent i nettleseren, så koden kunne regnes ut uten å betale. Nå
 * lages den av kryptografisk tilfeldige tall her inne, skrives til designet
 * først når betalingen er kapret, og sendes på e-post til kunden.
 */
import { randomInt } from 'node:crypto'

/** Ny 6-sifret tilgangskode (000000–999999), kryptografisk tilfeldig. */
export function nyTilgangskode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

/**
 * Sammenligner to koder i konstant tid, slik at svartiden ikke lekker hvor
 * mange sifre som var riktige.
 */
export function kodeMatcher(oppgitt: string, lagret: string): boolean {
  if (oppgitt.length !== lagret.length) return false
  let diff = 0
  for (let i = 0; i < oppgitt.length; i++) diff |= oppgitt.charCodeAt(i) ^ lagret.charCodeAt(i)
  return diff === 0
}
