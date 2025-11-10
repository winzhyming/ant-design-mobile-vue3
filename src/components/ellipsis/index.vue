<template>
  <div ref="rootRef" :class="classPrefix" @click="handleContentClick">
    <!-- 测量节点 -->
    <div v-if="status === 'PREPARE'" ref="fullMeasureRef" aria-hidden="true" :style="measureStyle">
      {{ content }}<component v-if="expandNode" :is="expandNode" />
    </div>
    <div
      v-if="status === 'PREPARE'"
      key="stable"
      ref="singleRowMeasureRef"
      aria-hidden="true"
      :style="measureStyle"
    >
      &#160;
    </div>
    <div
      v-if="status === 'MEASURE_WALKING'"
      key="walking-mid"
      ref="midMeasureRef"
      aria-hidden="true"
      :style="measureStyle"
    >
      <template v-for="node in renderContent(midIndex)">
        <component v-if="isVNode(node)" :is="node" :key="node.key" />
        <span v-else :key="node">{{ node }}</span>
      </template>
    </div>
    <!-- 实际内容 -->
    <template v-for="(node, idx) in finalContent" :key="idx">
      <component v-if="isVNode(node)" :is="node" />
      <span v-else>{{ node }}</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, watch, onMounted, nextTick, isVNode, onUnmounted } from 'vue'
import type { VNode, Ref } from 'vue'
import { measureStyle, useMeasure } from './useMeasure'
import runes2 from 'runes2'

const classPrefix = 'adm-ellipsis'

export type PropagationEvent = 'click' | 'mousedown' | 'touchstart'

export interface EllipsisProps {
  content: string
  direction?: 'start' | 'end' | 'middle'
  rows?: number
  expandText?: string | VNodeDesc | VNode
  collapseText?: string | VNodeDesc | VNode
  stopPropagationForActionButtons?: PropagationEvent[]
  onContentClick?: (e: MouseEvent) => void
  defaultExpanded?: boolean
  onExpand?: (expanded: boolean, info: { event: MouseEvent }) => void
  style?: Record<string, string>
}

export interface VNodeDesc {
  type: string | object
  key?: string | number
  ref?: string | Ref<unknown> | ((el: Element | null) => void)
  style?: Record<string, string | number>
  children?: (string | VNode)[]
}

const props = withDefaults(defineProps<EllipsisProps>(), {
  direction: 'end',
  rows: 1,
  expandText: '',
  content: '',
  collapseText: '',
  stopPropagationForActionButtons: () => [],
  onContentClick: () => {},
  defaultExpanded: false,
})

const rootRef = ref<HTMLElement>()
const expanded = ref(props.defaultExpanded)

function withStopPropagation(events: PropagationEvent[], handler: (e: MouseEvent) => void) {
  return (e: MouseEvent) => {
    if (events && events.length) {
      for (const evt of events) {
        if (e.type === evt) {
          e.stopPropagation()
        }
      }
    }
    handler(e)
  }
}

const expandNode = computed<VNode | null>(() =>
  props.expandText
    ? h(
        'a',
        {
          onClick: withStopPropagation(props.stopPropagationForActionButtons, handleExpand),
          onMousedown: withStopPropagation(props.stopPropagationForActionButtons, () => {}),
          onTouchstart: withStopPropagation(props.stopPropagationForActionButtons, () => {}),
        },
        props.expandText as string,
      )
    : null,
)
const collapseNode = computed<VNode | null>(() =>
  props.collapseText
    ? h(
        'a',
        {
          onClick: withStopPropagation(props.stopPropagationForActionButtons, handleCollapse),
          onMousedown: withStopPropagation(props.stopPropagationForActionButtons, () => {}),
          onTouchstart: withStopPropagation(props.stopPropagationForActionButtons, () => {}),
        },
        props.collapseText as string,
      )
    : null,
)

function handleExpand(e: MouseEvent) {
  expanded.value = true
  props.onExpand?.(true, { event: e })
}
function handleCollapse(e: MouseEvent) {
  expanded.value = false
  props.onExpand?.(false, { event: e })
}

const showExpand = computed(() => !!props.expandText)
const showCollapse = computed(() => !!props.collapseText)

const fullMeasureRef = ref<HTMLElement>()
const singleRowMeasureRef = ref<HTMLElement>()
const midMeasureRef = ref<HTMLElement>()

const [finalContent, startMeasure, status, midIndex, renderContent] = useMeasure(
  props.content,
  props.rows,
  props.direction,
  expanded,
  showExpand.value ? expandNode.value : null,
  showCollapse.value ? collapseNode.value : null,
  fullMeasureRef,
  singleRowMeasureRef,
  midMeasureRef,
  runes2,
)

watch(
  [
    () => props.content,
    () => props.rows,
    () => props.direction,
    () => expanded.value,
    () => props.expandText,
    () => props.collapseText,
  ],
  () => {
    nextTick(() => startMeasure())
  },
)

function handleContentClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    props.onContentClick?.(e)
  }
}

onMounted(() => {
  startMeasure()
  window.addEventListener('resize', startMeasure)
})
onUnmounted(() => {
  window.removeEventListener('resize', startMeasure)
})
</script>

<style lang="less" scoped>
@import './index.less';
</style>
