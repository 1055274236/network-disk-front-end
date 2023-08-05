import { app } from 'electron'
import Store from 'electron-store'

const option = {
  name: 'config', //文件名称,默认 config
  fileExtension: 'json', //文件后缀,默认json
  cwd: app.getPath('userData'), //文件位置,尽量不要动，默认情况下，它将通过遵循系统约定来选择最佳位置。C:\Users\xxx\AppData\Roaming\test\config.json
  encryptionKey: 'aes-256-cbc', //对配置文件进行加密
  clearInvalidConfig: true // 发生 SyntaxError  则清空配置,
}
const store = new Store(option)

export function getInfoByStore(_event, key: string): unknown {
  return store.get(key)
}
export function setInfoByStore(_event, key: string, value: unknown): void {
  return store.set(key, value)
}
