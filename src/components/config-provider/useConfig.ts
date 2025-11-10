import { inject } from 'vue'
import { CONFIG_INJECTION_KEY, getDefaultConfig, type Config } from './types'

export function useConfig(): Config {
  // 尝试从注入的配置中获取，如果没有则使用全局默认配置
  const injectedConfig = inject(CONFIG_INJECTION_KEY, null)
  if (injectedConfig?.locale?.common) {
    return injectedConfig
  }
  // 返回全局默认配置
  return getDefaultConfig()
}
