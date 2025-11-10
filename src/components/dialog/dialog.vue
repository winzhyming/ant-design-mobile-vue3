<template>
  <CenterPopup
    :className="popupClasses.join(' ')"
    :style="nativeStyle"
    :after-close="afterClose"
    :after-show="afterShow"
    :visible="visible"
    :get-container="getContainer"
    :body-style="bodyStyle"
    :body-class="bodyClasses"
    :mask-style="maskStyle"
    :mask-class="maskClassName"
    :stop-propagation="stopPropagation"
    :disable-body-scroll="disableBodyScroll"
    :destroy-on-close="destroyOnClose"
    :force-render="forceRender"
    role="dialog"
    :aria-label="ariaLabel"
    @mask-click="handleMaskClick"
  >
    <!-- Image -->
    <div v-if="image" :class="cls('image-container')">
      <Image :src="image" alt="dialog header image" width="100%" />
    </div>

    <!-- Header -->
    <div v-if="$slots.header || header" :class="cls('header')">
      <AutoCenter>
        <slot name="header" v-if="$slots.header" />
        <template v-else>{{ header }}</template>
      </AutoCenter>
    </div>

    <!-- Title -->
    <div v-if="$slots.title || title" :class="cls('title')">
      <slot name="title" v-if="$slots.title" />
      <template v-else>{{ title }}</template>
    </div>

    <!-- Content -->
    <div :class="contentClasses">
      <slot v-if="$slots.default" />
      <template v-else-if="typeof content === 'string'">
        <AutoCenter>{{ content }}</AutoCenter>
      </template>
      <template v-else>
        {{ content }}
      </template>
    </div>

    <!-- Footer -->
    <slot name="footer">
      <div :class="cls('footer')">
        <div
          v-for="(row, rowIndex) in normalizedActions"
          :key="rowIndex"
          :class="cls('action-row')"
        >
          <DialogActionButton
            v-for="(action, actionIndex) in row"
            :key="action.key"
            :action="action"
            :loading="loadingStates[action.key || actionIndex] || false"
            @action="handleActionClick(action, actionIndex)"
          />
        </div>
      </div>
    </slot>
  </CenterPopup>
</template>

<script setup lang="ts">
import { computed, reactive, useSlots, type CSSProperties, type VNode } from 'vue'
import AutoCenter from '../auto-center/index.vue'
import type { CenterPopupProps } from '../center-popup/center-popup.vue'
import CenterPopup from '../center-popup/center-popup.vue'
import type { Action } from './dialog-action-button.vue'
import DialogActionButton from './dialog-action-button.vue'
import Image from '../image/index.vue'

// Types
export interface DialogProps
  extends Pick<
    CenterPopupProps,
    | 'afterClose'
    | 'afterShow'
    | 'bodyClassName'
    | 'bodyStyle'
    | 'destroyOnClose'
    | 'disableBodyScroll'
    | 'forceRender'
    | 'getContainer'
    | 'maskClassName'
    | 'maskStyle'
    | 'stopPropagation'
    | 'visible'
  > {
  image?: string
  header?: string | VNode
  title?: string | VNode
  content?: string | VNode
  actions?: (Action | Action[])[]
  closeOnAction?: boolean
  closeOnMaskClick?: boolean
  onAction?: (action: Action, index: number) => void | Promise<void>
  onClose?: () => void
  // Native props
  className?: string
  style?: CSSProperties
  ariaLabel?: string
}

export interface DialogEmits {
  (e: 'action', action: Action, index: number): void | Promise<void>
  (e: 'close'): void
  (e: 'update:visible', value: boolean): void
}

// Props with defaults
const props = withDefaults(defineProps<DialogProps>(), {
  actions: () => [],
  closeOnAction: false,
  closeOnMaskClick: false,
  getContainer: null,
})

// Emits
const emit = defineEmits<DialogEmits>()

// Track loading state for each action
const loadingStates = reactive<Record<string, boolean>>({})

// Computed
const popupClasses = computed(() => {
  const classes = [cls()]
  if (props.className) {
    classes.push(props.className)
  }
  return classes
})

const nativeStyle = computed(() => {
  return props.style || {}
})

const bodyClasses = computed(() => {
  const classes = [cls('body')]
  if (props.image) {
    classes.push(cls('with-image'))
  }
  if (props.bodyClassName) {
    classes.push(props.bodyClassName)
  }
  return classes
})

const contentClasses = computed(() => {
  const classes = [cls('content')]
  if (!props.content && !slots.default) {
    classes.push(cls('content-empty'))
  }
  return classes
})

const normalizedActions = computed(() => {
  return props.actions.map((row) => (Array.isArray(row) ? row : [row]))
})

// Methods
const handleMaskClick = () => {
  if (props.closeOnMaskClick) {
    emit('close')
  }
}

const handleActionClick = async (action: Action, index: number) => {
  if (!action.onClick) {
    emit('action', action, index)
    if (props.closeOnAction) {
      emit('close')
    }
    return
  }

  // Set loading state
  const loadingKey = `${action.key || index}`
  loadingStates[loadingKey] = true

  try {
    await Promise.all([action.onClick?.(), emit('action', action, index)])
    if (props.closeOnAction) {
      emit('close')
    }
  } finally {
    // Clear loading state
    loadingStates[loadingKey] = false
  }
}

// Utils
function cls(name: string = '') {
  return 'adm-dialog' + (name ? '-' + name : '')
}

// Slots
const slots = useSlots()
</script>
