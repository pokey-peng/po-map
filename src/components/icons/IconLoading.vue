<script setup lang="ts">
const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>
<template>
  <div class="IconLoading wh-full flex-center" v-if="props.loading">
    <i class="i-mdi-loading w-[10%] h-[10%] rotate-infinte"></i>
  </div>
</template>
