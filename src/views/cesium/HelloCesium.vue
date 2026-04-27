<script setup lang="ts">
import * as Cesium from 'cesium'
import AiChartPanel from '@/components/ai/AiChartPanel.vue'

let viewer: Cesium.Viewer | null = null

function initGlobalCesium() {
  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN
  const tdtToken = import.meta.env.VITE_TDT_TOKEN

  const imageryProvider = new Cesium.UrlTemplateImageryProvider({
    url: `https://t0.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=${tdtToken}`,
    credit: 'Tianditu',
  })

  viewer = new Cesium.Viewer('HelloCesium', {
    animation: false,
    timeline: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
  })

  viewer.imageryLayers.removeAll()
  viewer.imageryLayers.addImageryProvider(imageryProvider)

  viewer.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url: `https://t0.tianditu.gov.cn/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=${tdtToken}`,
      credit: 'Tianditu',
    }),
  )

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(121.4737, 31.2304, 1800000.0),
  })

  viewer.entities.add({
    name: 'Blue box',
    position: Cesium.Cartesian3.fromDegrees(121.0, 31.0, 300000.0),
    box: {
      dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
      material: Cesium.Color.BLUE,
    },
  })

  viewer.entities.add({
    name: 'Red box with black outline',
    position: Cesium.Cartesian3.fromDegrees(122.2, 31.0, 300000.0),
    box: {
      dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
      material: Cesium.Color.RED.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.BLACK,
    },
  })

  viewer.entities.add({
    name: 'Yellow box outline',
    position: Cesium.Cartesian3.fromDegrees(123.4, 31.0, 300000.0),
    box: {
      dimensions: new Cesium.Cartesian3(400000.0, 300000.0, 500000.0),
      fill: false,
      outline: true,
      outlineColor: Cesium.Color.YELLOW,
    },
  })
}

onMounted(() => {
  initGlobalCesium()
})

onBeforeUnmount(() => {
  viewer?.destroy()
  viewer = null
})
</script>

<template>
  <div class="wh-full relative">
    <AiChartPanel class="pos-absolute right-1 bottom-1"/>
  <div id="HelloCesium" class="wh-full">
  </div>

  </div>
</template>
