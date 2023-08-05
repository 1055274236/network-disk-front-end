<script lang="ts" setup>
import { reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const data = reactive({
  route: [
    {
      title: '文件列表',
      path: '/filedetails',
      num: 0
    },
    {
      title: '传输列表',
      path: '/transfer',
      num: 0
    }
  ],
  downloadLength: 0,
  uploadLength: 0
})
onMounted(() => {
  window.electron.ipcRenderer.on('download:downloadQueue', (_event, arr: Array<unknown>): void => {
    data.downloadLength = arr.length
  })
  window.electron.ipcRenderer.on('upload:uploadQueue', (_event, arr: Array<unknown>): void => {
    data.uploadLength = arr.length
  })
})

watch(
  () => [data.downloadLength, data.uploadLength],
  (newValue) => {
    data.route[1].num = newValue[0] + newValue[1]
  }
)

const itemClick = ({ title, path }: { title: string; path: string }): void => {
  console.log(title)

  router.push(path)
}
</script>

<template>
  <div id="main-menu">
    <div class="logo"><img src="@renderer/assets/img/logo.png" alt="M" /></div>
    <div class="main-list-back">
      <div
        v-for="(item, index) in data.route"
        :key="index"
        class="menu-item"
        @click="itemClick(item)"
      >
        {{ item.title }}
        <div v-show="item.num !== 0" class="menu-item-num">{{ item.num }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#main-menu {
  width: 100%;
  user-select: none;

  .logo {
    width: 100%;
    height: 80px;

    text-align: center;
    position: relative;
    // vertical-align: center;
    img {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }
  .main-list-back {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    // justify-content: center;
    align-items: center;

    .menu-item {
      height: 60px;
      width: 90%;
      line-height: 60px;
      border-radius: 5px;
      text-align: center;
      cursor: pointer;
      position: relative;

      &.isactive,
      &:hover {
        background-color: #f6f6f7;
      }

      .menu-item-num {
        position: absolute;
        top: -5px;
        right: -5px;
        width: 20px;
        line-height: 20px;
        height: 20px;
        color: white;
        background-color: red;
        border-radius: 20px;
        font-size: 12px;
      }
    }
  }
}
</style>
