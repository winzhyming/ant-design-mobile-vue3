<!-- eslint-disable vue/no-v-text-v-html-on-component -->
<template>
  <div>
    <component
      :is="'div'"
      v-if="childContent"
      v-html="typeof childContent === 'string' ? childContent : ''"
    />
    <slot v-else :changed-values="watchedValues" :form="formStore" />
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { FormStore } from './form-store'
import type { FormInstance, NamePath, FieldValue } from './types'

defineOptions({
  name: 'FormSubscribe',
})

interface FormSubscribeProps {
  to: NamePath[]
  children?: (changedValues: Record<string, FieldValue>, form: FormInstance) => any
}

const props = defineProps<FormSubscribeProps>()

// Get form store from context - you'll need to implement form context
const formStore = inject<FormStore>('formStore')

const watchedValues = computed(() => {
  if (!formStore) return {}

  const values: Record<string, FieldValue> = {}
  props.to.forEach((namePath) => {
    const key = Array.isArray(namePath) ? namePath.join('.') : String(namePath)
    values[key] = formStore.getFieldValue(namePath)
  })
  return values
})

const childContent = computed(() => {
  if (props.children && formStore) {
    return props.children(watchedValues.value, formStore as FormInstance)
  }
  return null
})
</script>
