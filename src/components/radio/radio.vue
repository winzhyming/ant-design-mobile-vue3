<template>
  <label :class="labelClasses" @click="handleClick" :style="props.style || {}">
    <NativeInput
      type="radio"
      :checked="finalChecked"
      :disabled="finalDisabled"
      :id="id"
      :onChange="setChecked"
    />

    <!-- 自定义图标渲染 -->
    <div v-if="icon" :class="`${classPrefix}-custom-icon`">
      <component :is="icon(finalChecked)" />
    </div>

    <!-- 默认图标渲染 -->
    <div v-else :class="`${classPrefix}-icon`">
      <CheckIcon v-if="finalChecked" />
    </div>

    <!-- 内容区域 -->
    <div v-if="$slots.default" :class="`${classPrefix}-content`">
      <slot />
    </div>
  </label>
</template>

<script setup lang="ts">
import type { CSSProperties, Component } from 'vue'
import { computed, ref, inject } from 'vue'
import CheckIcon from '../checkbox/check-icon.vue'
import NativeInput from './native-input.vue'
import type { RadioGroupContext, RadioValue } from './types.ts'

const classPrefix = 'adm-radio'

export interface RadioProps {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  value?: RadioValue
  block?: boolean
  id?: string
  icon?: (checked: boolean) => Component
  onClick?: (event: MouseEvent) => void
  // CSS 变量支持
  style?: CSSProperties & {
    '--icon-size'?: string
    '--font-size'?: string
    '--gap'?: string
  }
  class?: string
}

const props = withDefaults(defineProps<RadioProps>(), {
  defaultChecked: false,
  checked: undefined,
})

const emit = defineEmits<{
  'update:checked': [value: boolean]
  change: [value: boolean]
}>()

// 注入 group context
const groupContext = inject<{ value: RadioGroupContext } | null>('adm-radio-group', null)

// 内部状态管理
const innerChecked = ref(props.defaultChecked)
const isControlled = computed(() => props.checked !== undefined)

// 根据是否在 group 中来计算最终状态
const finalChecked = computed(() => {
  if (groupContext && props.value !== undefined) {
    return groupContext.value.value.includes(props.value as RadioValue)
  }
  return isControlled.value ? (props.checked ?? false) : innerChecked.value
})

const finalDisabled = computed(() => {
  if (groupContext) {
    return props.disabled || groupContext.value.disabled
  }
  return props.disabled || false
})

const setChecked = (newValue: boolean) => {
  if (groupContext && props.value !== undefined) {
    // Group 模式：通过 group context 管理状态
    if (newValue) {
      groupContext.value.check(props.value as RadioValue)
    } else {
      groupContext.value.uncheck(props.value as RadioValue)
    }
    // 仍然触发本地 onChange
    props.onChange?.(newValue)
  } else {
    // 单独模式：正常的受控/非受控逻辑
    if (!isControlled.value) {
      innerChecked.value = newValue
    }
    emit('update:checked', newValue)
    emit('change', newValue)
    props.onChange?.(newValue)
  }
}

// 事件处理
const handleClick = (e: MouseEvent) => {
  if (!finalDisabled.value) {
    props.onClick?.(e)
  }
}

// 样式类计算
const labelClasses = computed(() => {
  const classes = [classPrefix]

  if (finalChecked.value) {
    classes.push(`${classPrefix}-checked`)
  }

  if (finalDisabled.value) {
    classes.push(`${classPrefix}-disabled`)
  }

  if (props.block) {
    classes.push(`${classPrefix}-block`)
  }

  return classes
})
</script>

<style lang="less">
@import './radio.less';
</style>
