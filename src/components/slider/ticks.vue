<template>
  <div :class="`${classPrefix}-ticks`">
    <span
      v-for="point in props.points"
      :key="point"
      :class="getPointClassName(point)"
      :style="getPointStyle(point)"
    />
  </div>
</template>

<script setup lang="ts">
import classNames from 'classnames'
import { computed } from 'vue'

const classPrefix = 'adm-slider'

const props = defineProps<{
  points: number[]
  min: number
  max: number
  lowerBound: number
  upperBound: number
}>()

const range = computed(() => props.max - props.min)

function getPointStyle(point: number) {
  const offset = `${(Math.abs(point - props.min) / range.value) * 100}%`
  return { left: offset }
}

function getPointClassName(point: number) {
  const isActived = point <= props.upperBound && point >= props.lowerBound
  return classNames({
    [`${classPrefix}-tick`]: true,
    [`${classPrefix}-tick-active`]: isActived,
  })
}
</script>
