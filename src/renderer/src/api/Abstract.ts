import ApiBaseType from './modules/type'
import { ElMessage } from 'element-plus'

const headers = {}

class Abstract {
  private async request(
    url: string,
    query: unknown,
    body: unknown,
    method: 'get' | 'post',
    headers: unknown
  ): Promise<unknown> {
    const result = (await window.electron.ipcRenderer.invoke(
      'api:axios',
      url,
      query,
      body,
      method,
      headers
    )) as ApiBaseType<unknown>

    if (result.code !== 200) {
      ElMessage.error(result.message)
    }

    return result
  }

  protected getReq(url: string, query: unknown): Promise<unknown> {
    return this.request(url, query, {}, 'get', headers)
  }

  protected postReq(url: string, params: unknown, query?: unknown): Promise<unknown> {
    return this.request(url, query, params, 'post', headers)
  }
}

export default Abstract
