<template>
  <div
    :class="[
      classPrefix,
      {
        [`${classPrefix}-checked`]: checked,
        [`${classPrefix}-disabled`]: disabled || changing,
      },
    ]"
    :style="cssVars"
    role="switch"
    :aria-label="locale.Switch.name"
    :aria-checked="checked"
    :aria-disabled="disabled"
    @click="onClick"
  >
    <div :class="`${classPrefix}-checkbox`">
      <div :class="`${classPrefix}-handle`">
        <SpinIcon v-if="loading || changing" :class="`${classPrefix}-spin-icon`" />
      </div>
      <div :class="`${classPrefix}-inner`">
        <slot name="checkedText" v-if="checked && $slots.checkedText" />
        <component :is="renderCheckedText" v-else-if="checked && checkedText" />
        <slot name="uncheckedText" v-else-if="!checked && $slots.uncheckedText" />
        <component :is="renderUncheckedText" v-else-if="!checked && uncheckedText" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, watch, type VNode, type CSSProperties } from 'vue'
import { isPromise } from '../../utils/validate'
import { useConfig } from '../config-provider/useConfig'
import SpinIcon from './spin-icon.vue'

const classPrefix = 'adm-switch'

export interface SwitchProps {
  loading?: boolean
  disabled?: boolean
  checked?: boolean | undefined
  defaultChecked?: boolean
  /** @deprecated use `onChange` instead */
  beforeChange?: (val: boolean) => Promise<void>
  onChange?: (checked: boolean) => void | Promise<void>
  checkedText?: string | VNode | (() => VNode)
  uncheckedText?: string | VNode | (() => VNode)
  // CSS 变量支持
  checkedColor?: string
  width?: string
  height?: string
  borderWidth?: string
}

const props = withDefaults(defineProps<SwitchProps>(), {
  defaultChecked: false,
  checked: undefined,
})

const emit = defineEmits<{
  'update:checked': [checked: boolean]
  change: [checked: boolean]
}>()

// 响应式状态
const changing = ref(false)
const innerChecked = ref(props.defaultChecked)

const { locale } = useConfig()

// 实现类似 usePropsValue 的逻辑
const isControlled = computed(() => props.checked !== undefined)

const checked = computed(() => {
  return isControlled.value ? props.checked! : innerChecked.value
})

const disabled = computed(() => props.disabled || props.loading || false)

// 核心的状态设置函数，模拟 usePropsValue 的 setChecked
const setChecked = async (nextChecked: boolean) => {
  // 非受控模式：直接更新内部状态
  if (!isControlled.value) {
    innerChecked.value = nextChecked
  }

  // 发出事件（受控模式父组件需要监听来更新状态）
  emit('update:checked', nextChecked)
  emit('change', nextChecked)

  // 调用 onChange 回调
  if (props.onChange) {
    const result = props.onChange(nextChecked)
    if (isPromise(result)) {
      return result
    }
  }

  return Promise.resolve()
}

// 监听受控模式下的 props.checked 变化
watch(
  () => props.checked,
  (newValue) => {
    if (isControlled.value && newValue !== undefined) {
      // 受控模式下不需要同步到 innerChecked，因为 checked 计算属性会直接使用 props.checked
    }
  },
  { immediate: true },
)

// 渲染文本内容
const renderCheckedText = computed(() => {
  if (!props.checkedText) return null

  if (typeof props.checkedText === 'function') {
    return props.checkedText()
  }

  if (typeof props.checkedText === 'string') {
    return h('span', props.checkedText)
  }

  return props.checkedText
})

const renderUncheckedText = computed(() => {
  if (!props.uncheckedText) return null

  if (typeof props.uncheckedText === 'function') {
    return props.uncheckedText()
  }

  if (typeof props.uncheckedText === 'string') {
    return h('span', props.uncheckedText)
  }

  return props.uncheckedText
})

// CSS 变量计算
const cssVars = computed<CSSProperties>(() => {
  const vars: Record<string, string> = {}

  if (props.checkedColor) {
    vars['--checked-color'] = props.checkedColor
  }
  if (props.width) {
    vars['--width'] = props.width
  }
  if (props.height) {
    vars['--height'] = props.height
  }
  if (props.borderWidth) {
    vars['--border-width'] = props.borderWidth
  }

  return vars
})

// 点击处理函数
const onClick = async () => {
  if (disabled.value || props.loading || changing.value) {
    return
  }

  const nextChecked = !checked.value

  // 处理 beforeChange（已废弃的属性）
  if (props.beforeChange) {
    changing.value = true
    try {
      await props.beforeChange(nextChecked)
      changing.value = false
    } catch (e) {
      changing.value = false
      throw e
    }
  }

  // 调用 setChecked 并处理可能的异步结果
  const result = setChecked(nextChecked)
  if (isPromise(result)) {
    changing.value = true
    try {
      await result
      changing.value = false
    } catch (e) {
      changing.value = false
      throw e
    }
  }
}
</script>

<style lang="less" scoped>
@import './switch.less';
</style>
