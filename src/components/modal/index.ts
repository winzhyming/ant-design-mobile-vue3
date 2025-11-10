import './modal.less'
import { attachPropertiesToComponent } from '../../utils/attach-properties-to-component.ts'
import { alert } from './alert'
import { clear } from './clear.ts'
import { confirm } from './confirm'
import Modal from './modal.vue'
import { show } from './show.ts'

export type { ModalAlertProps } from './alert'
export type { ModalConfirmProps } from './confirm'
export type { ModalProps } from './modal.vue'
export type { ModalShowHandler, ModalShowProps } from './show.ts'
export type { Action } from './types.ts'

// 导出单独的方法
export { alert, clear, confirm, show }

// 导出带有方法的组件
export default attachPropertiesToComponent(Modal, {
  show,
  alert,
  confirm,
  clear,
})
