import ImageViewer from './image-viewer.vue'
import MultiImageViewer from './multi-image-viewer.vue'
import { attachPropertiesToComponent } from '../../utils/attach-properties-to-component'
import { showImageViewer, clearImageViewer, showMultiImageViewer } from './methods'

export type { ImageViewerProps } from './image-viewer.vue'
export type { MultiImageViewerProps } from './multi-image-viewer.vue'

// 命令式 API
export type { ImageViewerShowHandler, MultiImageViewerShowHandler } from './methods'
const Multi = attachPropertiesToComponent(MultiImageViewer, {
  show: showMultiImageViewer,
})
export default attachPropertiesToComponent(ImageViewer, {
  Multi,
  show: showImageViewer,
  clear: clearImageViewer,
})
