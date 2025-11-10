<template>
  <Button
    :key="action.key"
    :class="buttonClasses"
    :disabled="action.disabled || loading"
    :loading="loading"
    :style="nativeStyle"
    fill="none"
    shape="rectangular"
    block
    :color="action.danger ? 'danger' : 'primary'"
    @click="handleClick"
    v-bind="ariaProps"
  >
    <slot v-if="$slots.default" />
    <template v-else>{{ action.text }}</template>
  </Button>
</template>

<script setup lang="ts">
import { computed, type CSSProperties, type VNode } from 'vue'
import Button from '../button/index.vue'

// Types
export interface Action {
  key: string | number
  text: string | VNode // Vue equivalent of ReactNode
  disabled?: boolean
  danger?: boolean
  bold?: boolean
  onClick?: () => void | Promise<void>
  // Native props
  className?: string
  style?: CSSProperties
  tabIndex?: number
  [key: `data-${string}`]: string | number
  [key: `aria-${string}`]: string | number
}

export interface DialogActionButtonProps {
  action: Action
  loading?: boolean
}

export interface DialogActionButtonEmits {
  (e: 'action'): void | Promise<void>
}

// Props
const props = withDefaults(defineProps<DialogActionButtonProps>(), {
  loading: false,
})

// Emits
const emit = defineEmits<DialogActionButtonEmits>()

// Computed
const buttonClasses = computed(() => {
  const baseClass = 'adm-dialog-button'
  const classes = [baseClass]

  if (props.action.bold) {
    classes.push('adm-dialog-button-bold')
  }

  if (props.action.className) {
    classes.push(props.action.className)
  }

  return classes
})

const nativeStyle = computed(() => {
  return props.action.style || {}
})

const ariaProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {}

  // Add tabIndex
  if (props.action.tabIndex !== undefined) {
    result.tabIndex = props.action.tabIndex
  }

  // Add data-* and aria-* attributes
  Object.keys(props.action).forEach((key) => {
    if (key.startsWith('data-') || key.startsWith('aria-')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result[key] = (props.action as any)[key]
    }
  })

  return result
})

// Methods
const handleClick = () => {
  emit('action')
}
</script>
