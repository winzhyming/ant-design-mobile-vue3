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
import { TILL_NOW, type PickerDate } from '../date-picker/util'

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
  change: [value: PickerDate | null]
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

// Convert date to picker value - 处理 tillNow 的情况
const pickerValue = computed(() => {
  // 如果 tillNow 为 true 且当前值为 null，表示选择了 "至今"
  if (props.tillNow && currentValue.value === null) {
    // 返回一个全部为 TILL_NOW 的数组
    const precisionLevels = {
      year: 1,
      month: 2,
      day: 3,
      hour: 4,
      minute: 5,
      second: 6,
    }
    const levels = precisionLevels[props.precision as keyof typeof precisionLevels] || 3
    return Array(levels).fill(TILL_NOW)
  }
  return convertDateToStringArray(currentValue.value, props.precision)
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
  // 确保传入的值是有效的
  let validPickerValue = [...pickerValue.value]

  // 如果有年月日，检查日期是否有效
  if (validPickerValue.length >= 3) {
    const year = parseInt(validPickerValue[0])
    const month = parseInt(validPickerValue[1])
    const day = parseInt(validPickerValue[2])

    // 获取当前月份的最大天数
    const maxDayInMonth = new Date(year, month, 0).getDate()

    // 如果日期无效，调整为该月最后一天
    if (day > maxDayInMonth) {
      validPickerValue = [...validPickerValue]
      validPickerValue[2] = maxDayInMonth.toString()
    }
  }

  const reactColumns = generateDatePickerColumns(
    validPickerValue,
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

// Handle picker change - 修改 tillNow 的检测逻辑
const handlePickerChange = (value: PickerValue[], extend: PickerValueExtend) => {
  if (!value || value.length === 0) {
    return
  }

  const stringValues = value.map((v) => {
    if (v === null || v === undefined) return null
    return typeof v === 'string' ? v : (v?.toString() ?? null)
  })

  // 检查是否选择了 "至今" 选项 - 检查任意位置是否有 TILL_NOW
  if (props.tillNow && stringValues.includes(TILL_NOW)) {
    setValue(null)
    return
  }

  // 先检查并调整日期值
  if (stringValues.length >= 3) {
    const year = parseInt(stringValues[0] || '2024')
    const month = parseInt(stringValues[1] || '1')
    const day = parseInt(stringValues[2] || '1')

    // 获取当前月份的最大天数
    const maxDayInMonth = new Date(year, month, 0).getDate()

    // 如果日期超出范围，调整为最大值
    if (day > maxDayInMonth) {
      stringValues[2] = maxDayInMonth.toString()
    }
  }

  const date = convertStringArrayToDate(stringValues, props.precision)

  if (date && !isNaN(date.getTime())) {
    // 检查新日期是否与当前日期相同，避免重复设置
    if (!currentValue.value || date.getTime() !== currentValue.value.getTime()) {
      setValue(date)
    }
  }
}

// Set value helper - 简化逻辑
const setValue = (newValue: Date | null) => {
  if (!isControlled.value) {
    innerValue.value = newValue
  }
  const valueToEmit: PickerDate = newValue ? newValue : new Date()
  valueToEmit.tillNow = !newValue
  emit('update:value', valueToEmit)
  emit('change', valueToEmit)
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
