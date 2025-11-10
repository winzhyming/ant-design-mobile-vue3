import type { Component } from 'vue'

export interface InputProps {
  value?: string | number
  defaultValue?: string | number
  maxLength?: number
  minLength?: number
  autoComplete?: string
  autoFocus?: boolean
  pattern?: string
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  type?:
    | 'text'
    | 'number'
    | 'password'
    | 'search'
    | 'email'
    | 'tel'
    | 'url'
    | 'date'
    | 'time'
    | 'datetime-local'
  name?: string
  placeholder?: string
  readOnly?: boolean
  disabled?: boolean
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoCorrect?: 'on' | 'off'
  step?: number | string
  id?: string
  clearable?: boolean
  clearIcon?: Component
  onlyShowClearWhenFocus?: boolean
  min?: number
  max?: number
  role?: string
  ariaLabel?: string

  // Events
  onChange?: (val: string) => void
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
  onClear?: () => void
  onEnterPress?: (e: KeyboardEvent) => void
  onPaste?: (e: ClipboardEvent) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onKeyUp?: (e: KeyboardEvent) => void
  onCompositionStart?: (e: CompositionEvent) => void
  onCompositionEnd?: (e: CompositionEvent) => void
  onClick?: (e: MouseEvent) => void

  // CSS Variables
  '--font-size'?: string
  '--color'?: string
  '--placeholder-color'?: string
  '--text-align'?: string
}

export interface InputRef {
  clear: () => void
  focus: () => void
  blur: () => void
  nativeElement: HTMLInputElement | null
}
