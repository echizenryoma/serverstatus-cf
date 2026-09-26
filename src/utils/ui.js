import { siAlpinelinux } from 'simple-icons'

export function getNetProtoColor (value) {
  switch (value) {
    case 'yes': {
      return 'success'
    }
    case 'nat': {
      return 'warning'
    }
    case 'no': {
      return 'error'
    }
    default: {
      return 'info'
    }
  }
}

export function getNetProtoIcon (value) {
  switch (value) {
    case 'yes': {
      return 'mdi-checkbox-marked-outline'
    }
    case 'nat': {
      return 'mdi-alert-box-outline'
    }
    case 'no': {
      return 'mdi-close-box-outline'
    }
    default: {
      return 'mdi-help-box-outline'
    }
  }
}

export function getLossColor (value) {
  switch (true) {
    case value < 10: {
      return 'success'
    }
    case value >= 25: {
      return 'error'
    }
    default: {
      return 'warning'
    }
  }
}

export function getLatencyColor (value) {
  switch (true) {
    case value <= 125: {
      return 'success'
    }
    case value <= 250: {
      return 'warning'
    }
    default: {
      return 'error'
    }
  }
}

export function getCPUColor (value) {
  switch (true) {
    case value > 80: {
      return 'error'
    }
    case value > 50: {
      return 'warning'
    }
    default: {
      return 'indigo'
    }
  }
}

export function getMemoryColor (value) {
  switch (true) {
    case value > 80: {
      return 'error'
    }
    case value > 60: {
      return 'warning'
    }
    default: {
      return 'primary'
    }
  }
}

export function getDiskColor (value) {
  switch (true) {
    case value > 90: {
      return 'error'
    }
    case value > 75: {
      return 'warning'
    }
    default: {
      return 'secondary'
    }
  }
}
const OS_RULES = [
  { match: s => s.startsWith('arch'), name: 'Arch Linux', icon: 'mdi-arch', color: '#1793D1' },
  { match: s => s.startsWith('debian'), name: 'Debian', icon: 'mdi-debian', color: '#D70A53' },
  {
    match: s => s.startsWith('alpine'),
    name: siAlpinelinux.title,
    icon: '',
    svgPath: siAlpinelinux.path,
    color: `#${siAlpinelinux.hex}`,
    isSvg: true,
  },
  { match: s => s.startsWith('windows') || s.startsWith('win') || s.includes('windows'), name: 'Windows', icon: 'mdi-microsoft-windows', color: '#0078D7' },
  { match: s => s.startsWith('ubuntu'), name: 'Ubuntu', icon: 'mdi-ubuntu', color: '#E95420' },
  { match: s => s.startsWith('centos'), name: 'CentOS', icon: 'mdi-centos', color: '#FFA500' },
  { match: s => s.startsWith('fedora'), name: 'Fedora', icon: 'mdi-fedora', color: '#51A2DA' },
  { match: s => s.startsWith('redhat') || s.startsWith('red hat') || s.startsWith('rhel'), name: 'Red Hat', icon: 'mdi-redhat', color: '#EE0000' },
  { match: s => s.startsWith('rocky'), name: 'Rocky Linux', icon: 'mdi-linux', color: '#10B981' },
  { match: s => s.startsWith('alma'), name: 'AlmaLinux', icon: 'mdi-linux', color: '#0F4C81' },
  { match: s => s.startsWith('manjaro'), name: 'Manjaro', icon: 'mdi-manjaro', color: '#35BF5C' },
  { match: s => s.startsWith('mint') || s.startsWith('linux mint'), name: 'Linux Mint', icon: 'mdi-linux-mint', color: '#87CF3E' },
  { match: s => s.startsWith('gentoo'), name: 'Gentoo', icon: 'mdi-gentoo', color: '#DDA0DD' },
  { match: s => s.startsWith('raspbian') || s.startsWith('raspberry'), name: 'Raspberry Pi OS', icon: 'mdi-raspberry-pi', color: '#C51A4A' },
  { match: s => s.startsWith('freebsd'), name: 'FreeBSD', icon: 'mdi-freebsd', color: '#AB2B28' },
  { match: s => s.startsWith('openbsd') || s.startsWith('netbsd') || s.startsWith('bsd'), name: 'BSD', icon: 'mdi-freebsd', color: '#F2CE00' },
  { match: s => s.startsWith('darwin') || s.startsWith('macos') || s.startsWith('mac os') || s.includes('apple'), name: 'macOS', icon: 'mdi-apple', color: '#999999' },
  { match: s => s.startsWith('android'), name: 'Android', icon: 'mdi-android', color: '#3DDC84' },
  { match: s => s.startsWith('openwrt'), name: 'OpenWrt', icon: 'mdi-router-wireless', color: '#00A9E0' },
  { match: s => s.includes('linux'), name: 'Linux', icon: 'mdi-linux', color: '#FCC624' },
]

export function getOSInfo (rawOs) {
  if (!rawOs || rawOs === '-' || typeof rawOs !== 'string') {
    return {
      name: '',
      icon: '',
      color: '',
      isSvg: false,
      svgPath: '',
    }
  }

  const osStr = rawOs.trim()
  const lower = osStr.toLowerCase()
  const matched = OS_RULES.find(rule => rule.match(lower))

  if (matched) {
    return {
      name: matched.name,
      icon: matched.icon || '',
      color: matched.color,
      isSvg: Boolean(matched.isSvg),
      svgPath: matched.svgPath || '',
    }
  }

  return {
    name: osStr,
    icon: 'mdi-server',
    color: 'grey',
    isSvg: false,
    svgPath: '',
  }
}
