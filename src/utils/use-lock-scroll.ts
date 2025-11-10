import { ref, watch } from 'vue'

// 定义基本的 Ref 类型
type Ref<T> = { value: T }

let totalLockCount = 0

const BODY_LOCK_CLASS = 'adm-overflow-hidden'

// 触摸相关状态管理
interface TouchState {
  startX: number
  startY: number
  deltaX: number
  deltaY: number
  offsetX: number
  offsetY: number
  direction: string
}

function createTouch() {
  const state = ref<TouchState>({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    offsetX: 0,
    offsetY: 0,
    direction: '',
  })

  const isVertical = () => state.value.direction === 'vertical'

  const start = (event: TouchEvent) => {
    const touch = event.touches[0]
    state.value.startX = touch.clientX
    state.value.startY = touch.clientY
    state.value.deltaX = 0
    state.value.deltaY = 0
    state.value.offsetX = 0
    state.value.offsetY = 0
    state.value.direction = ''
  }

  const move = (event: TouchEvent) => {
    const touch = event.touches[0]
    state.value.deltaX = touch.clientX < 0 ? 0 : touch.clientX - state.value.startX
    state.value.deltaY = touch.clientY < 0 ? 0 : touch.clientY - state.value.startY
    state.value.offsetX = Math.abs(state.value.deltaX)
    state.value.offsetY = Math.abs(state.value.deltaY)

    // 确定滑动方向
    const LOCK_DIRECTION_DISTANCE = 10
    if (
      !state.value.direction &&
      (state.value.offsetX > LOCK_DIRECTION_DISTANCE ||
        state.value.offsetY > LOCK_DIRECTION_DISTANCE)
    ) {
      state.value.direction = state.value.offsetX > state.value.offsetY ? 'horizontal' : 'vertical'
    }
  }

  return {
    state,
    start,
    move,
    isVertical,
  }
}

function getScrollParent(element: Element | null, root?: HTMLElement | null): Element | null {
  if (!element) return null

  const overflowScrollReg = /scroll|auto|overlay/i
  const defaultRoot = root || document.body

  let node = element.parentNode as Element

  while (node && node !== defaultRoot && node.nodeType === Node.ELEMENT_NODE) {
    const { overflowY, overflow } = window.getComputedStyle(node)
    if (overflowScrollReg.test(overflowY) || overflowScrollReg.test(overflow)) {
      return node
    }
    node = node.parentNode as Element
  }

  return defaultRoot
}

function getScrollableElement(el: HTMLElement | null): HTMLElement | null {
  let current = el?.parentElement

  while (current) {
    if (current.clientHeight < current.scrollHeight) {
      return current
    }
    current = current.parentElement
  }

  return null
}

// 检测是否支持 passive 事件监听器
function checkSupportsPassive(): boolean {
  let supportsPassive = false
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true
        return false
      },
    })
    window.addEventListener('testPassive', () => {}, opts)
    window.removeEventListener('testPassive', () => {}, opts)
  } catch (e) {
    // ignore
  }
  return supportsPassive
}

const supportsPassive = checkSupportsPassive()

// Vue 3 Composition API 版本的 useLockScroll
export function useLockScroll(
  rootRef: Ref<HTMLElement | null>,
  shouldLock: Ref<boolean | 'strict'> | boolean | 'strict',
) {
  const touch = createTouch()
  let isLocked = false

  const onTouchMove = (event: TouchEvent) => {
    touch.move(event)

    const direction = touch.state.value.deltaY > 0 ? '10' : '01'
    const el = getScrollParent(event.target as Element, rootRef.value) as HTMLElement

    if (!el) return

    // 获取当前的 shouldLock 值
    const currentShouldLock = typeof shouldLock === 'object' ? shouldLock.value : shouldLock

    // 严格模式下的处理
    if (currentShouldLock === 'strict') {
      const scrollableParent = getScrollableElement(event.target as HTMLElement)
      if (scrollableParent === document.body || scrollableParent === document.documentElement) {
        event.preventDefault()
        return
      }
    }

    const { scrollHeight, offsetHeight, scrollTop } = el
    const { height } = el.getBoundingClientRect()
    let status = '11'

    if (scrollTop === 0) {
      status = offsetHeight >= scrollHeight ? '00' : '01'
    } else if (scrollHeight <= Math.round(height + scrollTop)) {
      status = '10'
    }

    if (status !== '11' && touch.isVertical() && !(parseInt(status, 2) & parseInt(direction, 2))) {
      if (event.cancelable && supportsPassive) {
        event.preventDefault()
      }
    }
  }

  const lock = () => {
    if (isLocked) return

    document.addEventListener('touchstart', touch.start)
    document.addEventListener(
      'touchmove',
      onTouchMove,
      supportsPassive ? { passive: false } : false,
    )

    if (!totalLockCount) {
      document.body.classList.add(BODY_LOCK_CLASS)
    }

    totalLockCount++
    isLocked = true
  }

  const unlock = () => {
    if (!isLocked) return

    document.removeEventListener('touchstart', touch.start)
    document.removeEventListener('touchmove', onTouchMove)

    totalLockCount--
    isLocked = false

    if (!totalLockCount) {
      document.body.classList.remove(BODY_LOCK_CLASS)
    }
  }

  // 监听 shouldLock 的变化
  watch(
    () => (typeof shouldLock === 'object' ? shouldLock.value : shouldLock),
    (newValue) => {
      if (newValue) {
        lock()
      } else {
        unlock()
      }
    },
    { immediate: true },
  )

  return {
    lock,
    unlock,
    // 提供清理函数供外部调用
    cleanup: unlock,
  }
}
