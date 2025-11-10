<template>
  <Wrapper ref="targetRef">
    <slot></slot>
  </Wrapper>
  <Teleport to="body" v-if="shouldRender">
    <div
      :class="
        classNames(classPrefix, `${classPrefix}-${mode}`, {
          [`${classPrefix}-hidden`]: !visible,
        })
      "
      :style="mergedStyle"
      ref="floatingRef"
      @click.stop
    >
      <div :class="`${classPrefix}-arrow`" ref="arrowRef">
        <Arrow :class="`${classPrefix}-arrow-icon`" />
      </div>
      <div :class="`${classPrefix}-inner`">
        <div :class="`${classPrefix}-inner-content`">
          <slot name="content">{{ content }}</slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  arrow,
  autoUpdate,
  computePosition,
  flip,
  hide,
  limitShift,
  offset,
  shift,
} from '@floating-ui/dom'
import classNames from 'classnames'
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type Component } from 'vue'
import { convertPx } from '../../utils/convert-px'
import { mergeProps } from '../../utils/with-default-props'
import Arrow from './arrow.vue'
import { normalizePlacement, type DeprecatedPlacement, type Placement } from './normalize-placement'
import { useShouldRender } from './should-render'
import Wrapper from './wrapper.vue'

export interface PopoverProps {
  defaultVisible?: boolean
  visible?: boolean
  getContainer?: () => HTMLElement
  destroyOnHide?: boolean
  mode?: 'light' | 'dark'
  trigger?: 'click'
  placement?: Placement | DeprecatedPlacement
  stopPropagation?: string[]
  content?: string | Component | null
  style?: Record<string, string | number>
  className?: string
}

export interface PopoverRef {
  show: () => void
  hide: () => void
  visible: boolean
}

const props = withDefaults(defineProps<PopoverProps>(), {
  placement: 'right',
  defaultVisible: false,
  visible: undefined,
  mode: 'light',
  stopPropagation: () => ['click'],
  getContainer: () => document.body,
  destroyOnHide: true,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  visibleChange: [value: boolean]
}>()

const classPrefix = 'adm-popover'

// 合并默认props
const mergedProps = computed(() =>
  mergeProps(
    {
      // placement: 'top' as Placement,
      // defaultVisible: false,
      // stopPropagation: ['click'],
      // getContainer: () => document.body,
      // mode: 'light',
    },
    props,
  ),
)

// eslint-disable-next-line vue/no-dupe-keys
const placement = computed(() => normalizePlacement(mergedProps.value.placement))

// 控制显示状态
const innerVisible = ref(mergedProps.value.defaultVisible)
const isControlled = computed(() => props.visible !== undefined)

const visible = computed(() => (isControlled.value ? props.visible! : innerVisible.value))

const setVisible = (value: boolean) => {
  if (!isControlled.value) {
    innerVisible.value = value
  }
  emit('update:visible', value)
  emit('visibleChange', value)
}

// refs
const targetRef = ref<InstanceType<typeof Wrapper> | null>(null)
const floatingRef = ref<HTMLDivElement | null>(null)
const arrowRef = ref<HTMLDivElement | null>(null)
const cleanupFn = ref<(() => void) | null>(null)

// 样式计算
const mergedStyle = computed(() => {
  const style = props.style || {}
  const cssVariables: Record<string, string | number> = {}

  // 处理CSS变量
  Object.keys(style).forEach((key) => {
    if (key.startsWith('--')) {
      cssVariables[key] = style[key]
    }
  })

  return {
    ...style,
    ...cssVariables,
  }
})

// 更新位置
async function update() {
  const target = targetRef.value?.element ?? null
  const floating = floatingRef.value
  const arrowElement = arrowRef.value

  if (!target || !floating || !arrowElement) return

  const {
    x,
    y,
    placement: realPlacement,
    middlewareData,
  } = await computePosition(target, floating, {
    placement: placement.value,
    middleware: [
      offset(convertPx(12)),
      shift({
        padding: convertPx(4),
        crossAxis: false,
        limiter: limitShift(),
      }),
      flip(),
      hide(),
      arrow({
        element: arrowElement,
        padding: convertPx(12),
      }),
    ],
  })

  Object.assign(floating.style, {
    left: `${x}px`,
    top: `${y}px`,
  })

  const side = realPlacement.split('-')[0] as string
  const arrowSide = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  }[side] as string

  const { x: arrowX, y: arrowY } = middlewareData.arrow ?? {}

  Object.assign(arrowElement.style, {
    left: arrowX != null ? `${arrowX}px` : '',
    top: arrowY != null ? `${arrowY}px` : '',
    right: '',
    bottom: '',
    [arrowSide]: 'calc(var(--arrow-size) * -1)',
  })

  const arrowRotate = {
    top: '0deg',
    bottom: '180deg',
    left: '270deg',
    right: '90deg',
  }[side] as string

  arrowElement.style.setProperty('--arrow-icon-rotate', arrowRotate)
}

// 监听位置变化
watch(
  () => visible.value,
  () => {
    nextTick(() => {
      update()
    })
  },
  { immediate: true },
)

// 点击触发
const handleTargetClick = (event: Event) => {
  event.stopPropagation()
  if (props.trigger === 'click') {
    setVisible(!visible.value)
  }
}

// 点击外部关闭
const handleClickAway = (event: Event) => {
  if (!props.trigger || !visible.value) return

  const target = event.target as HTMLElement
  const targetElement = targetRef.value?.element
  const floatingElement = floatingRef.value

  // 检查点击是否在目标元素或浮层元素内部
  const isClickInsideTarget = targetElement?.contains(target)
  const isClickInsideFloating = floatingElement?.contains(target)

  if (!isClickInsideTarget && !isClickInsideFloating) {
    setVisible(false)
  }
}

// 存储事件清理函数
const eventCleanupFns = ref<(() => void)[]>([])

// 绑定事件
onMounted(() => {
  const targetElement = targetRef.value?.element
  // 点击事件
  if (targetElement && props.trigger === 'click') {
    targetElement.addEventListener('click', handleTargetClick)
    eventCleanupFns.value.push(() => {
      targetElement.removeEventListener('click', handleTargetClick)
    })
  }

  // 点击外部事件
  if (props.trigger) {
    document.addEventListener('click', handleClickAway, true)
    eventCleanupFns.value.push(() => {
      document.removeEventListener('click', handleClickAway, true)
    })
  }
})

// 清理资源
onUnmounted(() => {
  // 清理事件监听器
  eventCleanupFns.value.forEach((cleanup) => cleanup())
  eventCleanupFns.value = []

  // 清理位置更新
  if (cleanupFn.value) {
    cleanupFn.value()
    cleanupFn.value = null
  }
})

// 自动更新位置
watch(
  () => visible.value,
  () => {
    if (cleanupFn.value) {
      cleanupFn.value()
      cleanupFn.value = null
    }

    if (visible.value) {
      nextTick(() => {
        const targetElement = targetRef.value?.element
        const floatingElement = floatingRef.value

        if (targetElement && floatingElement) {
          cleanupFn.value = autoUpdate(targetElement, floatingElement, update, {
            elementResize: typeof ResizeObserver !== 'undefined',
          })
        }
      })
    }
  },
  { immediate: true },
)

// 控制渲染
const { shouldRender } = useShouldRender(visible, false, props.destroyOnHide)

// 暴露方法
defineExpose({
  show: () => setVisible(true),
  hide: () => setVisible(false),
  visible: computed(() => visible.value),
})
</script>

<style lang="less" scoped>
@import './popover.less';
</style>
