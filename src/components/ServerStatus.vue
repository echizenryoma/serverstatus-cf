<template>
  <v-container fluid>
    <v-row align="center" justify="space-between" class="mb-3">
      <v-col cols="auto">
        <v-card-title class="text-h4 text-center">ServerStatus</v-card-title>
      </v-col>
      <v-col cols="auto">
        <v-btn @click="toggleDarkMode" icon>
          <v-icon>mdi-theme-light-dark</v-icon>
        </v-btn>
        <v-btn @click="stopRefresh" :color="isRefreshEnabled ? 'error' : 'success'" icon>
          <v-icon>{{ isRefreshEnabled ? 'mdi-refresh-off' : 'mdi-refresh' }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-progress-linear v-model="countdown" color="primary" height="5" :max="1500" :min="0" :reverse="true"
      class="mb-3"></v-progress-linear>
    <v-data-table :headers="headers" :items="viewData" item-value="host" show-expand hide-default-footer
      class="elevation-1" :items-per-page="-1">
      <template v-slot:item.cpu="{ item }">
        <v-progress-linear :model-value="item.cpu" color="red" height="15" rounded>
          <strong>{{ item.cpu }}%</strong>
        </v-progress-linear>
      </template>

      <template v-slot:item.memory="{ item }">
        <v-progress-linear :model-value="item.memory" color="indigo" height="15" rounded>
          <strong>{{ item.memory }}%</strong>
        </v-progress-linear>
      </template>

      <template v-slot:item.disk="{ item }">
        <v-progress-linear :model-value="item.disk" color="green" height="15" rounded>
          <strong>{{ item.disk }}%</strong>
        </v-progress-linear>
      </template>

      <template v-slot:item.loss_cm="{ item }">
        <v-sheet :class="`pa-1 ${getLossColor(item.loss_cm)}`">
          {{ item.loss_cm }}%
        </v-sheet>
      </template>

      <template v-slot:item.loss_ct="{ item }">
        <v-sheet :class="`pa-1 ${getLossColor(item.loss_ct)}`">
          {{ item.loss_ct }}%
        </v-sheet>
      </template>

      <template v-slot:item.loss_cu="{ item }">
        <v-sheet :class="`pa-1 ${getLossColor(item.loss_cu)}`">
          {{ item.loss_cu }}%
        </v-sheet>
      </template>

      <template v-slot:expanded-row="{ columns, item }">
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
      </template>
    </v-data-table>
  </v-container>
</template>

<script src="./ServerStatus.js"></script>
