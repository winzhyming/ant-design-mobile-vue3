import type { CSSProperties } from 'vue'

export type RadioValue = string | number | boolean | null

export interface RadioGroupContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any // computed ref
  disabled: boolean
  check: (value: RadioValue) => void
  uncheck: (value: RadioValue) => void
}

export interface RadioProps {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  value?: RadioValue
  block?: boolean
  id?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: (checked: boolean) => any
  onClick?: (event: MouseEvent) => void
  // Group 相关（通过 props 传递）
  __groupContext?: RadioGroupContext | null
  // CSS 变量支持
  style?: CSSProperties & {
    '--icon-size'?: string
    '--font-size'?: string
    '--gap'?: string
  }
  class?: string
}

export interface RadioGroupProps {
  value?: RadioValue | null
  defaultValue?: RadioValue | null
  disabled?: boolean
  onChange?: (value: RadioValue) => void
}

export interface NativeInputProps {
  type?: 'checkbox' | 'radio'
  id?: string
  modelValue?: boolean
  checked?: boolean
  disabled?: boolean
}
