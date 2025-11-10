import type { Ref } from 'vue'

export type CheckboxValue = string | number

export interface CheckboxGroupContext {
  check: (value: CheckboxValue) => void
  uncheck: (value: CheckboxValue) => void
  value: Ref<CheckboxValue[]>
  disabled: boolean
}

export interface CheckboxProps {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
  value?: CheckboxValue
  indeterminate?: boolean
  id?: string
  icon?: string
  block?: boolean
  groupContext?: CheckboxGroupContext | null | undefined
}

export interface CheckboxGroupProps {
  defaultValue?: CheckboxValue[]
  disabled?: boolean
  value?: CheckboxValue[]
  onChange?: (value: CheckboxValue[]) => void
}

export interface NativeInputProps {
  type?: 'checkbox' | 'radio'
  id?: string
  modelValue?: boolean
  checked?: boolean
  disabled?: boolean
}
