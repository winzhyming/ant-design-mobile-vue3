<template>
  <div class="demoBlock">
    <div class="demoTitle">{{ title }}</div>
    <div class="demoMain" :style="{ padding, background }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  padding?: string
  background?: string
}

const props = withDefaults(defineProps<Props>(), {
  padding: '12px 12px',
  background: 'var(--adm-color-background)',
})

const { title, padding, background } = props
</script>

<style lang="less">
@import './index.less';
</style>
