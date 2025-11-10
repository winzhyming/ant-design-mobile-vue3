import type { Component } from 'vue'

export type SliderValue = number | [number, number]

export type SliderMarks = Record<number, string | number>

export interface SliderProps {
  min?: number
  max?: number
  value?: SliderValue
  defaultValue?: SliderValue
  step?: number
  marks?: SliderMarks
  ticks?: boolean
  disabled?: boolean
  range?: boolean
  icon?: Component | string
  popover?: boolean | ((value: number) => Component | string)
  residentPopover?: boolean
  onChange?: (value: SliderValue) => void
  onAfterChange?: (value: SliderValue) => void
  '--fill-color'?: string
  class?: string
  style?: Record<string, string | number>
}
