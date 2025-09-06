import { filesize } from "filesize";
import { ms, parseDuration } from 'enhanced-ms';

export function formatSize(size, options = {}) {
  if (!size) {
    return '-';
  }
  options.round = options.round || 1;
  return filesize(size, options);
}

export function formatSpeed(speed, bits = true, options = {}) {
  if (!speed) {
    speed = 0;
  }
  options.standard = options.standard || "si";
  options.round = options.round || 1;
  if (bits) {
    options.bits = options.bits || true;
    options.fullform = true;
    options.fullforms = ["bps", "kbps", "Mbps", "Gbps", "Tbps", "Pbps"];
  } else {
    options.bits = options.bits || false;
    options.fullform = true;
    options.fullforms = ["B/s", "kB/s", "MB/s", "GB/s", "TB/s", "PB/s"];
  }
  return filesize(speed, options);
}

export function formatLatency(latency_ms) {
  return `${Math.round(latency_ms ?? 0)} ms`;
}

export function formatSeconds(seconds, options = {}) {
  if (!seconds || seconds < 0) {
    return '-';
  }
  const d = seconds * 1000;
  var formatDuration = "-";
  if (d < parseDuration('1d')) {
    options.includedUnits = options.includedUnits || ['hour', 'minute', 'second'];
    options.unitSeparator = options.unitSeparator || ':';
    options.hideUnitNames = options.hideUnitNames || true;
    options.includeZero = options.includeZero || true;
    options.minimumDigits = options.minimumDigits || 2;
    formatDuration = ms(d, options);
  } else {
    options.includedUnits = options.includedUnits || ['day'];
    options.useAbbreviations = options.useAbbreviations || true;
    options.hideUnitNames = options.hideUnitNames || true;
    formatDuration = ms(d, options) + this.$t('units.day');
  }
  return formatDuration;
}
