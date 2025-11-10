import { h, render, type VNode, type ComponentPublicInstance } from 'vue'
import ToastComponent from './toast.vue'
import type { ToastProps } from './toast.vue'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ToastShowProps extends Omit<ToastProps, 'visible'> {}

export interface ToastHandler {
  close: () => void
}

export interface ToastConfig {
  duration?: number
  position?: 'top' | 'bottom' | 'center'
  maskClickable?: boolean
}

// 简单的单例管理
class ToastManager {
  private container: HTMLElement | null = null
  private currentTimeout: number | null = null
  private currentInstance: ComponentPublicInstance | null = null

  private defaultConfig: Required<Pick<ToastProps, 'duration' | 'position' | 'maskClickable'>> = {
    duration: 2000,
    position: 'center',
    maskClickable: true,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mergeProps<T extends Record<string, any>>(defaults: T, props: Partial<T>): T {
    return { ...defaults, ...props }
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div')
    container.style.position = 'relative'
    container.style.zIndex = '9999'
    document.body.appendChild(container)
    return container
  }

  private cleanup(): void {
    if (this.container) {
      // 使用 render(null) 来清理组件
      render(null, this.container)
      document.body.removeChild(this.container)
      this.container = null
      this.currentInstance = null
    }
  }

  show(options: ToastShowProps | string): ToastHandler {
    const mergedOptions = typeof options === 'string' ? { content: options } : options
    const props = this.mergeProps(this.defaultConfig, mergedOptions)
    // 清理之前的实例
    this.clear()

    // 创建新容器
    this.container = this.createContainer()

    // 创建虚拟节点
    const vnode = h(ToastComponent, {
      ...props,
      visible: true,
      afterClose: () => {
        this.cleanup()
        // if (mergedOptions && typeof mergedOptions === 'object') {
        //   mergedOptions.afterClose?.()
        // }
      },
    })

    // 渲染组件
    render(vnode, this.container)
    this.currentInstance = vnode.component?.proxy || null

    // 设置自动关闭定时器
    if (props.duration !== 0) {
      this.currentTimeout = window.setTimeout(() => {
        this.clear()
        if (mergedOptions && typeof mergedOptions === 'object') {
          mergedOptions.afterClose?.()
        }
      }, props.duration)
    }

    return {
      close: () => this.clear(),
    }
  }

  clear(): void {
    if (this.currentTimeout) {
      window.clearTimeout(this.currentTimeout)
      this.currentTimeout = null
    }
    this.cleanup()
  }

  config(options: ToastConfig): void {
    if (options.duration !== undefined) {
      this.defaultConfig.duration = options.duration
    }
    if (options.position !== undefined) {
      this.defaultConfig.position = options.position
    }
    if (options.maskClickable !== undefined) {
      this.defaultConfig.maskClickable = options.maskClickable
    }
  }

  // 便捷方法
  success(
    content: string | VNode,
    options?: Omit<ToastShowProps, 'content' | 'icon'>,
  ): ToastHandler {
    return this.show({ ...options, content, icon: 'success' })
  }

  fail(content: string | VNode, options?: Omit<ToastShowProps, 'content' | 'icon'>): ToastHandler {
    return this.show({ ...options, content, icon: 'fail' })
  }

  loading(
    content: string | VNode,
    options?: Omit<ToastShowProps, 'content' | 'icon'>,
  ): ToastHandler {
    return this.show({ ...options, content, icon: 'loading' })
  }
}

// 创建单例实例
const toastManager = new ToastManager()

// 导出方法
export const show = toastManager.show.bind(toastManager)
export const clear = toastManager.clear.bind(toastManager)
export const config = toastManager.config.bind(toastManager)
export const success = toastManager.success.bind(toastManager)
export const fail = toastManager.fail.bind(toastManager)
export const loading = toastManager.loading.bind(toastManager)
export default {
  show,
  clear,
  config,
  success,
  fail,
  loading,
}
