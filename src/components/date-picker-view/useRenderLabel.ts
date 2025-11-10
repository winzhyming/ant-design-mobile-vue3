import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'
import type { Precision } from '../date-picker/date-picker-utils'
import type { Locale } from '../../locales/base'

export type RenderLabel = (
  type: Precision | 'now',
  data: number,
  info: {
    selected: boolean
  },
) => string

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const enUSRenderLabel = (type: Precision | 'now', data: number, info: { selected: boolean }) => {
  if (type === 'now') {
    return 'Now'
  }
  return data.toString()
}

export function useRenderLabel(
  customRenderLabel: ComputedRef<RenderLabel | undefined>,
  locale: Ref<Locale>,
): ComputedRef<RenderLabel> {
  return computed(() => {
    if (customRenderLabel.value) {
      return customRenderLabel.value
    }

    // Default render label based on locale
    if (locale.value.locale.startsWith('zh')) {
      return zhCNRenderLabel
    }
    return enUSRenderLabel
  })
}
