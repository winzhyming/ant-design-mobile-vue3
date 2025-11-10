<script setup lang="ts">
import { provide } from 'vue'
import { CONFIG_INJECTION_KEY, type Config, type ConfigProviderProps } from './types'
import { useConfig } from './useConfig'

const props = defineProps<ConfigProviderProps>()

// 获取父级配置（如果存在）
const parentConfig = useConfig()

// 合并配置：确保类型兼容
const mergedConfig: Config = {
  ...(parentConfig || ({} as Config)),
  ...props,
} as Config

// 提供配置给子组件
provide(CONFIG_INJECTION_KEY, mergedConfig)
</script>

<template>
  <slot />
</template>
