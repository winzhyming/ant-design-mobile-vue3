import type { VNodeChild } from 'vue'

export type CascaderValue = string | number

export interface CascaderOption {
  label?: string
  value?: string | number
  disabled?: boolean
  children?: CascaderOption[]
  [key: string]: unknown
}

export interface CascaderViewConfig {
  valueName?: string
  childrenName?: string
}

export type ActiveIconType = VNodeChild
