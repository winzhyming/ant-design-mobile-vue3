import { createApp, type App } from 'vue'
import PromptComponent from './prompt.vue'
import type { DatePickerProps } from './date-picker.vue'
import type { PickerDate } from './util'

export interface DatePickerPromptOptions
  extends Omit<DatePickerProps, 'visible' | 'value' | 'defaultValue'> {
  defaultValue?: PickerDate | null
}

export interface DatePickerPromptResult {
  confirm: (value: PickerDate | null) => Promise<PickerDate>
  close: () => void
}

let currentApp: App | null = null

export function showDatePicker(options: DatePickerPromptOptions = {}): Promise<PickerDate> {
  return new Promise((resolve, reject) => {
    // 如果已有实例，先清理
    if (currentApp) {
      currentApp.unmount()
      currentApp = null
    }

    // 创建容器
    const container = document.createElement('div')
    document.body.appendChild(container)

    // 清理函数
    const cleanup = () => {
      if (currentApp) {
        currentApp.unmount()
        currentApp = null
      }
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }

    // 事件处理
    const handleResolve = (value: PickerDate) => {
      resolve(value)
      setTimeout(cleanup, 300) // 延迟清理，等待动画
    }

    const handleReject = (error: Error) => {
      reject(error)
      setTimeout(cleanup, 300) // 延迟清理，等待动画
    }

    // 创建 Vue 应用实例，传入完整的 props
    currentApp = createApp(PromptComponent, {
      ...options,
      onResolve: handleResolve,
      onReject: handleReject,
    })

    currentApp.mount(container)
  })
}

// 便捷方法：显示日期选择器
export const datePicker = showDatePicker

// 便捷方法：显示年份选择器
export function showYearPicker(
  options: Omit<DatePickerPromptOptions, 'precision'> = {},
): Promise<PickerDate> {
  return showDatePicker({
    ...options,
    precision: 'year',
  })
}

// 便捷方法：显示月份选择器
export function showMonthPicker(
  options: Omit<DatePickerPromptOptions, 'precision'> = {},
): Promise<PickerDate> {
  return showDatePicker({
    ...options,
    precision: 'month',
  })
}

// 便捷方法：显示时间选择器
export function showTimePicker(
  options: Omit<DatePickerPromptOptions, 'precision'> = {},
): Promise<PickerDate> {
  return showDatePicker({
    ...options,
    precision: 'minute',
  })
}

// 便捷方法：显示日期时间选择器
export function showDateTimePicker(
  options: Omit<DatePickerPromptOptions, 'precision'> = {},
): Promise<PickerDate> {
  return showDatePicker({
    ...options,
    precision: 'minute',
  })
}

// 命名空间导出
export const DatePickerPrompt = {
  show: showDatePicker,
  showYear: showYearPicker,
  showMonth: showMonthPicker,
  showTime: showTimePicker,
  showDateTime: showDateTimePicker,
}

// 默认导出
export default DatePickerPrompt
