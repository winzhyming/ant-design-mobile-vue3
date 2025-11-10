<template>
  <PickerView
    :columns="columns"
    :value="pickerValue"
    @change="handlePickerChange"
    :mouse-wheel="props.mouseWheel"
    :className="props.className"
    :style="props.style"
  />
</template>

<script lang="ts">
import type { CSSProperties } from 'vue'
export type RenderLabel = (
  type: Precision | 'now',
  data: number,
  info: {
    selected: boolean
  },
) => string

export interface DatePickerViewProps {
  value?: Date | null
  defaultValue?: Date | null
  precision?: Precision
  min?: Date
  max?: Date
  renderLabel?: RenderLabel
  filter?: DatePickerFilter
  mouseWheel?: boolean
  tillNow?: boolean
  className?: string
  style?: CSSProperties
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  convertDateToStringArray,
  convertStringArrayToDate,
  generateDatePickerColumns,
  type DatePickerFilter,
  type Precision,
} from '../date-picker/date-picker-utils'
import type { PickerColumn as ReactPickerColumn } from '../picker-view/index'
import type { Locale } from '../../locales/base'
import { useConfig } from '../config-provider/useConfig'
import PickerView from '../picker-view/picker-view.vue'
import type {
  PickerValue,
  PickerValueExtend,
  PickerColumn as VuePickerColumn,
  PickerColumnItem as VuePickerColumnItem,
} from '../picker-view/types'

// Inline useRenderLabel functionality
const zhCNRenderLabel = (type: Precision | 'now', data: number, info: { selected: boolean }) => {
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

const enUSRenderLabel = (type: Precision | 'now', data: number, info: { selected: boolean }) => {
  if (type === 'now') {
    return 'Now'
  }
  return data.toString()
}

const createRenderLabel = (
  customRenderLabel: RenderLabel | undefined,
  locale: Locale,
): RenderLabel => {
  if (customRenderLabel) {
    return customRenderLabel
  }

  // Default render label based on locale
  if (locale.locale.startsWith('zh')) {
    return zhCNRenderLabel
  }
  return enUSRenderLabel
}

const props = withDefaults(defineProps<DatePickerViewProps>(), {
  precision: 'day' as Precision,
  mouseWheel: false,
  tillNow: false,
})

const emit = defineEmits<{
  'update:value': [value: Date | null]
  change: [value: Date | null]
}>()

// State management
const innerValue = ref(props.defaultValue ?? null)
const isControlled = computed(() => props.value !== undefined)

const currentValue = computed(() => (isControlled.value ? props.value : innerValue.value))

// Get locale and config
const { locale } = useConfig()

// Render label functionality
const renderLabel = computed(() => createRenderLabel(props.renderLabel, locale))

// Min/max dates with defaults
const minDate = computed(() => props.min ?? new Date(1900, 0, 1, 0, 0, 0))
const maxDate = computed(() => props.max ?? new Date(2100, 11, 31, 23, 59, 59))

// Convert date to picker value
const pickerValue = computed(() => {
  const result = convertDateToStringArray(currentValue.value, props.precision)
  return result
})

// Adapter function to convert React PickerColumn to Vue PickerColumn
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

// Generate picker columns
const columns = computed(() => {
  const reactColumns = generateDatePickerColumns(
    pickerValue.value,
    minDate.value,
    maxDate.value,
    props.precision,
    renderLabel.value,
    props.filter,
    props.tillNow,
  )
  const adapted = adaptColumns(reactColumns)
  return adapted
})

// Handle picker change
const handlePickerChange = (value: PickerValue[], extend: PickerValueExtend) => {
  // 防止无效值导致的问题
  if (!value || value.length === 0) {
    return
  }

  const stringValues = value.map((v) => {
    if (v === null || v === undefined) return null
    return typeof v === 'string' ? v : (v?.toString() ?? null)
  })

  // 先尝试转换日期
  let date = convertStringArrayToDate(stringValues, props.precision)

  // 如果日期无效（比如选择了不存在的日期），进行智能调整
  if (!date || isNaN(date.getTime())) {
    // 尝试修正日期
    date = adjustInvalidDate(stringValues, props.precision) as Date
  }

  // 检查转换后的日期是否有效
  if (date && !isNaN(date.getTime())) {
    setValue(date)
  }
}

// 智能调整无效日期
const adjustInvalidDate = (stringValues: (string | null)[], precision: Precision): Date | null => {
  if (stringValues.length === 0) return null

  try {
    const year = parseInt(stringValues[0] || '0')
    const month = stringValues.length > 1 ? parseInt(stringValues[1] || '1') : 1
    const day = stringValues.length > 2 ? parseInt(stringValues[2] || '1') : 1
    const hour = stringValues.length > 3 ? parseInt(stringValues[3] || '0') : 0
    const minute = stringValues.length > 4 ? parseInt(stringValues[4] || '0') : 0
    const second = stringValues.length > 5 ? parseInt(stringValues[5] || '0') : 0

    // 获取当前月份的最大天数
    const maxDayInMonth = new Date(year, month, 0).getDate()

    // 如果选择的日期超过了当前月的最大天数，调整为最大天数
    const adjustedDay = Math.min(day, maxDayInMonth)

    const adjustedDate = new Date(year, month - 1, adjustedDay, hour, minute, second)

    // 确保调整后的日期在有效范围内
    if (adjustedDate >= minDate.value && adjustedDate <= maxDate.value) {
      return adjustedDate
    }

    return null
  } catch (error) {
    console.warn('Date adjustment failed:', error)
    return null
  }
}

// Set value helper
const setValue = (newValue: Date | null) => {
  // 防止相同值的重复设置（考虑毫秒差异）
  if (newValue && currentValue.value) {
    const timeDiff = Math.abs(newValue.getTime() - currentValue.value.getTime())
    if (timeDiff < 1000) {
      // 小于1秒的差异认为是相同值
      return
    }
  }

  if (!isControlled.value) {
    innerValue.value = newValue
  }
  emit('update:value', newValue)
  emit('change', newValue)
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
</script>
