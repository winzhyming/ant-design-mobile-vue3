<template>
  <Teleport :to="containerElement" :disabled="!containerElement">
    <div v-if="shouldRender" :class="wrapperClass" :style="wrapperStyle">
      <!-- 遮罩 -->
      <Mask
        v-if="mask"
        :visible="maskVisible"
        :force-render="forceRender"
        :destroy-on-close="destroyOnClose"
        @mask-click="handleMaskClick"
        :style="maskStyle"
        :class="maskClass"
        :disable-body-scroll="false"
        :stop-propagation="stopPropagation"
      />

      <!-- 弹窗包装器 -->
      <div :class="`${classPrefix}-wrap`" :role="role" :aria-label="ariaLabel">
        <div ref="popupRef" :style="animatedStyle" @click.stop>
          <!-- 关闭按钮 -->
          <a v-if="showCloseButton" :class="closeButtonClass" @click="handleCloseClick">
            <component v-if="closeIcon" :is="closeIcon" />
          </a>

          <!-- 弹窗内容 -->
          <div :class="bodyClass" :style="bodyStyle">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
export interface CenterPopupProps {
  visible?: boolean
  onClose?: () => void
  afterClose?: () => void
  afterShow?: () => void
  bodyClassName?: string
  bodyStyle?: CSSProperties
  closeOnMaskClick?: boolean
  closeIcon?: Component
  destroyOnClose?: boolean
  disableBodyScroll?: boolean
  forceRender?: boolean
  getContainer?: string | HTMLElement | (() => HTMLElement) | null
  mask?: boolean
  maskClassName?: string
  maskStyle?: CSSProperties
  onMaskClick?: (event: MouseEvent) => void
  showCloseButton?: boolean
  stopPropagation?: string[]
  role?: string
  ariaLabel?: string
  className?: string
  style?: CSSProperties
}
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type CSSProperties, type Component } from 'vue'
import { useConfig } from '../config-provider/useConfig'
import Mask from '../mask/index.vue'
import { defaultPopupBaseProps } from '../popup/popup-base-props.ts'
import { useLockScroll } from '../../utils/use-lock-scroll.ts'

const classPrefix = 'adm-center-popup'

const props = withDefaults(defineProps<CenterPopupProps>(), {
  ...defaultPopupBaseProps,
  visible: false,
  closeOnMaskClick: false,
  destroyOnClose: false,
  disableBodyScroll: true,
  forceRender: false,
  getContainer: null,
  mask: true,
  showCloseButton: false,
  stopPropagation: () => ['click'],
})

const emit = defineEmits<{
  close: []
  maskClick: [event: MouseEvent]
}>()

// 获取配置
const { popup: componentConfig = {} } = useConfig()

// 容器元素
const containerElement = computed(() => {
  if (!props.getContainer) return document.body
  if (typeof props.getContainer === 'string') {
    return document.querySelector(props.getContainer) || document.body
  }
  if (typeof props.getContainer === 'function') {
    return props.getContainer()
  }
  return props.getContainer
})

const closeIcon = computed(() => {
  return props.closeIcon || componentConfig.closeIcon
})

// 动画状态 - 确保初始状态正确
const scale = ref(0.8)
const opacity = ref(0)
const active = ref(false)
const maskVisible = ref(false) // 改为独立的 ref 状态

// DOM 引用
const popupRef = ref<HTMLDivElement | null>(null)

// 是否应该渲染
const shouldRender = computed(() => {
  return active.value || props.forceRender
})

// 样式类名
const wrapperClass = computed(() => {
  const classes = [classPrefix]
  if (props.className) classes.push(props.className)
  return classes.join(' ')
})

const wrapperStyle = computed((): CSSProperties => {
  return {
    display: active.value ? undefined : 'none',
    pointerEvents: active.value ? undefined : 'none',
    ...props.style,
  }
})

const maskClass = computed(() => {
  const classes = [`${classPrefix}-mask`]
  if (props.maskClassName) classes.push(props.maskClassName)
  return classes.join(' ')
})

const closeButtonClass = computed(() => {
  return `${classPrefix}-close adm-plain-anchor`
})

const bodyClass = computed(() => {
  const classes = [`${classPrefix}-body`]
  if (props.bodyClassName) classes.push(props.bodyClassName)
  return classes.join(' ')
})

// 动画样式 - 确保动画生效
const animatedStyle = computed((): CSSProperties => {
  return {
    transform: `scale(${scale.value})`,
    opacity: opacity.value,
    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
    transformOrigin: 'center center',
    willChange: 'transform, opacity', // 优化动画性能
  }
})

// 动画控制 - 确保状态变化
const showAnimation = () => {
  scale.value = 1
  opacity.value = 1
}

const hideAnimation = () => {
  scale.value = 0.8
  opacity.value = 0
}

if (props.disableBodyScroll) {
  useLockScroll(
    ref(document.body),
    computed(() => props.visible),
  )
}

// 监听 visible 变化 - 修复 Mask 开始动画
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // 显示时先显示容器，但 mask 延迟显示以触发动画
      active.value = true
      maskVisible.value = false // 先设为 false
      scale.value = 0.8
      opacity.value = 0

      // DOM 更新后再显示 mask 和执行动画
      nextTick(() => {
        maskVisible.value = true // 延迟设为 true 触发 mask 开始动画
        setTimeout(() => {
          showAnimation()
        }, 10)
      })
    } else {
      // 关闭时先隐藏遮罩，执行内容关闭动画
      maskVisible.value = false
      hideAnimation()

      // 等待动画完成后再卸载组件
      setTimeout(() => {
        active.value = false
        props.afterClose?.()
      }, 300)
    }
  },
  { immediate: true },
)

// 遮罩点击处理
const handleMaskClick = (event: MouseEvent) => {
  emit('maskClick', event)
  props.onMaskClick?.(event)
  if (props.closeOnMaskClick) {
    emit('close')
    props.onClose?.()
  }
}

// 关闭按钮点击处理
const handleCloseClick = () => {
  emit('close')
  props.onClose?.()
}

// 添加 inheritAttrs: false
defineOptions({
  inheritAttrs: false,
})
</script>

<style lang="less">
@import './center-popup.less';
</style>
