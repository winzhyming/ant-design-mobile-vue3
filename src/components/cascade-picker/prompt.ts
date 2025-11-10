import { createApp, h, type App } from 'vue'
import type { CascadePickerProps } from './cascade-picker.vue'
import type { PickerValue } from '../picker-view'
import CascadePicker from './cascade-picker.vue'

export function prompt(
  props: Omit<CascadePickerProps, 'value' | 'visible'>,
): Promise<PickerValue[] | null> {
  return new Promise<PickerValue[] | null>((resolve) => {
    // 创建容器元素
    const container = document.createElement('div')
    document.body.appendChild(container)

    // 创建 Vue 应用实例
    const app: App = createApp({
      setup() {
        return {
          visible: true,
          handleConfirm: (val: PickerValue[]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            props.onConfirm?.(val, {} as any)
            resolve(val)
            cleanup()
          },
          handleClose: () => {
            props.onClose?.()
            resolve(null)
            cleanup()
          },
          handleAfterClose: () => {
            props.afterClose?.()
            cleanup()
          },
        }
      },
      render() {
        return h(CascadePicker, {
          ...props,
          visible: this.visible,
          onConfirm: this.handleConfirm,
          onClose: this.handleClose,
          afterClose: this.handleAfterClose,
        })
      },
    })

    // 清理函数
    const cleanup = () => {
      app.unmount()
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }

    // 挂载应用
    app.mount(container)
  })
}
