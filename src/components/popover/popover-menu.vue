<template>
  <Popover
    ref="innerRef"
    v-bind="{
      ...popoverProps,
      className: classNames(classPrefix, $attrs.class || $attrs.className || ''),
    }"
    @visible-change="onVisibleChange"
  >
    <template #default>
      <slot></slot>
    </template>
    <template #content>
      <div :class="`${classPrefix}-list`">
        <div
          :class="
            classNames(`${classPrefix}-list-inner`, {
              [`${classPrefix}-list-scroll`]: whetherScroll,
            })
          "
          :style="{
            height: innerHeight ? `${innerHeight}px` : undefined,
          }"
        >
          <a
            v-for="(action, index) in actions"
            :key="action.key ?? index"
            :class="
              classNames(`${classPrefix}-item`, 'adm-plain-anchor', {
                [`${classPrefix}-item-disabled`]: action.disabled,
              })
            "
            @click="handleItemClick(action)"
          >
            <div v-if="action.icon" :class="`${classPrefix}-item-icon`">
              <component :is="action.icon" v-if="typeof action.icon === 'object'" />
              <span v-else v-html="action.icon"></span>
            </div>
            <div :class="`${classPrefix}-item-text`">
              <component :is="action.text" v-if="typeof action.text === 'object'" />
              <span v-else>{{ action.text }}</span>
            </div>
          </a>
        </div>
      </div>
    </template>
  </Popover>
</template>

<script setup lang="ts">
import classNames from 'classnames'
import { computed, ref, type Component } from 'vue'
import type { PopoverProps } from './popover.vue'
import Popover from './popover.vue'

export interface Action {
  text: string | object
  icon?: string | Component | null
  disabled?: boolean
  key?: string | number
  onClick?: () => void
}

export interface PopoverMenuProps extends Omit<PopoverProps, 'content'> {
  actions: Action[]
  maxCount?: number
  onAction?: (item: Action) => void
}

const props = withDefaults(defineProps<PopoverMenuProps>(), {
  trigger: 'click',
  placement: 'bottom-start',
  actions: undefined,
  maxCount: undefined,
  onAction: undefined,
  visible: undefined,
  destroyOnHide: true,
})

const emit = defineEmits<{
  action: [item: Action]
  'visible-change': [visible: boolean]
}>()

const classPrefix = 'adm-popover-menu'
const innerRef = ref<InstanceType<typeof Popover> | null>(null)

const whetherScroll = computed(() => props.maxCount && props.actions.length > props.maxCount)

const innerHeight = computed(() => props.maxCount && props.maxCount * 48)

const handleItemClick = (action: Action) => {
  if (action.disabled) return

  emit('action', action)
  props.onAction?.(action)
  action.onClick?.()

  innerRef.value?.hide()
}

const onVisibleChange = (visible: boolean) => {
  emit('visible-change', visible)
}

// 提取 Popover 组件需要的 props
const popoverProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { actions, maxCount, onAction, ...rest } = props
  return rest
})

defineExpose({
  show: () => innerRef.value?.show(),
  hide: () => innerRef.value?.hide(),
  visible: computed(() => innerRef.value?.visible),
})

defineOptions({
  name: 'PopoverMenu',
  inheritAttrs: false,
})
</script>

<style lang="less" scoped>
@import './popover-menu.less';
</style>
