<template>
  <tr>
    <td :colspan="columns.length">
      <v-card flat class="pa-3">
        <v-row>
          <v-col cols="4" md="8">
            <div><strong>{{ $t('server.details.kernel') }}:</strong> {{ item.kernel }}</div>
            <div><strong>{{ $t('server.details.load') }}:</strong> {{ item.load_detail }}</div>
            <div><strong>{{ $t('server.details.cpuModule') }}:</strong> {{ item.cpu_module }}</div>
            <div><strong>{{ $t('server.details.cpuCores') }}:</strong> {{ item.cpu_cores }}</div>
            <div><strong>{{ $t('server.details.cpu') }}:</strong> {{ item.cpu_detail }}</div>
            <div><strong>{{ $t('server.details.memory') }}:</strong> {{ item.memory_detail }}</div>
            <div><strong>{{ $t('server.details.swap') }}:</strong> {{ item.swap_detail }}</div>
            <div><strong>{{ $t('server.details.disk') }}:</strong> {{ item.disk_detail }}</div>
            <div><strong>{{ $t('server.details.network') }}:</strong> {{ item.network_detail }}</div>
            <div><strong>{{ $t('server.details.ipv4Loss') }}:</strong> {{ item.lossv4_detail }}</div>
            <div><strong>{{ $t('server.details.ipv4Ping') }}:</strong> {{ item.pingv4_detail }}</div>
            <div><strong>{{ $t('server.details.ipv6Loss') }}:</strong> {{ item.lossv6_detail }}</div>
            <div><strong>{{ $t('server.details.ipv6Ping') }}:</strong> {{ item.pingv6_detail }}</div>
          </v-col>
          <v-col cols="4" md="4">
            <SpeedChart :series="item.chart.speed" :speed-unit="speedUnit" :title="$t('server.details.speedChart')" />
          </v-col>
        </v-row>
      </v-card>
    </td>
  </tr>
</template>

<script>
import SpeedChart from './SpeedChart.vue'

export default {
  name: 'ExpandedRow',
  components: {
    SpeedChart
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    speedUnit: {
      type: String,
      required: true
    }
  }
}
</script>