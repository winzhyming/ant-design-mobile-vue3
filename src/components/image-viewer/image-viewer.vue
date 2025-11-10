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
        <Slide
          v-if="props.image || typeof props.imageRender === 'function'"
          :image="props.image"
          :onTap="props.onClose"
          :maxZoom="props.maxZoom"
          :imageRender="props.imageRender"
        />

        <div v-if="props.image" :class="`${classPrefix}-footer`">
          <slot name="footer" :image="props.image" />
          <SafeArea position="bottom" />
        </div>
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
      <Slide
        v-if="props.image || typeof props.imageRender === 'function'"
        :image="props.image"
        :onTap="props.onClose"
        :maxZoom="props.maxZoom"
        :imageRender="props.imageRender"
      />

      <div v-if="props.image" :class="`${classPrefix}-footer`">
        <slot name="footer" :image="props.image" />
        <SafeArea position="bottom" />
      </div>
    </div>
  </Mask>
</template>

<script setup lang="ts">
import { computed, type VNode } from 'vue'
import Mask from '../mask/index.vue'
import SafeArea from '../safe-area/index.vue'
import Slide from './slide.vue'

const classPrefix = 'adm-image-viewer'

export interface ImageViewerProps {
  image: string
  maxZoom?: number | 'auto'
  getContainer?: HTMLElement | (() => HTMLElement) | null
  visible?: boolean
  onClose?: () => void
  afterClose?: () => void
  imageRender?: (image: string, { index }: { index: number }) => VNode
  classNames?: {
    mask?: string
    body?: string
  }
}

// Props with defaults
const props = withDefaults(defineProps<ImageViewerProps>(), {
  maxZoom: 3,
  getContainer: null,
  visible: false,
})

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
</script>

<style lang="less" scoped>
@import './image-viewer.less';
</style>
