import countriesRaw from 'world-countries-centroids/dist/countries.geojson?raw'

/**
 * Build coordinates map [lat, lng] dynamically from world-countries-centroids
 */
export const COORD_MAP = {}

try {
  const countriesData = JSON.parse(countriesRaw)
  if (countriesData && Array.isArray(countriesData.features)) {
    for (const feature of countriesData.features) {
      const iso = feature.properties?.ISO
      const coords = feature.geometry?.coordinates
      if (iso && Array.isArray(coords) && coords.length >= 2) {
        // GeoJSON coordinates are [lng, lat] -> convert to [lat, lng]
        COORD_MAP[iso.toUpperCase()] = [coords[1], coords[0]]
      }
    }
  }
} catch (error) {
  console.error('Failed to parse world-countries-centroids GeoJSON:', error)
}

// Fallback coordinates for territories/special regions not individually listed in the dataset
const SPECIAL_REGIONS = {
  HK: [22.3193, 114.1694],
  MO: [22.1987, 113.5439],
  TW: [23.6978, 120.9605],
  XK: [42.6026, 20.903],
}

for (const [code, coord] of Object.entries(SPECIAL_REGIONS)) {
  if (!COORD_MAP[code]) {
    COORD_MAP[code] = coord
  }
}

// Common aliases mapping to standard ISO 3166-1 alpha-2 codes
const COUNTRY_CODE_ALIASES = {
  UK: 'GB',
}

/**
 * Normalize country code to standard ISO 3166-1 alpha-2 format
 * @param {string} code
 * @returns {string}
 */
export function normalizeCountryCode (code) {
  if (!code || typeof code !== 'string') {
    return ''
  }
  const trimmedCode = code.trim().toUpperCase()
  return COUNTRY_CODE_ALIASES[trimmedCode] || trimmedCode
}

/**
 * Get [lat, lng] by ISO country code
 * @param {string} code
 * @returns {[number, number] | null}
 */
export function getCoordinatesByCountryCode (code) {
  const countryCode = normalizeCountryCode(code)
  return countryCode ? (COORD_MAP[countryCode] ?? null) : null
}

/**
 * Get country/region display name using Intl.DisplayNames if available
 * @param {string} code
 * @param {string} locale
 * @returns {string}
 */
export function getRegionDisplayName (code, locale = 'zh-CN') {
  const countryCode = normalizeCountryCode(code)
  if (!countryCode) {
    return ''
  }
  try {
    const intlLocale = locale === 'zhHans' ? 'zh-CN' : (locale === 'zhHant' ? 'zh-TW' : locale)
    const regionNames = new Intl.DisplayNames([intlLocale], { type: 'region' })
    return regionNames.of(countryCode) || countryCode
  } catch {
    return countryCode
  }
}
