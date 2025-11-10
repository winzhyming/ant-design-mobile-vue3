<template>
  <div :class="rootClass" :style="rootStyle">
    <template v-if="showTitle">
      <SkeletonTitle
        :animated="props.animated"
        :width="titleWidth"
        :class="`${classPrefix}-title`"
      />
    </template>
    <template v-if="showParagraph">
      <SkeletonParagraph
        :animated="props.animated"
        :line-count="paragraphRows"
        :width="paragraphWidth"
        :class="`${classPrefix}-paragraph`"
      />
    </template>
    <template v-if="!showTitle && !showParagraph">
      <div :class="`${classPrefix}-content`" :style="contentStyle" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SkeletonParagraph from './skeletonParagraph.vue'
import SkeletonTitle from './skeletonTitle.vue'
import type { SkeletonProps } from './types'

const classPrefix = 'adm-skeleton'

const props = defineProps<SkeletonProps>()

const rootClass = computed(() => [
  classPrefix,
  props.animated || props.active ? `${classPrefix}-animated` : '',
  props.round ? `${classPrefix}-round` : '',
  props.class,
])

const rootStyle = computed(() => ({
  ...props.style,
  width: props.width,
  height: props.height,
}))

const showTitle = computed(() => props.title)
const showParagraph = computed(() => !!props.paragraph)

const titleWidth = computed(() => {
  if (typeof props.title === 'object' && props.title && 'width' in props.title) {
    return props.title.width
  }
  return undefined
})

const paragraphRows = computed(() => {
  if (typeof props.paragraph === 'object' && props.paragraph && 'rows' in props.paragraph) {
    return props.paragraph.rows ?? 3
  }
  return 3
})

const paragraphWidth = computed(() => {
  if (typeof props.paragraph === 'object' && props.paragraph && 'width' in props.paragraph) {
    return props.paragraph.width
  }
  return undefined
})

const contentStyle = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.round ? '999px' : undefined,
}))
</script>
