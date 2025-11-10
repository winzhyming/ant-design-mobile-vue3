<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Chart, type Chart as ChartType } from '@antv/g2'
import type { ChartProps } from './type'
const props = withDefaults(defineProps<ChartProps>(), {
  autoFit: true,
  height: '100%',
  clip: true,
  options: () => ({}),
})

const chart = ref<ChartType | null>(null)
const chartRef = ref<HTMLDivElement | null>(null)

const renderChart = (container: HTMLDivElement): ChartType => {
  const chartInstance = new Chart({
    ...(props.options || {}),
    container,
  })

  // 准备数据
  const data = [
    { genre: 'Sports', sold: 275 },
    { genre: 'Strategy', sold: 115 },
    { genre: 'Action', sold: 120 },
    { genre: 'Shooter', sold: 350 },
    { genre: 'Other', sold: 150 },
  ]

  // 声明可视化
  chartInstance
    .interval()
    .data(data)
    .encode('x', 'genre')
    .encode('y', 'sold')
    .encode('key', 'genre')
    .animate('update', { duration: 300 })

  // 渲染可视化
  chartInstance.render()

  return chartInstance
}
onMounted(() => {
  chart.value = renderChart(chartRef.value as HTMLDivElement)
})
</script>

<template>
  <div ref="chartRef"></div>
</template>
