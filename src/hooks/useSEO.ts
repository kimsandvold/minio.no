import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://minio.no'
// Raster-bilde – sosiale plattformer (Facebook/X) viser ikke SVG som og:image.
const DEFAULT_OG_IMAGE = '/images/hero/forside_8.webp'

type JsonLdValue = Record<string, unknown>

interface SEOOptions {
  title: string
  description: string
  ogImage?: string
  ogImageAlt?: string
  noindex?: boolean
  keywords?: string
  jsonLd?: JsonLdValue | JsonLdValue[]
}

const JSONLD_ID = 'seo-jsonld'

function setJsonLd(value: JsonLdValue | JsonLdValue[] | undefined) {
  document.querySelectorAll(`script[data-managed="${JSONLD_ID}"]`).forEach((el) => el.remove())
  if (!value) return
  const items = Array.isArray(value) ? value : [value]
  items.forEach((item) => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.managed = JSONLD_ID
    script.text = JSON.stringify(item)
    document.head.appendChild(script)
  })
}

function setMeta(name: string, content: string, attribute = 'name') {
  let el = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, name)
    document.head.appendChild(el)
  }
  el.content = content
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

export function useSEO({ title, description, ogImage, ogImageAlt, noindex, keywords, jsonLd }: SEOOptions): void {
  const { pathname, search } = useLocation()
  const fullUrl = `${SITE_URL}${pathname}${search}`
  // Kanonisk URL skal ikke inneholde spørrestreng (?utm=…) – unngår duplikat-kanoniske.
  const canonicalUrl = `${SITE_URL}${pathname}`
  const imageUrl = `${SITE_URL}${ogImage || DEFAULT_OG_IMAGE}`
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : ''
  const stableJsonLd = useMemo(() => jsonLd, [jsonLdKey])

  useEffect(() => {
    document.title = title
    window.scrollTo(0, 0)

    setMeta('description', description)
    if (keywords) setMeta('keywords', keywords)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', canonicalUrl, 'property')
    setMeta('og:image', imageUrl, 'property')
    setMeta('twitter:title', title, 'name')
    setMeta('twitter:description', description, 'name')
    setMeta('twitter:image', imageUrl, 'name')
    if (ogImageAlt) {
      setMeta('og:image:alt', ogImageAlt, 'property')
      setMeta('twitter:image:alt', ogImageAlt, 'name')
    }
    setLink('canonical', canonicalUrl)

    if (noindex) {
      setMeta('robots', 'noindex, nofollow')
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
      if (robotsMeta) robotsMeta.remove()
    }

    setJsonLd(stableJsonLd)

    // GA4 SPA page view
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: title,
        page_location: fullUrl,
        page_path: pathname,
      })
    }

    return () => {
      setJsonLd(undefined)
    }
  }, [title, description, fullUrl, canonicalUrl, imageUrl, ogImageAlt, noindex, keywords, pathname, stableJsonLd])
}
