import fs from 'fs'
import { getInfoByStore } from './store'
import axios, { AxiosRequestConfig } from 'axios'
import { throttle } from './utils'

type ListenerType = 'updated' | 'complated' | 'cancel' | 'interrupted'
type StateType = 'await' | 'progressing' | 'pause' | 'cancel' | 'interrupted' | 'complated'
type UnknownFunction = () => unknown

class UplaodProcess {
  private id = 0
  private filePath = ''
  private url = ''
  private size = 0
  private state: StateType = 'await'
  private fileSize = 0
  private BLOCKSIZE = 1024
  private cookie = ['']
  private type = 'text/plain'

  private updatedListen: Array<UnknownFunction> = []
  private complatedListen: Array<UnknownFunction> = []
  private cancelListen: Array<UnknownFunction> = []
  private interruptedListen: Array<UnknownFunction> = []

  constructor(filePath: string, url: string, type?: string, start?: number, id?: number) {
    this.filePath = filePath
    this.url = url
    this.size = start || 0
    this.parseFile()
    this.id = id || 0
    this.type = type || 'text/plain'
    this.cookie = getInfoByStore(undefined, 'cookie') as string[]
  }

  private parseFile(): void {
    const s = fs.statSync(this.filePath)
    this.fileSize = s.size
  }
  getComplatedSize(): number {
    return this.size
  }
  getTotalSize(): number {
    return this.fileSize
  }
  setState(state: StateType): StateType {
    if (state == 'cancel') {
      this.listenRun('cancel')
    } else if (state == 'interrupted') {
      this.listenRun('interrupted')
    } else if (state === 'progressing') {
      this.updatedListenerRun()
    } else if (state === 'complated') {
      this.listenRun('complated')
    }
    return (this.state = state)
  }
  getState(): StateType {
    return this.state
  }
  getMime(): string {
    return this.type
  }
  getId(): number {
    return this.id
  }
  getUrl(): string {
    return this.url
  }
  getFilePath(): string {
    return this.filePath
  }

  on(key: ListenerType, f: UnknownFunction): void {
    switch (key) {
      case 'updated':
        this.updatedListen.push(f)
        break
      case 'complated':
        this.complatedListen.push(f)
        break
      case 'cancel':
        this.cancelListen.push(f)
        break
      case 'interrupted':
        this.interruptedListen.push(f)
        break
      default:
        break
    }
  }
  private listenRun(key: ListenerType): void {
    let arr: Array<UnknownFunction> = []
    switch (key) {
      case 'complated':
        arr = this.complatedListen
        break
      case 'updated':
        arr = this.updatedListen
        break
      case 'cancel':
        arr = this.cancelListen
        break
      case 'interrupted':
        arr = this.interruptedListen
        break
      default:
        break
    }
    arr.forEach((item) => item())
  }
  updatedListenerRun = throttle(() => this.listenRun('updated'), 500)

  async startSend(): Promise<void> {
    const endBlock = Math.ceil((this.fileSize - this.size) / this.BLOCKSIZE)
    for (let i = 0; i < endBlock; i++) {
      const buf = new Buffer(this.BLOCKSIZE)
      const fd = fs.openSync(this.filePath, 'r')
      fs.readSync(fd, buf, 0, this.BLOCKSIZE, this.size)
      await this.send(new Blob([buf], { type: this.type }), this.url)
        .then(() => {
          this.size += this.BLOCKSIZE
        })
        .catch(() => {
          this.setState('interrupted')
        })
      this.updatedListenerRun()
      if (this.state !== 'progressing') break
      if (i === endBlock - 1) this.setState('complated')
    }
  }

  private send(b: Blob, url: string): Promise<void> {
    const formData = new FormData()
    formData.append('file', b)
    const config: AxiosRequestConfig<FormData> = {
      method: 'post',
      url,
      data: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: this.cookie
      }
    }
    return axios(config)
  }

  pause(): void {
    this.setState('pause')
  }
  resume(): void {
    this.setState('progressing')
    this.startSend()
  }
  cancel(): void {
    this.setState('cancel')
  }
}

export default UplaodProcess
