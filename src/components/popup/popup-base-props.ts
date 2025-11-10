import type { CSSProperties, Component } from 'vue'
import { CloseOutline } from 'ant-mobile-icons'

// 内容类型定义
// 获取容器类型定义
export type GetContainer = string | HTMLElement | (() => HTMLElement) | null

// 事件传播类型定义
export type PropagationEvent = 'click' | 'touchstart' | 'touchend' | 'touchmove'

export interface PopupBaseProps {
  afterClose?: () => void
  afterShow?: () => void
  bodyClassName?: string
  bodyStyle?: CSSProperties | undefined
  closeOnMaskClick?: boolean
  closeIcon?: Component
  destroyOnClose?: boolean
  disableBodyScroll?: boolean
  forceRender?: boolean
  getContainer?: GetContainer
  mask?: boolean
  maskClassName?: string
  maskStyle?: CSSProperties
  onClick?: () => void
  onClose?: () => void
  onMaskClick?: () => void
  showCloseButton?: boolean
  stopPropagation?: PropagationEvent[]
  visible?: boolean
}

export const defaultPopupBaseProps = {
  visible: false,
  closeOnMaskClick: true, // 修改为 true，默认点击遮罩关闭
  destroyOnClose: false,
  disableBodyScroll: true,
  forceRender: false,
  getContainer: null,
  mask: true,
  showCloseButton: false,
  stopPropagation: () => ['click'] as PropagationEvent[],
  bodyStyle: () => ({}) as CSSProperties,
  maskStyle: () => ({}) as CSSProperties,
  bodyClassName: '',
  maskClassName: '',
  closeIcon: CloseOutline, // 设置默认的关闭图标为 CloseOutline
}
