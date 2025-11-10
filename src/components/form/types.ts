export type FormLayout = 'vertical' | 'horizontal'

export type FieldValue = string | number | boolean | null | undefined | Date | Array<FieldValue>

export interface FormInstance {
  getFieldValue: (name: string | (string | number)[]) => FieldValue
  getFieldsValue: (nameList?: (string | (string | number))[]) => Record<string, FieldValue>
  getFieldError: (name: string | (string | number)[]) => string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFieldsError: (nameList?: (string | (string | number))[]) => any[]
  isFieldTouched: (name: string | (string | number)[]) => boolean
  isFieldsTouched: (nameList?: (string | (string | number))[]) => boolean
  resetFields: (fields?: (string | (string | number))[]) => void
  setFields: (fields: FieldData[]) => void
  setFieldValue: (name: string | (string | number)[], value: FieldValue) => void
  setArrayFieldValue: (
    name: string | (string | number)[],
    value: Array<Record<string, FieldValue>>,
  ) => void
  setFieldsValue: (values: Record<string, FieldValue>) => void
  submit: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validateFields: (nameList?: (string | (string | number))[]) => Promise<any>
}

export interface Rule {
  enum?: FieldValue[]
  len?: number
  max?: number
  message?: string | ((value: FieldValue, rule: Rule) => string)
  min?: number
  pattern?: RegExp
  required?: boolean
  transform?: (value: FieldValue) => FieldValue
  type?: string
  whitespace?: boolean
  validator?: (rule: Rule, value: FieldValue) => Promise<void> | void
}

export interface ValidateMessages {
  default?: string | (() => string)
  required?: string | (() => string)
  enum?: string | (() => string)
  whitespace?: string | (() => string)
  date?: {
    format?: string | (() => string)
    parse?: string | (() => string)
    invalid?: string | (() => string)
  }
  types?: {
    string?: string | (() => string)
    method?: string | (() => string)
    array?: string | (() => string)
    object?: string | (() => string)
    number?: string | (() => string)
    date?: string | (() => string)
    boolean?: string | (() => string)
    integer?: string | (() => string)
    float?: string | (() => string)
    regexp?: string | (() => string)
    email?: string | (() => string)
    url?: string | (() => string)
    hex?: string | (() => string)
  }
  string?: {
    len?: string | (() => string)
    min?: string | (() => string)
    max?: string | (() => string)
    range?: string | (() => string)
  }
  number?: {
    len?: string | (() => string)
    min?: string | (() => string)
    max?: string | (() => string)
    range?: string | (() => string)
  }
  array?: {
    len?: string | (() => string)
    min?: string | (() => string)
    max?: string | (() => string)
    range?: string | (() => string)
  }
  pattern?: {
    mismatch?: string | (() => string)
  }
}

export interface FieldData {
  name: string | number | (string | number)[]
  value?: FieldValue
  touched?: boolean
  validating?: boolean
  errors?: string[]
}

export type NamePath = string | number | (string | number)[]

export interface Meta {
  touched: boolean
  validating: boolean
  errors: string[]
  warnings: string[]
  name: (string | number)[]
  hidden?: boolean
}

export interface FormArrayField {
  index: number
  key: number
}

export interface FormArrayOperation {
  add: (defaultValue?: FieldValue, insertIndex?: number) => void
  remove: (index: number | number[]) => void
  move: (from: number, to: number) => void
}

export interface FormContextType {
  name?: string
  hasFeedback: boolean
  layout: FormLayout
  requiredMarkStyle: 'asterisk' | 'text-required' | 'text-optional' | 'none'
  optionalText?: string
  disabled: boolean
}

export const defaultFormContext: FormContextType = {
  name: undefined,
  hasFeedback: true,
  layout: 'vertical',
  requiredMarkStyle: 'asterisk',
  optionalText: '',
  disabled: false,
}
