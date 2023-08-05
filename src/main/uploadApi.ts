import apiAxios from './api'

interface ApiBaseFormat<T> {
  code: number
  data: T
  message: string
}

interface FileIndex {
  id: number
  file_name: string
  is_dir: number
  file_num: number
  static_id: number
  parent_id: number
  holding_user: number
  is_show: number
}

interface CreateFile {
  id: number
  isExist: boolean
}

interface FileStatus {
  status: number
  size: number
}

export function createFolderApi(name: string, parentId: number): Promise<ApiBaseFormat<FileIndex>> {
  return apiAxios(undefined, '/upload/mkdir', '', { name, parentId }, 'post') as Promise<
    ApiBaseFormat<FileIndex>
  >
}
// 创建文件索引，并返回是否秒传
export function createFileApi(
  name: string,
  size: number,
  parentId: number,
  md5: string,
  sha1: string
): Promise<ApiBaseFormat<CreateFile>> {
  return apiAxios(
    undefined,
    '/upload/createfile',
    { md5, sha1 },
    { name, size, parentId },
    'post'
  ) as Promise<ApiBaseFormat<CreateFile>>
}
// 获取数据库中相同特征码文件数据
export function getFileStatusByCode(md5: string, sha1: string): Promise<unknown> {
  return apiAxios(undefined, '/status/file', { md5, sha1 }, {}, 'get')
}
// 获取文件一上传状态
export function getFileStatusById(id: number): Promise<ApiBaseFormat<FileStatus>> {
  return apiAxios(undefined, '/status/filebyid', { id }, {}, 'get') as Promise<
    ApiBaseFormat<FileStatus>
  >
}

// export function createFileApi()
