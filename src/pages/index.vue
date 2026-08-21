<template>
  <v-container fluid style="max-width: 120em;">
    <v-row align="center" class="frosted-glass mb-4 pa-2" justify="space-between" no-gutters>
      <v-col class="d-flex align-center" cols="auto">
        <v-card-title class="text-h4 text-left mr-2 font-weight-bold">{{ $t('app.title') }}</v-card-title>
      </v-col>

      <v-col class="d-flex align-center align-self-center" cols="4" style="min-width: 12em;">
        <v-text-field
          v-model="search"
          class="mr-2"
          clearable
          hide-details
          prepend-inner-icon="mdi-magnify"
        >
          <template #append-inner>
            <div class="d-none d-md-flex align-center">
              <v-chip
                v-for="keyword in searchKeywords"
                :key="keyword"
                class="mr-1 cursor-pointer"
                size="x-small"
                @click="search = keyword"
              >
                {{ keyword }}
              </v-chip>
            </div>
          </template>
        </v-text-field>
      </v-col>

      <v-col class="d-flex align-center align-self-center" cols="auto">
        <v-select
          v-model="locale"
          class="mr-2"
          hide-details="auto"
          item-title="text"
          item-value="value"
          :items="languageOptions"
          style="min-width: 8em"
          @update:model-value="toggleLanguageChange"
        />

        <v-select
          v-model="pingIpVersion"
          class="mr-2"
          hide-details="auto"
          item-title="text"
          item-value="value"
          :items="pingIpVersionItems"
          style="min-width: 6em"
          @update:model-value="togglePingIpVersion"
        />

        <v-tooltip location="bottom">
          {{ speedUnit === 'bit' ? $t('actions.speedUnitBit') : $t('actions.speedUnitByte') }}
          <template #activator="{ props }">
            <v-btn v-bind="props" class="mr-2" icon @click="toggleSpeedUnit">
              <v-icon>{{ speedUnit === 'bit' ? 'mdi-speedometer' : 'mdi-chip' }}</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom">
          {{ $t('actions.showGlobe') }}
          <template #activator="{ props }">
            <v-btn v-bind="props" class="mr-2" icon @click="showGlobeDialog = true">
              <v-icon>mdi-earth</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-btn class="mr-2" icon @click="toggleDarkMode">
          <v-icon>mdi-theme-light-dark</v-icon>
        </v-btn>

        <v-btn class="mr-2" :color="isRefreshEnabled ? 'error' : 'success'" icon @click="stopRefresh">
          <v-icon>{{ isRefreshEnabled ? 'mdi-pause' : 'mdi-refresh' }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <!-- Overview Stats Bar -->
    <OverviewBar
      :overview="overview"
      :show-estimated-monthly-traffic="showEstimatedMonthlyTraffic"
      @open-globe="showGlobeDialog = true"
    />

    <v-data-table
      class="elevation-1 frosted-table rounded-xl"
      :expanded="expandedRows"
      :headers="headers"
      item-value="host"
      :items="filteredViewData"
      :items-per-page="-1"
      @click:row="toggleExpand"
    >
      <template #bottom />

      <template #item.uptime="{ item }">
        {{ formatSeconds(item.uptime) }}
      </template>

      <template #item.location="{ item }">
        <span :class="'fi fi-' + getFlagCode(item.location)" />
      </template>

      <template #item.ipv4="{ item }">
        <v-tooltip :disabled="item.ipv4 !== 'nat'" location="top">
          {{ $t('table.tooltip.nat') }}
          <template #activator="{ props }">
            <v-icon v-bind="props" class="mr-1" :color="getNetProtoColor(item.ipv4)">
              {{ getNetProtoIcon(item.ipv4) }}
            </v-icon>
          </template>
        </v-tooltip>
      </template>

      <template #item.ipv6="{ item }">
        <v-tooltip :disabled="item.ipv6 !== 'nat'" location="top">
          {{ $t('table.tooltip.nat') }}
          <template #activator="{ props }">
            <v-icon v-bind="props" class="mr-1" :color="getNetProtoColor(item.ipv6)">
              {{ getNetProtoIcon(item.ipv6) }}
            </v-icon>
          </template>
        </v-tooltip>
      </template>

      <template #item.net_recv="{ item }">
        {{ formatSpeed(item.net_recv, speedUnit === 'bit') }}
      </template>

      <template #item.net_sent="{ item }">
        {{ formatSpeed(item.net_sent, speedUnit === 'bit') }}
      </template>

      <template #item.traffic_1d_recv="{ item }">
        {{ formatSize(item.traffic_1d_recv) }}
      </template>

      <template #item.traffic_1d_sent="{ item }">
        {{ formatSize(item.traffic_1d_sent) }}
      </template>

      <template #item.traffic_1m_recv="{ item }">
        {{ formatSize(item.traffic_1m_recv) }}
      </template>

      <template #item.traffic_1m_sent="{ item }">
        {{ formatSize(item.traffic_1m_sent) }}
      </template>

      <template #item.cpu="{ item }">
        <v-progress-circular :color="`${getCPUColor(item.cpu)}`" :model-value="item.cpu">
          {{ item.cpu }}%
        </v-progress-circular>
      </template>

      <template #item.memory="{ item }">
        <v-progress-circular :color="`${getMemoryColor(item.memory)}`" :model-value="item.memory">
          {{ item.memory }}%
        </v-progress-circular>
      </template>

      <template #item.disk="{ item }">
        <v-progress-circular :color="`${getDiskColor(item.disk)}`" :model-value="item.disk">
          {{ item.disk }}%
        </v-progress-circular>
      </template>

      <template #item.ping_cm="{ item }">
        <v-sheet class="rounded" :color="showPingLatency ? getLatencyColor(item.ping_cm) : getLossColor(item.ping_cm)">
          <template v-if="!showPingLatency">
            {{ formatLoss(item.ping_cm) }}
          </template>

          <template v-else>
            {{ formatLatency(item.ping_cm) }}
          </template>
        </v-sheet>
      </template>

      <template #item.ping_ct="{ item }">
        <v-sheet class="rounded" :color="showPingLatency ? getLatencyColor(item.ping_ct) : getLossColor(item.ping_ct)">
          <template v-if="!showPingLatency">
            {{ formatLoss(item.ping_ct) }}
          </template>

          <template v-else>
            {{ formatLatency(item.ping_ct) }}
          </template>
        </v-sheet>
      </template>

      <template #item.ping_cu="{ item }">
        <v-sheet class="rounded" :color="showPingLatency ? getLatencyColor(item.ping_cu) : getLossColor(item.ping_cu)">
          <template v-if="!showPingLatency">
            {{ formatLoss(item.ping_cu) }}
          </template>

          <template v-else>
            {{ formatLatency(item.ping_cu) }}
          </template>
        </v-sheet>
      </template>

      <template #expanded-row="{ columns, item }">
        <ExpandedRow
          :columns="columns"
          :item="item"
          :ping-ip-version="pingIpVersion"
          :show-estimated-monthly-traffic="showEstimatedMonthlyTraffic"
          :speed-unit="speedUnit"
        />
      </template>
    </v-data-table>

    <!-- 3D Earth Globe Modal Dialog -->
    <GlobeDialog
      v-model="showGlobeDialog"
      :is-dark="darkMode"
      :nodes="viewData"
      :speed-unit="speedUnit"
    />
  </v-container>
</template>

<script setup>
  import axios from 'axios'
  import { ms } from 'enhanced-ms'
  import Papa from 'papaparse'
  import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useDisplay, useTheme } from 'vuetify'
  import ExpandedRow from '@/components/ExpandedRow.vue'
  import GlobeDialog from '@/components/GlobeDialog.vue'
  import OverviewBar from '@/components/OverviewBar.vue'
  import {
    formatLatency,
    formatLoss,
    formatSeconds,
    formatSize,
    formatSpeed,
    getFlagCode,
  } from '@/utils/format'
  import {
    getCPUColor,
    getDiskColor,
    getLatencyColor,
    getLossColor,
    getMemoryColor,
    getNetProtoColor,
    getNetProtoIcon,
  } from '@/utils/ui'
  import { languageOptions } from '../i18n'
  import 'flag-icons/css/flag-icons.min.css'

  const PING_METRIC_SUFFIXES = ['cm', 'ct', 'cu']
  const maxHistoryPoints = 60
  const refreshIntervalMs = 1000
  const searchKeywords = ['iepl', 'nat', 'cn', 'hk', 'jp', 'sg', 'us']

  const { t, locale } = useI18n()
  const theme = useTheme()
  const display = useDisplay()

  const showGlobeDialog = ref(false)
  const darkMode = ref(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const isRefreshEnabled = ref(true)
  const expandedRows = ref([])
  const db = ref([])
  const viewData = ref([])
  const currentDate = ref('')
  const currentTime = ref('')
  const speedUnit = ref('byte')
  const showPingLatency = ref(false)
  const pingIpVersion = ref('auto')
  const showEstimatedDailyTraffic = ref(false)
  const showEstimatedMonthlyTraffic = ref(false)
  const search = ref('')

  let refreshTimer = null
  let clockTimer = null
  let themeMediaQuery = null
  let themeChangeHandler = null

  const apiConfigs = [
    { key: 'cpu', url: '/api/cpu', intervalMs: 1000, lastFetch: 0 },
    { key: 'net', url: '/api/net', intervalMs: 1000, lastFetch: 0 },
    { key: 'ping', url: '/api/ping', intervalMs: 1000, lastFetch: 0 },
    { key: 'info', url: '/api/info', intervalMs: 1000, lastFetch: 0 },
    { key: 'mem', url: '/api/mem', intervalMs: 10_000, lastFetch: 0 },
    { key: 'disk', url: '/api/disk', intervalMs: 10_000, lastFetch: 0 },
    { key: 'traffic', url: '/api/traffic', intervalMs: 10_000, lastFetch: 0 },
    { key: 'traffic_1d', url: '/api/traffic/last-day', intervalMs: 60_000, lastFetch: 0 },
    { key: 'traffic_1m', url: '/api/traffic/last-month', intervalMs: 60_000, lastFetch: 0 },
  ]

  const title = computed(() => t('app.title'))
  watchEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = title.value
    }
  })

  const overviewStats = computed(() => {
    const totalCount = viewData.value.length
    const onlineCount = viewData.value.filter(item => item.uptime > 0).length
    const onlinePercent = totalCount === 0 ? 0 : Math.round(onlineCount / totalCount * 100)

    const regions = new Set(viewData.value.map(item => item.location).filter(loc => loc && loc !== 'un'))
    const uniqueRegions = regions.size

    const trafficRecv = viewData.value.reduce((sum, item) => sum + (item.traffic_1m_recv || 0), 0)
    const trafficSent = viewData.value.reduce((sum, item) => sum + (item.traffic_1m_sent || 0), 0)
    const totalTrafficRecv = formatSize(trafficRecv)
    const totalTrafficSent = formatSize(trafficSent)

    const speedRecv = viewData.value.reduce((sum, item) => sum + (item.net_recv || 0), 0)
    const speedSent = viewData.value.reduce((sum, item) => sum + (item.net_sent || 0), 0)
    const totalSpeedRecv = formatSpeed(speedRecv, speedUnit.value === 'bit')
    const totalSpeedSent = formatSpeed(speedSent, speedUnit.value === 'bit')

    return {
      onlineCount,
      totalCount,
      onlinePercent,
      uniqueRegions,
      totalTrafficRecv,
      totalTrafficSent,
      totalSpeedRecv,
      totalSpeedSent,
    }
  })

  const overview = computed(() => ({
    currentDate: currentDate.value,
    currentTime: currentTime.value,
    ...overviewStats.value,
  }))

  const filteredViewData = computed(() => {
    if (!search.value) {
      return viewData.value
    }
    const searchTerm = search.value.toLowerCase()
    return viewData.value.filter(item => {
      for (const key in item) {
        if (key.endsWith('_detail')) {
          continue
        }
        if (item[key] !== null && item[key] !== undefined && typeof item[key] === 'string') {
          const value = String(item[key]).toLowerCase()
          if (value.includes(searchTerm)) {
            return true
          }
        }
      }
      return false
    })
  })

  const languageMap = computed(() => new Map(languageOptions.map(obj => [obj.value, obj])))

  const pingIpVersionItems = computed(() => [
    { text: t('table.title.pingAuto'), value: 'auto' },
    { text: t('table.title.pingV4'), value: 'v4' },
    { text: t('table.title.pingV6'), value: 'v6' },
  ])

  const headers = computed(() => [
    { title: t('table.title.node'), key: 'host', align: 'center', minWidth: '8em', fixed: true, headerProps: { style: 'font-weight: bold;' } },
    { title: t('table.title.uptime'), key: 'uptime', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
    {
      title: t('table.title.networkStack'),
      align: 'center',
      headerProps: { style: 'font-weight: bold;' },
      children: [
        { title: t('table.title.ipv4'), key: 'ipv4', align: 'center', headerProps: { style: 'font-weight: bold;' } },
        { title: t('table.title.ipv6'), key: 'ipv6', align: 'center', headerProps: { style: 'font-weight: bold;' } },
      ],
    },
    { title: t('table.title.location'), key: 'location', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
    { title: t('table.title.load'), key: 'load', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
    {
      title: t('table.title.speed'),
      align: 'center',
      headerProps: { style: 'font-weight: bold;' },
      children: [
        { title: t('table.title.receive'), key: 'net_recv', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-download' },
        { title: t('table.title.send'), key: 'net_sent', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-upload' },
      ],
    },
    {
      title: t(showEstimatedDailyTraffic.value ? 'table.title.estimatedDailyTraffic' : 'table.title.dailyTraffic'),
      align: 'center',
      headerProps: {
        style: 'font-weight: bold; cursor: pointer;',
        onClick: () => toggleDailyTraffic(),
      },
      children: [
        { title: t('table.title.receive'), key: 'traffic_1d_recv', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-download' },
        { title: t('table.title.send'), key: 'traffic_1d_sent', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-upload' },
      ],
    },
    {
      title: t(showEstimatedMonthlyTraffic.value ? 'table.title.estimatedMonthlyTraffic' : 'table.title.monthlyTraffic'),
      align: 'center',
      headerProps: {
        style: 'font-weight: bold; cursor: pointer;',
        onClick: () => toggleMonthlyTraffic(),
      },
      children: [
        { title: t('table.title.receive'), key: 'traffic_1m_recv', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-download' },
        { title: t('table.title.send'), key: 'traffic_1m_sent', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-upload' },
      ],
    },
    { title: t('table.title.cpu'), key: 'cpu', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
    { title: t('table.title.memory'), key: 'memory', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
    { title: t('table.title.disk'), key: 'disk', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
    {
      title: t(showPingLatency.value ? 'table.title.latency' : 'table.title.loss') + ' (' + t('table.title.ping' + pingIpVersion.value.charAt(0).toUpperCase() + pingIpVersion.value.slice(1)) + ')',
      align: 'center',
      headerProps: {
        style: 'font-weight: bold; cursor: pointer;',
        onClick: () => togglePingLatency(),
      },
      children: [
        { title: t('table.title.cm'), key: 'ping_cm', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        { title: t('table.title.ct'), key: 'ping_ct', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        { title: t('table.title.cu'), key: 'ping_cu', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
      ],
    },
  ])

  function getCookie (name) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const localVal = window.localStorage.getItem(`pref_${name}`)
      if (localVal !== null) {
        return localVal
      }
    }
    if (typeof document === 'undefined') return undefined
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop().split(';').shift()
    }
  }

  function setCookie (name, value, days = 30) {
    if (typeof cookieStore !== 'undefined') {
      cookieStore.set({
        name,
        value: String(value),
        expires: Date.now() + ms(days + 'd'),
        path: '/',
      }).catch(() => null)
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`pref_${name}`, String(value))
    }
  }

  function applySavedPreferences () {
    const savedLang = getCookie('lang')
    if (savedLang && languageMap.value.has(savedLang)) {
      locale.value = savedLang
    }

    const savedSpeedUnit = getCookie('speedUnit')
    if (['bit', 'byte'].includes(savedSpeedUnit)) {
      speedUnit.value = savedSpeedUnit
    }

    const savedPingIpVersion = getCookie('pingIpVersion')
    if (['auto', 'v4', 'v6'].includes(savedPingIpVersion)) {
      pingIpVersion.value = savedPingIpVersion
    }
  }

  function toggleExpand (_, { item }) {
    const index = expandedRows.value.indexOf(item.host)
    if (index === -1) {
      expandedRows.value.push(item.host)
    } else {
      expandedRows.value.splice(index, 1)
    }
  }

  function toggleDarkMode () {
    darkMode.value = !darkMode.value
    theme.change(darkMode.value ? 'dark' : 'light')
  }

  function toggleLanguageChange (lang) {
    locale.value = lang
    setCookie('lang', lang)
    updateChartSeriesNames()
    updateViewData()
    updateClock()
  }

  function updateChartSeriesNames () {
    const speedNames = [t('table.title.receive'), t('table.title.send')]
    const latencyNames = [t('table.title.cm'), t('table.title.ct'), t('table.title.cu')]
    for (const view of viewData.value) {
      if (view.chart?.speed?.length) {
        for (const [i, s] of view.chart.speed.entries()) {
          if (speedNames[i] !== undefined) {
            s.name = speedNames[i]
          }
        }
      }
      if (view.chart?.latency?.length) {
        for (const [i, s] of view.chart.latency.entries()) {
          if (latencyNames[i] !== undefined) {
            s.name = latencyNames[i]
          }
        }
      }
    }
  }

  function toggleSpeedUnit () {
    speedUnit.value = speedUnit.value === 'bit' ? 'byte' : 'bit'
    setCookie('speedUnit', speedUnit.value)
    updateViewData()
  }

  function togglePingLatency () {
    showPingLatency.value = !showPingLatency.value
    updateViewData()
  }

  function togglePingIpVersion (version) {
    pingIpVersion.value = version
    setCookie('pingIpVersion', version)
    for (const view of viewData.value) {
      view.chart.latency = null
    }
    updateViewData()
  }

  function toggleDailyTraffic () {
    const now = new Date()
    const startInDay = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    if (now - startInDay >= 60 * 1000) {
      showEstimatedDailyTraffic.value = !showEstimatedDailyTraffic.value
      updateViewData()
    }
  }

  function toggleMonthlyTraffic () {
    const now = new Date()
    const startInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1)
    if (now - startInMonth >= 60 * 1000) {
      showEstimatedMonthlyTraffic.value = !showEstimatedMonthlyTraffic.value
      updateViewData()
    }
  }

  function initializeView (host) {
    const hostLocation = host && host.includes('-') ? host.split('-').pop().trim().toLowerCase() : 'un'
    return {
      host,
      uptime: 0,
      ipv4: '-',
      ipv6: '-',
      location: hostLocation || 'un',
      cpu: 0,
      memory: 0,
      disk: 0,
      load: 0,
      net_recv: 0,
      net_sent: 0,
      traffic_1d_recv: 0,
      traffic_1d_sent: 0,
      traffic_1m_recv: 0,
      traffic_1m_sent: 0,
      traffic_quota: 0,
      load_detail: '-',
      cpu_cores: 0,
      cpu_detail: '-',
      memory_detail: '-',
      swap_detail: '-',
      disk_detail: '-',
      network_detail: '-',
      traffic_detail: '-',
      monthly_traffic_detail: '-',
      ping_cm: 500,
      ping_ct: 500,
      ping_cu: 500,
      lossv4_detail: '-',
      pingv4_detail: '-',
      lossv6_detail: '-',
      pingv6_detail: '-',
      cpu_module: '-',
      kernel: '-',
      chart: {
        speed: [],
        latency: [],
      },
    }
  }

  function formatViewDataItem (item, view) {
    if (!item?.host) {
      return null
    }

    const newView = view || initializeView(item.host)

    if (view && item.cpu?.uptime && item.cpu.uptime < view.uptime) {
      return view
    }

    updateInfoView(item.info, newView, item.host)
    updateCpuView(item.cpu, newView)
    updateMemoryView(item.mem, newView)
    updateDiskView(item.disk, newView)
    updateNetworkView(item.net, newView)
    updateTrafficView(item.traffic, item.traffic_1d, item.traffic_1m, newView)
    updatePingView(item.ping, newView)

    return newView
  }

  function updateInfoView (info, view, host) {
    const hostLocation = host && host.includes('-') ? host.split('-').pop().trim().toLowerCase() : ''
    if (!info) {
      if ((!view.location || view.location === 'un') && hostLocation) {
        view.location = hostLocation
      }
      return
    }
    view.ipv4 = info.have_ipv4 || ''
    view.ipv6 = info.have_ipv6 || ''
    view.location = (info.loc || hostLocation || view.location || 'un').toLowerCase()
    view.network_detail = `${formatSpeed(info.down_mbps / 8 * 1000 * 1000, speedUnit.value === 'bit')} / ${formatSpeed(info.up_mbps / 8 * 1000 * 1000, speedUnit.value === 'bit')}`
    view.cpu_module = info.cpu
    view.kernel = info.kernel
    view.traffic_quota = info.traffic_quota_gb * 1000 * 1000 * 1000
  }

  function updateCpuView (cpu, view) {
    if (!cpu) {
      return
    }
    view.uptime = cpu.uptime
    view.load = cpu.load1.toFixed(2) || 0
    view.cpu = Math.round(cpu.usage_user + cpu.usage_system + cpu.usage_steal) || 0
    view.load_detail = `${cpu.load1.toFixed(2)} / ${cpu.load5.toFixed(2)} / ${cpu.load15.toFixed(2)}`
    view.cpu_detail = `${cpu.usage_system.toFixed(2)}% / ${cpu.usage_user.toFixed(2)}% / ${cpu.usage_steal.toFixed(2)}%`
    view.cpu_cores = cpu.n_cpus
  }

  function updateMemoryView (mem, view) {
    if (!mem) {
      return
    }
    view.memory = Math.round(mem.used / mem.total * 100) || 0
    view.memory_detail = `${formatSize(mem.used, { standard: 'iec' })} (${Math.round(mem.used / mem.total * 100)}%) / ${formatSize(mem.total, { standard: 'iec' })}`
    view.swap_detail = `${formatSize((mem.swap_total - mem.swap_free), { standard: 'iec' })} (${Math.round((mem.swap_total - mem.swap_free) / mem.swap_total * 100)}%) / ${formatSize(mem.swap_total, { standard: 'iec' })}`
  }

  function updateDiskView (disk, view) {
    if (!disk) {
      return
    }
    view.disk = Math.round(disk.used / disk.total * 100) || 0
    view.disk_detail = `${formatSize(disk.used, { standard: 'iec' })} (${Math.round(disk.used / disk.total * 100)}%) / ${formatSize(disk.total, { standard: 'iec' })}`
  }

  function updateNetworkView (net, view) {
    if (!net) {
      return
    }
    view.net_recv = net.bytes_recv
    view.net_sent = net.bytes_sent
    appendSpeedChart(view, net)
  }

  function initializeSpeedChart () {
    const now = Date.now()
    return [
      {
        name: t('table.title.receive'),
        data: Array.from({ length: maxHistoryPoints }, (_, i) => [
          now - (maxHistoryPoints - i + 1) * 1000,
          0,
        ]),
      },
      {
        name: t('table.title.send'),
        data: Array.from({ length: maxHistoryPoints }, (_, i) => [
          now - (maxHistoryPoints - i + 1) * 1000,
          0,
        ]),
      },
    ]
  }

  function appendSpeedChart (view, net) {
    const now = Date.now()
    const speedChart = view.chart.speed?.length ? view.chart.speed : initializeSpeedChart()

    for (const [index, value] of [net.bytes_recv, net.bytes_sent].entries()) {
      const data = speedChart[index]?.data || []
      if (data.length >= maxHistoryPoints) {
        data.shift()
      }
      data.push([now, value])
    }

    view.chart.speed = speedChart
  }

  function initializeLatencyChart () {
    const now = Date.now()
    return [
      {
        name: t('table.title.cm'),
        data: Array.from({ length: maxHistoryPoints }, (_, i) => [
          now - (maxHistoryPoints - i + 1) * 1000,
          0,
        ]),
      },
      {
        name: t('table.title.ct'),
        data: Array.from({ length: maxHistoryPoints }, (_, i) => [
          now - (maxHistoryPoints - i + 1) * 1000,
          0,
        ]),
      },
      {
        name: t('table.title.cu'),
        data: Array.from({ length: maxHistoryPoints }, (_, i) => [
          now - (maxHistoryPoints - i + 1) * 1000,
          0,
        ]),
      },
    ]
  }

  function appendLatencyChart (view, metrics) {
    const now = Date.now()
    const latencyChart = view.chart.latency?.length ? view.chart.latency : initializeLatencyChart()
    const latencyValues = [metrics.ping.cm, metrics.ping.ct, metrics.ping.cu]

    for (const [index, value] of latencyValues.entries()) {
      const data = latencyChart[index]?.data || []
      if (data.length >= maxHistoryPoints) {
        data.shift()
      }
      data.push([now, value])
    }

    view.chart.latency = latencyChart
  }

  function calculateTrafficRange (currentTraffic, previousTraffic, uptimeMs, rangeStart) {
    const elapsedMs = Date.now() - rangeStart.getTime()
    const hasSnapshot = previousTraffic && uptimeMs > elapsedMs

    if (hasSnapshot) {
      return {
        recv: Math.max(0, currentTraffic.bytes_recv - (previousTraffic.bytes_recv || 0)),
        sent: Math.max(0, currentTraffic.bytes_sent - (previousTraffic.bytes_sent || 0)),
      }
    }

    if (uptimeMs <= 0) {
      return { recv: 0, sent: 0 }
    }

    const rate = elapsedMs / uptimeMs
    return {
      recv: Math.max(0, currentTraffic.bytes_recv * rate),
      sent: Math.max(0, currentTraffic.bytes_sent * rate),
    }
  }

  function estimateTrafficRange (traffic, rangeStart, rangeEnd) {
    const elapsedMs = Date.now() - rangeStart.getTime()
    if (elapsedMs < 60 * 1000) {
      return traffic
    }

    const rate = (rangeEnd.getTime() - rangeStart.getTime()) / elapsedMs
    return {
      recv: traffic.recv * rate,
      sent: traffic.sent * rate,
    }
  }

  function normalizePingMetric (value, max) {
    return Math.min(max, Math.round(value || 0))
  }

  function getPingMetrics (ping, version) {
    return PING_METRIC_SUFFIXES.reduce((metrics, suffix) => {
      metrics.ping[suffix] = normalizePingMetric(ping[`ping_${suffix}${version}`], 500)
      metrics.loss[suffix] = normalizePingMetric(ping[`loss_${suffix}${version}`], 100)
      return metrics
    }, { ping: {}, loss: {} })
  }

  function applyPingMetricsToView (view, metrics) {
    const metricType = showPingLatency.value ? 'ping' : 'loss'
    view.ping_cm = metrics[metricType].cm
    view.ping_ct = metrics[metricType].ct
    view.ping_cu = metrics[metricType].cu
  }

  function formatPingDetail (metrics, unit = '') {
    return PING_METRIC_SUFFIXES
      .map(suffix => `${metrics[suffix]}${unit}`)
      .join(' / ')
  }

  function getTrafficRangeBoundaries (now = new Date()) {
    const year = now.getUTCFullYear()
    const month = now.getUTCMonth()
    const day = now.getUTCDate()

    return {
      dayStart: new Date(Date.UTC(year, month, day, 0, 5, 0, 0)),
      nextDayStart: new Date(Date.UTC(year, month, day + 1)),
      monthStart: new Date(Date.UTC(year, month, 1, 0, 5, 0, 0)),
      nextMonthStart: new Date(Date.UTC(year, month + 1, 1)),
    }
  }

  function getTrafficViewData (currentTraffic, previousTraffic, uptimeMs, rangeStart, rangeEnd, shouldEstimate) {
    const traffic = calculateTrafficRange(currentTraffic, previousTraffic, uptimeMs, rangeStart)
    return shouldEstimate
      ? estimateTrafficRange(traffic, rangeStart, rangeEnd)
      : traffic
  }

  function formatQuotaUsageDetail (totalTraffic, quota) {
    if (quota > 0) {
      const usage = Math.round(totalTraffic / quota * 100)
      return `${formatSize(totalTraffic)} (${usage}%) / ${formatSize(quota)}`
    }

    return `${formatSize(totalTraffic)} / ${formatSize(quota)}`
  }

  function updateTrafficView (currentTraffic, last1dTraffic, last1mTraffic, view) {
    if (!currentTraffic) {
      return
    }

    const uptimeMs = view.uptime * 1000
    const { dayStart, nextDayStart, monthStart, nextMonthStart } = getTrafficRangeBoundaries()
    const dailyTraffic = getTrafficViewData(
      currentTraffic,
      last1dTraffic,
      uptimeMs,
      dayStart,
      nextDayStart,
      showEstimatedDailyTraffic.value,
    )
    view.traffic_1d_recv = dailyTraffic.recv
    view.traffic_1d_sent = dailyTraffic.sent

    const monthlyTraffic = getTrafficViewData(
      currentTraffic,
      last1mTraffic,
      uptimeMs,
      monthStart,
      nextMonthStart,
      showEstimatedMonthlyTraffic.value,
    )

    view.traffic_1m_recv = monthlyTraffic.recv
    view.traffic_1m_sent = monthlyTraffic.sent

    const totalTraffic = currentTraffic.bytes_recv + currentTraffic.bytes_sent
    view.traffic_detail = `${formatSize(currentTraffic.bytes_recv)} / ${formatSize(currentTraffic.bytes_sent)} / ${formatSize(totalTraffic)}`
    const monthlyTotalTraffic = monthlyTraffic.recv + monthlyTraffic.sent
    view.monthly_traffic_detail = formatQuotaUsageDetail(monthlyTotalTraffic, view.traffic_quota)
  }

  function resolvePingIpVersion (view) {
    if (pingIpVersion.value === 'v6') {
      return true
    }
    if (pingIpVersion.value === 'v4') {
      return false
    }
    // 'auto' mode: prefer IPv6, fallback to IPv4
    if (view.ipv6 === 'yes') {
      return true
    }
    return false
  }

  function updatePingView (ping, view) {
    if (!ping) {
      return
    }
    const ipv6Metrics = getPingMetrics(ping, 'v6')
    const ipv4Metrics = getPingMetrics(ping, 'v4')

    // Always compute detail strings for both versions
    view.lossv4_detail = formatPingDetail(ipv4Metrics.loss, '%')
    view.pingv4_detail = formatPingDetail(ipv4Metrics.ping, ' ms')
    view.lossv6_detail = formatPingDetail(ipv6Metrics.loss, '%')
    view.pingv6_detail = formatPingDetail(ipv6Metrics.ping, ' ms')

    // Determine which IP version to use for table display and latency chart
    const useV6 = resolvePingIpVersion(view)
    const activeMetrics = useV6 ? ipv6Metrics : ipv4Metrics

    applyPingMetricsToView(view, activeMetrics)
    appendLatencyChart(view, activeMetrics)
  }

  function updateViewData () {
    if (!db.value || db.value.length === 0) {
      return
    }
    const previousViewDataMap = new Map(viewData.value.map(r => [r.host, r]))
    viewData.value = db.value.map(item => formatViewDataItem(item, previousViewDataMap.get(item.host)))
  }

  async function fetchData () {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const now = Date.now()

    const pendingRequests = apiConfigs.filter(config =>
      (now - config.lastFetch) >= config.intervalMs,
    ).map(config => {
      return axios.get(`${baseUrl}${config.url}`)
        .then(res => ({ key: config.key, res }))
        .catch(error => {
          console.error(`Fetch failed for ${config.url}`, error)
          return { key: config.key, res: null }
        })
    })

    if (pendingRequests.length === 0) {
      return
    }

    try {
      const results = await Promise.all(pendingRequests)
      const dataMap = new Map(db.value.map(row => [row.host, row]))

      for (const { key, res } of results) {
        if (!res || !res.data) {
          continue
        }

        const config = apiConfigs.find(c => c.key === key)
        if (!config) {
          continue
        }
        config.lastFetch = now

        const csvText = res.data
        const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true })

        for (const row of parsed.data.filter(
          row => row.host && row.host.trim() !== '',
        )) {
          const host = row.host
          if (!dataMap.has(host)) {
            dataMap.set(host, {
              host,
            })
          }
          const item = dataMap.get(host)
          item[key] = row
        }
      }

      db.value = Array.from(dataMap.values())
      updateViewData()
    } catch (error) {
      console.error('fetchData error:', error)
    }
  }

  function stopRefreshTimer () {
    if (refreshTimer !== null) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  function startRefreshTimer () {
    stopRefreshTimer()
    refreshTimer = window.setInterval(() => {
      fetchData()
    }, refreshIntervalMs)
  }

  function stopRefresh () {
    isRefreshEnabled.value = !isRefreshEnabled.value
    if (isRefreshEnabled.value) {
      startRefreshTimer()
    } else {
      stopRefreshTimer()
    }
  }

  function updateTheme (mode) {
    darkMode.value = mode
    theme.change(mode ? 'dark' : 'light')
  }

  function bindThemePreferenceListener () {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    updateTheme(themeMediaQuery.matches)
    themeChangeHandler = ({ matches }) => {
      updateTheme(matches)
    }
    themeMediaQuery.addEventListener('change', themeChangeHandler)
  }

  function updateClock () {
    const now = new Date()
    const isSmallScreen = display.smAndDown.value
    currentDate.value = now.toLocaleDateString(locale.value, isSmallScreen
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    )
    currentTime.value = now.toLocaleTimeString(locale.value, isSmallScreen ? undefined : { timeZoneName: 'short' })
  }

  onMounted(() => {
    applySavedPreferences()

    updateClock()
    clockTimer = window.setInterval(() => updateClock(), 1000)

    fetchData()
    if (isRefreshEnabled.value) {
      startRefreshTimer()
    }

    bindThemePreferenceListener()
  })

  onBeforeUnmount(() => {
    stopRefreshTimer()
    if (clockTimer) {
      clearInterval(clockTimer)
    }
    if (themeMediaQuery && themeChangeHandler) {
      themeMediaQuery.removeEventListener('change', themeChangeHandler)
    }
  })
</script>

<style>
.frosted-glass,
.frosted-table {
  border-radius: 16px;
  overflow: hidden;
}

.frosted-glass {
  background-color: rgba(255, 255, 255, 0.84) !important;
}

.v-theme--dark .frosted-glass {
  background-color: rgba(30, 30, 30, 0.84) !important;
}

.v-data-table,
.v-data-table thead,
.v-data-table tbody tr {
  background-color: rgba(255, 255, 255, 0.64) !important;
}

.v-theme--dark .v-data-table,
.v-theme--dark .v-data-table thead,
.v-theme--dark .v-data-table tbody tr {
  background-color: rgba(30, 30, 30, 0.64) !important;
}
</style>
