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
