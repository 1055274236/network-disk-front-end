import { shell } from 'electron'
import { getMainWindow } from './MainWindow'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import mime from 'mime'
import UplaodProcess from './uploadClass'
import { createFolderApi, createFileApi } from './uploadApi'

interface UploadFileBaseInfomation {
  id: number
  name: string
  url: string
  filePath: string
  size: number
  total?: number
  status?: 'await' | 'progressing' | 'pause' | 'cancel' | 'interrupted' | 'complated'
  type?: string
  parentId?: number
}

let undeterminedArea: Array<UploadFileBaseInfomation> = []
const uploadMap: Map<number, UplaodProcess> = new Map()
const totalThread = 2
let pauseThread = 0

function upload(item: UploadFileBaseInfomation): void {
  if (!uploadMap.has(item.id)) {
    const pro = new UplaodProcess(item.filePath, item.url, item.type, item.size, item.id)
    pro.on('updated', () => {
      getMainWindow().webContents.send(
        'upload:updated',
        item.id,
        pro.getComplatedSize(),
        pro.getTotalSize()
      )
    })
    pro.on('complated', () => {
      getMainWindow().webContents.send('upload:complated', item.id)
    })
    pro.on('interrupted', () => {
      getMainWindow().webContents.send('message:error', '网络错误！')
    })
    uploadMap.set(item.id, pro)
    pro.startSend()
  }
}

// 从待定区添加到上传队列
function addUploadQueue(): void {
  if (undeterminedArea.length > 0 && uploadMap.size < totalThread + pauseThread) {
    let index = -1
    for (let i = 0; i < undeterminedArea.length; i++) {
      if (undeterminedArea[i].status !== 'interrupted') {
        index = i
        break
      }
    }
    index !== -1 && upload(undeterminedArea.splice(index, 1)[0])
  }
}

// 添加到待定区
function addUploadTask(filePath: string, url: string, parentId, start = 0): void {
  const id = new Date().getTime()
  undeterminedArea.push({
    id,
    name: path.basename(filePath),
    filePath: filePath,
    url,
    size: start,
    parentId
  })
  sendLength()
  if (url === '') createFileUrl(id)
  addUploadQueue()
}

// 获取下载队列
export function getUploadQueue(): UploadFileBaseInfomation[] {
  const temp: UploadFileBaseInfomation[] = []
  uploadMap.forEach((item, key) => {
    temp.push({
      id: key,
      name: path.basename(item.getFilePath()),
      url: item.getUrl(),
      size: item.getComplatedSize(),
      total: item.getTotalSize(),
      filePath: item.getFilePath(),
      status: item.getState(),
      type: item.getMime()
    })
  })
  undeterminedArea.forEach((item) => {
    temp.push({
      id: item.id,
      name: item.name,
      url: item.url,
      size: item.size,
      total: item.total || 0,
      filePath: item.filePath,
      status: item.status || 'await',
      type: item.type
    })
  })
  return temp
}

// 暂停一个
export function pauseOne(_event, id: number): void {
  if (uploadMap.has(id)) {
    pauseThread += 1
    uploadMap.get(id)?.pause()
    addUploadQueue()
  }
}
// 恢复一个
export function resumeOne(_event, id: number): void {
  if (uploadMap.has(id)) {
    if (uploadMap.get(id)?.getState() === 'pause') {
      pauseThread -= 1
      uploadMap.get(id)?.resume()
    }
  } else {
    undeterminedArea.forEach((item) => {
      if (item.id === id) {
        upload(item)
      }
    })
    undeterminedArea = undeterminedArea.filter((value) => value.id !== id)
  }
}
export function cancelOne(_event, id: number): void {
  if (uploadMap.has(id)) {
    uploadMap.get(id)?.cancel()
    uploadMap.delete(id)
    addUploadQueue()
  } else {
    undeterminedArea = undeterminedArea.filter((item) => item.id !== id)
  }
}
export function pauseAll(): void {
  uploadMap.forEach((item) => {
    item.pause()
  })
}
export function cancelAll(): void {
  uploadMap.forEach((item) => {
    item.cancel()
  })
  uploadMap.clear()
  undeterminedArea = []
}
export function resumeAll(): void {
  uploadMap.forEach((item) => {
    item.resume()
  })
}

function sendLength(): void {
  getMainWindow().webContents.send('uplaod:uploadQueue', getUploadQueue())
}

export function openFolder(_event, p: string): void {
  if (path.isAbsolute(p)) {
    shell.showItemInFolder(p)
  } else {
    p = path.join(__dirname, 'temp')
    if (fs.existsSync(p)) {
      shell.openPath(p)
    } else {
      shell.openPath(__dirname)
    }
  }
}

export function parseFile(_event, filePath: string, parentId = 0): void {
  if (!path.isAbsolute(filePath)) return
  const stat = fs.statSync(filePath)
  if (stat.isFile()) {
    addUploadTask(filePath, '', parentId, 0)
  } else {
    const files = fs.readdirSync(filePath)
    files.forEach(async (item) => {
      const p = await createFolder(parentId, item)
      parseFile(_event, path.join(filePath, item), p)
    })
  }
}

async function createFileUrl(id: number): Promise<void> {
  const item = undeterminedArea.find((item) => item.id === id)
  if (!item) return
  const md5 = await decode('md5', item.filePath)
  const sha1 = await decode('sha1', item.filePath)
  const mi = mime.getType(item.filePath)
  item.type = mi
  const result = await createFileApi(item.name, item.size, item?.parentId || 0, md5, sha1)
  item.url = `http://localhost:50030/uploda/${result.data.id}`
}

async function createFolder(parentId: number, name: string): Promise<number> {
  const result = await createFolderApi(name, parentId)
  if (result.code === 200) {
    return result.data.id
  }
  return -1
}

function decode(method: 'md5' | 'sha1', filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    const hash = crypto.createHash(method)
    stream.on('data', (chunk) => {
      hash.update(chunk)
    })
    stream.on('end', () => {
      const result = hash.digest('hex')
      resolve(result)
    })
    stream.on('error', (e) => {
      reject(e)
    })
  })
}
