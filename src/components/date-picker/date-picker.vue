<template>
  <Picker
    ref="pickerRef"
    :columns="columns"
    :value="pickerValue"
    @confirm="onConfirm"
    @select="onSelect"
    @cancel="handleCancel"
    @close="handleClose"
    :close-on-mask-click="closeOnMaskClick"
    :visible="visible"
    :confirm-text="confirmText"
    :cancel-text="cancelText"
    :get-container="getContainer"
    :loading="loading"
    :loading-content="loadingContent"
    @after-show="handleAfterShow"
    @after-close="handleAfterClose"
    @click="handleClick"
    :title="title"
    :stop-propagation="stopPropagation"
    :mouse-wheel="mouseWheel"
    :destroy-on-close="destroyOnClose"
    :force-render="forceRender"
  >
    <template #default="{ actions }">
      <slot :value="currentValue || null" :actions="actions">
        <span v-if="children">{{ children(currentValue || null, actions) }}</span>
      </slot>
    </template>
  </Picker>
</template>

<script setup lang="ts">
import type { VNode } from 'vue'
import { computed, ref, watch } from 'vue'
import {
  convertDateToStringArray,
  convertStringArrayToDate,
  generateDatePickerColumns,
  type DatePickerFilter,
  type Precision,
} from './date-picker-utils'
import { TILL_NOW, type PickerDate } from './util'
import type { PickerColumn as ReactPickerColumn } from '../picker-view'
import { bound } from '../../utils/bound'
import { useConfig } from '../config-provider/useConfig'
import type { RenderLabel } from '../date-picker-view/useRenderLabel'
import { Picker, type PickerActions } from '../picker/index'
import type {
  PickerValue,
  PickerColumn as VuePickerColumn,
  PickerColumnItem as VuePickerColumnItem,
} from '../picker-view/types.ts'

import { type Ref } from 'vue'

export type DatePickerRef = {
  getActions: () => PickerActions
  pickerRef: Ref<InstanceType<typeof Picker>>
}

export interface DatePickerProps {
  value?: PickerDate | null
  defaultValue?: PickerDate | null
  onSelect?: (value: PickerDate) => void
  onConfirm?: (value: PickerDate) => void
  onCancel?: () => void
  onClose?: () => void
  closeOnMaskClick?: boolean
  visible?: boolean
  confirmText?: string
  cancelText?: string
  getContainer?: () => HTMLElement
  loading?: boolean
  loadingContent?: VNode | string
  afterShow?: () => void
  afterClose?: () => void
  onClick?: () => void
  title?: string
  stopPropagation?: Array<'click'>
  mouseWheel?: boolean
  forceRender?: boolean
  destroyOnClose?: boolean
  min?: PickerDate
  max?: PickerDate
  precision?: Precision
  children?: (value: PickerDate | null, actions: PickerActions) => VNode | string
  renderLabel?: RenderLabel
  filter?: DatePickerFilter
  tillNow?: boolean
}

const props = withDefaults(defineProps<DatePickerProps>(), {
  min: () => new Date(new Date().getFullYear() - 10, 0, 1),
  max: () => new Date(new Date().getFullYear() + 10, 11, 31),
  precision: 'day' as Precision,
  defaultValue: undefined,
  value: undefined,
  closeOnMaskClick: true,
  visible: undefined,
  loading: false,
  mouseWheel: false,
  forceRender: false,
  destroyOnClose: false,
  tillNow: false,
})

const emit = defineEmits<{
  'update:value': [value: PickerDate | null]
  'update:visible': [visible: boolean]
  confirm: [value: PickerDate]
  select: [value: PickerDate]
  cancel: []
  close: []
  'after-show': []
  'after-close': []
  click: []
}>()

// Ref to picker instance
const pickerRef = ref<InstanceType<typeof Picker>>()

// State management
const innerValue = ref<PickerDate | null>(props.value ?? props.defaultValue ?? null)
const isControlled = computed(() => props.value !== undefined)
console.log(props.value)
const currentValue = computed(() => (isControlled.value ? props.value : innerValue.value))

// Get locale and config
const { locale } = useConfig()

// Current date for default
const now = computed<PickerDate>(() => new Date())

// Merged render label
const mergedRenderLabel = computed(() => {
  if (props.renderLabel) {
    return props.renderLabel
  }

  // Default render label based on locale
  if (locale.locale.startsWith('zh')) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (type: Precision | 'now', data: number, info: { selected: boolean }) => {
      switch (type) {
        case 'year':
          return data + '年'
        case 'month':
          return data + '月'
        case 'day':
          return data + '日'
        case 'hour':
          return data + '时'
        case 'minute':
          return data + '分'
        case 'second':
          return data + '秒'
        case 'now':
          return '至今'
        default:
          return data.toString()
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (type: Precision | 'now', data: number, info: { selected: boolean }) => {
    if (type === 'now') {
      return 'Now'
    }
    return data.toString()
  }
})

// Convert current value to picker value
const pickerValue = computed(() => {
  let date = currentValue.value ?? now.value

  if (date.tillNow) {
    return [TILL_NOW]
  }
  date = new Date(bound(date.getTime(), props.min!.getTime(), props.max!.getTime()))
  return convertDateToStringArray(date, props.precision!)
})

// Generate columns function with type adaptation
const adaptColumns = (reactColumns: ReactPickerColumn[]): VuePickerColumn[] => {
  return reactColumns.map((column) =>
    column.map((item) => {
      if (typeof item === 'string') {
        return item
      }
      // Convert ReactPickerColumnItem to VuePickerColumnItem
      const vueItem: VuePickerColumnItem = {
        value: item.value,
        label:
          typeof item.label === 'string' || typeof item.label === 'number'
            ? item.label
            : String(item.value), // Fallback for ReactNode
        key: item.key,
      }
      return vueItem
    }),
  )
}

const columns = computed(() => {
  return (selected: PickerValue[]) => {
    const reactColumns = generateDatePickerColumns(
      selected as string[],
      props.min!,
      props.max!,
      props.precision!,
      mergedRenderLabel.value,
      props.filter,
      props.tillNow,
    )
    return adaptColumns(reactColumns)
  }
})

// Event handlers
const onConfirm = (val: PickerValue[]) => {
  const date = convertStringArrayToDate(val, props.precision!)
  setValue(date)
  emit('confirm', date)
}

const onSelect = (val: PickerValue[]) => {
  const date = convertStringArrayToDate(val, props.precision!)
  emit('select', date)
  props.onSelect?.(date)
}

const handleCancel = () => {
  emit('cancel')
  props.onCancel?.()
}

const handleClose = () => {
  emit('close')
  props.onClose?.()
}

const handleAfterShow = () => {
  emit('after-show')
  props.afterShow?.()
}

const handleAfterClose = () => {
  emit('after-close')
  props.afterClose?.()
}

const handleClick = () => {
  emit('click')
  props.onClick?.()
}

// Set value helper
const setValue = (newValue: PickerDate | null) => {
  if (!isControlled.value) {
    innerValue.value = newValue
  }
  emit('update:value', newValue)
  if (newValue !== null) {
    props.onConfirm?.(newValue)
  }
}

// Expose picker actions
const getActions = (): PickerActions => {
  return (
    pickerRef.value?.actions || {
      close: () => {},
      open: () => {},
      toggle: () => {},
    }
  )
}

// Watch for external value changes
watch(
  () => props.value,
  (newValue) => {
    if (isControlled.value && newValue !== currentValue.value) {
      // Value changed externally, no need to emit
    }
  },
)

// Expose methods for template refs
defineExpose({
  getActions,
  pickerRef,
})
</script>
