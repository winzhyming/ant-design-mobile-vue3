<template>
  <div :class="classPrefix">
    <template v-for="point in sortedPoints" :key="point">
      <span
        v-if="marks[point] !== undefined && marks[point] !== null"
        :class="getMarkClassName(point)"
        :style="getMarkStyle(point)"
      >
        {{ marks[point] }}
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import classNames from 'classnames'
import { computed } from 'vue'
import type { SliderMarks } from './types'

const classPrefix = 'adm-slider-mark'

const props = defineProps<{
  min: number
  max: number
  marks: SliderMarks
  lowerBound: number
  upperBound: number
}>()

const range = computed(() => props.max - props.min)

const sortedPoints = computed(() => {
  return Object.keys(props.marks)
    .map(parseFloat)
    .sort((a, b) => a - b)
    .filter((point) => point >= props.min && point <= props.max)
})

function getMarkStyle(point: number) {
  return {
    left: `${((point - props.min) / range.value) * 100}%`,
  }
}

function getMarkClassName(point: number) {
  const isActive = point <= props.upperBound && point >= props.lowerBound
  return classNames({
    [`${classPrefix}-text`]: true,
    [`${classPrefix}-text-active`]: isActive,
  })
}
</script>
