import type { Component, InjectionKey } from 'vue'
import type { Locale } from '../../locales/base'
import enUS from '../../locales/en-US'

export interface Config {
  locale: Locale
  checkList?: {
    activeIcon?: Component
  }
  collapse?: {
    arrowIcon?: Component | ((active: boolean) => Component)
  }
  dropdown?: {
    arrowIcon?: Component
  }
  form?: {
    helpIcon?: Component
  }
  input?: {
    clearIcon?: Component
  }
  list?: {
    arrowIcon?: Component
  }
  navBar?: {
    backIcon?: Component
  }
  noticeBar?: {
    icon?: Component
    closeIcon?: Component
  }
  popup?: {
    closeIcon?: Component
  }
  result?: {
    successIcon?: Component
    errorIcon?: Component
    infoIcon?: Component
    waitingIcon?: Component
    warningIcon?: Component
  }
  searchBar?: {
    searchIcon?: Component
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConfigProviderProps extends Partial<Config> {}

// 全局默认配置引用
export const defaultConfigRef: {
  current: Config
} = {
  current: {
    locale: {} as Locale, // 将在运行时设置
  },
}

// 设置全局默认配置
export function setDefaultConfig(config: Partial<Config>) {
  defaultConfigRef.current = { ...defaultConfigRef.current, ...config }
}

// 获取全局默认配置
export function getDefaultConfig(): Config {
  // 确保默认配置有 locale
  if (!defaultConfigRef.current.locale.common) {
    defaultConfigRef.current.locale = enUS
  }
  return defaultConfigRef.current
}

// 全局统一的注入键
export const CONFIG_INJECTION_KEY: InjectionKey<Config> = Symbol('ConfigProvider')
