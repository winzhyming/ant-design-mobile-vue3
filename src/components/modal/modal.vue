<template>
  <CenterPopup v-bind="centerPopupProps">
    <div v-if="props.header" :class="cls('header')">
      <AutoCenter>
        <slot name="header">
          <component v-if="isVNode(props.header)" :is="props.header" />
          <template v-else>{{ props.header }}</template>
        </slot>
      </AutoCenter>
    </div>
    <template v-else-if="$slots.header">
      <AutoCenter>
        <slot name="header"></slot>
      </AutoCenter>
    </template>

    <div v-if="props.title" :class="cls('title')">
      <component v-if="isVNode(props.title)" :is="props.title" />
      <template v-else>{{ props.title }}</template>
    </div>
    <template v-else-if="$slots.title">
      <slot name="title"></slot>
    </template>

    <div v-if="props.image" :class="cls('image-container')">
      <template v-if="Array.isArray(props.image)">
        <Image
          v-for="(img, index) in props.image"
          :key="index"
          :src="img"
          alt="modal header image"
          width="100%"
        />
      </template>
      <template v-else>
        <Image :src="props.image" alt="modal header image" width="100%" />
      </template>
    </div>

    <div :class="cls('content')" v-if="props.content || $slots.content">
      <AutoCenter v-if="typeof props.content === 'string'">
        {{ props.content }}
      </AutoCenter>
      <component v-else-if="isVNode(props.content)" :is="props.content" />
      <template v-else-if="$slots.content">
        <slot name="content"></slot>
      </template>
      <template v-else>{{ props.content }}</template>
    </div>

    <Space
      :direction="props.actionDirection"
      block
      :class="[cls('footer'), props.actions.length === 0 && cls('footer-empty')]"
      v-if="props.actions && props.actions.length > 0"
    >
      <ModalActionButton
        v-for="(action, index) in props.actions"
        :key="action.key"
        :action="action"
        @action="onAction(action, index)"
      />
    </Space>
    <template v-else-if="$slots.footer">
      <div :class="cls('footer')">
        <slot name="footer"></slot>
      </div>
    </template>
  </CenterPopup>
</template>

<script lang="ts">
export interface ModalProps {
  // 从 CenterPopupProps 继承的属性
  afterClose?: () => void
  afterShow?: () => void
  bodyClassName?: string
  bodyStyle?: Record<string, string | number>
  destroyOnClose?: boolean
  disableBodyScroll?: boolean
  forceRender?: boolean
  getContainer?: string | HTMLElement | (() => HTMLElement) | null
  maskClassName?: string
  maskStyle?: Record<string, string | number>
  stopPropagation?: string[]
  visible?: boolean
  // Modal 特有属性
  image?: string | string[]
  header?: ContentType
  title?: ContentType
  content?: ContentType
  actionDirection?: 'horizontal' | 'vertical'
  actions?: Action[]
  onAction?: (action: Action, index: number) => void | Promise<void>
  onClose?: () => void
  closeOnAction?: boolean
  closeOnMaskClick?: boolean
  showCloseButton?: boolean
  // 添加常用的文本属性
  confirmText?: string
  cancelText?: string
  // NativeProps
  style?: Record<string, string | number>
  className?: string
}
</script>

<script setup lang="ts">
import { computed, isVNode, useAttrs } from 'vue'
import AutoCenter from '../auto-center/index.vue'
import CenterPopup from '../center-popup/center-popup.vue'
import Image from '../image/index.vue'
import Space from '../space/index.vue'
import ModalActionButton from './modal-action-button.vue'
import type { Action, ContentType } from './types.ts'

// 声明 emits
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function cls(name: string = '') {
  return 'adm-modal' + (name && '-') + name
}

const onAction = async (action: Action, index: number) => {
  // action.onClick 已经在 ModalActionButton 中执行了，这里只执行 props.onAction
  await props.onAction?.(action, index)

  // 根据 action 类型触发对应事件
  if (action.key === 'confirm') {
    emit('confirm')
  } else if (action.key === 'cancel') {
    emit('cancel')
  }
  if (props.closeOnAction) {
    props.onClose?.()
  }
}

const props = withDefaults(defineProps<ModalProps>(), {
  actions: () => [] as Action[],
  closeOnAction: false,
  closeOnMaskClick: false,
  getContainer: null,
  visible: false,
  disableBodyScroll: true,
  destroyOnClose: false,
  forceRender: false,
  showCloseButton: false,
  actionDirection: 'vertical',
  confirmText: '确定',
  cancelText: '取消',
  style: () => ({}),
  className: '',
  bodyClassName: '',
  bodyStyle: () => ({}),
  maskClassName: '',
  maskStyle: () => ({}),
  stopPropagation: () => ['click'],
})

// 计算合并后的样式
const mergedStyle = computed(() => {
  return {
    ...props.style,
  }
})

// 禁用属性自动继承
defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

// 提取 CenterPopup 相关的属性，确保 visible 正确传递
const centerPopupProps = computed(() => ({
  afterClose: props.afterClose,
  afterShow: props.afterShow,
  showCloseButton: props.showCloseButton,
  closeOnMaskClick: props.closeOnMaskClick,
  onClose: props.onClose,
  visible: props.visible, // 确保这里正确传递
  getContainer: props.getContainer,
  bodyStyle: props.bodyStyle,
  bodyClassName: [
    cls('body'),
    (props.image && cls('with-image')) || '',
    props.bodyClassName || '',
  ].join(' '),
  maskStyle: props.maskStyle,
  maskClassName: props.maskClassName,
  stopPropagation: props.stopPropagation,
  disableBodyScroll: props.disableBodyScroll,
  destroyOnClose: props.destroyOnClose,
  forceRender: props.forceRender,
  className: [cls(), props.className].join(' '),
  style: mergedStyle.value,
  ...attrs,
}))
</script>

<style lang="less" scoped>
.adm-modal-footer {
  user-select: none;
  padding: 8px 12px 12px;
  &-empty {
    padding: 0;
    height: 8px;
  }
  &.adm-space {
    --gap-vertical: 20px;
  }
  .adm-modal-button {
    font-size: var(--adm-font-size-10);
    line-height: 25px;
    &:not(.adm-modal-button-primary) {
      // padding-top: 0;
      // padding-bottom: 0;
      &::before {
        display: none;
      }
      &:active {
        opacity: 0.7;
      }
    }
  }
}
</style>
