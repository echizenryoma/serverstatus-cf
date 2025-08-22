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
        { title: "节点", key: "host", align: 'center', class: 'font-weight-bold' },
        { title: "在线", key: "uptime", align: 'center', class: 'font-weight-bold' },
        { title: "v4|v6", key: "net_proto", align: 'center', class: 'font-weight-bold' },
        { title: "位置", key: "location", align: 'center', class: 'font-weight-bold' },
        { title: "负载", key: "load", align: 'center', class: 'font-weight-bold' },
        { title: "网络↓|↑", key: "net", align: 'center', class: 'font-weight-bold' },
        { title: "总流量↓|↑", key: "traffic", align: 'center', class: 'font-weight-bold' },
        { title: "CPU", key: "cpu", align: 'center', class: 'font-weight-bold' },
        { title: "内存", key: "memory", align: 'center', class: 'font-weight-bold' },
        { title: "硬盘", key: "disk", align: 'center', class: 'font-weight-bold' },
        { title: "移动", key: "loss_cm", align: 'center', class: 'font-weight-bold' },
        { title: "电信", key: "loss_ct", align: 'center', class: 'font-weight-bold' },
        { title: "联通", key: "loss_cu", align: 'center', class: 'font-weight-bold' },
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
        uptime: this.formatSeconds(parseInt(item.cpu.uptime)),
        net_proto: `${(item.info.have_ipv4 === 'yes' ? '✅' : '❌')}|${item.info.have_ipv6 === 'yes' ? '✅' : '❌'}`,
        location: getFlagEmoji(item.info.loc),
        cpu: Math.round(parseFloat(item.cpu.usage_user) + parseFloat(item.cpu.usage_system)),
        memory: Math.round(((parseInt(item.mem.used) || 0) / (parseInt(item.mem.total)) || 0) * 100),
        disk: Math.round(((parseInt(item.disk.used) || 0) / (parseInt(item.disk.total)) || 0) * 100),
        load: (parseFloat(item.cpu.load1) || 0.0).toFixed(2),
        net: `${fileSizePretty(parseInt(item.net.bytes_recv) || 0)}|${fileSizePretty(parseInt(item.net.bytes_sent) || 0)}`,
        traffic: `${fileSizePretty(parseInt(item.traffic.bytes_recv) || 0)}|${fileSizePretty(parseInt(item.traffic.bytes_sent) || 0)}`,
        load_detail: `${(parseFloat(item.cpu.load1) || 0.0).toFixed(2)} / ${(parseFloat(item.cpu.load5) || 0.0).toFixed(2)} / ${(parseFloat(item.cpu.load15) || 0.0).toFixed(2)}`,
        cpu_detail: `${(parseFloat(item.cpu.usage_system) || 0.0).toFixed(2)}% / ${(parseFloat(item.cpu.usage_user) || 0.0).toFixed(2)}% / ${(parseFloat(item.cpu.usage_steal) || 0.0).toFixed(2)}%`,
        memory_detail: `${fileSizePretty(parseInt(item.mem.used) || 0)} / ${fileSizePretty(parseInt(item.mem.total) || 0)}`,
        swap_detail: `${fileSizePretty(parseInt(item.mem.swap_cached) || 0)} / ${fileSizePretty(parseInt(item.mem.swap_total) || 0)}`,
        disk_detail: `${fileSizePretty(parseInt(item.disk.used) || 0)} / ${fileSizePretty(parseInt(item.disk.total) || 0)}`,
        network_detail: `${parseInt(item.info.down_mbps) || 0}M / ${parseInt(item.info.up_mbps) || 0}M`,
        loss_cm: item.info.have_ipv4 === 'yes' ? (parseFloat(item.ping.loss_cmv4) || 0.0).toFixed(0) : (parseFloat(item.ping.loss_cmv6) || 0.0).toFixed(0),
        loss_ct: item.info.have_ipv4 === 'yes' ? (parseFloat(item.ping.loss_ctv4) || 0.0).toFixed(0) : (parseFloat(item.ping.loss_ctv6) || 0.0).toFixed(0),
        loss_cu: item.info.have_ipv4 === 'yes' ? (parseFloat(item.ping.loss_cuv4) || 0.0).toFixed(0) : (parseFloat(item.ping.loss_cuv6) || 0.0).toFixed(0),
        lossv4_detail: `${(parseFloat(item.ping.loss_cmv4) || 0.0).toFixed(0)}% / ${(parseFloat(item.ping.loss_ctv4) || 0.0).toFixed(0)}% / ${(parseFloat(item.ping.loss_cuv4) || 0.0).toFixed(0)}%`,
        pingv4_detail: `${(parseFloat(item.ping.ping_cmv4) || 0.0).toFixed(0)}ms / ${(parseFloat(item.ping.ping_ctv4) || 0.0).toFixed(0)}ms / ${(parseFloat(item.ping.ping_cuv4) || 0.0).toFixed(0)}ms`,
        lossv6_detail: `${(parseFloat(item.ping.loss_cmv6) || 0.0).toFixed(0)}% / ${(parseFloat(item.ping.loss_ctv6) || 0.0).toFixed(0)}% / ${(parseFloat(item.ping.loss_cuv6) || 0.0).toFixed(0)}%`,
        pingv6_detail: `${(parseFloat(item.ping.ping_cmv6) || 0.0).toFixed(0)}ms / ${(parseFloat(item.ping.ping_ctv6) || 0.0).toFixed(0)}ms / ${(parseFloat(item.ping.ping_cuv6) || 0.0).toFixed(0)}ms`
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
          const parsed = Papa.parse(csvText, { header: true });
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
