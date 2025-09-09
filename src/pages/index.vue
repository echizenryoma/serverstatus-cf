<template>
  <v-container fluid>
    <v-row align="center" justify="space-between" no-gutters>
      <v-col cols="auto" class="d-flex align-center">
        <v-card-title class="text-h4 text-left mr-2">{{ $t('app.title') }}</v-card-title>
      </v-col>

      <v-col cols="4" class="d-flex align-center">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" class="mr-2" />
      </v-col>

      <v-col cols="auto" class="d-flex align-center">
        <v-select v-model="$i18n.locale" :items="languageOptions" item-title="text" item-value="value"
          hide-details="auto" style="min-width: 8em" @update:modelValue="toggleLanguageChange" class="mr-2"></v-select>
        <v-btn @click="toggleSpeedUnit" icon rounded class="mr-2"
          :title="speedUnit === 'bit' ? $t('function.speedUnit.switchToByte') : $t('function.speedUnit.switchToBit')">
          <v-icon>{{ speedUnit === 'bit' ? 'mdi-speedometer' : 'mdi-chip' }}</v-icon>
        </v-btn>
        <v-btn @click="toggleDarkMode" icon rounded class="mr-2">
          <v-icon>mdi-theme-light-dark</v-icon>
        </v-btn>
        <v-btn @click="stopRefresh" :color="isRefreshEnabled ? 'error' : 'success'" icon rounded class="mr-2">
          <v-icon>{{ isRefreshEnabled ? 'mdi-pause' : 'mdi-refresh' }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-data-table :headers="headers" :items="filteredViewData" item-value="host" class="elevation-1"
      :items-per-page="-1" :expanded="expandedRows" @click:row="toggleExpand" rounded>
      <template v-slot:item.uptime="{ item }">
        {{ formatSeconds(item.uptime) }}
      </template>
      <template v-slot:item.location="{ item }">
        <span :class="`fi fi-${item.location}`"></span>
      </template>
      <template v-slot:item.ipv4="{ item }">
        <v-icon :color="getNetProtoColor(item.ipv4)" class="mr-1">
          {{ getNetProtoIcon(item.ipv4) }}
        </v-icon>
      </template>
      <template v-slot:item.ipv6="{ item }">
        <v-icon :color="getNetProtoColor(item.ipv6)" class="mr-1">
          {{ getNetProtoIcon(item.ipv6) }}
        </v-icon>
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
        <v-progress-linear :model-value="item.cpu" :color="`${getCPUColor(item.cpu)}`" height="15" rounded>
          {{ item.cpu }}%
        </v-progress-linear>
      </template>
      <template v-slot:item.memory="{ item }">
        <v-progress-linear :model-value="item.memory" :color="`${getMemoryColor(item.memory)}`" height="15" rounded>
          {{ item.memory }}%
        </v-progress-linear>
      </template>
      <template v-slot:item.disk="{ item }">
        <v-progress-linear :model-value="item.disk" :color="`${getDiskColor(item.disk)}`" height="15" rounded>
          {{ item.disk }}%
        </v-progress-linear>
      </template>

      <template v-slot:item.ping_cm="{ item }">
        <v-sheet :color="showPingLatency ? getLatencyColor(item.ping_cm) : getLossColor(item.ping_cm)" rounded>
          <template v-if="!showPingLatency">
            {{ item.ping_cm }}%
          </template>
          <template v-else>
            {{ formatLatency(item.ping_cm) }}
          </template>
        </v-sheet>
      </template>
      <template v-slot:item.ping_ct="{ item }">
        <v-sheet :color="showPingLatency ? getLatencyColor(item.ping_ct) : getLossColor(item.ping_ct)" rounded>
          <template v-if="!showPingLatency">
            {{ item.ping_ct }}%
          </template>
          <template v-else>
            {{ formatLatency(item.ping_ct) }}
          </template>
        </v-sheet>
      </template>
      <template v-slot:item.ping_cu="{ item }">
        <v-sheet :color="showPingLatency ? getLatencyColor(item.ping_cu) : getLossColor(item.ping_cu)" rounded>
          <template v-if="!showPingLatency">
            {{ item.ping_cu }}%
          </template>
          <template v-else>
            {{ formatLatency(item.ping_cu) }}
          </template>
        </v-sheet>
      </template>

      <template v-slot:expanded-row="{ columns, item }">
        <ExpandedRow :columns="columns" :item="item" :speed-unit="speedUnit" />
      </template>
    </v-data-table>
    <Footer />
  </v-container>
</template>

<script src="./index.js"></script>

<style>
.v-data-table-footer__items-per-page .v-select {
  min-width: 6em;
}
</style>
