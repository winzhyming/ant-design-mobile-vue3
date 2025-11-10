<template>
  <input
    ref="inputRef"
    :type="type"
    :checked="checked"
    :disabled="disabled"
    :id="id"
    @click="handleClick"
    style="display: none"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'

export interface NativeInputProps {
  type: 'checkbox' | 'radio'
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
}

const props = withDefaults(defineProps<NativeInputProps>(), {
  disabled: false,
})

const inputRef = ref<HTMLInputElement | null>(null)

const handleClick = (e: Event) => {
  e.stopPropagation()
  e.stopImmediatePropagation()

  const target = e.target as HTMLInputElement
  const latestChecked = target.checked

  if (latestChecked === props.checked) return
  props.onChange(latestChecked)
}
</script>
