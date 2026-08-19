<template>
  <v-dialog
    max-width="840"
    :model-value="modelValue"
    scrollable
    transition="dialog-bottom-transition"
    @update:model-value="$emit('update:model-value', $event)"
  >
    <v-card class="globe-dialog-card frosted-glass rounded-xl overflow-hidden" flat>
      <!-- Dialog Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2 border-b">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary" size="24">mdi-earth</v-icon>
          <span class="text-h6 font-weight-bold">{{ $t('globe.title') }}</span>
        </div>

        <div class="d-flex align-center ga-2">
          <v-chip class="font-weight-medium" color="success" size="small" variant="tonal">
            <v-icon size="14" start>mdi-server</v-icon>
            {{ $t('overview.online') }}: {{ onlineCount }} / {{ totalCount }}
          </v-chip>

          <v-chip class="font-weight-medium d-none d-sm-flex" color="info" size="small" variant="tonal">
            <v-icon size="14" start>mdi-map-marker-multiple</v-icon>
            {{ $t('overview.regions') }}: {{ uniqueRegionCount }}
          </v-chip>

          <v-btn icon="mdi-close" size="small" variant="text" @click="closeDialog" />
        </div>
      </v-card-title>

      <!-- Dialog Body -->
      <v-card-text class="pa-4">
        <!-- 3D Earth Globe Canvas -->
        <div class="globe-stage mb-4">
          <CobeGlobe
            v-if="modelValue"
            ref="cobeGlobeRef"
            :is-dark="isDark"
            :nodes="nodes"
            @select-cluster="onSelectCluster"
          />
        </div>

        <!-- Region Quick Filter Chips -->
        <div class="region-chips-wrapper mb-3">
          <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center justify-space-between">
            <span>{{ $t('globe.regionsList') }}</span>
          </div>

          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="cluster in clusterList"
              :key="cluster.id"
              class="cursor-pointer"
              :color="selectedCluster?.id === cluster.id ? 'primary' : 'default'"
              size="small"
              :variant="selectedCluster?.id === cluster.id ? 'flat' : 'tonal'"
              @click="focusCluster(cluster)"
            >
              <span class="mr-1" :class="'fi fi-' + getFlagCode(cluster.code)" />
              <span>{{ getRegionName(cluster.code) }}</span>
              <span class="ml-1 opacity-70">({{ cluster.onlineServers }}/{{ cluster.servers }})</span>
            </v-chip>
          </div>
        </div>

        <!-- Selected Region Server Details -->
        <v-expand-transition>
          <div v-if="selectedCluster" class="selected-region-details mt-2">
            <v-card class="pa-3 rounded-lg bg-surface-light" variant="outlined">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="d-flex align-center ga-2">
                  <span class="text-h6" :class="'fi fi-' + getFlagCode(selectedCluster.code)" />
                  <span class="font-weight-bold">{{ getRegionName(selectedCluster.code) }}</span>

                  <v-badge
                    color="primary"
                    :content="`${selectedCluster.onlineServers}/${selectedCluster.servers}`"
                    inline
                  />
                </div>

                <v-btn
                  icon="mdi-close"
                  size="x-small"
                  variant="text"
                  @click="selectedCluster = null"
                />
              </div>

              <v-row dense>
                <v-col
                  v-for="node in selectedCluster.nodes"
                  :key="node.host"
                  cols="12"
                  sm="6"
                >
                  <v-card class="pa-2 fill-height" :color="node.uptime > 0 ? '' : 'grey'" variant="tonal">
                    <div class="d-flex align-center justify-space-between">
                      <div class="font-weight-bold text-truncate" style="max-width: 140px;">
                        <v-icon class="mr-1" :color="node.uptime > 0 ? 'success' : 'error'" size="12">
                          mdi-circle
                        </v-icon>
                        {{ node.host }}
                      </div>

                      <div class="text-caption text-grey">
                        {{ formatSeconds(node.uptime) }}
                      </div>
                    </div>

                    <div class="d-flex align-center justify-space-between text-caption mt-1 text-grey">
                      <div>{{ $t('table.title.cpu') }}: {{ node.cpu }}%</div>
                      <div>{{ $t('table.title.memory') }}: {{ node.memory }}%</div>
                      <div>{{ $t('table.title.disk') }}: {{ node.disk }}%</div>
                    </div>

                    <div class="d-flex align-center justify-space-between text-caption mt-1">
                      <div class="d-flex align-center text-truncate">
                        <v-icon class="mr-1" color="info" size="14">mdi-download</v-icon>
                        <span>{{ formatSpeed(node.net_recv, speedUnit === 'bit') }}</span>
                      </div>

                      <div class="d-flex align-center text-truncate">
                        <v-icon class="mr-1" color="warning" size="14">mdi-upload</v-icon>
                        <span>{{ formatSpeed(node.net_sent, speedUnit === 'bit') }}</span>
                      </div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
  import { useI18n } from 'vue-i18n'
  import { formatSeconds, formatSpeed, getFlagCode } from '@/utils/format'
  import { getCoordinatesByCountryCode, getRegionDisplayName } from '@/utils/geo'
  import CobeGlobe from './CobeGlobe.vue'

  export default {
    name: 'GlobeDialog',
    components: {
      CobeGlobe,
    },
    props: {
      modelValue: {
        type: Boolean,
        default: false,
      },
      nodes: {
        type: Array,
        default: () => [],
      },
      isDark: {
        type: Boolean,
        default: false,
      },
      speedUnit: {
        type: String,
        default: 'byte',
      },
    },
    emits: ['update:model-value'],
    setup () {
      const { t, locale } = useI18n()
      return { t, locale }
    },
    data () {
      return {
        selectedCluster: null,
      }
    },
    computed: {
      totalCount () {
        return this.nodes.length
      },
      onlineCount () {
        return this.nodes.filter(n => n.uptime > 0).length
      },
      clusterList () {
        const clusterMap = new Map()

        for (const node of this.nodes) {
          const rawLoc = (node.location || 'un').trim().toLowerCase()
          if (rawLoc === 'un' || !rawLoc) continue

          const code = rawLoc.toUpperCase()
          const coord = getCoordinatesByCountryCode(code)
          if (!coord) continue

          const id = `cluster-${rawLoc}`
          if (!clusterMap.has(id)) {
            clusterMap.set(id, {
              id,
              code,
              coord,
              servers: 0,
              onlineServers: 0,
              offlineServers: 0,
              nodes: [],
            })
          }

          const cluster = clusterMap.get(id)
          cluster.servers += 1
          if (node.uptime > 0) {
            cluster.onlineServers += 1
          } else {
            cluster.offlineServers += 1
          }
          cluster.nodes.push(node)
        }

        return Array.from(clusterMap.values()).toSorted((a, b) => b.servers - a.servers)
      },
      uniqueRegionCount () {
        return this.clusterList.length
      },
    },
    watch: {
      modelValue (val) {
        if (!val) {
          this.selectedCluster = null
        }
      },
    },
    methods: {
      formatSpeed,
      formatSeconds,
      closeDialog () {
        this.$emit('update:model-value', false)
      },
      getFlagCode,
      getRegionName (code) {
        return getRegionDisplayName(code, this.locale || this.$i18n?.locale || 'zhHans')
      },
      onSelectCluster (cluster) {
        this.selectedCluster = cluster
      },
      focusCluster (cluster) {
        this.selectedCluster = cluster
        if (this.$refs.cobeGlobeRef) {
          this.$refs.cobeGlobeRef.selectCluster(cluster)
        }
      },
    },
  }
</script>

<style scoped>
.globe-dialog-card {
  backdrop-filter: blur(16px);
}

.globe-stage {
  min-height: 360px;
}

.region-chips-wrapper {
  max-height: 140px;
  overflow-y: auto;
}
</style>
