<template>
  <div :class="classPrefix" ref="containerRef">
    <template v-if="columns">
      <Grid :class="`${classPrefix}-grid`" :columns="columns" :style="gridStyle">
        <div :class="`${classPrefix}-gap-measure`" ref="gapMeasureRef" />

        <!-- Render uploaded images -->
        <PreviewItem
          v-for="(fileItem, index) in currentValue"
          :key="fileItem.key ?? index"
          :url="fileItem.thumbnailUrl ?? fileItem.url"
          :deletable="deletable"
          :delete-icon="deleteIcon"
          :image-fit="imageFit"
          @click="handleImageClick(index, fileItem)"
          @delete="handleImageDelete(index, fileItem)"
        />

        <!-- Render tasks -->
        <PreviewItem
          v-for="task in visibleTasks"
          :key="task.id"
          :file="task.file"
          :deletable="task.status !== 'pending'"
          :delete-icon="deleteIcon"
          :status="task.status"
          :image-fit="imageFit"
          @delete="handleTaskDelete(task.id)"
        />

        <div
          :class="`${classPrefix}-upload-button-wrap`"
          :style="showUpload ? undefined : { display: 'none' }"
        >
          <slot v-if="$slots.default" />
          <span
            v-else
            :class="`${classPrefix}-cell ${classPrefix}-upload-button`"
            role="button"
            :aria-label="locale.ImageUploader.upload"
          >
            <span :class="`${classPrefix}-upload-button-icon`">
              <AddOutline />
            </span>
          </span>
          <input
            v-if="!disableUpload"
            ref="inputRef"
            :aria-label="locale.ImageUploader.upload"
            :capture="capture"
            :accept="accept"
            :multiple="multiple"
            type="file"
            :class="`${classPrefix}-input`"
            @change="handleChange"
          />
        </div>
      </Grid>
    </template>

    <template v-else>
      <Space :class="`${classPrefix}-space`" wrap block>
        <PreviewItem
          v-for="(fileItem, index) in currentValue"
          :key="fileItem.key ?? index"
          :url="fileItem.thumbnailUrl ?? fileItem.url"
          :deletable="deletable"
          :delete-icon="deleteIcon"
          :image-fit="imageFit"
          @click="handleImageClick(index, fileItem)"
          @delete="handleImageDelete(index, fileItem)"
        />

        <PreviewItem
          v-for="task in visibleTasks"
          :key="task.id"
          :file="task.file"
          :deletable="task.status !== 'pending'"
          :delete-icon="deleteIcon"
          :status="task.status"
          :image-fit="imageFit"
          @delete="handleTaskDelete(task.id)"
        />

        <div
          :class="`${classPrefix}-upload-button-wrap`"
          :style="showUpload ? undefined : { display: 'none' }"
        >
          <slot v-if="$slots.default" />
          <span
            v-else
            :class="`${classPrefix}-cell ${classPrefix}-upload-button`"
            role="button"
            :aria-label="locale.ImageUploader.upload"
          >
            <span :class="`${classPrefix}-upload-button-icon`">
              <AddOutline />
            </span>
          </span>
          <input
            v-if="!disableUpload"
            ref="inputRef"
            :aria-label="locale.ImageUploader.upload"
            :capture="capture"
            :accept="accept"
            :multiple="multiple"
            type="file"
            :class="`${classPrefix}-input`"
            @change="handleChange"
          />
        </div>
      </Space>
    </template>
  </div>
</template>

<script setup lang="ts">
import { AddOutline, CloseOutline } from 'ant-mobile-icons-vue3'
import { computed, h, nextTick, onUnmounted, ref, watch, type CSSProperties } from 'vue'
import { useConfig } from '../config-provider/useConfig'
import Grid from '../grid/index.vue'
import ImageViewer from '../image-viewer'
import Space from '../space/index.vue'
import PreviewItem from './preview-item.vue'

// Async import to avoid circular dependency issues

export type TaskStatus = 'pending' | 'fail' | 'success'

// Define types locally since they may not be exported
interface ImageProps {
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

interface GridProps {
  columns: number
  gap?: number | string | [number | string, number | string]
}

export interface ImageUploadItem {
  key?: string | number
  url: string
  thumbnailUrl?: string
  extra?: unknown
}

interface Task {
  id: number
  url?: string
  file: File
  status: TaskStatus
}

export type UploadTask = Pick<Task, 'id' | 'status'>

export interface ImageUploaderProps {
  defaultValue?: ImageUploadItem[]
  value?: ImageUploadItem[]
  columns?: GridProps['columns']
  onChange?: (items: ImageUploadItem[]) => void
  onUploadQueueChange?: (tasks: UploadTask[]) => void
  accept?: string
  multiple?: boolean
  maxCount?: number
  onCountExceed?: (exceed: number) => void
  disableUpload?: boolean
  showUpload?: boolean
  deletable?: boolean
  deleteIcon?: unknown
  capture?: boolean | 'user' | 'environment'
  onPreview?: (index: number, item: ImageUploadItem) => void
  beforeUpload?: (file: File, files: File[]) => Promise<File | null> | File | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upload: (file: File) => Promise<ImageUploadItem> | any
  onDelete?: (item: ImageUploadItem) => boolean | Promise<boolean> | void
  preview?: boolean
  showFailed?: boolean
  imageFit?: ImageProps['fit']
  renderItem?: (originNode: unknown, file: ImageUploadItem, fileList: ImageUploadItem[]) => unknown
}

export interface ImageUploaderRef {
  nativeElement: HTMLInputElement | null
}

const props = withDefaults(defineProps<ImageUploaderProps>(), {
  disableUpload: false,
  deletable: true,
  showUpload: true,
  multiple: false,
  maxCount: 0,
  defaultValue: () => [],
  accept: 'image/*',
  preview: true,
  showFailed: true,
  imageFit: 'cover',
  value: undefined,
})

const emit = defineEmits<{
  'update:value': [ImageUploadItem[]]
  change: [ImageUploadItem[]]
  uploadQueueChange: [UploadTask[]]
  countExceed: [number]
  preview: [number, ImageUploadItem]
}>()

const { locale } = useConfig()

// Refs
const containerRef = ref<HTMLDivElement>()
const gapMeasureRef = ref<HTMLDivElement>()
const inputRef = ref<HTMLInputElement>()

// State
const tasks = ref<Task[]>([])
const cellSize = ref(80)
const idCountRef = ref(0)
const imageViewerHandlerRef = ref<{ close: () => void } | null>(null)

// Computed
const classPrefix = 'adm-image-uploader'

// Controlled/uncontrolled value handling
const innerValue = ref<ImageUploadItem[]>([...(props.defaultValue || [])])
const isControlled = computed(() => props.value !== undefined)

const currentValue = computed<ImageUploadItem[]>({
  get() {
    return isControlled.value ? (props.value as ImageUploadItem[]) : innerValue.value
  },
  set(v: ImageUploadItem[]) {
    if (!isControlled.value) innerValue.value = v
    emit('update:value', v)
    // props.onChange?.(v)
    emit('change', v)
  },
})

const deleteIcon = computed(() => {
  return props.deleteIcon || h(CloseOutline, { class: `${classPrefix}-cell-delete-icon` })
})

const gridStyle = computed<CSSProperties>(() => ({
  '--cell-size': `${cellSize.value}px`,
}))

const finalTasks = computed(() => {
  return props.showFailed ? tasks.value : tasks.value.filter((task) => task.status !== 'fail')
})

const showUpload = computed(() => {
  return (
    props.showUpload &&
    (props.maxCount === 0 || currentValue.value.length + finalTasks.value.length < props.maxCount)
  )
})

const visibleTasks = computed(() => {
  return tasks.value.filter((task) => props.showFailed || task.status !== 'fail')
})

// Container size measurement (simplified, using ResizeObserver)
const useContainerSize = () => {
  const size = ref<{ width: number; height: number } | null>(null)
  let resizeObserver: ResizeObserver | null = null

  watch(containerRef, (container) => {
    // 清理之前的 observer
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }

    if (!container) return

    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        size.value = {
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        }
      }
    })

    resizeObserver.observe(container)

    // Initial measurement
    const rect = container.getBoundingClientRect()
    size.value = { width: rect.width, height: rect.height }
  })
  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })
  return size
}

const containerSize = useContainerSize()

// Cell size calculation
watch([containerSize, () => props.columns], () => {
  nextTick(() => {
    const gapMeasure = gapMeasureRef.value
    if (props.columns && containerSize.value && gapMeasure) {
      const width = containerSize.value.width
      const computedStyle = window.getComputedStyle(gapMeasure)
      const gapValue = parseFloat(computedStyle.height) || 10
      console.log(gapValue)
      cellSize.value = (width - gapValue * (props.columns - 1)) / props.columns
    }
  })
})

// Watch tasks for upload queue change
watch(
  () => tasks.value,
  (newTasks) => {
    const taskList = newTasks.map((item) => ({
      id: item.id,
      status: item.status,
    }))
    props.onUploadQueueChange?.(taskList)
    emit('uploadQueueChange', taskList)
  },
  { deep: true },
)

// Clean up tasks when value changes
watch(currentValue, () => {
  tasks.value = tasks.value.filter((task) => {
    if (task.url === undefined) return true
    return !currentValue.value.some((fileItem) => fileItem.url === task.url)
  })
})

// File processing
const processFile = async (file: File, fileList: File[]) => {
  const { beforeUpload } = props
  let transformedFile: File | null | undefined = file

  if (beforeUpload) {
    transformedFile = await beforeUpload(file, fileList)
  }

  return transformedFile
}

const getFinalTasks = (taskList: Task[]) => {
  return props.showFailed ? taskList : taskList.filter((task) => task.status !== 'fail')
}

// Change handler
const handleChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const rawFiles = target.files
  if (!rawFiles) return

  let files = Array.from(rawFiles)
  target.value = '' // Reset input

  if (props.beforeUpload) {
    const postFiles = files.map((file) => processFile(file, files))
    const filesList = await Promise.all(postFiles)
    files = filesList.filter(Boolean) as File[]
  }

  if (files.length === 0) return

  // Check max count
  if (props.maxCount > 0) {
    const exceed = currentValue.value.length + files.length - props.maxCount
    if (exceed > 0) {
      files = files.slice(0, files.length - exceed)
      props.onCountExceed?.(exceed)
      emit('countExceed', exceed)
    }
  }

  const newTasks = files.map((file) => ({
    id: idCountRef.value++,
    status: 'pending' as TaskStatus,
    file,
  }))

  tasks.value = [...getFinalTasks(tasks.value), ...newTasks]

  const newVal: ImageUploadItem[] = []
  await Promise.all(
    newTasks.map(async (currentTask, index) => {
      try {
        const result = await props.upload(currentTask.file)
        newVal[index] = result

        tasks.value = tasks.value.map((task) => {
          if (task.id === currentTask.id) {
            return {
              ...task,
              status: 'success' as TaskStatus,
              url: result.url,
            }
          }
          return task
        })
      } catch (e) {
        tasks.value = tasks.value.map((task) => {
          if (task.id === currentTask.id) {
            return {
              ...task,
              status: 'fail' as TaskStatus,
            }
          }
          return task
        })
        console.error(e)
      }
    }),
  )

  currentValue.value = currentValue.value.concat(newVal.filter(Boolean))
}

// Image preview
const previewImage = (index: number) => {
  imageViewerHandlerRef.value = ImageViewer.Multi.show({
    images: currentValue.value.map((fileItem) => fileItem.url),
    defaultIndex: index,
    onClose: () => {
      imageViewerHandlerRef.value = null
    },
  })
}

// Event handlers
const handleImageClick = (index: number, fileItem: ImageUploadItem) => {
  if (props.preview) {
    previewImage(index)
  }
  props.onPreview?.(index, fileItem)
  emit('preview', index, fileItem)
}

const handleImageDelete = async (index: number, fileItem: ImageUploadItem) => {
  const canDelete = await props.onDelete?.(fileItem)
  if (canDelete === false) return
  currentValue.value = currentValue.value.filter((_, i) => i !== index)
}

const handleTaskDelete = (taskId: number) => {
  tasks.value = tasks.value.filter((t) => t.id !== taskId)
}

// Cleanup
onUnmounted(() => {
  imageViewerHandlerRef.value?.close()
})

// Expose ref
defineExpose<ImageUploaderRef>({
  get nativeElement() {
    return inputRef.value || null
  },
})
</script>
