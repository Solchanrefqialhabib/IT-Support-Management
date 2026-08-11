const normalize = (value = '') => value.toString().trim().toUpperCase()

export function calculateAllowance(...locations) {
  const location = normalize(locations.filter(Boolean).join(' '))
  if (location.includes('TEGAL') || location.includes('BREBES')) return 35000
  if (location.includes('BUMIAYU')) return 100000
  return 150000
}
