import Abstract from '../Abstract'
import FileIndexApi from './type/file'

class FileApi extends Abstract {
  constructor() {
    super()
  }

  getFileIndex(parentId: number): Promise<FileIndexApi> {
    return this.postReq('/getfileindex', { parentId }) as Promise<FileIndexApi>
  }
}

export default new FileApi()
