export interface DevicePreset {
  id: string
  label: string
  icon: string
  rotate?: boolean
  width: number
  height: number
}

export const devicePresets: DevicePreset[] = [
  { id: 'mobile-portrait', label: 'Mobil stående', icon: 'faMobileAlt', width: 390, height: 844 },
  { id: 'mobile-landscape', label: 'Mobil liggende', icon: 'faMobileAlt', rotate: true, width: 844, height: 390 },
  { id: 'ipad-portrait', label: 'iPad stående', icon: 'faTabletAlt', width: 820, height: 1180 },
  { id: 'ipad-landscape', label: 'iPad liggende', icon: 'faTabletAlt', rotate: true, width: 1180, height: 820 },
  { id: 'desktop', label: 'Desktop', icon: 'faDesktop', width: 1440, height: 900 },
]

export function findPresetByDimensions(w: number, h: number): DevicePreset | null {
  return devicePresets.find(p => p.width === w && p.height === h) ?? null
}
