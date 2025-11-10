<!-- Vue 3 版本的 Mask 组件 (完整的 SFC 格式) -->
<template>
  <!-- 使用条件渲染组件包装器 -->
  <transition
    name="mask-fade"
    @enter="handleEnter"
    @leave="handleLeave"
    @after-enter="handleAfterEnter"
    @after-leave="handleAfterLeave"
  >
    <teleport :to="getContainer" :disabled="!getContainer">
      <div
        v-show="visible"
        ref="maskRef"
        :class="maskClasses"
        :style="maskStyle"
        aria-hidden="true"
        @click="handleMaskClick"
        v-bind="$attrs"
      >
        <!-- 无障碍访问按钮 -->
        <div
          v-if="onMaskClick"
          :class="`${classPrefix}-aria-button`"
          role="button"
          :aria-label="maskAriaLabel"
          @click="onMaskClick"
        />
        <!-- 内容区域 -->
        <div :class="`${classPrefix}-content`">
          <slot />
        </div>
      </div>
    </teleport>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'

// 接口定义
interface MaskProps {
  visible?: boolean
  destroyOnClose?: boolean
  forceRender?: boolean
  disableBodyScroll?: boolean
  color?: 'white' | 'black' | string
  opacity?: 'default' | 'thin' | 'thick' | number
  getContainer?: string | HTMLElement | null
  afterShow?: () => void
  afterClose?: () => void
  stopPropagation?: string[]
  classList?: string[]
  zIndex?: number
  onMaskClick?: (event: MouseEvent) => void
}

interface MaskEmits {
  (e: 'mask-click', event: MouseEvent): void
  (e: 'update:visible', visible: boolean): void
}

// Props 定义
const props = withDefaults(defineProps<MaskProps>(), {
  visible: true,
  destroyOnClose: false,
  forceRender: false,
  color: 'black',
  opacity: 'default',
  disableBodyScroll: true,
  getContainer: null,
  stopPropagation: () => ['click'],
  classList: () => [],
})

// Emits 定义
const emit = defineEmits<MaskEmits>()

// 常量
const classPrefix = 'adm-mask'

const opacityRecord = {
  default: 0.55,
  thin: 0.35,
  thick: 0.75,
} as const

const colorRecord: Record<string, string> = {
  black: '0, 0, 0',
  white: '255, 255, 255',
}

// 响应式数据
const maskRef = ref<HTMLDivElement>()
const isTransitioning = ref(false)

// 计算属性
const background = computed(() => {
  const opacity =
    typeof props.opacity === 'number'
      ? props.opacity
      : (opacityRecord[props.opacity as keyof typeof opacityRecord] ?? props.opacity)
  const rgb = colorRecord[props.color]
  return rgb ? `rgba(${rgb}, ${opacity})` : props.color
})

const maskClasses = computed(() => [classPrefix, ...props.classList])

const maskStyle = computed(() => ({
  background: background.value,
  zIndex: props.zIndex,
  position: 'fixed' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
}))

const maskAriaLabel = computed(() => '遮罩层') // 实际项目中应该从 i18n 获取

// 滚动锁定功能
const lockScroll = () => {
  if (props.disableBodyScroll) {
    document.body.style.overflow = 'hidden'
  }
}

const unlockScroll = () => {
  if (props.disableBodyScroll) {
    document.body.style.overflow = ''
  }
}

// 事件处理
const handleMaskClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    emit('mask-click', e)
    props.onMaskClick?.(e)
  }
}

// 动画生命周期处理
const handleEnter = () => {
  isTransitioning.value = true
  lockScroll()
}

const handleLeave = () => {
  isTransitioning.value = true
}

const handleAfterEnter = () => {
  isTransitioning.value = false
  props.afterShow?.()
}

const handleAfterLeave = () => {
  isTransitioning.value = false
  unlockScroll()
  props.afterClose?.()
}

// 监听器
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      lockScroll()
    } else {
      unlockScroll()
    }
  },
)

// 生命周期
onUnmounted(() => {
  unlockScroll()
})

// 暴露给模板的方法和数据
defineExpose({
  maskRef,
})
</script>

<style lang="less" scoped>
@import './index.less';

.mask-fade-enter-active {
  transition: opacity 0.2s ease-out;
}

.mask-fade-leave-active {
  transition: opacity 0.2s ease-in;
}

.mask-fade-enter-from,
.mask-fade-leave-to {
  opacity: 0;
}

.mask-fade-enter-to,
.mask-fade-leave-from {
  opacity: 1;
}
</style>

<!-- 
使用示例:

<template>
  <div>
    <button @click="showMask = true">显示遮罩</button>
    
    <Mask 
      v-model:visible="showMask"
      :disable-body-scroll="true"
      color="black"
      opacity="default"
      @mask-click="handleMaskClick"
    >
      <div class="modal-content">
        <h2>这是模态框内容</h2>
        <button @click="showMask = false">关闭</button>
      </div>
    </Mask>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Mask from './components/Mask.vue'

const showMask = ref(false)

const handleMaskClick = () => {
  showMask.value = false
}
</script>
-->
