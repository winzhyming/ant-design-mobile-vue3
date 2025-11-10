<template>
  <div :class="[classPrefix, `${classPrefix}-${status}`, className]" :style="mergedStyle">
    <div :class="`${classPrefix}-image`" v-if="props.image">
      <img :src="props.image" />
    </div>
    <div :class="`${classPrefix}-icon`" v-else>
      <component v-if="icon" :is="icon" />
      <component v-else-if="fallbackIcon" :is="fallbackIcon" />
    </div>
    <div :class="`${classPrefix}-title`">
      <component v-if="isVNode(title)" :is="title" />
      <template v-else>{{ title }}</template>
    </div>
    <div v-if="description" :class="`${classPrefix}-description`">
      <component v-if="isVNode(description)" :is="description" />
      <template v-else>{{ description }}</template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, isVNode, type VNode, type Component } from 'vue'
import { useResultIcon, type ResultStatus } from './useResultIcon'

const classPrefix = 'adm-result'

export interface ResultProps {
  status?: ResultStatus
  title: string | VNode
  description?: string | VNode
  icon?: VNode | Component | undefined | null
  style?: Record<string, string | number>
  image?: string | undefined
  className?: string
}

const props = withDefaults(defineProps<ResultProps>(), {
  status: 'info',
  style: () => ({}),
  className: '',
  image: undefined,
})

const fallbackIcon = useResultIcon(props.status)

const mergedStyle = computed(() => {
  return props.style || {}
})
</script>

<style scoped>
@import './index.less';
</style>
