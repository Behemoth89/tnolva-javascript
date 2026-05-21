<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MarkingListItem } from '@/types/contest'

const props = defineProps<{
  markings: MarkingListItem[]
  height?: string
}>()

const mapContainer = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null

function initMap() {
  if (!mapContainer.value || mapInstance) return

  const validMarkings = props.markings.filter(m => m.lat && m.lon)

  if (validMarkings.length === 0) return

  const center: L.LatLngExpression = [
    parseFloat(validMarkings[0].lat!),
    parseFloat(validMarkings[0].lon!)
  ]

  mapInstance = L.map(mapContainer.value).setView(center, 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapInstance)

  validMarkings.forEach((marking, index) => {
    const lat = parseFloat(marking.lat!)
    const lon = parseFloat(marking.lon!)
    const label = marking.checkPointCPCode || marking.checkPointCPID || `CP${index + 1}`

    L.marker([lat, lon])
      .bindPopup(`${label}<br>${formatTime(marking.dt)}`)
      .addTo(mapInstance!)
  })

  if (validMarkings.length > 1) {
    const group = L.featureGroup(validMarkings.map(m => L.marker([parseFloat(m.lat!), parseFloat(m.lon!)])))
    mapInstance.fitBounds(group.getBounds().pad(0.1))
  }
}

function formatTime(dt: string): string {
  try {
    return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return dt
  }
}

onMounted(() => {
  if (props.markings.length > 0) {
    setTimeout(initMap, 100)
  }
})

watch(() => props.markings, (newMarkings) => {
  if (newMarkings.length > 0 && !mapInstance) {
    setTimeout(initMap, 100)
  }
}, { deep: true })

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<template>
  <div class="markings-map-wrapper">
    <div
      v-if="markings.filter(m => m.lat && m.lon).length === 0"
      class="map-empty"
    >
      No map data available
    </div>
    <div
      v-else
      ref="mapContainer"
      class="markings-map"
      :style="{ height: height || '300px' }"
    ></div>
  </div>
</template>

<style scoped>
.markings-map-wrapper {
  margin-top: 1rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.markings-map {
  width: 100%;
}

.map-empty {
  padding: 2rem;
  text-align: center;
  color: #888;
  background: #f5f5f5;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.markings-map :deep(.leaflet-popup-content) {
  font-size: 0.875rem;
}
</style>