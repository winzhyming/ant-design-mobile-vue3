<template>
  <div :class="classes" @click="onSpaceClick">
    <template v-for="(child, idx) in normalizedChildren" :key="idx">
      <div :class="`${classPrefix}-item`">
        <!-- <slot :name="`item-${idx}`">{{ child }}</slot> -->
        <!-- 使用 component 渲染 VNode，而不是插值表达式 -->
        <component :is="child" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots, type VNode } from 'vue'
import classNames from 'classnames'

const classPrefix = 'adm-space'

interface SpaceProps {
  direction?: 'horizontal' | 'vertical'
  align?: 'start' | 'end' | 'center' | 'baseline'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly' | 'stretch'
  wrap?: boolean
  block?: boolean
  onClick?: (event: MouseEvent) => void
}

const props = withDefaults(defineProps<SpaceProps>(), {
  direction: 'horizontal',
})

const slots = useSlots()

const classes = computed(() =>
  classNames(classPrefix, {
    [`${classPrefix}-wrap`]: props.wrap,
    [`${classPrefix}-block`]: props.block,
    [`${classPrefix}-${props.direction}`]: true,
    [`${classPrefix}-align-${props.align}`]: !!props.align,
    [`${classPrefix}-justify-${props.justify}`]: !!props.justify,
  }),
)

const normalizedChildren = computed(() => {
  // 默认插槽内容转数组
  const children = slots.default ? slots.default() : []

  // 展开所有子元素，处理 v-for 生成的 Fragment
  const flattenChildren = (vnodes: VNode[]): VNode[] => {
    const result: VNode[] = []

    vnodes.forEach((vnode) => {
      if (vnode === null || vnode === undefined) return

      // 如果是 Fragment，展开其子元素
      if (
        vnode.type === Symbol.for('v-fgt') ||
        (vnode.type && vnode.type.toString() === 'Symbol(Fragment)')
      ) {
        if (vnode.children && Array.isArray(vnode.children)) {
          result.push(...flattenChildren(vnode.children as VNode[]))
        }
      } else {
        result.push(vnode)
      }
    })

    return result
  }

  return flattenChildren(children).filter((child) => child !== null && child !== undefined)
})

function onSpaceClick(event: MouseEvent) {
  props.onClick?.(event)
}
</script>

<style lang="less" scoped>
@import './index.less';
</style>
