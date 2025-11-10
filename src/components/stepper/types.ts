// 简化的 InputProps 类型定义
export interface InputProps {
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
}

export type ValueType = number | string | undefined | null

export type ValueProps<ValueType> = {
  allowEmpty: true
  value?: ValueType | null
  defaultValue?: ValueType | null
  onChange?: (value: ValueType | null) => void
}

export type ValuePropsWithNull<ValueType> = {
  allowEmpty?: false
  value?: ValueType
  defaultValue?: ValueType
  onChange?: (value: ValueType) => void
}

export type BaseStepperProps<ValueType> = Pick<InputProps, 'onFocus' | 'onBlur'> &
  (ValuePropsWithNull<ValueType> | ValueProps<ValueType>) & {
    min?: number | string
    max?: number | string
    step?: number | string
    digits?: number
    disabled?: boolean
    inputReadOnly?: boolean
    placeholder?: string
    button?: boolean
    subfix?: string
    // Format & Parse
    parser?: (text: string) => ValueType
    formatter?: (value?: ValueType) => string
  } & {
    // CSS 变量
    '--height'?: string
    '--input-width'?: string
    '--input-font-size'?: string
    '--input-background-color'?: string
    '--border-radius'?: string
    '--border'?: string
    '--border-inner'?: string
    '--active-border'?: string
    '--button-font-size'?: string
    '--button-background-color'?: string
    '--button-width'?: string
    '--input-font-color'?: string
    '--button-text-color'?: string
  }

export type NumberStepperProps = BaseStepperProps<number> & {
  // stringMode
  stringMode?: false
}

export type StringStepperProps = BaseStepperProps<string> & {
  // stringMode
  stringMode: true
}

export type StepperProps = NumberStepperProps | StringStepperProps

export interface StepperRef {
  focus: () => void
  blur: () => void
  nativeElement: HTMLElement | null
}

export type MergedStepperProps<ValueType> = Omit<BaseStepperProps<ValueType>, 'step'> &
  Required<Pick<BaseStepperProps<ValueType>, 'step'>> & {
    stringMode?: boolean
  }
