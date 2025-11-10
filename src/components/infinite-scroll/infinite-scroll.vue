<template>
  <div :class="classPrefix" ref="elementRef">
    <slot name="content" :hasMore="hasMore" :failed="failed" :retry="retry">
      <InfiniteScrollContent :hasMore="hasMore" :failed="failed" :retry="retry" />
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'

import { useLockFn, useThrottleFn } from '../../utils/ahooks'
import { getScrollParent } from '../../utils/get-scroll-parent'
import InfiniteScrollContent from './infinite-scroll-content.vue'

function isWindow(element: HTMLElement | Element | Window): element is Window {
  return element === window
}

const classPrefix = 'adm-infinite-scroll'

export interface InfiniteScrollProps {
  loadMore: (isRetry: boolean) => Promise<void>
  hasMore: boolean
  threshold?: number
}

const props = withDefaults(defineProps<InfiniteScrollProps>(), {
  threshold: 250,
})

// 响应式状态
const failed = ref(false)
const elementRef = ref<HTMLDivElement>()
const flag = ref({})
const nextFlagRef = ref(flag.value)
const scrollParent = ref<Window | Element | null>()

// 使用 useLockFn 防止重复请求
const doLoadMore = useLockFn(async (isRetry: boolean) => {
  try {
    await props.loadMore(isRetry)
  } catch (e) {
    failed.value = true
    throw e
  }
})

// 检查是否需要加载更多
const checkLoadMore = async () => {
  if (nextFlagRef.value !== flag.value) return
  if (!props.hasMore) return

  const element = elementRef.value
  if (!element) return
  if (!element.offsetParent) return

  const parent = getScrollParent(element)
  scrollParent.value = parent
  if (!parent) return

  const rect = element.getBoundingClientRect()
  const elementTop = rect.top
  const current = isWindow(parent) ? window.innerHeight : parent.getBoundingClientRect().bottom

  if (current >= elementTop - props.threshold) {
    const nextFlag = {}
    nextFlagRef.value = nextFlag
    try {
      await doLoadMore(false)
      flag.value = nextFlag
    } catch (e) {
      // 错误已在 doLoadMore 中处理
      console.error('Load more failed:', e)
    }
  }
}

// 使用 useThrottleFn 节流
const { run: check } = useThrottleFn(checkLoadMore, {
  wait: 100,
  leading: true,
  trailing: true,
})

// 重试函数
const retry = async () => {
  failed.value = false
  try {
    await doLoadMore(true)
    flag.value = nextFlagRef.value
  } catch (e) {
    console.error('Retry failed:', e)
    // 错误已在 doLoadMore 中处理
  }
}

// 监听内容变化触发检查
watch(
  () => [props.hasMore, props.threshold],
  () => {
    nextTick(() => {
      check()
    })
  },
)

// 监听滚动事件
let removeScrollListener: (() => void) | null = null

watch(scrollParent, (newParent) => {
  // 移除旧的监听器
  if (removeScrollListener) {
    removeScrollListener()
    removeScrollListener = null
  }

  // 添加新的监听器
  if (newParent) {
    const onScroll = () => {
      check()
    }
    newParent.addEventListener('scroll', onScroll)
    removeScrollListener = () => {
      newParent.removeEventListener('scroll', onScroll)
    }
  }
})

// 组件挂载后检查
onMounted(() => {
  nextTick(() => {
    check()
  })
})

// 组件卸载时清理
onUnmounted(() => {
  if (removeScrollListener) {
    removeScrollListener()
  }
})

// 暴露方法
defineExpose({
  retry,
  check,
})
</script>

<style lang="less" scoped>
@import './infinite-scroll.less';
</style>
