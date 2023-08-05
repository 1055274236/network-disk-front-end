<script setup lang="ts">
import MainMune from '@renderer/components/menu/index.vue'
import { onMounted } from 'vue'

onMounted(() => {})
</script>

<template>
  <div class="main-layout">
    <el-container style="height: 100vh; width: 100vw; overflow: hidden">
      <el-aside width="200px" class="aside-menu"><MainMune /></el-aside>
      <el-main class="main-content">
        <router-view v-slot="{ Component, route }">
          <!-- 使用任何自定义过渡和回退到 `fade` -->
          <transition :name="route.meta.transition as string || 'fade'" mode="out-in" appear>
            <keep-alive include="FileDetails">
              <component :is="Component" :key="route.fullPath" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </div>
</template>

<style lang="scss" scoped>
.aside-menu {
  border-right: 1px solid gray;
  height: 100vh;
  overflow: auto;
}
.main-content {
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
