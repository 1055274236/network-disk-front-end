import { DownloadItem, app, session, shell } from 'electron'
import { getMainWindow } from './MainWindow'
import path from 'path'
import fs from 'fs'

interface DownloadFileBaseInfomation {
  id: number
  name: string
  url: string
  savePath?: string
  size?: number
  total?: number
  status?: 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'await' | 'pause'
}

let undeterminedArea: Array<DownloadFileBaseInfomation> = []
const downloadMap: Map<number, DownloadItem> = new Map()
const totalThread = 2
let pauseThread = 0

let currentFileId = 0
let currentFileName = ''
let currentFilePath = ''

app.whenReady().then(() => {
  session.defaultSession.on('will-download', (_event, item) => {
    const id = currentFileId
    const fileName = currentFileName
    const filePath = currentFilePath
    currentFileId = 0
    currentFileName = ''
    currentFilePath = ''
    item.setSavePath(filePath)

    item.once('done', (_event, state) => {
      if (state === 'completed') {
        console.log('complated')
        getMainWindow().webContents.send('download:completed', id)
      } else if (state === 'interrupted') {
        console.log('err')

        undeterminedArea.push({
          id,
          name: fileName,
          savePath: filePath,
          status: 'interrupted',
          url: item.getURL(),
          size: item.getReceivedBytes(),
          total: item.getTotalBytes()
        })
      }

      downloadMap.delete(id)
      sendLength()
      addDownloadQueue()
    })
    item.on('updated', () => {
      getMainWindow().webContents.send(
        'download:progress',
        id,
        item.getReceivedBytes(),
        item.getTotalBytes()
      )
    })

    downloadMap.set(id, item)
  })
})

function download(item: DownloadFileBaseInfomation): void {
  // 保证唯一
  if (currentFileId === 0 && currentFileName === '' && currentFilePath === '') {
    currentFileId = item.id
    currentFileName = item.name
    currentFilePath = item.savePath || path.join(__dirname, 'temp', currentFileName)
    session.defaultSession.downloadURL(item.url)
  } else {
    setTimeout(() => download(item))
  }
}

// 从待定区添加到下载队列
function addDownloadQueue(): void {
  if (undeterminedArea.length > 0 && downloadMap.size < totalThread + pauseThread) {
    let index = -1
    for (let i = 0; i < undeterminedArea.length; i++) {
      if (undeterminedArea[i].status !== 'interrupted') {
        index = i
        break
      }
    }
    index !== -1 && download(undeterminedArea.splice(index, 1)[0])
  }
}

// 添加到待定区
export function addDownloadTask(
  _event,
  id: number,
  name: string,
  url: string,
  size?: number,
  savePath?: string
): void {
  undeterminedArea.push({ id, name, url, size, savePath })
  sendLength()
  addDownloadQueue()
}

// 获取下载队列
export function getDownloadQueue(): DownloadFileBaseInfomation[] {
  const temp: DownloadFileBaseInfomation[] = []
  downloadMap.forEach((item, key) => {
    temp.push({
      id: key,
      name: item.getFilename(),
      url: item.getURL(),
      size: item.getReceivedBytes(),
      total: item.getTotalBytes(),
      savePath: item.getSavePath(),
      status: item.isPaused() ? 'pause' : item.getState()
    })
  })
  undeterminedArea.forEach((item) => {
    temp.push({
      id: item.id,
      name: item.name,
      url: item.url,
      size: 0,
      total: item.total || 0,
      savePath: '',
      status: item.status || 'await'
    })
  })
  return temp
}

// 暂停一个
export function pauseOne(_event, id: number): void {
  if (downloadMap.has(id)) {
    pauseThread += 1
    downloadMap.get(id)?.pause()
    addDownloadQueue()
  }
}
// 恢复一个
export function resumeOne(_event, id: number): void {
  if (downloadMap.has(id)) {
    if (downloadMap.get(id)?.isPaused()) {
      pauseThread -= 1
      downloadMap.get(id)?.resume()
    }
  } else {
    undeterminedArea.forEach((item) => {
      if (item.id === id) {
        download(item)
      }
    })
    undeterminedArea = undeterminedArea.filter((value) => value.id !== id)
  }
}
export function cancelOne(_event, id: number): void {
  if (downloadMap.has(id)) {
    downloadMap.get(id)?.cancel()
    downloadMap.delete(id)
    addDownloadQueue()
  } else {
    undeterminedArea = undeterminedArea.filter((item) => item.id !== id)
  }
}
export function pauseAll(): void {
  downloadMap.forEach((item) => {
    item.pause()
  })
}
export function cancelAll(): void {
  downloadMap.forEach((item) => {
    item.cancel()
  })
  downloadMap.clear()
  undeterminedArea = []
}
export function resumeAll(): void {
  downloadMap.forEach((item) => {
    item.resume()
  })
}

function sendLength(): void {
  getMainWindow().webContents.send('download:downloadQueue', getDownloadQueue())
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
