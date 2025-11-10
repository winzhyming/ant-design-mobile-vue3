<template>
  <div :class="stepperClass" :style="cssVars">
    <Button
      :class="`${classPrefix}-minus`"
      @click="handleMinus"
      :disabled="minusDisabled"
      type="button"
      :aria-label="locale?.Stepper?.decrease || '减少'"
      v-if="props.button"
    >
      <MinusOutline />
    </Button>

    <div :class="`${classPrefix}-middle`">
      <Input
        ref="inputRef"
        :class="`${classPrefix}-input`"
        :placeholder="props.placeholder"
        @focus="handleFocus"
        :value="inputValue"
        @input="handleInputChange"
        :disabled="disabled"
        @blur="handleBlur"
        :readonly="inputReadOnly"
        role="spinbutton"
        :aria-valuenow="Number(inputValue)"
        :aria-valuemax="max ? Number(max) : undefined"
        :aria-valuemin="min ? Number(min) : undefined"
        inputmode="decimal"
      />
    </div>

    <Button
      :class="`${classPrefix}-plus`"
      @click="handlePlus"
      :disabled="plusDisabled"
      type="button"
      :aria-label="locale?.Stepper?.increase || '增加'"
      v-if="props.button"
    >
      <AddOutline />
    </Button>
    <div class="subfix" v-if="props.subfix">{{ props.subfix }}</div>
  </div>
</template>

<script setup lang="ts" generic="ValueType extends number | string">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import classNames from 'classnames'
import { MinusOutline, AddOutline } from 'ant-mobile-icons-vue3'
import getMiniDecimal, { toFixed, type DecimalClass } from '@rc-component/mini-decimal'
import { mergeProps } from '../../utils/with-default-props'
import Input from '../input/input.vue'
import Button from '../button/index.vue'
import { useConfig } from '../config-provider/useConfig'
import type { StepperProps, StepperRef, MergedStepperProps } from './types'

const classPrefix = 'adm-stepper'

// 用 withDefaults + StepperProps 类型定义 props
const props = withDefaults(defineProps<StepperProps>(), {
  step: 1,
  min: undefined,
  max: undefined,
  digits: undefined,
  disabled: false,
  allowEmpty: false,
  inputReadOnly: false,
  placeholder: undefined,
  value: undefined,
  defaultValue: undefined,
  parser: undefined,
  formatter: undefined,
  onFocus: undefined,
  onBlur: undefined,
  onChange: undefined,
  stringMode: false,
  button: true,
  subfix: undefined,
  // ... 其他样式变量默认值 ...
})

const emit = defineEmits<{
  'update:value': [value: ValueType | null]
  change: [value: ValueType | null]
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
}>()

// 获取配置
const { locale } = useConfig()

// 内部状态
const inputRef = ref<HTMLInputElement | null>(null)
const focused = ref(false)
const innerValue = ref<ValueType | null>(
  (props.defaultValue ?? (0 as ValueType)) as ValueType | null,
)
const inputValue = ref('')

// 计算属性
const isControlled = computed(() => props.value !== undefined)

const currentValue = computed(() => {
  return isControlled.value ? props.value : innerValue.value
})

const mergedProps = computed(() => mergeProps({}, props) as MergedStepperProps<ValueType>)

const stepperClass = computed(() =>
  classNames(classPrefix, {
    [`${classPrefix}-active`]: focused.value,
  }),
)

const cssVars = computed(() => {
  const vars: Record<string, string> = {}
  const cssProps = [
    '--height',
    '--input-width',
    '--input-font-size',
    '--input-background-color',
    '--border-radius',
    '--border',
    '--border-inner',
    '--active-border',
    '--button-font-size',
    '--button-background-color',
    '--button-width',
    '--input-font-color',
    '--button-text-color',
  ]

  cssProps.forEach((prop) => {
    const key = prop as keyof typeof props
    if (props[key]) {
      vars[prop] = props[key] as string
    }
  })

  return vars
})

// 值处理函数
const fixedValue = (value: ValueType): string => {
  const fixedVal =
    mergedProps.value.digits !== undefined
      ? toFixed(value.toString(), '.', mergedProps.value.digits)
      : value
  return fixedVal.toString()
}

const getValueAsType = (value: DecimalClass): ValueType => {
  return (mergedProps.value.stringMode ? value.toString() : value.toNumber()) as ValueType
}

const parseValue = (text: string): string | null => {
  if (text === '') return null

  if (mergedProps.value.parser) {
    return String(mergedProps.value.parser(text))
  }

  const decimal = getMiniDecimal(text)
  return decimal.isInvalidate() ? null : decimal.toString()
}

const formatValue = (value: ValueType | null): string => {
  if (value === null || value === undefined) return ''
  return mergedProps.value.formatter ? mergedProps.value.formatter(value) : fixedValue(value)
}

// 设置值
const setValue = (newValue: ValueType | null) => {
  if (!isControlled.value) {
    innerValue.value = newValue
  }
  emit('update:value', newValue)
  emit('change', newValue)
  mergedProps.value.onChange?.(newValue as ValueType)
}

const setValueWithCheck = (nextValue: DecimalClass) => {
  if (nextValue.isNaN()) return

  let target = nextValue

  // 限制范围
  if (mergedProps.value.min !== undefined) {
    const minDecimal = getMiniDecimal(mergedProps.value.min)
    if (target.lessEquals(minDecimal)) {
      target = minDecimal
    }
  }

  if (mergedProps.value.max !== undefined) {
    const maxDecimal = getMiniDecimal(mergedProps.value.max)
    if (maxDecimal.lessEquals(target)) {
      target = maxDecimal
    }
  }

  // 修正位数
  if (mergedProps.value.digits !== undefined) {
    target = getMiniDecimal(fixedValue(getValueAsType(target)))
  }

  setValue(getValueAsType(target))
}

// 事件处理
const handleInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const v = target.value
  inputValue.value = v
  const valueStr = parseValue(v)

  if (valueStr === null) {
    if (mergedProps.value.allowEmpty) {
      setValue(null)
    } else {
      setValue((mergedProps.value.defaultValue ?? (0 as ValueType)) as ValueType)
    }
  } else {
    setValueWithCheck(getMiniDecimal(valueStr))
  }
}

const triggerFocus = (nextFocus: boolean) => {
  focused.value = nextFocus

  // 聚焦时转换为原始文本
  if (nextFocus) {
    inputValue.value =
      currentValue.value !== null && currentValue.value !== undefined
        ? String(currentValue.value)
        : ''
  }
}

const handleFocus = (e: FocusEvent) => {
  triggerFocus(true)
  emit('focus', e)
  mergedProps.value.onFocus?.(e)
}

const handleBlur = (e: FocusEvent) => {
  triggerFocus(false)
  emit('blur', e)
  mergedProps.value.onBlur?.(e)
}

// 操作按钮
const handleOffset = (positive: boolean) => {
  let stepValue = getMiniDecimal(mergedProps.value.step)
  if (!positive) {
    stepValue = stepValue.negate()
  }

  setValueWithCheck(getMiniDecimal(currentValue.value ?? 0).add(stepValue.toString()))
}

const handleMinus = () => {
  handleOffset(false)
}

const handlePlus = () => {
  handleOffset(true)
}

// 按钮禁用状态
const minusDisabled = computed(() => {
  if (mergedProps.value.disabled) return true
  if (currentValue.value === null) return false
  if (mergedProps.value.min !== undefined) {
    return currentValue.value <= mergedProps.value.min
  }
  return false
})

const plusDisabled = computed(() => {
  if (mergedProps.value.disabled) return true
  if (currentValue.value === null) return false
  if (mergedProps.value.max !== undefined) {
    return currentValue.value >= mergedProps.value.max
  }
  return false
})

// 监听聚焦状态，选中文本
watch(
  () => focused.value,
  async (isFocused) => {
    if (isFocused) {
      await nextTick()
      inputRef.value?.select?.()
    }
  },
)

// 失焦时格式化值
watch(
  () => [focused.value, currentValue.value, mergedProps.value.digits],
  () => {
    if (!focused.value) {
      inputValue.value = formatValue(currentValue.value)
    }
  },
)

// 初始化输入值
onMounted(() => {
  inputValue.value = formatValue(currentValue.value)
})

// 暴露方法
defineExpose<StepperRef>({
  focus: () => {
    inputRef.value?.focus()
  },
  blur: () => {
    inputRef.value?.blur()
  },
  get nativeElement() {
    return inputRef.value ?? null
  },
})
</script>

<style lang="less" scoped>
@import './stepper.less';
</style>
