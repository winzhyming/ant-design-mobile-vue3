<template>
  <div :class="`${classPrefix}-item`" :style="itemStyle" @click="onItemClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const classPrefix = 'adm-grid'

interface GridItemProps {
  span?: number
  onClick?: (event: MouseEvent) => void
}

const props = withDefaults(defineProps<GridItemProps>(), {
  span: 1,
})

const itemStyle = computed(() => ({
  '--item-span': props.span,
}))

function onItemClick(event: MouseEvent) {
  props.onClick?.(event)
}
</script>

<style lang="less" scoped>
@class-prefix-grid: ~'adm-grid';

.@{class-prefix-grid}-item {
  grid-column-end: span var(--item-span);
}
</style>
