import ApiBaseFormat from '.'

type FileIndexApi = ApiBaseFormat<Array<FileIndexType>>

export interface FileIndexType {
  id: number
  file_name: string
  is_dir: number
  file_num: number
  static_id: number
  parent_id: number
  holding_user: number
  updated_at: string
}

export default FileIndexApi
