import { ref } from 'vue'

// 自定义 useLockFn hook

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useLockFn = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
  const lockRef = ref(false)

  const lockedFn = async (...args: Parameters<T>) => {
    if (lockRef.value) return
    lockRef.value = true
    try {
      return await fn(...args)
    } finally {
      lockRef.value = false
    }
  }

  return lockedFn as T
}

// 自定义 useThrottleFn hook
export const useThrottleFn = (
  fn: () => void,
  options: { wait: number; leading: boolean; trailing: boolean },
) => {
  let lastCallTime = 0
  let timer: number | null = null

  const throttledFn = () => {
    const now = Date.now()

    if (options.leading && now - lastCallTime >= options.wait) {
      lastCallTime = now
      fn()
      return
    }

    if (timer) {
      clearTimeout(timer)
    }

    if (options.trailing) {
      timer = setTimeout(
        () => {
          lastCallTime = Date.now()
          fn()
          timer = null
        },
        options.wait - (now - lastCallTime),
      ) as unknown as number
    }
  }

  return { run: throttledFn }
}
