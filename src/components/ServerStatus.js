import axios from "axios";
import Papa from "papaparse";
import { Duration } from "luxon";
import fileSizePretty from 'file-size-pretty';

export default {
  data() {
    return {
      darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
      themeMediaQuery: null,
      isRefreshEnabled: true,
      expandedRows: [],
      headers: [
        { title: "节点", key: "host", align: 'center', headerProps: { style: 'font-weight: bold;' } },
        { title: "在线", key: "uptime", align: 'center', headerProps: { style: 'font-weight: bold;' } },
        {
          title: '协议栈',
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: 'IPv4', key: "ipv4", align: 'center', headerProps: { style: 'font-weight: bold;' } },
            { title: 'IPv6', key: "ipv6", align: 'center', headerProps: { style: 'font-weight: bold;' } },
          ],
        },
        { title: "位置", key: "location", align: 'center', headerProps: { style: 'font-weight: bold;' } },
        { title: "负载", key: "load", align: 'center', headerProps: { style: 'font-weight: bold;' } },
        {
          title: '网络',
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: '🔽', key: "net_recv", align: 'center', headerProps: { style: 'font-weight: bold;' } },
            { title: '🔼', key: "net_sent", align: 'center', headerProps: { style: 'font-weight: bold;' } },
          ],
        },
        {
          title: '总流量',
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: '🔽', key: "traffic_recv", align: 'center', headerProps: { style: 'font-weight: bold;' } },
            { title: '🔼', key: "traffic_sent", align: 'center', headerProps: { style: 'font-weight: bold;' } },
          ],
        },
        { title: "CPU", key: "cpu", align: 'center', headerProps: { style: 'font-weight: bold;' } },
        { title: "内存", key: "memory", align: 'center', headerProps: { style: 'font-weight: bold;' } },
        { title: "硬盘", key: "disk", align: 'center', headerProps: { style: 'font-weight: bold;' } },
        {
          title: '丢包率',
          align: 'center',
          headerProps: { style: 'font-weight: bold;' },
          children: [
            { title: "移动", key: "loss_cm", align: 'center', headerProps: { style: 'font-weight: bold;' } },
            { title: "电信", key: "loss_ct", align: 'center', headerProps: { style: 'font-weight: bold;' } },
            { title: "联通", key: "loss_cu", align: 'center', headerProps: { style: 'font-weight: bold;' } },
          ],
        },
      ],
      db: [],
      viewData: [],
      refreshInterval: null,
      refreshIntervalMs: 1500,
      fastFetchCountDown: 0,
      fastFetchMaxCount: 40,
    }
  },
  methods: {
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
    getLossColor(value) {
      switch (true) {
        case value < 20:
          return 'bg-green';
        case value > 50:
          return 'bg-red';
        default:
          return 'bg-yellow';
      }
    },
    getNetProtoFlag(value) {
      switch (value) {
        case 'yes': return '✅';
        case 'no': return '❌';
        case 'nat': return '⚠️';
        default: return '❔';
      }
    },
    formatSeconds(seconds) {
      const d = Duration.fromObject({ seconds }).shiftTo("days", "hours", "minutes", "seconds");

      const days = d.days;
      const hours = String(d.hours).padStart(2, "0");
      const minutes = String(d.minutes).padStart(2, "0");
      const secs = String(Math.floor(d.seconds)).padStart(2, "0");
      if (days > 0) {
        return `${days}天`;
      }
      return `${hours}:${minutes}:${secs}`;
    },
    haveIPv4(value) {
      return value === 'yes';
    },
    formatViewDataItem(item) {
      const have_ipv4 = this.haveIPv4(item.info.have_ipv4 || '');
      return {
        host: item.host,
        uptime: this.formatSeconds(item.cpu.uptime),
        ipv4: `${this.getNetProtoFlag(item.info.have_ipv4)}`,
        ipv6: `${this.getNetProtoFlag(item.info.have_ipv6)}`,
        location: item.info.loc || '',
        cpu: Math.round(item.cpu.usage_user + item.cpu.usage_system),
        memory: Math.round(item.mem.used / item.mem.total * 100),
        disk: Math.round(item.disk.used / item.disk.total * 100),
        load: item.cpu.load1.toFixed(2),
        net_recv: `${fileSizePretty(item.net.bytes_recv) || '-'}`,
        net_sent: `${fileSizePretty(item.net.bytes_sent) || '-'}`,
        traffic_recv: `${fileSizePretty(item.traffic.bytes_recv) || '-'}`,
        traffic_sent: `${fileSizePretty(item.traffic.bytes_sent) || '-'}`,
        load_detail: `${item.cpu.load1.toFixed(2)} / ${item.cpu.load5.toFixed(2)} / ${item.cpu.load15.toFixed(2)}`,
        cpu_detail: `${item.cpu.usage_system.toFixed(2)}% / ${item.cpu.usage_user.toFixed(2)}% / ${item.cpu.usage_steal.toFixed(2)}%`,
        memory_detail: `${fileSizePretty(item.mem.used) || '-'} / ${fileSizePretty(item.mem.total) || '-'}`,
        swap_detail: `${fileSizePretty(item.mem.swap_cached) || '-'} / ${fileSizePretty(item.mem.swap_total) || '-'}`,
        disk_detail: `${fileSizePretty(item.disk.used) || '-'} / ${fileSizePretty(item.disk.total) || '-'}`,
        network_detail: `${item.info.down_mbps} Mbps / ${item.info.up_mbps}Mbps`,
        loss_cm: have_ipv4 ? Math.round(item.ping.loss_cmv4) : Math.round(item.ping.loss_cmv6),
        loss_ct: have_ipv4 ? Math.round(item.ping.loss_ctv4) : Math.round(item.ping.loss_ctv6),
        loss_cu: have_ipv4 ? Math.round(item.ping.loss_cuv4) : Math.round(item.ping.loss_cuv6),
        lossv4_detail: `${Math.round(item.ping.loss_cmv4)}% / ${Math.round(item.ping.loss_ctv4)}% / ${Math.round(item.ping.loss_cuv4)}%`,
        pingv4_detail: `${Math.round(item.ping.ping_cmv4)}ms / ${Math.round(item.ping.ping_ctv4)}ms / ${Math.round(item.ping.ping_cuv4)}ms`,
        lossv6_detail: `${Math.round(item.ping.loss_cmv6)}% / ${Math.round(item.ping.loss_ctv6)}% / ${Math.round(item.ping.loss_cuv6)}%`,
        pingv6_detail: `${Math.round(item.ping.ping_cmv6)}ms / ${Math.round(item.ping.ping_ctv6)}ms / ${Math.round(item.ping.ping_cuv6)}ms`
      };
    },
    updateViewData() {
      if (!this.db || this.db.length === 0) {
        return;
      }
      this.viewData = this.db.map(item => this.formatViewDataItem(item));
    },
    async fetchData() {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      var urls = [
        `${baseUrl}/api/cpu`,
        `${baseUrl}/api/net`,
        `${baseUrl}/api/ping`,

        `${baseUrl}/api/info`,
        `${baseUrl}/api/mem`,
        `${baseUrl}/api/disk`,
        `${baseUrl}/api/traffic`,
      ];
      this.fastFetchCountDown--;
      if (this.fastFetchCountDown >= 0) {
        urls.splice(3);
      }
      try {
        const requests = urls.map((url) => axios.get(url));
        const responses = await Promise.all(requests);
        const dataMap = new Map(this.db.map(row => [row.host, row]));
        responses.forEach((res, index) => {
          if (!res || !res.data) {
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
        this.fastFetchCountDown = this.fastFetchMaxCount;
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
  },
  mounted() {
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
