<template>
  <Teleport :to="containerElement" :disabled="!containerElement">
    <div v-if="shouldRender" :class="classPrefix" :style="wrapperStyle" @click="handleClick">
      <!-- 遮罩 -->
      <Mask
        v-if="mask"
        :visible="maskVisible"
        :force-render="forceRender"
        :destroy-on-close="destroyOnClose"
        @mask-click="handleMaskClick"
        :style="maskStyle"
        :class="maskClassName"
        :disable-body-scroll="false"
        :stop-propagation="stopPropagation"
      />

      <!-- 弹窗主体 -->
      <div ref="popupRef" :class="bodyClass" :style="animatedBodyStyle" v-touch:swipe="handleSwipe">
        <!-- 关闭按钮 -->
        <a
          v-if="showCloseButton"
          :class="closeButtonClass"
          @click="handleCloseClick"
          role="button"
          :aria-label="locale.common.close"
        >
          <component :is="closeIcon" />
        </a>

        <!-- 内容插槽 -->
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, type CSSProperties } from 'vue'
import { CloseOutline } from 'ant-mobile-icons-vue3'
import Mask from '../mask/index.vue'
import { useConfig } from '../config-provider/useConfig'
import { defaultPopupBaseProps, type PopupBaseProps } from './popup-base-props.ts'

const classPrefix = 'adm-popup'

export interface PopupProps extends PopupBaseProps {
  // Popup 特有属性
  position?: 'bottom' | 'top' | 'left' | 'right'
  closeOnSwipe?: boolean
  // NativeProps
  style?: CSSProperties
  className?: string
}

const props = withDefaults(defineProps<PopupProps>(), {
  // 现在可以正常使用 defaultPopupBaseProps
  ...defaultPopupBaseProps,
  position: 'bottom',
  closeOnSwipe: false,
})

const emit = defineEmits<{
  close: []
  maskClick: [event: MouseEvent]
  click: [event: MouseEvent]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}>()

// 获取配置
const { locale, popup: componentConfig = {} } = useConfig()

// 容器元素和关闭图标
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
  return props.closeIcon || componentConfig.closeIcon || CloseOutline
})

// 动画状态
const percent = ref(100)
const active = ref(false)
const maskVisible = ref(false) // 改为独立的 ref 状态

// DOM 引用
const popupRef = ref<HTMLDivElement | null>(null)

// 是否应该渲染
const shouldRender = computed(() => {
  return active.value || props.forceRender
})

// 样式类名
const bodyClass = computed(() => {
  const classes = [`${classPrefix}-body`, `${classPrefix}-body-position-${props.position}`]
  if (props.bodyClassName) classes.push(props.bodyClassName)
  return classes
})

const closeButtonClass = computed(() => {
  return `${classPrefix}-close-icon adm-plain-anchor`
})

// 包装器样式
const wrapperStyle = computed((): CSSProperties => {
  return {
    display: active.value ? undefined : 'none',
    touchAction: ['top', 'bottom'].includes(props.position) ? 'none' : 'auto',
    ...props.style,
  }
})

// 动画主体样式
const animatedBodyStyle = computed((): CSSProperties => {
  const baseStyle: CSSProperties = {
    ...props.bodyStyle,
    pointerEvents: percent.value === 0 ? 'unset' : 'none',
  }

  // 根据位置计算变换
  let transform = 'none'
  if (props.position === 'bottom') {
    transform = `translate(0, ${percent.value}%)`
  } else if (props.position === 'top') {
    transform = `translate(0, -${percent.value}%)`
  } else if (props.position === 'left') {
    transform = `translate(-${percent.value}%, 0)`
  } else if (props.position === 'right') {
    transform = `translate(${percent.value}%, 0)`
  }

  baseStyle.transform = transform
  baseStyle.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'

  return baseStyle
})

// 动画控制
const startAnimation = () => {
  if (props.visible) {
    percent.value = 0
  } else {
    percent.value = 100
  }
}

// 监听 visible 变化 - 修复动画触发
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // 显示时先显示容器，设置初始动画状态
      active.value = true
      maskVisible.value = false
      percent.value = 100 // 确保初始状态是隐藏的

      // DOM 更新后再显示 mask 和执行动画
      nextTick(() => {
        maskVisible.value = true
        // 延迟执行动画确保DOM更新完成
        setTimeout(() => {
          startAnimation()
        }, 10)
      })
    } else {
      // 关闭时先隐藏遮罩，执行内容关闭动画
      maskVisible.value = false
      startAnimation()

      // 等待动画完成后再卸载组件
      setTimeout(() => {
        active.value = false
        props.afterClose?.()
      }, 300)
    }
  },
  { immediate: true },
)

// 动画完成回调
watch(
  () => percent.value,
  (newPercent) => {
    if (newPercent === 0 && props.visible) {
      props.afterShow?.()
    }
  },
)

// 事件处理
const handleClick = (event: MouseEvent) => {
  emit('click', event)
  props.onClick?.()
}

const handleMaskClick = (event: MouseEvent) => {
  emit('maskClick', event)
  props.onMaskClick?.()
  if (props.closeOnMaskClick) {
    emit('close')
    props.onClose?.()
  }
}

const handleCloseClick = () => {
  emit('close')
  props.onClose?.()
}

// 滑动手势处理
const handleSwipe = (direction: string) => {
  if (!props.closeOnSwipe) return

  const shouldClose =
    (direction === 'down' && props.position === 'bottom') ||
    (direction === 'up' && props.position === 'top')

  if (shouldClose) {
    emit('close')
    props.onClose?.()
  }
}

// 简化的触摸指令
const vTouch = {
  mounted(el: HTMLElement, binding: { value: (direction: string) => void }) {
    let startY = 0
    let startX = 0

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      startX = e.touches[0].clientX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY
      const endX = e.changedTouches[0].clientX
      const deltaY = endY - startY
      const deltaX = endX - startX

      // 判断滑动方向
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
        if (deltaY > 0) {
          binding.value('down')
        } else {
          binding.value('up')
        }
      }
    }

    el.addEventListener('touchstart', handleTouchStart)
    el.addEventListener('touchend', handleTouchEnd)

    // 保存清理函数
    ;(el as HTMLElement & { _touchCleanup?: () => void })._touchCleanup = () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  },

  beforeUnmount(el: HTMLElement) {
    const elementWithCleanup = el as HTMLElement & { _touchCleanup?: () => void }
    if (elementWithCleanup._touchCleanup) {
      elementWithCleanup._touchCleanup()
    }
  },
}
</script>

<style lang="less">
@import './popup.less';
</style>
