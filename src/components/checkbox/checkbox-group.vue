<template>
  <div :class="classPrefix">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, provide } from 'vue'
import type { CheckboxGroupContext, CheckboxGroupProps, CheckboxValue } from './types'

const classPrefix = 'adm-checkbox-group'

const props = withDefaults(defineProps<CheckboxGroupProps>(), {
  defaultValue: () => [],
  disabled: false,
})

const emit = defineEmits<{
  'update:value': [value: CheckboxValue[]]
  change: [value: CheckboxValue[]]
}>()

// 状态管理 - 仿照React usePropsValue模式
const innerValue = ref<CheckboxValue[]>([...props.defaultValue])
const isControlled = computed(() => props.value !== undefined)

const currentValue = computed(() => {
  return isControlled.value ? props.value || [] : innerValue.value
})

const setValue = (newValue: CheckboxValue[]) => {
  if (!isControlled.value) {
    innerValue.value = [...newValue]
  }
  emit('update:value', newValue)
  emit('change', newValue)

  if (props.onChange) {
    props.onChange(newValue)
  }
}

// Group context methods
const check = (value: CheckboxValue) => {
  const current = [...currentValue.value]
  if (!current.includes(value)) {
    current.push(value)
    setValue(current)
  }
}

const uncheck = (value: CheckboxValue) => {
  const current = currentValue.value.filter((item) => item !== value)
  setValue(current)
}

// 创建context并提供给子组件
const groupContext = computed<CheckboxGroupContext>(() => ({
  value: currentValue,
  disabled: props.disabled,
  check,
  uncheck,
}))

// 使用 provide 而不是 props 传递
provide('adm-checkbox-group', groupContext)

// 暴露给父组件的方法
defineExpose({
  check,
  uncheck,
  value: currentValue,
  disabled: computed(() => props.disabled),
})
</script>

<style lang="less">
.adm-checkbox-group {
  .adm-checkbox {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
