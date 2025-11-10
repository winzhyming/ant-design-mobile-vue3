import type { CSSProperties } from 'vue'

export interface TextAreaProps {
  // 基础属性
  value?: string
  defaultValue?: string
  placeholder?: string
  horizontal?: boolean
  rows?: number
  maxLength?: number
  showCount?: boolean | ((length: number, maxLength?: number) => any)
  autoSize?:
    | boolean
    | {
        minRows?: number
        maxRows?: number
      }
  id?: string

  // 表单相关
  autoComplete?: string
  autoFocus?: boolean
  disabled?: boolean
  readOnly?: boolean
  name?: string

  // 事件回调
  onChange?: (value: string) => void
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
  onCompositionStart?: (e: CompositionEvent) => void
  onCompositionEnd?: (e: CompositionEvent) => void
  onClick?: (e: MouseEvent) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onEnterPress?: (e: KeyboardEvent) => void

  // 键盘提示
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send'

  // CSS 变量支持
  style?: CSSProperties & {
    '--font-size'?: string
    '--color'?: string
    '--placeholder-color'?: string
    '--disabled-color'?: string
    '--text-align'?: string
    '--count-text-align'?: string
  }
  class?: string
}

export interface TextAreaRef {
  clear: () => void
  focus: () => void
  blur: () => void
  nativeElement: HTMLTextAreaElement | null
}
