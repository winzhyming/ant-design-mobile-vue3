<template>
  <svg viewBox="0 0 40 40" :style="props.style" :class="props.class">
    <path
      d="M20,9 C26.0752953,9 31,13.9247047 31,20 C31,26.0752953 26.0752953,31 20,31 C13.9247047,31 9,26.0752953 9,20 C9,13.9247047 13.9247047,9 20,9 Z"
      fill="currentColor"
    />
  </svg>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'

export interface IndeterminateIconProps {
  style?: CSSProperties
  class?: string
}

const props = withDefaults(defineProps<IndeterminateIconProps>(), {})
</script>

<style scoped>
svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
