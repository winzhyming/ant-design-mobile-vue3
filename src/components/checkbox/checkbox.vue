<template>
  <label :class="labelClasses" @click="handleClick" :style="props.style || {}">
    <input
      type="checkbox"
      :checked="finalChecked"
      :disabled="finalDisabled"
      :id="id"
      @change="handleChange"
      class="adm-checkbox-nativeInput"
    />

    <!-- 自定义图标渲染 -->
    <div v-if="icon" :class="`${classPrefix}-custom-icon`">
      <component :is="icon(!!finalChecked, indeterminate)" />
    </div>

    <!-- 默认图标渲染 -->
    <div v-else :class="`${classPrefix}-icon`">
      <IndeterminateIcon v-if="indeterminate" />
      <CheckIcon v-else-if="finalChecked" />
    </div>

    <!-- 内容区域 -->
    <div v-if="$slots.default" :class="`${classPrefix}-content`">
      <slot />
    </div>
  </label>
</template>

<script setup lang="ts">
import type { CSSProperties, Component, Ref } from 'vue'
import { computed, ref, inject } from 'vue'
import CheckIcon from './check-icon.vue'
import IndeterminateIcon from './indeterminate-icon.vue'
import type { CheckboxGroupContext } from './types'

const classPrefix = 'adm-checkbox'

export interface CheckboxProps {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  value?: string | number
  indeterminate?: boolean
  block?: boolean
  id?: string
  icon?: (checked: boolean, indeterminate: boolean) => Component
  onClick?: (event: MouseEvent) => void
  // CSS 变量支持Component
  style?: CSSProperties & {
    '--icon-size'?: string
    '--font-size'?: string
    '--gap'?: string
  }
  class?: string
}

const props = withDefaults(defineProps<CheckboxProps>(), {
  defaultChecked: false,
  checked: undefined,
  indeterminate: false,
})

const emit = defineEmits<{
  'update:checked': [value: boolean]
  change: [value: boolean]
}>()

// 注入 group context
const groupContext = inject<Ref<CheckboxGroupContext | undefined> | undefined>(
  'adm-checkbox-group',
  undefined,
)

// 简化实现，专注于单个复选框功能
// 在真实Vue环境中可以添加inject来支持group功能

// 内部状态管理
const innerChecked = ref(props.defaultChecked)
const isControlled = computed(() => props.checked !== undefined)

// 受控/非受控状态计算
const finalChecked = computed(() => {
  // 如果在 group 中，根据 group 的 value 和当前的 value 确定状态
  if (groupContext && props.value !== undefined) {
    return (groupContext.value?.value?.value || []).includes(props.value)
  }
  // 如果传入了 checked 属性，则为受控模式
  if (isControlled.value) {
    return props.checked
  }
  // 否则为非受控模式，使用内部状态
  return innerChecked.value
})

const setChecked = (newValue: boolean) => {
  // 如果在 group 中，使用 group 的方法
  if (groupContext && props.value !== undefined) {
    if (newValue) {
      groupContext.value?.check(props.value)
    } else {
      groupContext.value?.uncheck(props.value)
    }
    return
  }

  // 非受控模式下更新内部状态
  if (props.checked === undefined) {
    innerChecked.value = newValue
  }

  // 总是发出事件
  emit('update:checked', newValue)
  emit('change', newValue)

  if (props.onChange) {
    props.onChange(newValue)
  }
}

// 当前版本的最终状态（不考虑group）
const finalDisabled = computed(() => {
  return (groupContext?.value?.disabled || props.disabled) ?? false
})

const finalSetChecked = (newChecked: boolean) => {
  setChecked(newChecked)
}

// 事件处理
const handleChange = (e: Event) => {
  if (finalDisabled.value) return

  const target = e.target as HTMLInputElement
  finalSetChecked(target.checked)
}

const handleClick = (e: MouseEvent) => {
  if (finalDisabled.value) {
    e.preventDefault()
    return
  }
  props.onClick?.(e)
}

// 样式类计算
const labelClasses = computed(() => {
  const classes = [classPrefix]

  if (finalChecked.value && !props.indeterminate) {
    classes.push(`${classPrefix}-checked`)
  }

  if (props.indeterminate) {
    classes.push(`${classPrefix}-indeterminate`)
  }

  if (finalDisabled.value) {
    classes.push(`${classPrefix}-disabled`)
  }

  if (props.block) {
    classes.push(`${classPrefix}-block`)
  }

  if (props.class) {
    classes.push(props.class)
  }

  return classes
})

// 暴露给父组件的ref方法
defineExpose({
  check: () => finalSetChecked(true),
  uncheck: () => finalSetChecked(false),
  toggle: () => finalSetChecked(!finalChecked.value),
})
</script>

<style lang="less">
@import './checkbox.less';

.adm-checkbox-nativeInput {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  border: 0;
  margin: 0;
  padding: 0;
  cursor: pointer;
  z-index: 1;
}
</style>
