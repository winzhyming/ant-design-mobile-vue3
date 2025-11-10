<template>
  <div :class="stepsClass" :style="nativeStyle">
    <template v-for="(child, index) in $slots.default?.()" :key="index">
      <component :is="child" :index="index" :status="getStepStatus(index, child.props?.status)" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, provide, type Component } from 'vue'
import type { StepsProps, StepsContextType } from './types'

const classPrefix = 'adm-steps'

const props = withDefaults(defineProps<StepsProps>(), {
  current: 0,
  direction: 'horizontal',
})

const stepsClass = computed(() => [classPrefix, `${classPrefix}-${props.direction}`])

const nativeStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props['--title-font-size']) {
    style['--title-font-size'] = props['--title-font-size']
  }
  if (props['--description-font-size']) {
    style['--description-font-size'] = props['--description-font-size']
  }
  if (props['--indicator-margin-right']) {
    style['--indicator-margin-right'] = props['--indicator-margin-right']
  }
  if (props['--icon-size']) {
    style['--icon-size'] = props['--icon-size']
  }

  return style
})

// 计算步骤状态
const getStepStatus = (index: number, stepStatus?: string) => {
  if (stepStatus) return stepStatus as 'wait' | 'process' | 'finish' | 'error'

  const currentStep = props.current || 0
  if (index < currentStep) {
    return 'finish'
  } else if (index === currentStep) {
    return 'process'
  }
  return 'wait'
}

// 通过 provide/inject 向子组件提供状态计算逻辑
provide<StepsContextType>('stepsContext', {
  current: computed(() => props.current || 0),
  getStepStatus,
  getStepIcon: (stepIcon?: Component | string) => {
    return stepIcon || undefined
  },
})
</script>

<style lang="less" scoped>
@import './steps.less';
</style>
