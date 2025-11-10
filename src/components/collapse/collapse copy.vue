<template>
  <div class="adm-collapse">
    <List>
      <template v-for="panel in panels" :key="panel.key">
        <ListItem
          class="adm-collapse-panel-header"
          @click="handleClick(panel.key, panel.onClick)"
          :disabled="panel.disabled"
          :arrowIcon="getArrowIcon(panel, isActive(panel.key))"
        >
          {{ panel.title }}
        </ListItem>
        <div
          class="adm-collapse-panel-content"
          :class="{ 'adm-collapse-panel-content-active': isActive(panel.key) }"
          :style="getPanelStyle(panel.key)"
        >
          <div
            class="adm-collapse-panel-content-inner"
            :ref="(el) => setPanelRef(panel.key, el as HTMLElement)"
          >
            <ListItem v-if="shouldRender(panel)">
              <component :is="panel.content" />
            </ListItem>
          </div>
        </div>
      </template>
    </List>
  </div>
</template>

<script setup lang="ts">
import { DownOutline } from 'ant-mobile-icons-vue3'
import classNames from 'classnames'
import { computed, h, nextTick, ref, useSlots, watch, type Component, type VNode } from 'vue'
import { useConfig } from '../config-provider/useConfig'
import List from '../list/list.vue'
import ListItem from '../list/item.vue'

// 定义箭头图标类型
type ArrowIcon = VNode | Component | ((active: boolean) => Component)

// 面板数据类型
interface PanelData {
  key: string
  title: string
  content: VNode
  disabled?: boolean
  forceRender?: boolean
  destroyOnClose?: boolean
  onClick?: (event: MouseEvent) => void
  arrowIcon?: ArrowIcon
  arrow?: ArrowIcon // deprecated
}

interface CollapseProps {
  accordion?: boolean
  activeKey?: string | string[] | null
  defaultActiveKey?: string | string[] | null
  arrowIcon?: ArrowIcon
  arrow?: ArrowIcon // deprecated
}

interface CollapseEmits {
  (e: 'update:activeKey', value: string | string[] | null): void
  (e: 'change', value: string | string[] | null): void
}

const props = withDefaults(defineProps<CollapseProps>(), {
  accordion: false,
  defaultActiveKey: () => [],
})

const emit = defineEmits<CollapseEmits>()

const { collapse: componentConfig = {} } = useConfig()
const slots = useSlots()

// 面板引用
const panelRefs = ref<Record<string, HTMLElement>>({})
const panelHeights = ref<Record<string, number>>({})

// 内部状态值
const innerValue = ref<string[]>(
  props.accordion
    ? props.defaultActiveKey
      ? [props.defaultActiveKey as string]
      : []
    : Array.isArray(props.defaultActiveKey)
      ? props.defaultActiveKey
      : props.defaultActiveKey
        ? [props.defaultActiveKey]
        : [],
)

// 是否受控
const isControlled = computed(() => props.activeKey !== undefined)

// 当前激活的 key 列表
const currentActiveKey = computed(() => {
  if (isControlled.value) {
    if (props.accordion) {
      return props.activeKey ? [props.activeKey as string] : []
    } else {
      return Array.isArray(props.activeKey)
        ? props.activeKey
        : props.activeKey
          ? [props.activeKey]
          : []
    }
  }
  return innerValue.value
})

// 设置激活状态
const setActiveKey = (newValue: string[]) => {
  if (!isControlled.value) {
    innerValue.value = newValue
  }

  const emitValue = props.accordion ? newValue[0] || null : newValue
  emit('update:activeKey', emitValue)
  emit('change', emitValue)
}

// 解析面板数据
const panels = computed((): PanelData[] => {
  const result: PanelData[] = []
  const defaultSlot = slots.default?.()

  if (!defaultSlot) return result

  defaultSlot.forEach((vnode, index) => {
    const panelProps = vnode.props || {}
    const key = (panelProps.key as string) || `panel-${index}`

    result.push({
      key,
      title: panelProps.title || '',
      content: vnode,
      disabled: panelProps.disabled,
      forceRender: panelProps.forceRender,
      destroyOnClose: panelProps.destroyOnClose,
      onClick: panelProps.onClick,
      arrowIcon: panelProps.arrowIcon,
      arrow: panelProps.arrow,
    })
  })

  return result
})

// 检查面板是否激活
const isActive = (key: string): boolean => {
  return currentActiveKey.value.includes(key)
}

// 处理点击事件
const handleClick = (key: string, onClick?: (event: MouseEvent) => void) => {
  if (props.accordion) {
    if (isActive(key)) {
      setActiveKey([])
    } else {
      setActiveKey([key])
    }
  } else {
    if (isActive(key)) {
      setActiveKey(currentActiveKey.value.filter((v) => v !== key))
    } else {
      setActiveKey([...currentActiveKey.value, key])
    }
  }

  // 执行传入的 onClick 回调
  if (onClick) {
    // 这里需要创建一个模拟的 MouseEvent，或者重新设计 API
    const mockEvent = new MouseEvent('click')
    onClick(mockEvent)
  }
}

// 获取箭头图标
const getArrowIcon = (panel: PanelData, active: boolean) => {
  const arrow =
    panel.arrowIcon ||
    panel.arrow ||
    props.arrowIcon ||
    props.arrow ||
    componentConfig.arrowIcon ||
    DownOutline
  if (typeof arrow === 'function') {
    return (arrow as (active: boolean) => Component)(active)
  }
  return h(
    'div',
    {
      class: classNames('adm-collapse-arrow', {
        'adm-collapse-arrow-active': active,
      }),
      style: {
        transition: 'transform 0.3s ease',
        transform: active ? 'rotate(180deg)' : 'rotate(0deg)',
      },
    },
    [h(arrow as Component)],
  )
}

// 设置面板引用
const setPanelRef = (key: string, el: HTMLElement | null) => {
  if (el) {
    panelRefs.value[key] = el
  }
}

// 获取面板样式
const getPanelStyle = (key: string) => {
  const height = panelHeights.value[key] || 0
  const active = isActive(key)

  return {
    height: active ? `${height}px` : '0px',
    transition: 'height 0.3s ease',
    overflow: 'hidden',
  }
}

// 判断是否应该渲染
const shouldRender = (panel: PanelData): boolean => {
  const active = isActive(panel.key)
  if (panel.forceRender) return true
  if (panel.destroyOnClose) return active
  return active || panelHeights.value[panel.key] > 0
}

// 更新面板高度
const updatePanelHeight = async (key: string) => {
  await nextTick()
  const el = panelRefs.value[key]
  if (el) {
    panelHeights.value[key] = el.scrollHeight
  }
}

// 监听激活状态变化
watch(
  currentActiveKey,
  async (newKeys, oldKeys) => {
    const allKeys = [...new Set([...newKeys, ...(oldKeys || [])])]
    for (const key of allKeys) {
      await updatePanelHeight(key)
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.adm-collapse-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.adm-collapse-panel-content {
  overflow: hidden;
}
.adm-collapse-panel-content-inner {
  padding: 0;
}
.adm-collapse-panel-header {
  cursor: pointer;
}
.adm-collapse-panel-header:hover {
  background-color: var(--adm-color-background);
}
</style>
