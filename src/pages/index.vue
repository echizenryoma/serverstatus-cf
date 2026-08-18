<template>
  <v-container fluid style="max-width: 120em;">
    <v-row align="center" class="frosted-glass mb-4 pa-2" justify="space-between" no-gutters>
      <v-col class="d-flex align-center" cols="auto">
        <v-card-title class="text-h4 text-left mr-2 font-weight-bold">{{ $t('app.title') }}</v-card-title>
      </v-col>

      <v-col class="d-flex align-center align-self-center" cols="4" style="min-width: 12em;">
        <v-text-field
          v-model="search"
          class="mr-2"
          clearable
          hide-details
          prepend-inner-icon="mdi-magnify"
        >
          <template #append-inner>
            <div class="d-none d-md-flex align-center">
              <v-chip
                v-for="keyword in searchKeywords"
                :key="keyword"
                class="mr-1 cursor-pointer"
                size="x-small"
                @click="search = keyword"
              >
                {{ keyword }}
              </v-chip>
            </div>
          </template>
        </v-text-field>
      </v-col>

      <v-col class="d-flex align-center align-self-center" cols="auto">
        <v-select
          v-model="$i18n.locale"
          class="mr-2"
          hide-details="auto"
          item-title="text"
          item-value="value"
          :items="languageOptions"
          style="min-width: 8em"
          @update:model-value="toggleLanguageChange"
        />

        <v-select
          v-model="pingIpVersion"
          class="mr-2"
          hide-details="auto"
          item-title="text"
          item-value="value"
          :items="pingIpVersionItems"
          style="min-width: 6em"
          @update:model-value="togglePingIpVersion"
        />

        <v-tooltip location="bottom">
          {{ speedUnit === 'bit' ? $t('actions.speedUnitBit') : $t('actions.speedUnitByte') }}
          <template #activator="{ props }">
            <v-btn v-bind="props" class="mr-2" icon @click="toggleSpeedUnit">
              <v-icon>{{ speedUnit === 'bit' ? 'mdi-speedometer' : 'mdi-chip' }}</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip location="bottom">
          {{ $t('actions.showGlobe') }}
          <template #activator="{ props }">
            <v-btn v-bind="props" class="mr-2" icon @click="showGlobeDialog = true">
              <v-icon>mdi-earth</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-btn class="mr-2" icon @click="toggleDarkMode">
          <v-icon>mdi-theme-light-dark</v-icon>
        </v-btn>

        <v-btn class="mr-2" :color="isRefreshEnabled ? 'error' : 'success'" icon @click="stopRefresh">
          <v-icon>{{ isRefreshEnabled ? 'mdi-pause' : 'mdi-refresh' }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <!-- Overview Stats Bar -->
    <OverviewBar
      :overview="overview"
      :show-estimated-monthly-traffic="showEstimatedMonthlyTraffic"
      @open-globe="showGlobeDialog = true"
    />

    <v-data-table
      class="elevation-1 frosted-table rounded-xl"
      :expanded="expandedRows"
      :headers="headers"
      item-value="host"
      :items="filteredViewData"
      :items-per-page="-1"
      @click:row="toggleExpand"
    >
      <template #bottom />

      <template #item.uptime="{ item }">
        {{ formatSeconds(item.uptime) }}
      </template>

      <template #item.location="{ item }">
        <span :class="'fi fi-' + getFlags(item.location)" />
      </template>

      <template #item.ipv4="{ item }">
        <v-tooltip :disabled="item.ipv4 !== 'nat'" location="top">
          {{ $t('server.tooltip.nat') }}
          <template #activator="{ props }">
            <v-icon v-bind="props" class="mr-1" :color="getNetProtoColor(item.ipv4)">
              {{ getNetProtoIcon(item.ipv4) }}
            </v-icon>
          </template>
        </v-tooltip>
      </template>

      <template #item.ipv6="{ item }">
        <v-tooltip :disabled="item.ipv6 !== 'nat'" location="top">
          {{ $t('server.tooltip.nat') }}
          <template #activator="{ props }">
            <v-icon v-bind="props" class="mr-1" :color="getNetProtoColor(item.ipv6)">
              {{ getNetProtoIcon(item.ipv6) }}
            </v-icon>
          </template>
        </v-tooltip>
      </template>

      <template #item.net_recv="{ item }">
        {{ formatSpeed(item.net_recv, speedUnit === 'bit') }}
      </template>

      <template #item.net_sent="{ item }">
        {{ formatSpeed(item.net_sent, speedUnit === 'bit') }}
      </template>

      <template #item.traffic_1d_recv="{ item }">
        {{ formatSize(item.traffic_1d_recv) }}
      </template>

      <template #item.traffic_1d_sent="{ item }">
        {{ formatSize(item.traffic_1d_sent) }}
      </template>

      <template #item.traffic_1m_recv="{ item }">
        {{ formatSize(item.traffic_1m_recv) }}
      </template>

      <template #item.traffic_1m_sent="{ item }">
        {{ formatSize(item.traffic_1m_sent) }}
      </template>

      <template #item.cpu="{ item }">
        <v-progress-circular :color="`${getCPUColor(item.cpu)}`" :model-value="item.cpu">
          {{ item.cpu }}%
        </v-progress-circular>
      </template>

      <template #item.memory="{ item }">
        <v-progress-circular :color="`${getMemoryColor(item.memory)}`" :model-value="item.memory">
          {{ item.memory }}%
        </v-progress-circular>
      </template>

      <template #item.disk="{ item }">
        <v-progress-circular :color="`${getDiskColor(item.disk)}`" :model-value="item.disk">
          {{ item.disk }}%
        </v-progress-circular>
      </template>

      <template #item.ping_cm="{ item }">
        <v-sheet class="rounded" :color="showPingLatency ? getLatencyColor(item.ping_cm) : getLossColor(item.ping_cm)">
          <template v-if="!showPingLatency">
            {{ formatLoss(item.ping_cm) }}
          </template>

          <template v-else>
            {{ formatLatency(item.ping_cm) }}
          </template>
        </v-sheet>
      </template>

      <template #item.ping_ct="{ item }">
        <v-sheet class="rounded" :color="showPingLatency ? getLatencyColor(item.ping_ct) : getLossColor(item.ping_ct)">
          <template v-if="!showPingLatency">
            {{ formatLoss(item.ping_ct) }}
          </template>

          <template v-else>
            {{ formatLatency(item.ping_ct) }}
          </template>
        </v-sheet>
      </template>

      <template #item.ping_cu="{ item }">
        <v-sheet class="rounded" :color="showPingLatency ? getLatencyColor(item.ping_cu) : getLossColor(item.ping_cu)">
          <template v-if="!showPingLatency">
            {{ formatLoss(item.ping_cu) }}
          </template>

          <template v-else>
            {{ formatLatency(item.ping_cu) }}
          </template>
        </v-sheet>
      </template>

      <template #expanded-row="{ columns, item }">
        <ExpandedRow
          :columns="columns"
          :item="item"
          :ping-ip-version="pingIpVersion"
          :show-estimated-monthly-traffic="showEstimatedMonthlyTraffic"
          :speed-unit="speedUnit"
        />
      </template>
    </v-data-table>

    <!-- 3D Earth Globe Modal Dialog -->
    <GlobeDialog
      v-model="showGlobeDialog"
      :is-dark="darkMode"
      :nodes="viewData"
      :speed-unit="speedUnit"
    />
  </v-container>
</template>

<script src="./index.js"></script>

<style>
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
