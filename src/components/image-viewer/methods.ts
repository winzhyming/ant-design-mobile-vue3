import { createApp, h, type App, type VNode } from 'vue'
import ImageViewer from './image-viewer.vue'
import type { ImageViewerProps } from './image-viewer.vue'
import MultiImageViewer from './multi-image-viewer.vue'
import type { MultiImageViewerProps } from './multi-image-viewer.vue'

export interface ImageViewerShowHandler {
  close: () => void
  replace?: (props: Omit<ImageViewerProps, 'visible'>) => void
}

export interface MultiImageViewerShowHandler {
  close: () => void
  replace?: (props: Omit<MultiImageViewerProps, 'visible'>) => void
}

const handlerSet = new Set<ImageViewerShowHandler>()

// 创建容器元素
const createContainer = (): HTMLDivElement => {
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
  `
  document.body.appendChild(container)
  return container
}

// 渲染组件到容器
const renderComponent = (
  component: VNode,
  container: HTMLDivElement,
): { app: App; unmount: () => void } => {
  const app = createApp(component)

  app.mount(container)

  const unmount = () => {
    app.unmount()
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  return { app, unmount }
}

/**
 * 显示单图预览器
 */
export function showImageViewer(props: Omit<ImageViewerProps, 'visible'>): ImageViewerShowHandler {
  clearImageViewer()

  const container = createContainer()
  let isClosed = false

  const handleClose = () => {
    if (isClosed) return
    isClosed = true

    // 触发关闭动画
    app.unmount()

    // 清理容器
    setTimeout(() => {
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }, 300) // 等待动画完成

    handlerSet.delete(handler)
    props.afterClose?.()
  }

  const component = h(ImageViewer, {
    ...props,
    visible: true,
    onClose: () => {
      props.onClose?.()
      handleClose()
    },
    afterClose: handleClose,
  })

  const { app, unmount } = renderComponent(component, container)

  const handler: ImageViewerShowHandler = {
    close: handleClose,
    replace: (newProps: Omit<ImageViewerProps, 'visible'>) => {
      if (isClosed) return

      const newComponent = h(ImageViewer, {
        ...newProps,
        visible: true,
        onClose: () => {
          newProps.onClose?.()
          handleClose()
        },
        afterClose: handleClose,
      })

      // 重新渲染组件
      unmount()
      renderComponent(newComponent, container)
    },
  }

  handlerSet.add(handler)
  return handler
}

/**
 * 显示多图预览器
 */
export function showMultiImageViewer(
  props: Omit<MultiImageViewerProps, 'visible'>,
): MultiImageViewerShowHandler {
  clearImageViewer()

  const container = createContainer()
  let isClosed = false

  const handleClose = () => {
    if (isClosed) return
    isClosed = true

    // 触发关闭动画
    app.unmount()

    // 清理容器
    setTimeout(() => {
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }, 300) // 等待动画完成

    handlerSet.delete(handler)
    props.afterClose?.()
  }

  const component = h(MultiImageViewer, {
    ...props,
    visible: true,
    onClose: () => {
      props.onClose?.()
      handleClose()
    },
    afterClose: handleClose,
  })

  const { app, unmount } = renderComponent(component, container)

  const handler: MultiImageViewerShowHandler = {
    close: handleClose,
    replace: (newProps: Omit<MultiImageViewerProps, 'visible'>) => {
      if (isClosed) return

      const newComponent = h(MultiImageViewer, {
        ...newProps,
        visible: true,
        onClose: () => {
          newProps.onClose?.()
          handleClose()
        },
        afterClose: handleClose,
      })

      // 重新渲染组件
      unmount()
      renderComponent(newComponent, container)
    },
  }

  handlerSet.add(handler)
  return handler
}

/**
 * 关闭所有图片预览器
 */
export function clearImageViewer(): void {
  handlerSet.forEach((handler) => {
    handler.close()
  })
  handlerSet.clear()
}

// 导出类型
export type { ImageViewerProps, MultiImageViewerProps }
