import { createApp, type App } from 'vue'
import type { DialogProps } from './dialog.vue'
import Dialog from './dialog.vue'

export type DialogShowProps = Omit<DialogProps, 'visible' | 'destroyOnClose' | 'forceRender'>

export interface DialogShowHandler {
  close: () => void
}

export const closeFnSet = new Set<() => void>()

export function show(props: DialogShowProps): DialogShowHandler {
  const container = document.createElement('div')
  document.body.appendChild(container)

  let app: App | null = null
  let isDestroyed = false

  const close = () => {
    if (isDestroyed) return
    isDestroyed = true

    closeFnSet.delete(close)

    if (app) {
      app.unmount()
      app = null
    }

    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  const afterClose = () => {
    props.afterClose?.()
    close()
  }

  app = createApp(Dialog, {
    ...props,
    visible: true,
    destroyOnClose: true,
    afterClose,
    onClose: close,
  })

  app.mount(container)
  closeFnSet.add(close)

  return {
    close,
  }
}
