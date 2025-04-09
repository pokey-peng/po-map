<script setup lang="ts">
const mapbox = shallowRef<mapboxgl.Map | null>(null)
const coords = ref({ lng: 0, lat: 0 })
const useMapMove = () => {
  mapbox.value?.on('mousemove', (e: mapboxgl.MapMouseEvent) => {
    // 获取鼠标移动时的经纬度
    coords.value.lng = Number(e.lngLat.lng).toFixed(6)
    coords.value.lat = Number(e.lngLat.lat).toFixed(6)
  })
}
const handleMapLoad = (map: mapboxgl.Map) => {
  mapbox.value = map
  useMapMove()
}
</script>

<template>
  <div class="mapbox-demo wh-full">
    <map-container @onMapLoad="handleMapLoad" />
    <div class="absolute left-[5%] top-[5%] w-[15%] color-dark-1 bg-white text-center">
      <span>{{ `${coords.lng}, ${coords.lat}` }}</span>
    </div>
  </div>
</template>
