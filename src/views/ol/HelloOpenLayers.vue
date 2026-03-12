<script setup lang="ts">
import "ol/ol.css";
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import {BingMaps} from 'ol/source.js';

onMounted(() => {
  const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new BingMaps({
        key: 'AqZ2Y3V6r0mFz1x3j5vG~zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0hX8z5YkX5xU1bX8zW0h',
        imagerySet: 'Aerial',
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
})
</script>

<template>
  <div class="HelloOpenLayers" id="map">

 </div>
</template>

<style lang="scss" scoped>


// html,
// body {
//   margin: 0;
//   height: 100%;
// }

// #map {
//   position: absolute;
//   top: 0;
//   bottom: 0;
//   width: 100%;
// }
</style>
