import type { VNode, CSSProperties } from 'vue'

export type PickerValue = string | number | null | undefined

export type PickerValueExtend = {
  columns: PickerColumnItem[][]
  items: (PickerColumnItem | null)[]
}

export interface PickerColumnItem {
  label: string
  value: string | number
  [key: string]: string | number
}

export type PickerColumn = (string | PickerColumnItem)[]

export interface PickerViewProps {
  columns: PickerColumn[] | ((value: PickerValue[]) => PickerColumn[])
  value?: PickerValue[]
  defaultValue?: PickerValue[]
  mouseWheel?: boolean
  loading?: boolean
  loadingContent?: VNode | string
  onChange?: (value: PickerValue[], extend: PickerValueExtend) => void
  renderLabel?: (item: PickerColumnItem) => VNode | string | number
  // CSS variables
  className?: string
  style?: CSSProperties
  units?: string[]
}
