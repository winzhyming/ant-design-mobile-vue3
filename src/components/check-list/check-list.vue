<template>
  <List :mode="listMode" :class="classPrefix">
    <slot />
  </List>
</template>

<script setup lang="ts">
import { CheckOutline } from 'ant-mobile-icons-vue3'
import { computed, provide, ref } from 'vue'
import { useConfig } from '../config-provider/useConfig'
import List from '../list/list.vue'
import { CheckListContextKey } from './context'
import type { CheckListProps } from './types'

const classPrefix = 'adm-check-list'

const props = withDefaults(defineProps<CheckListProps>(), {
  multiple: false,
  defaultValue: undefined,
  activeIcon: CheckOutline,
  value: undefined,
})

const emit = defineEmits<{
  'update:value': [(string | number)[]]
  change: [(string | number)[]]
}>()

// useConfig 支持
const { checkList: componentConfig = {} } = useConfig()

const mergedProps = computed(() => ({ ...componentConfig, ...props }))

const listMode = computed(() => mergedProps.value.mode as 'default' | 'card' | undefined)

// Vue implementation of controlled/uncontrolled value
const innerValue = ref<(string | number)[]>(props.defaultValue ?? [])
const isControlled = computed(() => props.value !== undefined)
const value = computed({
  get() {
    return isControlled.value ? (props.value as (string | number)[]) : innerValue.value
  },
  set(v: (string | number)[]) {
    if (!isControlled.value) innerValue.value = v
    emit('update:value', v)
    emit('change', v)
    props.onChange?.(v)
  },
})

function setValue(v: (string | number)[]) {
  value.value = v
}

function check(val: string | number) {
  if (mergedProps.value.multiple) {
    setValue([...value.value, val])
  } else {
    setValue([val])
  }
}

function uncheck(val: string | number) {
  setValue(value.value.filter((item) => item !== val))
}

// Provide context to children
provide(CheckListContextKey, {
  value,
  check,
  uncheck,
  activeIcon: mergedProps.value.activeIcon,
  extra: mergedProps.value.extra,
  disabled: mergedProps.value.disabled,
  readOnly: mergedProps.value.readOnly,
})
</script>
