import type { CSSProperties } from 'vue'

export interface SkeletonProps {
  animated?: boolean
  class?: string
  style?: CSSProperties
  title?: boolean | SkeletonTitleProps
  paragraph?:
    | boolean
    | {
        rows?: number
        width?: string | number | (string | number)[]
      }
  round?: boolean
  width?: string | number
  height?: string | number
  active?: boolean // 兼容
}

export interface SkeletonTitleProps {
  width?: string | number
  style?: CSSProperties
  class?: string
  animated?: boolean
}
