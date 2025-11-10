<template>
  <div :class="classPrefix">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, provide } from 'vue'
import type { RadioGroupContext, RadioGroupProps, RadioValue } from './types'

const classPrefix = 'adm-radio-group'

const props = withDefaults(defineProps<RadioGroupProps>(), {
  defaultValue: null,
  disabled: false,
})

const emit = defineEmits<{
  'update:value': [value: RadioValue | null]
  change: [value: RadioValue | null]
}>()

// 状态管理 - 仿照React usePropsValue模式
const innerValue = ref<RadioValue | null>(props.value ?? props.defaultValue)
const isControlled = computed(() => props.value !== undefined)

const currentValue = computed(() => {
  return isControlled.value ? props.value : innerValue.value
})

const setValue = (newValue: RadioValue | null) => {
  if (!isControlled.value) {
    innerValue.value = newValue
  }
  emit('update:value', newValue)
  emit('change', newValue)

  if (props.onChange && newValue !== null) {
    props.onChange(newValue)
  }
}

// Group context methods
const check = (value: RadioValue) => {
  setValue(value)
}

const uncheck = () => {
  // Radio 通常不需要 uncheck，但为了接口一致性保留
}

// 创建context并提供给子组件
const groupContext = computed<RadioGroupContext>(() => ({
  value: currentValue.value === null ? [] : [currentValue.value],
  disabled: props.disabled,
  check,
  uncheck,
}))

// 使用 provide 提供给子组件
provide('adm-radio-group', groupContext)

// 暴露给父组件的方法
defineExpose({
  check,
  uncheck,
  value: currentValue,
  disabled: computed(() => props.disabled),
})
</script>
