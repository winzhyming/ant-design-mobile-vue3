import type { Ref } from 'vue'
import type { Component, InjectionKey } from 'vue'

export type CheckListValue = string | number

export type CheckListContext = {
  value: Ref<CheckListValue[]>
  check: (val: CheckListValue) => void
  uncheck: (val: CheckListValue) => void
  activeIcon?: Component
  extra?: (active: boolean) => Component | string | number
  disabled?: boolean
  readOnly?: boolean
}

export const CheckListContextKey: InjectionKey<CheckListContext> = Symbol('adm-check-list')
