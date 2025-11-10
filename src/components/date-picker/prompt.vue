<template>
  <DatePicker
    v-model:value="currentValue"
    v-model:visible="visible"
    @confirm="handleConfirm"
    @cancel="handleCancel"
    @close="handleClose"
    @after-close="handleAfterClose"
    v-bind="pickerProps"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DatePicker from './date-picker.vue'
import type { DatePickerProps } from './date-picker.vue'
import type { PickerDate } from './util'

interface PromptComponentProps extends Omit<DatePickerProps, 'visible' | 'value'> {
  defaultValue?: PickerDate | null
  onResolve?: (value: PickerDate) => void
  onReject?: (error: Error) => void
}

const props = withDefaults(defineProps<PromptComponentProps>(), {
  defaultValue: null,
})

const emit = defineEmits<{
  resolve: [value: PickerDate]
  reject: [error: Error]
}>()

// 状态
const visible = ref(true)
const currentValue = ref<PickerDate | null>(props.defaultValue)

// 计算属性，过滤掉 prompt 特有的属性
const pickerProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { defaultValue, onResolve, onReject, ...rest } = props
  return rest
})

// 事件处理
const handleConfirm = (value: PickerDate) => {
  visible.value = false
  emit('resolve', value)
  props.onResolve?.(value)
  // 延迟处理，等待动画完成
  setTimeout(() => {}, 300)
}

const handleCancel = () => {
  visible.value = false
  const error = new Error('User cancelled')
  emit('reject', error)
  props.onReject?.(error)
  // 延迟处理，等待动画完成
  setTimeout(() => {}, 300)
}

const handleClose = () => {
  visible.value = false
  const error = new Error('User cancelled')
  emit('reject', error)
  props.onReject?.(error)
  // 延迟处理，等待动画完成
  setTimeout(() => {}, 300)
}

const handleAfterClose = () => {
  // 动画完成后可以进行清理
}

// 自动显示
onMounted(() => {
  visible.value = true
})
</script>
