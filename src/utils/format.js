import { ms } from 'enhanced-ms'
import { filesize } from 'filesize'
import i18n from '@/i18n'

const ONE_DAY_IN_MS = ms('1d')

export function formatSize (size, options = {}) {
  if (Number.isNaN(size)) {
    return '-'
  }
  options.round = options.round || 1
  return filesize(size, options)
}

export function formatSpeed (speed, bits = true, options = {}) {
  if (Number.isNaN(speed)) {
    speed = 0
  }
  options.standard = options.standard || 'si'
  options.round = options.round || 1
  if (bits) {
    options.bits = options.bits || true
    options.fullform = true
    options.fullforms = ['bps', 'kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps']
  } else {
    options.bits = options.bits || false
    options.fullform = true
    options.fullforms = ['B/s', 'kB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s']
  }
  return filesize(speed, options)
}

export function formatLatency (latency_ms) {
  return `${Math.round(latency_ms ?? 0)} ms`
}

export function formatLoss (loss) {
  return `${Math.min(100, Math.round(loss ?? 0))} %`
}

export function formatSeconds (seconds, options = {}) {
  if (Number.isNaN(seconds) || seconds < 0) {
    return '-'
  }
  const d = seconds * 1000
  let formatDuration
  if (d < ONE_DAY_IN_MS) {
    options.includedUnits = options.includedUnits || ['hour', 'minute', 'second']
    options.unitSeparator = options.unitSeparator || ':'
    options.hideUnitNames = options.hideUnitNames || true
    options.includeZero = options.includeZero || true
    options.minimumDigits = options.minimumDigits || 2
    formatDuration = ms(d, options)
  } else {
    options.includedUnits = options.includedUnits || ['day']
    options.useAbbreviations = options.useAbbreviations || true
    options.hideUnitNames = options.hideUnitNames || true
    const dayUnit = i18n.global.t('units.day')
    formatDuration = ms(d, options) + dayUnit
  }
  return formatDuration
}

export function getFlagCode (location, locale) {
  const loc = (location || '').toLowerCase()
  const activeLocale = locale || (typeof i18n.global.locale === 'object' ? i18n.global.locale.value : i18n.global.locale)
  if (activeLocale === 'zhHans') {
    const chinaFlagsMap = {
      hk: 'cn',
      tw: 'cn',
      mo: 'cn',
    }
    if (chinaFlagsMap[loc]) {
      return chinaFlagsMap[loc]
    }
  }
  return loc || location
}
