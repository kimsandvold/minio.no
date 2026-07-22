/**
 * Delt leveringslogikk – speiler pris-/leveringsmodellen fra produktsidene
 * (f.eks. /produkter/plantekasser): kjøreavstand fra Lillehammer via
 * Nominatim (geokoding) + OSRM (kjørerute), med luftlinje × 1.3 som fallback.
 */

export const LILLEHAMMER_LAT = 61.1153
export const LILLEHAMMER_LON = 10.4662

/** 15 kr per km × 2 (tur/retur). */
export const LEVERING_KR_PER_KM = 15 * 2
/** Maks kjøreavstand vi leverer til uten eget tilbud. */
export const LEVERING_MAKS_KM = 200

export interface AvstandResultat {
  distanceKm: number
  message: string
  type: 'success' | 'warning' | 'error'
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** Slår opp et sted og returnerer kjøreavstand fra Lillehammer. */
export async function beregnKjoreavstand(query: string): Promise<AvstandResultat | null> {
  if (!query.trim()) return null

  try {
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},Norway&format=json&limit=1`
    const geoData = await (await fetch(geoUrl)).json()
    if (!geoData || geoData.length === 0) {
      return { distanceKm: 0, message: 'Fant ikke stedet. Prøv et annet søkeord.', type: 'error' }
    }

    const toLat = parseFloat(geoData[0].lat)
    const toLon = parseFloat(geoData[0].lon)
    const navn = String(geoData[0].display_name).split(',')[0]

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${LILLEHAMMER_LON},${LILLEHAMMER_LAT};${toLon},${toLat}?overview=false`
      const osrmData = await (await fetch(osrmUrl)).json()
      if (osrmData.code === 'Ok' && osrmData.routes && osrmData.routes.length > 0) {
        const distKm = Math.round(osrmData.routes[0].distance / 1000)
        return { distanceKm: distKm, message: `Fant ${navn} — ${distKm} km fra Lillehammer`, type: 'success' }
      }
    } catch {
      // Faller gjennom til luftlinje-estimat under.
    }

    const estimated = Math.round(haversineKm(LILLEHAMMER_LAT, LILLEHAMMER_LON, toLat, toLon) * 1.3)
    return { distanceKm: estimated, message: `Estimert avstand (luftlinje × 1.3): ${estimated} km`, type: 'warning' }
  } catch {
    return { distanceKm: 0, message: 'Fant ikke stedet. Prøv et annet søkeord.', type: 'error' }
  }
}
