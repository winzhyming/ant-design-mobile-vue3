<template>
  <component
    :is="clickable ? 'a' : 'div'"
    :class="listItemClass"
    :style="nativeStyle"
    @click="onClick"
  >
    <div :class="`${classPrefix}-content`">
      <div v-if="hasPrefix" :class="`${classPrefix}-content-prefix`">
        <slot name="prefix" v-if="$slots.prefix">{{ props.prefix }}</slot>
        <component
          :is="props.prefix"
          v-else-if="props.prefix && typeof props.prefix === 'object'"
          :class="`${classPrefix}-prefix-icon`"
        />
      </div>

      <div :class="`${classPrefix}-content-main`">
        <div v-if="hasTitle" :class="`${classPrefix}-title`">
          <slot name="title" v-if="$slots.title">{{ props.title }}</slot>
          <span v-else-if="props.title && typeof props.title === 'string'">{{ props.title }}</span>
        </div>

        <slot />

        <div v-if="hasDescription" :class="`${classPrefix}-description`">
          <slot name="description" v-if="$slots.description">{{ props.description }}</slot>
          <div v-else-if="props.description && typeof props.description === 'string'">
            {{ props.description }}
          </div>
        </div>
      </div>

      <div v-if="hasExtra" :class="`${classPrefix}-content-extra`">
        <slot name="extra">{{ props.extra }}</slot>
      </div>

      <div v-if="showArrow" :class="`${classPrefix}-content-arrow`">
        <component
          :is="mergedArrowIcon || RightOutline"
          v-if="mergedArrowIcon || !slots.arrowIcon"
        />
        <slot v-else name="arrowIcon" />
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots, type Component } from 'vue'
import { useConfig } from '../config-provider/useConfig'
import { RightOutline } from 'ant-mobile-icons-vue3'

const classPrefix = 'adm-list-item'

export interface ListItemProps {
  title?: string | number
  description?: string | Component
  prefix?: string | number | Component
  extra?: string | number | Component | null
  clickable?: boolean
  arrowIcon?: boolean | Component
  disabled?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (e: any) => void
  /**
   * @deprecated use `arrowIcon` instead
   */
  arrow?: boolean | Component
  // CSS Variables
  '--prefix-width'?: string
  '--align-items'?: string
  '--active-background-color'?: string
}

const props = withDefaults(defineProps<ListItemProps>(), {
  disabled: false,
  clickable: undefined,
  arrowIcon: undefined,
  arrow: undefined,
})

const slots = useSlots()
const { list: componentConfig = {} } = useConfig()

const clickable = computed(() => props.clickable ?? !!props.onClick)

const onClick = (e: MouseEvent) => {
  if (props.disabled || !clickable.value) return
  if (props.onClick) {
    props.onClick(e)
  }
}

const showArrow = computed(() => props.arrow ?? props.arrowIcon ?? clickable.value)

const mergedArrowIcon = computed(() => {
  // 优先级：arrowIcon > arrow > componentConfig.arrowIcon
  if (props.arrowIcon !== undefined && props.arrowIcon !== true) {
    return props.arrowIcon
  }
  if (props.arrow !== undefined && props.arrow !== true) {
    return props.arrow
  }
  return componentConfig.arrowIcon || null
})

// 直接检查内容是否存在，无需单独的工具函数
const hasPrefix = computed(
  () =>
    !!slots.prefix?.().length ||
    (props.prefix !== undefined && props.prefix !== null && props.prefix !== ''),
)

const hasTitle = computed(
  () =>
    !!slots.title?.().length ||
    (props.title !== undefined && props.title !== null && props.title !== ''),
)

const hasDescription = computed(
  () =>
    !!slots.description?.().length ||
    (props.description !== undefined && props.description !== null && props.description !== ''),
)

const hasExtra = computed(
  () =>
    !!slots.extra?.().length ||
    (props.extra !== undefined && props.extra !== null && props.extra !== ''),
)

const listItemClass = computed(() => {
  const classes = [classPrefix]

  if (clickable.value) {
    classes.push('adm-plain-anchor')
  }

  if (props.disabled) {
    classes.push(`${classPrefix}-disabled`)
  }

  return classes
})

const nativeStyle = computed(() => {
  const style: Record<string, string> = {}

  if (props['--prefix-width']) {
    style['--prefix-width'] = props['--prefix-width']
  }
  if (props['--align-items']) {
    style['--align-items'] = props['--align-items']
  }
  if (props['--active-background-color']) {
    style['--active-background-color'] = props['--active-background-color']
  }

  return style
})
</script>

<style lang="less" scoped>
.adm-list-item {
  display: block;
  padding-left: var(--padding-left);
  position: relative;
  background-color: var(--adm-color-background);
  line-height: 1.5;
  &-title,
  &-description {
    color: var(--adm-color-weak);
    font-size: var(--adm-font-size-main);
  }
  &-content {
    display: flex;
    align-items: var(--align-items);
    justify-content: flex-start;
    border-top: var(--border-inner);
    padding-right: var(--padding-right);
    &-prefix {
      width: var(--prefix-width);
      flex: none;
      padding-right: var(--prefix-padding-right);
    }
    &-main {
      flex: auto;
      padding: 12px 0;
    }
    &-extra {
      flex: none;
      padding-left: 12px;
      font-size: var(--adm-font-size-7);
      color: var(--adm-color-weak);
      max-width: var(--extra-max-width);
    }
    &-arrow {
      flex: none;
      display: flex;
      align-items: center;
      margin-left: 4px;
      color: var(--adm-color-light);
      font-size: 19px;
    }
  }
  &-disabled {
    cursor: not-allowed;
    && > .adm-list-item-content > * {
      opacity: 0.4;
      pointer-events: none;
    }
  }
}

a.adm-list-item {
  &:active:not(.adm-list-item-disabled) {
    background-color: var(--active-background-color);
    &::after {
      content: ' ';
      display: block;
      position: absolute;
      width: 100%;
      bottom: -1px;
      left: 0;
      border-bottom: var(--border-inner);
    }
  }
}
</style>
