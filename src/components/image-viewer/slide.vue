<template>
  <div ref="controlRef" :class="`${classPrefix}-slide`" @click="handleTap">
    <div ref="imageWrapperRef" :class="`${classPrefix}-image-wrapper`" :style="imageWrapperStyle">
      <component
        v-if="props.imageRender"
        :is="props.imageRender(props.image, { index: props.index || 0 })"
      />
      <img
        v-else
        ref="imgRef"
        :src="props.image"
        draggable="false"
        @load="handleImageLoad"
        @error="handleImageError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type VNode, type CSSProperties } from 'vue'

const classPrefix = 'adm-image-viewer'

export interface SlideProps {
  image: string
  maxZoom: number | 'auto'
  onTap?: () => void
  onZoomChange?: (zoom: number) => void
  imageRender?: (image: string, { index }: { index: number }) => VNode
  index?: number
}

const props = withDefaults(defineProps<SlideProps>(), {
  maxZoom: 3,
  index: 0,
})

// Refs
const controlRef = ref<HTMLDivElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const imageWrapperRef = ref<HTMLDivElement | null>(null)

// State
const matrix = ref({
  a: 1, // scale x
  b: 0, // skew x
  c: 0, // skew y
  d: 1, // scale y
  e: 0, // translate x
  f: 0, // translate y
})

const imageLoaded = ref(false)
const imageSize = ref({ width: 0, height: 0 })
const controlSize = ref({ width: 0, height: 0 })

// Computed
const currentZoom = computed(() => matrix.value.a)

const imageWrapperStyle = computed((): CSSProperties => {
  // const { a, b, c, d, e, f } = matrix.value
  // return {
  //   transform: `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`,
  //   transformOrigin: 'center',
  //   transition: 'transform 0.3s ease-out',
  // }
  return {}
})

// Methods
const handleTap = () => {
  if (currentZoom.value <= 1) {
    props.onTap?.()
  } else {
    // Reset zoom on tap when zoomed in
    resetMatrix()
  }
}

const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  imageSize.value = {
    width: img.naturalWidth,
    height: img.naturalHeight,
  }
  imageLoaded.value = true
  fitImageToContainer()
}

const handleImageError = () => {
  console.error('Image failed to load:', props.image)
}

const resetMatrix = () => {
  matrix.value = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0,
  }
  props.onZoomChange?.(1)
}

const fitImageToContainer = () => {
  if (!imageLoaded.value || !controlRef.value) return

  const container = controlRef.value
  const containerRect = container.getBoundingClientRect()

  controlSize.value = {
    width: containerRect.width,
    height: containerRect.height,
  }

  // Calculate scale to fit image in container
  const scaleX = controlSize.value.width / imageSize.value.width
  const scaleY = controlSize.value.height / imageSize.value.height
  const scale = Math.min(scaleX, scaleY, 1) // Don't scale up

  matrix.value = {
    a: scale,
    b: 0,
    c: 0,
    d: scale,
    e: 0,
    f: 0,
  }
}

// Touch and drag handling (simplified)
let startDistance = 0
let startScale = 1
// let startCenter = { x: 0, y: 0 }

const getDistance = (touches: TouchList) => {
  if (touches.length < 2) return 0
  const touch1 = touches[0]
  const touch2 = touches[1]
  return Math.sqrt(
    Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2),
  )
}

// const getCenter = (touches: TouchList) => {
//   if (touches.length === 1) {
//     return { x: touches[0].clientX, y: touches[0].clientY }
//   }
//   if (touches.length === 2) {
//     return {
//       x: (touches[0].clientX + touches[1].clientX) / 2,
//       y: (touches[0].clientY + touches[1].clientY) / 2,
//     }
//   }
//   return { x: 0, y: 0 }
// }

const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length === 2) {
    event.preventDefault()
    startDistance = getDistance(event.touches)
    startScale = currentZoom.value
    // startCenter = getCenter(event.touches)
  }
}

const handleTouchMove = (event: TouchEvent) => {
  if (event.touches.length === 2 && startDistance > 0) {
    event.preventDefault()

    const distance = getDistance(event.touches)
    const scale = startScale * (distance / startDistance)

    // Apply zoom limits
    const maxZoom = props.maxZoom === 'auto' ? 3 : props.maxZoom
    const clampedScale = Math.max(0.5, Math.min(scale, maxZoom))

    matrix.value = {
      ...matrix.value,
      a: clampedScale,
      d: clampedScale,
    }

    props.onZoomChange?.(clampedScale)
  }
}

const handleTouchEnd = () => {
  startDistance = 0
  startScale = 1
}

// Lifecycle
onMounted(() => {
  if (controlRef.value) {
    controlRef.value.addEventListener('touchstart', handleTouchStart, { passive: false })
    controlRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
    controlRef.value.addEventListener('touchend', handleTouchEnd)

    // Handle window resize
    window.addEventListener('resize', fitImageToContainer)
  }
})

onUnmounted(() => {
  if (controlRef.value) {
    controlRef.value.removeEventListener('touchstart', handleTouchStart)
    controlRef.value.removeEventListener('touchmove', handleTouchMove)
    controlRef.value.removeEventListener('touchend', handleTouchEnd)
  }
  window.removeEventListener('resize', fitImageToContainer)
})
</script>

<style lang="less" scoped>
@import './image-viewer.less';
</style>
