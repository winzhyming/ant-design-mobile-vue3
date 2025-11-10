<template>
  <Picker ref="pickerRef" v-bind="pickerProps" :columns="columnsFn" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Picker from '../picker/picker.vue'
import type { PickerProps, PickerActions } from '../picker'
import { useColumnsFn, type CascadePickerOption } from './cascade-picker-utils'
// import type { PickerValue, PickerValueExtend } from '../picker-view/index'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CascadePickerActions extends PickerActions {}

export interface CascadePickerProps extends Omit<PickerProps, 'columns'> {
  options: CascadePickerOption[]
}

// const emit = defineEmits<{
//   'update:visible': [visible: boolean]
//   'update:value': [value: PickerValue[]]
//   select: [value: PickerValue[], extend: PickerValueExtend]
//   confirm: [value: PickerValue[], extend: PickerValueExtend]
//   cancel: []
//   close: []
// }>()

const props = defineProps<CascadePickerProps>()

// 提取除了 options 之外的所有属性，传递给 Picker
const pickerProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { options, ...rest } = props
  return rest
})

// 生成列函数
const columnsFn = computed(() => useColumnsFn(props.options))

// Picker 组件引用
const pickerRef = ref<{ actions: PickerActions }>()

// 暴露 actions 给父组件
const actions = computed<CascadePickerActions>(() => ({
  open: () => pickerRef.value?.actions.open(),
  close: () => pickerRef.value?.actions.close(),
  toggle: () => pickerRef.value?.actions.toggle(),
}))

defineExpose({
  actions: actions.value,
  open: actions.value.open,
  close: actions.value.close,
  toggle: actions.value.toggle,
})
</script>

<style>
/* CascadePicker 直接使用 Picker 的样式，无需额外样式 */
</style>
