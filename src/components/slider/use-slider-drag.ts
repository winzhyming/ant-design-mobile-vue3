import { onUnmounted, ref } from 'vue'

export interface UseSliderDragOptions {
  min: number
  max: number
  step: number
  isRange: boolean
  getValueArr: () => number[]
  setValueArr: (arr: number[]) => void
  rootRef: any
  disabled?: boolean
}

export function useSliderDrag(options: UseSliderDragOptions) {
  const dragging = ref(false)
  const dragIndex = ref<number | null>(null)

  let startX = 0
  let startArr: number[] = []

  function getPosition(e: MouseEvent | TouchEvent) {
    if ('touches' in e) {
      return e.touches[0].clientX
    } else {
      return e.clientX
    }
  }

  function onDragStart(idx: number, e: MouseEvent | TouchEvent) {
    if (options.disabled) return
    dragging.value = true
    dragIndex.value = idx
    startX = getPosition(e)
    startArr = options.getValueArr().slice()
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('touchmove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
    window.addEventListener('touchend', onDragEnd)
  }

  function onDragMove(e: MouseEvent | TouchEvent) {
    if (!dragging.value || dragIndex.value === null) return
    const moveX = getPosition(e)
    // const delta = moveX - startX
    const root = options.rootRef.value as HTMLElement
    if (!root) return
    const rect = root.getBoundingClientRect()
    const percent = Math.min(1, Math.max(0, (moveX - rect.left) / rect.width))
    const value = options.min + percent * (options.max - options.min)
    let arr = startArr.slice()
    arr[dragIndex.value] =
      Math.round((value - options.min) / options.step) * options.step + options.min
    if (options.isRange && arr.length === 2) {
      if (arr[0] > arr[1]) {
        arr = [arr[1], arr[0]]
        dragIndex.value = arr[0] === value ? 0 : 1
      }
    }
    arr = arr.map((v) => Math.max(options.min, Math.min(options.max, v)))
    options.setValueArr(arr)
  }

  function onDragEnd() {
    dragging.value = false
    dragIndex.value = null
    window.removeEventListener('mousemove', onDragMove)
    window.removeEventListener('touchmove', onDragMove)
    window.removeEventListener('mouseup', onDragEnd)
    window.removeEventListener('touchend', onDragEnd)
  }

  onUnmounted(() => {
    onDragEnd()
  })

  return {
    dragging,
    dragIndex,
    onDragStart,
  }
}
