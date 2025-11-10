<template>
  <div ref="lazyRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  active: []
}>()

const lazyRef = ref<HTMLDivElement>()
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!lazyRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          emit('active')
          observer?.disconnect()
        }
      })
    },
    {
      threshold: 0.1,
    },
  )

  observer.observe(lazyRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>
