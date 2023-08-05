import axios, { AxiosRequestConfig } from 'axios'
// import { IpcMainInvokeEvent } from 'electron'
import { is } from '@electron-toolkit/utils'
import { closeMainWindow, getMainWindow } from './MainWindow'
import createLoginWindow, { getLoginWindow } from './LoginWindow'
import { setInfoByStore } from './store'

axios.defaults.timeout = 5000
axios.defaults.withCredentials = true
if (is.dev) {
  axios.defaults.baseURL = 'http://127.0.0.1:50030'
} else {
  axios.defaults.baseURL = 'http://'
}

const BaseHeaders = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Cookie: ['']
}

axios.interceptors.response.use(
  (response) => {
    // set-cookie
    if (response.headers['set-cookie']) {
      const cookieMap = new Map()
      BaseHeaders.Cookie.forEach((item) => {
        if (item.indexOf('=') != -1) {
          const v = item.split('=')
          cookieMap.set(v[0], v[1])
        }
      })
      response.headers['set-cookie'].forEach((item) => {
        const setValue = item.split(';')[0]
        if (setValue.indexOf('=') != -1) {
          const v = setValue.split('=')
          cookieMap.set(v[0], v[1])
        }
      })
      const cookieTemp: string[] = []
      cookieMap.forEach((value, key) => {
        cookieTemp.push(key + '=' + value)
      })
      BaseHeaders.Cookie = cookieTemp
      setInfoByStore(undefined, 'cookie', cookieTemp)
    }

    return response
  },
  (error) => {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('网络错误！')
    }

    if (error.response?.status === 401) {
      closeMainWindow()
      createLoginWindow()
      getLoginWindow().webContents.send('message:error', '请重新登录！')
    }
  }
)

export default async function apiAxios(
  _event,
  url: string,
  params: unknown,
  body: unknown,
  method: 'get' | 'post' = 'get',
  headers = {}
): Promise<unknown> {
  headers = { ...BaseHeaders, ...headers }
  const config: AxiosRequestConfig = {
    url: url,
    data: body,
    params,
    method: method,
    headers: headers
  }

  const result = await axios(config).catch((err) => {
    if (getMainWindow() && getMainWindow().isFocused()) {
      getMainWindow().webContents.send('message:error', err?.toString() || err || '系统错误')
    } else if (getLoginWindow() && getLoginWindow().isFocused()) {
      getLoginWindow().webContents.send('message:error', err?.toString() || err || '系统错误')
    }
    throw err
  })

  // if (process.env.NODE_ENV === 'development') console.log(new Date(), JSON.stringify(result.data))

  return result.data
}
