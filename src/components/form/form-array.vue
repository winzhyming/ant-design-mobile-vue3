<template>
  <div :class="classes.join(' ')">
    <List v-for="(field, index) in fields" :key="field.key" mode="card">
      <!-- <template #header v-if="renderHeader"> -->
      <template #header v-if="$slots.header">
        <!-- <component :is="renderHeader" :field="field" :operation="operation" /> -->
        <slot name="header" :field="field" :operation="operation"></slot>
      </template>
      <slot :fields="[field]" :operation="operation" :index="index" />
    </List>
    <List v-if="renderAdd" mode="card">
      <ListItem class="adm-form-list-operation" :arrow="false" @click="handleAdd">
        <component :is="renderAdd" />
      </ListItem>
    </List>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed, inject, onMounted, ref } from 'vue'
import List from '../list/list.vue'
import ListItem from '../list/item.vue'
import { FormStore } from './form-store'
import type { FormArrayField, FormArrayOperation, NamePath, FieldValue } from './types'
import { generateKey } from './utils'

defineOptions({
  name: 'FormArray',
})

interface FormArrayProps {
  className?: string | string[]
  name: NamePath
  initialValue?: FieldValue[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderHeader?: Component | ((field: FormArrayField, operation: FormArrayOperation) => any)
  onAdd?: (operation: FormArrayOperation) => void
  renderAdd?: Component | (() => FieldValue)
}

const props = withDefaults(defineProps<FormArrayProps>(), {
  initialValue: () => [],
  renderHeader: undefined,
  onAdd: undefined,
  renderAdd: undefined,
})

const classPrefix = 'adm-form-array'
const classes = computed(() => {
  if (typeof props.className === 'string') {
    return [classPrefix, props.className]
  } else if (Array.isArray(props.className)) {
    return [classPrefix, ...props.className]
  } else {
    return [classPrefix]
  }
})

const formStore = inject<FormStore>('formStore')

// Internal array state
const internalArray = ref<FormArrayField[]>([])

// Initialize from initial value or form value
onMounted(() => {
  if (formStore) {
    const currentValue = formStore.getFieldValue(props.name) || props.initialValue || []
    internalArray.value = [currentValue].map((item: FieldValue, index: number) => ({
      index,
      key: generateKey(),
    }))

    // Set the array value in form
    formStore.setFieldValue(props.name, currentValue)
  }
})

const fields = computed(() => internalArray.value)

const operation: FormArrayOperation = {
  add: (defaultValue?: FieldValue, insertIndex?: number) => {
    const index = insertIndex !== undefined ? insertIndex : internalArray.value.length
    const newField: FormArrayField = {
      index,
      key: generateKey(),
    }

    // Update internal array
    if (insertIndex !== undefined) {
      internalArray.value.splice(insertIndex, 0, newField)
      // Update indices for fields after insertion point
      internalArray.value.forEach((field, idx) => {
        if (idx >= insertIndex) {
          field.index = idx
        }
      })
    } else {
      internalArray.value.push(newField)
    }

    // Update form value
    if (formStore) {
      const currentValues = formStore.getFieldValue(props.name)
        ? [formStore.getFieldValue(props.name)]
        : []
      if (insertIndex !== undefined) {
        currentValues.splice(insertIndex, 0, defaultValue)
      } else {
        currentValues.push(defaultValue)
      }
      formStore.setFieldValue(props.name, currentValues)
    }
  },

  remove: (index: number | number[]) => {
    const indices = Array.isArray(index) ? index.sort((a, b) => b - a) : [index]

    // Remove from internal array (reverse order to maintain indices)
    indices.forEach((idx) => {
      internalArray.value.splice(idx, 1)
    })

    // Update indices
    internalArray.value.forEach((field, idx) => {
      field.index = idx
    })

    // Update form value
    if (formStore) {
      const currentValues = formStore.getFieldValue(props.name)
        ? [formStore.getFieldValue(props.name)]
        : []
      indices.forEach((idx) => {
        currentValues.splice(idx, 1)
      })
      formStore.setFieldValue(props.name, currentValues)
    }
  },

  move: (from: number, to: number) => {
    if (from === to) return

    const field = internalArray.value[from]
    internalArray.value.splice(from, 1)
    internalArray.value.splice(to, 0, field)

    // Update indices
    internalArray.value.forEach((field, idx) => {
      field.index = idx
    })

    // Update form value
    if (formStore) {
      const currentValues = formStore.getFieldValue(props.name)
        ? [formStore.getFieldValue(props.name)]
        : []
      const value = currentValues[from]
      currentValues.splice(from, 1)
      currentValues.splice(to, 0, value)
      formStore.setFieldValue(props.name, currentValues)
    }
  },
}

const handleAdd = () => {
  if (props.onAdd) {
    props.onAdd(operation)
  } else {
    operation.add()
  }
}
</script>
