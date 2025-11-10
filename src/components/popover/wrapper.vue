<template>
  <div ref="elementRef" style="display: contents">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

export interface WrapperRef {
  element: HTMLElement
}

defineOptions({
  name: 'Wrapper',
})

const elementRef = ref<HTMLElement | null>(null)
const actualElement = ref<HTMLElement | null>(null)

onMounted(() => {
  // 获取第一个子元素作为实际的触发元素
  if (elementRef.value && elementRef.value.children.length > 0) {
    actualElement.value = elementRef.value.children[0] as HTMLElement
  }
})

const getElement = (): HTMLElement | null => {
  return actualElement.value || null
}

defineExpose({
  element: computed(() => getElement()),
})
</script>
