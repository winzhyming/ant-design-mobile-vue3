<template>
  <div
    :class="`${classPrefix}-thumb-container`"
    :style="currentPosition"
    role="slider"
    :aria-label="ariaLabel"
    :aria-valuemax="max"
    :aria-valuemin="min"
    :aria-valuenow="value"
    :aria-disabled="disabled"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
  >
    <component
      v-if="renderPopoverContent"
      :is="Popover"
      :content="renderPopoverContent(value)"
      placement="top"
      :visible="residentPopover || dragging"
      mode="dark"
    >
      <div :class="`${classPrefix}-thumb`">
        <component v-if="icon" :is="icon" :class="`${classPrefix}-thumb-icon`" />
        <ThumbIcon v-else :class="`${classPrefix}-thumb-icon`" />
      </div>
    </component>
    <div v-else :class="`${classPrefix}-thumb`">
      <component v-if="icon" :is="icon" :class="`${classPrefix}-thumb-icon`" />
      <ThumbIcon v-else :class="`${classPrefix}-thumb-icon`" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, ref } from 'vue'
import ThumbIcon from './thumb-icon.vue'
import Popover from '../popover/popover.vue'

const classPrefix = 'adm-slider'

const props = defineProps<{
  value: number
  min: number
  max: number
  disabled: boolean
  trackRef: HTMLDivElement | null
  icon?: Component | string
  popover?: boolean | ((value: number) => Component | string)
  residentPopover?: boolean
}>()

const emit = defineEmits<{
  drag: [position: number, first: boolean, last: boolean]
}>()

const dragging = ref(false)
const prevValue = ref(props.value)

// 模拟 useConfig（需要根据你的项目实际情况调整）
const ariaLabel = computed(() => {
  // 这里应该从 locale 中获取，暂时硬编码
  return 'Slider'
})

const currentPosition = computed(() => ({
  left: `${((props.value - props.min) / (props.max - props.min)) * 100}%`,
  right: 'auto',
}))

const renderPopoverContent = computed(() => {
  if (typeof props.popover === 'function') {
    return props.popover
  }
  if (props.popover) {
    return (value: number) => value.toString()
  }
  return null
})

function handleMouseDown(event: MouseEvent) {
  if (props.disabled) return
  startDrag(event)
}

function handleTouchStart(event: TouchEvent) {
  if (props.disabled) return
  startDrag(event)
}

function startDrag(event: MouseEvent | TouchEvent) {
  prevValue.value = props.value
  dragging.value = true

  const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
    if (!props.trackRef) return

    const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX
    const startX = 'touches' in event ? event.touches[0].clientX : event.clientX

    const x = clientX - startX
    const sliderOffsetWidth = props.trackRef.offsetWidth
    if (!sliderOffsetWidth) return

    const diff = (x / Math.ceil(sliderOffsetWidth)) * (props.max - props.min)
    const newPosition = prevValue.value + diff

    emit('drag', newPosition, false, false)
  }

  const handleEnd = () => {
    dragging.value = false
    emit('drag', props.value, false, true)

    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleEnd)
    document.removeEventListener('touchmove', handleMove)
    document.removeEventListener('touchend', handleEnd)
  }

  // 首次拖动
  emit('drag', props.value, true, false)

  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleEnd)
  document.addEventListener('touchmove', handleMove)
  document.addEventListener('touchend', handleEnd)

  event.preventDefault()
}
</script>
