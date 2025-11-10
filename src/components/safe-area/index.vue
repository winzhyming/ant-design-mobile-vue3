<template>
  <div
    :class="[classPrefix, `${classPrefix}-position-${position}`, $attrs.class]"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
const classPrefix = 'adm-safe-area'

interface SafeAreaProps {
  position: 'top' | 'bottom'
}

defineProps<SafeAreaProps>()
</script>
<style lang="less" scoped>
@import './index.less';
</style>
