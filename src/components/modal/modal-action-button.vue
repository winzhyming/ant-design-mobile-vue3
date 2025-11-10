<template>
  <Button
    :key="props.action.key"
    @click="handleClick"
    :class="[
      'adm-modal-button',
      (props.action.primary && 'adm-modal-button-primary') as string,
      props.action.className as string,
    ]"
    :fill="props.action.primary ? 'solid' : 'none'"
    size="middle"
    block
    :color="props.action.danger ? 'danger' : 'primary'"
    :loading="loading"
    :disabled="props.action.disabled || loading"
    :style="props.action.style"
  >
    <component v-if="isVNode(props.action.text)" :is="props.action.text" />
    <template v-else>{{ props.action.text }}</template>
  </Button>
</template>

<script setup lang="ts">
import { isVNode, ref } from 'vue'
import type { Action } from './types.ts'
import Button from '../button/index.vue'

export interface ModalActionButtonProps {
  action: Action
}

const props = defineProps<ModalActionButtonProps>()

const emit = defineEmits<{
  action: [action: Action]
}>()

const loading = ref(false)

// const buttonClass = computed(() => {
//   const classes = ['adm-modal-button']
//   if (props.action.primary) {
//     classes.push('adm-modal-button-primary')
//   }
//   if (props.action.danger) {
//     classes.push('adm-modal-button-danger')
//   }
//   return classes
// })

const handleClick = async () => {
  if (loading.value) return

  try {
    loading.value = true

    // 执行 action 的 onClick
    if (props.action.onClick) {
      await props.action.onClick()
    }

    // 发送 action 事件
    emit('action', props.action)
  } catch (error) {
    console.error('Modal action error:', error)
  } finally {
    loading.value = false
  }
}
</script>
