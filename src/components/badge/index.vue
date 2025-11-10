<template>
  <div
    v-if="hasChildren"
    :class="[`${classPrefix}-wrapper`, props.wrapperClassName]"
    :style="props.wrapperStyle"
  >
    <slot />
    <div v-if="showBadge" :class="badgeClass" :style="badgeStyle">
      <div v-if="!isDot" :class="`${classPrefix}-content`">{{ props.content }}</div>
    </div>
  </div>
  <div v-else-if="showBadge" :class="badgeClass" :style="badgeStyle">
    <div v-if="!isDot" :class="`${classPrefix}-content`">{{ props.content }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import classNames from 'classnames'
import { Dot as dot } from './dot'

const classPrefix = 'adm-badge'

interface BadgeProps {
  content?: string | number | typeof dot
  color?: string
  bordered?: boolean
  wrapperClassName?: string
  wrapperStyle?: Record<string, string | number>
  style?: Record<string, string | number>
}

const props = defineProps<BadgeProps>()
const slots = useSlots()
const hasChildren = computed(() => !!slots.default)
const isDot = computed(() => props.content === dot)
const showBadge = computed(() => props.content || props.content === 0)

const badgeClass = computed(() =>
  classNames(classPrefix, {
    [`${classPrefix}-fixed`]: hasChildren.value,
    [`${classPrefix}-dot`]: isDot.value,
    [`${classPrefix}-bordered`]: props.bordered,
  }),
)

const badgeStyle = computed(() => ({
  '--color': props.color,
  ...(props.style || {}),
}))
</script>

<style lang="less" scoped>
@import './index.less';
</style>
