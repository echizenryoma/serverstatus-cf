<template>
  <tr>
    <td :colspan="columns.length">
      <v-card class="pa-3 rounded-xl" flat>
        <v-row>
          <v-col cols="4">
            <div><strong>{{ $t('table.details.kernel') }}:</strong> {{ item.kernel }}</div>
            <div><strong>{{ $t('table.details.load') }}:</strong> {{ item.load_detail }}</div>

            <div><strong>{{ $t('table.details.cpu') }}:</strong> {{ item.cpu_module }} {{ item.cpu_cores > 1 ? "(" +
              item.cpu_cores + ")" : "" }}</div>

            <div><strong>{{ $t('table.details.cpuUsage') }}:</strong> {{ item.cpu_detail }}</div>
            <div><strong>{{ $t('table.details.memory') }}:</strong> {{ item.memory_detail }}</div>
            <div><strong>{{ $t('table.details.swap') }}:</strong> {{ item.swap_detail }}</div>
            <div><strong>{{ $t('table.details.disk') }}:</strong> {{ item.disk_detail }}</div>
            <div><strong>{{ $t('table.details.network') }}:</strong> {{ item.network_detail }}</div>
            <div><strong>{{ $t('table.details.traffic') }}:</strong> {{ item.traffic_detail }}</div>

            <div><strong>{{ $t(showEstimatedMonthlyTraffic ? 'table.details.estimatedMonthlyTraffic' :
              'table.details.monthlyTraffic') }}:</strong> {{ item.monthly_traffic_detail }}</div>

            <div><strong>{{ $t('table.details.ipv4Loss') }}:</strong> {{ item.lossv4_detail }}</div>
            <div><strong>{{ $t('table.details.ipv4Ping') }}:</strong> {{ item.pingv4_detail }}</div>
            <div><strong>{{ $t('table.details.ipv6Loss') }}:</strong> {{ item.lossv6_detail }}</div>
            <div><strong>{{ $t('table.details.ipv6Ping') }}:</strong> {{ item.pingv6_detail }}</div>
          </v-col>

          <v-col cols="4">
            <SpeedChart
              :chart-id="'speed-chart-' + item.host"
              :series="item.chart.speed"
              :speed-unit="speedUnit"
              :title="$t('table.details.speedChartTitle')"
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

<script setup>
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import LatencyChart from './LatencyChart.vue'
  import SpeedChart from './SpeedChart.vue'

  const props = defineProps({
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
  })

  const { t } = useI18n()

  const latencyChartTitle = computed(() => {
    const label = props.pingIpVersion === 'auto'
      ? t('table.title.pingAuto')
      : (props.pingIpVersion === 'v6'
        ? t('table.title.pingV6')
        : t('table.title.pingV4'))
    return t('table.details.latencyChartTitle') + ' (' + label + ')'
  })
</script>

<style scoped>
.v-card {
  background-color: rgba(255, 255, 255, 0.64) !important;
}

.v-theme--dark .v-card {
  background-color: rgba(30, 30, 30, 0.64) !important;
}
</style>
