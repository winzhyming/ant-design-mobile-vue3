<template>
  <div
    v-if="visible"
    :class="[
      classPrefix,
      `${classPrefix}-${mergedProps.color}`,
      `${classPrefix}-${mergedProps.shape}`,
      { [`${classPrefix}-wrap`]: mergedProps.wrap },
      { [`${classPrefix}-bordered`]: mergedProps.bordered === true },
      { [`${classPrefix}-without-border`]: mergedProps.bordered === false },
    ]"
    :style="nativeStyle"
    @click="onClick"
  >
    <span v-if="mergedProps.icon" :class="`${classPrefix}-left`">
      <component :is="mergedProps.icon" />
    </span>
    <span ref="containerRef" :class="`${classPrefix}-content`">
      <span ref="textRef" :class="`${classPrefix}-content-inner`" @transitionend="onTransitionEnd">
        <slot>{{ mergedProps.content }}</slot>
      </span>
    </span>
    <span v-if="mergedProps.closeable || !!$slots.extra" :class="`${classPrefix}-right`">
      <slot name="extra"></slot>
      <div v-if="mergedProps.closeable" :class="`${classPrefix}-close`" @click.stop="handleClose">
        <component :is="mergedProps.closeIcon" />
      </div>
    </span>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  nextTick,
  useAttrs,
  type Component,
  type CSSProperties,
} from 'vue'
import { useConfig } from '../config-provider/useConfig'
import { CloseOutline, SoundOutline } from 'ant-mobile-icons-vue3'

const classPrefix = 'adm-notice-bar'

interface NoticeBarProps {
  color?: 'default' | 'alert' | 'error' | 'success' | 'info'
  delay?: number
  speed?: number
  content?: Component | string
  closeable?: boolean
  closeIcon?: Component
  onClose?: () => void
  onClick?: () => void
  extra?: Component
  icon?: Component | false
  wrap?: boolean
  shape?: 'rectangular' | 'neutral' | 'rounded'
  bordered?: 'block' | boolean
}

const props = withDefaults(defineProps<NoticeBarProps>(), {
  color: 'default',
  delay: 2000,
  speed: 50,
  icon: SoundOutline,
  wrap: false,
  shape: 'rectangular',
  bordered: 'block',
})

const config = useConfig().noticeBar || {}
const mergedProps = computed(() => {
  return {
    ...config,
    ...props,
    closeIcon: props.closeIcon || config.closeIcon || CloseOutline,
  }
})

const visible = ref(true)
const containerRef = ref<HTMLElement>()
const textRef = ref<HTMLElement>()

const attrs = useAttrs()
const nativeStyle = computed(() => (attrs.style as CSSProperties) || {})

// 滚动动画逻辑
const animating = ref(false)
const delayLock = ref(true)

function start() {
  if (delayLock.value || mergedProps.value.wrap) return
  const container = containerRef.value
  const text = textRef.value
  if (!container || !text) return
  if (container.offsetWidth >= text.offsetWidth) {
    animating.value = false
    text.style.removeProperty('transition-duration')
    text.style.removeProperty('transform')
    return
  }
  if (animating.value) return
  const initial = !text.style.transform
  text.style.transitionDuration = '0s'
  if (initial) {
    text.style.transform = 'translateX(0)'
  } else {
    text.style.transform = `translateX(${container.offsetWidth}px)`
  }
  const distance = initial ? text.offsetWidth : container.offsetWidth + text.offsetWidth
  animating.value = true
  text.style.transitionDuration = `${Math.round(distance / mergedProps.value.speed)}s`
  text.style.transform = `translateX(-${text.offsetWidth}px)`
}

function onTransitionEnd() {
  animating.value = false
  start()
}

function handleClose() {
  visible.value = false
  mergedProps.value.onClose?.()
}

onMounted(() => {
  setTimeout(() => {
    delayLock.value = false
    start()
  }, mergedProps.value.delay)
})

watch([() => mergedProps.value.wrap, () => mergedProps.value.speed], () => {
  nextTick(() => start())
})

watch(
  () => mergedProps.value.content,
  () => {
    nextTick(() => start())
  },
)
</script>
<style lang="less" scoped>
@import './index.less';
</style>
