<template>
  <div ref="elementRef" :class="classPrefix">
    <div
      :class="`${classPrefix}-head`"
      :style="{ height: springHeight + 'px', overflow: 'hidden' }"
    >
      <div :class="`${classPrefix}-head-content`" :style="{ height: headHeight + 'px' }">
        <component v-if="isComponent(statusText)" :is="statusText" />
        <span v-else>{{ statusText }}</span>
      </div>
    </div>
    <div :class="`${classPrefix}-content`">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import type { Component } from 'vue'

export type PullStatus = 'pulling' | 'canRelease' | 'refreshing' | 'complete'

export interface PullToRefreshProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRefresh?: () => Promise<any>
  pullingText?: string | Component
  canReleaseText?: string | Component
  refreshingText?: string | Component
  completeText?: string | Component
  completeDelay?: number
  headHeight?: number
  threshold?: number
  disabled?: boolean
  renderText?: (status: PullStatus) => string | Component
}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { convertPx } from '../../utils/convert-px'
import { getScrollParent } from '../../utils/get-scroll-parent'
import { rubberbandIfOutOfBounds } from '../../utils/rubberband'
import { sleep } from '../../utils/sleep'
import { supportsPassive } from '../../utils/supports-passive'
import { useConfig } from '../config-provider/useConfig'

const classPrefix = 'adm-pull-to-refresh'

const props = withDefaults(defineProps<PullToRefreshProps>(), {
  completeDelay: 500,
  disabled: false,
})

const emit = defineEmits<{
  refresh: []
}>()

// Refs
const elementRef = ref<HTMLDivElement>()
const status = ref<PullStatus>('pulling')
const springHeight = ref(0)
const pullingRef = ref(false)

// Get config
const { locale } = useConfig()
// Computed values
const headHeight = computed(() => props.headHeight ?? convertPx(40))
const threshold = computed(() => props.threshold ?? convertPx(60))

const defaultTexts = computed(() => ({
  pullingText: props.pullingText || locale.PullToRefresh.pulling,
  canReleaseText: props.canReleaseText || locale.PullToRefresh.canRelease,
  refreshingText: props.refreshingText || `${locale.common.loading}...`,
  completeText: props.completeText || locale.PullToRefresh.complete,
}))

const statusText = computed(() => {
  if (props.renderText) {
    return props.renderText(status.value)
  }

  const texts = defaultTexts.value
  switch (status.value) {
    case 'pulling':
      return texts.pullingText
    case 'canRelease':
      return texts.canReleaseText
    case 'refreshing':
      return texts.refreshingText
    case 'complete':
      return texts.completeText
    default:
      return texts.pullingText
  }
})

// Helper function to check if value is a component
const isComponent = (value: string | Component) => {
  return value && typeof value === 'object' && (value.render || value.setup || value.__vccOpts)
}

// Animation helper
const animateHeight = (targetHeight: number, duration = 300) => {
  return new Promise<void>((resolve) => {
    const startHeight = springHeight.value
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      springHeight.value = startHeight + (targetHeight - startHeight) * easeOut

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        resolve()
      }
    }

    animate()
  })
}

// Reset function
const reset = async () => {
  await animateHeight(0)
  status.value = 'pulling'
}

// Refresh function
const doRefresh = async () => {
  springHeight.value = headHeight.value
  status.value = 'refreshing'

  try {
    emit('refresh')
    if (props.onRefresh) {
      await props.onRefresh()
    }
    status.value = 'complete'
  } catch (e) {
    await reset()
    throw e
  }

  if (props.completeDelay > 0) {
    await sleep(props.completeDelay)
  }

  await reset()
}

// Touch event handlers
let startY = 0
let currentY = 0
let isDragging = false

const getScrollTop = (element: Window | Element): number => {
  return 'scrollTop' in element ? element.scrollTop : element.scrollY
}

const checkScrollable = (target: Element): boolean => {
  let scrollParent = getScrollParent(target)

  while (scrollParent) {
    const scrollTop = getScrollTop(scrollParent)
    if (scrollTop > 0) {
      return false // 有滚动，不允许下拉刷新
    }

    if (scrollParent instanceof Window) {
      break
    }

    scrollParent = getScrollParent(scrollParent.parentNode as Element)
  }

  return true // 没有滚动，允许下拉刷新
}

const handleTouchStart = (e: TouchEvent) => {
  if (props.disabled || status.value === 'refreshing' || status.value === 'complete') {
    return
  }

  startY = e.touches[0].clientY
  isDragging = false
  pullingRef.value = false
}

const handleTouchMove = (e: TouchEvent) => {
  if (props.disabled || status.value === 'refreshing' || status.value === 'complete') {
    return
  }

  currentY = e.touches[0].clientY
  const deltaY = currentY - startY

  if (deltaY <= 0) {
    return // 向上滑动，不处理
  }

  if (!isDragging) {
    const target = e.target as Element
    if (!checkScrollable(target)) {
      return
    }
    isDragging = true
    pullingRef.value = true
  }

  if (!pullingRef.value) return

  if (e.cancelable) {
    e.preventDefault()
  }
  e.stopPropagation()

  const height = Math.max(rubberbandIfOutOfBounds(deltaY, 0, 0, headHeight.value * 5, 0.5), 0)

  springHeight.value = height
  status.value = height > threshold.value ? 'canRelease' : 'pulling'
}

const handleTouchEnd = (e: TouchEvent) => {
  if (!pullingRef.value) return

  pullingRef.value = false
  isDragging = false

  if (status.value === 'canRelease') {
    doRefresh()
  } else {
    animateHeight(0)
  }
}

// Lifecycle
onMounted(() => {
  const element = elementRef.value
  if (!element) return

  // 防止下拉时抖动
  element.addEventListener('touchmove', () => {}, supportsPassive ? { passive: false } : false)

  // 添加触摸事件监听器
  element.addEventListener(
    'touchstart',
    handleTouchStart,
    supportsPassive ? { passive: true } : false,
  )
  element.addEventListener(
    'touchmove',
    handleTouchMove,
    supportsPassive ? { passive: false } : false,
  )
  element.addEventListener('touchend', handleTouchEnd, supportsPassive ? { passive: true } : false)
})

onUnmounted(() => {
  const element = elementRef.value
  if (!element) return

  element.removeEventListener('touchstart', handleTouchStart)
  element.removeEventListener('touchmove', handleTouchMove)
  element.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style scoped>
@import './pull-to-refresh.less';
</style>
