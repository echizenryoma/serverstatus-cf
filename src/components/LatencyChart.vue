<template>
  <v-card class="mb-4 rounded-xl" v-if="series && series.length">
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <VueApexCharts type="line" height="200" :options="chartOptions" :series="series">
      </VueApexCharts>
    </v-card-text>
  </v-card>
</template>

<script>
import VueApexCharts from "vue3-apexcharts";
import { formatLatency } from '@/utils/format';
import { useTheme } from 'vuetify'

export default {
  name: 'LatencyChart',
  components: {
    VueApexCharts
  },
  props: {
    series: {
      type: Array,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    chartId: {
      type: String,
      default: 'latency-chart'
    }
  },
  setup() {
    const theme = useTheme();
    return { theme }
  },
  computed: {
    chartOptions() {
      return {
        chart: {
          id: this.chartId,
          background: 'transparent',
          animations: {
            enabled: false
          },
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
          }
        },
        colors: [
          this.theme.current.value.colors.success,
          this.theme.current.value.colors.primary,
          this.theme.current.value.colors.error,
        ],
        theme: {
          mode: this.theme.global.name.value === 'dark' ? 'dark' : 'light'
        },
        stroke: {
          width: 2
        },
        xaxis: {
          type: 'datetime',
          labels: {
            datetimeUTC: false
          }
        },
        yaxis: {
          labels: {
            formatter: (value) => formatLatency(value)
          }
        },
        tooltip: {
          x: {
            format: 'HH:mm:ss'
          },
          y: {
            formatter: (value) => formatLatency(value)
          }
        },
        legend: {
          position: 'top'
        }
      }
    }
  }
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
