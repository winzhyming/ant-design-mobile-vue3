import { computed } from 'vue'
import type { PickerColumn, PickerValue } from '../picker-view'

export interface CascadePickerOption {
  label: string
  value: string
  children?: CascadePickerOption[]
}

export function useColumnsFn(options: CascadePickerOption[]) {
  // 计算最大深度
  const depth = computed(() => {
    let maxDepth = 0
    function traverse(options: CascadePickerOption[], currentDepth: number) {
      if (currentDepth > maxDepth) maxDepth = currentDepth
      const nextDepth = currentDepth + 1
      options.forEach((option) => {
        if (option.children) {
          traverse(option.children, nextDepth)
        }
      })
    }
    traverse(options, 1)
    return maxDepth
  })

  // 返回列生成函数
  return (selected: PickerValue[]) => {
    const columns: PickerColumn[] = []
    let currentOptions = options
    let i = 0

    while (true) {
      columns.push(
        currentOptions.map((option) => ({
          label: option.label,
          value: option.value,
        })),
      )

      const selectedValue = selected[i]
      const targetOption = currentOptions.find((option) => option.value === selectedValue)

      if (!targetOption || !targetOption.children) break

      currentOptions = targetOption.children
      i++
    }

    // 填充空列直到达到最大深度
    while (i < depth.value - 1) {
      columns.push([])
      i++
    }

    return columns
  }
}

// 计算级联选择器的最大深度
export function getOptionsDepth(options: CascadePickerOption[]): number {
  let maxDepth = 0

  function traverse(options: CascadePickerOption[], currentDepth: number) {
    if (currentDepth > maxDepth) maxDepth = currentDepth
    const nextDepth = currentDepth + 1
    options.forEach((option) => {
      if (option.children) {
        traverse(option.children, nextDepth)
      }
    })
  }

  traverse(options, 1)
  return maxDepth
}

// 根据值路径查找对应的选项
export function findOptionsByValues(
  options: CascadePickerOption[],
  values: PickerValue[],
): (CascadePickerOption | null)[] {
  const result: (CascadePickerOption | null)[] = []
  let currentOptions = options

  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    const option = currentOptions.find((opt) => opt.value === value)

    if (option) {
      result.push(option)
      if (option.children) {
        currentOptions = option.children
      } else {
        break
      }
    } else {
      result.push(null)
      break
    }
  }

  return result
}

// 获取某个选项的完整路径
export function getOptionPath(
  options: CascadePickerOption[],
  targetValue: string,
): CascadePickerOption[] {
  const path: CascadePickerOption[] = []

  function traverse(options: CascadePickerOption[]): boolean {
    for (const option of options) {
      path.push(option)

      if (option.value === targetValue) {
        return true
      }

      if (option.children && traverse(option.children)) {
        return true
      }

      path.pop()
    }
    return false
  }

  traverse(options)
  return path
}
