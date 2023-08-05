<script lang="ts" setup>
import { reactive, onMounted, ref, Ref } from 'vue'
import { ArrowRight, Search, Refresh } from '@element-plus/icons-vue'
import FileApi from '@renderer/api/modules/file'
import { FileIndexType } from '@renderer/api/modules/type/file'

interface dataType {
  parentId: number
  breadCrumb: Array<{ title: string; parentId: number }>
  list: Array<FileIndexType>
  keyword: string
  loading: boolean
}

const data: dataType = reactive({
  parentId: 0,
  keyword: '',
  loading: false,

  breadCrumb: [
    {
      title: '主页',
      parentId: 0
    }
  ],
  list: []
})
const content = ref() as Ref<HTMLDivElement>
onMounted(() => {
  initListener()
  getDetails()
})
const initListener = (): void => {
  console.log('initListener', content.value)

  content.value.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    //获得拖拽的文件集合
    let files
    if (e.dataTransfer) files = e.dataTransfer.files
    console.log(files)

    if (files.length > 0) {
      console.log(files[0].path)
    }
  })
  content.value.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })
}
const getDetails = async (parentId = data.parentId): Promise<void> => {
  data.loading = true
  const result = await FileApi.getFileIndex(parentId).finally(() => {
    data.loading = false
  })
  data.list = result.data
}

const folderClick = (item: FileIndexType): void => {
  getDetails(item.id)
  data.parentId = item.id
  data.breadCrumb.push({
    title: item.file_name,
    parentId: item.id
  })
}
const dbClick = (item: FileIndexType): void => {
  if (item.is_dir === 1) {
    folderClick(item)
  } else {
    downloadClick(item.id, item.file_name)
  }
}

const breadcrumbClick = (parentId: number): void => {
  let bIndex = 0
  data.breadCrumb.forEach((item, index) => {
    if (item.parentId === parentId) {
      bIndex = index
    }
  })
  if (bIndex === data.breadCrumb.length - 1) {
    return
  }
  data.breadCrumb = data.breadCrumb.slice(0, bIndex + 1)
  data.parentId = parentId
  getDetails()
}

const downloadClick = (fileId: number, fileName: string): void => {
  window.electron.ipcRenderer.send(
    'download:add',
    fileId,
    fileName,
    `http://localhost:50030/static/file/${fileId}/${fileName}`
  )
}
const refresh = (): void => {
  getDetails()
}
</script>

<script lang="ts">
export default {
  name: 'FileDetails'
}
</script>

<template>
  <div id="filedetails">
    <div class="head">
      <div class="search">
        <el-input v-model="data.keyword" placeholder="请输入关键字">
          <template #suffix>
            <el-icon class="el-input__icon"><search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="breadcrumb">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item
            v-for="(item, index) in data.breadCrumb"
            :key="index"
            class="breadcrumb-item"
            @click="breadcrumbClick(item.parentId)"
          >
            <span style="cursor: pointer">
              {{ item.title }}
            </span>
          </el-breadcrumb-item>
        </el-breadcrumb>
        <el-button link @click="refresh">
          <el-icon :class="{ 'is-loading': data.loading }">
            <Refresh></Refresh>
          </el-icon>
        </el-button>
      </div>
    </div>

    <div ref="content" v-loading="data.loading" class="content">
      <div class="filelist-back">
        <div v-if="data.list.length === 0" class="empty-back">
          <el-empty description="暂无数据">
            <el-button type="primary" @click="getDetails">刷新</el-button>
          </el-empty>
        </div>
        <div v-else class="filelist">
          <div class="filelist-head">
            <div class="title">名称</div>
            <div class="modify-date">修改时间</div>
            <div class="size">大小</div>
          </div>
          <div
            v-for="item in data.list"
            :key="item.id"
            class="filelist-item"
            @dblclick="dbClick(item)"
          >
            <div class="filelist-item-back">
              <div class="title">
                <div class="title-img">
                  <img v-if="item.is_dir === 1" src="@renderer/assets/img/folder.png" alt="" />
                  <img v-else src="@renderer/assets/img/file.png" alt="" />
                </div>
                {{ item.file_name }}
              </div>
              <div class="modify-date">
                {{ new Date(item.updated_at).toLocaleString() }}
              </div>
              <div class="size">-</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#filedetails {
  .head {
    display: flex;
    flex-direction: column;
    // justify-content: space-between;

    .search {
      // width: 40px;
      width: 200px;
      align-self: self-end;

      .el-input__icon {
        cursor: pointer;
      }
    }

    .breadcrumb {
      display: flex;
      height: 32px;
      line-height: 32px;
      > *:nth-child(1) {
        margin-right: 10px;
      }
      .breadcrumb-item {
        user-select: none;
        height: 100%;
        line-height: 100%;
      }
    }
  }

  .content {
    user-select: none;
    height: calc(100vh - 120px);
    overflow: auto;
    .filelist-back {
      margin-top: 30px;
      .filelist {
        .filelist-head {
          display: flex;
          justify-content: space-between;
          padding: 0 10px;
          margin-bottom: 10px;
        }
        .filelist-item {
          border-radius: 10px;
          padding: 10px;
          &:hover {
            background-color: #f6f6f4;
          }
          .filelist-item-back {
            display: flex;
            justify-content: space-between;

            height: 30px;
            line-height: 30px;

            .title {
              display: flex;

              img {
                height: 100%;
              }
            }
          }
        }
        .title {
          flex: 1;
        }
        .modify-date {
          width: 180px;
        }
        .size {
          width: 100px;
        }
      }
    }
    .empty-back {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
