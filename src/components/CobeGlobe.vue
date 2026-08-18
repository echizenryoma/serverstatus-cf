<template>
  <div class="globe-wrapper d-flex flex-column align-center justify-center position-relative">
    <div ref="containerRef" class="globe-container position-relative">
      <canvas
        ref="canvasRef"
        class="earth-globe-canvas select-none touch-none"
        :class="{ 'is-dragging': isPointerDown }"
        @pointercancel="onPointerUp"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
      />

      <!-- 3D Overlaid Region Labels -->
      <div
        v-for="cluster in regionClusters"
        :key="cluster.id"
        :ref="el => setLabelRef(cluster.id, el)"
        class="globe-marker-label position-absolute"
        :class="{ 'is-active': selectedCluster?.id === cluster.id }"
        @click.stop="selectCluster(cluster)"
      >
        <v-tooltip location="top" :open-delay="100">
          <template #activator="{ props: tooltipProps }">
            <div
              v-bind="tooltipProps"
              class="marker-badge d-flex align-center cursor-pointer elevation-3"
              :class="{ 'has-offline': cluster.offlineServers > 0 }"
            >
              <span class="marker-flag" :class="'fi fi-' + getFlagCode(cluster.code)" />
              <span class="marker-count ml-1 font-weight-bold">{{ cluster.onlineServers }}/{{ cluster.servers }}</span>
            </div>
          </template>

          <div class="text-caption">
            <div class="font-weight-bold mb-1">{{ getRegionName(cluster.code) }} ({{ cluster.code }})</div>
            <div>{{ $t('overview.online') }}: {{ cluster.onlineServers }} / {{ cluster.servers }}</div>

            <div v-for="node in cluster.nodes.slice(0, 5)" :key="node.host" class="d-flex align-center justify-space-between ga-2 mt-1">
              <span :class="node.uptime > 0 ? 'text-success' : 'text-grey'">● {{ node.host }}</span>
              <span v-if="node.uptime > 0" class="text-caption text-grey">{{ $t('server.title.cpu') }}: {{ node.cpu }}%</span>
            </div>

            <div v-if="cluster.nodes.length > 5" class="text-grey text-caption mt-1">
              +{{ cluster.nodes.length - 5 }} more...
            </div>
          </div>
        </v-tooltip>
      </div>

      <!-- Globe Controls Floating Badge -->
      <div class="globe-floating-controls position-absolute d-flex align-center ga-1">
        <v-btn
          :color="autoRotate ? 'primary' : 'default'"
          density="compact"
          :icon="autoRotate ? 'mdi-pause' : 'mdi-play'"
          size="small"
          variant="tonal"
          @click="toggleAutoRotate"
        />

        <v-btn
          density="compact"
          icon="mdi-crosshairs-gps"
          size="small"
          variant="tonal"
          @click="resetView"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import createGlobe from 'cobe'
  import { useI18n } from 'vue-i18n'
  import { getCoordinatesByCountryCode, getRegionDisplayName } from '@/utils/geo'

  const INITIAL_THETA = 0.22
  const MIN_THETA = -0.65
  const MAX_THETA = 0.65
  const CHINA_COORD = [35.8617, 104.1954]

  function normalizePhi (value) {
    const circle = Math.PI * 2
    let next = value % circle
    if (next <= -Math.PI) next += circle
    if (next > Math.PI) next -= circle
    return next
  }

  function clampTheta (value) {
    return Math.min(Math.max(value, MIN_THETA), MAX_THETA)
  }

  export default {
    name: 'CobeGlobe',
    props: {
      nodes: {
        type: Array,
        default: () => [],
      },
      isDark: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['select-cluster'],
    setup () {
      const { t, locale } = useI18n()
      return { t, locale }
    },
    data () {
      return {
        autoRotate: true,
        phi: normalizePhi(-Math.PI / 2 - CHINA_COORD[1] * Math.PI / 180),
        targetPhi: normalizePhi(-Math.PI / 2 - CHINA_COORD[1] * Math.PI / 180),
        theta: INITIAL_THETA,
        targetTheta: INITIAL_THETA,
        isPointerDown: false,
        lastPointerX: 0,
        lastPointerY: 0,
        containerWidth: 360,
        containerHeight: 360,
        selectedCluster: null,
        labelElements: new Map(),
        rafId: null,
        globe: null,
        resizeObserver: null,
      }
    },
    computed: {
      regionClusters () {
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

        return Array.from(clusterMap.values()).sort((a, b) => b.servers - a.servers)
      },
      globeMarkers () {
        return this.regionClusters.map(cluster => ({
          location: cluster.coord,
          size: 0.04 + Math.min(cluster.servers * 0.015, 0.08),
        }))
      },
      themeColors () {
        if (this.isDark) {
          return {
            dark: 1,
            mapBrightness: 7.5,
            baseColor: [0.95, 0.95, 0.98],
            markerColor: [0.2, 0.8, 1],
            glowColor: [0.75, 0.88, 1],
            diffuse: 0.6,
          }
        }
        return {
          dark: 0,
          mapBrightness: 10,
          baseColor: [0.96, 0.97, 0.99],
          markerColor: [0.08, 0.4, 0.95],
          glowColor: [0.82, 0.91, 1],
          diffuse: 0.7,
        }
      },
    },
    watch: {
      isDark () {
        this.rebuildGlobe()
      },
      regionClusters () {
        if (this.globe) {
          this.globe.update({ markers: this.globeMarkers })
          this.applyLabelStyles()
        }
      },
    },
    mounted () {
      this.initResizeObserver()
      this.$nextTick(() => {
        this.startGlobe()
      })
    },
    beforeUnmount () {
      this.stopGlobe()
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
    },
    methods: {
      getFlagCode (code) {
        const lower = (code || '').toLowerCase()
        const currentLocale = this.locale || this.$i18n?.locale
        if (currentLocale === 'zhHans' && (lower === 'hk' || lower === 'tw' || lower === 'mo')) {
          return 'cn'
        }
        return lower
      },
      getRegionName (code) {
        return getRegionDisplayName(code, this.locale || this.$i18n?.locale || 'zhHans')
      },
      toggleAutoRotate () {
        this.autoRotate = !this.autoRotate
      },
      resetView () {
        this.targetPhi = normalizePhi(-Math.PI / 2 - CHINA_COORD[1] * Math.PI / 180)
        this.targetTheta = INITIAL_THETA
        this.selectedCluster = null
      },
      focusOnRegion (coord) {
        if (!coord || coord.length < 2) return
        const [lat, lng] = coord
        this.targetPhi = normalizePhi(-Math.PI / 2 - lng * Math.PI / 180)
        this.targetTheta = clampTheta(lat * Math.PI / 180 * 0.5)
      },
      selectCluster (cluster) {
        this.selectedCluster = cluster
        this.focusOnRegion(cluster.coord)
        this.$emit('select-cluster', cluster)
      },
      setLabelRef (id, el) {
        if (el) {
          this.labelElements.set(id, el)
        } else {
          this.labelElements.delete(id)
        }
      },
      getClusterStyle (coord) {
        const [lat, lng] = coord
        const lambda = lng * Math.PI / 180
        const beta = lat * Math.PI / 180
        const radius = Math.min(this.containerWidth || 360, this.containerHeight || 360) * 0.5
        const center = radius
        const rotated = lambda + this.phi + Math.PI / 2
        const x = Math.cos(beta) * Math.sin(rotated)
        const y = Math.sin(beta) * Math.cos(this.theta) - Math.cos(beta) * Math.cos(rotated) * Math.sin(this.theta)
        const z = Math.sin(beta) * Math.sin(this.theta) + Math.cos(beta) * Math.cos(rotated) * Math.cos(this.theta)
        const visible = z > -0.06
        const nextX = (center + x * radius * 0.85).toFixed(1)
        const nextY = (center - y * radius * 0.85).toFixed(1)

        return {
          transform: `translate3d(${nextX}px, ${nextY}px, 0) translate(-50%, -50%)`,
          opacity: visible ? '1' : '0',
          pointerEvents: visible ? 'auto' : 'none',
          filter: visible ? 'blur(0)' : 'blur(8px)',
        }
      },
      applyLabelStyles () {
        for (const cluster of this.regionClusters) {
          const el = this.labelElements.get(cluster.id)
          if (!el) continue
          const style = this.getClusterStyle(cluster.coord)
          el.style.transform = style.transform
          el.style.opacity = style.opacity
          el.style.pointerEvents = style.pointerEvents
          el.style.filter = style.filter
        }
      },
      getRenderDimensions () {
        const width = this.containerWidth || this.$refs.containerRef?.clientWidth || 360
        const height = this.containerHeight || this.$refs.containerRef?.clientHeight || width
        return { width, height }
      },
      startGlobe () {
        const canvas = this.$refs.canvasRef
        if (!canvas) return

        const { width, height } = this.getRenderDimensions()
        const colors = this.themeColors
        const dpr = Math.min(window.devicePixelRatio || 1, 2)

        try {
          this.globe = createGlobe(canvas, {
            devicePixelRatio: dpr,
            width: width * dpr,
            height: height * dpr,
            phi: this.phi,
            theta: this.theta,
            dark: colors.dark,
            diffuse: colors.diffuse,
            mapSamples: 16_000,
            mapBrightness: colors.mapBrightness,
            baseColor: colors.baseColor,
            markerColor: colors.markerColor,
            glowColor: colors.glowColor,
            markers: this.globeMarkers,
            markerElevation: 0,
          })

          this.startRenderLoop()
        } catch (error) {
          console.error('Failed to initialize Cobe Globe:', error)
        }
      },
      startRenderLoop () {
        const render = () => {
          if (!this.globe) return

          if (!this.isPointerDown && this.autoRotate) {
            this.targetPhi += 0.0012
          }

          this.phi += (this.targetPhi - this.phi) * 0.12
          this.theta += (this.targetTheta - this.theta) * 0.12

          const { width, height } = this.getRenderDimensions()
          const dpr = Math.min(window.devicePixelRatio || 1, 2)

          this.globe.update({
            phi: this.phi,
            theta: this.theta,
            width: width * dpr,
            height: height * dpr,
          })

          this.applyLabelStyles()
          this.rafId = requestAnimationFrame(render)
        }

        this.rafId = requestAnimationFrame(render)
      },
      stopGlobe () {
        if (this.rafId) {
          cancelAnimationFrame(this.rafId)
          this.rafId = null
        }
        if (this.globe) {
          this.globe.destroy()
          this.globe = null
        }
      },
      async rebuildGlobe () {
        this.stopGlobe()
        await this.$nextTick()
        this.startGlobe()
      },
      initResizeObserver () {
        if (!this.$refs.containerRef || typeof ResizeObserver === 'undefined') return
        this.resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect
            if (width > 0 && height > 0) {
              this.containerWidth = width
              this.containerHeight = height
              if (this.globe) {
                const dpr = Math.min(window.devicePixelRatio || 1, 2)
                this.globe.update({
                  width: width * dpr,
                  height: height * dpr,
                })
                this.applyLabelStyles()
              }
            }
          }
        })
        this.resizeObserver.observe(this.$refs.containerRef)
      },
      onPointerDown (e) {
        this.isPointerDown = true
        this.lastPointerX = e.clientX
        this.lastPointerY = e.clientY
        const target = e.currentTarget
        if (target && target.setPointerCapture) {
          target.setPointerCapture(e.pointerId)
        }
      },
      onPointerMove (e) {
        if (!this.isPointerDown) return
        const deltaX = e.clientX - this.lastPointerX
        const deltaY = e.clientY - this.lastPointerY
        this.lastPointerX = e.clientX
        this.lastPointerY = e.clientY

        this.targetPhi += deltaX / 200
        this.targetTheta = clampTheta(this.targetTheta + deltaY / 300)
      },
      onPointerUp (e) {
        this.isPointerDown = false
        const target = e.currentTarget
        if (target && target.releasePointerCapture && target.hasPointerCapture(e.pointerId)) {
          target.releasePointerCapture(e.pointerId)
        }
      },
    },
  }
</script>

<style scoped>
.globe-wrapper {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.globe-container {
  width: 100%;
  aspect-ratio: 1 / 1;
  max-width: 440px;
  max-height: 440px;
}

.earth-globe-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  contain: layout paint;
  cursor: grab;
  filter: blur(0.3px);
}

.earth-globe-canvas.is-dragging {
  cursor: grabbing;
}

.globe-marker-label {
  top: 0;
  left: 0;
  z-index: 5;
  transition: opacity 0.25s ease, filter 0.25s ease;
  will-change: transform, opacity;
}

.marker-badge {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
  color: #1e293b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
}

:deep(.v-theme--dark) .marker-badge,
.v-theme--dark .marker-badge {
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f8fafc;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
}

.marker-badge:hover,
.globe-marker-label.is-active .marker-badge {
  transform: scale(1.18);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  border-color: rgba(59, 130, 246, 0.8);
}

.marker-flag {
  font-size: 13px;
  line-height: 1;
  border-radius: 2px;
}

.marker-count {
  line-height: 1;
}

.marker-badge.has-offline {
  border-color: rgba(234, 179, 8, 0.6);
}

.globe-floating-controls {
  bottom: 8px;
  right: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(8px);
  padding: 4px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

:deep(.v-theme--dark) .globe-floating-controls,
.v-theme--dark .globe-floating-controls {
  background: rgba(30, 41, 59, 0.65);
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
