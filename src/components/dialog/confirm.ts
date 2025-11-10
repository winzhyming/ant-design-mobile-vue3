import type { VNode } from 'vue'
import { getDefaultConfig } from '../config-provider/types'
import type { DialogProps } from './dialog.vue'
import { show } from './show'

export type DialogConfirmProps = Omit<DialogProps, 'visible' | 'closeOnAction' | 'actions'> & {
  confirmText?: string | VNode
  cancelText?: string | VNode
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
  onClose?: () => void
}

export function confirm(props: DialogConfirmProps): Promise<boolean> {
  const config = getDefaultConfig()
  const confirmText = props.confirmText ?? config.locale.common.confirm
  const cancelText = props.cancelText ?? config.locale.common.cancel

  return new Promise<boolean>((resolve) => {
    show({
      ...props,
      closeOnAction: true,
      onClose: () => {
        props.onClose?.()
        resolve(false)
      },
      actions: [
        [
          {
            key: 'cancel',
            text: cancelText,
            onClick: async () => {
              await props.onCancel?.()
              resolve(false)
            },
          },
          {
            key: 'confirm',
            text: confirmText,
            bold: true,
            onClick: async () => {
              await props.onConfirm?.()
              resolve(true)
            },
          },
        ],
      ],
    })
  })
}
