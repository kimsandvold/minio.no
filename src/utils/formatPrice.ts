export function formatPrice(priceString: string, quantity: number): string {
  const price = parseInt(priceString.replace(/[^\d]/g, ''))
  const total = price * quantity
  return total.toLocaleString('nb-NO') + ',-'
}

export function parsePrice(priceString: string): number {
  return parseInt(priceString.replace(/[^\d]/g, '')) || 0
}

export function formatSum(amount: number): string {
  return amount.toLocaleString('nb-NO') + ',-'
}
