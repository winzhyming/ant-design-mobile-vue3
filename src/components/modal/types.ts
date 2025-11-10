// 内容类型，支持字符串、Vue 组件或渲染函数
export type ContentType = string | object | (() => unknown)

export interface Action {
  key: string | number
  text: ContentType
  disabled?: boolean
  danger?: boolean
  primary?: boolean
  onClick?: () => void | Promise<void>
  style?: Record<string, string | number>
  className?: string
}
