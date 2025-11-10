import type { Component, CSSProperties } from 'vue'
export interface SelectorOption {
  label: string
  value: string | number
  disabled?: boolean
  description?: string
}
export interface FieldNames {
  label?: string
  value?: string
  description?: string
  disabled?: string
}

export interface SelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: SelectorOption[] | any[]
  fieldNames?: FieldNames
  value?: (string | number)[]
  defaultValue?: (string | number)[]
  onChange?: (val: (string | number)[], extend: { items: SelectorOption[] }) => void
  multiple?: boolean
  disabled?: boolean
  columns?: number
  showCheckMark?: boolean
  block?: boolean
  class?: string
  style?: CSSProperties
  renderOption?: (option: SelectorOption, selected: boolean) => Component
  // 兼容
  grid?: boolean
  space?: boolean
}
