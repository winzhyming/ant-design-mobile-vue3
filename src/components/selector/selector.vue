<template>
  <div :class="rootClass" :style="props.style">
    <Grid v-if="props.grid || props.columns" :columns="props.columns || 3">
      <template #default>
        <SelectorOptionItem
          v-for="option in options"
          :key="option.value"
          :option="option"
          :selected="selectedSet.has(option.value)"
          :disabled="isOptionDisabled(option)"
          :show-check-mark="props.showCheckMark"
          :render-option="props.renderOption"
          @click="handleOptionClick(option)"
        />
      </template>
    </Grid>
    <Space v-else-if="props.space" wrap>
      <SelectorOptionItem
        v-for="option in options"
        :key="option.value"
        :option="option"
        :selected="selectedSet.has(option.value)"
        :disabled="isOptionDisabled(option)"
        :show-check-mark="props.showCheckMark"
        :render-option="props.renderOption"
        @click="handleOptionClick(option)"
      />
    </Space>
    <template v-else>
      <SelectorOptionItem
        v-for="option in options"
        :key="option.value"
        :option="option"
        :selected="selectedSet.has(option.value)"
        :disabled="isOptionDisabled(option)"
        :show-check-mark="props.showCheckMark"
        :render-option="props.renderOption"
        @click="handleOptionClick(option)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SelectorOption, SelectorProps, FieldNames } from './types'
// 依赖直接用原版
import Grid from '../grid/index.vue'
import Space from '../space/index.vue'
import SelectorOptionItem from './selector-option-item.vue'

const classPrefix = 'adm-selector'

const props = withDefaults(defineProps<SelectorProps>(), {
  options: () => [],
  defaultValue: () => [],
  fieldNames: () =>
    ({
      label: 'label',
      value: 'value',
      description: 'description',
      disabled: 'disabled',
    }) as FieldNames,
  value: undefined,
  multiple: false,
  disabled: false,
  showCheckMark: true,
  block: false,
  grid: false,
  columns: undefined,
  space: true,
})
const emit = defineEmits(['update:value', 'change'])

const isControlled = computed(() => props.value !== undefined)
const innerValue = ref<(string | number)[]>(props.defaultValue || [])

const options = computed(() => {
  const {
    label = 'label',
    value = 'value',
    description = 'description',
    disabled = 'disabled',
  } = props.fieldNames || {}
  return props.options.map((opt) => ({
    label: opt[label],
    value: opt[value],
    description: opt[description],
    disabled: opt[disabled],
  }))
})

const selectedValue = computed({
  get() {
    return isControlled.value ? props.value! : innerValue.value
  },
  set(val: (string | number)[]) {
    if (!isControlled.value) innerValue.value = val
    emit('update:value', val)
    emit('change', val, {
      items: options.value.filter((opt) => val.includes(opt.value)),
    })
    props.onChange?.(val, {
      items: options.value.filter((opt) => val.includes(opt.value)),
    })
  },
})

const selectedSet = computed(() => new Set(selectedValue.value))

const rootClass = computed(() => [
  classPrefix,
  props.block ? `${classPrefix}-block` : '',
  props.class,
])

function isOptionDisabled(option: SelectorOption) {
  return props.disabled || option.disabled
}

function handleOptionClick(option: SelectorOption) {
  if (isOptionDisabled(option)) return
  const value = option.value
  if (props.multiple) {
    const next = selectedValue.value.includes(value)
      ? selectedValue.value.filter((v) => v !== value)
      : [...selectedValue.value, value]
    selectedValue.value = next
  } else {
    selectedValue.value = [value]
  }
}
</script>

<style lang="less">
@import './selector.less';
</style>
