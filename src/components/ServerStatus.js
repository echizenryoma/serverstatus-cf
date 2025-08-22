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
        { title: "IPv4", key: "ipv4", align: 'center', class: 'font-weight-bold' },
        { title: "IPv6", key: "ipv6", align: 'center', class: 'font-weight-bold' },
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
      countdown: 1500,
      countdownInterval: null,
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
        ipv4: item.info.have_ipv4 === 'yes' ? '✅' : '❌',
        ipv6: item.info.have_ipv6 === 'yes' ? '✅' : '❌',
        location: getFlagEmoji(item.info.loc),
        cpu: Math.round(parseFloat(item.cpu.usage_user) + parseFloat(item.cpu.usage_system)),
        memory: Math.round((parseInt(item.mem.used) / parseInt(item.mem.total)) * 100),
        disk: Math.round((parseInt(item.disk.used) / parseInt(item.disk.total)) * 100),
        load: parseFloat(item.cpu.load1).toFixed(2),
        net: `${fileSizePretty(parseInt(item.net.bytes_recv))}|${fileSizePretty(parseInt(item.net.bytes_sent))}`,
        traffic: `${fileSizePretty(parseInt(item.traffic.bytes_recv))}|${fileSizePretty(parseInt(item.traffic.bytes_sent))}`,
        load_detail: `${parseFloat(item.cpu.load1).toFixed(2)} / ${parseFloat(item.cpu.load5).toFixed(2)} / ${parseFloat(item.cpu.load15).toFixed(2)}`,
        cpu_detail: `${parseFloat(item.cpu.usage_system).toFixed(2)} / ${parseFloat(item.cpu.usage_user).toFixed(2)} / ${parseFloat(item.cpu.usage_steal).toFixed(2)}`,
        memory_detail: `${fileSizePretty(parseInt(item.mem.used))} / ${fileSizePretty(parseInt(item.mem.total))}`,
        swap_detail: `${fileSizePretty(parseInt(item.mem.swap_cached))} / ${fileSizePretty(parseInt(item.mem.swap_total))}`,
        disk_detail: `${fileSizePretty(parseInt(item.disk.used))} / ${fileSizePretty(parseInt(item.disk.total))}`,
        network_detail: `${parseInt(item.info.down_mbps)}M / ${parseInt(item.info.up_mbps)}M`,
        loss_cm: item.info.have_ipv4 === 'yes' ? parseFloat(item.ping.loss_cmv4).toFixed(0) : parseFloat(item.ping.loss_cmv6).toFixed(0),
        loss_ct: item.info.have_ipv4 === 'yes' ? parseFloat(item.ping.loss_ctv4).toFixed(0) : parseFloat(item.ping.loss_ctv6).toFixed(0),
        loss_cu: item.info.have_ipv4 === 'yes' ? parseFloat(item.ping.loss_cuv4).toFixed(0) : parseFloat(item.ping.loss_cuv6).toFixed(0),
        lossv4_detail: `${parseFloat(item.ping.loss_cmv4).toFixed(0)}% / ${parseFloat(item.ping.loss_ctv4).toFixed(0)}% / ${parseFloat(item.ping.loss_cuv4).toFixed(0)}%`,
        pingv4_detail: `${parseFloat(item.ping.ping_cmv4).toFixed(0)}ms / ${parseFloat(item.ping.ping_ctv4).toFixed(0)}ms / ${parseFloat(item.ping.ping_cuv4).toFixed(0)}ms`,
        lossv6_detail: `${parseFloat(item.ping.loss_cmv6).toFixed(0)}% / ${parseFloat(item.ping.loss_ctv6).toFixed(0)}% / ${parseFloat(item.ping.loss_cuv6).toFixed(0)}%`,
        pingv6_detail: `${parseFloat(item.ping.ping_cmv6).toFixed(0)}ms / ${parseFloat(item.ping.ping_ctv6).toFixed(0)}ms / ${parseFloat(item.ping.ping_cuv6).toFixed(0)}ms`
      }));
    },
    async fetchData() {
      const urls = [
        "/api/info",
        "/api/cpu",
        "/api/mem",
        "/api/disk",
        "/api/net",
        "/api/traffic",
        "/api/ping",
      ];
      try {
        const requests = urls.map((url) => axios.get(url));
        const responses = await Promise.all(requests);
        const dataMap = new Map(this.db.map(row => [row.host, row]));
        responses.forEach((res, index) => {
          const csvText = res.data;
          const parsed = Papa.parse(csvText, { header: true });
          parsed.data.filter(
            (row) => row.host && row.host.trim() !== ""
          ).forEach((row) => {
            const host = row.host;
            if (!dataMap.has(host)) {
              dataMap.set(host, {
                host: host,
              });
            }
            const item = dataMap.get(host);
            switch (index) {
              case 0:
                item.info = row;
                break;
              case 1:
                item.cpu = row;
                break;
              case 2:
                item.mem = row;
                break;
              case 3:
                item.disk = row;
                break;
              case 4:
                item.net = row;
                break;
              case 5:
                item.traffic = row;
                break;
              case 6:
                item.ping = row;
                break;
            }
          });
        });
        this.db = Array.from(dataMap.values());
        this.updateViewData();
      } catch (e) {
        console.error("get failed: ", e);
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
        this.countdown = 1500;
        this.startCountdown();
      } else {
        clearInterval(this.refreshInterval);
        clearInterval(this.countdownInterval);
      }
    },
  },
  mounted() {
    this.startCountdown();
    this.fetchData();
    if (this.isRefreshEnabled) {
      this.refreshInterval = setInterval(() => {
        this.fetchData();
      }, 1500);
    }
  },
  beforeUnmount() {
    clearInterval(this.refreshInterval);
    clearInterval(this.countdownInterval);
  },
}
