import axios from "axios";
import Papa from "papaparse";
import { Duration } from "luxon";
import getFlagEmoji from 'country-code-to-flag-emoji';
import fileSizePretty from 'file-size-pretty';

export default {
  data() {
    return {
      darkMode: false,
      isRefreshEnabled: true,
      headers: [
        { title: "节点", key: "host", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "在线", key: "uptime", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "v4|v6", key: "net_proto", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "位置", key: "location", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "负载", key: "load", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "网络↓|↑", key: "net", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "总流量↓|↑", key: "traffic", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "CPU", key: "cpu", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "内存", key: "memory", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "硬盘", key: "disk", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "移动", key: "loss_cm", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "电信", key: "loss_ct", align: 'center', headerProps: { style: 'font-weight: 1000' } },
        { title: "联通", key: "loss_cu", align: 'center', headerProps: { style: 'font-weight: 1000' } },
      ],
      db: [],
      viewData: [],
      refreshInterval: null,
      showFetchCountDown: 0,
      showFetchMaxCount: 40,
    }
  },
  methods: {
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
    updateViewData() {
      this.viewData = this.db.map(item => ({
        host: item.host,
        uptime: this.formatSeconds(item.cpu.uptime),
        net_proto: `${this.getNetProtoFlag(item.info.have_ipv4)}|${this.getNetProtoFlag(item.info.have_ipv6)}`,
        location: getFlagEmoji(item.info.loc),
        cpu: Math.round(item.cpu.usage_user + item.cpu.usage_system),
        memory: Math.round(item.mem.used / item.mem.total * 100),
        disk: Math.round(item.disk.used / item.disk.total * 100),
        load: item.cpu.load1.toFixed(2),
        net: `${fileSizePretty(item.net.bytes_recv)}|${fileSizePretty(item.net.bytes_sent)}`,
        traffic: `${fileSizePretty(item.traffic.bytes_recv)}|${fileSizePretty(item.traffic.bytes_sent)}`,
        load_detail: `${item.cpu.load1.toFixed(2)} / ${item.cpu.load5.toFixed(2)} / ${item.cpu.load15.toFixed(2)}`,
        cpu_detail: `${item.cpu.usage_system.toFixed(2)}% / ${item.cpu.usage_user.toFixed(2)}% / ${item.cpu.usage_steal.toFixed(2)}%`,
        memory_detail: `${fileSizePretty(item.mem.used)} / ${fileSizePretty(item.mem.total)}`,
        swap_detail: `${fileSizePretty(item.mem.swap_cached)} / ${fileSizePretty(item.mem.swap_total)}`,
        disk_detail: `${fileSizePretty(item.disk.used)} / ${fileSizePretty(item.disk.total)}`,
        network_detail: `${item.info.down_mbps} Mbps / ${item.info.up_mbps}Mbps `,
        loss_cm: item.info.have_ipv4 === 'yes' ? item.ping.loss_cmv4.toFixed(2) : item.ping.loss_cmv6.toFixed(2),
        loss_ct: item.info.have_ipv4 === 'yes' ? item.ping.loss_ctv4.toFixed(2) : item.ping.loss_ctv6.toFixed(2),
        loss_cu: item.info.have_ipv4 === 'yes' ? item.ping.loss_cuv4.toFixed(2) : item.ping.loss_cuv6.toFixed(2),
        lossv4_detail: `${item.ping.loss_cmv4.toFixed(2)}% / ${item.ping.loss_ctv4.toFixed(2)}% / ${item.ping.loss_cuv4.toFixed(2)}%`,
        pingv4_detail: `${item.ping.ping_cmv4.toFixed(2)}ms / ${item.ping.ping_ctv4.toFixed(2)}ms / ${item.ping.ping_cuv4.toFixed(2)}ms`,
        lossv6_detail: `${item.ping.loss_cmv6.toFixed(2)}% / ${item.ping.loss_ctv6.toFixed(2)}% / ${item.ping.loss_cuv6.toFixed(2)}%`,
        pingv6_detail: `${item.ping.ping_cmv6.toFixed(2)}ms / ${item.ping.ping_ctv6.toFixed(2)}ms / ${item.ping.ping_cuv6.toFixed(2)}ms`
      }));
    },
    async fetchData() {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      console.log("baseUrl:", baseUrl);
      var urls = [
        `${baseUrl}/api/cpu`,
        `${baseUrl}/api/net`,
        `${baseUrl}/api/ping`,

        `${baseUrl}/api/info`,
        `${baseUrl}/api/mem`,
        `${baseUrl}/api/disk`,
        `${baseUrl}/api/traffic`,
      ];
      this.showFetchCountDown--;
      if (this.showFetchCountDown >= 0) {
        urls = [
          `${baseUrl}/api/cpu`,
          `${baseUrl}/api/net`,
          `${baseUrl}/api/ping`,
        ];
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
              if (this.showFetchCountDown >= 0) {
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
        if (this.showFetchCountDown < 0) {
          this.showFetchCountDown = this.showFetchMaxCount;
        }
      } catch (e) {
        console.error("get failed: ", e);
        this.showFetchCountDown = this.showFetchMaxCount;
      }
    },
    startCountdown() {
      this.countdownInterval = setInterval(() => {
        this.countdown -= 100;
        if (this.countdown <= 0) {
          this.countdown = 1500;
        }
      }, 100);
    },
    stopRefresh() {
      this.isRefreshEnabled = !this.isRefreshEnabled;
      if (this.isRefreshEnabled) {
        this.refreshInterval = setInterval(() => {
          this.fetchData();
        }, 1500);
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
      }, 1500);
    }
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval);
  },
}
