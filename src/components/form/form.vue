<template>
  <form :class="formClasses" :style="style" @submit.prevent="handleSubmit">
    <div class="adm-form-body" ref="formRef" :style="bodyStyle">
      <List v-if="!isIncludeArray" :mode="props.mode">
        <template #header>
          <slot name="header" />
        </template>
        <slot />
      </List>
      <template v-else>
        <slot />
      </template>
    </div>

    <div v-if="footer || $slots.footer" class="adm-form-footer">
      <slot name="footer" :handleSubmit="handleSubmit">
        <component :is="footer" v-if="footer" />
      </slot>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref, useSlots, type Component } from 'vue'
import { useConfig } from '../config-provider/useConfig'
import { provideFormContext } from './context'
import { useForm } from './form-store'
import List from '../list/list.vue'
import type { FieldData, FormInstance, FormLayout, ValidateMessages } from './types'
import { defaultFormContext, type FieldValue } from './types'
import { mergeClasses } from './utils'

interface FormProps {
  // Form control
  form?: FormInstance
  initialValues?: Record<string, FieldValue | object>
  name?: string
  preserve?: boolean
  validateMessages?: ValidateMessages
  validateTrigger?: string | string[]
  fixedHeight?: boolean

  // Events
  onFieldsChange?: (changedFields: FieldData[], allFields: FieldData[]) => void
  onFinish?: (values: Record<string, FieldValue>) => void
  onFinishFailed?: (errorInfo: {
    values: Record<string, FieldValue>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorFields: any[]
    outOfDate: boolean
  }) => void
  onValuesChange?: (
    changedValues: Record<string, FieldValue>,
    allValues: Record<string, FieldValue>,
  ) => void

  // Style
  className?: string
  style?: Record<string, string | number>

  // Form context
  hasFeedback?: boolean
  layout?: FormLayout
  disabled?: boolean
  requiredMarkStyle?: 'asterisk' | 'text-required' | 'text-optional' | 'none'
  optionalText?: string

  // Layout
  footer?: Component
  mode?: 'default' | 'card'
}

const props = withDefaults(defineProps<FormProps>(), {
  hasFeedback: true,
  layout: 'vertical',
  requiredMarkStyle: 'asterisk',
  optionalText: '',
  disabled: false,
  preserve: true,
  mode: 'default',
  fixedHeight: false,
})

const bodyStyle = computed(() => {
  return props.fixedHeight ? { height: `${window.innerHeight - 90}px` } : {}
})

const emit = defineEmits<{
  fieldsChange: [changedFields: FieldData[], allFields: FieldData[]]
  finish: [values: Record<string, FieldValue>]
  finishFailed: [
    errorInfo: {
      values: Record<string, FieldValue>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errorFields: any[]
      outOfDate: boolean
    },
  ]
  valuesChange: [changedValues: Record<string, FieldValue>, allValues: Record<string, FieldValue>]
}>()

// Get config
const { locale } = useConfig()

// Create form store
const [formStore] = useForm()

// Merged validate messages
const mergedValidateMessages = computed(() => {
  const defaultMessages = locale.Form?.defaultValidateMessages || {}
  return {
    ...defaultMessages,
    ...props.validateMessages,
  }
})

const slots = useSlots()
const isIncludeArray = computed(() => {
  const defaultSlots = slots.default ? slots.default() : []
  return defaultSlots.some((slot) => slot.type && (slot.type as Component).name === 'FormArray')
})

// Set up form store
onMounted(() => {
  if (props.initialValues) {
    formStore.setInitialValues(props.initialValues)
  }

  // Set merged validate messages
  formStore.setValidateMessages(mergedValidateMessages.value)

  formStore.setPreserve(props.preserve)

  // Set up callbacks
  formStore.setCallbacks({
    onFieldsChange: (changedFields, allFields) => {
      props.onFieldsChange?.(changedFields, allFields)
      emit('fieldsChange', changedFields, allFields)
    },
    onValuesChange: (changedValues, allValues) => {
      props.onValuesChange?.(changedValues, allValues)
      emit('valuesChange', changedValues, allValues)
    },
    onFinish: (values) => {
      // props.onFinish?.(values)
      emit('finish', values)
    },
    onFinishFailed: (errorInfo) => {
      props.onFinishFailed?.(errorInfo)
      emit('finishFailed', errorInfo)
    },
  })
})

// Provide contexts
const formContext = computed(() => ({
  name: props.name,
  hasFeedback: props.hasFeedback ?? defaultFormContext.hasFeedback,
  layout: props.layout ?? defaultFormContext.layout,
  requiredMarkStyle: props.requiredMarkStyle ?? defaultFormContext.requiredMarkStyle,
  disabled: props.disabled ?? defaultFormContext.disabled,
  optionalText: props.optionalText,
}))

provideFormContext(formContext.value)
provide('formStore', formStore)

// Expose form instance methods
const formInstance: FormInstance = {
  getFieldValue: (name) => formStore.getFieldValue(name),
  getFieldsValue: (nameList) => formStore.getFieldsValue(nameList),
  getFieldError: (name) => formStore.getFieldError(name),
  getFieldsError: (nameList) => formStore.getFieldsError(nameList),
  isFieldTouched: (name) => formStore.isFieldTouched(name),
  isFieldsTouched: (nameList) => formStore.isFieldsTouched(nameList),
  resetFields: (fields) => formStore.resetFields(fields),
  setFields: (fields) => formStore.setFields(fields),
  setFieldValue: (name, value) => formStore.setFieldValue(name, value),
  setArrayFieldValue: (name, arr) => formStore.setArrayFieldValue(name, arr),
  setFieldsValue: (values) => formStore.setFieldsValue(values),
  submit: () => formStore.submit(),
  validateFields: (nameList) => formStore.validateFields(nameList),
}

defineExpose(formInstance)

// Process children slots to create lists
const formRef = ref<HTMLElement>()

// CSS classes
const formClasses = computed(() => {
  return mergeClasses('adm-form', props.className)
})

// Form submission
const handleSubmit = () => {
  formStore.submit()
}
</script>
