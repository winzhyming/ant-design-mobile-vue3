<!-- eslint-disable vue/valid-v-model -->
<template>
  <div v-if="noStyle && !hidden">
    <slot v-if="isRenderFunction" :form="formContext" />
    <component
      v-else-if="childComponent"
      :is="childComponent"
      v-bind="childProps"
      v-model:value="fieldValue"
      @change="handleChange"
      @blur="handleBlur"
    />
    <div v-else>
      <!-- eslint-disable vue/valid-v-model -->
      <slot v-bind="childProps" :value="fieldValue" @change="handleChange" @blur="handleBlur" />
    </div>
  </div>
  <ListItem
    v-else
    :style="mergedProps.style"
    :class="itemClasses"
    :disabled="mergedDisabled"
    :clickable="mergedProps.clickable"
    :arrow="mergedProps.arrowIcon || mergedProps.arrow"
    @click="handleClick"
  >
    <template #title v-if="mergedLayout === 'vertical' && labelElement">
      <component :is="labelElement" />
    </template>

    <template #prefix v-if="mergedLayout === 'horizontal' && labelElement">
      <component :is="labelElement" />
    </template>
    <template #extra v-if="mergedProps.extra || $slots.extra">
      <slot name="extra">{{ mergedProps.extra }}</slot>
    </template>

    <template #description v-if="mergedDescription">
      <div>
        <component v-if="mergedProps.description" :is="mergedProps.description" />
        <div v-if="mergedHasFeedback">
          <div
            v-for="(error, index) in errors"
            :key="`error-${index}`"
            class="adm-form-item-feedback-error"
          >
            {{ error }}
          </div>
          <div
            v-for="(warning, index) in warnings"
            :key="`warning-${index}`"
            class="adm-form-item-feedback-warning"
          >
            {{ warning }}
          </div>
        </div>
      </div>
    </template>

    <div :class="childClasses" ref="widgetRef">
      <div class="adm-form-item-child-inner">
        <slot v-if="isRenderFunction" :form="formContext" />
        <component
          v-else-if="childComponent"
          :is="childComponent"
          v-bind="childProps"
          v-model:value="fieldValue"
          @change="handleChange"
          @blur="handleBlur"
        />
        <div v-else>
          <slot v-bind="childProps" :value="fieldValue" @change="handleChange" @blur="handleBlur" />
        </div>
      </div>
    </div>
  </ListItem>
</template>

<script setup lang="ts">
import {
  computed,
  h,
  inject,
  ref,
  useSlots,
  watchEffect,
  type Component,
  type Ref,
  onUnmounted,
} from 'vue'
// Import the real components
import { QuestionCircleOutline } from 'ant-mobile-icons-vue3'
import { useConfig } from '../config-provider/useConfig'
import ListItem from '../list/item.vue'
import Popover from '../popover/popover.vue'
import type { Placement } from '../popover/normalize-placement'
import { provideNoStyleItemContext, useFormContext, useNoStyleItemContext } from './context.ts'
import { FormStore } from './form-store'
import type { FieldValue, FormLayout, Meta, NamePath, Rule } from './types'
// eslint-disable-next-line vue/no-dupe-keys
import { createFieldId, getValueFromEvent, isRequired, mergeClasses, toArray } from './utils'
import { devWarning } from '../../utils/dev-log.ts'
import { undefinedFallback } from '../../utils/undefined-fallback.ts'

defineOptions({
  name: 'FormItem',
})

interface FormItemProps {
  // Field props
  icon?: Component
  name?: NamePath
  rules?: Rule[]
  dependencies?: NamePath[]
  valuePropName?: string
  trigger?: string
  validateTrigger?: string | string[]
  shouldUpdate?:
    | boolean
    | ((prevValues: FieldValue | FieldValue[], curValues: FieldValue | FieldValue[]) => boolean)
  initialValue?: FieldValue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getValueFromEvent?: (event: any) => FieldValue
  getValueProps?: (value: FieldValue) => Record<string, FieldValue>
  normalize?: (
    value: FieldValue,
    prevValue: FieldValue,
    allValues: Record<string, FieldValue>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any
  preserve?: boolean
  validateFirst?: boolean
  messageVariables?: Record<string, string>

  // Layout props
  style?: Record<string, string | number>
  className?: string
  label?: string
  help?: string
  helpIcon?: string | Component
  extra?: string
  description?: string
  required?: boolean
  noStyle?: boolean
  disabled?: boolean
  hidden?: boolean
  layout?: FormLayout
  childElementPosition?: 'normal' | 'right'
  hasFeedback?: boolean
  clickable?: boolean
  arrow?: boolean
  arrowIcon?: Component
  helpPlacement?: Placement | undefined
  // Events
  onClick?: (e: Event, widgetRef: Ref<HTMLElement>) => void
  helpClick?: () => void
}

const props = withDefaults(defineProps<FormItemProps>(), {
  icon: undefined,
  trigger: 'onChange, onBlur',
  valuePropName: 'value',
  childElementPosition: 'normal',
  validateFirst: false,
  validateTrigger: () => ['onChange', 'onBlur'],
  preserve: true,
  help: undefined,
  required: undefined,
  hasFeedback: undefined,
  description: undefined,
  layout: undefined,
  helpPlacement: undefined,
  helpClick: undefined,
})

const emit = defineEmits<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  click: [e: Event, widgetRef: any]
}>()

// Get contexts
const formContext = useFormContext()
const formStore = inject<FormStore>('formStore')
const notifyParentMetaChange = useNoStyleItemContext()
const { locale, form: componentConfig = {} } = useConfig()

// Merge props with config
const mergedProps = computed(() => ({
  ...componentConfig,
  ...props,
}))

// Widget ref
const widgetRef = ref<HTMLElement | null>(null)

// Sub metas for nested fields
const subMetas = ref<Record<string, Meta>>({})

const onSubMetaChange = (meta: Meta & { destroy?: boolean }, namePath: (string | number)[]) => {
  const nameKey = namePath.join('__SPLIT__')
  if (meta.destroy) {
    delete subMetas.value[nameKey]
  } else {
    subMetas.value[nameKey] = meta
  }
}

provideNoStyleItemContext(onSubMetaChange)

// Field registration and control
const fieldControl = computed(() => {
  if (!props.name || !formStore) return null
  return formStore.registerField(props.name, props.rules)
})

const fieldValue = computed({
  get: () => {
    if (!fieldControl.value) return undefined
    return fieldControl.value.value.value
  },
  set: (value) => {
    if (fieldControl.value) {
      fieldControl.value.setValue(value)
    }
  },
})

const fieldMeta = computed(() => {
  if (!fieldControl.value) return null
  return fieldControl.value.meta.value
})

// Notify store about hidden state so store can skip validation for hidden fields
if (fieldControl.value && formStore) {
  // on mount
  formStore.setFieldHidden(props.name as NamePath, !!props.hidden)
  // watch for hidden prop change
  watchEffect(() => {
    formStore.setFieldHidden(props.name as NamePath, !!props.hidden)
  })
}

onUnmounted(() => {
  if (formStore) formStore.setFieldHidden(props.name as NamePath, true)
})

// Computed properties
const mergedValidateTrigger = computed(() => {
  return undefinedFallback(
    props.validateTrigger,
    formContext.name, // This would be from field context in original
    props.trigger,
  )
})

const mergedDisabled = computed(() => {
  return props.disabled ?? formContext.disabled
})

const mergedHasFeedback = computed(() => {
  return props.hasFeedback !== undefined ? props.hasFeedback : formContext.hasFeedback
})

const mergedLayout = computed(() => {
  return props.layout || formContext.layout
})

const isRenderFunction = computed(() => {
  // In Vue, we use slots instead of render functions
  return false
})

const isFieldRequired = computed(() => {
  return props.required !== undefined ? props.required : isRequired(props.rules)
})

const fieldId = computed(() => {
  if (!props.name) return ''
  const nameList = toArray(props.name)
  return createFieldId(formContext.name, nameList)
})

// Error and warning handling
const errors = computed(() => {
  const curErrors = fieldMeta.value?.errors ?? []
  const subErrors = Object.keys(subMetas.value).reduce((acc: string[], key) => {
    const errors = subMetas.value[key]?.errors ?? []
    return [...acc, ...errors]
  }, [])
  return [...curErrors, ...subErrors]
})

const warnings = computed(() => {
  const curWarnings = fieldMeta.value?.warnings ?? []
  const subWarnings = Object.keys(subMetas.value).reduce((acc: string[], key) => {
    const warnings = subMetas.value[key]?.warnings ?? []
    return [...acc, ...warnings]
  }, [])
  return [...curWarnings, ...subWarnings]
})

// Required mark
const requiredMark = computed(() => {
  const { requiredMarkStyle, optionalText } = formContext
  switch (requiredMarkStyle) {
    case 'asterisk':
      return isFieldRequired.value
        ? h('span', { class: 'adm-form-item-required-asterisk' }, '*')
        : null
    case 'text-required':
      return isFieldRequired.value
        ? h('span', { class: 'adm-form-item-required-text' }, `(${locale.Form.required})`)
        : null
    case 'text-optional':
      return !isFieldRequired.value
        ? h(
            'span',
            { class: 'adm-form-item-required-text' },
            `(${optionalText || locale.Form.optional})`,
          )
        : null
    case 'none':
    default:
      return null
  }
})

const formatHelp = () => {
  if (props.helpClick) {
    return h(
      'span',
      {
        class: 'adm-form-item-label-help',
        onClick: (e: Event) => {
          props.helpClick?.()
          e.stopPropagation()
          e.preventDefault()
        },
      },
      [h((props.helpIcon as Component) || h(QuestionCircleOutline))],
    )
  } else {
    return h(
      Popover,
      {
        placement: props.helpPlacement,
        content: props.help,
        trigger: 'click',
      },
      {
        default: () =>
          h(
            'span',
            {
              class: 'adm-form-item-label-help',
              onClick: (e: Event) => {
                props.helpClick?.()
                e.stopPropagation()
                e.preventDefault()
              },
            },
            [h((props.helpIcon as Component) || h(QuestionCircleOutline))],
          ),
      },
    )
  }
}

// Label element
const labelElement = computed(() => {
  if (!props.label) return null
  return h(
    'label',
    {
      class: 'adm-form-item-label',
      for: fieldId.value,
    },
    [
      props.icon && h(props.icon, { class: 'adm-form-item-label-icon' }),
      props.label,
      requiredMark.value,
      props.help && formatHelp(),
    ].filter(Boolean),
  )
})

// Description
const mergedDescription = computed(() => {
  return !!props.description || mergedHasFeedback.value
})

// CSS classes
const itemClasses = computed(() => {
  return mergeClasses('adm-form-item', `adm-form-item-${mergedLayout.value}`, props.className, {
    'adm-form-item-hidden': props.hidden,
    'adm-form-item-has-error': errors.value.length > 0,
  })
})

const childClasses = computed(() => {
  return mergeClasses(
    'adm-form-item-child',
    `adm-form-item-child-position-${props.childElementPosition}`,
  )
})

// 将 useSlots 移到 setup 函数顶层
const slots = useSlots()

// Child component handling
const childComponent = computed(() => {
  // 直接使用已经获取的 slots，而不是在计算属性中调用 useSlots()
  if (!slots.default) return null

  const slotContent = slots.default()
  if (!slotContent || slotContent.length !== 1) return null

  const child = slotContent[0]

  // 检查是否是组件（而不是文本节点或其他类型）
  if (child && child.type && typeof child.type !== 'string' && child.type !== Text) {
    // 返回子组件的类型，而不是整个 VNode
    return child
  }

  return null
})

const childProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseProps: Record<string, any> = {
    // 传递表单字段相关的属性
    value: fieldValue.value,
    disabled: mergedDisabled.value,
  }

  if (fieldId.value) {
    baseProps.id = fieldId.value
  }

  // 根据 valuePropName 设置正确的属性名
  if (props.valuePropName !== 'value') {
    baseProps[props.valuePropName] = fieldValue.value
    delete baseProps.value
  }

  // 应用自定义的 getValueProps
  if (props.getValueProps && fieldValue.value !== undefined) {
    Object.assign(baseProps, props.getValueProps(fieldValue.value))
  }

  // 传递事件处理函数
  baseProps[`on${props.trigger.charAt(0).toUpperCase()}${props.trigger.slice(1)}`] = handleChange

  // 如果有 blur 触发器，也添加 onBlur
  if (mergedValidateTrigger.value.includes('onBlur')) {
    baseProps.onBlur = handleBlur
  }

  return baseProps
})

// Remove unused variables and fix prop usage
// eslint-disable-next-line vue/no-dupe-keys
const { noStyle = false, hidden = false } = mergedProps.value

// Event handlers - use mergedValidateTrigger
const handleChange = (value: FieldValue) => {
  if (!fieldControl.value) return

  const finalValue = props.getValueFromEvent
    ? props.getValueFromEvent(value)
    : getValueFromEvent(value)
  const normalizedValue = props.normalize
    ? props.normalize(finalValue, fieldValue.value, formStore?.getFieldsValue() || {})
    : finalValue

  fieldControl.value.setValue(normalizedValue)

  // Trigger validation if needed
  if (mergedValidateTrigger.value.includes('onChange') && formStore) {
    formStore.validateFields([props.name!])
  }
}

const handleBlur = () => {
  // Mark field as touched
  if (fieldMeta.value && formStore) {
    formStore.setFields([
      {
        name: props.name!,
        touched: true,
      },
    ])
  }
  // Trigger validation if needed
  if (mergedValidateTrigger.value.includes('onBlur') && formStore) {
    formStore.validateFields([props.name!])
  }
}

const handleClick = (e: Event) => {
  if (props.onClick) {
    props.onClick(e, widgetRef as Ref<HTMLElement>)
  }
  emit('click', e, widgetRef.value)
}

// Meta change notification
watchEffect(() => {
  if (props.noStyle && notifyParentMetaChange && fieldMeta.value) {
    const namePath = fieldMeta.value.name
    notifyParentMetaChange(fieldMeta.value, namePath)
  }
})

// Validation warnings - fix the logic
if (process.env.NODE_ENV !== 'production') {
  watchEffect(() => {
    if (props.shouldUpdate && props.dependencies) {
      devWarning('FormItem', "`shouldUpdate` and `dependencies` shouldn't be used together.")
    }

    if (isRenderFunction.value) {
      if (!(props.shouldUpdate || props.dependencies)) {
        devWarning(
          'FormItem',
          '`children` of render props only work with `shouldUpdate` or `dependencies`.',
        )
      }
      if (props.name) {
        devWarning(
          'FormItem',
          "Do not use `name` with `children` of render props since it's not a field.",
        )
      }
    } else if (props.dependencies && !props.name) {
      devWarning('FormItem', 'Must set `name` or use render props when `dependencies` is set.')
    }
  })
}
</script>
