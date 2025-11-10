<template>
  <div ref="elementRef" :class="[classPrefix, `${classPrefix}-${placement}`]" :style="panelStyle">
    <div :class="`${classPrefix}-mask`" :style="{ display: pulling ? 'block' : 'none' }" />

    <!-- Header for bottom placement -->
    <div v-if="isBottomPlacement" :class="`${classPrefix}-header`" ref="headerRef">
      <div :class="`${classPrefix}-bar`" />
    </div>

    <!-- Content -->
    <div :class="`${classPrefix}-content`" ref="contentRef">
      <slot />
    </div>

    <!-- Header for top placement -->
    <div v-if="placement === 'top'" :class="`${classPrefix}-header`" ref="headerRef">
      <div :class="`${classPrefix}-bar`" />
    </div>
  </div>
</template>

<script lang="ts">
export interface FloatingPanelProps {
  anchors: number[]
  onHeightChange?: (height: number, animating: boolean) => void
  handleDraggingOfContent?: boolean
  placement?: 'bottom' | 'top'
  // CSS Variables
  '--border-radius'?: string
  '--z-index'?: string | number
  '--header-height'?: string
}

export interface FloatingPanelRef {
  setHeight: (
    height: number,
    options?: {
      immediate?: boolean
    },
  ) => void
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const classPrefix = 'adm-floating-panel'

const props = withDefaults(defineProps<FloatingPanelProps>(), {
  handleDraggingOfContent: true,
  placement: 'bottom',
})

const emit = defineEmits<{
  'height-change': [height: number, animating: boolean]
}>()

// Refs
const elementRef = ref<HTMLDivElement>()
const headerRef = ref<HTMLDivElement>()
const contentRef = ref<HTMLDivElement>()

// State
const pulling = ref(false)
const pullingRef = ref(false)
const y = ref(0)
const animating = ref(false)

// Computed
const maxHeight = computed(() => props.anchors[props.anchors.length - 1] ?? window.innerHeight)

const isBottomPlacement = computed(() => props.placement !== 'top')

const possibles = computed(() =>
  isBottomPlacement.value ? props.anchors.map((x) => -x) : props.anchors,
)

const bounds = computed(() => ({
  top: Math.min(...possibles.value),
  bottom: Math.max(...possibles.value),
}))

const panelStyle = computed(() => {
  const translateY = isBottomPlacement.value
    ? `calc(100% + (${Math.round(y.value)}px))`
    : props.placement === 'top'
      ? `calc(-100% + (${Math.round(y.value)}px))`
      : `${y.value}px`

  return {
    height: `${Math.round(maxHeight.value)}px`,
    transform: `translateY(${translateY})`,
    transition: animating.value ? 'transform 0.3s ease' : 'none',
    '--border-radius': props['--border-radius'],
    '--z-index': props['--z-index'],
    '--header-height': props['--header-height'],
  }
})

// Utility functions
function nearest(arr: number[], target: number): number {
  return arr.reduce((pre, cur) => {
    return Math.abs(pre - target) < Math.abs(cur - target) ? pre : cur
  })
}

// Animation functions
function animateToY(targetY: number, immediate = false) {
  if (immediate) {
    y.value = targetY
    animating.value = false
  } else {
    animating.value = true
    y.value = targetY
    setTimeout(() => {
      animating.value = false
    }, 300)
  }

  // Emit height change
  const height = -targetY
  emit('height-change', height, animating.value)
  props.onHeightChange?.(height, animating.value)
}

// Touch handling
let startY = 0
let currentY = 0
let isDragging = false

function handleTouchStart(event: TouchEvent) {
  const touch = event.touches[0]
  startY = touch.clientY
  currentY = y.value
  isDragging = false
  pullingRef.value = false

  const target = event.target as Element
  const header = headerRef.value

  // 检查是否点击在头部 - 头部始终可拖拽
  if (header === target || header?.contains(target)) {
    pullingRef.value = true
    isDragging = true
    pulling.value = true
    return
  }

  // 对于内容区域，不在 touchstart 时立即判断，而是在 touchmove 时根据手势判断
  if (props.handleDraggingOfContent) {
    const content = contentRef.value
    if (content && (content === target || content.contains(target))) {
      // 标记为潜在的拖拽目标，但不立即开始拖拽
      isDragging = true
    }
  }
}

function handleTouchMove(event: TouchEvent) {
  if (!isDragging) return

  const touch = event.touches[0]
  const deltaY = touch.clientY - startY
  const target = event.target as Element
  const header = headerRef.value
  const content = contentRef.value

  // 如果是在头部拖拽，总是允许面板拖拽
  if (header === target || header?.contains(target)) {
    if (!pullingRef.value) {
      pullingRef.value = true
      pulling.value = true
    }

    const newY = Math.max(bounds.value.top, Math.min(bounds.value.bottom, currentY + deltaY))

    if (event.cancelable) {
      event.preventDefault()
    }
    event.stopPropagation()

    y.value = newY

    const height = -newY
    emit('height-change', height, false)
    props.onHeightChange?.(height, false)
    return
  }

  // 如果是在内容区域
  if (
    props.handleDraggingOfContent &&
    content &&
    (content === target || content.contains(target))
  ) {
    const hasScrollableContent = content.scrollHeight > content.clientHeight

    if (!hasScrollableContent) {
      // 内容不可滚动时，允许拖拽面板
      if (!pullingRef.value) {
        pullingRef.value = true
        pulling.value = true
      }

      const newY = Math.max(bounds.value.top, Math.min(bounds.value.bottom, currentY + deltaY))

      if (event.cancelable) {
        event.preventDefault()
      }
      event.stopPropagation()

      y.value = newY

      const height = -newY
      emit('height-change', height, false)
      props.onHeightChange?.(height, false)
    } else {
      // 内容可滚动时，需要判断边界条件 - 提高阈值降低灵敏度
      const isAtTop = content.scrollTop <= 0
      const isAtBottom = content.scrollTop >= content.scrollHeight - content.clientHeight - 1
      const isDraggingDown = deltaY > 15 // 提高阈值从5到15，降低灵敏度
      const isDraggingUp = deltaY < -15 // 提高阈值从-5到-15，降低灵敏度

      let shouldDragPanel = false

      // 只有在明确的边界条件下且达到足够的拖拽距离才拖拽面板
      if (isAtTop && isDraggingDown) {
        // 在顶部向下拖拽时，需要更大的拖拽距离才触发面板移动
        shouldDragPanel = Math.abs(deltaY) > 20
      } else if (isAtBottom && isDraggingUp) {
        shouldDragPanel = true
      }

      if (shouldDragPanel) {
        if (!pullingRef.value) {
          pullingRef.value = true
          pulling.value = true
        }

        const newY = Math.max(bounds.value.top, Math.min(bounds.value.bottom, currentY + deltaY))

        if (event.cancelable) {
          event.preventDefault()
        }
        event.stopPropagation()

        y.value = newY

        const height = -newY
        emit('height-change', height, false)
        props.onHeightChange?.(height, false)
      }
      // 其他情况下，不阻止事件，让内容正常滚动
    }
  }
}

function handleTouchEnd(event: TouchEvent) {
  if (!isDragging) return

  const wasPulling = pullingRef.value

  pullingRef.value = false
  pulling.value = false
  isDragging = false

  // 只有在实际拖拽了面板时才执行吸附
  if (wasPulling) {
    const targetY = nearest(possibles.value, y.value)
    animateToY(targetY)
  }
}

// Expose methods
const setHeight = (height: number, options?: { immediate?: boolean }) => {
  animateToY(-height, options?.immediate)
}

// Lifecycle
onMounted(() => {
  // Initialize position
  const initialY = isBottomPlacement.value ? bounds.value.bottom : bounds.value.top
  y.value = initialY

  // Add touch listeners to the entire panel for better interaction
  const element = elementRef.value
  if (element) {
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
  }
})

onBeforeUnmount(() => {
  const element = elementRef.value
  if (element) {
    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
  }
})

// Watch for prop changes
watch(
  () => props.anchors,
  () => {
    const initialY = isBottomPlacement.value ? bounds.value.bottom : bounds.value.top
    animateToY(initialY, true)
  },
  { immediate: true },
)

// Expose ref methods
defineExpose({
  setHeight,
})
</script>

<style scoped>
.adm-floating-panel {
  position: fixed;
  z-index: var(--z-index, 1000);
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--border-radius, 8px);
  background: #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.adm-floating-panel-bottom {
  left: 0;
  right: 0;
  bottom: 0;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.adm-floating-panel-top {
  left: 0;
  right: 0;
  top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.adm-floating-panel-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 1;
}

.adm-floating-panel-header {
  height: var(--header-height, 28px);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
}

.adm-floating-panel-header:active {
  cursor: grabbing;
}

.adm-floating-panel-bar {
  width: 36px;
  height: 5px;
  background: #e5e5e5;
  border-radius: 2.5px;
}

.adm-floating-panel-content {
  height: calc(100% - var(--header-height, 28px));
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.adm-floating-panel-top .adm-floating-panel-content {
  height: calc(100% - var(--header-height, 28px));
}
</style>
