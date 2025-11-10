<template>
  <div class="adm-card" @click="handleClick">
    <!-- Header -->
    <div
      v-if="showHeader"
      :class="headerClasses"
      :style="props.headerStyle"
      @click="handleHeaderClick"
    >
      <div v-if="props.icon || $slots.icon" class="adm-card-header-icon">
        <slot name="icon">{{ props.icon }}</slot>
      </div>
      <div class="adm-card-header-title">
        <slot name="title">{{ props.title }}</slot>
      </div>
      <div v-if="props.extra || $slots.extra" class="adm-card-header-extra">
        <slot name="extra" v-if="typeof props.extra === 'string' || $slots.extra">{{
          props.extra
        }}</slot>
        <component v-else :is="props.extra" />
      </div>
    </div>

    <!-- Body -->
    <div
      v-if="$slots.default"
      :class="bodyClasses"
      :style="props.bodyStyle"
      @click="handleBodyClick"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots, type Component } from 'vue'

interface CardProps {
  title?: string
  icon?: string
  extra?: string | Component
  headerStyle?: Record<string, string | number>
  headerClassName?: string
  bodyStyle?: Record<string, string | number>
  bodyClassName?: string
}

const props = withDefaults(defineProps<CardProps>(), {})

const emit = defineEmits<{
  click: [event: MouseEvent]
  bodyClick: [event: MouseEvent]
  headerClick: [event: MouseEvent]
}>()

const slots = useSlots()

// 计算是否显示 header
const showHeader = computed(() => {
  return props.title || props.extra || slots.icon || slots.extra
})

// 计算 header 的 class
const headerClasses = computed(() => {
  const classes = ['adm-card-header']
  if (props.headerClassName) {
    classes.push(props.headerClassName)
  }
  return classes
})

// 计算 body 的 class
const bodyClasses = computed(() => {
  const classes = ['adm-card-body']
  if (props.bodyClassName) {
    classes.push(props.bodyClassName)
  }
  return classes
})

// 事件处理
const handleClick = (event: MouseEvent) => {
  emit('click', event)
}

const handleBodyClick = (event: MouseEvent) => {
  emit('bodyClick', event)
}

const handleHeaderClick = (event: MouseEvent) => {
  emit('headerClick', event)
}
</script>

<style lang="less" scoped>
@import './card.less';
</style>
