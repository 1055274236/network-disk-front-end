<script lang="ts" setup>
import { onMounted, reactive, ref, Ref } from 'vue'
import DownloadIng from './DownloadIng.vue'
const data = reactive({
  activeIndex: 0,
  switchPage: ['下载中', '上传中', '已完成']
})
const isActive = ref() as Ref<HTMLDivElement>

onMounted(() => {
  tabItemClick(0)
})

const tabItemClick = (index: number): void => {
  data.activeIndex = index
  const active = document.getElementsByClassName('tag-item')[index] as HTMLDivElement
  isActive.value.style.left = active.offsetLeft + 'px'
  isActive.value.style.width = active.offsetWidth + 'px'
  isActive.value.style.height = active.offsetHeight + 'px'
}
</script>

<template>
  <div id="downloaddetails">
    <div class="head">
      <div class="switch-tag">
        <div ref="isActive" class="isActive"></div>
        <div
          v-for="(item, index) in data.switchPage"
          :key="index"
          class="tag-item"
          @click="tabItemClick(index)"
        >
          {{ item }}
        </div>
      </div>
    </div>
    <div class="content">
      <transition name="fade" mode="out-in">
        <DownloadIng v-if="data.activeIndex === 0" />
      </transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#downloaddetails {
  .head {
    position: relative;
    height: 40px;
    .switch-tag {
      display: flex;
      background-color: #f6f6f4;
      position: absolute;
      top: 0;
      border-radius: 10px;
      overflow: hidden;
      .isActive {
        position: absolute;
        background-color: var(--el-color-primary);
        z-index: 0;
      }
      .tag-item {
        user-select: none;
        font-size: 0.8rem;
        padding: 5px 10px;
        cursor: pointer;
        z-index: 1;
      }
    }
  }
  .content {
    width: 100%;
    overflow-x: hidden;
  }
}
</style>
