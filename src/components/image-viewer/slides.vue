<template>
  <div
    ref="containerRef"
    :class="`${classPrefix}-slides`"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <!-- 指示器 -->
    <div :class="`${classPrefix}-indicator`">{{ displayIndex }} / {{ props.images.length }}</div>

    <!-- 滑动容器 -->
    <div :class="`${classPrefix}-slides-inner`" :style="slidesInnerStyle">
      <Slide
        v-for="(image, index) in props.images"
        :key="index"
        :image="image"
        :index="index"
        :maxZoom="props.maxZoom"
        :onTap="props.onTap"
        :imageRender="props.imageRender"
        :onZoomChange="handleZoomChange"
        :dragLockRef="dragLockRef"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type VNode, type CSSProperties } from 'vue'
import Slide from './slide.vue'

const classPrefix = 'adm-image-viewer'

export interface SlidesProps {
  images: string[]
  onTap?: () => void
  maxZoom: number | 'auto'
  defaultIndex: number
  onIndexChange?: (index: number) => void
  imageRender?: (image: string, { index }: { index: number }) => VNode
}

export interface SlidesRef {
  swipeTo: (index: number, immediate?: boolean) => void
}

const props = defineProps<SlidesProps>()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const dragLockRef = ref(false)

// State for animation
const currentX = ref(0)
const isDragging = ref(false)
const slideWidth = ref(0)

// Touch handling
const startX = ref(0)
const startOffsetX = ref(0)
const velocity = ref(0)
const lastTouchTime = ref(0)

// Helper function: bound
const bound = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value))
}

// Helper function: convertPx (simplified)
const convertPx = (px: number): number => {
  return px
}

// Computed
const count = computed(() => props.images.length)

const displayIndex = computed(() => {
  const index = bound(Math.round(currentX.value / slideWidth.value), 0, count.value - 1)
  return index + 1
})

const slidesInnerStyle = computed(
  (): CSSProperties => ({
    transform: `translateX(${-currentX.value}px)`,
    transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  }),
)

// Methods
const updateSlideWidth = () => {
  slideWidth.value = window.innerWidth + convertPx(16)
  // Initialize position
  currentX.value = props.defaultIndex * slideWidth.value
}

const swipeTo = (index: number, immediate = false) => {
  const boundedIndex = bound(index, 0, count.value - 1)
  props.onIndexChange?.(boundedIndex)

  const targetX = boundedIndex * slideWidth.value

  if (immediate) {
    isDragging.value = true
    currentX.value = targetX
    setTimeout(() => {
      isDragging.value = false
    }, 0)
  } else {
    isDragging.value = false
    currentX.value = targetX
  }
}

const handleZoomChange = (zoom: number) => {
  if (zoom !== 1) {
    const index = Math.round(currentX.value / slideWidth.value)
    currentX.value = index * slideWidth.value
  }
}

// Touch events
const handleTouchStart = (event: TouchEvent) => {
  if (dragLockRef.value || event.touches.length !== 1) return

  isDragging.value = true
  startX.value = event.touches[0].clientX
  startOffsetX.value = currentX.value
  lastTouchTime.value = Date.now()
  velocity.value = 0
}

const handleTouchMove = (event: TouchEvent) => {
  if (!isDragging.value || dragLockRef.value || event.touches.length !== 1) return

  const deltaX = startX.value - event.touches[0].clientX
  const newOffsetX = startOffsetX.value + deltaX

  // Calculate velocity
  const now = Date.now()
  const timeDelta = now - lastTouchTime.value
  if (timeDelta > 0) {
    velocity.value = deltaX / timeDelta
  }
  lastTouchTime.value = now

  // Apply bounds with rubberband effect
  const maxOffset = (count.value - 1) * slideWidth.value
  let boundedOffsetX = newOffsetX

  if (newOffsetX < 0) {
    // Left rubberband
    boundedOffsetX = newOffsetX * 0.3
  } else if (newOffsetX > maxOffset) {
    // Right rubberband
    const excess = newOffsetX - maxOffset
    boundedOffsetX = maxOffset + excess * 0.3
  }

  currentX.value = boundedOffsetX
}

const handleTouchEnd = () => {
  if (!isDragging.value || dragLockRef.value) return

  const offsetX = currentX.value
  const minIndex = Math.floor(offsetX / slideWidth.value)
  const maxIndex = minIndex + 1

  // Calculate velocity offset
  const velocityOffset =
    Math.min(Math.abs(velocity.value) * 2000, slideWidth.value) * (velocity.value > 0 ? 1 : -1)

  const targetIndex = bound(
    Math.round((offsetX + velocityOffset) / slideWidth.value),
    minIndex,
    maxIndex,
  )

  swipeTo(targetIndex)
}

// Watch for defaultIndex changes
watch(
  () => props.defaultIndex,
  (newIndex) => {
    swipeTo(newIndex, true)
  },
  { immediate: true },
)

// Lifecycle
onMounted(() => {
  updateSlideWidth()
  window.addEventListener('resize', updateSlideWidth)
})

// Expose methods
defineExpose<SlidesRef>({
  swipeTo,
})
</script>

<style lang="less" scoped>
@import './image-viewer.less';
</style>
