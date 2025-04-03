<script setup lang="ts">
const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <header class="dark:bg-black dark:text-white max-h-[20vh] p-2">
    <div class="header-wrapper flex justify-center items-center h-20">
      <img alt="Vue logo" class="logo w-[100%] h-[100%]" src="@/assets/logo.svg" />
      <div class="right-btn flex justify-center items-center pr-4">
        <Button
          icon="i-mdi-white-balance-sunny dark:i-mdi-weather-night"
          class="border-2 border-[#3f3f46] dark:border-[#3f3f46] rounded-[6px] p-2 bg-transparent"
          @click="toggleDark()"
        />
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
header {
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
</style>
