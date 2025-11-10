<template>
  <div class="adm-cascader-view" :style="props.style || {}">
    <Tabs
      :activeKey="tabActiveIndex"
      @change="onTabsChange"
      :stretch="false"
      class="adm-cascader-view-tabs"
    >
      <Tab v-for="(level, index) in levels" :key="`${index}`">
        <template #title>
          <div class="adm-cascader-view-header-title">
            <template v-if="level.selected">
              {{ level.selected[labelName] }}
            </template>
            <template v-else>
              {{ typeof placeholder === 'function' ? placeholder(index) : placeholder }}
            </template>
          </div>
        </template>
        <div class="adm-cascader-view-content">
          <div v-if="whetherLoading(level.options)" class="adm-cascader-view-skeleton">
            <Skeleton class="adm-cascader-view-skeleton-line-1" animated />
            <Skeleton class="adm-cascader-view-skeleton-line-2" animated />
            <Skeleton class="adm-cascader-view-skeleton-line-3" animated />
            <Skeleton class="adm-cascader-view-skeleton-line-4" animated />
          </div>
          <div v-else>
            <CheckList
              :value="[value[index]]"
              @update:value="(select) => onItemSelect(select[0], index)"
              :activeIcon="activeIcon"
            >
              <template
                v-for="(option, _index) in level.options"
                :key="option[valueName] || _index"
              >
                <CheckListItem
                  :value="(option[valueName] as CheckListValue) || _index"
                  :disabled="(option[disabledName] as boolean) || false"
                  :className="[
                    'adm-cascader-view-item',
                    {
                      'adm-cascader-view-item-active': value[index] === option[valueName],
                    },
                  ]"
                >
                  {{ option[labelName] }}
                </CheckListItem>
              </template>
            </CheckList>
          </div>
        </div>
      </Tab>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import type { Component, CSSProperties } from 'vue'
import { computed, ref, watch } from 'vue'
import { CheckList, CheckListItem, type CheckListValue } from '../check-list/index'
import { useConfig } from '../config-provider/useConfig'
import Skeleton from '../skeleton/skeleton.vue'
import { Tabs, Tab } from '../tabs/index'
import { optionSkeleton } from './option-skeleton'
import type { CascaderOption, CascaderValue } from './types'
import { useCascaderValueExtend } from './use-cascader-value-extend'
import { useFieldNames } from './use-field-names'

export interface CascaderViewProps {
  options: CascaderOption[]
  value?: CascaderValue[]
  defaultValue?: CascaderValue[]
  onChange?: (
    value: CascaderValue[],
    extend: { items: (CascaderOption | null)[]; isLeaf: boolean },
  ) => void
  placeholder?: string | ((index: number) => string)
  onTabsChange?: (index: number | string) => void
  activeIcon?: Component
  loading?: boolean
  fieldNames?: Record<string, string>
  style?: CSSProperties
}

const props = withDefaults(defineProps<CascaderViewProps>(), {
  defaultValue: () => [],
  value: undefined,
  placeholder: undefined,
})

const emit = defineEmits<{
  'update:value': [CascaderValue[]]
  change: [CascaderValue[], { items: (CascaderOption | null)[]; isLeaf: boolean }]
  select: [CascaderValue[], { items: (CascaderOption | null)[]; isLeaf: boolean }]
  display: [CascaderValue[], { items: (CascaderOption | null)[]; isLeaf: boolean }]
}>()

const { locale } = useConfig()

const [labelName, valueName, childrenName, disabledName] = useFieldNames(props.fieldNames)

const generateValueExtend = useCascaderValueExtend(props.options, {
  valueName,
  childrenName,
})

// controlled / uncontrolled
const innerValue = ref<CascaderValue[]>([...props.defaultValue])
const isControlled = computed(() => props.value !== undefined)
const value = computed<CascaderValue[]>({
  get() {
    return isControlled.value ? (props.value as CascaderValue[]) : innerValue.value
  },
  set(v: CascaderValue[]) {
    if (!isControlled.value) innerValue.value = [...v]
    emit('update:value', v)
    emit('change', v, generateValueExtend(v, props.options))
    emit('select', v, generateValueExtend(v, props.options))
  },
})

const tabActiveIndex = ref(props.value?.length ? `${props.value.length - 1}` : '0')

const levels = computed(() => {
  const ret: {
    selected: CascaderOption | undefined
    options: CascaderOption[]
  }[] = []
  let currentOptions = props.options ?? []
  let reachedEnd = false
  for (const v of value.value) {
    const target = currentOptions.find((option) => option[valueName] === v)
    ret.push({ selected: target, options: currentOptions })
    if (!target || !target[childrenName]) {
      reachedEnd = true
      break
    }
    currentOptions = target[childrenName] as CascaderOption[]
  }
  if (!reachedEnd) {
    ret.push({ selected: undefined, options: currentOptions })
  }
  return ret
})

watch(
  levels,
  (newVal) => {
    tabActiveIndex.value = `${newVal.length - 1}`
  },
  {
    deep: true,
  },
)

watch(
  () => tabActiveIndex.value,
  (v) => {
    props.onTabsChange?.(v)
  },
)

function onItemSelect(selectValue: CascaderValue | undefined, depth: number) {
  const next = value.value.slice(0, depth)
  if (selectValue !== undefined) next[depth] = selectValue
  value.value = next
}

function whetherLoading(options: CascaderOption[]) {
  return props.loading || options === optionSkeleton
}

const placeholder = computed(() => props.placeholder ?? locale.Cascader.placeholder)

// eslint-disable-next-line vue/no-dupe-keys
function onTabsChange(key: string | number) {
  tabActiveIndex.value = `${key}`
}

defineExpose({
  getDisplayItems: () => {
    generateValueExtend(value.value, props.options)
  },
})
</script>
