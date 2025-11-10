<template>
  <Popup
    :style="props.popupStyle"
    :className="classNames(`${classPrefix}-popup`, props.popupClassName)"
    :visible="currentVisible"
    position="bottom"
    :onMaskClick="handleMaskClick"
    :getContainer="props.getContainer"
    :destroyOnClose="props.destroyOnClose"
    :afterShow="props.afterShow"
    :afterClose="props.afterClose"
    :onClick="props.onClick"
    :forceRender="props.forceRender"
    :stopPropagation="props.stopPropagation"
  >
    <div :class="[classPrefix, props.className]" :style="mergedStyle">
      <div :class="`${classPrefix}-top`" v-if="$slots.top">
        <slot name="top"></slot>
      </div>
      <div :class="`${classPrefix}-header`">
        <a role="button" :class="`${classPrefix}-header-button`" @click="handleCancel">
          <slot name="cancelText" :text="currentCancelText">
            {{ currentCancelText }}
          </slot>
        </a>
        <div :class="`${classPrefix}-header-title`">
          <slot name="title" :title="props.title">
            <component v-if="isVNode(props.title)" :is="props.title" />
            <template v-else>{{ props.title }}</template>
          </slot>
        </div>
        <a
          role="button"
          :class="
            classNames(
              `${classPrefix}-header-button`,
              props.loading && `${classPrefix}-header-button-disabled`,
            )
          "
          @click="handleConfirm"
          :aria-disabled="props.loading"
        >
          <slot name="confirmText" :text="currentConfirmText">
            {{ currentConfirmText }}
          </slot>
        </a>
      </div>
      <div :class="`${classPrefix}-body`">
        <PickerView
          :loading="props.loading"
          :loadingContent="props.loadingContent"
          :columns="props.columns"
          :renderLabel="props.renderLabel"
          :value="innerPickerValue"
          :mouseWheel="props.mouseWheel"
          :units="props.units"
          @change="handlePickerChange"
        >
          <template v-slot:empty v-if="$slots.empty">
            <slot name="empty"></slot>
          </template>
        </PickerView>
      </div>
    </div>
    <SafeArea position="bottom" />
  </Popup>

  <!-- 渲染 children slot -->
  <slot :items="extend.items" :actions="actions" />
</template>

<script setup lang="ts">
import classNames from 'classnames'
import { computed, ref, watch, type CSSProperties, type VNode } from 'vue'
import { useConfig } from '../config-provider/useConfig'
import type {
  PickerColumn,
  PickerColumnItem,
  PickerValue,
  PickerValueExtend,
} from '../picker-view/index'
import { PickerView, defaultRenderLabel, useColumnsExtend } from '../picker-view/index'
import { generateColumnsExtend } from '../picker-view/columns-extend'
import Popup from '../popup/popup.vue'
import type { PopupProps } from '../popup/popup.vue'
import SafeArea from '../safe-area/index.vue'

const classPrefix = 'adm-picker'

export interface PickerActions {
  open: () => void
  close: () => void
  toggle: () => void
}

export interface PickerProps {
  columns: PickerColumn[] | ((value: PickerValue[]) => PickerColumn[])
  value?: PickerValue[]
  defaultValue?: PickerValue[]
  loading?: boolean
  loadingContent?: VNode | string
  onSelect?: (value: PickerValue[], extend: PickerValueExtend) => void
  onConfirm?: (value: PickerValue[], extend: PickerValueExtend) => void
  onCancel?: () => void
  onClose?: () => void
  closeOnMaskClick?: boolean
  visible?: boolean
  title?: VNode | string
  confirmText?: VNode | string
  cancelText?: VNode | string
  renderLabel?: (item: PickerColumnItem) => VNode | string | number
  mouseWheel?: boolean
  popupClassName?: string
  popupStyle?: CSSProperties
  // 从 PopupProps 继承的属性
  getContainer?: PopupProps['getContainer']
  afterShow?: PopupProps['afterShow']
  afterClose?: PopupProps['afterClose']
  onClick?: PopupProps['onClick']
  stopPropagation?: PopupProps['stopPropagation']
  forceRender?: PopupProps['forceRender']
  destroyOnClose?: PopupProps['destroyOnClose']
  // NativeProps
  className?: string
  style?: CSSProperties
  units?: string[]
}

const props = withDefaults(defineProps<PickerProps>(), {
  columns: () => [],
  defaultValue: () => [],
  value: undefined,
  closeOnMaskClick: true,
  renderLabel: defaultRenderLabel,
  destroyOnClose: false,
  forceRender: false,
  loading: false,
  mouseWheel: false,
  visible: undefined,
  className: '',
  style: () => ({}),
  popupClassName: '',
  popupStyle: () => ({}),
  stopPropagation: () => ['click'],
  units: undefined,
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  'update:value': [value: PickerValue[]]
  select: [value: PickerValue[], extend: PickerValueExtend]
  confirm: [value: PickerValue[], extend: PickerValueExtend]
  cancel: []
  close: []
}>()

// 使用 config
const { locale } = useConfig()

// 计算 confirm 和 cancel 文本
const currentConfirmText = computed(() => props.confirmText ?? locale.common.confirm)
const currentCancelText = computed(() => props.cancelText ?? locale.common.cancel)

// 可见性状态管理
const innerVisible = ref(props.visible ?? false)
const isControlled = computed(() => props.visible !== undefined)

const currentVisible = computed(() => (isControlled.value ? props.visible! : innerVisible.value))

const setVisible = (visible: boolean) => {
  if (!isControlled.value) {
    innerVisible.value = visible
  }
  emit('update:visible', visible)

  if (visible === false) {
    emit('close')
    props.onClose?.()
  }
}

const tempValue = props.value ? props.value : props.defaultValue
// 值状态管理
const innerValue = ref<PickerValue[]>([...tempValue])
const innerPickerValue = ref<PickerValue[]>([...tempValue])
const isValueControlled = computed(() => props.value !== undefined)

const currentValue = computed(() => (isValueControlled.value ? props.value! : innerValue.value))

const setValue = (value: PickerValue[], emitConfirm = false) => {
  if (!isValueControlled.value) {
    innerValue.value = [...value]
  }

  // 处理默认值
  let defValue: PickerValue[] = value
  if (defValue.length === 0 && props.columns.length) {
    const columns = typeof props.columns === 'function' ? props.columns([]) : props.columns
    defValue = columns.map((column: PickerColumn) => {
      const target = column[0] as PickerColumnItem
      if (typeof target === 'object') {
        return target.value
      } else {
        return target as PickerValue
      }
    })
  }

  emit('update:value', defValue)

  if (emitConfirm) {
    const extend = generateColumnsExtend(props.columns, defValue)
    emit('confirm', defValue, extend)
    // props.onConfirm?.(value, extend)
  }
}

// 监听 visible 变化，重置内部选择值
watch(
  () => currentVisible.value,
  (visible) => {
    if (visible) {
      if (currentValue.value.length) {
        innerPickerValue.value = [...currentValue.value]
      } else {
        const first = props.columns.length ? (props.columns as PickerColumn[])[0] : []
        const value = first?.length ? (first[0] as PickerColumnItem).value : null
        innerPickerValue.value = value ? [value] : []
      }
    }
  },
  { immediate: true },
)

// 监听 value 变化
watch(
  () => currentValue.value,
  (newValue) => {
    innerPickerValue.value = [...newValue]
  },
  { immediate: true },
)

// 使用 columns extend
const extend = useColumnsExtend(
  computed(() => props.columns),
  computed(() => currentValue.value),
)

// Actions
const actions: PickerActions = {
  toggle: () => setVisible(!currentVisible.value),
  open: () => {
    setVisible(true)
  },
  close: () => setVisible(false),
}

// 事件处理
const handleMaskClick = () => {
  if (!props.closeOnMaskClick) return
  handleCancel()
}

const handleCancel = () => {
  emit('cancel')
  props.onCancel?.()
  setVisible(false)
}

const judgeValueIsExist = () => {
  if (!Array.isArray(props.columns)) return false
  if (props.columns.length === 0) return false
  if (innerPickerValue.value.length !== 1) return false
  const primarys = props.columns[0]
  let target = primarys.find(
    (item) => (typeof item === 'object' ? item.value : item) === innerPickerValue.value[0],
  ) as PickerColumnItem
  if (target) return false
  target = primarys[0] as PickerColumnItem
  return [typeof target === 'object' ? target.value : target]
}

const handleConfirm = () => {
  if (props.loading) return
  const jv = judgeValueIsExist()
  const value = !!jv ? jv : innerPickerValue.value
  setValue(value, true)
  setVisible(false)
}

const handlePickerChange = (value: PickerValue[], extend: PickerValueExtend) => {
  innerPickerValue.value = value
  if (currentVisible.value) {
    emit('select', value, extend)
    // props.onSelect?.(value, extend)
  }
}

// 合并样式
const mergedStyle = computed(() => {
  const baseStyle: Record<string, string | number> = {}

  // 处理 CSS 变量
  if (props.style) {
    Object.assign(baseStyle, props.style)
  }

  return baseStyle
})

// 工具函数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isVNode(value: any): value is VNode {
  return value && typeof value === 'object' && typeof value.type !== 'undefined'
}

// 暴露 actions 给父组件
defineExpose({
  actions,
  open: actions.open,
  close: actions.close,
  toggle: actions.toggle,
})

defineOptions({
  name: 'Picker',
  inheritAttrs: false,
})
</script>

<style>
@import './picker.less';
</style>
