<template>
  <div class="adm-auto-center" v-bind="$attrs">
    <div class="adm-auto-center-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<script lang="ts">
// 组件选项
export default {
  name: 'AutoCenter',
  inheritAttrs: false,
}
</script>

<style lang="less" scoped>
@import './index.less';
</style>
