import { ref, watch, type Ref } from 'vue'

export function useShouldRender(
  active: Ref<boolean>,
  forceRender?: boolean,
  destroyOnClose?: boolean,
) {
  const shouldRender = ref(forceRender || active.value || !destroyOnClose)

  // 监听变化，immediate: true 会立即执行一次
  watch(
    () => active.value,
    (newValue) => {
      if (newValue) {
        shouldRender.value = true
      }
    },
    { immediate: true },
  )

  return { shouldRender }
}
