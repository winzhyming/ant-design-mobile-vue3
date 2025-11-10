<template>
  <ListItem
    :title="title"
    :class="itemClasses"
    :description="description"
    :prefix="prefix"
    :onClick="handleClick"
    :arrow="false"
    :clickable="!finalReadOnly"
    :disabled="!!(disabled || (context && context.disabled))"
  >
    <slot />
    <template #extra>
      <div :class="`${classPrefix}-extra`" v-if="active && context?.activeIcon">
        <component :className="`${classPrefix}-extra`" :is="context?.activeIcon" />
      </div>
    </template>
  </ListItem>
</template>

<script setup lang="ts">
import classNames from 'classnames'
import { computed, inject } from 'vue'
import { devWarning } from '../../utils/dev-log'
import ListItem from '../list/item.vue'
import { CheckListContextKey } from './context'
import type { CheckListItemProps } from './types'

const classPrefix = 'adm-check-list-item'

const props = withDefaults(defineProps<CheckListItemProps>(), {
  className: undefined,
  value: undefined,
  disabled: false,
  readOnly: false,
  onClick: () => {},
})

// inject context provided by CheckList
const context = inject(CheckListContextKey, null)
if (context === null) {
  devWarning('CheckList.Item', 'CheckList.Item can only be used inside CheckList.')
}

const active = computed(() => {
  if (!context) return false
  return context.value.value.includes(props.value)
})

const finalReadOnly = computed(() => props.readOnly || !!context?.readOnly)

const itemClasses = computed(() =>
  classNames(
    classPrefix,
    finalReadOnly.value && `${classPrefix}-readonly`,
    active.value && `${classPrefix}-active`,
    props.className,
  ),
)

function handleClick(e: MouseEvent) {
  if (finalReadOnly.value) return
  if (active.value) {
    context?.uncheck(props.value)
  } else {
    context?.check(props.value)
  }
  props.onClick?.(e)
}
</script>

<style lang="less"></style>
