<template>
  <div :class="rootClass" :style="nativeStyle">
    <div :class="`${classPrefix}-track-container`" @click="onTrackClick">
      <div :class="`${classPrefix}-track`" ref="trackRef">
        <div
          :class="`${classPrefix}-fill`"
          :style="{
            width: fillSize,
            left: fillStart,
          }"
        />
        <Ticks
          v-if="mergedProps.ticks"
          :points="pointList"
          :min="mergedProps.min"
          :max="mergedProps.max"
          :lower-bound="sliderValue[0]"
          :upper-bound="sliderValue[1]"
        />
        <Thumb
          v-if="mergedProps.range"
          :key="0"
          :value="sliderValue[0]"
          :min="mergedProps.min"
          :max="mergedProps.max"
          :disabled="mergedProps.disabled"
          :track-ref="trackRef"
          :icon="mergedProps.icon"
          :popover="mergedProps.popover"
          :resident-popover="mergedProps.residentPopover"
          @drag="(position, first, last) => onThumbDrag(0, position, first, last)"
        />
        <Thumb
          :key="1"
          :value="sliderValue[1]"
          :min="mergedProps.min"
          :max="mergedProps.max"
          :disabled="mergedProps.disabled"
          :track-ref="trackRef"
          :icon="mergedProps.icon"
          :popover="mergedProps.popover"
          :resident-popover="mergedProps.residentPopover"
          @drag="(position, first, last) => onThumbDrag(1, position, first, last)"
        />
      </div>
    </div>
    <Marks
      v-if="mergedProps.marks"
      :min="mergedProps.min"
      :max="mergedProps.max"
      :marks="mergedProps.marks"
      :lower-bound="sliderValue[0]"
      :upper-bound="sliderValue[1]"
    />
  </div>
</template>

<script setup lang="ts">
import getMiniDecimal, { toFixed } from '@rc-component/mini-decimal'
import classNames from 'classnames'
import { computed, ref } from 'vue'
import Marks from './marks.vue'
import Thumb from './thumb.vue'
import Ticks from './ticks.vue'
import type { SliderProps, SliderValue } from './types'
import { mergeProps } from '../../utils/with-default-props'
import { nearest } from '../../utils/nearest'
import { devWarning } from '../../utils/dev-log'

const classPrefix = 'adm-slider'

const defaultProps = {
  min: 0,
  max: 100,
  step: 1,
  ticks: false,
  range: false,
  disabled: false,
  popover: false,
  residentPopover: false,
}

const props = defineProps<SliderProps>()
const emit = defineEmits<{
  'update:value': [value: SliderValue]
  change: [value: SliderValue]
  afterChange: [value: SliderValue]
}>()

const mergedProps = computed(() => mergeProps(defaultProps, props))

// 状态管理 - 模拟 usePropsValue
const isControlled = computed(() => props.value !== undefined)
const innerValue = ref<SliderValue>(
  props.defaultValue ??
    (mergedProps.value.range
      ? [mergedProps.value.min, mergedProps.value.min]
      : mergedProps.value.min),
)

// 验证 range 模式下的 value 类型
let propsValue: SliderValue | undefined = props.value
if (mergedProps.value.range && typeof props.value === 'number') {
  devWarning(
    'Slider',
    'When `range` prop is enabled, the `value` prop should be an array, like: [0, 0]',
  )
  propsValue = [0, props.value]
}

const rawValue = computed({
  get: () => (isControlled.value ? (propsValue ?? props.value!) : innerValue.value),
  set: (val: SliderValue) => {
    if (!isControlled.value) innerValue.value = val
    emit('update:value', val)
    emit('change', val)
    props.onChange?.(val)
  },
})

// 值处理函数
function sortValue(val: [number, number]): [number, number] {
  return val.sort((a, b) => a - b)
}

function convertValue(value: SliderValue): [number, number] {
  return (mergedProps.value.range ? value : [mergedProps.value.min, value]) as [number, number]
}

function alignValue(value: number, decimalLen: number) {
  const decimal = getMiniDecimal(value)
  const fixedStr = toFixed(decimal.toString(), '.', decimalLen)
  return getMiniDecimal(fixedStr).toNumber()
}

function getDecimalLen(n: number) {
  return (`${n}`.split('.')[1] || '').length
}

function reverseValue(value: [number, number]): SliderValue {
  const mergedDecimalLen = Math.max(
    getDecimalLen(mergedProps.value.step),
    getDecimalLen(value[0]),
    getDecimalLen(value[1]),
  )
  return mergedProps.value.range
    ? (value.map((v) => alignValue(v, mergedDecimalLen)) as [number, number])
    : alignValue(value[1], mergedDecimalLen)
}

const sliderValue = computed(() => sortValue(convertValue(rawValue.value)))

function setSliderValue(value: [number, number]) {
  const next = sortValue(value)
  const current = sliderValue.value
  if (next[0] === current[0] && next[1] === current[1]) return
  rawValue.value = reverseValue(next)
}

function onAfterChange(value: [number, number]) {
  const reversedValue = reverseValue(value)
  emit('afterChange', reversedValue)
  props.onAfterChange?.(reversedValue)
}

const trackRef = ref<HTMLDivElement | null>(null)
const dragLockRef = ref(0)
const valueBeforeDragRef = ref<[number, number]>()

// 计算填充样式
const fillSize = computed(
  () =>
    `${(100 * (sliderValue.value[1] - sliderValue.value[0])) / (mergedProps.value.max - mergedProps.value.min)}%`,
)
const fillStart = computed(
  () =>
    `${(100 * (sliderValue.value[0] - mergedProps.value.min)) / (mergedProps.value.max - mergedProps.value.min)}%`,
)

// 计算要显示的点
const pointList = computed(() => {
  if (mergedProps.value.marks) {
    return Object.keys(mergedProps.value.marks)
      .map(parseFloat)
      .sort((a, b) => a - b)
  } else if (mergedProps.value.ticks) {
    const points: number[] = []
    for (
      let i = getMiniDecimal(mergedProps.value.min);
      i.lessEquals(getMiniDecimal(mergedProps.value.max));
      i = i.add(mergedProps.value.step)
    ) {
      points.push(i.toNumber())
    }
    return points
  }
  return []
})

function getValueByPosition(position: number) {
  const newPosition =
    position < mergedProps.value.min
      ? mergedProps.value.min
      : position > mergedProps.value.max
        ? mergedProps.value.max
        : position
  let value = mergedProps.value.min

  // 显示了刻度点，就只能移动到点上
  if (pointList.value.length) {
    value = nearest(pointList.value, newPosition)
  } else {
    // 使用 MiniDecimal 避免精度问题
    const cell = Math.round((newPosition - mergedProps.value.min) / mergedProps.value.step)
    const nextVal = getMiniDecimal(cell).multi(mergedProps.value.step)
    value = getMiniDecimal(mergedProps.value.min).add(nextVal.toString()).toNumber()
  }
  return value
}

const onTrackClick = (event: MouseEvent) => {
  if (dragLockRef.value > 0) return
  event.stopPropagation()
  if (mergedProps.value.disabled) return
  const track = trackRef.value
  if (!track) return
  const sliderOffsetLeft = track.getBoundingClientRect().left
  const position =
    ((event.clientX - sliderOffsetLeft) / Math.ceil(track.offsetWidth)) *
      (mergedProps.value.max - mergedProps.value.min) +
    mergedProps.value.min

  const targetValue = getValueByPosition(position)
  let nextSliderValue: [number, number]
  if (mergedProps.value.range) {
    // 移动的滑块采用就近原则
    if (
      Math.abs(targetValue - sliderValue.value[0]) > Math.abs(targetValue - sliderValue.value[1])
    ) {
      nextSliderValue = [sliderValue.value[0], targetValue]
    } else {
      nextSliderValue = [targetValue, sliderValue.value[1]]
    }
  } else {
    nextSliderValue = [mergedProps.value.min, targetValue]
  }
  setSliderValue(nextSliderValue)
  onAfterChange(nextSliderValue)
}

const onThumbDrag = (index: number, position: number, first: boolean, last: boolean) => {
  if (first) {
    dragLockRef.value += 1
    valueBeforeDragRef.value = sliderValue.value
  }
  const val = getValueByPosition(position)
  const valueBeforeDrag = valueBeforeDragRef.value
  if (!valueBeforeDrag) return
  const next = [...valueBeforeDrag] as [number, number]
  next[index] = val
  setSliderValue(next)
  if (last) {
    onAfterChange(next)
    window.setTimeout(() => {
      dragLockRef.value -= 1
    }, 100)
  }
}

// 计算根元素的类名和样式
const rootClass = computed(() =>
  classNames(
    classPrefix,
    {
      [`${classPrefix}-disabled`]: mergedProps.value.disabled,
    },
    props.class,
  ),
)

const nativeStyle = computed(() => {
  const style: Record<string, string | number> = { ...props.style }
  if (props['--fill-color']) {
    style['--fill-color'] = props['--fill-color']
  }
  return style
})
</script>

<style lang="less">
@import './slider.less';
</style>
