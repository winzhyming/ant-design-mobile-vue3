<template>
  <Popup
    ref="popRef"
    :visible="visibleRef"
    position="bottom"
    :onClose="handleClose"
    :getContainer="getContainer"
  >
    <div class="adm-cascader">
      <div class="adm-cascader-header">
        <a class="adm-cascader-action" @click="handleCancel">{{
          props.cancelText || locale.common.cancel
        }}</a>
        <div class="adm-cascader-title">{{ title }}</div>
        <a class="adm-cascader-action" @click="handleConfirm">{{
          props.confirmText || locale.common.confirm
        }}</a>
      </div>

      <div class="adm-cascader-body">
        <CascaderView ref="cascaderViewRef" v-bind="viewProps" v-model:value="innerValue" />
      </div>
    </div>
  </Popup>
  <slot :items="displayItems" :actions="actions" />
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import CascaderView from '../cascader-view/cascader-view.vue'
import { optionSkeleton } from '../cascader-view/option-skeleton'
import type { CascaderOption, CascaderValue } from '../cascader-view/types'
import { useConfig } from '../config-provider/useConfig'
import Popup from '../popup/popup.vue'
import { useCascaderValueExtend } from '../cascader-view/use-cascader-value-extend'

export type CascaderGenerateItems = { items: (CascaderOption | null)[]; isLeaf: boolean }

const popRef = ref(null)
const cascaderViewRef = ref<typeof CascaderView | null>(null)
const props = withDefaults(
  defineProps<{
    options?: CascaderOption[]
    value?: CascaderValue[]
    defaultValue?: CascaderValue[]
    visible?: boolean
    defaultVisible?: boolean
    title?: string
    placeholder?: string | ((index: number) => string)
    onChange?: (value: CascaderValue[], extend?: CascaderGenerateItems) => void
    onVisibleChange?: (visible: boolean) => void
    getContainer?: HTMLElement | string | (() => HTMLElement)
    style?: Record<string, string | number>
    confirmText?: string
    cancelText?: string
  }>(),
  {
    options: () => optionSkeleton,
    defaultValue: () => [],
    value: undefined,
    defaultVisible: false,
    title: '',
    placeholder: undefined,
    style: () => ({}),
  },
)

const generateItems = ref<(CascaderOption | null)[]>([])
const displayItems = ref<(CascaderOption | null)[]>([])

const emit = defineEmits<{
  (e: 'update:value', v: CascaderValue[]): void
  (e: 'update:visible', v: boolean): void
  (e: 'change', v: CascaderValue[], extend?: CascaderGenerateItems): void
  (e: 'confirm', v: CascaderValue[], extend?: CascaderGenerateItems): void
  (e: 'select', v: CascaderValue[], extend?: CascaderGenerateItems): void
  (e: 'visibleChange', v: boolean): void
  (e: 'close'): void
}>()

const { locale } = useConfig()

// controlled / uncontrolled value (array)
const innerValue = ref<CascaderValue[]>([...(props.value ?? props.defaultValue ?? [])])
const valueRef = toRef(props, 'value')
const visibleRef = ref<boolean>(props.visible ?? props.defaultVisible ?? false)
const visibleProp = toRef(props, 'visible')
const generateValueExtend = useCascaderValueExtend(props.options, {
  valueName: 'value',
  childrenName: 'children',
})
watch(
  () => props.options,
  () => {
    if (
      props.value !== undefined &&
      props.options?.length &&
      displayItems.value.length !== props.value.length
    ) {
      // do something with props.value and props.options
      const extend = generateValueExtend(props.value, props.options)
      generateItems.value = extend.items || []
      displayItems.value = extend?.items || []
    }
  },
  {
    deep: true,
  },
)

watch(valueRef, (v) => {
  if (v !== undefined) innerValue.value = v
})

watch(visibleProp, (v) => {
  if (v !== undefined) visibleRef.value = v
})

// expose view props (CascaderView v-model will bind the value)
const viewProps = computed(() => ({
  options: props.options,
  placeholder: props.placeholder,
  onChange: (v: CascaderValue[], extend: CascaderGenerateItems) => {
    console.log('Cascader selected value:', v, extend)
    generateItems.value = extend.items
    innerValue.value = v
    // emit('update:value', v)
    // props.onChange?.(v, extend)
    emit('change', v, extend)
    emit('select', v, extend)
  },
  onDisplay: (v: CascaderValue[], extend: CascaderGenerateItems) => {
    generateItems.value = extend.items
  },
}))

function handleCancel() {
  // close popup and notify
  visibleRef.value = false
  displayItems.value = generateItems.value
  emit('update:visible', false)
  props.onVisibleChange?.(false)
  emit('visibleChange', false)
  emit('close')
}

function handleConfirm() {
  emit('update:value', innerValue.value)
  // props.onChange?.(innerValue.value)
  emit('confirm', innerValue.value)
  handleCancel()
}

function handleClose() {
  handleCancel()
}

// keep locale and title accessible
const title = props.title

// update innerValue when prop initial value present
if (props.value !== undefined) innerValue.value = props.value

const actions = {
  open: () => {
    visibleRef.value = true
  },
  close: () => {
    visibleRef.value = false
  },
  toggle: () => {
    visibleRef.value = !visibleRef.value
  },
}
</script>

<style lang="less" scoped>
@import './cascader.less';
</style>
