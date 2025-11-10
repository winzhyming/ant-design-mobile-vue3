<template>
  <div :class="containerClass" :style="nativeStyle">
    <div v-for="index in total" :key="index - 1" :class="getDotClass(index - 1)" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const classPrefix = 'adm-page-indicator'

export interface PageIndicatorProps {
  total: number
  current: number
  direction?: 'horizontal' | 'vertical'
  color?: 'primary' | 'white'
  // CSS Variables
  '--dot-color'?: string
  '--active-dot-color'?: string
  '--dot-size'?: string
  '--active-dot-size'?: string
  '--dot-border-radius'?: string
  '--active-dot-border-radius'?: string
  '--dot-spacing'?: string
}

const props = withDefaults(defineProps<PageIndicatorProps>(), {
  color: 'primary',
  direction: 'horizontal',
})

const containerClass = computed(() => [
  classPrefix,
  `${classPrefix}-${props.direction}`,
  `${classPrefix}-color-${props.color}`,
])

const getDotClass = (index: number) => [
  `${classPrefix}-dot`,
  {
    [`${classPrefix}-dot-active`]: props.current === index,
  },
]

const nativeStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props['--dot-color']) {
    style['--dot-color'] = props['--dot-color']
  }
  if (props['--active-dot-color']) {
    style['--active-dot-color'] = props['--active-dot-color']
  }
  if (props['--dot-size']) {
    style['--dot-size'] = props['--dot-size']
  }
  if (props['--active-dot-size']) {
    style['--active-dot-size'] = props['--active-dot-size']
  }
  if (props['--dot-border-radius']) {
    style['--dot-border-radius'] = props['--dot-border-radius']
  }
  if (props['--active-dot-border-radius']) {
    style['--active-dot-border-radius'] = props['--active-dot-border-radius']
  }
  if (props['--dot-spacing']) {
    style['--dot-spacing'] = props['--dot-spacing']
  }

  return style
})
</script>

<style lang="less" scoped>
@import './page-indicator.less';
</style>
