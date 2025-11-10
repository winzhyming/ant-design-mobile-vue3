import { createApp, h, ref } from 'vue'
import type { ModalProps } from './modal.vue'
import Modal from './modal.vue'

export type ModalShowProps = Omit<ModalProps, 'visible' | 'destroyOnClose' | 'forceRender'>

export type ModalShowHandler = {
  close: () => void
}

export const closeFnSet = new Set<() => void>()

export function show(props: ModalShowProps): ModalShowHandler {
  const container = document.createElement('div')
  document.body.appendChild(container)

  // 创建响应式的 visible 状态
  const visible = ref(true)
  let isDestroyed = false // 添加标记防止重复销毁

  const close = () => {
    if (isDestroyed) return // 防止重复调用

    visible.value = false // 先设置为 false 触发关闭动画

    // 等待动画完成后再卸载
    setTimeout(() => {
      if (!isDestroyed) {
        isDestroyed = true
        app.unmount()
        // 检查 container 是否还在 DOM 中
        if (container.parentNode) {
          container.parentNode.removeChild(container)
        }
        closeFnSet.delete(close)
      }
    }, 300)
  }

  const app = createApp({
    setup() {
      return () =>
        h(Modal, {
          ...props,
          visible: visible.value,
          onClose: () => {
            props.onClose?.()
            close()
          },
          afterClose: () => {
            props.afterClose?.()
          },
        })
    },
  })

  app.mount(container)

  const handler: ModalShowHandler = { close }
  closeFnSet.add(close)

  return handler
}
