import './form.less'
import './form-item.less'

export type {
  ValidateMessages,
  FieldData,
  NamePath,
  Rule,
  FormArrayField,
  FormArrayOperation,
  FormInstance,
} from './types'

export { default as Form } from './form.vue'
export { default as FormItem } from './form-item.vue'
export { useForm, useWatch as useFormWatch } from './form-store'
export { default as FormArray } from './form-array.vue'
export { default as FormHeader } from './header.vue'
export { default as FormSubscribe } from './form-subscribe.vue'
