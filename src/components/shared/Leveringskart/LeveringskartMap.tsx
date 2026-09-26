import { useEffect } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styled from 'styled-components'
import {
  LILLEHAMMER_LAT,
  LILLEHAMMER_LON,
  LEVERING_MAKS_KM,
  LEVERING_RADIUS_LUFTLINJE_KM,
} from '../../../utils/leveringsavstand'

const ACCENT = '#a8512c'

/**
 * Leaflets standardmarkør laster PNG-er via relative stier som ikke overlever
 * bundling. En divIcon rendres av CSS i stedet, så det finnes ingen bildefil
 * å miste – og markørene kan ta paletten.
 */
function pinIcon(color: string, ring: string) {
  return L.divIcon({
    className: '',
    html: `<span style="
      display:block;width:18px;height:18px;border-radius:50%;
      background:${color};box-shadow:0 0 0 4px ${ring},0 2px 8px rgba(0,0,0,.35);
    "></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

const VERKSTED_IKON = pinIcon(ACCENT, 'rgba(168,81,44,.28)')
/* Grønn innenfor leveringsområdet, rav utenfor – svaret leses av kartet alene. */
const TREFF_INNENFOR = pinIcon('#3f7d52', 'rgba(63,125,82,.25)')
const TREFF_UTENFOR = pinIcon('#b07c1d', 'rgba(176,124,29,.25)')

const MapShell = styled.div`
  height: 420px;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};

  .leaflet-container {
    height: 100%;
    width: 100%;
    background: ${({ theme }) => theme.colors.sunken};
    font-family: ${({ theme }) => theme.fonts.body};
  }

  /* Leaflets egen kontrastprofil er lysegrå på hvitt – under AA. */
  .leaflet-control-attribution {
    background: rgba(255, 255, 255, 0.92);
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: 0.7rem;

    a {
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  .leaflet-bar a {
    color: ${({ theme }) => theme.colors.ink};
    border-bottom-color: ${({ theme }) => theme.colors.border};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: 320px;
  }
`

/** Zoomer kartet til treffet når et nytt søk kommer inn. */
function FlyTilTreff({ lat, lon }: { lat?: number; lon?: number }) {
  const map = useMap()

  useEffect(() => {
    if (lat == null || lon == null) return
    map.flyToBounds(
      L.latLngBounds([LILLEHAMMER_LAT, LILLEHAMMER_LON], [lat, lon]).pad(0.25),
      { duration: 0.8 },
    )
  }, [lat, lon, map])

  return null
}

interface Props {
  /** Koordinater for siste adressesøk, hvis noe er søkt opp. */
  treff?: { lat: number; lon: number; navn: string; innenfor: boolean }
}

export default function LeveringskartMap({ treff }: Props) {
  return (
    <MapShell>
      <MapContainer
        center={[LILLEHAMMER_LAT, LILLEHAMMER_LON]}
        zoom={6}
        scrollWheelZoom={false}
        /* Rullehjulet tilhører siden; kartet zoomes med knappene eller Ctrl+hjul. */
        attributionControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={18}
        />

        <Circle
          center={[LILLEHAMMER_LAT, LILLEHAMMER_LON]}
          radius={LEVERING_RADIUS_LUFTLINJE_KM * 1000}
          pathOptions={{ color: ACCENT, weight: 1.5, fillColor: ACCENT, fillOpacity: 0.08 }}
        />

        <Marker position={[LILLEHAMMER_LAT, LILLEHAMMER_LON]} icon={VERKSTED_IKON}>
          <Tooltip direction="top" offset={[0, -12]}>
            Verkstedet vårt – Lillehammer
          </Tooltip>
        </Marker>

        {treff && (
          <Marker
            position={[treff.lat, treff.lon]}
            icon={treff.innenfor ? TREFF_INNENFOR : TREFF_UTENFOR}
          >
            <Tooltip direction="top" offset={[0, -12]} permanent>
              {treff.navn}
            </Tooltip>
          </Marker>
        )}

        <FlyTilTreff lat={treff?.lat} lon={treff?.lon} />
      </MapContainer>
    </MapShell>
  )
}

export { LEVERING_MAKS_KM }
