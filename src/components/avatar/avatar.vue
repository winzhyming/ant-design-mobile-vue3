<template>
  <Image
    :class="classPrefix"
    :src="props.src"
    :fallback="fallbackComponent"
    :placeholder="fallbackComponent"
    :alt="props.alt"
    :lazy="props.lazy"
    :fit="props.fit"
    :style="nativeStyle"
    @click="props.onClick"
    @error="props.onError"
    @load="props.onLoad"
  />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import Image from '../image/index.vue'
import FallbackIcon from './fallback-icon.vue'

const classPrefix = 'adm-avatar'

export interface AvatarProps {
  src: string
  fallback?: string | Component
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  // 从 Image 组件继承的 props
  alt?: string
  lazy?: boolean
  onClick?: (e: MouseEvent) => void
  onError?: (e: Event) => void
  onLoad?: (e: Event) => void
  // CSS Variables
  '--size'?: string
  '--border-radius'?: string
}

const props = withDefaults(defineProps<AvatarProps>(), {
  fit: 'cover',
  fallback: undefined,
})

const fallbackComponent = computed(() => {
  return props.fallback || FallbackIcon
})

const nativeStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props['--size']) {
    style['--size'] = props['--size']
  }
  if (props['--border-radius']) {
    style['--border-radius'] = props['--border-radius']
  }

  return style
})
</script>
<style lang="less" scoped>
@import './avatar.less';
</style>
