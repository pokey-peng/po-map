<script setup lang="ts">
const props = defineProps({
  attrs: {
    type: Object,
    required: true,
  },
})
onMounted(() => {
  console.log('Popup attrs:', props.attrs)
})
onBeforeUnmount(() => {
  console.log('Popup unmounted')
})
</script>

<template>
  <div class="popup">
    <!-- <h3>{{ attrs.capital }}</h3>
    <p>所属省级行政区：{{ attrs.province }}</p> -->
  </div>
</template>

<style lang="scss" scoped>
.popup {
  min-height: 100px;
  min-width: 200px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
</style>
