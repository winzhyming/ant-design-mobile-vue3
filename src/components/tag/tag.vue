<template>
  <span :class="tagClass" :style="tagStyle" @click="props.onClick">
    <slot />
  </span>
</template>

<script lang="ts">
// 标签颜色类型
export type TagColor = 'default' | 'primary' | 'success' | 'warning' | 'danger' | string

// 填充样式类型
export type TagFill = 'solid' | 'outline'

export interface TagProps {
  color?: TagColor
  fill?: TagFill
  round?: boolean
  onClick?: (e: MouseEvent) => void
  // CSS Variables
  '--border-color'?: string
  '--background-color'?: string
  '--text-color'?: string
  '--border-radius'?: string
}

// 颜色映射
export const colorRecord: Record<string, string> = {
  default: 'var(--adm-color-text-secondary, #666666)',
  primary: 'var(--adm-color-primary, #1677ff)',
  success: 'var(--adm-color-success, #00b578)',
  warning: 'var(--adm-color-warning, #ff8f1f)',
  danger: 'var(--adm-color-danger, #ff3141)',
}
</script>

<script setup lang="ts">
import { computed } from 'vue'

const classPrefix = 'adm-tag'

const props = withDefaults(defineProps<TagProps>(), {
  color: 'default',
  fill: 'solid',
  round: false,
})

const tagClass = computed(() => [
  classPrefix,
  {
    [`${classPrefix}-round`]: props.round,
  },
])

const resolvedColor = computed(() => {
  return colorRecord[props.color] ?? props.color
})

const tagStyle = computed(() => {
  const style: Record<string, string> = {
    '--border-color': resolvedColor.value,
    '--text-color': props.fill === 'outline' ? resolvedColor.value : '#ffffff',
    '--background-color': props.fill === 'outline' ? 'transparent' : resolvedColor.value,
  }

  // 添加用户自定义的 CSS 变量
  if (props['--border-color']) {
    style['--border-color'] = props['--border-color']
  }
  if (props['--background-color']) {
    style['--background-color'] = props['--background-color']
  }
  if (props['--text-color']) {
    style['--text-color'] = props['--text-color']
  }
  if (props['--border-radius']) {
    style['--border-radius'] = props['--border-radius']
  }

  return style
})
</script>

<style lang="less" scoped>
@import './tag.less';
</style>
