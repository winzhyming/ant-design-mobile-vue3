<template>
  <div :class="waterMarkClass" :style="waterMarkStyle" />
</template>

<script lang="ts">
// 字体样式类型
type FontStyle = 'none' | 'normal' | 'italic' | 'oblique'

// 字体粗细类型
type FontWeight = 'normal' | 'light' | 'weight' | number

// WaterMark 组件 Props
export interface WaterMarkProps {
  gapX?: number
  gapY?: number
  zIndex?: number
  width?: number
  height?: number
  rotate?: number
  image?: string
  imageWidth?: number
  imageHeight?: number
  content?: string | string[]
  fontColor?: string
  fontStyle?: FontStyle
  fontFamily?: string
  fontWeight?: FontWeight
  fontSize?: number | string
  fullPage?: boolean
  // CSS Variables
  '--z-index'?: string
}
</script>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'

const classPrefix = 'adm-water-mark'

const props = withDefaults(defineProps<WaterMarkProps>(), {
  fullPage: true,
  gapX: 24,
  gapY: 48,
  width: 120,
  height: 64,
  rotate: -22,
  imageWidth: 120,
  imageHeight: 64,
  fontStyle: 'normal',
  fontWeight: 'normal',
  fontColor: 'rgba(0,0,0,.15)',
  fontSize: 14,
  fontFamily: 'sans-serif',
})

const base64Url = ref('')

const waterMarkClass = computed(() => [
  classPrefix,
  {
    [`${classPrefix}-full-page`]: props.fullPage,
  },
])

const waterMarkStyle = computed(() => {
  const style: Record<string, string | number | undefined> = {
    zIndex: props.zIndex,
    backgroundSize: `${props.gapX + props.width}px`,
    backgroundImage: base64Url.value === '' ? undefined : `url('${base64Url.value}')`,
  }

  // 添加用户自定义的 CSS 变量
  if (props['--z-index']) {
    style['--z-index'] = props['--z-index']
  }

  return style
})

const generateWaterMark = async () => {
  const canvas = document.createElement('canvas')
  const ratio = window.devicePixelRatio
  const ctx = canvas.getContext('2d')

  const canvasWidth = (props.gapX + props.width) * ratio
  const canvasHeight = (props.gapY + props.height) * ratio

  const markWidth = props.width * ratio
  const markHeight = props.height * ratio

  canvas.setAttribute('width', canvasWidth.toString())
  canvas.setAttribute('height', canvasHeight.toString())

  if (!ctx) {
    throw new Error('Canvas is not supported in the current environment')
  }

  ctx.save()

  if (props.image) {
    // 绘制图片水印
    ctx.translate(markWidth / 2, markHeight / 2)
    ctx.rotate((Math.PI / 180) * Number(props.rotate))

    try {
      const img = await loadImage(props.image)
      ctx.drawImage(
        img,
        (-props.imageWidth * ratio) / 2,
        (-props.imageHeight * ratio) / 2,
        props.imageWidth * ratio,
        props.imageHeight * ratio,
      )
      ctx.restore()
      base64Url.value = canvas.toDataURL()
    } catch (error) {
      console.error('Failed to load watermark image:', error)
      base64Url.value = ''
    }
  } else if (props.content) {
    // 绘制文字水印
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.translate(markWidth / 2, markHeight / 2)
    ctx.rotate((Math.PI / 180) * Number(props.rotate))

    const markSize = Number(props.fontSize) * ratio
    ctx.font = `${props.fontStyle} normal ${props.fontWeight} ${markSize}px/${markHeight}px ${props.fontFamily}`
    ctx.fillStyle = props.fontColor

    if (Array.isArray(props.content)) {
      props.content.forEach((item: string, index: number) => {
        ctx.fillText(item, 0, index * markSize)
      })
    } else {
      ctx.fillText(props.content, 0, 0)
    }

    ctx.restore()
    base64Url.value = canvas.toDataURL()
  }
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// 监听所有影响水印生成的属性
watch(
  [
    () => props.gapX,
    () => props.gapY,
    () => props.rotate,
    () => props.fontStyle,
    () => props.fontWeight,
    () => props.width,
    () => props.height,
    () => props.fontFamily,
    () => props.fontColor,
    () => props.image,
    () => props.content,
    () => props.fontSize,
    () => props.imageWidth,
    () => props.imageHeight,
  ],
  () => {
    nextTick(() => {
      generateWaterMark()
    })
  },
  { immediate: true },
)

onMounted(() => {
  generateWaterMark()
})
</script>

<style lang="less" scoped>
@import './water-mark.less';
</style>
