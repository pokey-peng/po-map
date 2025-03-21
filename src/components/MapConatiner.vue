<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
// mapboxgl.accessToken =
//   'pk.eyJ1IjoicG9rZXljbiIsImEiOiJja3cxZmUybjQxeGk3Mm5waDdsNWV5N3M4In0.gojToYsF2FTweJDayCScNQ'
onMounted(() => {
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: {
      version: 8,
      sources: {},
      layers: [],
    }, // style URL
    center: [-74.5, 40], // starting position [lng, lat]
    zoom: 9, // starting zoom
  })
  // 添加矢量瓦片源
  map.on('load', () => {
    map.addSource('custom-layer', {
      type: 'vector',
      scheme: 'tms', // 关键参数
      tiles: [
        `http://localhost:8077/geoserver/topp/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=topp:states&STYLE=&TILEMATRIX=EPSG:4326:4&TILEMATRIXSET=EPSG:4326&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}`,
      ],
    })

    // 配置图层样式
    map.addLayer({
      id: 'buildings',
      type: 'fill',
      source: 'custom-layer',
      'source-layer': 'topp:states', // Updated to match GeoServer source layer
      paint: {
        'fill-color': '#0080ff',
        'fill-opacity': 0.6,
      },
    })
  })

  console.log('🚀 ~ :11 ~ map:', map)
})
</script>

<template>
  <div class="map-container w-[500] h-[500]" id="map"></div>
</template>

<style lang="scss" scoped>
.map-container {
  font-size: 0.15rem;
}
</style>
