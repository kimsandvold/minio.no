import type { Product } from '../types/product'

const SITE_URL = 'https://minio.no'

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function productJsonLd(product: Product, path: string): Record<string, unknown>[] {
  const url = `${SITE_URL}${path}`
  const images = product.images.map((img) => `${SITE_URL}${img.src}`)
  const description = stripHtml(product.shortDescription || product.detailsHtml || product.title)

  const offers = product.basePrice
    ? {
        '@type': 'AggregateOffer',
        priceCurrency: 'NOK',
        lowPrice: product.basePrice,
        availability: 'https://schema.org/InStock',
        url,
        seller: { '@type': 'Organization', name: 'Minio' },
      }
    : undefined

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description,
    image: images,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'Minio' },
    url,
  }
  if (offers) productSchema.offers = offers

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hjem', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Produkter', item: `${SITE_URL}/produkter` },
      { '@type': 'ListItem', position: 3, name: product.title, item: url },
    ],
  }

  return [productSchema, breadcrumb]
}
