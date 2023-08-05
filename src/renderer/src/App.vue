<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted } from 'vue'

onMounted(() => {
  initListener()
})

const initListener = (): void => {
  window.electron.ipcRenderer.on('message:error', (_event, str: string): void => {
    ElMessage.error(str)
  })
}
</script>

<template>
  <div>
    <router-view v-slot="{ Component, route }">
      <!-- 使用任何自定义过渡和回退到 `fade` -->
      <transition :name="route.meta.transition as string || 'fade'">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style lang="scss">
@import './assets/css/styles.scss';
@import './assets//css/theme.scss';
</style>
