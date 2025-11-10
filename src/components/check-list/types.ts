import type { Component, CSSProperties } from 'vue'

export type CheckListValue = string | number

export interface CheckListProps {
  value?: CheckListValue[]
  defaultValue?: CheckListValue[]
  onChange?: (val: CheckListValue[]) => void
  multiple?: boolean
  activeIcon?: Component
  extra?: (active: boolean) => Component
  disabled?: boolean
  readOnly?: boolean
  mode?: 'default' | 'card'
  style?: CSSProperties
}

export interface CheckListItemProps {
  className?: string | Record<string, boolean> | (string | Record<string, boolean>)[]
  title?: string | number
  description?: string | Component
  prefix?: string | number | Component
  disabled?: boolean
  onClick?: (e: MouseEvent) => void
  style?: CSSProperties
  value: CheckListValue
  readOnly?: boolean
}
