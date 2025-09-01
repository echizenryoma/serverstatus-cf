import axios from "axios";
import Papa from "papaparse";
import { formatSize, formatSpeed, formatSeconds } from '@/utils/format';
import { parseDuration } from 'enhanced-ms';
import 'flag-icons/css/flag-icons.min.css';
import { useHead } from '@vueuse/head';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Footer from '@/components/Footer.vue';
import ExpandedRow from '@/components/ExpandedRow.vue';
import languageOptions from '@/config/languageOptions';

export default {
  components: {
    Footer,
    ExpandedRow
  },
  setup() {
    const { t } = useI18n()
    const title = computed(() => t('app.title'))
    useHead({
      title,
    })
  },
  data() {
    return {
      languageOptions,
      darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
      themeMediaQuery: null,
      isRefreshEnabled: true,
      expandedRows: [],
      db: [],
      viewData: [],
      refreshInterval: null,
      refreshIntervalMs: 1000,
      fastFetchCountDown: 0,
      fastFetchMaxCount: 60,
      speedUnit: 'bit',
      maxHistoryPoints: 60,
    }
  },
  computed: {
    title() {
      return this.$t('app.title');
    },
    headers() {
      return [
        { title: this.$t('server.node'), key: "host", align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' } },
        { title: this.$t('server.uptime'), key: "uptime", align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        {
          title: this.$t('server.network.title'),
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: this.$t('server.network.ipv4'), key: "ipv4", align: 'center', headerProps: { style: 'font-weight: bold;' } },
            { title: this.$t('server.network.ipv6'), key: "ipv6", align: 'center', headerProps: { style: 'font-weight: bold;' } },
          ],
        },
        { title: this.$t('server.location'), key: "location", align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        { title: this.$t('server.load'), key: "load", align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        {
          title: this.$t('server.network.speed'),
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: this.$t('server.network.receive'), key: "net_recv", align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-download' },
            { title: this.$t('server.network.send'), key: "net_sent", align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-upload' },
          ],
        },
        {
          title: this.$t('server.network.dailyTraffic'),
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: this.$t('server.network.receive'), key: "traffic_1d_recv", align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-download' },
            { title: this.$t('server.network.send'), key: "traffic_1d_sent", align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-upload' },
          ],
        },
        {
          title: this.$t('server.network.monthlyTraffic'),
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: this.$t('server.network.receive'), key: "traffic_1m_recv", align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-download' },
            { title: this.$t('server.network.send'), key: "traffic_1m_sent", align: 'center', minWidth: '8em', headerProps: { style: 'font-weight: bold;' }, prependIcon: 'mdi-upload' },
          ],
        },
        { title: this.$t('server.cpu'), key: "cpu", align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        { title: this.$t('server.memory'), key: "memory", align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        { title: this.$t('server.disk'), key: "disk", align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
        {
          title: this.$t('server.packetLoss.title'),
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: this.$t('server.packetLoss.cm'), key: "loss_cm", align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
            { title: this.$t('server.packetLoss.ct'), key: "loss_ct", align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
            { title: this.$t('server.packetLoss.cu'), key: "loss_cu", align: 'center', minWidth: '6em', headerProps: { style: 'font-weight: bold;' } },
          ],
        },
      ]
    },
  },
  methods: {
    formatSpeed,
    formatSize,
    formatSeconds,
    toggleExpand(_, { item }) {
      const index = this.expandedRows.indexOf(item.host);
      if (index > -1) {
        this.expandedRows.splice(index, 1);
      } else {
        this.expandedRows.push(item.host);
      }
    },
    toggleDarkMode() {
      this.darkMode = !this.darkMode
      this.$vuetify.theme.global.name = this.darkMode ? 'dark' : 'light'
    },
    handleLanguageChange(lang) {
      this.setCookie('lang', lang);
      this.updateViewData();
    },
    toggleSpeedUnit() {
      this.speedUnit = this.speedUnit === 'bit' ? 'byte' : 'bit';
      this.setCookie('speedUnit', this.speedUnit);
      this.updateViewData();
    },
    getNetProtoColor(value) {
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
    },
    getNetProtoIcon(value) {
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
    },
    getLossColor(value) {
      switch (true) {
        case value < 20:
          return 'success';
        case value > 50:
          return 'error';
        default:
          return 'warning';
      }
    },
    getCPUColor(value) {
      switch (true) {
        case value > 80:
          return 'error';
        case value > 50:
          return 'warning';
        default:
          return 'pink';
      }
    },
    getMemoryColor(value) {
      switch (true) {
        case value > 80:
          return 'error';
        case value > 60:
          return 'warning';
        default:
          return 'primary';
      }
    },
    getDiskColor(value) {
      switch (true) {
        case value > 90:
          return 'error';
        case value > 75:
          return 'warning';
        default:
          return 'secondary';
      }
    },
    initializeView(host) {
      return {
        host: host,
        uptime: 0,
        ipv4: '-',
        ipv6: '-',
        location: 'un',
        cpu: 0,
        memory: 0,
        disk: 0,
        load: 0.0,
        net_recv: 0,
        net_sent: 0,
        traffic_recv: 0,
        traffic_sent: 0,
        traffic_1d_recv: 0,
        traffic_1d_sent: 0,
        traffic_1m_recv: 0,
        traffic_1m_sent: 0,
        load_detail: '-',
        cpu_cores: 0,
        cpu_detail: '-',
        memory_detail: '-',
        swap_detail: '-',
        disk_detail: '-',
        network_detail: '-',
        traffic_detail: '-',
        loss_cm: 100,
        loss_ct: 100,
        loss_cu: 100,
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
    formatViewDataItem(item, view) {
      if (!item?.host) return null;

      const newView = view || this.initializeView(item.host);

      this.updateInfoView(item.info, newView);
      this.updateCpuView(item.cpu, newView);
      this.updateMemoryView(item.mem, newView);
      this.updateDiskView(item.disk, newView);
      this.updateNetworkView(item.net, newView);
      this.updateTrafficView(item.traffic, item.traffic_1d, item.traffic_1m, newView);
      this.updatePingView(item.ping, newView);

      return newView;
    },
    updateInfoView(info, view) {
      if (!info) return;
      view.ipv4 = info.have_ipv4 || '';
      view.ipv6 = info.have_ipv6 || '';
      view.location = (info.loc || 'un').toLowerCase();
      view.network_detail = `${formatSpeed(info.down_mbps / 8.0 * 1000 * 1000, this.speedUnit === 'bit')} / ${formatSpeed(info.up_mbps / 8.0 * 1000 * 1000, this.speedUnit === 'bit')}`;
      view.cpu_module = info.cpu;
      view.kernel = info.kernel;
    },
    updateCpuView(cpu, view) {
      if (!cpu) return;
      view.uptime = cpu.uptime;
      view.load = cpu.load1.toFixed(2) || 0.0;
      view.cpu = Math.round(cpu.usage_user + cpu.usage_system) || 0;
      view.load_detail = `${cpu.load1.toFixed(2)} / ${cpu.load5.toFixed(2)} / ${cpu.load15.toFixed(2)}`;
      view.cpu_detail = `${cpu.usage_system.toFixed(2)}% / ${cpu.usage_user.toFixed(2)}% / ${cpu.usage_steal.toFixed(2)}%`;
      view.cpu_cores = cpu.n_cpus;
    },
    updateMemoryView(mem, view) {
      if (!mem) return;
      view.memory = Math.round(mem.used / mem.total * 100) || 0;
      view.memory_detail = `${formatSize(mem.used, { standard: "iec" })} \(${Math.round(mem.used / mem.total * 100)}%\) / ${formatSize(mem.total, { standard: "iec" })}`;
      view.swap_detail = `${formatSize(mem.swap_cached, { standard: "iec" })} \(${Math.round(mem.swap_cached / mem.swap_total * 100)}%\) / ${formatSize(mem.swap_total, { standard: "iec" })}`;
    },
    updateDiskView(disk, view) {
      if (!disk) return;
      view.disk = Math.round(disk.used / disk.total * 100) || 0;
      view.disk_detail = `${formatSize(disk.used, { standard: "iec" })} \(${Math.round(disk.used / disk.total * 100)}%\) / ${formatSize(disk.total, { standard: "iec" })}`;
    },
    updateNetworkView(net, view) {
      if (!net) return;
      view.net_recv = net.bytes_recv;
      view.net_sent = net.bytes_sent;
      this.appendSpeedChart(view, net);
    },
    initializeSpeedChart() {
      const now = new Date().getTime();
      return [
        {
          name: this.$t('server.network.receive'),
          data: Array.from({ length: this.maxHistoryPoints }, (_, i) => [
            now - (this.maxHistoryPoints - i + 1) * 1000,
            0
          ])
        },
        {
          name: this.$t('server.network.send'),
          data: Array.from({ length: this.maxHistoryPoints }, (_, i) => [
            now - (this.maxHistoryPoints - i + 1) * 1000,
            0,
          ])
        }
      ];
    },
    appendSpeedChart(view, net) {
      if (view.chart.speed?.length === 0) {
        view.chart.speed = this.initializeSpeedChart()
      }
      const now = new Date().getTime();
      view.chart.speed = [
        {
          name: this.$t('server.network.receive'),
          data: [...(view.chart.speed[0]?.data || []).slice(-this.maxHistoryPoints + 1), [now, net.bytes_recv]]
        },
        {
          name: this.$t('server.network.send'),
          data: [...(view.chart.speed[1]?.data || []).slice(-this.maxHistoryPoints + 1), [now, net.bytes_sent]]
        }
      ];
    },
    initializeLatencyChart() {
      const now = new Date().getTime();
      return [
        {
          name: this.$t('server.packetLoss.cm'),
          data: Array.from({ length: this.maxHistoryPoints }, (_, i) => [
            now - (this.maxHistoryPoints - i + 1) * 1000,
            0.0,
          ])
        },
        {
          name: this.$t('server.packetLoss.ct'),
          data: Array.from({ length: this.maxHistoryPoints }, (_, i) => [
            now - (this.maxHistoryPoints - i + 1) * 1000,
            0.0,
          ])
        },
        {
          name: this.$t('server.packetLoss.cu'),
          data: Array.from({ length: this.maxHistoryPoints }, (_, i) => [
            now - (this.maxHistoryPoints - i + 1) * 1000,
            0.0,
          ])
        },
      ];
    },
    appendLatencyChart(view, ping) {
      if (view.chart.latency?.length === 0) {
        view.chart.latency = this.initializeLatencyChart()
      }
      const now = new Date().getTime();
      view.chart.latency = [
        {
          name: this.$t('server.packetLoss.cm'),
          data: [...(view.chart.latency[0]?.data || []).slice(-this.maxHistoryPoints + 1), [now, ping.ping_cmv4]]
        },
        {
          name: this.$t('server.packetLoss.ct'),
          data: [...(view.chart.latency[1]?.data || []).slice(-this.maxHistoryPoints + 1), [now, ping.ping_ctv4]]
        },
        {
          name: this.$t('server.packetLoss.cu'),
          data: [...(view.chart.latency[2]?.data || []).slice(-this.maxHistoryPoints + 1), [now, ping.ping_cuv4]]
        },
      ];
    },
    updateTrafficView(currentTraffic, last1dTraffic, last1mTraffic, view) {
      if (!currentTraffic) return;

      view.traffic_recv = currentTraffic.bytes_recv;
      view.traffic_sent = currentTraffic.bytes_sent;

      let bytes_recv_1d = currentTraffic.bytes_recv;
      let bytes_sent_1d = currentTraffic.bytes_sent;

      if (last1dTraffic) {
        bytes_recv_1d = Math.max(0, currentTraffic.bytes_recv - (last1dTraffic.bytes_recv || 0));
        bytes_sent_1d = Math.max(0, currentTraffic.bytes_sent - (last1dTraffic.bytes_sent || 0));
      } else {
        bytes_recv_1d = Math.max(0, currentTraffic.bytes_recv / (view.uptime * 1000 / parseDuration("1d")));
        bytes_sent_1d = Math.max(0, currentTraffic.bytes_sent / (view.uptime * 1000 / parseDuration("1d")));
      }
      view.traffic_1d_recv = bytes_recv_1d;
      view.traffic_1d_sent = bytes_sent_1d;

      let bytes_recv_1m = currentTraffic.bytes_recv;
      let bytes_sent_1m = currentTraffic.bytes_sent;
      if (last1mTraffic) {
        bytes_recv_1m = Math.max(0, currentTraffic.bytes_recv - (last1mTraffic.bytes_recv || 0));
        bytes_sent_1m = Math.max(0, currentTraffic.bytes_sent - (last1mTraffic.bytes_sent || 0));
      } else {
        bytes_recv_1m = Math.max(0, currentTraffic.bytes_recv / (view.uptime * 1000 / parseDuration("1m")));
        bytes_sent_1m = Math.max(0, currentTraffic.bytes_sent / (view.uptime * 1000 / parseDuration("1m")));
      }
      view.traffic_1m_recv = bytes_recv_1m;
      view.traffic_1m_sent = bytes_sent_1m;

      view.traffic_detail = `${formatSize(currentTraffic.bytes_recv)} / ${formatSize(currentTraffic.bytes_sent)}`;
    },
    updatePingView(ping, view) {
      if (!ping) return;
      if (view.ipv6 === 'yes') {
        view.loss_cm = Math.round(ping.loss_cmv6);
        view.loss_ct = Math.round(ping.loss_ctv6);
        view.loss_cu = Math.round(ping.loss_cuv6);

        view.lossv6_detail = `${Math.round(ping.loss_cmv6)}% / ${Math.round(ping.loss_ctv6)}% / ${Math.round(ping.loss_cuv6)}%`;
        view.pingv6_detail = `${Math.round(ping.ping_cmv6)} ms / ${Math.round(ping.ping_ctv6)} ms / ${Math.round(ping.ping_cuv6)} ms`;
      }
      if (view.ipv4 === 'yes') {
        view.loss_cm = Math.round(ping.loss_cmv4);
        view.loss_ct = Math.round(ping.loss_ctv4);
        view.loss_cu = Math.round(ping.loss_cuv4);

        view.lossv4_detail = `${Math.round(ping.loss_cmv4)}% / ${Math.round(ping.loss_ctv4)}% / ${Math.round(ping.loss_cuv4)}%`;
        view.pingv4_detail = `${Math.round(ping.ping_cmv4)} ms / ${Math.round(ping.ping_ctv4)} ms / ${Math.round(ping.ping_cuv4)} ms`;

        this.appendLatencyChart(view, ping);
      }
    },
    updateViewData() {
      if (!this.db || this.db.length === 0) {
        return;
      }
      const preViewDataMap = new Map(this.viewData.map(r => [r.host, r]));
      this.viewData = this.db.map(item => this.formatViewDataItem(item, preViewDataMap.get(item.host)));
    },
    async fetchData() {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      let urls = [
        `${baseUrl}/api/cpu`,
        `${baseUrl}/api/net`,
        `${baseUrl}/api/ping`,

        `${baseUrl}/api/info`,
        `${baseUrl}/api/mem`,
        `${baseUrl}/api/disk`,
        `${baseUrl}/api/traffic`,
        `${baseUrl}/api/traffic/last-day`,
        `${baseUrl}/api/traffic/last-month`,
      ];
      this.fastFetchCountDown--;
      if (this.fastFetchCountDown >= 0) {
        urls.splice(3);
      }
      try {
        const requests = urls.map((url) => axios.get(url));
        const responses = await axios.all(requests);
        const dataMap = new Map(this.db.map(row => [row.host, row]));
        responses.forEach((res, index) => {
          if (!res || !res.data) {
            console.error(`No data received from ${urls[index]}`);
            return;
          }
          if (!res.data) {
            console.error(`No data received from ${urls[index]}`);
            return;
          }
          const csvText = res.data;
          const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true });
          parsed.data.filter(
            (row) => row.host && row.host.trim() !== ""
          ).forEach((row) => {
            const host = row.host;
            if (!dataMap.has(host)) {
              if (this.fastFetchCountDown >= 0) {
                throw new Error(`Host ${host} not found in existing data map.`);
              }
              dataMap.set(host, {
                host: host,
              });
            }
            const item = dataMap.get(host);
            switch (index) {
              case 0:
                item.cpu = row;
                break;
              case 1:
                item.net = row;
                break;
              case 2:
                item.ping = row;
                break;

              case 3:
                item.info = row;
                break;
              case 4:
                item.mem = row;
                break;
              case 5:
                item.disk = row;
                break;
              case 6:
                item.traffic = row;
                break;
              case 7:
                item.traffic_1d = row;
                break;
              case 8:
                item.traffic_1m = row;
                break;
            }
          });
        });
        this.db = Array.from(dataMap.values());
        this.updateViewData();
        if (this.fastFetchCountDown < 0) {
          this.fastFetchCountDown = this.fastFetchMaxCount;
        }
      } catch (e) {
        console.error("get failed: ", e);
        this.fastFetchCountDown = 0;
      }
    },
    stopRefresh() {
      this.isRefreshEnabled = !this.isRefreshEnabled;
      if (this.isRefreshEnabled) {
        this.refreshInterval = setInterval(() => {
          this.fetchData();
        }, this.refreshIntervalMs);
      } else {
        clearInterval(this.refreshInterval);
      }
    },
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    },
    setCookie(name, value, days = 30) {
      const date = new Date();
      date.setTime(date.getTime() + parseDuration(days + 'd'));
      document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
    },
  },
  mounted() {
    const savedLang = this.getCookie('lang');
    if (savedLang && (savedLang === 'zh-CN' || savedLang === 'en')) {
      this.$i18n.locale = savedLang;
    }

    const savedSpeedUnit = this.getCookie('speedUnit');
    if (savedSpeedUnit && (savedSpeedUnit === 'bit' || savedSpeedUnit === 'byte')) {
      this.speedUnit = savedSpeedUnit;
    }

    this.fetchData();
    if (this.isRefreshEnabled) {
      this.refreshInterval = setInterval(() => {
        this.fetchData();
      }, this.refreshIntervalMs);
    }

    if (window.matchMedia) {
      this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const themeChangeHandler = (e) => {
        this.darkMode = e.matches;
        this.$vuetify.theme.global.name = this.darkMode ? 'dark' : 'light';
      };
      this.themeMediaQuery.addEventListener('change', themeChangeHandler);
    }
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval);
    if (this.themeMediaQuery) {
      this.themeMediaQuery.removeEventListener('change', themeChangeHandler);
    }
  },
}
