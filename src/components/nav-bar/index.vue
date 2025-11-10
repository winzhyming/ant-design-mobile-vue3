<template>
  <div :class="classPrefix" :style="nativeStyle">
    <div :class="`${classPrefix}-left`" role="button">
      <div v-if="back !== null" :class="`${classPrefix}-back`" @click="onLeftBack">
        <span v-if="mergedBackIcon" :class="`${classPrefix}-back-arrow`">
          <component :is="mergedBackIcon" />
        </span>
        <span aria-hidden="true">{{ back }}</span>
      </div>
      <slot name="left">{{ left }}</slot>
    </div>
    <div :class="`${classPrefix}-title`">
      <slot />
    </div>
    <div :class="`${classPrefix}-right`">
      <slot name="right">{{ right }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs, type Component, type CSSProperties } from 'vue'
import { useConfig } from '../config-provider/useConfig'
import { LeftOutline } from 'ant-mobile-icons-vue3'

const classPrefix = 'adm-nav-bar'

interface NavBarProps {
  back?: string
backIcon?: boolean | Component
  /** @deprecated use backIcon instead */
  backArrow?: boolean | Component
  left?: Component
  right?: Component
  onBack?: () => void
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<NavBarProps>(), {
  backIcon: undefined,
  backArrow: undefined,
  left: undefined,
  right: undefined,
  onBack: () => {},
  back: undefined,
})

const config = useConfig().navBar || {}

const defaultBackIcon = LeftOutline

function resolveIcon(val: boolean | Component | null): Component | null | undefined | boolean {
  if (val === true) return config.backIcon || defaultBackIcon
  if (val === false || val == null) return null
  return val
}

const mergedBackIcon = computed(() => {
  // 优先级：backArrow > backIcon > config.backIcon > defaultBackIcon
  if (props.backArrow !== undefined) {
    return resolveIcon(props.backArrow)
  }
  if (props.backIcon !== undefined) {
    return resolveIcon(props.backIcon)
  }
  return config.backIcon || defaultBackIcon
})

const back = computed(() => props.back)
const left = computed(() => props.left)
const right = computed(() => props.right)

function onLeftBack() {
  props.onBack?.()
}

const attrs = useAttrs()
const nativeStyle = computed(() => {
  // 合并用户传入的 style 和 CSS 变量
  return (attrs.style as CSSProperties) || {}
})
</script>

<style lang="less" scoped>
@import './index.less';
</style>
