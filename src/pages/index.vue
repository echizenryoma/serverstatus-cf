<template>
  <v-container fluid style="max-width: 120em;">
    <v-row align="center" justify="space-between" no-gutters class="frosted-glass mb-4 pa-2">
      <v-col cols="auto" class="d-flex align-center">
        <v-card-title class="text-h4 text-left mr-2 font-weight-bold">{{ $t('app.title') }}</v-card-title>
      </v-col>

      <v-col cols="4" class="d-flex align-center align-self-center" style="min-width: 12em;">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" class="mr-2" hide-details clearable>
          <template v-slot:append-inner>
            <div class="d-none d-md-flex align-center">
              <v-chip v-for="keyword in searchKeywords" :key="keyword" size="x-small" label class="mr-1 cursor-pointer"
                @click="search = keyword">
                {{ keyword }}
              </v-chip>
            </div>
          </template>
        </v-text-field>
      </v-col>

      <v-col cols="auto" class="d-flex align-center align-self-center">
        <v-select v-model="$i18n.locale" :items="languageOptions" item-title="text" item-value="value"
          hide-details="auto" style="min-width: 8em" @update:modelValue="toggleLanguageChange" class="mr-2"></v-select>
        <v-tooltip location="bottom"
          :text="speedUnit === 'bit' ? $t('actions.speedUnitBit') : $t('actions.speedUnitByte')">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" @click="toggleSpeedUnit" icon rounded class="mr-2">
              <v-icon>{{ speedUnit === 'bit' ? 'mdi-speedometer' : 'mdi-chip' }}</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-btn @click="toggleDarkMode" icon rounded class="mr-2">
          <v-icon>mdi-theme-light-dark</v-icon>
        </v-btn>
        <v-btn @click="stopRefresh" :color="isRefreshEnabled ? 'error' : 'success'" icon rounded class="mr-2">
          <v-icon>{{ isRefreshEnabled ? 'mdi-pause' : 'mdi-refresh' }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <!-- Overview Stats Bar -->
    <v-row no-gutters class="mb-4 ga-4 flex-wrap">
      <v-col style="min-width: 8em;">
        <v-card class="frosted-glass pa-3 fill-height" flat>
          <div class="d-flex align-center mb-1">
            <v-icon size="18" color="primary" class="mr-2">mdi-clock-outline</v-icon>
            <span class="text-h7 font-weight-bold">{{ $t('overview.currentTime') }}</span>
          </div>
          <div class="text-h8">{{ currentDate }}</div>
          <div class="text-h8">{{ currentTime }}</div>
        </v-card>
      </v-col>
      <v-col style="min-width: 8em;">
        <v-card class="frosted-glass pa-3 fill-height" flat>
          <div class="d-flex align-center mb-1">
            <v-icon size="18" color="success" class="mr-2">mdi-server</v-icon>
            <span class="text-h7 font-weight-bold">{{ $t('overview.online') }}</span>
          </div>
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-h8">{{ onlineCount }}/{{ totalCount }}</span>
            <span class="text-h8">{{ onlinePercent }}%</span>
          </div>
          <v-progress-linear :model-value="onlinePercent" color="success" rounded height="6"></v-progress-linear>
        </v-card>
      </v-col>
      <v-col style="min-width: 8em;">
        <v-card class="frosted-glass pa-3 fill-height" flat>
          <div class="d-flex align-center mb-1">
            <v-icon size="18" color="info" class="mr-2">mdi-earth</v-icon>
            <span class="text-h7 font-weight-bold">{{ $t('overview.regions') }}</span>
          </div>
          <div class="text-h8">{{ uniqueRegions }}</div>
        </v-card>
      </v-col>
      <v-col style="min-width: 8em;">
        <v-card class="frosted-glass pa-3 fill-height" flat>
          <div class="d-flex align-center mb-1">
            <v-icon size="18" color="warning" class="mr-2">mdi-swap-vertical</v-icon>
            <span class="text-h7 font-weight-bold">{{ $t('overview.traffic') }}</span>
          </div>
          <div class="text-h8 d-flex align-center">
            <v-icon class="mr-1">mdi-arrow-up</v-icon>
            <span>{{ totalTrafficSent }}</span>
          </div>
          <div class="text-h8 d-flex align-center">
            <v-icon class="mr-1">mdi-arrow-down</v-icon>
            <span>{{ totalTrafficRecv }}</span>
          </div>
        </v-card>
      </v-col>
      <v-col style="min-width: 12em;">
        <v-card class="frosted-glass pa-3 fill-height" flat>
          <div class="d-flex align-center mb-1">
            <v-icon size="18" color="error" class="mr-2">mdi-speedometer</v-icon>
            <span class="text-h7 font-weight-bold">{{ $t('overview.speed') }}</span>
          </div>
          <div class="text-h8 d-flex align-center">
            <v-icon class="mr-1">mdi-arrow-up</v-icon>
            <span>{{ totalSpeedSent }}</span>
          </div>
          <div class="text-h8 d-flex align-center">
            <v-icon class="mr-1">mdi-arrow-down</v-icon>
            <span>{{ totalSpeedRecv }}</span>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-data-table :headers="headers" :items="filteredViewData" item-value="host"
      class="elevation-1 frosted-table rounded-xl" :items-per-page-options="[5, 10, 15, 20, -1]" :items-per-page="-1"
      :expanded="expandedRows" @click:row="toggleExpand">
      <template v-slot:item.uptime="{ item }">
        {{ formatSeconds(item.uptime) }}
      </template>
      <template v-slot:item.location="{ item }">
        <span :class="'fi fi-' + getFlags(item.location)"></span>
      </template>
      <template v-slot:item.ipv4="{ item }">
        <v-tooltip location="top" text="NAT" :disabled="item.ipv4 !== 'nat'">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" :color="getNetProtoColor(item.ipv4)" class="mr-1">
              {{ getNetProtoIcon(item.ipv4) }}
            </v-icon>
          </template>
        </v-tooltip>
      </template>
      <template v-slot:item.ipv6="{ item }">
        <v-tooltip location="top" text="NAT" :disabled="item.ipv6 !== 'nat'">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" :color="getNetProtoColor(item.ipv6)" class="mr-1">
              {{ getNetProtoIcon(item.ipv6) }}
            </v-icon>
          </template>
        </v-tooltip>
      </template>

      <template v-slot:item.net_recv="{ item }">
        {{ formatSpeed(item.net_recv, speedUnit === 'bit') }}
      </template>
      <template v-slot:item.net_sent="{ item }">
        {{ formatSpeed(item.net_sent, speedUnit === 'bit') }}
      </template>

      <template v-slot:item.traffic_1d_recv="{ item }">
        {{ formatSize(item.traffic_1d_recv) }}
      </template>
      <template v-slot:item.traffic_1d_sent="{ item }">
        {{ formatSize(item.traffic_1d_sent) }}
      </template>

      <template v-slot:item.traffic_1m_recv="{ item }">
        {{ formatSize(item.traffic_1m_recv) }}
      </template>
      <template v-slot:item.traffic_1m_sent="{ item }">
        {{ formatSize(item.traffic_1m_sent) }}
      </template>

      <template v-slot:item.cpu="{ item }">
        <v-progress-circular :model-value="item.cpu" :color="`${getCPUColor(item.cpu)}`">
          {{ item.cpu }}%
        </v-progress-circular>
      </template>
      <template v-slot:item.memory="{ item }">
        <v-progress-circular :model-value="item.memory" :color="`${getMemoryColor(item.memory)}`">
          {{ item.memory }}%
        </v-progress-circular>
      </template>
      <template v-slot:item.disk="{ item }">
        <v-progress-circular :model-value="item.disk" :color="`${getDiskColor(item.disk)}`">
          {{ item.disk }}%
        </v-progress-circular>
      </template>

      <template v-slot:item.ping_cm="{ item }">
        <v-sheet :color="showPingLatency ? getLatencyColor(item.ping_cm) : getLossColor(item.ping_cm)" rounded>
          <template v-if="!showPingLatency">
            {{ formatLoss(item.ping_cm) }}
          </template>
          <template v-else>
            {{ formatLatency(item.ping_cm) }}
          </template>
        </v-sheet>
      </template>
      <template v-slot:item.ping_ct="{ item }">
        <v-sheet :color="showPingLatency ? getLatencyColor(item.ping_ct) : getLossColor(item.ping_ct)" rounded>
          <template v-if="!showPingLatency">
            {{ formatLoss(item.ping_ct) }}
          </template>
          <template v-else>
            {{ formatLatency(item.ping_ct) }}
          </template>
        </v-sheet>
      </template>
      <template v-slot:item.ping_cu="{ item }">
        <v-sheet :color="showPingLatency ? getLatencyColor(item.ping_cu) : getLossColor(item.ping_cu)" rounded>
          <template v-if="!showPingLatency">
            {{ formatLoss(item.ping_cu) }}
          </template>
          <template v-else>
            {{ formatLatency(item.ping_cu) }}
          </template>
        </v-sheet>
      </template>
      <template v-slot:expanded-row="{ columns, item }">
        <ExpandedRow :show-estimated-monthly-traffic="showEstimatedMonthlyTraffic" :columns="columns" :item="item"
          :speed-unit="speedUnit" />
      </template>
    </v-data-table>
  </v-container>
</template>

<script src="./index.js"></script>

<style>
.v-data-table-footer__items-per-page .v-select {
  min-width: 8rem;
}

.frosted-glass,
.frosted-table {
  border-radius: 16px;
  overflow: hidden;
}

.frosted-glass {
  background-color: rgba(255, 255, 255, 0.84) !important;
}

.v-theme--dark .frosted-glass {
  background-color: rgba(30, 30, 30, 0.84) !important;
}

.v-data-table,
.v-data-table thead,
.v-data-table tbody tr {
  background-color: rgba(255, 255, 255, 0.64) !important;
}

.v-theme--dark .v-data-table,
.v-theme--dark .v-data-table thead,
.v-theme--dark .v-data-table tbody tr {
  background-color: rgba(30, 30, 30, 0.64) !important;
}
</style>
