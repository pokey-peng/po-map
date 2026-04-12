<script setup lang="ts">
type BasemapType = 'vector' | 'imagery'

const props = defineProps<{
  modelValue: BasemapType
}>()

const emit = defineEmits<{
  'update:modelValue': [value: BasemapType]
  change: [value: BasemapType]
}>()

const options: Array<{ label: string; value: BasemapType }> = [
  { label: '矢量', value: 'vector' },
  { label: '影像', value: 'imagery' },
]

const selectBasemap = (value: BasemapType) => {
  if (value === props.modelValue) {
    return
  }

  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<template>
  <div class="basemap-switcher" role="group" aria-label="切换底图">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="switch-button"
      :class="{ active: option.value === modelValue }"
      @click="selectBasemap(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.basemap-switcher {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: inline-flex;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.82);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
}

.switch-button {
  border: 0;
  padding: 10px 16px;
  color: rgba(255, 255, 255, 0.78);
  background: transparent;
  font-size: 14px;
  line-height: 1;
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
</style>
