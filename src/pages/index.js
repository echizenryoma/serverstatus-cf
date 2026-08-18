import axios from 'axios'
import { ms } from 'enhanced-ms'
import Papa from 'papaparse'
import { computed, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import ExpandedRow from '@/components/ExpandedRow.vue'
import GlobeDialog from '@/components/GlobeDialog.vue'
import { formatLatency, formatLoss, formatSeconds, formatSize, formatSpeed } from '@/utils/format'
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

export default {
  components: {
    ExpandedRow,
    GlobeDialog,
  },
  setup () {
    const { t } = useI18n()
    const title = computed(() => t('app.title'))
    watchEffect(() => {
      document.title = title.value
    })
  },
  data () {
    return {
      showGlobeDialog: false,
      languageOptions,
      darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
      themeMediaQuery: null,
      isRefreshEnabled: true,
      expandedRows: [],
      db: [],
      viewData: [],
      refreshTimer: null,
      clockTimer: null,
      currentDate: '',
      currentTime: '',
      themeChangeHandler: null,
      refreshIntervalMs: 1000,
      apiConfigs: [
        { key: 'cpu', url: '/api/cpu', intervalMs: 1000, lastFetch: 0 },
        { key: 'net', url: '/api/net', intervalMs: 1000, lastFetch: 0 },
        { key: 'ping', url: '/api/ping', intervalMs: 1000, lastFetch: 0 },
        { key: 'info', url: '/api/info', intervalMs: 1000, lastFetch: 0 },
        { key: 'mem', url: '/api/mem', intervalMs: 10_000, lastFetch: 0 },
        { key: 'disk', url: '/api/disk', intervalMs: 10_000, lastFetch: 0 },
        { key: 'traffic', url: '/api/traffic', intervalMs: 10_000, lastFetch: 0 },
        { key: 'traffic_1d', url: '/api/traffic/last-day', intervalMs: 60_000, lastFetch: 0 },
        { key: 'traffic_1m', url: '/api/traffic/last-month', intervalMs: 60_000, lastFetch: 0 },
      ],
      speedUnit: 'byte',
      maxHistoryPoints: 60,
      showPingLatency: false,
      pingIpVersion: 'auto',
      showEstimatedDailyTraffic: false,
      showEstimatedMonthlyTraffic: false,
      searchKeywords: ['iepl', 'nat', 'cn', 'hk', 'jp', 'sg', 'us'],
      search: '',
    }
  },
  computed: {
    title () {
      return this.$t('app.title')
    },
    overviewStats () {
      const totalCount = this.viewData.length
      const onlineCount = this.viewData.filter(item => item.uptime > 0).length
      const onlinePercent = totalCount === 0 ? 0 : Math.round(onlineCount / totalCount * 100)

      const regions = new Set(this.viewData.map(item => item.location).filter(loc => loc && loc !== 'un'))
      const uniqueRegions = regions.size

      const trafficRecv = this.viewData.reduce((sum, item) => sum + (item.traffic_1m_recv || 0), 0)
      const trafficSent = this.viewData.reduce((sum, item) => sum + (item.traffic_1m_sent || 0), 0)
      const totalTrafficRecv = formatSize(trafficRecv)
      const totalTrafficSent = formatSize(trafficSent)

      const speedRecv = this.viewData.reduce((sum, item) => sum + (item.net_recv || 0), 0)
      const speedSent = this.viewData.reduce((sum, item) => sum + (item.net_sent || 0), 0)
      const totalSpeedRecv = formatSpeed(speedRecv, this.speedUnit === 'bit')
      const totalSpeedSent = formatSpeed(speedSent, this.speedUnit === 'bit')

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
    },
    overview () {
      return {
        currentDate: this.currentDate,
        currentTime: this.currentTime,
        ...this.overviewStats,
      }
    },
    filteredViewData () {
      if (!this.search) {
        return this.viewData
      }
      const searchTerm = this.search.toLowerCase()
      return this.viewData.filter(item => {
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
    },
    languageMap () {
      return new Map(languageOptions.map(obj => [obj.value, obj]))
    },
    pingIpVersionItems () {
      return [
        { text: this.$t('server.title.pingAuto'), value: 'auto' },
        { text: this.$t('server.title.pingV4'), value: 'v4' },
        { text: this.$t('server.title.pingV6'), value: 'v6' },
      ]
    },
    headers () {
      return [
        { title: this.$t('server.title.node'), key: 'host', align: 'center', minWidth: '8em', fixed: true, headerProps: { style: 'font-weight: bold;' } },
        { title: this.$t('server.title.uptime'), key: 'uptime', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        {
          title: this.$t('server.title.networkStack'),
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: this.$t('server.title.ipv4'), key: 'ipv4', align: 'center', headerProps: { style: 'font-weight: bold;' } },
            { title: this.$t('server.title.ipv6'), key: 'ipv6', align: 'center', headerProps: { style: 'font-weight: bold;' } },
          ],
        },
        { title: this.$t('server.title.location'), key: 'location', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        { title: this.$t('server.title.load'), key: 'load', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        {
          title: this.$t('server.title.speed'),
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: this.$t('server.title.receive'), key: 'net_recv', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-download' },
            { title: this.$t('server.title.send'), key: 'net_sent', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-upload' },
          ],
        },
        {
          title: this.$t(this.showEstimatedDailyTraffic ? 'server.title.estimatedDailyTraffic' : 'server.title.dailyTraffic'),
          align: 'center',
          headerProps: {
            style: 'font-weight: bold; cursor: pointer;',
            onClick: () => this.toggleDailyTraffic(),
          },
          children: [
            { title: this.$t('server.title.receive'), key: 'traffic_1d_recv', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-download' },
            { title: this.$t('server.title.send'), key: 'traffic_1d_sent', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-upload' },
          ],
        },
        {
          title: this.$t(this.showEstimatedMonthlyTraffic ? 'server.title.estimatedMonthlyTraffic' : 'server.title.monthlyTraffic'),
          align: 'center',
          headerProps: {
            style: 'font-weight: bold; cursor: pointer;',
            onClick: () => this.toggleMonthlyTraffic(),
          },
          children: [
            { title: this.$t('server.title.receive'), key: 'traffic_1m_recv', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-download' },
            { title: this.$t('server.title.send'), key: 'traffic_1m_sent', align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-upload' },
          ],
        },
        { title: this.$t('server.title.cpu'), key: 'cpu', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        { title: this.$t('server.title.memory'), key: 'memory', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        { title: this.$t('server.title.disk'), key: 'disk', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        {
          title: this.$t(this.showPingLatency ? 'server.title.latency' : 'server.title.loss') + ' (' + this.$t('server.title.ping' + this.pingIpVersion.charAt(0).toUpperCase() + this.pingIpVersion.slice(1)) + ')',
          align: 'center',
          headerProps: {
            style: 'font-weight: bold; cursor: pointer;',
            onClick: () => this.togglePingLatency(),
          },
          children: [
            { title: this.$t('server.title.cm'), key: 'ping_cm', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
            { title: this.$t('server.title.ct'), key: 'ping_ct', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
            { title: this.$t('server.title.cu'), key: 'ping_cu', align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
          ],
        },
      ]
    },
  },
  methods: {
    formatSpeed,
    formatSize,
    formatSeconds,
    formatLatency,
    formatLoss,
    getNetProtoColor,
    getNetProtoIcon,
    getLossColor,
    getLatencyColor,
    getCPUColor,
    getMemoryColor,
    getDiskColor,
    applySavedPreferences () {
      const savedLang = this.getCookie('lang')
      if (savedLang && this.languageMap.has(savedLang)) {
        this.$i18n.locale = savedLang
      }

      const savedSpeedUnit = this.getCookie('speedUnit')
      if (['bit', 'byte'].includes(savedSpeedUnit)) {
        this.speedUnit = savedSpeedUnit
      }

      const savedPingIpVersion = this.getCookie('pingIpVersion')
      if (['auto', 'v4', 'v6'].includes(savedPingIpVersion)) {
        this.pingIpVersion = savedPingIpVersion
      }
    },
    toggleExpand (_, { item }) {
      const index = this.expandedRows.indexOf(item.host)
      if (index === -1) {
        this.expandedRows.push(item.host)
      } else {
        this.expandedRows.splice(index, 1)
      }
    },
    toggleDarkMode () {
      this.darkMode = !this.darkMode
      this.$vuetify.theme.change(this.darkMode ? 'dark' : 'light')
    },
    toggleLanguageChange (lang) {
      this.$vuetify.locale.current = lang
      this.setCookie('lang', lang)
      this.updateChartSeriesNames()
      this.updateViewData()
      this.updateClock()
    },
    updateChartSeriesNames () {
      const speedNames = [this.$t('server.title.receive'), this.$t('server.title.send')]
      const latencyNames = [this.$t('server.title.cm'), this.$t('server.title.ct'), this.$t('server.title.cu')]
      for (const view of this.viewData) {
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
    },
    toggleSpeedUnit () {
      this.speedUnit = this.speedUnit === 'bit' ? 'byte' : 'bit'
      this.setCookie('speedUnit', this.speedUnit)
      this.updateViewData()
    },
    togglePingLatency () {
      this.showPingLatency = !this.showPingLatency
      this.updateViewData()
    },
    togglePingIpVersion (version) {
      this.pingIpVersion = version
      this.setCookie('pingIpVersion', version)
      for (const view of this.viewData) {
        view.chart.latency = null
      }
      this.updateViewData()
    },
    toggleDailyTraffic () {
      const now = new Date()
      const startInDay = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
      if (now - startInDay >= 60 * 1000) {
        this.showEstimatedDailyTraffic = !this.showEstimatedDailyTraffic
        this.updateViewData()
      }
    },
    toggleMonthlyTraffic () {
      const now = new Date()
      const startInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1)
      if (now - startInMonth >= 60 * 1000) {
        this.showEstimatedMonthlyTraffic = !this.showEstimatedMonthlyTraffic
        this.updateViewData()
      }
    },
    getFlags (location) {
      const currentLocale = this.$vuetify.locale.current
      if (currentLocale === 'zhHans') {
        const chinaFlagsMap = {
          hk: 'cn',
          tw: 'cn',
        }
        if (chinaFlagsMap[location]) {
          return chinaFlagsMap[location]
        }
      }
      return location
    },
    initializeView (host) {
      return {
        host,
        uptime: 0,
        ipv4: '-',
        ipv6: '-',
        location: 'un',
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
    },
    formatViewDataItem (item, view) {
      if (!item?.host) {
        return null
      }

      const newView = view || this.initializeView(item.host)

      if (view && item.cpu?.uptime && item.cpu.uptime < view.uptime) {
        return view
      }

      this.updateInfoView(item.info, newView)
      this.updateCpuView(item.cpu, newView)
      this.updateMemoryView(item.mem, newView)
      this.updateDiskView(item.disk, newView)
      this.updateNetworkView(item.net, newView)
      this.updateTrafficView(item.traffic, item.traffic_1d, item.traffic_1m, newView)
      this.updatePingView(item.ping, newView)

      return newView
    },
    updateInfoView (info, view) {
      if (!info) {
        return
      }
      view.ipv4 = info.have_ipv4 || ''
      view.ipv6 = info.have_ipv6 || ''
      view.location = (info.loc || 'un').toLowerCase()
      view.network_detail = `${formatSpeed(info.down_mbps / 8 * 1000 * 1000, this.speedUnit === 'bit')} / ${formatSpeed(info.up_mbps / 8 * 1000 * 1000, this.speedUnit === 'bit')}`
      view.cpu_module = info.cpu
      view.kernel = info.kernel
      view.traffic_quota = info.traffic_quota_gb * 1000 * 1000 * 1000
    },
    updateCpuView (cpu, view) {
      if (!cpu) {
        return
      }
      view.uptime = cpu.uptime
      view.load = cpu.load1.toFixed(2) || 0
      view.cpu = Math.round(cpu.usage_user + cpu.usage_system + cpu.usage_steal) || 0
      view.load_detail = `${cpu.load1.toFixed(2)} / ${cpu.load5.toFixed(2)} / ${cpu.load15.toFixed(2)}`
      view.cpu_detail = `${cpu.usage_system.toFixed(2)}% / ${cpu.usage_user.toFixed(2)}% / ${cpu.usage_steal.toFixed(2)}%`
      view.cpu_cores = cpu.n_cpus
    },
    updateMemoryView (mem, view) {
      if (!mem) {
        return
      }
      view.memory = Math.round(mem.used / mem.total * 100) || 0
      view.memory_detail = `${formatSize(mem.used, { standard: 'iec' })} \(${Math.round(mem.used / mem.total * 100)}%\) / ${formatSize(mem.total, { standard: 'iec' })}`
      view.swap_detail = `${formatSize((mem.swap_total - mem.swap_free), { standard: 'iec' })} \(${Math.round((mem.swap_total - mem.swap_free) / mem.swap_total * 100)}%\) / ${formatSize(mem.swap_total, { standard: 'iec' })}`
    },
    updateDiskView (disk, view) {
      if (!disk) {
        return
      }
      view.disk = Math.round(disk.used / disk.total * 100) || 0
      view.disk_detail = `${formatSize(disk.used, { standard: 'iec' })} \(${Math.round(disk.used / disk.total * 100)}%\) / ${formatSize(disk.total, { standard: 'iec' })}`
    },
    updateNetworkView (net, view) {
      if (!net) {
        return
      }
      view.net_recv = net.bytes_recv
      view.net_sent = net.bytes_sent
      this.appendSpeedChart(view, net)
    },
    initializeSpeedChart () {
      const now = Date.now()
      return [
        {
          name: this.$t('server.title.receive'),
          data: Array.from({ length: this.maxHistoryPoints }, (_, i) => [
            now - (this.maxHistoryPoints - i + 1) * 1000,
            0,
          ]),
        },
        {
          name: this.$t('server.title.send'),
          data: Array.from({ length: this.maxHistoryPoints }, (_, i) => [
            now - (this.maxHistoryPoints - i + 1) * 1000,
            0,
          ]),
        },
      ]
    },
    appendSpeedChart (view, net) {
      const now = Date.now()
      const speedChart = view.chart.speed?.length ? view.chart.speed : this.initializeSpeedChart()

      for (const [index, value] of [net.bytes_recv, net.bytes_sent].entries()) {
        const data = speedChart[index]?.data || []
        if (data.length >= this.maxHistoryPoints) {
          data.shift()
        }
        data.push([now, value])
      }

      view.chart.speed = speedChart
    },
    initializeLatencyChart () {
      const now = Date.now()
      return [
        {
          name: this.$t('server.title.cm'),
          data: Array.from({ length: this.maxHistoryPoints }, (_, i) => [
            now - (this.maxHistoryPoints - i + 1) * 1000,
            0,
          ]),
        },
        {
          name: this.$t('server.title.ct'),
          data: Array.from({ length: this.maxHistoryPoints }, (_, i) => [
            now - (this.maxHistoryPoints - i + 1) * 1000,
            0,
          ]),
        },
        {
          name: this.$t('server.title.cu'),
          data: Array.from({ length: this.maxHistoryPoints }, (_, i) => [
            now - (this.maxHistoryPoints - i + 1) * 1000,
            0,
          ]),
        },
      ]
    },
    appendLatencyChart (view, metrics) {
      const now = Date.now()
      const latencyChart = view.chart.latency?.length ? view.chart.latency : this.initializeLatencyChart()
      const latencyValues = [metrics.ping.cm, metrics.ping.ct, metrics.ping.cu]

      for (const [index, value] of latencyValues.entries()) {
        const data = latencyChart[index]?.data || []
        if (data.length >= this.maxHistoryPoints) {
          data.shift()
        }
        data.push([now, value])
      }

      view.chart.latency = latencyChart
    },
    calculateTrafficRange (currentTraffic, previousTraffic, uptimeMs, rangeStart) {
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
    },
    estimateTrafficRange (traffic, rangeStart, rangeEnd) {
      const elapsedMs = Date.now() - rangeStart.getTime()
      if (elapsedMs < 60 * 1000) {
        return traffic
      }

      const rate = (rangeEnd.getTime() - rangeStart.getTime()) / elapsedMs
      return {
        recv: traffic.recv * rate,
        sent: traffic.sent * rate,
      }
    },
    normalizePingMetric (value, max) {
      return Math.min(max, Math.round(value || 0))
    },
    getPingMetrics (ping, version) {
      return PING_METRIC_SUFFIXES.reduce((metrics, suffix) => {
        metrics.ping[suffix] = this.normalizePingMetric(ping[`ping_${suffix}${version}`], 500)
        metrics.loss[suffix] = this.normalizePingMetric(ping[`loss_${suffix}${version}`], 100)
        return metrics
      }, { ping: {}, loss: {} })
    },
    applyPingMetricsToView (view, metrics) {
      const metricType = this.showPingLatency ? 'ping' : 'loss'
      view.ping_cm = metrics[metricType].cm
      view.ping_ct = metrics[metricType].ct
      view.ping_cu = metrics[metricType].cu
    },
    formatPingDetail (metrics, unit = '') {
      return PING_METRIC_SUFFIXES
        .map(suffix => `${metrics[suffix]}${unit}`)
        .join(' / ')
    },
    getTrafficRangeBoundaries (now = new Date()) {
      const year = now.getUTCFullYear()
      const month = now.getUTCMonth()
      const day = now.getUTCDate()

      return {
        dayStart: new Date(Date.UTC(year, month, day, 0, 5, 0, 0)),
        nextDayStart: new Date(Date.UTC(year, month, day + 1)),
        monthStart: new Date(Date.UTC(year, month, 1, 0, 5, 0, 0)),
        nextMonthStart: new Date(Date.UTC(year, month + 1, 1)),
      }
    },
    getTrafficViewData (currentTraffic, previousTraffic, uptimeMs, rangeStart, rangeEnd, shouldEstimate) {
      const traffic = this.calculateTrafficRange(currentTraffic, previousTraffic, uptimeMs, rangeStart)
      return shouldEstimate
        ? this.estimateTrafficRange(traffic, rangeStart, rangeEnd)
        : traffic
    },
    formatQuotaUsageDetail (totalTraffic, quota) {
      if (quota > 0) {
        const usage = Math.round(totalTraffic / quota * 100)
        return `${formatSize(totalTraffic)} (${usage}%) / ${formatSize(quota)}`
      }

      return `${formatSize(totalTraffic)} / ${formatSize(quota)}`
    },
    updateTrafficView (currentTraffic, last1dTraffic, last1mTraffic, view) {
      if (!currentTraffic) {
        return
      }

      const uptimeMs = view.uptime * 1000
      const { dayStart, nextDayStart, monthStart, nextMonthStart } = this.getTrafficRangeBoundaries()
      const dailyTraffic = this.getTrafficViewData(
        currentTraffic,
        last1dTraffic,
        uptimeMs,
        dayStart,
        nextDayStart,
        this.showEstimatedDailyTraffic,
      )
      view.traffic_1d_recv = dailyTraffic.recv
      view.traffic_1d_sent = dailyTraffic.sent

      const monthlyTraffic = this.getTrafficViewData(
        currentTraffic,
        last1mTraffic,
        uptimeMs,
        monthStart,
        nextMonthStart,
        this.showEstimatedMonthlyTraffic,
      )

      view.traffic_1m_recv = monthlyTraffic.recv
      view.traffic_1m_sent = monthlyTraffic.sent

      const totalTraffic = currentTraffic.bytes_recv + currentTraffic.bytes_sent
      view.traffic_detail = `${formatSize(currentTraffic.bytes_recv)} / ${formatSize(currentTraffic.bytes_sent)} / ${formatSize(totalTraffic)}`
      const monthlyTotalTraffic = monthlyTraffic.recv + monthlyTraffic.sent
      view.monthly_traffic_detail = this.formatQuotaUsageDetail(monthlyTotalTraffic, view.traffic_quota)
    },
    updatePingView (ping, view) {
      if (!ping) {
        return
      }
      const ipv6Metrics = this.getPingMetrics(ping, 'v6')
      const ipv4Metrics = this.getPingMetrics(ping, 'v4')

      // Always compute detail strings for both versions
      view.lossv4_detail = this.formatPingDetail(ipv4Metrics.loss, '%')
      view.pingv4_detail = this.formatPingDetail(ipv4Metrics.ping, ' ms')
      view.lossv6_detail = this.formatPingDetail(ipv6Metrics.loss, '%')
      view.pingv6_detail = this.formatPingDetail(ipv6Metrics.ping, ' ms')

      // Determine which IP version to use for table display and latency chart
      const useV6 = this.resolvePingIpVersion(view)
      const activeMetrics = useV6 ? ipv6Metrics : ipv4Metrics

      this.applyPingMetricsToView(view, activeMetrics)
      this.appendLatencyChart(view, activeMetrics)
    },
    resolvePingIpVersion (view) {
      if (this.pingIpVersion === 'v6') {
        return true
      }
      if (this.pingIpVersion === 'v4') {
        return false
      }
      // 'auto' mode: prefer IPv6, fallback to IPv4
      if (view.ipv6 === 'yes') {
        return true
      }
      return false
    },
    updateViewData () {
      if (!this.db || this.db.length === 0) {
        return
      }
      const preViewDataMap = new Map(this.viewData.map(r => [r.host, r]))
      this.viewData = this.db.map(item => this.formatViewDataItem(item, preViewDataMap.get(item.host)))
    },
    async fetchData () {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
      const now = Date.now()

      const pendingRequests = this.apiConfigs.filter(config =>
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
        const dataMap = new Map(this.db.map(row => [row.host, row]))

        for (const { key, res } of results) {
          if (!res || !res.data) {
            continue
          }

          const config = this.apiConfigs.find(c => c.key === key)
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

        this.db = Array.from(dataMap.values())
        this.updateViewData()
      } catch (error) {
        console.error('fetchData error:', error)
      }
    },
    stopRefresh () {
      this.isRefreshEnabled = !this.isRefreshEnabled
      if (this.isRefreshEnabled) {
        this.startRefreshTimer()
      } else {
        this.stopRefreshTimer()
      }
    },
    startRefreshTimer () {
      this.stopRefreshTimer()
      this.refreshTimer = window.setInterval(() => {
        this.fetchData()
      }, this.refreshIntervalMs)
    },
    stopRefreshTimer () {
      if (this.refreshTimer !== null) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },
    updateTheme (mode) {
      this.darkMode = mode
      this.$vuetify.theme.change(mode ? 'dark' : 'light')
    },
    bindThemePreferenceListener () {
      if (!window.matchMedia) {
        return
      }

      this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.updateTheme(this.themeMediaQuery.matches)
      this.themeChangeHandler = ({ matches }) => {
        this.updateTheme(matches)
      }
      this.themeMediaQuery.addEventListener('change', this.themeChangeHandler)
    },
    getCookie (name) {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) {
        return parts.pop().split(';').shift()
      }
    },
    setCookie (name, value, days = 30) {
      const date = new Date()
      date.setTime(date.getTime() + ms(days + 'd'))
      document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`
    },
    updateClock () {
      const now = new Date()
      const isSmallScreen = this.$vuetify.display.smAndDown
      this.currentDate = now.toLocaleDateString(this.$i18n.locale, isSmallScreen
        ? { year: 'numeric', month: 'short', day: 'numeric' }
        : { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      )
      this.currentTime = now.toLocaleTimeString(this.$i18n.locale, isSmallScreen ? {} : { timeZoneName: 'short' })
    },
  },
  mounted () {
    this.applySavedPreferences()

    this.updateClock()
    this.clockTimer = window.setInterval(() => this.updateClock(), 1000)

    this.fetchData()
    if (this.isRefreshEnabled) {
      this.startRefreshTimer()
    }

    this.bindThemePreferenceListener()
  },
  beforeUnmount () {
    this.stopRefreshTimer()
    if (this.clockTimer) {
      clearInterval(this.clockTimer)
    }
    if (this.themeMediaQuery && this.themeChangeHandler) {
      this.themeMediaQuery.removeEventListener('change', this.themeChangeHandler)
    }
  },
}
