import { onMounted, type Ref } from 'vue'

interface InputHandleKeyDownType {
  onEnterPress?: (e: KeyboardEvent) => void
  onKeyDown?: (e: KeyboardEvent) => void
  enterKeyHint?: string
  nativeInputRef: Ref<HTMLInputElement | HTMLTextAreaElement>
}

export function useInputHandleKeyDown({
  onEnterPress,
  onKeyDown,
  nativeInputRef,
  enterKeyHint,
}: InputHandleKeyDownType) {
  const handleKeydown = (e: KeyboardEvent) => {
    if (onEnterPress && (e.code === 'Enter' || e.keyCode === 13)) {
      onEnterPress(e)
    }
    onKeyDown?.(e)
  }

  onMounted(() => {
    const ele = nativeInputRef.value

    if (!enterKeyHint || !ele) return

    ele.setAttribute('enterkeyhint', enterKeyHint)
  })

  return handleKeydown
}
