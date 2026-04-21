export function getNetProtoColor(value) {
  switch (value) {
    case 'yes':
      return 'success';
    case 'nat':
      return 'warning';
    case 'no':
      return 'error';
    default:
      return 'info';
  }
}

export function getNetProtoIcon(value) {
  switch (value) {
    case 'yes':
      return 'mdi-checkbox-marked-outline';
    case 'nat':
      return 'mdi-alert-box-outline';
    case 'no':
      return 'mdi-close-box-outline';
    default:
      return 'mdi-help-box-outline';
  }
}

export function getLossColor(value) {
  switch (true) {
    case value < 10:
      return 'success';
    case value >= 25:
      return 'error';
    default:
      return 'warning';
  }
}

export function getLatencyColor(value) {
  switch (true) {
    case value <= 125:
      return 'success';
    case value <= 250:
      return 'warning';
    default:
      return 'error';
  }
}

export function getCPUColor(value) {
  switch (true) {
    case value > 80:
      return 'error';
    case value > 50:
      return 'warning';
    default:
      return 'indigo';
  }
}

export function getMemoryColor(value) {
  switch (true) {
    case value > 80:
      return 'error';
    case value > 60:
      return 'warning';
    default:
      return 'primary';
  }
}

export function getDiskColor(value) {
  switch (true) {
    case value > 90:
      return 'error';
    case value > 75:
      return 'warning';
    default:
      return 'secondary';
  }
}
