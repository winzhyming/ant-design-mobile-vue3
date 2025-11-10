<template>
  <div
    :class="[
      classPrefix,
      {
        [`${classPrefix}-full-page`]: fullPage,
      },
      className,
    ]"
    :style="mergedStyle"
  >
    <div :class="`${classPrefix}-image`">
      <component v-if="isComponent(imageNode)" :is="imageNode" />
      <img v-else-if="typeof imageNode === 'string'" :src="imageNode" alt="error block image" />
      <component v-else :is="imageNode" />
    </div>

    <div :class="`${classPrefix}-description`">
      <div v-if="displayTitle != null" :class="`${classPrefix}-description-title`">
        <component v-if="isComponent(displayTitle)" :is="displayTitle" />
        <span v-else>{{ displayTitle }}</span>
      </div>

      <div v-if="displayDescription != null" :class="`${classPrefix}-description-subtitle`">
        <component v-if="isComponent(displayDescription)" :is="displayDescription" />
        <span v-else>{{ displayDescription }}</span>
      </div>
    </div>

    <div v-if="$slots.default" :class="`${classPrefix}-content`">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import type { Component } from 'vue'

export type ErrorBlockStatus = 'default' | 'disconnected' | 'empty' | 'busy'

export type ImageRecord = Partial<Record<ErrorBlockStatus, string | Component>>

export interface ErrorBlockProps {
  status?: ErrorBlockStatus
  title?: string | Component
  image?: string | Component
  description?: string | Component
  fullPage?: boolean

  // CSS Variables
  '--image-height'?: string
  '--image-height-full-page'?: string
  '--image-width'?: string
  '--image-width-full-page'?: string

  // Native props
  className?: string
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useConfig } from '../config-provider/useConfig'
import { DefaultImage, DisconnectedImage, EmptyImage, BusyImage } from './images'

const classPrefix = 'adm-error-block'

const props = withDefaults(defineProps<ErrorBlockProps>(), {
  status: 'default',
})

// Get config
const { locale } = useConfig()

// Image record
const imageRecord = {
  default: DefaultImage,
  disconnected: DisconnectedImage,
  empty: EmptyImage,
  busy: BusyImage,
}

// Computed values
const contentPack = computed(() => locale.ErrorBlock[props.status])

const displayTitle = computed(() => {
  return props.title !== undefined ? props.title : contentPack.value.title
})

const displayDescription = computed(() => {
  return props.description !== undefined ? props.description : contentPack.value.description
})

const imageNode = computed(() => {
  return props.image ?? imageRecord[props.status]
})

// Helper function to check if value is a component
const isComponent = (value: string | Component) => {
  return value && typeof value === 'object' && (value.render || value.setup || value.__vccOpts)
}

// Merged styles for CSS variables
const mergedStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props['--image-height']) style['--image-height'] = props['--image-height']
  if (props['--image-height-full-page'])
    style['--image-height-full-page'] = props['--image-height-full-page']
  if (props['--image-width']) style['--image-width'] = props['--image-width']
  if (props['--image-width-full-page'])
    style['--image-width-full-page'] = props['--image-width-full-page']

  return style
})
</script>

<style scoped>
@import './error-block.less';
</style>
