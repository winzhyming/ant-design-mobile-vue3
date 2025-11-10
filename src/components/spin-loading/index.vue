<template>
  <div :class="classPrefix" :style="spinStyle" v-bind="$attrs">
    <svg :class="`${classPrefix}-svg`" viewBox="0 0 32 32">
      <circle
        :class="`${classPrefix}-fill`"
        fill="transparent"
        stroke-width="2"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="animatedPercent"
        stroke-linecap="square"
        :r="15"
        :cx="16"
        :cy="16"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

// 类型定义
interface SpinLoadingProps {
  color?: 'default' | 'primary' | 'white' | string
  size?: string | number
}

// Props 定义
const props = withDefaults(defineProps<SpinLoadingProps>(), {
  color: 'default',
})

// 常量
const classPrefix = 'adm-spin-loading'

const colorRecord: Record<string, string> = {
  default: 'var(--adm-color-weak)',
  primary: 'var(--adm-color-primary)',
  white: 'var(--adm-color-white)',
}

const circumference = 15 * 3.14159265358979 * 2

// 响应式数据
const animatedPercent = ref(80)
const animationId = ref<number>()
const isReversing = ref(false)

// 计算属性
const spinStyle = computed(() => {
  const style: Record<string, string | number> = {
    '--color': colorRecord[props.color] ?? props.color,
    '--percent': animatedPercent.value,
  }

  if (props.size) {
    style['--size'] = typeof props.size === 'number' ? `${props.size}px` : props.size
  }

  return style
})

// 动画逻辑
const animate = () => {
  const duration = 1200 // 毫秒
  const startTime = performance.now()
  const startValue = 80
  const endValue = 30

  const animateStep = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // 使用缓动函数
    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
    const easedProgress = easeInOut(progress)

    if (isReversing.value) {
      animatedPercent.value = endValue + (startValue - endValue) * easedProgress
    } else {
      animatedPercent.value = startValue + (endValue - startValue) * easedProgress
    }

    if (progress < 1) {
      animationId.value = requestAnimationFrame(animateStep)
    } else {
      // 动画完成，反转方向
      isReversing.value = !isReversing.value
      // 递归调用以实现循环
      animate()
    }
  }

  animationId.value = requestAnimationFrame(animateStep)
}

// 检查是否需要减少动画 (简化版实现)
const checkMotionReduced = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 生命周期
onMounted(() => {
  if (!checkMotionReduced()) {
    animate()
  }
})

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
})

// 暴露给模板使用
defineExpose({
  animatedPercent,
})
</script>

<script lang="ts">
// 组件选项
export default {
  name: 'SpinLoading',
  inheritAttrs: false,
}
</script>

<style lang="less" scoped>
@import './index.less';
</style>
