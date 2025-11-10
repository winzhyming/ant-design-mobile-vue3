<template>
  <div>
    <slot v-bind="props" />
  </div>
</template>

<script setup lang="ts">
export interface TabProps {
  title?: string
  disabled?: boolean
  forceRender?: boolean
  destroyOnClose?: boolean
  wrapperClass?: string
  wrapperStyle?: Record<string, string | number>
  tabClass?: string
  tabStyle?: Record<string, string | number>
}

const props = defineProps<TabProps>()

// Tab 组件主要用于类型定义和 slot 内容，实际渲染由 Tabs 组件处理
</script>

<script lang="ts">
export default {
  name: 'Tab'
}
</script>
