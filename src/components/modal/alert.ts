import { getDefaultConfig } from '../config-provider/types.ts'
import type { ModalProps } from './modal.vue'
import { show } from './show.ts'
import type { ContentType } from './types.ts'

export type ModalAlertProps = Omit<ModalProps, 'visible' | 'closeOnAction' | 'actions'> & {
  confirmText?: ContentType
  onConfirm?: () => void | Promise<void>
}

export function alert(p: ModalAlertProps): Promise<void> {
  const defaultProps = {
    confirmText: getDefaultConfig().locale.Modal.ok,
  }
  const props = { ...defaultProps, ...p }

  return new Promise<void>((resolve) => {
    show({
      ...props,
      closeOnAction: true,
      actions: [
        {
          key: 'confirm',
          text: props.confirmText,
          primary: true,
        },
      ],
      onAction: props.onConfirm,
      onClose: () => {
        props.onClose?.()
        resolve()
      },
    })
  })
}
