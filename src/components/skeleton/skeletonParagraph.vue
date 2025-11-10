<template>
  <div :class="[classPrefix, $props.class]">
    <div
      v-for="i in lineCountArr"
      :key="i"
      :class="`adm-skeleton ${classPrefix}-line ${props.animated ? 'adm-skeleton-animated' : ''}`"
      :style="getlineCountStyle(i - 1)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { generateIntArray } from '../../utils/generate-int-array'

const classPrefix = 'adm-skeleton-paragraph'

const props = defineProps<{
  lineCount?: number
  width?: string | number | (string | number)[]
  class?: string
  animated?: boolean
}>()

const lineCount = computed(() => props.lineCount ?? 3)
const lineCountArr = computed(() => generateIntArray(1, lineCount.value))

const getlineCountStyle = (idx: number) => {
  if (!props.width) return undefined
  if (Array.isArray(props.width)) {
    return { width: props.width[idx] }
  }
  if (typeof props.width === 'string' || typeof props.width === 'number') {
    if (idx === lineCount.value - 1) {
      return { width: props.width }
    }
  }
  return undefined
}
</script>
