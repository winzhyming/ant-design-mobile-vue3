<template>
  <div
    :class="[
      classPrefix,
      {
        [`${classPrefix}-active`]: hasFocus,
      },
    ]"
    :style="mergedStyle"
  >
    <div :class="`${classPrefix}-input-box`">
      <div v-if="searchIcon" :class="`${classPrefix}-input-box-icon`" @click="handleSearch">
        <component :is="searchIcon" />
      </div>
      <Input
        ref="inputRef"
        :class="[
          `${classPrefix}-input`,
          {
            [`${classPrefix}-input-without-icon`]: !searchIcon,
          },
        ]"
        :value="currentValue"
        :maxLength="maxLength"
        :autoFocus="autoFocus"
        :placeholder="placeholder"
        :clearable="clearable"
        :onlyShowClearWhenFocus="onlyShowClearWhenFocus"
        :disabled="disabled"
        :readOnly="readOnly"
        type="search"
        enterKeyHint="search"
        :aria-label="searchBarName"
        @update:value="handleValueChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @clear="handleClear"
        @enter-press="handleEnterPress"
        @composition-start="handleCompositionStart"
        @composition-end="handleCompositionEnd"
      />
    </div>
    <div v-if="shouldShowCancelButton" :class="`${classPrefix}-suffix`">
      <Button
        fill="none"
        :class="`${classPrefix}-cancel-button`"
        @click="handleCancelClick"
        @mousedown="handleCancelMouseDown"
      >
        {{ cancelText }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts">
import type { Component } from 'vue'

export interface SearchBarProps {
  value?: string
  defaultValue?: string
  maxLength?: number
  placeholder?: string
  clearable?: boolean
  onlyShowClearWhenFocus?: boolean
  showCancelButton?: boolean | ((focus: boolean, value: string) => boolean)
  cancelText?: string
  searchIcon?: Component | null | false | undefined
  /**
   * @deprecated use `searchIcon` instead
   */
  icon?: Component | null
  clearOnCancel?: boolean
  autoFocus?: boolean
  disabled?: boolean
  readOnly?: boolean
  className?: string

  // Events
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
  onClear?: () => void
  onCompositionStart?: (e: CompositionEvent) => void
  onCompositionEnd?: (e: CompositionEvent) => void
  onSearch?: (val: string) => void
  onChange?: (val: string) => void
  onCancel?: () => void

  // CSS Variables
  '--background'?: string
  '--border-radius'?: string
  '--placeholder-color'?: string
  '--height'?: string
  '--padding-left'?: string
  '--color'?: string
  '--cancel-button-color'?: string
}

export interface SearchBarRef {
  clear: () => void
  focus: () => void
  blur: () => void
  nativeElement: HTMLInputElement | null
}
</script>

<script setup lang="ts">
import { SearchOutline } from 'ant-mobile-icons-vue3'
import { computed, ref } from 'vue'
import Button from '../button/index.vue'
import { useConfig } from '../config-provider/useConfig'
import Input from '../input/input.vue'
import type { InputRef } from '../input/types'

const classPrefix = 'adm-search-bar'

const props = withDefaults(defineProps<SearchBarProps>(), {
  clearable: true,
  onlyShowClearWhenFocus: false,
  showCancelButton: false,
  defaultValue: '',
  clearOnCancel: true,
  searchIcon: undefined,
})

const emit = defineEmits<{
  'update:value': [value: string]
  change: [value: string]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
  clear: []
  'composition-start': [e: CompositionEvent]
  'composition-end': [e: CompositionEvent]
  search: [value: string]
  cancel: []
}>()

// Refs
const inputRef = ref<InputRef>()
const hasFocus = ref(false)
const composingRef = ref(false)

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
    props.onChange?.(val)
  },
})

// Computed
const cancelText = computed(() => props.cancelText || locale.common.cancel)
const searchBarName = computed(() => locale.SearchBar.name)

const searchIcon = computed(() => {
  if ([null, false].includes(props.searchIcon as null | false)) {
    return null
  }
  // Handle deprecated 'icon' prop
  return props.searchIcon || SearchOutline
})

const mergedStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props['--background']) style['--background'] = props['--background']
  if (props['--border-radius']) style['--border-radius'] = props['--border-radius']
  if (props['--placeholder-color']) style['--placeholder-color'] = props['--placeholder-color']
  if (props['--height']) style['--height'] = props['--height']
  if (props['--padding-left']) style['--padding-left'] = props['--padding-left']

  return style
})

// Cancel button visibility
const shouldShowCancelButton = computed(() => {
  if (typeof props.showCancelButton === 'function') {
    return props.showCancelButton(hasFocus.value, currentValue.value)
  }
  return props.showCancelButton && hasFocus.value
})

// Event handlers
const handleSearch = () => {
  if (!composingRef.value) {
    emit('search', currentValue.value)
    props.onSearch?.(currentValue.value)
  }
}

const handleValueChange = (value: string) => {
  currentValue.value = value
}

const handleFocus = (e: FocusEvent) => {
  hasFocus.value = true
  emit('focus', e)
  props.onFocus?.(e)
}

const handleBlur = (e: FocusEvent) => {
  hasFocus.value = false
  emit('blur', e)
  props.onBlur?.(e)
}

const handleClear = () => {
  emit('clear')
  props.onClear?.()
}

const handleEnterPress = () => {
  if (!composingRef.value) {
    inputRef.value?.blur()
    emit('search', currentValue.value)
    props.onSearch?.(currentValue.value)
  }
}

const handleCompositionStart = (e: CompositionEvent) => {
  composingRef.value = true
  emit('composition-start', e)
  props.onCompositionStart?.(e)
}

const handleCompositionEnd = (e: CompositionEvent) => {
  composingRef.value = false
  emit('composition-end', e)
  props.onCompositionEnd?.(e)
}

const handleCancelClick = () => {
  if (props.clearOnCancel) {
    inputRef.value?.clear()
  }
  inputRef.value?.blur()
  emit('cancel')
  props.onCancel?.()
}

const handleCancelMouseDown = (e: MouseEvent) => {
  e.preventDefault()
}

// Expose methods
const clear = () => {
  inputRef.value?.clear()
}

const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

const nativeElement = computed(() => {
  return inputRef.value?.nativeElement ?? null
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
@import './search-bar.less';
</style>
