<script setup lang="ts">
import EsriMap from '@arcgis/core/Map'
import Basemap from '@arcgis/core/Basemap'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import WebTileLayer from '@arcgis/core/layers/WebTileLayer'
import Graphic from '@arcgis/core/Graphic'
import Point from '@arcgis/core/geometry/Point'
import SceneView from '@arcgis/core/views/SceneView'
import '@arcgis/core/assets/esri/themes/light/main.css'
import LabelIcon from '@/assets/map/label_bg.png'
import Popup from './popup.vue'
type BasemapType = 'vector' | 'imagery'

type CapitalFeatureCollection = {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: {
      province: string
      capital: string
    }
    geometry: {
      type: 'Point'
      coordinates: [number, number]
    }
  }>
}

const tdtToken = import.meta.env.VITE_TDT_TOKEN

const mapContainerRef = ref<HTMLDivElement | null>(null)
const viewRef = shallowRef<SceneView | null>(null)
const currentBasemap = ref<BasemapType>('vector')

const createTdtLayer = (layerType: 'vec' | 'cva' | 'img' | 'cia') =>
  new WebTileLayer({
    urlTemplate: `https://t0.tianditu.gov.cn/DataServer?T=${layerType}_w&x={col}&y={row}&l={level}&tk=${tdtToken}`,
    subDomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
  })

const basemapOptions: Record<BasemapType, Basemap> = {
  vector: new Basemap({
    baseLayers: [createTdtLayer('vec')],
    referenceLayers: [createTdtLayer('cva')],
    title: '天地图全球矢量',
    id: 'tdt-vector',
  }),
  imagery: new Basemap({
    baseLayers: [createTdtLayer('img')],
    referenceLayers: [createTdtLayer('cia')],
    title: '天地图全球影像',
    id: 'tdt-imagery',
  }),
}

const switchBasemap = (type: BasemapType) => {
  currentBasemap.value = type

  const view = viewRef.value

  if (view?.map) {
    view.map.basemap = basemapOptions[type]
  }
}
const popupMap = new Map<number, any>() // 存储 Graphic ID 与 Vue Popup 实例的映射关系
function cleanVuePopups(id: number | number[] | null) {
  if (id === null) {
    popupMap.forEach((popupApp) => {
      popupApp.unmount()
    })
    popupMap.clear()
  } else {
    const ids = Array.isArray(id) ? id : [id]
    ids.forEach((featureId) => {
      const popupApp = popupMap.get(featureId)
      if (popupApp) {
        popupApp.unmount()
        popupMap.delete(featureId)
      }
    })
  }
}
function createVuePopupTemplate() {
  return {
    title: '{capital}',
    content: (feature: any) => {
      const container = document.createElement('div')
      console.log('Creating popup for feature:', feature)
      const popupApp = createApp(Popup, {
        attrs: feature.graphic.attributes,
      })
      popupMap.set(feature.graphic.attributes.ObjectID, popupApp) // 使用 ObjectID 作为键
      popupApp.mount(container)
      return container
    },
  }
}
const createCapitalLayer = async () => {
  const response = await fetch('/data/china-provincial-capitals.geojson')

  if (!response.ok) {
    throw new Error(`首府点位数据加载失败: ${response.status}`)
  }

  const geojson = (await response.json()) as CapitalFeatureCollection
  const source = geojson.features.map(
    (feature, index) =>
      new Graphic({
        geometry: new Point({
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
        }),
        attributes: {
          ObjectID: index + 1,
          province: feature.properties.province,
          capital: feature.properties.capital,
        },
      }),
  )

  return new FeatureLayer({
    title: '中国各省级行政区首府',
    source,
    objectIdField: 'ObjectID',
    geometryType: 'point',
    spatialReference: { wkid: 4326 },
    fields: [
      { name: 'ObjectID', alias: 'ObjectID', type: 'oid' },
      { name: 'province', alias: '省级行政区', type: 'string' },
      { name: 'capital', alias: '首府', type: 'string' },
    ],
    popupTemplate: createVuePopupTemplate(),
    elevationInfo: {
      mode: 'on-the-ground',
    },
    renderer: {
      type: 'simple',
      symbol: {
        type: 'cim',
        data: {
          type: 'CIMSymbolReference',
          // primitiveOverrides: [
          //   {
          //     type: 'CIMPrimitiveOverride',
          //     primitiveName: 'textGraphic',
          //     propertyName: 'TextString',
          //     valueExpressionInfo: {
          //       type: 'CIMExpressionInfo',
          //       title: 'Custom',
          //       expression: '$feature.capital', // 映射到首府名称属性
          //       returnType: 'Default',
          //     },
          //   },
          // ],
          symbol: {
            type: 'CIMPointSymbol',
            symbolLayers: [
              {
                type: 'CIMVectorMarker',
                enable: true,
                size: 10,
                colorLocked: true,
                anchorPointUnits: 'Relative',
                frame: { xmin: -5, ymin: -5, xmax: 5, ymax: 5 },
                markerGraphics: [
                  {
                    type: 'CIMMarkerGraphic',
                    primitiveName: 'textGraphic',
                    geometry: { x: 0, y: 0 },
                    symbol: {
                      type: 'CIMTextSymbol',
                      fontFamilyName: 'Arial',
                      fontStyleName: 'Bold',
                      height: 10,
                      horizontalAlignment: 'Left',
                      offsetX: 30,
                      offsetY: 28,
                      symbol: {
                        type: 'CIMPolygonSymbol',
                        symbolLayers: [
                          {
                            type: 'CIMSolidFill',
                            enable: true,
                            color: [255, 255, 255, 255],
                          },
                        ],
                      },
                      verticalAlignment: 'Top',
                    },
                    textString: '',
                  },
                ],
                scaleSymbolsProportionally: true,
                respectFrame: true,
              },
              {
                // 背景图片层（渲染顺序：数组靠前 = 底层）
                type: 'CIMPictureMarker',
                url: LabelIcon, // 支持 URL 或 Base64 Data URI
                size: 34, // 等效于设置 width 和 height，保持图片原始宽高比
                enable: true,
                anchorPoint: { x: -0.5, y: -0.5 }, // 相对锚点 (0~1)，(0.5,0.5) 表示中心
                anchorPointUnits: 'Relative',
              },
            ],
          },
        },
      },
    },
  })
}
onMounted(async () => {
  const map = new EsriMap({
    basemap: basemapOptions.vector,
    ground: 'world-elevation',
  })

  viewRef.value = new SceneView({
    container: mapContainerRef.value ?? 'map-container',
    map,
    camera: {
      position: {
        longitude: 121.4737,
        latitude: 31.2304,
        z: 5000000,
      },
      tilt: 0,
    },
  })
  viewRef.value.on('click', () => {
    cleanVuePopups(null) // 点击地图其他位置时关闭所有弹窗
  })
  try {
    const capitalLayer = await createCapitalLayer()
    map.add(capitalLayer)
  } catch (error) {
    console.error(error)
  }
})

onBeforeUnmount(() => {
  viewRef.value?.destroy()
  viewRef.value = null
})
</script>

<template>
  <div class="HelloArcGIS">
    <div ref="mapContainerRef" class="map-container"></div>
    <ArcGisBasemapSwitcher v-model="currentBasemap" @change="switchBasemap" />
  </div>
</template>

<style lang="scss" scoped>
.HelloArcGIS {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
}
</style>
