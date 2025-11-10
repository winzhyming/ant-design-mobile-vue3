<template>
  <slot />
</template>

<script setup lang="ts">
defineOptions({
  name: 'FormHeader',
})

interface HeaderProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any
}

defineProps<HeaderProps>()
</script>
