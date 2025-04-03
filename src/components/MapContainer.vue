<script setup lang="ts">
import mapboxgl from 'mapbox-gl'
// mapboxgl.accessToken =
//   'pk.eyJ1IjoicG9rZXljbiIsImEiOiJja3cxZmUybjQxeGk3Mm5waDdsNWV5N3M4In0.gojToYsF2FTweJDayCScNQ'
const yourToken = '417f7cdea0782e3941b99a29a76f99a8'
onMounted(() => {
  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: {
      version: 8,
      sources: {
        'tianditu-vec': {
          // 矢量底图
          type: 'raster',
          tiles: [
            `https://t0.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=${yourToken}`,
          ],
          tileSize: 256,
          zoomOffset: 0,
        },
        'tianditu-cva': {
          // 矢量注记
          type: 'raster',
          tiles: [
            `https://t0.tianditu.gov.cn/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=${yourToken}`,
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'vec-layer',
          type: 'raster',
          source: 'tianditu-vec',
          minzoom: 3,
          maxzoom: 18,
        },
        {
          id: 'cva-layer',
          type: 'raster',
          source: 'tianditu-cva',
          minzoom: 3,
          maxzoom: 18,
        },
      ],
    }, // style URL
    projection: 'globe',
    center: [0, 0], // starting position [lng, lat]
    zoom: 3, // starting zoom
  })
  // 添加矢量瓦片源
  map.on('load', () => {
    map.addSource('custom-layer', {
      type: 'vector',
      scheme: 'tms',
      tiles: [
        //`http://localhost:8077/geoserver/topp/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=topp:states&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/vnd.mapbox-vector-tile&TILECOL={x}&TILEROW={y}`,
        `http://localhost:8077/geoserver/gwc/service/tms/1.0.0/topp%3Astates@EPSG%3A3857@pbf/{z}/{x}/{y}.pbf`,
      ],
      minzoom: 0,
      maxzoom: 14,
    })

    // 配置图层样式
    map.addLayer({
      id: 'USA Population',
      type: 'fill',
      source: 'custom-layer',
      'source-layer': 'states', // Updated to match GeoServer source layer
      paint: {
        'fill-color': '#0080ff',
        'fill-opacity': 0.5,
      },
    })
  })

  console.log('🚀 ~ :11 ~ map:', map)
})
</script>

<template>
  <div class="map-container w-[100%] h-[100%]" id="map"></div>
</template>

<style lang="scss" scoped>
.map-container {
  font-size: 0.15rem;
}
</style>
