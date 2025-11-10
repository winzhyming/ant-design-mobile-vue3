<template>
  <div
    :class="[
      classPrefix,
      {
        [`${classPrefix}-disabled`]: disabled,
      },
    ]"
    :style="nativeStyle"
  >
    <div :class="`${classPrefix}-prefix`" v-if="$slots.prefix">
      <slot name="prefix"></slot>
    </div>
    <input
      ref="nativeInputRef"
      :class="`${classPrefix}-element`"
      :value="currentValue"
      :id="id"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readOnly"
      :maxlength="maxLength"
      :minlength="minLength"
      :max="max"
      :min="min"
      :autocomplete="autoComplete"
      :autofocus="autoFocus"
      :pattern="pattern"
      :inputmode="inputMode"
      :type="type"
      :name="name"
      :autocapitalize="autoCapitalize"
      :autocorrect="autoCorrect"
      :step="step"
      :role="role"
      :aria-label="ariaLabel"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @paste="handlePaste"
      @keydown="handleKeyDown"
      @keyup="handleKeyUp"
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      @click="handleClick"
    />
    <div :class="`${classPrefix}-subfix`" v-if="$slots.subfix">
      <slot name="subfix"></slot>
    </div>
    <div
      v-if="shouldShowClear"
      :class="`${classPrefix}-clear`"
      :aria-label="clearAriaLabel"
      @mousedown="handleClearMouseDown"
      @click="handleClear"
    >
      <component :is="clearIcon" v-if="props.clearIcon" />
      <svg viewBox="0 0 1024 1024" width="1.5em" height="1.5em" fill="currentColor" v-else>
        <path
          d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 0 1-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { bound } from '../../utils/bound'
import { isIOS } from '../../utils/validate'
import { useConfig } from '../config-provider/useConfig'
import type { InputProps } from './types'

const classPrefix = 'adm-input'

const props = withDefaults(defineProps<InputProps>(), {
  defaultValue: '',
  onlyShowClearWhenFocus: true,
  type: 'text',
})

const emit = defineEmits<{
  'update:value': [value: string]
  change: [value: string]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
  clear: []
  'enter-press': [e: KeyboardEvent]
  paste: [e: ClipboardEvent]
  keydown: [e: KeyboardEvent]
  keyup: [e: KeyboardEvent]
  'composition-start': [e: CompositionEvent]
  'composition-end': [e: CompositionEvent]
  click: [e: MouseEvent]
}>()

// Refs
const nativeInputRef = ref<HTMLInputElement>()
const hasFocus = ref(false)
const compositionStartRef = ref(false)

// Get config
const { locale } = useConfig()

// Internal value state for controlled/uncontrolled
const internalValue = ref(props.defaultValue || '')
const isControlled = computed(() => props.value !== undefined)

const currentValue = computed({
  get: () => (isControlled.value ? props.value || '' : internalValue.value),
  set: (val: string) => {
    if (!isControlled.value) {
      internalValue.value = val
    }
    emit('update:value', val)
    emit('change', val)
    // props.onChange?.(val)
  },
})

// Computed
const clearAriaLabel = computed(() => locale.Input?.clear || 'clear')

const nativeStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props['--font-size']) style['--font-size'] = props['--font-size']
  if (props['--color']) style['--color'] = props['--color']
  if (props['--placeholder-color']) style['--placeholder-color'] = props['--placeholder-color']
  if (props['--text-align']) style['--text-align'] = props['--text-align']

  return style
})

const shouldShowClear = computed(() => {
  if (!props.clearable || !currentValue.value || props.readOnly) return false
  if (props.onlyShowClearWhenFocus) {
    return hasFocus.value
  } else {
    return true
  }
})

const ariaLabel = computed(() => props.ariaLabel || '')

// Value validation for number type
function checkValue() {
  let nextValue = currentValue.value
  if (props.type === 'number') {
    const boundValue =
      nextValue && bound(parseFloat(nextValue as string), props.min, props.max).toString()
    // fix the display issue of numbers starting with 0
    if (Number(nextValue) !== Number(boundValue)) {
      nextValue = boundValue
    }
  }
  if (nextValue !== currentValue.value) {
    currentValue.value = nextValue as string
  }
}

// Event handlers
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  currentValue.value = target.value
}

const handleFocus = (e: FocusEvent) => {
  hasFocus.value = true
  emit('focus', e)
  // props.onFocus?.(e)
}

const handleBlur = (e: FocusEvent) => {
  hasFocus.value = false
  checkValue()
  emit('blur', e)
  // props.onBlur?.(e)
}

const handlePaste = (e: ClipboardEvent) => {
  emit('paste', e)
  // props.onPaste?.(e)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (props.onEnterPress && (e.code === 'Enter' || e.keyCode === 13)) {
    emit('enter-press', e)
    // props.onEnterPress?.(e)
  }
  emit('keydown', e)
  // props.onKeyDown?.(e)
}

const handleKeyUp = (e: KeyboardEvent) => {
  emit('keyup', e)
  // props.onKeyUp?.(e)
}

const handleCompositionStart = (e: CompositionEvent) => {
  compositionStartRef.value = true
  emit('composition-start', e)
  // props.onCompositionStart?.(e)
}

const handleCompositionEnd = (e: CompositionEvent) => {
  compositionStartRef.value = false
  emit('composition-end', e)
  // props.onCompositionEnd?.(e)
}

const handleClick = (e: MouseEvent) => {
  emit('click', e)
  // props.onClick?.(e)
}

const handleClearMouseDown = (e: MouseEvent) => {
  e.preventDefault()
}

const handleClear = () => {
  currentValue.value = ''
  emit('clear')
  // props.onClear?.()

  // https://github.com/ant-design/ant-design-mobile/issues/5212
  if (isIOS() && compositionStartRef.value) {
    compositionStartRef.value = false
    nativeInputRef.value?.blur()
  }
}

// Handle enterKeyHint attribute
const updateEnterKeyHint = () => {
  const element = nativeInputRef.value
  if (!props.enterKeyHint || !element) return

  element.setAttribute('enterkeyhint', props.enterKeyHint)
}

const removeEnterKeyHint = () => {
  const element = nativeInputRef.value
  if (!element) return
  element.removeAttribute('enterkeyhint')
}

onMounted(() => {
  updateEnterKeyHint()
})

onUnmounted(() => {
  removeEnterKeyHint()
})

// Watch enterKeyHint changes
// const unwatchEnterKeyHint = computed(() => {
//   updateEnterKeyHint()
//   return props.enterKeyHint
// })

// Expose methods
const clear = () => {
  handleClear()
}

const focus = () => {
  nativeInputRef.value?.focus()
}

const blur = () => {
  nativeInputRef.value?.blur()
}

const nativeElement = computed(() => {
  return nativeInputRef.value ?? null
})

defineExpose({
  clear,
  focus,
  blur,
  get nativeElement() {
    return nativeElement.value
  },
})
</script>

<style scoped>
@import './input.less';
</style>
