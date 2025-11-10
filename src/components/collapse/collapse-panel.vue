<template>
  <!-- CollapsePanel 是一个虚拟组件，实际渲染由父组件 Collapse 处理 -->
  <slot />
</template>

<script lang="ts">
import type { Component, VNode } from 'vue'

// 定义箭头图标类型
type ArrowIcon = VNode | Component | (() => VNode) | ((active: boolean) => Component)

export interface CollapsePanelProps {
  // key?: string
  title?: string
  disabled?: boolean
  forceRender?: boolean
  destroyOnClose?: boolean
  arrowIcon?: ArrowIcon
  arrow?: ArrowIcon // deprecated
  loading?: boolean
}
</script>

<script setup lang="ts">
defineProps<CollapsePanelProps>()
</script>
