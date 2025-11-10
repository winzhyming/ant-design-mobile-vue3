<template>
  <Mask
    :visible="visible"
    destroyOnClose
    :opacity="0"
    :disableBodyScroll="!maskClickable"
    :getContainer="getContainer"
    :afterClose="afterClose"
    :style="{
      pointerEvents: maskClickable ? 'none' : 'auto',
      ...maskStyle,
    }"
    :class="classNames(`${classPrefix}-mask`, maskClassName)"
    :stopPropagation="stopPropagation"
  >
    <div :class="classNames(`${classPrefix}-wrap`)">
      <div
        :style="{ top: computedTop }"
        :class="
          classNames(
            `${classPrefix}-main`,
            icon ? `${classPrefix}-main-icon` : `${classPrefix}-main-text`,
          )
        "
      >
        <div v-if="iconElement" :class="`${classPrefix}-icon`">
          <component :is="iconElement" />
        </div>
        <AutoCenter v-if="content">
          <component v-if="isVNode(content)" :is="content" />
          <span v-else>{{ content }}</span>
        </AutoCenter>
      </div>
    </div>
  </Mask>
</template>

<script setup lang="ts">
import { computed, isVNode, type VNode, type Component } from 'vue'
import classNames from 'classnames'
import { CheckOutline, CloseOutline } from 'ant-mobile-icons-vue3'
import SpinLoading from '../spin-loading/index.vue'
import AutoCenter from '../auto-center/index.vue'
import Mask from '../mask/index.vue'

export interface ToastProps {
  afterClose?: () => void
  maskStyle?: Record<string, string | number>
  maskClassName?: string
  maskClickable?: boolean
  content?: string | VNode
  icon?: 'success' | 'fail' | 'loading' | VNode | Component
  duration?: number
  position?: 'top' | 'bottom' | 'center'
  visible?: boolean
  getContainer?: string | HTMLElement | null
  stopPropagation?: string[]
}

const props = withDefaults(defineProps<ToastProps>(), {
  maskClickable: true,
  stopPropagation: () => ['click'],
  position: 'center',
  duration: 2000,
})

const classPrefix = 'adm-toast'

const iconElement = computed(() => {
  if (props.icon === null || props.icon === undefined) return null

  switch (props.icon) {
    case 'success':
      return CheckOutline
    case 'fail':
      return CloseOutline
    case 'loading':
      return SpinLoading
    default:
      return props.icon
  }
})

const computedTop = computed(() => {
  switch (props.position) {
    case 'top':
      return '20%'
    case 'bottom':
      return '80%'
    default:
      return '50%'
  }
})
</script>

<style lang="less" scoped>
@import './index.less';
</style>
