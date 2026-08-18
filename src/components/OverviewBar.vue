<template>
  <v-row class="mb-4 ga-4 flex-wrap" no-gutters>
    <v-col style="min-width: 8em;">
      <v-card class="frosted-glass pa-3 fill-height" flat>
        <div class="d-flex align-center mb-1">
          <v-icon class="mr-2" color="primary" size="18">mdi-clock-outline</v-icon>
          <span class="text-h7 font-weight-bold">{{ $t('overview.currentTime') }}</span>
        </div>

        <div class="text-h8">{{ overview.currentDate }}</div>
        <div class="text-h8">{{ overview.currentTime }}</div>
      </v-card>
    </v-col>

    <v-col style="min-width: 8em;">
      <v-card class="frosted-glass pa-3 fill-height" flat>
        <div class="d-flex align-center mb-1">
          <v-icon class="mr-2" color="success" size="18">mdi-server</v-icon>
          <span class="text-h7 font-weight-bold">{{ $t('overview.online') }}</span>
        </div>

        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-h8">{{ overview.onlineCount }}/{{ overview.totalCount }}</span>
          <span class="text-h8">{{ overview.onlinePercent }}%</span>
        </div>

        <v-progress-linear color="success" height="6" :model-value="overview.onlinePercent" />
      </v-card>
    </v-col>

    <v-col style="min-width: 8em;">
      <v-card class="frosted-glass pa-3 fill-height cursor-pointer" flat @click="$emit('open-globe')">
        <div class="d-flex align-center mb-1">
          <v-icon class="mr-2" color="info" size="18">mdi-earth</v-icon>
          <span class="text-h7 font-weight-bold">{{ $t('overview.regions') }}</span>
        </div>

        <div class="text-h8">{{ overview.uniqueRegions }}</div>
      </v-card>
    </v-col>

    <v-col style="min-width: 8em;">
      <v-card class="frosted-glass pa-3 fill-height" flat>
        <div class="d-flex align-center mb-1">
          <v-icon class="mr-2" color="warning" size="18">mdi-swap-vertical</v-icon>
          <span class="text-h7 font-weight-bold">{{ $t(showEstimatedMonthlyTraffic ? 'overview.estimatedTraffic' : 'overview.traffic') }}</span>
        </div>

        <div class="text-h8 d-flex align-center">
          <v-icon class="mr-1">mdi-arrow-up</v-icon>
          <span>{{ overview.totalTrafficSent }}</span>
        </div>

        <div class="text-h8 d-flex align-center">
          <v-icon class="mr-1">mdi-arrow-down</v-icon>
          <span>{{ overview.totalTrafficRecv }}</span>
        </div>
      </v-card>
    </v-col>

    <v-col style="min-width: 12em;">
      <v-card class="frosted-glass pa-3 fill-height" flat>
        <div class="d-flex align-center mb-1">
          <v-icon class="mr-2" color="error" size="18">mdi-speedometer</v-icon>
          <span class="text-h7 font-weight-bold">{{ $t('overview.speed') }}</span>
        </div>

        <div class="text-h8 d-flex align-center">
          <v-icon class="mr-1">mdi-arrow-up</v-icon>
          <span>{{ overview.totalSpeedSent }}</span>
        </div>

        <div class="text-h8 d-flex align-center">
          <v-icon class="mr-1">mdi-arrow-down</v-icon>
          <span>{{ overview.totalSpeedRecv }}</span>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
  export default {
    name: 'OverviewBar',
    props: {
      overview: {
        type: Object,
        required: true,
      },
      showEstimatedMonthlyTraffic: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['open-globe'],
  }
</script>
