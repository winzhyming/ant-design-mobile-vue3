<template>
  <div :class="`${classPrefix}-column`">
    <sub :class="`${classPrefix}-item-sub`" v-if="props.unit" :style="unitStyle">{{
      props.unit
    }}</sub>
    <div :class="`${classPrefix}-item-height-measure`" ref="itemHeightMeasureRef" />
    <div
      ref="rootRef"
      :style="{ transform: `translateY(${y}px)` }"
      :class="`${classPrefix}-column-wheel`"
      aria-hidden="true"
    >
      <div
        v-for="(item, index) in column"
        :key="item.key ?? item.value"
        :data-selected="props.value === item.value"
        :class="[
          `${classPrefix}-column-item`,
          {
            [`${classPrefix}-column-item-active`]: props.value === item.value,
          },
        ]"
        @click="() => handleClick(index)"
        :aria-hidden="!(props.value === item.value)"
        :aria-label="props.value === item.value ? 'active' : ''"
      >
        <div :class="`${classPrefix}-column-item-label`">
          <component :is="renderLabel(item)" v-if="typeof renderLabel(item) === 'object'" />
          <span v-else>{{ renderLabel(item) }}</span>
        </div>
      </div>
    </div>
    <component :is="renderAccessible()" v-if="renderAccessible()" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, nextTick, onMounted, reactive, ref, watch, type VNode } from 'vue'
import { bound } from '../../utils/bound'
import { measureCSSLength } from '../../utils/measure-css-length'
import { rubberbandIfOutOfBounds } from '../../utils/rubberband'
import { supportsPassive } from '../../utils/supports-passive'
import type { PickerColumnItem, PickerValue } from './types'

const classPrefix = 'adm-picker-view'

interface Props {
  index: number
  column: PickerColumnItem[]
  value: PickerValue
  onSelect: (value: PickerValue, index: number) => void
  renderLabel: (item: PickerColumnItem) => VNode | string | number
  mouseWheel: boolean
  unit?: string
}

const props = defineProps<Props>()

const unitStyle = reactive<{ [key: string]: string | number }>({})

// Refs
const rootRef = ref<HTMLDivElement>()
const itemHeightMeasureRef = ref<HTMLDivElement>()
const itemHeight = ref<number>(34)
const y = ref<number>(0)
const draggingRef = ref<boolean>(false)

// Spring animation state
const isAnimating = ref(false)
const targetY = ref<number>(0)

function initUnitStyle() {
  const rootElment = rootRef.value
  if (!rootElment) return
  const label = rootElment.querySelector(`.${classPrefix}-column-item-label`) as HTMLElement
  Object.assign(unitStyle, {
    left: `calc(50% + ${label.offsetWidth / 2 + 5}px)`,
    opacity: 1,
  })
}

// Animation function to replace react-spring
function animateToPosition(target: number, immediate = false) {
  if (immediate) {
    y.value = target
    return
  }

  targetY.value = target
  isAnimating.value = true

  const startY = y.value
  const distance = target - startY
  const duration = 300 // milliseconds
  const startTime = performance.now()

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Easing function (similar to react-spring config)
    const eased = 1 - Math.pow(1 - progress, 3)

    y.value = startY + distance * eased

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      isAnimating.value = false
    }
  }

  requestAnimationFrame(animate)
}

// eslint-disable-next-line vue/no-dupe-keys
function onSelect(val: PickerValue) {
  props.onSelect(val, props.index)
}

// Measure item height
onMounted(async () => {
  await nextTick()
  const itemHeightMeasure = itemHeightMeasureRef.value
  if (!itemHeightMeasure) return
  itemHeight.value = measureCSSLength(
    window.getComputedStyle(itemHeightMeasure).getPropertyValue('height'),
  )

  // 初始化位置 - 确保在测量完高度后立即设置正确位置
  syncPositionWithValue()
  // 初始化单位的位置
  initUnitStyle()
})

// 同步位置与 value 的函数
function syncPositionWithValue() {
  if (props.value === null || props.column.length === 0) return

  const targetIndex = props.column.findIndex((item) => item.value === props.value)
  if (targetIndex >= 0) {
    const finalPosition = targetIndex * -itemHeight.value
    // 立即设置位置，不使用动画
    y.value = finalPosition
  }
}

// Watch value changes
watch(
  () => [props.value, props.column],
  () => {
    if (draggingRef.value) return
    if (props.value === null) return
    const targetIndex = props.column.findIndex((item) => item.value === props.value)
    if (targetIndex < 0) return
    const finalPosition = targetIndex * -itemHeight.value

    // 如果位置差异很大或者是初始状态，立即设置位置
    const shouldAnimate = Math.abs(y.value - finalPosition) < itemHeight.value * 3 && y.value !== 0
    animateToPosition(finalPosition, !shouldAnimate)
  },
  { immediate: true, flush: 'post' },
)

// Watch column changes to validate current value
watch(
  () => props.column,
  (newColumn, oldColumn) => {
    if (newColumn.length === 0) {
      if (props.value !== null) {
        onSelect(null)
      }
      return
    }

    // 如果是首次加载或列数据变化，同步位置
    if (!oldColumn || oldColumn.length === 0) {
      nextTick(() => {
        syncPositionWithValue()
      })
      return
    }

    if (!newColumn.some((item) => item.value === props.value)) {
      const firstItem = newColumn[0]
      if (firstItem) {
        onSelect(firstItem.value)
      }
    }
  },
  { immediate: true },
)

// 监听 itemHeight 变化，重新同步位置
watch(itemHeight, () => {
  if (itemHeight.value > 0) {
    syncPositionWithValue()
  }
})

function scrollSelect(index: number) {
  const finalPosition = index * -itemHeight.value
  animateToPosition(finalPosition)
  const item = props.column[index]
  if (!item) return
  onSelect(item.value)
}

function handleClick(index: number) {
  draggingRef.value = false
  scrollSelect(index)
}

// Gesture handlers
type GestureState = {
  direction: number
  distance: number
  velocity: number
  offset: number
  last: boolean
}

function handleGestureState(data: {
  deltaY: number
  velocityY: number
  offsetY: number
  last: boolean
}): GestureState {
  return {
    direction: data.deltaY > 0 ? 1 : -1,
    distance: Math.abs(data.deltaY),
    velocity: Math.abs(data.velocityY),
    offset: data.offsetY,
    last: data.last,
  }
}

function handleDrag(state: GestureState) {
  draggingRef.value = true
  const min = -((props.column.length - 1) * itemHeight.value)
  const max = 0
  const { direction, last, velocity, offset } = state

  if (last) {
    draggingRef.value = false

    const position = offset + velocity * direction * 50
    const boundNum = bound(position, min, max)
    const targetIndex = -Math.round(boundNum / itemHeight.value)

    scrollSelect(targetIndex)
  } else {
    const position = offset

    y.value = rubberbandIfOutOfBounds(position, min, max, itemHeight.value * 50, 0.2)
  }
}

function handleWheel(state: GestureState) {
  draggingRef.value = true
  const min = -((props.column.length - 1) * itemHeight.value)
  const max = 0
  const { direction, last, velocity, distance } = state
  const wheelDir = -direction // 取反
  const scrollY = y.value

  if (last) {
    draggingRef.value = false

    const speed = velocity * wheelDir * 50
    const position = scrollY + distance * wheelDir + speed
    const boundNum = bound(position, min, max)
    const targetIndex = -Math.round(boundNum / itemHeight.value)

    scrollSelect(targetIndex)
  } else {
    const position = scrollY + distance * wheelDir

    y.value = rubberbandIfOutOfBounds(position, min, max, itemHeight.value * 50, 0.2)
  }
}

// Touch and mouse event handlers
let isDragging = false
let startY = 0
let startTouchY = 0
let lastTouchY = 0
let startTime = 0
let velocityTracker: Array<{ time: number; y: number }> = []

function handleTouchStart(e: TouchEvent) {
  e.stopPropagation()
  isDragging = true
  startY = y.value
  startTouchY = e.touches[0].clientY
  lastTouchY = startTouchY
  startTime = performance.now()
  velocityTracker = [{ time: startTime, y: startTouchY }]
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging) return
  e.stopPropagation()

  const currentY = e.touches[0].clientY
  const deltaY = currentY - lastTouchY
  const totalDelta = currentY - startTouchY
  const currentTime = performance.now()

  // Update velocity tracker
  velocityTracker.push({ time: currentTime, y: currentY })
  if (velocityTracker.length > 5) {
    velocityTracker.shift()
  }

  lastTouchY = currentY

  const state = handleGestureState({
    deltaY,
    velocityY: calculateVelocity(),
    offsetY: startY + totalDelta,
    last: false,
  })

  handleDrag(state)
}

function handleTouchEnd(e: TouchEvent) {
  if (!isDragging) return
  e.stopPropagation()
  isDragging = false

  const velocity = calculateVelocity()
  const totalDelta = lastTouchY - startTouchY

  const state = handleGestureState({
    deltaY: totalDelta,
    velocityY: velocity,
    offsetY: startY + totalDelta,
    last: true,
  })

  handleDrag(state)
}

function calculateVelocity(): number {
  if (velocityTracker.length < 2) return 0

  const recent = velocityTracker[velocityTracker.length - 1]
  const previous = velocityTracker[velocityTracker.length - 2]
  const timeDiff = recent.time - previous.time
  const yDiff = recent.y - previous.y

  return timeDiff > 0 ? yDiff / timeDiff : 0
}

// Wheel event handler
function handleWheelEvent(e: WheelEvent) {
  if (!props.mouseWheel) return
  e.stopPropagation()
  e.preventDefault()

  const deltaY = e.deltaY
  const velocity = Math.abs(deltaY) / 10 // Normalize velocity

  const state = handleGestureState({
    deltaY,
    velocityY: velocity,
    offsetY: y.value,
    last: true, // Treat wheel events as immediate
  })

  handleWheel(state)
}

// Setup event listeners
onMounted(() => {
  const root = rootRef.value
  if (!root) return

  // Touch events
  root.addEventListener('touchstart', handleTouchStart, { passive: false })
  root.addEventListener('touchmove', handleTouchMove, { passive: false })
  root.addEventListener('touchend', handleTouchEnd, { passive: false })

  // Mouse wheel events (if enabled)
  if (props.mouseWheel) {
    root.addEventListener('wheel', handleWheelEvent, supportsPassive ? { passive: false } : false)
  }
})

// Selected index for accessibility
const selectedIndex = computed(() => {
  return props.column.findIndex((item) => item.value === props.value)
})

function renderAccessible() {
  const index = selectedIndex.value
  if (index === -1) return null

  const current = props.column[index]
  const previousIndex = index - 1
  const nextIndex = index + 1
  const previous = props.column[previousIndex]
  const next = props.column[nextIndex]

  return h('div', { class: `${classPrefix}-column-accessible` }, [
    h(
      'div',
      {
        class: `${classPrefix}-column-accessible-current`,
        role: 'button',
        'aria-label': current ? `当前选择的是：${current.label}` : '当前未选择',
      },
      '-',
    ),
    h(
      'div',
      {
        class: `${classPrefix}-column-accessible-button`,
        onClick: () => {
          if (!previous) return
          scrollSelect(previousIndex)
        },
        role: previous ? 'button' : 'text',
        'aria-label': !previous ? '没有上一项' : `选择上一项：${previous.label}`,
      },
      '-',
    ),
    h(
      'div',
      {
        class: `${classPrefix}-column-accessible-button`,
        onClick: () => {
          if (!next) return
          scrollSelect(nextIndex)
        },
        role: next ? 'button' : 'text',
        'aria-label': !next ? '没有下一项' : `选择下一项：${next.label}`,
      },
      '-',
    ),
  ])
}
</script>
