export interface PopoverProps {
  defaultVisible?: boolean
  visible?: boolean
  getContainer?: () => HTMLElement
  destroyOnHide?: boolean
  mode?: 'light' | 'dark'
  trigger?: 'click'
  placement?: Placement | DeprecatedPlacement
  stopPropagation?: string[]
  content?: string
  style?: Record<string, any>
  className?: string
}

export interface PopoverRef {
  show: () => void
  hide: () => void
  visible: boolean
}

export interface Action {
  text: string | object
  icon?: string | object
  disabled?: boolean
  key?: string | number
  onClick?: () => void
}

export interface PopoverMenuProps extends Omit<PopoverProps, 'content'> {
  actions: Action[]
  maxCount?: number
  onAction?: (item: Action) => void
}

export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'right'
  | 'right-start'
  | 'right-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'

export type DeprecatedPlacement =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'leftTop'
  | 'leftBottom'
  | 'rightTop'
  | 'rightBottom'
