import './dialog.less'

import Dialog from './dialog.vue'
import { alert } from './alert'
import { clear } from './clear'
import { confirm } from './confirm'
import { show } from './show'

import { attachPropertiesToComponent } from '../../utils/attach-properties-to-component'
export type { DialogShowHandler } from './show'
export default attachPropertiesToComponent(Dialog, {
  alert,
  clear,
  confirm,
  show,
})
