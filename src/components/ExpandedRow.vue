<template>
  <tr>
    <td :colspan="columns.length">
      <v-card class="pa-3 rounded-xl" flat>
        <v-row>
          <v-col cols="4">
            <div><strong>{{ $t('server.details.kernel') }}:</strong> {{ item.kernel }}</div>
            <div><strong>{{ $t('server.details.load') }}:</strong> {{ item.load_detail }}</div>

            <div><strong>{{ $t('server.details.cpu') }}:</strong> {{ item.cpu_module }} {{ item.cpu_cores > 1 ? "(" +
              item.cpu_cores + ")" : "" }}</div>

            <div><strong>{{ $t('server.details.cpuUsage') }}:</strong> {{ item.cpu_detail }}</div>
            <div><strong>{{ $t('server.details.memory') }}:</strong> {{ item.memory_detail }}</div>
            <div><strong>{{ $t('server.details.swap') }}:</strong> {{ item.swap_detail }}</div>
            <div><strong>{{ $t('server.details.disk') }}:</strong> {{ item.disk_detail }}</div>
            <div><strong>{{ $t('server.details.network') }}:</strong> {{ item.network_detail }}</div>
            <div><strong>{{ $t('server.details.traffic') }}:</strong> {{ item.traffic_detail }}</div>

            <div><strong>{{ $t(showEstimatedMonthlyTraffic ? 'server.details.estimatedMonthlyTraffic' :
              'server.details.monthlyTraffic') }}:</strong> {{ item.monthly_traffic_detail }}</div>

            <div><strong>{{ $t('server.details.ipv4Loss') }}:</strong> {{ item.lossv4_detail }}</div>
            <div><strong>{{ $t('server.details.ipv4Ping') }}:</strong> {{ item.pingv4_detail }}</div>
            <div><strong>{{ $t('server.details.ipv6Loss') }}:</strong> {{ item.lossv6_detail }}</div>
            <div><strong>{{ $t('server.details.ipv6Ping') }}:</strong> {{ item.pingv6_detail }}</div>
          </v-col>

          <v-col cols="4">
            <SpeedChart
              :chart-id="'speed-chart-' + item.host"
              :series="item.chart.speed"
              :speed-unit="speedUnit"
              :title="$t('server.details.speedChartTitle')"
            />
          </v-col>

          <v-col cols="4">
            <LatencyChart
              :chart-id="'latency-chart-' + item.host"
              :series="item.chart.latency"
              :title="latencyChartTitle"
            />
          </v-col>
        </v-row>
      </v-card>
    </td>
  </tr>
</template>

<script>
  import LatencyChart from './LatencyChart.vue'
  import SpeedChart from './SpeedChart.vue'

  export default {
    name: 'ExpandedRow',
    components: {
      SpeedChart,
      LatencyChart,
    },
    props: {
      showEstimatedMonthlyTraffic: {
        type: Boolean,
        required: true,
      },
      item: {
        type: Object,
        required: true,
      },
      columns: {
        type: Array,
        required: true,
      },
      speedUnit: {
        type: String,
        required: true,
      },
      pingIpVersion: {
        type: String,
        default: 'auto',
      },
    },
    computed: {
      latencyChartTitle () {
        const label = this.pingIpVersion === 'auto'
          ? this.$t('server.title.pingAuto')
          : (this.pingIpVersion === 'v6'
            ? this.$t('server.title.pingV6')
            : this.$t('server.title.pingV4'))
        return this.$t('server.details.latencyChartTitle') + ' (' + label + ')'
      },
    },
  }
</script>

<style scoped>
.v-card {
  background-color: rgba(255, 255, 255, 0.64) !important;
}

.v-theme--dark .v-card {
  background-color: rgba(30, 30, 30, 0.64) !important;
}
</style>
