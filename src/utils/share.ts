/**
 * Lenka som deles. `kanal` merker den med utm, slik at besøk fra en kopiert
 * lenke (Messenger, SMS, Snap) ikke havner som «direkte» i GA4 – uten merket
 * er det bare Facebook-delinger som kan spores tilbake, via referrer.
 */
export function getShareUrl(context?: string, kanal?: string): string {
  const base = window.location.origin
  let sti = window.location.pathname
  if (context === 'product' || context === 'portfolio') {
    sti = '/produkter'
  } else if (context === 'contact') {
    sti = '/kontakt'
  }
  if (!kanal) return base + sti
  const url = new URL(sti, base)
  url.searchParams.set('utm_source', 'deling')
  url.searchParams.set('utm_medium', kanal)
  return url.toString()
}

export function shareFacebook(url: string): void {
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  window.open(fbUrl, 'facebook-share-dialog', 'width=800,height=600')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return fallbackCopyToClipboard(text)
    }
  }
  return fallbackCopyToClipboard(text)
}

function fallbackCopyToClipboard(text: string): boolean {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  try {
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return true
  } catch {
    document.body.removeChild(textArea)
    return false
  }
}
