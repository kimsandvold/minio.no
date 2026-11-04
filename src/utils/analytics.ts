declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(action: string, category: string, label?: string, value?: number): void {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

/**
 * GA4-anbefalt «share»-hendelse.
 *
 * `method`     – kanalen: 'facebook', 'kopier-lenke' eller 'web-share'.
 * `item_id`    – stien som faktisk blir delt. Ikke nødvendigvis sida brukeren
 *                står på: produktkort deler /produkter, ikke modalen.
 * `contentType`– 'side' for vanlige sider, 'design' for designverktøy-lenker.
 *
 * Web Share API sier aldri hvilken app brukeren valgte, så alt fra
 * delingsarket havner i samme bøtte ('web-share').
 */
export function trackShare(method: string, itemId: string, contentType = 'side'): void {
  if (window.gtag) {
    window.gtag('event', 'share', {
      method,
      content_type: contentType,
      item_id: itemId,
    })
  }
}
