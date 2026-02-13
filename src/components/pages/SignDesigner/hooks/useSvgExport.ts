import { useCallback } from 'react'
import type { SignDesign } from '../../../../types/design'

export function useSvgExport(svgRef: React.RefObject<SVGSVGElement | null>) {
  const getSvgString = useCallback((): string => {
    const svg = svgRef.current
    if (!svg) return ''
    const clone = svg.cloneNode(true) as SVGSVGElement
    // Remove selection handles and UI-only elements
    clone.querySelectorAll('[data-ui-only]').forEach(el => el.remove())
    // Remove inline cursor styles
    clone.querySelectorAll('[style]').forEach(el => {
      el.removeAttribute('style')
    })
    const serializer = new XMLSerializer()
    return serializer.serializeToString(clone)
  }, [svgRef])

  const exportSvg = useCallback((design: SignDesign, filename?: string) => {
    const svgString = getSvgString()
    if (!svgString) return

    // Wrap with proper SVG header including physical dimensions in mm
    const wrappedSvg = svgString
      .replace(/<svg /, `<svg xmlns="http://www.w3.org/2000/svg" width="${design.canvasWidth}mm" height="${design.canvasHeight}mm" `)

    const blob = new Blob([wrappedSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (filename || 'minio-skilt') + '.svg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [getSvgString])

  return { getSvgString, exportSvg }
}
