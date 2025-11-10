<template>
  <div :class="[classPrefix, `${classPrefix}-${mode}`]" ref="nativeElementRef" :style="cssVars">
    <div v-if="header || $slots.header" :class="`${classPrefix}-header`">
      <slot name="header">
        <component :is="renderHeader" v-if="header" />
      </slot>
    </div>
    <div :class="`${classPrefix}-body`">
      <div :class="`${classPrefix}-body-inner`">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, type CSSProperties, type VNode } from 'vue'

const classPrefix = 'adm-list'

export interface ListProps {
  header?: string | VNode | (() => VNode)
  mode?: 'default' | 'card'
  // CSS 变量支持
  activeBackgroundColor?: string
  alignItems?: string
  borderBottom?: string
  borderInner?: string
  borderTop?: string
  extraMaxWidth?: string
  fontSize?: string
  headerFontSize?: string
  paddingLeft?: string
  paddingRight?: string
  prefixPaddingRight?: string
  prefixWidth?: string
}

export interface ListRef {
  nativeElement: HTMLDivElement | null
}

const props = withDefaults(defineProps<ListProps>(), {
  mode: 'default',
})

// 模板引用
const nativeElementRef = ref<HTMLDivElement>()

// 渲染 header 内容
const renderHeader = computed(() => {
  if (!props.header) return null

  if (typeof props.header === 'function') {
    return props.header()
  }

  if (typeof props.header === 'string') {
    return h('span', props.header)
  }

  return props.header
})

// CSS 变量计算
const cssVars = computed<CSSProperties>(() => {
  const vars: Record<string, string> = {}

  if (props.activeBackgroundColor) {
    vars['--active-background-color'] = props.activeBackgroundColor
  }
  if (props.alignItems) {
    vars['--align-items'] = props.alignItems
  }
  if (props.borderBottom) {
    vars['--border-bottom'] = props.borderBottom
  }
  if (props.borderInner) {
    vars['--border-inner'] = props.borderInner
  }
  if (props.borderTop) {
    vars['--border-top'] = props.borderTop
  }
  if (props.extraMaxWidth) {
    vars['--extra-max-width'] = props.extraMaxWidth
  }
  if (props.fontSize) {
    vars['--font-size'] = props.fontSize
  }
  if (props.headerFontSize) {
    vars['--header-font-size'] = props.headerFontSize
  }
  if (props.paddingLeft) {
    vars['--padding-left'] = props.paddingLeft
  }
  if (props.paddingRight) {
    vars['--padding-right'] = props.paddingRight
  }
  if (props.prefixPaddingRight) {
    vars['--prefix-padding-right'] = props.prefixPaddingRight
  }
  if (props.prefixWidth) {
    vars['--prefix-width'] = props.prefixWidth
  }

  return vars
})

// 暴露实例方法和属性
defineExpose<ListRef>({
  get nativeElement() {
    return nativeElementRef.value || null
  },
})
</script>

<style lang="less" scoped>
.adm-list {
  --header-font-size: var(--adm-font-size-7);
  --prefix-width: 'auto';
  --prefix-padding-right: 12px;
  --align-items: center;
  --active-background-color: var(--adm-color-border);
  --border-inner: solid 1px var(--adm-color-border);
  --border-top: solid 1px var(--adm-color-border);
  --border-bottom: solid 1px var(--adm-color-border);
  --padding-left: 12px;
  --padding-right: 12px;
  --font-size: var(--adm-font-size-9);
  --extra-max-width: 70%;

  &-header {
    color: var(--adm-color-weak);
    font-size: var(--header-font-size);
    padding: 8px var(--padding-right) 8px var(--padding-left);
  }
  &-body {
    background-color: var(--adm-color-background);
    overflow: hidden;
    font-size: var(--font-size);
  }
  &-body-inner {
    margin-top: -1px;
  }
  &-default {
    .adm-list-body {
      border-top: var(--border-top);
      border-bottom: var(--border-bottom);
    }
  }
  &-card {
    margin: 12px;
    .adm-list-body {
      border-radius: 8px;
    }
    .adm-list-header {
      padding-left: 0;
    }
  }
}
</style>
