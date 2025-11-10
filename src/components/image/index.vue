<script setup lang="ts">
import { ref, computed, watch, onMounted, h, type Component } from 'vue'
import { toCSSLength } from '../../utils/to-css-length'
import LazyDetector from './LazyDetector.vue'
import ImageIcon from './ImageIcon.vue'
import BrokenImageIcon from './BrokenImageIcon.vue'

const classPrefix = 'adm-image'

export interface ImageProps {
  src?: string
  alt?: string
  width?: number | string
  height?: number | string
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  placeholder?: string | Component
  fallback?: string | Component
  lazy?: boolean
  draggable?: boolean
  onClick?: (event: MouseEvent) => void
  onError?: (event: Event) => void
  onLoad?: (event: Event) => void
  onContainerClick?: (event: MouseEvent) => void
  style?: Record<string, string | number>
  className?: string
  // HTML img attributes
  crossOrigin?: '' | 'anonymous' | 'use-credentials'
  decoding?: 'async' | 'auto' | 'sync'
  loading?: 'eager' | 'lazy'
  referrerPolicy?: ReferrerPolicy
  sizes?: string
  srcSet?: string
  useMap?: string
  id?: string
}

const props = withDefaults(defineProps<ImageProps>(), {
  fit: 'fill',
  lazy: false,
  draggable: false,
  style: () => ({}),
  className: '',
})

// 默认的 placeholder 和 fallback
const defaultPlaceholder = h('div', { class: `${classPrefix}-tip` }, h(ImageIcon))
const defaultFallback = h('div', { class: `${classPrefix}-tip` }, h(BrokenImageIcon))

const loaded = ref(false)
const failed = ref(false)
const initialized = ref(!props.lazy)
const containerRef = ref<HTMLDivElement>()
const imgRef = ref<HTMLImageElement>()

// 计算当前的 src 和 srcSet
const currentSrc = computed(() => (initialized.value ? props.src : undefined))
const currentSrcSet = computed(() => (initialized.value ? props.srcSet : undefined))

// 监听 src 变化，重置状态
watch(
  () => props.src,
  () => {
    loaded.value = false
    failed.value = false
  },
)

// 容器样式
const containerStyle = computed(() => {
  const style: Record<string, string | number> = { ...props.style }

  if (props.width) {
    style['--width'] = toCSSLength(props.width)
    style['width'] = toCSSLength(props.width)
  }
  if (props.height) {
    style['--height'] = toCSSLength(props.height)
    style['height'] = toCSSLength(props.height)
  }

  return style
})

// 图片样式
const imgStyle = computed(() => ({
  objectFit: props.fit,
  display: loaded.value ? 'block' : 'none',
}))

// 处理图片加载完成
const handleLoad = (event: Event) => {
  loaded.value = true
  props.onLoad?.(event)
}

// 处理图片加载失败
const handleError = (event: Event) => {
  failed.value = true
  props.onError?.(event)
}

// 处理容器点击
const handleContainerClick = (event: MouseEvent) => {
  props.onContainerClick?.(event)
}

// 处理懒加载激活
const handleLazyActive = () => {
  initialized.value = true
}

// 检查服务端渲染后的图片状态
onMounted(() => {
  // 处理 Next.js SSR 的情况
  if (imgRef.value?.complete) {
    loaded.value = true
  }
})

// 获取 placeholder 和 fallback
const placeholder = computed(() => props.placeholder ?? defaultPlaceholder)
const fallback = computed(() => props.fallback ?? defaultFallback)
</script>

<template>
  <div
    ref="containerRef"
    :class="classPrefix"
    :style="containerStyle"
    @click="handleContainerClick"
  >
    <LazyDetector v-if="lazy && !initialized" @active="handleLazyActive" />
    <template v-if="failed">
      <component v-if="typeof fallback === 'object'" :is="fallback" />
      <template v-else>{{ fallback }}</template>
    </template>
    <template v-else>
      <template v-if="!loaded">
        <component v-if="typeof placeholder === 'object'" :is="placeholder" />
        <template v-else>{{ placeholder }}</template>
      </template>
      <img
        ref="imgRef"
        :id="id"
        :class="`${classPrefix}-img`"
        :src="currentSrc"
        :alt="alt"
        :style="imgStyle"
        :crossorigin="crossOrigin"
        :decoding="decoding"
        :loading="loading"
        :referrerpolicy="referrerPolicy"
        :sizes="sizes"
        :srcset="currentSrcSet"
        :usemap="useMap"
        :draggable="draggable"
        @click="onClick"
        @load="handleLoad"
        @error="handleError"
      />
    </template>
  </div>
</template>

<style lang="less" scoped>
@import './index.less';
</style>
