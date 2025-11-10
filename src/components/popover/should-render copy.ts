import { ref, watch, type Ref } from 'vue'

export function useInitialized(checkFn: Ref<boolean>) {
  const initializedRef = ref(false)

  // 监听变化，immediate: true 会立即执行一次
  watch(
    () => checkFn.value,
    (newValue) => {
      if (newValue) {
        initializedRef.value = true
      }
    },
    { immediate: true },
  )

  return initializedRef
}

export function useShouldRender(
  active: Ref<boolean>,
  forceRender?: boolean,
  destroyOnClose?: boolean,
) {
  const initialized = useInitialized(active)

  if (forceRender) return true
  if (active.value) return true
  if (!initialized.value) return false
  return !destroyOnClose
}
