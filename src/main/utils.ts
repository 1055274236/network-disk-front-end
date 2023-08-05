// 节流
export function throttle(
  fn: { apply: (arg0: any, arg1: any[]) => void },
  t: number
): () => unknown {
  let flag = true
  const interval = t || 500
  return function (this: any, ...args: any) {
    if (flag) {
      fn.apply(this, args)
      flag = false
      setTimeout(() => {
        flag = true
      }, interval)
    }
  }
}

// 防抖
export function debounce(fn: { apply: (arg0: any, arg1: any) => void }, t: number): () => unknown {
  let timeId: ReturnType<typeof setTimeout>
  const delay = t || 500
  return function (this: any, ...args: any) {
    if (timeId) {
      clearTimeout(timeId)
    }
    timeId = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}
