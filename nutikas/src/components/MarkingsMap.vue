<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MarkingListItem } from '@/types/contest'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

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

  const sortedMarkings = [...validMarkings].sort((a, b) =>
    new Date(a.dt).getTime() - new Date(b.dt).getTime()
  )

  const center: L.LatLngExpression = [
    parseFloat(sortedMarkings[0].lat!),
    parseFloat(sortedMarkings[0].lon!)
  ]

  mapInstance = L.map(mapContainer.value).setView(center, 14)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapInstance)

  const trackPoints: L.LatLngExpression[] = sortedMarkings.map(m => [
    parseFloat(m.lat!),
    parseFloat(m.lon!)
  ])

  L.polyline(trackPoints, {
    color: '#2563eb',
    weight: 3,
    opacity: 0.7,
    dashArray: '5, 10'
  }).addTo(mapInstance)

  sortedMarkings.forEach((marking, index) => {
    const lat = parseFloat(marking.lat!)
    const lon = parseFloat(marking.lon!)
    const label = marking.checkPointCPCode || marking.checkPointCPID || `CP${index + 1}`

    L.marker([lat, lon], { icon: defaultIcon })
      .bindTooltip(label, {
        permanent: true,
        direction: 'top',
        offset: [12, -20],
        className: 'cp-label'
      })
      .bindPopup(`${label}<br>${formatTime(marking.dt)}`)
      .addTo(mapInstance!)
  })

  if (sortedMarkings.length > 1) {
    const group = L.featureGroup(sortedMarkings.map(m => L.marker([parseFloat(m.lat!), parseFloat(m.lon!)])))
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

.markings-map :deep(.cp-label) {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: monospace;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.markings-map :deep(.cp-label::before) {
  border-top-color: #2563eb;
}
</style>