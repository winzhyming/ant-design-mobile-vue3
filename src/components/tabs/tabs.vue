<template>
  <div :class="[classPrefix, props.class]" :style="{ direction: props.direction, ...props.style }">
    <div :class="`${classPrefix}-header`">
      <div
        :class="[`${classPrefix}-header-mask`, `${classPrefix}-header-mask-left`]"
        :style="{ opacity: leftMaskOpacity }"
      />
      <div
        :class="[`${classPrefix}-header-mask`, `${classPrefix}-header-mask-right`]"
        :style="{ opacity: rightMaskOpacity }"
      />
      <div
        ref="tabListContainerRef"
        :class="`${classPrefix}-tab-list`"
        @scroll="updateMask"
        @keydown="handleKeyDown"
        role="tablist"
      >
        <div
          ref="activeLineRef"
          :class="`${classPrefix}-tab-line`"
          :style="{
            width:
              props.activeLineMode === 'fixed'
                ? 'var(--fixed-active-line-width, 30px)'
                : `${lineWidth}px`,
            transform: `translateX(${lineX}px)`,
            transition: animating ? 'transform 0.3s ease, width 0.3s ease' : 'none',
          }"
        />
        <div
          v-for="pane in panes"
          :key="pane.key"
          :class="[
            `${classPrefix}-tab-wrapper`,
            {
              [`${classPrefix}-tab-wrapper-stretch`]: props.stretch,
            },
            pane.wrapperClass,
          ]"
          :style="pane.wrapperStyle"
        >
          <div
            role="tab"
            :aria-selected="pane.key === activeKey"
            :tabindex="pane.key === activeKey ? 0 : -1"
            :ref="(el: any) => setTabRef(pane.key, el)"
            @click="handleTabClick(pane)"
            :class="[
              `${classPrefix}-tab`,
              {
                [`${classPrefix}-tab-active`]: pane.key === activeKey,
                [`${classPrefix}-tab-disabled`]: !!pane.disabled,
              },
              pane.tabClass,
            ]"
            :style="pane.tabStyle"
          >
            <slot :name="`title-${pane.key}`" :title="pane.title">
              <component v-if="pane.titleSlot" :is="pane.titleSlot" />
              <template v-else>{{ pane.title }}</template>
            </slot>
          </div>
        </div>
      </div>
    </div>
    <template v-for="pane in panes" :key="pane.key">
      <div
        v-if="
          shouldRender(pane.key === activeKey, pane.forceRender, pane.destroyOnClose) &&
          hasActiveContent
        "
        :class="`${classPrefix}-content`"
        :style="{ display: pane.key === activeKey ? 'block' : 'none' }"
      >
        <slot :name="`content-${pane.key}`">
          <slot :name="pane.key" v-if="$slots[pane.key]" />
          <component v-else-if="pane.content" :is="pane.content" />
        </slot>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useSlots, watch, type VNode } from 'vue'
import { throttle } from './utils'
import { bound } from '../../utils/bound'

export interface TabProps {
  title?: string
  disabled?: boolean | string
  forceRender?: boolean
  destroyOnClose?: boolean
  wrapperClass?: string
  wrapperStyle?: Record<string, string | number>
  tabClass?: string
  tabStyle?: Record<string, string | number>
}

export interface TabsProps {
  activeKey?: string | null
  defaultActiveKey?: string | null
  activeLineMode?: 'auto' | 'full' | 'fixed'
  stretch?: boolean
  direction?: 'ltr' | 'rtl'
  autoScroll?: boolean
  class?: string
  style?: Record<string, string | number>
}

interface EmitsType {
  (e: 'change', key: string): void
  (e: 'update:activeKey', key: string): void
}

const props = withDefaults(defineProps<TabsProps>(), {
  activeLineMode: 'auto',
  stretch: true,
  direction: 'ltr',
  autoScroll: true,
  forceRender: undefined,
  destroyOnClose: undefined,
})

const emit = defineEmits<EmitsType>()
const slots = useSlots()

const classPrefix = 'adm-tabs'

// Refs
const tabListContainerRef = ref<HTMLDivElement>()
const activeLineRef = ref<HTMLDivElement>()
const tabRefs = ref<Record<string, HTMLDivElement | null>>({})

// State
const internalActiveKey = ref<string | null>(null)
const lineX = ref(0)
const lineWidth = ref(0)
// const scrollLeft = ref(0)
const leftMaskOpacity = ref(0)
const rightMaskOpacity = ref(0)
const animating = ref(false)
const initialized = ref(false)

// Computed
const activeKey = computed({
  get: () => props.activeKey ?? internalActiveKey.value,
  set: (value: string | null) => {
    if (props.activeKey === undefined) {
      internalActiveKey.value = value
    }
    if (value !== null) {
      emit('update:activeKey', value)
      emit('change', value)
    }
  },
})

const isRTL = computed(() => props.direction === 'rtl')

const panes = computed(() => {
  const result: Array<{
    key: string
    title: string
    disabled?: boolean
    forceRender?: boolean
    destroyOnClose?: boolean
    wrapperClass?: string
    wrapperStyle?: Record<string, string | number>
    tabClass?: string
    tabStyle?: Record<string, string | number>
    content?: VNode
    titleSlot?: () => VNode | VNode[] | undefined
  }> = []

  const defaultSlot = slots.default?.()
  if (defaultSlot) {
    traverseVNode(defaultSlot, (vnode: VNode, index: number) => {
      const type = vnode.type
      const isTab =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (typeof type === 'object' && (type as any).name === 'Tab') ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (typeof type === 'object' && (type as any).__name === 'Tab')
      if (isTab) {
        const key = (vnode.key as string) || String(index)
        const tabProps = (vnode.props as TabProps) || {}

        // Extract title slot from Tab VNode
        let titleSlot: (() => VNode | VNode[] | undefined) | undefined
        if (vnode.children && typeof vnode.children === 'object' && 'title' in vnode.children) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          titleSlot = (vnode.children as any).title
        }

        result.push({
          key,
          title: tabProps.title || key,
          disabled: tabProps.disabled === '' || tabProps.disabled === true,
          forceRender: tabProps.forceRender,
          destroyOnClose: tabProps.destroyOnClose,
          wrapperClass: tabProps.wrapperClass,
          wrapperStyle: tabProps.wrapperStyle,
          tabClass: tabProps.tabClass,
          tabStyle: tabProps.tabStyle,
          content: vnode,
          titleSlot: titleSlot,
        })
      }
    })
  }

  return result
})

const keyToIndexRecord = computed(() => {
  const record: Record<string, number> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  panes.value.forEach((pane: any, index: number) => {
    record[pane.key] = index
  })
  return record
})

const firstActiveKey = computed(() => panes.value[0]?.key || null)

// Check if current active pane has content
const hasActiveContent = computed(() => {
  const activePane = panes.value.find((pane) => pane.key === activeKey.value)
  if (!activePane) return false

  // Check if there are named slots for this pane
  if (slots[`content-${activePane.key}`] || slots[activePane.key]) {
    return true
  }

  // Check if the Tab VNode has content
  if (activePane.content) {
    const vnode = activePane.content
    // Check if VNode has children (content)
    if (vnode.children) {
      if (typeof vnode.children === 'object' && 'default' in vnode.children) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const defaultFn = (vnode.children as any).default
        if (typeof defaultFn === 'function') {
          try {
            const result = defaultFn()
            // Check if result has meaningful content
            if (Array.isArray(result)) {
              return result.some((item) =>
                typeof item === 'string' ? item.trim().length > 0 : true,
              )
            }
            return typeof result === 'string' ? result.trim().length > 0 : Boolean(result)
          } catch {
            return false
          }
        }
      }
      // If children is direct content
      if (Array.isArray(vnode.children)) {
        return vnode.children.some((child) =>
          typeof child === 'string' ? child.trim().length > 0 : true,
        )
      }
      return typeof vnode.children === 'string'
        ? vnode.children.trim().length > 0
        : Boolean(vnode.children)
    }
  }

  return false
})

// Utility functions
function traverseVNode(vnodes: VNode[], fn: (vnode: VNode, index: number) => void) {
  let index = 0
  function traverse(nodes: VNode[]) {
    nodes.forEach((vnode) => {
      if (vnode.type === Symbol.for('v-fgt')) {
        // Fragment
        if (Array.isArray(vnode.children)) {
          traverse(vnode.children as VNode[])
        }
      } else {
        fn(vnode, index)
        index++
      }
    })
  }
  traverse(vnodes)
}

function useShouldRender(active: boolean, forceRender?: boolean, destroyOnClose?: boolean) {
  const initialized = ref(active)

  if (active && !initialized.value) {
    initialized.value = true
  }

  if (forceRender) return true
  if (active) return true
  if (!initialized.value) return false
  return !destroyOnClose
}

function shouldRender(active: boolean, forceRender?: boolean, destroyOnClose?: boolean) {
  return useShouldRender(active, forceRender, destroyOnClose)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setTabRef(key: string, el: any) {
  if (el) {
    tabRefs.value[key] = el
  }
}

function animate(immediate = false, fromMutation = false) {
  const container = tabListContainerRef.value
  if (!container) return

  const activeIndex = keyToIndexRecord.value[activeKey.value as string]
  if (activeIndex === undefined) {
    lineX.value = 0
    lineWidth.value = 0
    return
  }

  const activeLine = activeLineRef.value
  if (!activeLine) return

  const activeTabWrapper = container.children.item(activeIndex + 1) as HTMLDivElement
  const activeTab = activeTabWrapper.children.item(0) as HTMLDivElement
  const activeTabLeft = activeTab.offsetLeft
  const activeTabWidth = activeTab.offsetWidth
  const activeTabWrapperLeft = activeTabWrapper.offsetLeft
  const activeTabWrapperWidth = activeTabWrapper.offsetWidth

  const containerWidth = container.offsetWidth
  const containerScrollWidth = container.scrollWidth
  // const containerScrollLeft = container.scrollLeft

  const activeLineWidth = activeLine.offsetWidth

  let x = 0
  let width = 0
  if (props.activeLineMode === 'auto') {
    x = activeTabLeft
    width = activeTabWidth
  } else if (props.activeLineMode === 'full') {
    x = activeTabWrapperLeft
    width = activeTabWrapperWidth
  } else {
    x = activeTabLeft + (activeTabWidth - activeLineWidth) / 2
  }

  if (isRTL.value) {
    const w = ['auto', 'full'].includes(props.activeLineMode) ? width : activeLineWidth
    x = -(containerWidth - x - w)
  }

  if (!immediate) {
    animating.value = true
    setTimeout(() => {
      animating.value = false
    }, 300)
  }

  lineX.value = x
  lineWidth.value = width

  const maxScrollDistance = containerScrollWidth - containerWidth
  if (maxScrollDistance <= 0) return

  let nextScrollLeft = 0

  if (isRTL.value) {
    nextScrollLeft = -bound(
      containerWidth / 2 - activeTabLeft + activeTabWidth / 2 - activeLineWidth,
      0,
      maxScrollDistance,
    )
  } else {
    nextScrollLeft = bound(
      activeTabLeft - (containerWidth - activeTabWidth) / 2,
      0,
      maxScrollDistance,
    )
  }

  if (!fromMutation || props.autoScroll !== false) {
    if (immediate) {
      container.scrollLeft = nextScrollLeft
    } else {
      container.scrollTo({
        left: nextScrollLeft,
        behavior: 'smooth',
      })
    }
  }
}

const updateMask = throttle((immediate = false) => {
  const container = tabListContainerRef.value
  if (!container) return

  const scrollLeft = container.scrollLeft
  let showLeftMask = false
  let showRightMask = false

  if (isRTL.value) {
    showLeftMask = Math.round(-scrollLeft) + container.offsetWidth < container.scrollWidth
    showRightMask = scrollLeft < 0
  } else {
    showLeftMask = scrollLeft > 0
    showRightMask = scrollLeft + container.offsetWidth < container.scrollWidth
  }

  if (immediate) {
    leftMaskOpacity.value = showLeftMask ? 1 : 0
    rightMaskOpacity.value = showRightMask ? 1 : 0
  } else {
    // Add transition effect
    leftMaskOpacity.value = showLeftMask ? 1 : 0
    rightMaskOpacity.value = showRightMask ? 1 : 0
  }
}, 100)

function handleKeyDown(e: KeyboardEvent) {
  const keys = Object.keys(keyToIndexRecord.value)
  const currentIndex = keyToIndexRecord.value[activeKey.value as string]
  const isNext = isRTL.value ? e.key === 'ArrowLeft' : e.key === 'ArrowRight'
  const isPrev = isRTL.value ? e.key === 'ArrowRight' : e.key === 'ArrowLeft'
  const offsetDirection = isNext ? 1 : -1

  const findNextEnabledTab = (startIndex: number, direction: 1 | -1) => {
    const length = keys.length
    for (let i = 0; i < length; i++) {
      const index = (startIndex + direction * (i + 1) + length) % length
      const key = keys[index]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pane = panes.value.find((p: any) => p.key === key)
      if (!pane?.disabled) return key
    }
    return keys[startIndex]
  }

  const currentKey = findNextEnabledTab(currentIndex, offsetDirection)
  if (isNext || isPrev) {
    e.preventDefault()
    activeKey.value = currentKey
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleTabClick(pane: any) {
  if (pane.disabled) return
  if (pane.key === undefined || pane.key === null) return
  activeKey.value = pane.key
}

// Initialize
onMounted(async () => {
  if (!activeKey.value && firstActiveKey.value) {
    if (props.defaultActiveKey) {
      activeKey.value = props.defaultActiveKey
    } else {
      activeKey.value = firstActiveKey.value
    }
  }

  await nextTick()
  animate(true)
  updateMask(true)
  initialized.value = true
})

// Watchers
watch(activeKey, async () => {
  if (initialized.value) {
    await nextTick()
    animate()
  }

  // Focus management
  if (activeKey.value && tabRefs.value[activeKey.value]) {
    tabRefs.value[activeKey.value]?.focus()
  }
})

watch([() => isRTL.value, () => props.activeLineMode], async () => {
  if (initialized.value) {
    await nextTick()
    animate()
  }
})

// ResizeObserver for responsive updates
onMounted(() => {
  if (typeof ResizeObserver !== 'undefined' && tabListContainerRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      if (initialized.value) {
        animate(true)
      }
    })
    resizeObserver.observe(tabListContainerRef.value)

    // Mutation observer for content changes
    const mutationObserver = new MutationObserver(() => {
      if (initialized.value) {
        animate(true, true)
      }
    })

    mutationObserver.observe(tabListContainerRef.value, {
      subtree: true,
      childList: true,
      characterData: true,
    })
  }
})
</script>
