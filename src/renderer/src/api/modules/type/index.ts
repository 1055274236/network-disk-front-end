interface ApiBaseFormat<T> {
  code: number
  data: T
  message: string
}

export default ApiBaseFormat
