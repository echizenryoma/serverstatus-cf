<template>
  <v-card class="mb-4" v-if="series && series.length">
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
    }
  },
  computed: {
    chartOptions() {
      const theme = useTheme();
      return {
        chart: {
          id: 'latency-chart',
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
          theme.current.value.colors.success,
          theme.current.value.colors.primary,
          theme.current.value.colors.error,
        ],
        theme: {
          mode: theme.global.current.value.dark ? 'dark' : 'light'
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