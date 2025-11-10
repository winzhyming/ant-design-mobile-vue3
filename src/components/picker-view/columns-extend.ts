import { computed, ref, watch, type ComputedRef } from 'vue'
import { withCache } from '../../utils/with-cache'
import type { PickerValue, PickerValueExtend, PickerViewProps } from './types'

export function generateColumnsExtend(rawColumns: PickerViewProps['columns'], val: PickerValue[]) {
  const columns = withCache(() => {
    const c = typeof rawColumns === 'function' ? rawColumns(val) : rawColumns
    return c.map((column) =>
      column.map((item) =>
        typeof item === 'string'
          ? {
              label: item,
              value: item,
            }
          : item,
      ),
    )
  })
  const items = withCache(() => {
    return val.map((v, index) => {
      const column = columns()[index]
      if (!column) return null
      return column.find((item) => item.value === v) ?? null
    })
  })
  const extend: PickerValueExtend = {
    get columns() {
      return columns()
    },
    get items() {
      return items()
    },
  }
  return extend
}

export function useColumnsExtend(
  rawColumns: ComputedRef<PickerViewProps['columns']> | PickerViewProps['columns'],
  value: ComputedRef<PickerValue[]> | PickerValue[],
): ComputedRef<PickerValueExtend> {
  let stored: PickerValueExtend = { columns: [], items: [] }
  return computed(() => {
    const rawColumnsValue =
      typeof rawColumns === 'function' || Array.isArray(rawColumns) ? rawColumns : rawColumns.value
    const valueValue = Array.isArray(value) ? value : value.value
    const temp = generateColumnsExtend(rawColumnsValue, valueValue)
    if (temp.items.length && temp.items.every((item) => item !== null)) {
      stored = temp
    } else if (!stored.columns.length) {
      stored = temp
    } else {
      stored = {
        columns: temp.columns,
        items: stored.items,
      }
    }
    return stored
  })
}
