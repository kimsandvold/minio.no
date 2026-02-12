import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://minio.no'
const DEFAULT_OG_IMAGE = '/images/branding/logo_dark.svg'

interface SEOOptions {
  title: string
  description: string
  ogImage?: string
  noindex?: boolean
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

export function useSEO({ title, description, ogImage, noindex }: SEOOptions): void {
  const { pathname } = useLocation()
  const fullUrl = `${SITE_URL}${pathname}`
  const imageUrl = `${SITE_URL}${ogImage || DEFAULT_OG_IMAGE}`

  useEffect(() => {
    document.title = title
    window.scrollTo(0, 0)

    setMeta('description', description)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', fullUrl, 'property')
    setMeta('og:image', imageUrl, 'property')
    setMeta('twitter:title', title, 'name')
    setMeta('twitter:description', description, 'name')
    setLink('canonical', fullUrl)

    if (noindex) {
      setMeta('robots', 'noindex, nofollow')
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null
      if (robotsMeta) robotsMeta.remove()
    }

    // GA4 SPA page view
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: title,
        page_location: fullUrl,
        page_path: pathname,
      })
    }
  }, [title, description, fullUrl, imageUrl, noindex, pathname])
}
