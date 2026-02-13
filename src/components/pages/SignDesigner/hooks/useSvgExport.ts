import { useCallback } from 'react'
import type { SignDesign } from '../../../../types/design'

export function useSvgExport(svgRef: React.RefObject<SVGSVGElement | null>) {
  const getCleanClone = useCallback((): SVGSVGElement | null => {
    const svg = svgRef.current
    if (!svg) return null
    const clone = svg.cloneNode(true) as SVGSVGElement

    // Remove selection handles and UI-only elements
    clone.querySelectorAll('[data-ui-only]').forEach(el => el.remove())

    // Ensure the root SVG has no background / box-shadow / cursor
    clone.removeAttribute('style')
    clone.style.background = ''

    // Remove inline styles from all children (cursor: move, display: none, etc.)
    clone.querySelectorAll('*').forEach(el => {
      (el as HTMLElement).removeAttribute('style')
    })

    // Set proper viewBox-based dimensions (no zoom scaling)
    const vb = clone.getAttribute('viewBox')
    if (vb) {
      const [, , w, h] = vb.split(' ')
      clone.setAttribute('width', w)
      clone.setAttribute('height', h)
    }

    return clone
  }, [svgRef])

  const getSvgString = useCallback((): string => {
    const clone = getCleanClone()
    if (!clone) return ''
    return new XMLSerializer().serializeToString(clone)
  }, [getCleanClone])

  const exportSvg = useCallback((design: SignDesign, filename?: string) => {
    const clone = getCleanClone()
    if (!clone) return

    // Set physical dimensions in mm on the clone before serializing
    clone.setAttribute('width', `${design.canvasWidth}mm`)
    clone.setAttribute('height', `${design.canvasHeight}mm`)

    const svgString = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (filename || 'minio-skilt') + '.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [getCleanClone])

  return { getSvgString, exportSvg }
}
