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
              <span v-if="node.uptime > 0" class="text-caption text-grey">{{ $t('table.title.cpu') }}: {{ node.cpu }}%</span>
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

<script setup>
  import createGlobe from 'cobe'
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { getFlagCode } from '@/utils/format'
  import { getCoordinatesByCountryCode, getRegionDisplayName } from '@/utils/geo'

  const props = defineProps({
    nodes: {
      type: Array,
      default: () => [],
    },
    isDark: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['select-cluster'])

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

  const { locale } = useI18n()

  const containerRef = ref(null)
  const canvasRef = ref(null)

  const autoRotate = ref(true)
  const phi = ref(normalizePhi(-Math.PI / 2 - CHINA_COORD[1] * Math.PI / 180))
  const targetPhi = ref(normalizePhi(-Math.PI / 2 - CHINA_COORD[1] * Math.PI / 180))
  const theta = ref(INITIAL_THETA)
  const targetTheta = ref(INITIAL_THETA)
  const isPointerDown = ref(false)
  let lastPointerX = 0
  let lastPointerY = 0
  const containerWidth = ref(360)
  const containerHeight = ref(360)
  const selectedCluster = ref(null)
  const labelElements = new Map()
  let rafId = null
  let globe = null
  let resizeObserver = null

  const regionClusters = computed(() => {
    const clusterMap = new Map()

    for (const node of props.nodes) {
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
  })

  const globeMarkers = computed(() => {
    return regionClusters.value.map(cluster => ({
      location: cluster.coord,
      size: 0.04 + Math.min(cluster.servers * 0.015, 0.08),
    }))
  })

  const themeColors = computed(() => {
    if (props.isDark) {
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
  })

  function getRegionName (code) {
    return getRegionDisplayName(code, locale.value || 'zhHans')
  }

  function toggleAutoRotate () {
    autoRotate.value = !autoRotate.value
  }

  function resetView () {
    targetPhi.value = normalizePhi(-Math.PI / 2 - CHINA_COORD[1] * Math.PI / 180)
    targetTheta.value = INITIAL_THETA
    selectedCluster.value = null
  }

  function focusOnRegion (coord) {
    if (!coord || coord.length < 2) return
    const [lat, lng] = coord
    targetPhi.value = normalizePhi(-Math.PI / 2 - lng * Math.PI / 180)
    targetTheta.value = clampTheta(lat * Math.PI / 180 * 0.5)
  }

  function selectCluster (cluster) {
    selectedCluster.value = cluster
    focusOnRegion(cluster.coord)
    emit('select-cluster', cluster)
  }

  function setLabelRef (id, el) {
    if (el) {
      labelElements.set(id, el)
    } else {
      labelElements.delete(id)
    }
  }

  function getClusterStyle (coord) {
    const [lat, lng] = coord
    const lambda = lng * Math.PI / 180
    const beta = lat * Math.PI / 180
    const radius = Math.min(containerWidth.value || 360, containerHeight.value || 360) * 0.5
    const center = radius
    const rotated = lambda + phi.value + Math.PI / 2
    const x = Math.cos(beta) * Math.sin(rotated)
    const y = Math.sin(beta) * Math.cos(theta.value) - Math.cos(beta) * Math.cos(rotated) * Math.sin(theta.value)
    const z = Math.sin(beta) * Math.sin(theta.value) + Math.cos(beta) * Math.cos(rotated) * Math.cos(theta.value)
    const visible = z > -0.06
    const nextX = (center + x * radius * 0.85).toFixed(1)
    const nextY = (center - y * radius * 0.85).toFixed(1)

    return {
      transform: `translate3d(${nextX}px, ${nextY}px, 0) translate(-50%, -50%)`,
      opacity: visible ? '1' : '0',
      pointerEvents: visible ? 'auto' : 'none',
      filter: visible ? 'blur(0)' : 'blur(8px)',
    }
  }

  function applyLabelStyles () {
    for (const cluster of regionClusters.value) {
      const el = labelElements.get(cluster.id)
      if (!el) continue
      const style = getClusterStyle(cluster.coord)
      el.style.transform = style.transform
      el.style.opacity = style.opacity
      el.style.pointerEvents = style.pointerEvents
      el.style.filter = style.filter
    }
  }

  function getRenderDimensions () {
    const width = containerWidth.value || containerRef.value?.clientWidth || 360
    const height = containerHeight.value || containerRef.value?.clientHeight || width
    return { width, height }
  }

  function startRenderLoop () {
    const render = () => {
      if (!globe) return

      if (!isPointerDown.value && autoRotate.value) {
        targetPhi.value += 0.0012
      }

      phi.value += (targetPhi.value - phi.value) * 0.12
      theta.value += (targetTheta.value - theta.value) * 0.12

      const { width, height } = getRenderDimensions()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      globe.update({
        phi: phi.value,
        theta: theta.value,
        width: width * dpr,
        height: height * dpr,
      })

      applyLabelStyles()
      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)
  }

  function startGlobe () {
    const canvas = canvasRef.value
    if (!canvas) return

    const { width, height } = getRenderDimensions()
    const colors = themeColors.value
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: width * dpr,
        height: height * dpr,
        phi: phi.value,
        theta: theta.value,
        dark: colors.dark,
        diffuse: colors.diffuse,
        mapSamples: 16_000,
        mapBrightness: colors.mapBrightness,
        baseColor: colors.baseColor,
        markerColor: colors.markerColor,
        glowColor: colors.glowColor,
        markers: globeMarkers.value,
        markerElevation: 0,
      })

      startRenderLoop()
    } catch (error) {
      console.error('Failed to initialize Cobe Globe:', error)
    }
  }

  function stopGlobe () {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (globe) {
      globe.destroy()
      globe = null
    }
  }

  async function rebuildGlobe () {
    stopGlobe()
    await nextTick()
    startGlobe()
  }

  function initResizeObserver () {
    if (!containerRef.value || typeof ResizeObserver === 'undefined') return
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          containerWidth.value = width
          containerHeight.value = height
          if (globe) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2)
            globe.update({
              width: width * dpr,
              height: height * dpr,
            })
            applyLabelStyles()
          }
        }
      }
    })
    resizeObserver.observe(containerRef.value)
  }

  function onPointerDown (e) {
    isPointerDown.value = true
    lastPointerX = e.clientX
    lastPointerY = e.clientY
    const target = e.currentTarget
    if (target && target.setPointerCapture) {
      target.setPointerCapture(e.pointerId)
    }
  }

  function onPointerMove (e) {
    if (!isPointerDown.value) return
    const deltaX = e.clientX - lastPointerX
    const deltaY = e.clientY - lastPointerY
    lastPointerX = e.clientX
    lastPointerY = e.clientY

    targetPhi.value += deltaX / 200
    targetTheta.value = clampTheta(targetTheta.value + deltaY / 300)
  }

  function onPointerUp (e) {
    isPointerDown.value = false
    const target = e.currentTarget
    if (target && target.releasePointerCapture && target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId)
    }
  }

  watch(() => props.isDark, () => {
    rebuildGlobe()
  })

  watch(regionClusters, () => {
    if (globe) {
      globe.update({ markers: globeMarkers.value })
      applyLabelStyles()
    }
  })

  onMounted(() => {
    initResizeObserver()
    nextTick(() => {
      startGlobe()
    })
  })

  onBeforeUnmount(() => {
    stopGlobe()
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })

  defineExpose({
    selectCluster,
    resetView,
    focusOnRegion,
  })
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
