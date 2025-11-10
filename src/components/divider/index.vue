<template>
  <div
    :class="[
      classPrefix,
      `${classPrefix}-${direction}`,
      `${classPrefix}-${contentPosition}`,
      $attrs.class,
    ]"
    v-bind="$attrs"
  >
    <div v-if="$slots.default" :class="`${classPrefix}-content`">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const classPrefix = 'adm-divider'

interface DividerProps {
  contentPosition?: 'left' | 'right' | 'center'
  direction?: 'horizontal' | 'vertical'
}

const props = withDefaults(defineProps<DividerProps>(), {
  contentPosition: 'center',
  direction: 'horizontal',
})

const contentPosition = computed(() => props.contentPosition)
const direction = computed(() => props.direction)
</script>

<style lang="less" scoped>
@import './index.less';
</style>
