import ApiBaseFormat from '.'

type base = ApiBaseFormat<root>

interface root {
  account: string
  name: string
  cover: string
  maxCapacity: number
  nowCapacity: number
}

export default base
