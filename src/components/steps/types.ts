import type { Component } from 'vue'

// 步骤状态类型
export type StepStatus = 'wait' | 'process' | 'finish' | 'error' | undefined

// 方向类型
export type Direction = 'horizontal' | 'vertical'

// Steps 上下文类型
export interface StepsContextType {
  current: { value: number }
  getStepStatus: (index: number, stepStatus?: string) => StepStatus
  getStepIcon: (
    stepIcon?: Component | string,
  ) => Component | string | (() => { template: string }) | undefined
}

// Step 组件 Props
export interface StepProps {
  index?: number
  title?: string | number
  description?: string | number
  icon?: Component | string
  status?: StepStatus
  // CSS Variables
  '--title-font-size'?: string
  '--description-font-size'?: string
  '--indicator-margin-right'?: string
  '--icon-size'?: string
}

// Steps 组件 Props
export interface StepsProps {
  current?: number
  direction?: Direction
  // CSS Variables
  '--title-font-size'?: string
  '--description-font-size'?: string
  '--indicator-margin-right'?: string
  '--icon-size'?: string
}

// StepItem 配置类型
export interface StepItem {
  title?: string | number
  description?: string | number
  icon?: Component | string
  status?: StepStatus
  // 插槽组件
  titleSlot?: Component
  descriptionSlot?: Component
  iconSlot?: Component
}

// StepsWrapper 组件 Props
export interface StepsWrapperProps {
  current?: number
  direction?: Direction
  steps: StepItem[]
  // CSS Variables
  '--title-font-size'?: string
  '--description-font-size'?: string
  '--indicator-margin-right'?: string
  '--icon-size'?: string
}
