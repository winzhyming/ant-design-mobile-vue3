/**
 * 工具函数集合
 * 为 Vue 3 Tabs 组件提供必要的工具函数
 */

/**
 * 节流函数
 * @param func 要节流的函数
 * @param wait 等待时间（毫秒）
 * @returns 节流后的函数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeoutId: number | undefined
  let lastCallTime = 0

  return ((...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCallTime >= wait) {
      func(...args)
      lastCallTime = now
    } else {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(
        () => {
          func(...args)
          lastCallTime = Date.now()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        },
        wait - (now - lastCallTime),
      ) as any
    }
  }) as T
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeoutId: number | undefined

  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    timeoutId = setTimeout(() => func(...args), wait) as any
  }) as T
}

/**
 * 检查元素是否在可视区域内
 * @param element 要检查的元素
 * @param container 容器元素
 * @returns 是否在可视区域内
 */
export function isElementInView(element: HTMLElement, container: HTMLElement): boolean {
  const elementRect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  return (
    elementRect.left >= containerRect.left &&
    elementRect.right <= containerRect.right &&
    elementRect.top >= containerRect.top &&
    elementRect.bottom <= containerRect.bottom
  )
}

/**
 * 获取元素相对于容器的位置
 * @param element 子元素
 * @param container 容器元素
 * @returns 相对位置信息
 */
export function getElementOffset(element: HTMLElement, container: HTMLElement) {
  const elementRect = element.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  return {
    left: elementRect.left - containerRect.left,
    top: elementRect.top - containerRect.top,
    width: elementRect.width,
    height: elementRect.height,
  }
}

/**
 * 深度合并对象
 * @param target 目标对象
 * @param sources 源对象
 * @returns 合并后的对象
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(target as any)[key] = {}
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deepMerge(target[key], source[key] as any)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(target as any)[key] = source[key]
      }
    }
  }

  return deepMerge(target, ...sources)
}

/**
 * 检查是否为对象
 * @param item 要检查的项目
 * @returns 是否为对象
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item)
}
