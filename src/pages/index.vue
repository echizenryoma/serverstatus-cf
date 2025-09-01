<template>
  <v-container fluid>
    <v-row align="center" justify="space-between" class="mb-3">
      <v-col cols="auto">
        <v-card-title class="text-h4 text-center">{{ $t('app.title') }}</v-card-title>
      </v-col>

      <v-col cols="auto" class="d-flex align-center">
        <v-select v-model="$i18n.locale" :items="languageOptions" item-title="text" item-value="value" density="compact"
          style="max-width: 10em" class="mr-2" hide-details single-line
          @update:modelValue="handleLanguageChange"></v-select>
        <v-btn @click="toggleSpeedUnit" icon rounded class="mr-2"
          :title="speedUnit === 'bit' ? $t('function.speedUnit.switchToByte') : $t('function.speedUnit.switchToBit')">
          <v-icon>{{ speedUnit === 'bit' ? 'mdi-speedometer' : 'mdi-chip' }}</v-icon>
        </v-btn>
        <v-btn @click="toggleDarkMode" icon rounded class="mr-2">
          <v-icon>mdi-theme-light-dark</v-icon>
        </v-btn>
        <v-btn @click="stopRefresh" :color="isRefreshEnabled ? 'error' : 'success'" icon rounded>
          <v-icon>{{ isRefreshEnabled ? 'mdi-pause' : 'mdi-refresh' }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-data-table :headers="headers" :items="viewData" item-value="host" class="elevation-1" :items-per-page="-1"
      :expanded="expandedRows" hide-default-footer @click:row="toggleExpand" rounded>
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

      <template v-slot:item.loss_cm="{ item }">
        <v-sheet :color="`${getLossColor(item.loss_cm)}`" rounded>
          {{ item.loss_cm }}%
        </v-sheet>
      </template>

      <template v-slot:item.loss_ct="{ item }">
        <v-sheet :color="`${getLossColor(item.loss_ct)}`" rounded>
          {{ item.loss_ct }}%
        </v-sheet>
      </template>

      <template v-slot:item.loss_cu="{ item }">
        <v-sheet :color="`${getLossColor(item.loss_cu)}`" rounded>
          {{ item.loss_cu }}%
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
