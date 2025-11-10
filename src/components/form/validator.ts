import type { Rule, ValidateMessages, FieldValue } from './types'

export class ValidateError extends Error {
  field: string

  constructor(message: string, field: string) {
    super(message)
    this.name = 'ValidateError'
    this.field = field
  }
}

export class FormValidator {
  private validateMessages: ValidateMessages

  constructor(validateMessages: ValidateMessages = {}) {
    this.validateMessages = validateMessages
  }

  async validateField(value: FieldValue, rules: Rule[], field: string): Promise<void> {
    if (!rules || rules.length === 0) return

    for (const rule of rules) {
      try {
        await this.validateRule(value, rule, field)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new ValidateError(message, field)
      }
    }
  }

  private async validateRule(value: FieldValue, rule: Rule, field: string): Promise<void> {
    // Transform value if needed
    const finalValue = rule.transform ? rule.transform(value) : value

    // Required validation
    if (rule.required && this.isEmpty(finalValue)) {
      throw new Error(this.getMessage(rule, 'required', field) || '此字段是必填的')
    }

    // Skip other validations if value is empty and not required
    // if (this.isEmpty(finalValue) && !rule.required) {
    //   return
    // }

    // Type validation
    if (rule.type) {
      await this.validateType(finalValue, rule.type, rule, field)
    }

    // Length validation
    if (rule.len !== undefined) {
      await this.validateLength(finalValue, rule.len, 'len', rule, field)
    }

    if (rule.min !== undefined) {
      await this.validateLength(finalValue, rule.min, 'min', rule, field)
    }

    if (rule.max !== undefined) {
      await this.validateLength(finalValue, rule.max, 'max', rule, field)
    }

    // Pattern validation
    if (rule.pattern) {
      if (!rule.pattern.test(String(finalValue))) {
        throw new Error(this.getMessage(rule, 'pattern', field) || '格式不正确')
      }
    }

    // Enum validation
    if (rule.enum) {
      if (!rule.enum.includes(finalValue)) {
        throw new Error(this.getMessage(rule, 'enum', field) || '值不在允许的选项中')
      }
    }

    // Whitespace validation
    if (rule.whitespace && typeof finalValue === 'string') {
      if (finalValue.trim() === '') {
        throw new Error(this.getMessage(rule, 'whitespace', field) || '不能只包含空格')
      }
    }

    // Custom validator
    if (rule.validator) {
      await rule.validator(rule, finalValue)
    }
  }

  private isEmpty(value: FieldValue): boolean {
    return value === undefined || value === null || value === ''
  }

  private async validateType(
    value: FieldValue,
    type: string,
    rule: Rule,
    field: string,
  ): Promise<void> {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(this.getMessage(rule, 'types.string', field) || '必须是字符串')
        }
        break
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error(this.getMessage(rule, 'types.number', field) || '必须是数字')
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(this.getMessage(rule, 'types.boolean', field) || '必须是布尔值')
        }
        break
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(this.getMessage(rule, 'types.array', field) || '必须是数组')
        }
        break
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          throw new Error(this.getMessage(rule, 'types.object', field) || '必须是对象')
        }
        break
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(value))) {
          throw new Error(this.getMessage(rule, 'types.email', field) || '邮箱格式不正确')
        }
        break
      case 'url':
        try {
          new URL(String(value))
        } catch {
          throw new Error(this.getMessage(rule, 'types.url', field) || 'URL格式不正确')
        }
        break
      case 'date':
        const date = new Date(value as string | number)
        if (isNaN(date.getTime())) {
          throw new Error(this.getMessage(rule, 'types.date', field) || '日期格式不正确')
        }
        break
      case 'integer':
        if (!Number.isInteger(Number(value))) {
          throw new Error(this.getMessage(rule, 'types.integer', field) || '必须是整数')
        }
        break
      case 'float':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error(this.getMessage(rule, 'types.float', field) || '必须是浮点数')
        }
        break
      case 'regexp':
        try {
          new RegExp(String(value))
        } catch {
          throw new Error(this.getMessage(rule, 'types.regexp', field) || '正则表达式格式不正确')
        }
        break
      case 'hex':
        const hexRegex = /^#[0-9A-Fa-f]{6}$/
        if (!hexRegex.test(String(value))) {
          throw new Error(this.getMessage(rule, 'types.hex', field) || '十六进制颜色格式不正确')
        }
        break
    }
  }

  private async validateLength(
    value: FieldValue,
    expectedLength: number,
    type: 'len' | 'min' | 'max',
    rule: Rule,
    field: string,
  ): Promise<void> {
    let actualLength: number

    if (typeof value === 'string' || Array.isArray(value)) {
      actualLength = value.length
    } else if (typeof value === 'number') {
      actualLength = value
    } else {
      return
    }

    let valid = false
    let messageKey = ''
    let defaultMessage = ''

    switch (type) {
      case 'len':
        valid = actualLength === expectedLength
        messageKey = Array.isArray(value)
          ? 'array.len'
          : typeof value === 'string'
            ? 'string.len'
            : 'number.len'
        defaultMessage = `长度必须是 ${expectedLength}`
        break
      case 'min':
        valid = actualLength >= expectedLength
        messageKey = Array.isArray(value)
          ? 'array.min'
          : typeof value === 'string'
            ? 'string.min'
            : 'number.min'
        defaultMessage = `最小长度为 ${expectedLength}`
        break
      case 'max':
        valid = actualLength <= expectedLength
        messageKey = Array.isArray(value)
          ? 'array.max'
          : typeof value === 'string'
            ? 'string.max'
            : 'number.max'
        defaultMessage = `最大长度为 ${expectedLength}`
        break
    }

    if (!valid) {
      throw new Error(this.getMessage(rule, messageKey, field) || defaultMessage)
    }
  }

  private getMessage(
    rule: Rule,
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    field: string,
  ): string | undefined {
    // Rule message takes priority
    if (rule.message) {
      return typeof rule.message === 'function'
        ? rule.message(rule.message as unknown as FieldValue, rule)
        : rule.message
    }

    // Get message from validateMessages
    const keys = path.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let message: any = this.validateMessages

    for (const key of keys) {
      if (message && typeof message === 'object') {
        message = message[key as keyof typeof message]
      } else {
        message = undefined
        break
      }
    }

    if (message) {
      return typeof message === 'function' ? message() : message
    }

    return undefined
  }

  setValidateMessages(messages: ValidateMessages) {
    this.validateMessages = { ...this.validateMessages, ...messages }
  }
}

// Default validate messages
export const defaultValidateMessages: ValidateMessages = {
  default: '字段验证错误',
  required: '此字段是必填的',
  enum: '值不在允许的选项中',
  whitespace: '不能只包含空格',
  date: {
    format: '日期格式不正确',
    parse: '无法解析日期',
    invalid: '无效的日期',
  },
  types: {
    string: '必须是字符串',
    method: '必须是函数',
    array: '必须是数组',
    object: '必须是对象',
    number: '必须是数字',
    date: '必须是有效日期',
    boolean: '必须是布尔值',
    integer: '必须是整数',
    float: '必须是浮点数',
    regexp: '正则表达式格式不正确',
    email: '邮箱格式不正确',
    url: 'URL格式不正确',
    hex: '十六进制颜色格式不正确',
  },
  string: {
    len: '长度必须是 ${len} 个字符',
    min: '最少 ${min} 个字符',
    max: '最多 ${max} 个字符',
    range: '长度必须在 ${min}-${max} 个字符之间',
  },
  number: {
    len: '必须等于 ${len}',
    min: '不能小于 ${min}',
    max: '不能大于 ${max}',
    range: '必须在 ${min}-${max} 之间',
  },
  array: {
    len: '长度必须是 ${len}',
    min: '最少 ${min} 项',
    max: '最多 ${max} 项',
    range: '长度必须在 ${min}-${max} 之间',
  },
  pattern: {
    mismatch: '格式不正确',
  },
}
