<template>
  <PickerView v-bind="pickerProps" :columns="columnFn" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PickerView from '../picker-view/picker-view.vue'
import type { PickerViewProps } from '../picker-view/types'
import { useColumnsFn, type CascadePickerOption } from '../cascade-picker/cascade-picker-utils'

export interface CascadePickerViewProps extends Omit<PickerViewProps, 'columns'> {
  options: CascadePickerOption[]
}

const props = defineProps<CascadePickerViewProps>()

// 提取除了 options 之外的所有属性，传递给 PickerView
const pickerProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { options, ...rest } = props
  return rest
})

// 生成列函数 - 直接传入响应式的 props.options
const columnFn = computed(() => useColumnsFn(props.options))
</script>

<style>
/* CascadePickerView 直接使用 PickerView 的样式，无需额外样式 */
</style>
