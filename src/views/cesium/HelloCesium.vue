<script setup lang="ts">
import * as Cesium from 'cesium'

function initGlobalCesium() {
  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN
  Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
    -180.0,
    -90.0,
    180.0,
    90.0
  )
  Cesium.Camera.DEFAULT_VIEW_FACTOR = Cesium.Math.toRadians(60)
}
onMounted(() => {
  initGlobalCesium()
})
</script>

<template>
  <div class="HelloCesium">

</div>
</template>

<style lang="scss" scoped></style>
