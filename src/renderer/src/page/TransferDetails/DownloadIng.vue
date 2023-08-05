<script lang="ts" setup>
import { reactive, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { VideoPause, VideoPlay, Close, Folder } from '@element-plus/icons-vue'

interface DownloadFileBaseInfomation {
  name: string
  url: string
  savePath?: string
  size?: number
  total?: number
  speed?: number
  status?: 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'await' | 'pause'
  updateAt?: Date
}

interface DateType {
  list: Map<number, DownloadFileBaseInfomation>
  deleteArr: Array<number>
}

const data: DateType = reactive({
  list: new Map(),
  deleteArr: []
})
onMounted(() => {
  initListener()
  getList()
  t()
})

const initListener = (): void => {
  window.electron.ipcRenderer.on(
    'download:progress',
    (_event, id: number, size: number, total: number): void => {
      if (data.list.has(id)) {
        const temp = data.list.get(id)
        const date = new Date()
        let speed = 0
        if (temp?.size && temp.updateAt)
          speed = ((size - (temp?.size || 0)) / (date.getTime() - temp?.updateAt?.getTime())) * 1000
        data.list.set(id, {
          ...(data.list.get(id) as DownloadFileBaseInfomation),
          size,
          total,
          speed,
          updateAt: date
        })
      } else {
        getList()
      }
    }
  )

  window.electron.ipcRenderer.on('download:completed', (_event, id: number): void => {
    if (data.list.has(id)) {
      data.list.delete(id)
    }
  })
}

const getList = (): void => {
  // data.list = new Map()
  window.electron.ipcRenderer.invoke('download:get').then(
    (
      list: Array<{
        id: number
        name: string
        url: string
        savePath?: string
        size?: number
        total?: number
        status?: 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'await'
      }>
    ) => {
      list.forEach((item) => {
        const temp: DownloadFileBaseInfomation = {
          name: item.name,
          url: item.url,
          savePath: item.savePath,
          size: item.size,
          total: item.total,
          status: item.status
        }
        data.list.set(item.id, temp)
      })
    }
  )
}

const t = (): void => {
  const temp: DownloadFileBaseInfomation = {
    name: 'name',
    url: 'url',
    savePath: 'savePath',
    size: 5555,
    total: 99999,
    status: 'progressing'
  }
  for (let i = 0; i < 1; i++) {
    data.list.set(i, temp)
  }
}

const omitSize = (size: number): string => {
  let flag = 0
  let suffix = 'B'
  while (size >= 1024) {
    if (flag > 3) break
    size /= 1024
    flag++
  }
  switch (flag) {
    case 1:
      suffix = 'KB'
      break
    case 2:
      suffix = 'MB'
      break
    case 3:
      suffix = 'GB'
      break
    default:
      break
  }
  return size.toFixed(2) + suffix
}

const pause = (id: number): void => {
  window.electron.ipcRenderer.send('download:pauseone', id)
  getList()
}
const resume = (id: number): void => {
  window.electron.ipcRenderer.send('download:resumeone', id)
  getList()
}
const cancel = (id: number): void => {
  ElMessageBox.confirm('确定删除该下载任务?', 'Warning', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    data.deleteArr.push(id)
    window.electron.ipcRenderer.send('download:pauseone', id)
    setTimeout(() => {
      window.electron.ipcRenderer.send('download:cancelone', id)
      data.list.delete(id)
      data.deleteArr = data.deleteArr.filter((item) => item != id)
      getList()
    }, 500)
  })
}
const openFolder = (p: string): void => {
  window.electron.ipcRenderer.send('system:openfolder', p)
}
</script>

<template>
  <div class="list-back">
    <div class="list">
      <div
        v-for="[key, item] in data.list.entries()"
        :key="key"
        :class="['list-item-back', { delete: data.deleteArr.indexOf(key) !== -1 }]"
      >
        <div
          :class="['item-progress', item.status]"
          :style="`width: ${(((item.size || 1) / (item.total || 1)) * 100).toFixed(2) + '%'};`"
        ></div>
        <div class="list-item">
          <div class="item-left">
            <img src="@renderer/assets/img/file.png" />
          </div>
          <div class="item-mid">
            <div class="item-name">
              {{ item.name }}
            </div>
            <div class="item-store">
              <span class="size"
                >{{ omitSize(item.size || 0) }} / {{ omitSize(item.total || 0) }}&nbsp;&nbsp;</span
              >
              <span class="speed">{{ omitSize(item.speed || 0) + '/s' }}&nbsp;&nbsp;</span>
              <span class="parecentage">{{
                (((item.size || 1) / (item.total || 1)) * 100).toFixed(2) + '%'
              }}</span>
            </div>
          </div>
          <div class="item-right">
            <div class="opration">
              <div class="play">
                <!-- <el-tooltip
                      :content="item.status === 'progressing' ? '暂停' : '继续'"
                      placement="top-end"
                    > -->
                <VideoPause v-if="item.status != 'pause'" @click="pause(key)" />
                <VideoPlay v-else @click="resume(key)" />
                <!-- </el-tooltip> -->
              </div>
              <div class="cancel">
                <!-- <el-tooltip content="取消" placement="top-end"> -->
                <Close @click="cancel(key)" />
                <!-- </el-tooltip> -->
              </div>
              <div class="open">
                <!-- <el-tooltip content="打开目录" placement="top-end"> -->
                <Folder @click="openFolder(item.savePath || '')" />
                <!-- </el-tooltip> -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-back {
  user-select: none;
  .list {
    .list-item-back {
      height: 70px;
      width: 100%;
      background-color: #f4f4f4;
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      margin: 5px 0;

      &.delete {
        transform: translate(-100%);
      }
      .item-progress {
        height: 100%;
        background-color: var(--el-color-primary);

        &.pause {
          background-color: var(--el-color-primary);
        }
        &.progressing {
          background-color: var(--el-color-success);
        }
        &.interrupted {
          background-color: var(--el-color-danger);
        }
      }
      .list-item {
        position: absolute;
        top: 0;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;

        .item-left {
          height: 60px;

          img {
            height: 100%;
            width: 100%;
          }
        }

        .item-mid {
          height: 80%;
          display: flex;
          flex: 1;
          flex-direction: column;
          justify-content: space-between;
        }

        .item-right {
          width: 120px;
          height: 100%;

          .opration {
            height: 100%;
            display: flex;
            align-items: center;
            transform: translate(66%);

            &:hover {
              transform: translate(0);
            }

            & > * {
              height: 60%;
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              cursor: pointer;
            }
          }
        }
      }
    }
  }
}
</style>
