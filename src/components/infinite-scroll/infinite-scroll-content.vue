<template>
  <span v-if="!hasMore">
    {{ locale.InfiniteScroll.noMore }}
  </span>

  <span v-else-if="failed">
    <span :class="`${classPrefix}-failed-text`">
      {{ locale.InfiniteScroll.failedToLoad }}
    </span>
    <a @click="retry">
      {{ locale.InfiniteScroll.retry }}
    </a>
  </span>

  <template v-else>
    <span>{{ locale.common.loading }}</span>
    <DotLoading />
  </template>
</template>

<script setup lang="ts">
import { useConfig } from '../config-provider/useConfig'
import DotLoading from '../dot-loading/index.vue'

const classPrefix = 'adm-infinite-scroll'

interface Props {
  hasMore: boolean
  failed: boolean
  retry: () => void
}

defineProps<Props>()

const { locale } = useConfig()
</script>

<style lang="less" scoped>
@import './infinite-scroll.less';
</style>
