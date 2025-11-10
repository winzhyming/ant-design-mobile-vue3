<template>
  <div
    :class="[
      'adm-skeleton',
      classPrefix,
      $props.class,
      props.animated ? `adm-skeleton-animated` : '',
    ]"
    :style="titleStyle"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SkeletonTitleProps } from './types'

const classPrefix = 'adm-skeleton-title'
const props = defineProps<SkeletonTitleProps>()

const titleStyle = computed(() => ({
  ...props.style,
  width: props.width,
}))
</script>
