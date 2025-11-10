import { getDefaultConfig } from '../config-provider/types.ts'
import type { ModalProps } from './modal.vue'
import { show } from './show.ts'
import type { ContentType } from './types.ts'

export type ModalConfirmProps = Omit<ModalProps, 'visible' | 'closeOnAction' | 'actions'> & {
  confirmText?: ContentType
  cancelText?: ContentType
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
}

const defaultProps = {
  confirmText: '确认',
  cancelText: '取消',
}

export function confirm(p: ModalConfirmProps): Promise<boolean> {
  const { locale } = getDefaultConfig()
  const props = {
    ...defaultProps,
    confirmText: locale.common.confirm,
    cancelText: locale.common.cancel,
    ...p,
  }

  return new Promise<boolean>((resolve) => {
    show({
      ...props,
      closeOnAction: true,
      onClose: () => {
        props.onClose?.()
        resolve(false)
      },
      actions: [
        {
          key: 'confirm',
          text: props.confirmText,
          primary: true,
          onClick: async () => {
            await props.onConfirm?.()
            resolve(true)
          },
        },
        {
          key: 'cancel',
          text: props.cancelText,
          onClick: async () => {
            await props.onCancel?.()
            resolve(false)
          },
        },
      ],
    })
  })
}
