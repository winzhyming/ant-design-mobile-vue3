import { ref, computed, nextTick, onMounted, watch, type Ref, type VNode, h } from 'vue'
import runes2 from 'runes2'

const ELLIPSIS_TEXT = '...'

export const measureStyle: Record<string, string> = {
  visibility: 'hidden',
  whiteSpace: 'inherit',
  lineHeight: 'inherit',
  fontSize: 'inherit',
}

type MeasureStatus = 'PREPARE' | 'MEASURE_WALKING' | 'STABLE_ELLIPSIS' | 'STABLE_NO_ELLIPSIS'

export const useMeasure = (
  content: string,
  rows: number,
  direction: 'start' | 'end' | 'middle',
  expanded: Ref<boolean>,
  expandNode: VNode | null,
  collapseNode: VNode | null,
  fullMeasureRef: Ref<HTMLElement | undefined>,
  singleRowMeasureRef: Ref<HTMLElement | undefined>,
  midMeasureRef: Ref<HTMLElement | undefined>,
  runes: typeof runes2 = runes2,
) => {
  const contentChars = computed(() => runes(content))
  const maxHeight = ref(0)
  const walkingIndexes = ref<[number, number]>([0, 0])
  const status = ref<MeasureStatus>('STABLE_NO_ELLIPSIS')

  function startMeasure() {
    status.value = 'PREPARE'
    walkingIndexes.value = [
      0,
      direction === 'middle' ? Math.ceil(contentChars.value.length / 2) : contentChars.value.length,
    ]
  }

  onMounted(() => {
    startMeasure()
  })

  watch([contentChars, () => rows], () => {
    startMeasure()
  })

  const midIndex = computed(() =>
    Math.ceil((walkingIndexes.value[0] + walkingIndexes.value[1]) / 2),
  )

  watch([status, walkingIndexes], () => {
    nextTick(() => {
      if (status.value === 'PREPARE') {
        const fullMeasureHeight = fullMeasureRef.value?.offsetHeight || 0
        const singleRowMeasureHeight = singleRowMeasureRef.value?.offsetHeight || 0
        const rowMeasureHeight = singleRowMeasureHeight * (rows + 0.5)
        if (fullMeasureHeight <= rowMeasureHeight) {
          status.value = 'STABLE_NO_ELLIPSIS'
        } else {
          maxHeight.value = rowMeasureHeight
          status.value = 'MEASURE_WALKING'
        }
      }
      if (status.value === 'MEASURE_WALKING') {
        // 修复：midMeasureRef 还未挂载时，等待下一轮
        if (!midMeasureRef.value) return
        const diff = walkingIndexes.value[1] - walkingIndexes.value[0]
        const midHeight = midMeasureRef.value?.offsetHeight || 0
        const mid = midIndex.value
        if (diff > 1) {
          if (midHeight > maxHeight.value) {
            walkingIndexes.value = [walkingIndexes.value[0], mid]
          } else {
            walkingIndexes.value = [mid, walkingIndexes.value[1]]
          }
        } else {
          if (midHeight > maxHeight.value) {
            walkingIndexes.value = [walkingIndexes.value[0], walkingIndexes.value[0]]
          } else {
            walkingIndexes.value = [walkingIndexes.value[1], walkingIndexes.value[1]]
          }
          status.value = 'STABLE_ELLIPSIS'
        }
      }
    })
  })

  function renderContent(index: number): VNode[] {
    const prefixContent = contentChars.value.slice(0, index)
    const suffixContent = contentChars.value.slice(contentChars.value.length - index)
    const nodes: VNode[] = []
    if (direction === 'start') {
      if (expandNode) nodes.push(expandNode)
      nodes.push(h('span', ELLIPSIS_TEXT))
      nodes.push(h('span', prefixContent.join('')))
    } else if (direction === 'middle') {
      nodes.push(h('span', prefixContent.join('')))
      nodes.push(h('span', ELLIPSIS_TEXT))
      if (expandNode) nodes.push(expandNode)
      nodes.push(h('span', ELLIPSIS_TEXT))
      nodes.push(h('span', suffixContent.join('')))
    } else if (direction === 'end') {
      nodes.push(h('span', prefixContent.join('')))
      nodes.push(h('span', ELLIPSIS_TEXT))
      if (expandNode) nodes.push(expandNode)
    }
    return nodes
  }

  const finalContent = computed(() => {
    if (expanded.value || status.value === 'STABLE_NO_ELLIPSIS') {
      const nodes: VNode[] = [h('span', content)]
      if (status.value === 'STABLE_ELLIPSIS' && collapseNode) nodes.push(collapseNode)
      return nodes
    }
    if (status.value === 'STABLE_ELLIPSIS') {
      return renderContent(midIndex.value)
    }
    return []
  })

  // 不再有 allNodes 和 updateNodes

  return [finalContent, startMeasure, status, midIndex, renderContent] as const
}
