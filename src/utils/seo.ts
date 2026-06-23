const SITE_URL = 'https://minio.no'

/**
 * Konkret publisher-objekt for JSON-LD på sider som ikke selv definerer
 * LocalBusiness-/Organization-entiteten (#business defineres kun på forsiden).
 * Brukes så schema-grafen på den enkelte siden ikke får en uoppløst @id-referanse.
 */
export const MINIO_PUBLISHER = {
  '@type': 'Organization',
  name: 'Minio',
  url: `${SITE_URL}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/images/branding/logo_dark.svg`,
  },
} as const
