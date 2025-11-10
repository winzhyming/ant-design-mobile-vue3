<template>
  <div :class="classPrefix" :style="style">
    <template v-if="loading">
      <component :is="props.loadingContent" v-if="typeof props.loadingContent === 'object'" />
      <div v-else-if="props.loadingContent" :class="`${classPrefix}-loading-content`">
        {{ props.loadingContent }}
      </div>
      <div v-else :class="`${classPrefix}-loading-content`">
        <SpinLoading />
      </div>
    </template>
    <template v-else-if="columns.length && columns[0].length">
      <Wheel
        v-for="(column, index) in columns"
        :key="index"
        :index="index"
        :column="column"
        :value="innerValue[index]"
        :on-select="handleSelect"
        :render-label="props.renderLabel || defaultRenderLabel"
        :mouse-wheel="mouseWheel"
        :unit="props.units && props.units.length > index ? props.units[index] : undefined"
      />
      <div :class="`${classPrefix}-mask`">
        <div :class="`${classPrefix}-mask-top`" />
        <div :class="`${classPrefix}-mask-middle`" />
        <div :class="`${classPrefix}-mask-bottom`" />
      </div>
    </template>
    <template v-else>
      <slot name="empty"></slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SpinLoading from '../spin-loading/index.vue'
import Wheel from './wheel.vue'
import { useColumnsExtend } from './columns-extend'
import { defaultRenderLabel } from './picker-utils'
import type { PickerValue, PickerValueExtend, PickerViewProps } from './types'

const classPrefix = 'adm-picker-view'

const props = withDefaults(defineProps<PickerViewProps>(), {
  defaultValue: () => [],
  mouseWheel: false,
  loading: false,
  value: undefined,
  units: undefined,
})

// Define emits
const emit = defineEmits<{
  change: [value: PickerValue[], extend: PickerValueExtend]
}>()

// Internal state
const innerValue = ref<PickerValue[]>(props.value === undefined ? props.defaultValue : props.value)
// Sync `value` to `innerValue`
watch(
  () => props.value,
  (newValue) => {
    if (newValue === undefined) return // Uncontrolled mode
    if (newValue === innerValue.value) return
    innerValue.value = newValue
  },
  { immediate: true },
)

// Additional sync with timeout (like React version)
watch(
  () => props.value,
  (newValue) => {
    if (newValue === innerValue.value) return
    const timeout = window.setTimeout(() => {
      if (props.value !== undefined && props.value !== innerValue.value) {
        innerValue.value = props.value
      }
    }, 1000)
    return () => {
      window.clearTimeout(timeout)
    }
  },
)

// Get columns extend
const extend = useColumnsExtend(
  computed(() => props.columns),
  computed(() => innerValue.value),
)

const columns = computed(() => extend.value.columns)

// Watch inner value changes and emit
let debounceTimer: number | null = null
watch(
  () => innerValue.value,
  (newValue) => {
    if (props.value === newValue) return

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Set new timer (debounce with wait: 0, leading: false, trailing: true)
    debounceTimer = window.setTimeout(() => {
      // fix: change 二次触发
      // props.onChange?.(newValue, extend.value)
      emit('change', newValue, extend.value)
    }, 0)
  },
  { flush: 'post' },
)

// Handle column selection
function handleSelect(val: PickerValue, index: number) {
  const next = [...innerValue.value]
  next[index] = val
  innerValue.value = next
}

// Expose methods if needed
defineExpose({
  // Add any methods that need to be exposed
})
</script>
