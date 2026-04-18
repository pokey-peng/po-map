<script setup lang="ts">
import 'ol/ol.css'
import Map from 'ol/Map'
import TileLayer from 'ol/layer/Tile'
import View from 'ol/View'
import { fromLonLat } from 'ol/proj'
import XYZ from 'ol/source/XYZ'

type BasemapType = 'vector' | 'imagery'

const tdtToken = import.meta.env.VITE_TDT_TOKEN

const mapRef = shallowRef<Map | null>(null)
const baseLayerRef = shallowRef<TileLayer<XYZ> | null>(null)
const labelLayerRef = shallowRef<TileLayer<XYZ> | null>(null)
const currentBasemap = ref<BasemapType>('vector')

const createTdtSource = (layerType: 'vec' | 'cva' | 'img' | 'cia') =>
  new XYZ({
    url: `https://t0.tianditu.gov.cn/DataServer?T=${layerType}_w&x={x}&y={y}&l={z}&tk=${tdtToken}`,
    crossOrigin: 'anonymous',
  })

const createLayerPair = (type: BasemapType) => {
  if (type === 'vector') {
    return [
      new TileLayer({ source: createTdtSource('vec') }),
      new TileLayer({ source: createTdtSource('cva') }),
    ] as const
  }

  return [
    new TileLayer({ source: createTdtSource('img') }),
    new TileLayer({ source: createTdtSource('cia') }),
  ] as const
}

const updateBasemap = (type: BasemapType) => {
  currentBasemap.value = type

  const map = mapRef.value

  if (!map) {
    return
  }

  const [baseLayer, labelLayer] = createLayerPair(type)
  baseLayerRef.value = baseLayer
  labelLayerRef.value = labelLayer
  map.getLayers().clear()
  map.addLayer(baseLayer)
  map.addLayer(labelLayer)
}

onMounted(() => {
  const [baseLayer, labelLayer] = createLayerPair(currentBasemap.value)
  baseLayerRef.value = baseLayer
  labelLayerRef.value = labelLayer

  mapRef.value = new Map({
    target: 'map',
    layers: [baseLayer, labelLayer],
    view: new View({
      center: fromLonLat([104.1954, 35.8617]),
      zoom: 4,
    }),
  })
})

onBeforeUnmount(() => {
  mapRef.value?.setTarget(undefined)
  mapRef.value = null
  baseLayerRef.value = null
  labelLayerRef.value = null
})
</script>

<template>
  <div class="HelloOpenLayers">
    <div class="basemap-switcher">
      <button :class="{ active: currentBasemap === 'vector' }" @click="updateBasemap('vector')">
        矢量
      </button>
      <button :class="{ active: currentBasemap === 'imagery' }" @click="updateBasemap('imagery')">
        影像
      </button>
    </div>
    <div id="map" class="map-container"></div>
  </div>
</template>

<style lang="scss" scoped>
.HelloOpenLayers {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
}

.basemap-switcher {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: inline-flex;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.8);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18);

  button {
    border: 0;
    padding: 10px 16px;
    color: rgba(255, 255, 255, 0.78);
    background: transparent;
    cursor: pointer;
    transition: color 0.2s ease, background-color 0.2s ease;

    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }

    &.active {
      color: #0f172a;
      background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%);
    }
  }
}
</style>
