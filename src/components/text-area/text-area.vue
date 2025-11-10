<template>
  <div v-bind:class="{ [classPrefix]: true, horizontal }">
    <textarea
      ref="nativeTextAreaRef"
      :class="`${classPrefix}-element`"
      :rows="finalRows"
      :value="currentValue"
      :placeholder="placeholder"
      :id="id"
      :autocomplete="autoComplete"
      :autofocus="autoFocus"
      :disabled="disabled"
      :readonly="readOnly"
      :name="name"
      @input="handleInput"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      @focus="onFocus"
      @blur="onBlur"
      @click="onClick"
      @keydown="handleKeydown"
    />

    <!-- 字符计数 -->
    <div v-if="showCountDisplay" :class="`${classPrefix}-count`">
      <component v-if="typeof showCount === 'function'" :is="showCountDisplay" />
      <template v-else>{{ showCountDisplay }}</template>
    </div>

    <!-- 自动调整高度的隐藏 textarea -->
    <textarea
      v-if="autoSize"
      ref="hiddenTextAreaRef"
      :class="`${classPrefix}-element ${classPrefix}-element-hidden`"
      :value="currentValue"
      :rows="finalRows"
      aria-hidden="true"
      readonly
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type Ref } from 'vue'
import { devError } from '../../utils/dev-log'
import runes from 'runes2'
import type { TextAreaProps } from './types.ts'
import { useInputHandleKeyDown } from './useInputHandleKeyDown'

const classPrefix = 'adm-text-area'

const props = withDefaults(defineProps<TextAreaProps>(), {
  rows: 2,
  horizontal: false,
  showCount: false,
  autoSize: false,
  defaultValue: '',
})

const emit = defineEmits<{
  'update:value': [value: string]
  change: [value: string]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
  click: [e: MouseEvent]
}>()

// 事件处理
const onFocus = (e: FocusEvent) => {
  emit('focus', e)
  props.onFocus?.(e)
}

const onBlur = (e: FocusEvent) => {
  emit('blur', e)
  props.onBlur?.(e)
}

const onClick = (e: MouseEvent) => {
  emit('click', e)
  props.onClick?.(e)
}

// 引用
const nativeTextAreaRef = ref<HTMLTextAreaElement | null>(null)
const hiddenTextAreaRef = ref<HTMLTextAreaElement | null>(null)
const heightRef = ref<string>('auto')
const compositingRef = ref(false)

// 状态管理 - 仿照 React usePropsValue 模式
const innerValue = ref(props.defaultValue || '')
const isControlled = computed(() => props.value !== undefined)

const currentValue = computed(() => {
  const val = isControlled.value ? props.value : innerValue.value
  if (val === null) {
    devError(
      'TextArea',
      '`value` prop on `TextArea` should not be `null`. Consider using an empty string to clear the component.',
    )
    return ''
  }
  return val || ''
})

const setValue = (newValue: string) => {
  if (!isControlled.value) {
    innerValue.value = newValue
  }
  emit('update:value', newValue)
  emit('change', newValue)
  props.onChange?.(newValue)
}

// 键盘事件处理
const handleKeydown = useInputHandleKeyDown({
  onEnterPress: props.onEnterPress,
  onKeyDown: props.onKeyDown,
  nativeInputRef: nativeTextAreaRef as Ref<HTMLTextAreaElement>,
  enterKeyHint: props.enterKeyHint,
})

// 输入处理
const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  let value = target.value

  if (props.maxLength && !compositingRef.value) {
    value = runes(value).slice(0, props.maxLength).join('')
  }
  setValue(value)
}

const handleCompositionStart = (e: CompositionEvent) => {
  compositingRef.value = true
  props.onCompositionStart?.(e)
}

const handleCompositionEnd = (e: CompositionEvent) => {
  compositingRef.value = false
  if (props.maxLength) {
    const target = e.target as HTMLTextAreaElement
    const value = target.value
    setValue(runes(value).slice(0, props.maxLength).join(''))
  }
  props.onCompositionEnd?.(e)
}

// 行数计算
const finalRows = computed(() => {
  let rows = props.rows || 2
  if (typeof props.autoSize === 'object') {
    if (props.autoSize.maxRows && rows > props.autoSize.maxRows) {
      rows = props.autoSize.maxRows
    }
    if (props.autoSize.minRows && rows < props.autoSize.minRows) {
      rows = props.autoSize.minRows
    }
  }
  return rows
})

// 字符计数显示
const showCountDisplay = computed(() => {
  if (!props.showCount) return null

  const valueLength = runes(currentValue.value).length

  if (typeof props.showCount === 'function') {
    return props.showCount(valueLength, props.maxLength)
  }

  return props.maxLength === undefined ? valueLength : `${valueLength}/${props.maxLength}`
})

// 自动调整高度
const updateHeight = async () => {
  if (!props.autoSize) return

  await nextTick()

  const textArea = nativeTextAreaRef.value
  const hiddenTextArea = hiddenTextAreaRef.value

  if (!textArea || !hiddenTextArea) return

  textArea.style.height = heightRef.value

  let height = hiddenTextArea.scrollHeight

  if (typeof props.autoSize === 'object') {
    const computedStyle = window.getComputedStyle(textArea)
    const lineHeight = parseFloat(computedStyle.lineHeight)

    if (props.autoSize.minRows) {
      height = Math.max(height, props.autoSize.minRows * lineHeight)
    }
    if (props.autoSize.maxRows) {
      height = Math.min(height, props.autoSize.maxRows * lineHeight)
    }
  }

  heightRef.value = `${height}px`
  textArea.style.height = `${height}px`
}

// 监听值变化，更新高度
watch(() => [currentValue.value, props.autoSize], updateHeight, {
  immediate: true,
})

// 暴露方法给父组件
defineExpose({
  clear: () => {
    setValue('')
  },
  focus: () => {
    nativeTextAreaRef.value?.focus()
  },
  blur: () => {
    nativeTextAreaRef.value?.blur()
  },
  get nativeElement() {
    return nativeTextAreaRef.value
  },
})
</script>

<style lang="less" scoped>
@import './text-area.less';
</style>
