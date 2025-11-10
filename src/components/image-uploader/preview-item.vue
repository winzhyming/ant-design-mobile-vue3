<template>
  <div :class="[`${classPrefix}-cell`, status === 'fail' && `${classPrefix}-cell-fail`]">
    <Image :class="`${classPrefix}-cell-image`" :src="src" :fit="imageFit" @click="handleClick" />
    <!-- Loading mask -->
    <div v-if="status === 'pending'" :class="`${classPrefix}-cell-mask`">
      <span :class="`${classPrefix}-cell-loading`">
        <SpinLoading color="white" />
        <span :class="`${classPrefix}-cell-mask-message`">
          {{ locale.ImageUploader.uploading }}
        </span>
      </span>
    </div>
    <!-- Delete button -->
    <span v-if="deletable" :class="`${classPrefix}-cell-delete`" @click.stop="handleDelete">
      <component :is="deleteIcon" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, type Component } from 'vue'
import { useConfig } from '../config-provider/useConfig'
import SpinLoading from '../spin-loading/index.vue'
import Image from '../image/index.vue'

export type TaskStatus = 'pending' | 'fail' | 'success'

interface PreviewItemProps {
  onClick?: () => void
  onDelete?: () => void
  deletable: boolean
  deleteIcon: Component | string
  url?: string
  file?: File
  status?: TaskStatus
  imageFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

const props = withDefaults(defineProps<PreviewItemProps>(), {
  deletable: true,
  imageFit: 'cover',
})

const emit = defineEmits<{
  click: []
  delete: []
}>()

const { locale } = useConfig()

const classPrefix = 'adm-image-uploader'

// Generate src from url or file
const src = computed(() => {
  if (props.url) {
    return props.url
  }
  if (props.file) {
    return URL.createObjectURL(props.file)
  }
  return ''
})

// Cleanup object URL when file is used
onUnmounted(() => {
  if (props.file && src.value) {
    URL.revokeObjectURL(src.value)
  }
})

const handleClick = () => {
  props.onClick?.()
  emit('click')
}

const handleDelete = () => {
  // props.onDelete?.()
  emit('delete')
}
</script>
