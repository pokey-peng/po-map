export const gisMapRoutes = [
  {
    path: '/hello-ArcGIS',
    name: 'HelloArcGIS',
    label: "ArcGIS初见",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/arcgis/HelloArcGIS.vue'),
  },
  {
    path: '/hello-cesium',
    name: 'HelloCesium',
    label: "Cesium初见",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/cesium/HelloCesium.vue'),
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('@/views/mapbox/mapbox-demo.vue'),
  },
  {
    path: '/hello-openlayers',
    name: 'HelloOpenLayers',
    label: "OpenLayers初见",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/ol/HelloOpenLayers.vue'),
  },
]
