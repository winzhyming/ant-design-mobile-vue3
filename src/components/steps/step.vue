<template>
  <div :class="stepClass" :style="nativeStyle">
    <div :class="`${classPrefix}-indicator`">
      <div :class="`${classPrefix}-icon-container`">
        <slot name="icon">
          <component :is="finalIcon" v-if="typeof finalIcon === 'object'" />
          <span v-else-if="typeof finalIcon === 'string'">{{ finalIcon }}</span>
          <span v-else :class="`${classPrefix}-icon-dot`" />
        </slot>
      </div>
    </div>
    <div :class="`${classPrefix}-content`">
      <div :class="`${classPrefix}-title`">
        <slot name="title">{{ props.title }}</slot>
      </div>
      <div v-if="hasDescription" :class="`${classPrefix}-description`">
        <slot name="description">{{ props.description }}</slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots, inject } from 'vue'
import type { StepProps, StepsContextType } from './types'

const classPrefix = 'adm-step'

const props = withDefaults(defineProps<StepProps>(), {
  index: undefined,
  status: undefined,
  icon: undefined,
  stepIndex: 0,
})

const slots = useSlots()

// 从 Steps 组件获取上下文
const stepsContext = inject<StepsContextType>('stepsContext', {
  current: { value: 0 },
  getStepStatus: () => 'wait',
  getStepIcon: (icon) => icon || undefined,
})

const finalIcon = computed(() => {
  return stepsContext.getStepIcon(props.icon)
})

const stepClass = computed(() => {
  if (props.status === undefined && props.index !== undefined) {
    return [
      classPrefix,
      `${classPrefix}-status-${stepsContext.getStepStatus(props.index, props.status)}`,
    ]
  }
  return [classPrefix, `${classPrefix}-status-${props.status}`]
})

const hasDescription = computed(
  () =>
    !!slots.description?.().length ||
    (props.description !== undefined && props.description !== null && props.description !== ''),
)

const nativeStyle = computed(() => {
  const style: Record<string, string> = {}

  // 收集 CSS 变量
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
</script>

<style lang="less" scoped>
@import './steps.less';
</style>
