<template>
  <div :class="classPrefix" :style="styleObject">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { toCSSLength } from '../../utils/to-css-length'

const classPrefix = 'adm-grid'

interface GridProps {
  columns: number
  gap?: number | string | [number | string, number | string]
}

const props = defineProps<GridProps>()

const styleObject = computed(() => {
  const style: Record<string, string> = {
    '--columns': props.columns.toString(),
  }
  if (props.gap !== undefined) {
    if (Array.isArray(props.gap)) {
      style['--gap-horizontal'] = toCSSLength(props.gap[0])
      style['--gap-vertical'] = toCSSLength(props.gap[1])
    } else {
      style['--gap'] = toCSSLength(props.gap)
    }
  }
  return style
})
</script>

<style lang="less" scoped>
@class-prefix-grid: ~'adm-grid';

.@{class-prefix-grid} {
  --gap: 0;
  --gap-horizontal: var(--gap);
  --gap-vertical: var(--gap);

  display: grid;
  grid-gap: 10px;
  column-gap: var(--gap-horizontal);
  row-gap: var(--gap-vertical);
  grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
  align-items: stretch;
}
</style>
