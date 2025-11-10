<template>
  <div :class="['adm-empty', className]" :style="mergedStyle">
    <div :class="`${classPrefix}-image-container`">
      <!-- 默认图标 -->
      <EmptyIcon
        v-if="!image && !$slots.image"
        :class="`${classPrefix}-image`"
        :style="imageStyle"
      />
      <!-- 字符串图片 -->
      <img
        v-else-if="typeof image === 'string'"
        :class="`${classPrefix}-image`"
        :style="imageStyle"
        :src="image"
        alt="empty"
      />
      <!-- VNode 组件 -->
      <slot name="image"></slot>
    </div>
    <!-- 描述文字 -->
    <div v-if="description" :class="`${classPrefix}-description`">
      <!-- 字符串描述 -->
      <template v-if="typeof description === 'string'">
        {{ description }}
      </template>
      <!-- VNode 描述 -->
      <component v-else :is="description" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type VNode } from 'vue'
import EmptyIcon from './EmptyIcon.vue'

const classPrefix = 'adm-empty'

export interface EmptyProps {
  image?: string | VNode
  imageStyle?: Record<string, string | number>
  description?: string | VNode
  style?: Record<string, string | number>
  className?: string
}

const props = withDefaults(defineProps<EmptyProps>(), {
  imageStyle: () => ({}),
  style: () => ({}),
  className: '',
})

const mergedStyle = computed(() => {
  return props.style || {}
})
</script>

<style lang="less" scoped>
@import './index.less';
</style>
