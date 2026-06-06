const STORAGE_KEY = 'treskolen_progress'

function read(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function markModuleComplete(courseSlug: string, moduleSlug: string) {
  const progress = read()
  if (!progress[courseSlug]) progress[courseSlug] = []
  if (!progress[courseSlug].includes(moduleSlug)) {
    progress[courseSlug].push(moduleSlug)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }
}

export function isModuleComplete(courseSlug: string, moduleSlug: string): boolean {
  return read()[courseSlug]?.includes(moduleSlug) || false
}

export function getCompletedCount(courseSlug: string): number {
  return read()[courseSlug]?.length || 0
}
