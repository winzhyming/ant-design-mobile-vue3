import { computed, reactive, ref } from 'vue'
import type {
  FieldValue,
  FieldData,
  FormInstance,
  Meta,
  NamePath,
  Rule,
  ValidateMessages,
} from './types'
import { toArray } from './utils'
import { FormValidator, ValidateError, defaultValidateMessages } from './validator'

// Simple form store implementation
export class FormStore {
  private fields = reactive<Record<string, FieldValue>>({})
  private fieldMetas = reactive<Record<string, Meta>>({})
  private fieldRules = reactive<Record<string, Rule[]>>({})
  private initialValues = reactive<Record<string, FieldValue>>({})
  private callbacks: {
    onFieldsChange?: (changedFields: FieldData[], allFields: FieldData[]) => void
    onValuesChange?: (
      changedValues: Record<string, FieldValue>,
      allValues: Record<string, FieldValue>,
    ) => void
    onFinish?: (values: Record<string, FieldValue>) => void
    onFinishFailed?: (errorInfo: {
      values: Record<string, FieldValue>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorFields: any[]
      outOfDate: boolean
    }) => void
  } = {}

  private validator: FormValidator
  private preserve = true

  constructor() {
    this.validator = new FormValidator(defaultValidateMessages)
  }

  setCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  setValidateMessages(messages: ValidateMessages) {
    this.validator.setValidateMessages(messages)
  }

  setPreserve(preserve: boolean) {
    this.preserve = preserve
  }

  // setInitialValues(values: Record<string, FieldValue>) {
  //   Object.assign(this.initialValues, values)
  //   // Set initial values to fields if not already set
  //   Object.keys(values).forEach((key) => {
  //     if (!(key in this.fields)) {
  //       this.fields[key] = values[key]
  //     }
  //   })
  //   console.log('this.fields :', this.fields)
  // }

  setInitialValues(values: Record<string, FieldValue | object>) {
    // 扁平化处理嵌套对象/数组，例如 { a: { b: 1 }, arr: [ { x: 1 } ] }
    const flat: Record<string, FieldValue> = {}
    const flatten = (val: FieldValue, curKey: string) => {
      if (val && typeof val === 'object') {
        if (Array.isArray(val)) {
          if (val.filter((i) => typeof i === 'object').length === 0) {
            flat[curKey] = val
          } else {
            val.forEach((item, idx) => {
              flatten(item, curKey ? `${curKey}.${idx}` : `${idx}`)
            })
          }
        } else if (val instanceof Date) {
          flat[curKey] = val
        } else {
          Object.keys(val as Record<string, FieldValue>).forEach((k) => {
            flatten(val[k], curKey ? `${curKey}.${k}` : k)
          })
        }
      } else {
        flat[curKey] = val
      }
    }

    Object.keys(values).forEach((key) => {
      flatten(values[key] as FieldValue, key)
    })

    Object.assign(this.initialValues, flat)
    Object.keys(flat).forEach((key) => {
      this.fields[key] = flat[key]
    })
    console.log('setInitialValues:', this.fields)
  }

  private getNamePath(name: NamePath): string {
    return toArray(name).join('.')
  }

  private setFieldMeta(name: NamePath, meta: Partial<Meta>) {
    const key = this.getNamePath(name)
    const currentMeta = this.fieldMetas[key] || {
      touched: false,
      validating: false,
      errors: [],
      warnings: [],
      name: toArray(name),
    }
    this.fieldMetas[key] = { ...currentMeta, ...meta }
  }

  // Expose a method to mark a field as hidden or visible
  setFieldHidden(name: NamePath, hidden: boolean) {
    this.setFieldMeta(name, { hidden })
  }

  private getFieldMeta(name: NamePath): Meta {
    const key = this.getNamePath(name)
    return (
      this.fieldMetas[key] || {
        touched: false,
        validating: false,
        errors: [],
        warnings: [],
        name: toArray(name),
        hidden: false,
      }
    )
  }

  getFieldValue(name: NamePath): FieldValue {
    const key = this.getNamePath(name)
    return this.fields[key]
  }

  getFieldsValue(nameList?: NamePath[]): Record<string, FieldValue> {
    if (!nameList) {
      return { ...this.fields }
    }
    const result: Record<string, FieldValue> = {}
    nameList.forEach((name) => {
      const key = this.getNamePath(name)
      result[key] = this.fields[key]
    })
    return result
  }

  getFieldError(name: NamePath): string[] {
    return this.getFieldMeta(name).errors
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFieldsError(nameList?: NamePath[]): any[] {
    const names = nameList || Object.keys(this.fieldMetas)
    return names.map((name) => ({
      name: toArray(name),
      errors: this.getFieldError(name),
    }))
  }

  isFieldTouched(name: NamePath): boolean {
    return this.getFieldMeta(name).touched
  }

  isFieldsTouched(nameList?: NamePath[]): boolean {
    const names = nameList || Object.keys(this.fieldMetas)
    return names.some((name) => this.isFieldTouched(name))
  }

  setFieldValue(name: NamePath, value: FieldValue) {
    const key = this.getNamePath(name)
    const oldValue = this.fields[key]
    this.fields[key] = value

    if (oldValue !== value) {
      this.setFieldMeta(name, { touched: true })

      const changedFields: FieldData[] = [
        {
          name: toArray(name),
          value,
          touched: true,
        },
      ]

      const allFields = this.getAllFieldData()
      this.callbacks.onFieldsChange?.(changedFields, allFields)
      this.callbacks.onValuesChange?.({ [key]: value }, this.getFieldsValue())
    }
  }

  setArrayFieldValue(name: NamePath, value: Array<Record<string, FieldValue>>) {
    this.clearArrayFieldValue(name)
    const names = name instanceof Array ? name : toArray(name)
    const values: Record<string, FieldValue> = {}
    value.forEach((item, index) => {
      Object.keys(item).forEach((key) => {
        values[`${names.join('.')}.${index}.${key}`] = item[key]
      })
    })
    this.setFieldsValue(values)
  }

  clearArrayFieldValue(name: NamePath) {
    const key = this.getNamePath(name)
    const metaKeys = Object.keys(this.fieldMetas).filter((k) => k.startsWith(key + '.'))
    metaKeys.forEach((k) => {
      delete this.fieldMetas[k]
    })
    const fieldKeys = Object.keys(this.fields).filter((k) => k.startsWith(key + '.'))
    fieldKeys.forEach((k) => {
      delete this.fields[k]
    })
  }

  setFieldsValue(values: Record<string, FieldValue>) {
    Object.keys(values).forEach((key) => {
      this.fields[key] = values[key]
    })

    const changedFields = Object.keys(values).map((key) => ({
      name: key.split('.'),
      value: values[key],
      touched: true,
    }))

    const allFields = this.getAllFieldData()
    this.callbacks.onFieldsChange?.(changedFields, allFields)
    this.callbacks.onValuesChange?.(values, this.getFieldsValue())
  }

  setFields(fields: FieldData[]) {
    fields.forEach((field) => {
      const key = this.getNamePath(field.name)
      if (field.value !== undefined) {
        this.fields[key] = field.value
      }
      this.setFieldMeta(field.name, {
        touched: field.touched,
        errors: field.errors || [],
        validating: field.validating,
      })
    })
  }

  resetFields(fields?: NamePath[]) {
    const names = fields || Object.keys(this.fields)
    names.forEach((name) => {
      const key = this.getNamePath(name)
      this.fields[key] = this.initialValues[key]
      this.setFieldMeta(name, {
        touched: false,
        validating: false,
        errors: [],
        warnings: [],
      })
    })
  }

  private getAllFieldData(): FieldData[] {
    return Object.keys(this.fields).map((key) => ({
      name: key.split('.'),
      value: this.fields[key],
      touched: this.getFieldMeta(key).touched,
      validating: this.getFieldMeta(key).validating,
      errors: this.getFieldMeta(key).errors,
    }))
  }

  async validateFields(nameList?: NamePath[]): Promise<Record<string, FieldValue>> {
    // 默认只校验未被标记为 hidden 的字段
    const defaultNames = Object.keys(this.fieldMetas).filter((k) => !this.fieldMetas[k]?.hidden)
    const names = nameList || defaultNames
    const errors: Record<string, string[]> = {}
    let hasError = false

    for (const name of names) {
      const key = this.getNamePath(name)
      const rules = this.fieldRules[key] || []
      const value = this.fields[key]

      this.setFieldMeta(name, { validating: true })

      try {
        await this.validator.validateField(value, rules, key)
        this.setFieldMeta(name, { validating: false, errors: [] })
      } catch (error) {
        hasError = true
        const errorMessages = error instanceof ValidateError ? [error.message] : [String(error)]
        errors[key] = errorMessages
        this.setFieldMeta(name, { validating: false, errors: errorMessages })
      }
    }

    if (hasError) {
      const errorInfo = {
        values: this.getFieldsValue(),
        errorFields: Object.keys(errors).map((key) => ({
          name: key.split('.'),
          errors: errors[key],
        })),
        outOfDate: false,
      }
      // this.callbacks.onFinishFailed?.(errorInfo)
      throw errorInfo
    }

    const values = this.getFieldsValue()
    // this.callbacks.onFinish?.(values)
    return values
  }

  async submit() {
    try {
      const values = await this.validateFields()
      this.callbacks.onFinish?.(values)
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.callbacks.onFinishFailed?.(err as unknown as any)
    }
  }

  registerField(name: NamePath, rules?: Rule[]) {
    const key = this.getNamePath(name)

    // Store rules
    if (rules) {
      this.fieldRules[key] = rules
    }

    // Initialize field if not exists
    if (!(key in this.fields)) {
      this.fields[key] = this.initialValues[key]
    }

    // Initialize meta
    if (!this.fieldMetas[key]) {
      this.setFieldMeta(name, {
        touched: false,
        validating: false,
        errors: [],
        warnings: [],
        name: toArray(name),
      })
    }
    return {
      value: computed(() => this.fields[key]),
      meta: computed(() => this.getFieldMeta(name)),
      setValue: (value: FieldValue) => this.setFieldValue(name, value),
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useForm(form?: FormInstance): [FormStore] {
  const formStore = new FormStore()
  return [formStore]
}

export function useWatch(namePath: NamePath, form?: FormStore) {
  if (!form) return ref(undefined)

  const key = typeof namePath === 'string' ? namePath : toArray(namePath).join('.')
  return computed(() => form.getFieldValue(key))
}
