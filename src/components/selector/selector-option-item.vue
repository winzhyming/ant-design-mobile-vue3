<template>
  <div
    :class="itemClass"
    :aria-checked="selected"
    :aria-disabled="disabled"
    role="option"
    @click="onClick"
  >
    <template v-if="renderOption">
      <component :is="renderOption(option, selected)" />
    </template>
    <template v-else>
      <div :class="`${classPrefix}-label`">{{ option.label }}</div>
      <div v-if="option.description" :class="`${classPrefix}-description`">
        {{ option.description }}
      </div>
      <div v-if="showCheckMark && selected" :class="`${classPrefix}-check-mark-wrapper`">
        <CheckMark />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import CheckMark from './check-mark.vue'
import type { SelectorOption } from './types'

const classPrefix = 'adm-selector-item'

const props = defineProps<{
  option: SelectorOption
  selected: boolean
  disabled?: boolean
  showCheckMark?: boolean
  renderOption?: (option: SelectorOption, selected: boolean) => Component
}>()
const emit = defineEmits(['click'])

const itemClass = computed(() => [
  classPrefix,
  props.selected ? `${classPrefix}-active` : '',
  props.disabled ? `${classPrefix}-disabled` : '',
])

function onClick() {
  if (!props.disabled) emit('click')
}
</script>
