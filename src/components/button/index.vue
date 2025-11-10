<script setup lang="ts">
import { ref, computed, h, type VNode, type CSSProperties, type Component } from 'vue'
import DotLoading from '../dot-loading/index.vue'
import { isPromise } from '../../utils/validate'

const classPrefix = 'adm-button'

export interface ButtonProps {
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  fill?: 'solid' | 'outline' | 'none'
  size?: 'mini' | 'small' | 'middle' | 'large'
  block?: boolean
  loading?: boolean | 'auto'
  loadingText?: string
  loadingIcon?: VNode | Component
  disabled?: boolean
  type?: 'submit' | 'reset' | 'button'
  shape?: 'default' | 'rounded' | 'rectangular'
  // Native props
  onMouseDown?: (event: MouseEvent) => void
  onMouseUp?: (event: MouseEvent) => void
  onTouchStart?: (event: TouchEvent) => void
  onTouchEnd?: (event: TouchEvent) => void
  onClick?: (event: MouseEvent) => void | Promise<void>
  id?: string
  form?: string
  // CSS Variables
  style?: CSSProperties
  class?: string | string[] | Record<string, boolean>
}

export interface ButtonEmits {
  (e: 'click', event: MouseEvent): void | Promise<void>
}

// Props with defaults
const props = withDefaults(defineProps<ButtonProps>(), {
  color: 'default',
  fill: 'solid',
  block: false,
  loading: false,
  type: 'button',
  shape: 'default',
  size: 'middle',
})

// Emits
const emit = defineEmits<ButtonEmits>()

// Refs
const buttonRef = ref<HTMLButtonElement | null>(null)
const innerLoading = ref(false)

// Computed
const isLoading = computed(() => {
  return props.loading === 'auto' ? innerLoading.value : props.loading
})

const isDisabled = computed(() => {
  return props.disabled || isLoading.value
})

const currentLoadingIcon = computed(() => {
  if (props.loadingIcon) {
    return props.loadingIcon
  }
  return h(DotLoading, { color: 'currentColor' })
})

const buttonClasses = computed(() => {
  return [
    classPrefix,
    {
      [`${classPrefix}-${props.color}`]: props.color,
      [`${classPrefix}-block`]: props.block,
      [`${classPrefix}-disabled`]: isDisabled.value,
      [`${classPrefix}-fill-outline`]: props.fill === 'outline',
      [`${classPrefix}-fill-none`]: props.fill === 'none',
      [`${classPrefix}-mini`]: props.size === 'mini',
      [`${classPrefix}-small`]: props.size === 'small',
      [`${classPrefix}-large`]: props.size === 'large',
      [`${classPrefix}-loading`]: isLoading.value,
    },
    `${classPrefix}-shape-${props.shape}`,
    props.class,
  ]
})

const nativeStyle = computed(() => {
  const baseStyle: CSSProperties = {}

  // CSS Variables support
  if (props.style) {
    Object.assign(baseStyle, props.style)
  }

  return baseStyle
})

// Methods
const handleClick = async (event: MouseEvent): Promise<void> => {
  const result = props.onClick ? props.onClick(event) : emit('click', event)
  // Auto loading handling
  if (props.loading === 'auto' && isPromise(result)) {
    try {
      innerLoading.value = true
      await result
      innerLoading.value = false
    } catch (error) {
      innerLoading.value = false
      throw error
    }
  }
}

const handleTouchStart = (event: TouchEvent) => {
  props.onTouchStart?.(event)
}

const handleTouchEnd = (event: TouchEvent) => {
  props.onTouchEnd?.(event)
}

// Expose native element
defineExpose({
  nativeElement: buttonRef,
})
</script>

<template>
  <button
    ref="buttonRef"
    :type="props.type"
    :form="props.form"
    :class="buttonClasses"
    :disabled="isDisabled"
    @click="handleClick"
    @mousedown="props.onMouseDown"
    @mouseup="props.onMouseUp"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
    :style="nativeStyle"
  >
    <div v-if="isLoading" :class="`${classPrefix}-loading-wrapper`">
      <component :is="currentLoadingIcon" />
      <span v-if="props.loadingText">{{ props.loadingText }}</span>
    </div>
    <span v-else>
      <slot />
    </span>
  </button>
</template>

<style lang="less" scoped>
@import './index.less';
</style>
