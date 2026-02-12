export function getShareUrl(context?: string): string {
  const base = window.location.origin
  if (context === 'product' || context === 'portfolio') {
    return base + '/produkter'
  }
  if (context === 'contact') {
    return base + '/kontakt'
  }
  return base + window.location.pathname
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
