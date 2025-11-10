import type { VNode } from 'vue'
import { getDefaultConfig } from '../config-provider/types'
import type { DialogProps } from './dialog.vue'
import { show } from './show'

export type DialogAlertProps = Omit<DialogProps, 'visible' | 'closeOnAction' | 'actions'> & {
  confirmText?: string | VNode
  onConfirm?: () => void | Promise<void>
  onClose?: () => void
}

export function alert(props: DialogAlertProps): Promise<void> {
  const config = getDefaultConfig()
  const confirmText = props.confirmText ?? config.locale.Dialog.ok

  return new Promise<void>((resolve) => {
    show({
      ...props,
      closeOnAction: true,
      actions: [
        {
          key: 'confirm',
          text: confirmText,
          onClick: async () => {
            await props.onConfirm?.()
            resolve()
          },
        },
      ],
      onClose: () => {
        props.onClose?.()
        resolve()
      },
    })
  })
}
