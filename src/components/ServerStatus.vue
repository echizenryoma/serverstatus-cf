<template>
  <v-container fluid>
    <v-row align="center" justify="space-between" class="mb-3">
      <v-col cols="auto">
        <v-card-title class="text-h4 text-center">ServerStatus</v-card-title>
      </v-col>
      <v-col cols="auto">
        <v-btn @click="toggleDarkMode" icon rounded>
          <v-icon>mdi-theme-light-dark</v-icon>
        </v-btn>
        <v-btn class="ml-4" @click="stopRefresh" :color="isRefreshEnabled ? 'error' : 'success'" icon rounded>
          <v-icon>{{ isRefreshEnabled ? 'mdi-pause' : 'mdi-refresh' }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-data-table :headers="headers" :items="viewData" item-value="host" class="elevation-1" :items-per-page="-1"
      :expanded="expandedRows" hide-default-footer @click:row="toggleExpand" rounded>
      <template v-slot:item.uptime="{ item }">
        {{ this.formatSeconds(item.uptime) }}
      </template>
      <template v-slot:item.location="{ item }">
        <v-img :src="`https://flagcdn.com/${item.location.toLowerCase()}.svg`" height="2ch" rounded></v-img>
      </template>
      <template v-slot:item.net_recv="{ item }">
        {{ this.formatSize(item.net_recv, { bits: true }) }}
      </template>
      <template v-slot:item.net_sent="{ item }">
        {{ this.formatSize(item.net_sent, { bits: true }) }}
      </template>
      <template v-slot:item.traffic_recv="{ item }">
        {{ this.formatSize(item.traffic_recv) }}
      </template>
      <template v-slot:item.traffic_sent="{ item }">
        {{ this.formatSize(item.traffic_sent) }}
      </template>
      <template v-slot:item.traffic_1d_recv="{ item }">
        {{ this.formatSize(item.traffic_1d_recv) }}
      </template>
      <template v-slot:item.traffic_1d_sent="{ item }">
        {{ this.formatSize(item.traffic_1d_sent) }}
      </template>

      <template v-slot:item.cpu="{ item }">
        <v-progress-linear :model-value="item.cpu" color="red" height="15ch" rounded>
          <strong>{{ item.cpu }}%</strong>
        </v-progress-linear>
      </template>

      <template v-slot:item.memory="{ item }">
        <v-progress-linear :model-value="item.memory" color="indigo" height="15ch" rounded>
          <strong>{{ item.memory }}%</strong>
        </v-progress-linear>
      </template>

      <template v-slot:item.disk="{ item }">
        <v-progress-linear :model-value="item.disk" color="green" height="15ch" rounded>
          <strong>{{ item.disk }}%</strong>
        </v-progress-linear>
      </template>

      <template v-slot:item.loss_cm="{ item }">
        <v-sheet :class="`${getLossColor(item.loss_cm)}`" rounded>
          {{ item.loss_cm }}%
        </v-sheet>
      </template>

      <template v-slot:item.loss_ct="{ item }">
        <v-sheet :class="`${getLossColor(item.loss_ct)}`" rounded>
          {{ item.loss_ct }}%
        </v-sheet>
      </template>

      <template v-slot:item.loss_cu="{ item }">
        <v-sheet :class="`${getLossColor(item.loss_cu)}`" rounded>
          {{ item.loss_cu }}%
        </v-sheet>
      </template>

      <template v-slot:expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-card flat class="pa-3">
              <div><strong>系统负载(1/5/15):</strong> {{ item.load_detail }}</div>
              <div><strong>CPU(系统/用户/窃取):</strong> {{ item.cpu_detail }}</div>
              <div><strong>内存:</strong> {{ item.memory_detail }}</div>
              <div><strong>交换空间:</strong> {{ item.swap_detail }}</div>
              <div><strong>硬盘:</strong> {{ item.disk_detail }}</div>
              <div><strong>网络限速(↓/↑):</strong> {{ item.network_detail }}</div>
              <div><strong>IPv4丢包率(移/电/联):</strong> {{ item.lossv4_detail }}</div>
              <div><strong>IPv4延迟(移/电/联):</strong> {{ item.pingv4_detail }}</div>
              <div><strong>IPv6丢包率(移/电/联):</strong> {{ item.lossv6_detail }}</div>
              <div><strong>IPv6延迟(移/电/联):</strong> {{ item.pingv6_detail }}</div>
            </v-card>
          </td>
        </tr>
      </template>
    </v-data-table>
    <v-footer app absolute color="transparent" class="text-center">
      <v-col class="text-caption">
        © Powered by <a href="https://www.influxdata.com/" target="_blank">InfluxDB</a>, <a
          href="https://pages.cloudflare.com/" target="_blank">Cloudflare Pages</a>
      </v-col>
    </v-footer>
  </v-container>
</template>

<script src="./ServerStatus.js"></script>
