<template>
  <v-card v-if="series && series.length > 0" class="mb-4 rounded-xl">
    <v-card-title>{{ title }}</v-card-title>

    <v-card-text>
      <VueApexCharts
        :key="chartKey"
        height="200"
        :options="chartOptions"
        :series="series"
        type="line"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
  import { computed } from 'vue'
  import VueApexCharts from 'vue3-apexcharts'
  import { useTheme } from 'vuetify'
  import { formatSpeed } from '@/utils/format'

  const props = defineProps({
    series: {
      type: Array,
      required: true,
    },
    speedUnit: {
      type: String,
      default: 'bit',
    },
    title: {
      type: String,
      required: true,
    },
    chartId: {
      type: String,
      default: 'speed-chart',
    },
  })

  const theme = useTheme()

  const chartKey = computed(() => {
    return `${props.chartId}-${props.speedUnit}-${theme.global.current.value.dark ? 'dark' : 'light'}`
  })

  const chartOptions = computed(() => {
    return {
      chart: {
        id: props.chartId,
        background: 'transparent',
        animations: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      colors: [
        theme.current.value.colors.primary,
        theme.current.value.colors.secondary,
        theme.current.value.colors.success,
      ],
      theme: {
        mode: theme.global.current.value.dark ? 'dark' : 'light',
      },
      stroke: {
        width: 2,
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
        },
      },
      yaxis: {
        labels: {
          formatter: value => formatSpeed(value, props.speedUnit === 'bit'),
        },
      },
      tooltip: {
        x: {
          format: 'HH:mm:ss',
        },
        y: {
          formatter: value => formatSpeed(value, props.speedUnit === 'bit'),
        },
      },
      legend: {
        position: 'top',
        onItemClick: {
          toggleDataSeries: false,
        },
      },
    }
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
