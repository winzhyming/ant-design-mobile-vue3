<template>
  <Steps :current="props.current" :direction="props.direction" :style="nativeStyle">
    <Step
      v-for="(step, index) in stepList"
      :key="index"
      :index="index"
      :title="step.title"
      :description="step.description"
      :icon="step.icon"
      :status="step.status"
      :step-index="index"
    >
    </Step>
  </Steps>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Steps from './steps.vue'
import Step from './step.vue'
import type { StepsWrapperProps } from './types'

const props = withDefaults(defineProps<StepsWrapperProps>(), {
  current: 0,
  direction: 'horizontal',
})

const stepList = computed(() => props.steps)

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
</script>
