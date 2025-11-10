<template>
  <Teleport :to="containerElement" v-if="containerElement">
    <Mask
      :visible="props.visible"
      :disableBodyScroll="false"
      opacity="thick"
      :afterClose="props.afterClose"
      destroyOnClose
      :class="props.classNames?.mask"
    >
      <div :class="[`${classPrefix}-content`, props.classNames?.body]">
        <Slides
          v-if="props.images"
          ref="slidesRef"
          :images="props.images"
          :defaultIndex="currentIndex"
          :onIndexChange="handleSlideChange"
          :onTap="props.onClose"
          :maxZoom="props.maxZoom"
          :imageRender="props.imageRender"
        />
      </div>

      <div v-if="props.images" :class="`${classPrefix}-footer`">
        <slot name="foot" :image="props.images[currentIndex]" :index="currentIndex" />
        <SafeArea position="bottom" />
      </div>
    </Mask>
  </Teleport>

  <!-- Fallback for SSR or when no container -->
  <Mask
    v-else
    :visible="props.visible"
    :disableBodyScroll="false"
    opacity="thick"
    :afterClose="props.afterClose"
    destroyOnClose
    :class="props.classNames?.mask"
  >
    <div :class="[`${classPrefix}-content`, props.classNames?.body]">
      <Slides
        v-if="props.images"
        ref="slidesRef"
        :images="props.images"
        :defaultIndex="currentIndex"
        :onIndexChange="handleSlideChange"
        :onTap="props.onClose"
        :maxZoom="props.maxZoom"
        :imageRender="props.imageRender"
      />
    </div>

    <div v-if="props.images" :class="`${classPrefix}-footer`">
      <slot name="footer" :image="props.images[currentIndex]" :index="currentIndex" />
      <SafeArea position="bottom" />
    </div>
  </Mask>
</template>

<script setup lang="ts">
import { ref, computed, watch, type VNode } from 'vue'
import Mask from '../mask/index.vue'
import SafeArea from '../safe-area/index.vue'
import Slides from './slides.vue'

const classPrefix = 'adm-image-viewer'

export interface MultiImageViewerProps {
  images?: string[]
  defaultIndex?: number
  maxZoom?: number | 'auto'
  getContainer?: HTMLElement | (() => HTMLElement) | null
  visible?: boolean
  onClose?: () => void
  afterClose?: () => void
  onIndexChange?: (index: number) => void
  imageRender?: (image: string, { index }: { index: number }) => VNode
  classNames?: {
    mask?: string
    body?: string
  }
}

export interface MultiImageViewerRef {
  swipeTo: (index: number, immediate?: boolean) => void
}

// Props with defaults
const props = withDefaults(defineProps<MultiImageViewerProps>(), {
  maxZoom: 3,
  getContainer: null,
  visible: false,
  defaultIndex: 0,
})

// Refs
const slidesRef = ref<{ swipeTo: (index: number, immediate?: boolean) => void } | null>(null)
const currentIndex = ref(props.defaultIndex)

// Watch for defaultIndex changes
watch(
  () => props.defaultIndex,
  (newIndex) => {
    currentIndex.value = newIndex
  },
)

// Helper function to resolve container
const resolveContainer = (getContainer: HTMLElement | (() => HTMLElement) | null): HTMLElement => {
  if (typeof getContainer === 'function') {
    return getContainer()
  }
  if (getContainer) {
    return getContainer
  }
  return document.body
}

// Computed container element
const containerElement = computed(() => {
  if (typeof window === 'undefined') return null
  if (!props.getContainer) return null

  try {
    return resolveContainer(props.getContainer)
  } catch {
    return document.body
  }
})

// Methods
const handleSlideChange = (newIndex: number) => {
  if (newIndex === currentIndex.value) return
  currentIndex.value = newIndex
  props.onIndexChange?.(newIndex)
}

const swipeTo = (index: number, immediate = false) => {
  const images = props.images || []
  const boundIndex = Math.max(0, Math.min(index, images.length - 1))
  currentIndex.value = boundIndex
  slidesRef.value?.swipeTo(boundIndex, immediate)
}

// Expose methods
defineExpose<MultiImageViewerRef>({
  swipeTo,
})
</script>

<style lang="less" scoped>
@import './image-viewer.less';
</style>
