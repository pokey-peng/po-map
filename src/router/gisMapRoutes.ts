export const gisMapRoutes = [
  {
    path: '/hello-ArcGIS',
    name: 'HelloArcGIS',
    label: "ArcGIS初见",
    icon: "i-mdi-cube-outline",
    component: () => import('@/views/arcgis/HelloArcGIS.vue'),
  }
]
